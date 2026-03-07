"""
Compare 27B and 35B configurations at 64K context with harder prompts.
Includes one multimodal 35B run to verify the 64K image-capable path.
"""

import base64
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from server_manager import build_runtime_env

LLAMA_SERVER = ROOT / "llama-bin" / "llama-server.exe"
MODELS_DIR = ROOT / "models" / "unsloth-gguf"
TEMPLATE = ROOT / "config" / "templates" / "qwen3.5-developer-thinking.jinja"
IMAGE_PATH = ROOT / "complex_test.png"

CONFIGS: list[dict[str, Any]] = [
    {
        "name": "27b_q3ks_iq4_64k",
        "port": 8040,
        "model": "Qwen3.5-27B-Q3_K_S.gguf",
        "ctx": 65536,
        "cache_type": "iq4_nl",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": 0,
        "chat_template_file": str(TEMPLATE),
    },
    {
        "name": "27b_iq4xs_iq4_64k",
        "port": 8041,
        "model": "Qwen3.5-27B-IQ4_XS.gguf",
        "ctx": 65536,
        "cache_type": "iq4_nl",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": 0,
        "chat_template_file": str(TEMPLATE),
    },
    {
        "name": "35b_q3ks_iq4_64k",
        "port": 8042,
        "model": "Qwen3.5-35B-A3B-Q3_K_S.gguf",
        "mmproj": "mmproj-35B-F16.gguf",
        "ctx": 65536,
        "cache_type": "iq4_nl",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": 0,
        "chat_template_file": str(TEMPLATE),
    },
]

TEXT_PAYLOADS: dict[str, dict[str, Any]] = {
    "reasoning_hard": {
        "messages": [
            {
                "role": "user",
                "content": (
                    "Three boxes are labeled APPLES, ORANGES, and MIXED. Every label is wrong. "
                    "You may open one box, look at one fruit, and then relabel all boxes correctly. "
                    "Explain the solution briefly."
                ),
            }
        ],
        "max_tokens": 180,
    },
    "coding_hard": {
        "messages": [
            {
                "role": "user",
                "content": (
                    "Write a Python LRUCache class with get and put in O(1) time using only the "
                    "standard library. Include a short usage example."
                ),
            }
        ],
        "max_tokens": 320,
    },
}

VISION_PAYLOAD = {
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Describe this UI screenshot. Mention layout, labels, and any visible panels, "
                        "buttons, or metrics. Keep it concise but specific."
                    ),
                }
            ],
        }
    ],
    "max_tokens": 220,
}


def kill_servers() -> None:
    subprocess.run(
        ["taskkill", "/F", "/IM", "llama-server.exe"],
        capture_output=True,
        check=False,
    )
    time.sleep(3)


def read_vram_used_mib() -> int | None:
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=memory.used",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return int(result.stdout.strip().splitlines()[0])
    except (IndexError, ValueError, subprocess.SubprocessError, FileNotFoundError):
        return None


def wait_for_vram_recovery(
    baseline_mib: int | None, tolerance_mib: int = 256, timeout: int = 180
) -> int | None:
    if baseline_mib is None:
        time.sleep(3)
        return None

    deadline = time.time() + timeout
    while time.time() < deadline:
        current = read_vram_used_mib()
        if current is not None and current <= baseline_mib + tolerance_mib:
            return current
        time.sleep(2)
    return read_vram_used_mib()


def wait_for_server(port: int, timeout: int = 240) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            response = requests.get(f"http://127.0.0.1:{port}/health", timeout=2)
            if response.status_code == 200:
                return True
        except requests.RequestException:
            pass
        time.sleep(2)
    return False


def encode_image(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("utf-8")


def post_json(url: str, payload: dict[str, Any], timeout: int = 300) -> tuple[requests.Response, float]:
    start = time.time()
    response = requests.post(url, json=payload, timeout=timeout)
    elapsed = time.time() - start
    return response, elapsed


def build_command(cfg: dict[str, Any]) -> list[str]:
    cmd = [
        str(LLAMA_SERVER),
        "-m",
        str(MODELS_DIR / cfg["model"]),
        "--host",
        "127.0.0.1",
        "--port",
        str(cfg["port"]),
        "-c",
        str(cfg["ctx"]),
        "-ngl",
        "99",
        "--flash-attn",
        "on",
        "-ctk",
        cfg["cache_type"],
        "-ctv",
        cfg["cache_type"],
        "-b",
        "1024",
        "-ub",
        "256",
        "--parallel",
        str(cfg["parallel"]),
        "--reasoning-budget",
        str(cfg["reasoning_budget"]),
        "--temp",
        str(cfg["temp"]),
        "--top-p",
        str(cfg["top_p"]),
        "--top-k",
        str(cfg["top_k"]),
        "--presence-penalty",
        str(cfg["presence_penalty"]),
    ]
    if cfg.get("chat_template_file"):
        cmd.extend(["--chat-template-file", cfg["chat_template_file"]])
    if cfg.get("mmproj"):
        cmd.extend(["--mmproj", str(MODELS_DIR / cfg["mmproj"]), "--no-mmproj-offload"])
    return cmd


def run_payload(api_url: str, model: str, extra: dict[str, Any], cfg: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "model": model,
        "temperature": cfg["temp"],
        "top_p": cfg["top_p"],
        "top_k": cfg["top_k"],
        **extra,
    }
    response, elapsed = post_json(api_url, payload, timeout=300)
    run_result: dict[str, Any] = {
        "http_status": response.status_code,
        "elapsed": round(elapsed, 2),
    }
    if response.status_code == 200:
        data = response.json()
        message = data.get("choices", [{}])[0].get("message", {})
        run_result.update(
            {
                "success": True,
                "completion_tokens": data.get("usage", {}).get("completion_tokens", 0),
                "prompt_tokens": data.get("usage", {}).get("prompt_tokens", 0),
                "gen_tps": data.get("timings", {}).get("predicted_per_second", 0),
                "prompt_tps": data.get("timings", {}).get("prompt_per_second", 0),
                "content_preview": message.get("content", "")[:700],
                "reasoning_preview": message.get("reasoning_content", "")[:400],
            }
        )
    else:
        run_result.update({"success": False, "error": response.text[:500]})
    return run_result


def benchmark_config(cfg: dict[str, Any]) -> dict[str, Any]:
    print(f"=== {cfg['name']} ===", flush=True)
    baseline_mib = read_vram_used_mib()
    kill_servers()
    recovered_mib = wait_for_vram_recovery(baseline_mib)

    log_path = ROOT / "logs" / f"{cfg['name']}_64k.log"
    with log_path.open("w", encoding="utf-8") as log:
        proc = subprocess.Popen(
            build_command(cfg),
            stdout=log,
            stderr=log,
            env=build_runtime_env(),
        )

    if not wait_for_server(cfg["port"]):
        return {
            "name": cfg["name"],
            "error": "server failed to start",
            "vram_baseline_mib": baseline_mib,
            "vram_before_launch_mib": recovered_mib,
            "log": str(log_path),
        }

    api_url = f"http://127.0.0.1:{cfg['port']}/v1/chat/completions"
    result: dict[str, Any] = {
        "name": cfg["name"],
        "model": cfg["model"],
        "context": cfg["ctx"],
        "cache_type": cfg["cache_type"],
        "vram_baseline_mib": baseline_mib,
        "vram_before_launch_mib": recovered_mib,
        "log": str(log_path),
        "runs": {},
    }

    for _ in range(2):
        try:
            post_json(
                api_url,
                {
                    "model": cfg["model"],
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 24,
                    "temperature": cfg["temp"],
                    "top_p": cfg["top_p"],
                    "top_k": cfg["top_k"],
                },
                timeout=180,
            )
        except requests.RequestException:
            pass

    for label, extra in TEXT_PAYLOADS.items():
        result["runs"][label] = run_payload(api_url, cfg["model"], extra, cfg)
        print(
            f"  {label}: {result['runs'][label].get('http_status')} "
            f"{result['runs'][label].get('gen_tps', 0):.1f} t/s",
            flush=True,
        )

    if cfg.get("mmproj"):
        image_b64 = encode_image(IMAGE_PATH)
        vision_payload = json.loads(json.dumps(VISION_PAYLOAD))
        vision_payload["messages"][0]["content"].append(
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
        )
        result["runs"]["vision_ui"] = run_payload(api_url, cfg["model"], vision_payload, cfg)
        print(
            f"  vision_ui: {result['runs']['vision_ui'].get('http_status')} "
            f"{result['runs']['vision_ui'].get('gen_tps', 0):.1f} t/s",
            flush=True,
        )

    proc.terminate()
    kill_servers()
    return result


def main() -> int:
    results: dict[str, Any] = {
        "timestamp": datetime.now().isoformat(),
        "image": str(IMAGE_PATH),
        "results": [],
    }
    try:
        for cfg in CONFIGS:
            results["results"].append(benchmark_config(cfg))
    finally:
        kill_servers()

    output = ROOT / "results" / f"benchmark_64k_compare_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"RESULT_FILE={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
