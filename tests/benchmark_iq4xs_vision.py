"""
Benchmark Qwen3.5-27B IQ4_XS with the 27B multimodal projector at multiple
contexts on a 16 GB GPU.
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
IMAGE_PATH = ROOT / "complex_test.png"

CONFIGS: list[dict[str, Any]] = [
    {
        "name": "iq4xs_vision_32k",
        "port": 8050,
        "model": "Qwen3.5-27B-IQ4_XS.gguf",
        "mmproj": "mmproj-27B-F16.gguf",
        "ctx": 32768,
        "cache_type": "iq4_nl",
    },
    {
        "name": "iq4xs_vision_64k",
        "port": 8051,
        "model": "Qwen3.5-27B-IQ4_XS.gguf",
        "mmproj": "mmproj-27B-F16.gguf",
        "ctx": 65536,
        "cache_type": "iq4_nl",
    },
]

QUESTION = (
    "Describe this UI screenshot. Mention the main layout, any labels, any visible "
    "shapes or sections, and keep the answer concise."
)


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
    return [
        str(LLAMA_SERVER),
        "-m",
        str(MODELS_DIR / cfg["model"]),
        "--mmproj",
        str(MODELS_DIR / cfg["mmproj"]),
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
        "1",
        "--reasoning-budget",
        "0",
    ]


def benchmark_config(cfg: dict[str, Any]) -> dict[str, Any]:
    print(f"=== {cfg['name']} ===", flush=True)
    baseline_mib = read_vram_used_mib()
    kill_servers()
    recovered_mib = wait_for_vram_recovery(baseline_mib)

    log_path = ROOT / "logs" / f"{cfg['name']}.log"
    with log_path.open("w", encoding="utf-8") as log:
        proc = subprocess.Popen(
            build_command(cfg),
            stdout=log,
            stderr=log,
            env=build_runtime_env(),
        )

    result: dict[str, Any] = {
        "name": cfg["name"],
        "model": cfg["model"],
        "mmproj": cfg["mmproj"],
        "context": cfg["ctx"],
        "cache_type": cfg["cache_type"],
        "vram_baseline_mib": baseline_mib,
        "vram_before_launch_mib": recovered_mib,
        "log": str(log_path),
    }

    if not wait_for_server(cfg["port"]):
        proc.terminate()
        kill_servers()
        result.update({"success": False, "error": "server failed to start"})
        return result

    image_b64 = encode_image(IMAGE_PATH)
    payload = {
        "model": cfg["model"],
        "temperature": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "max_tokens": 220,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": QUESTION},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
                ],
            }
        ],
    }

    api_url = f"http://127.0.0.1:{cfg['port']}/v1/chat/completions"
    response, elapsed = post_json(api_url, payload)
    result["http_status"] = response.status_code
    result["elapsed"] = round(elapsed, 2)

    if response.status_code == 200:
        data = response.json()
        message = data.get("choices", [{}])[0].get("message", {})
        result.update(
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
        result.update({"success": False, "error": response.text[:500]})

    proc.terminate()
    kill_servers()
    return result


def main() -> int:
    results: dict[str, Any] = {
        "timestamp": datetime.now().isoformat(),
        "image": str(IMAGE_PATH),
        "question": QUESTION,
        "results": [],
    }
    try:
        for cfg in CONFIGS:
            results["results"].append(benchmark_config(cfg))
            latest = results["results"][-1]
            print(
                f"  status={latest.get('http_status')} gen_tps={latest.get('gen_tps', 0):.1f}",
                flush=True,
            )
    finally:
        kill_servers()

    output = ROOT / "results" / f"benchmark_iq4xs_vision_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"RESULT_FILE={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
