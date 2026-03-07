"""
Sweep 27B model/KV combinations to find the highest server context that still
launches and answers a small request on a 16 GB GPU.
"""

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

TEST_CONTEXTS = [32768, 65536, 98304, 131072, 163840, 196608, 229376, 262144]

CONFIGS: list[dict[str, Any]] = [
    {
        "name": "q3ks_q8_0",
        "model": "Qwen3.5-27B-Q3_K_S.gguf",
        "cache_type": "q8_0",
        "port": 8030,
    },
    {
        "name": "q3ks_iq4_nl",
        "model": "Qwen3.5-27B-Q3_K_S.gguf",
        "cache_type": "iq4_nl",
        "port": 8031,
    },
    {
        "name": "q3ks_q4_0",
        "model": "Qwen3.5-27B-Q3_K_S.gguf",
        "cache_type": "q4_0",
        "port": 8032,
    },
    {
        "name": "iq4xs_q4_0",
        "model": "Qwen3.5-27B-IQ4_XS.gguf",
        "cache_type": "q4_0",
        "port": 8033,
    },
]

PAYLOAD = {
    "messages": [
        {
            "role": "developer",
            "content": (
                "You are a precise coding assistant. Keep the answer compact. "
                "Return plain text only."
            ),
        },
        {
            "role": "user",
            "content": "What is 2+2? Answer in one line.",
        },
    ],
    "max_tokens": 32,
    "temperature": 0.2,
    "top_p": 0.9,
    "top_k": 20,
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


def build_command(cfg: dict[str, Any], context: int) -> list[str]:
    return [
        str(LLAMA_SERVER),
        "-m",
        str(MODELS_DIR / cfg["model"]),
        "--host",
        "127.0.0.1",
        "--port",
        str(cfg["port"]),
        "-c",
        str(context),
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
        "--chat-template-file",
        str(TEMPLATE),
    ]


def try_context(cfg: dict[str, Any], context: int) -> dict[str, Any]:
    baseline_mib = read_vram_used_mib()
    kill_servers()
    recovered_mib = wait_for_vram_recovery(baseline_mib)

    log_name = f"context_{cfg['name']}_{context}.log"
    log_path = ROOT / "logs" / log_name
    with log_path.open("w", encoding="utf-8") as log:
        proc = subprocess.Popen(
            build_command(cfg, context),
            stdout=log,
            stderr=log,
            env=build_runtime_env(),
        )

    result: dict[str, Any] = {
        "context": context,
        "vram_baseline_mib": baseline_mib,
        "vram_before_launch_mib": recovered_mib,
        "log": str(log_path),
    }

    if not wait_for_server(cfg["port"]):
        proc.terminate()
        kill_servers()
        result.update({"success": False, "error": "server failed to start"})
        return result

    api_url = f"http://127.0.0.1:{cfg['port']}/v1/chat/completions"
    try:
        response = requests.post(
            api_url,
            json={"model": cfg["model"], **PAYLOAD},
            timeout=180,
        )
        result["http_status"] = response.status_code
        if response.status_code == 200:
            data = response.json()
            message = data.get("choices", [{}])[0].get("message", {})
            result.update(
                {
                    "success": True,
                    "gen_tps": data.get("timings", {}).get("predicted_per_second", 0),
                    "prompt_tps": data.get("timings", {}).get("prompt_per_second", 0),
                    "completion_tokens": data.get("usage", {}).get(
                        "completion_tokens", 0
                    ),
                    "content_preview": message.get("content", "")[:120],
                }
            )
        else:
            result.update({"success": False, "error": response.text[:400]})
    except requests.RequestException as exc:
        result.update({"success": False, "error": str(exc)})

    proc.terminate()
    kill_servers()
    return result


def main() -> int:
    results: dict[str, Any] = {"timestamp": datetime.now().isoformat(), "results": []}

    try:
        for cfg in CONFIGS:
            combo: dict[str, Any] = {
                "name": cfg["name"],
                "model": cfg["model"],
                "cache_type": cfg["cache_type"],
                "attempts": [],
            }
            print(f"=== {cfg['name']} ===", flush=True)
            for context in TEST_CONTEXTS:
                attempt = try_context(cfg, context)
                combo["attempts"].append(attempt)
                status = "OK" if attempt.get("success") else "FAIL"
                print(
                    f"  {context}: {status} {attempt.get('gen_tps', 0):.1f} t/s",
                    flush=True,
                )
                if not attempt.get("success"):
                    break

            successful = [a for a in combo["attempts"] if a.get("success")]
            combo["max_success_context"] = (
                max(a["context"] for a in successful) if successful else 0
            )
            results["results"].append(combo)
    finally:
        kill_servers()

    output = ROOT / "results" / (
        f"context_sweep_27b_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"RESULT_FILE={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
