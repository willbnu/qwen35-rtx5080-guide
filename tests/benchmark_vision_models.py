"""
Benchmark vision-capable presets with a shared image prompt.
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

from config.config_loader import get_config

IMAGE_PATH = ROOT / "test_image.png"
QUESTION = "Describe this image briefly and mention any obvious text, layout, or chart-like content."


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


def wait_for_vram_recovery(baseline_mib: int | None, tolerance_mib: int = 256, timeout: int = 180) -> int | None:
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


def benchmark_server(server_key: str) -> dict[str, Any]:
    config = get_config()
    server = config.get_server(server_key)
    if server is None:
        raise ValueError(f"Unknown server key: {server_key}")

    baseline_mib = read_vram_used_mib()
    kill_servers()
    recovered_mib = wait_for_vram_recovery(baseline_mib)

    subprocess.run(
        [sys.executable, "server_manager.py", "start", "--server", server_key],
        cwd=ROOT,
        check=True,
    )
    if not wait_for_server(server.port):
        return {
            "name": server.name,
            "error": "server failed to start",
            "vram_baseline_mib": baseline_mib,
            "vram_before_launch_mib": recovered_mib,
        }

    image_b64 = encode_image(IMAGE_PATH)
    payload = {
        "model": server.model,
        "temperature": server.temp,
        "top_p": server.top_p,
        "top_k": server.top_k,
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

    api_url = f"http://127.0.0.1:{server.port}/v1/chat/completions"
    response, elapsed = post_json(api_url, payload)
    result: dict[str, Any] = {
        "name": server.name,
        "model": server.model,
        "context": server.context,
        "vram_baseline_mib": baseline_mib,
        "vram_before_launch_mib": recovered_mib,
        "http_status": response.status_code,
        "elapsed": round(elapsed, 2),
    }

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
                "content_preview": message.get("content", "")[:500],
                "reasoning_preview": message.get("reasoning_content", "")[:500],
            }
        )
    else:
        result.update({"success": False, "error": response.text[:500]})

    kill_servers()
    return result


def main() -> int:
    results = {
        "timestamp": datetime.now().isoformat(),
        "image": str(IMAGE_PATH),
        "question": QUESTION,
        "servers": {},
    }
    try:
        for server_key in ["fast_vision", "quality_vision", "coding"]:
            print(f"=== {server_key} ===", flush=True)
            results["servers"][server_key] = benchmark_server(server_key)
            server_result = results["servers"][server_key]
            print(
                f"  status={server_result.get('http_status')} gen_tps={server_result.get('gen_tps', 0):.1f}",
                flush=True,
            )
    finally:
        kill_servers()

    output = ROOT / "results" / f"vision_benchmark_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"RESULT_FILE={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
