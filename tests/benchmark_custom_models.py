"""
Benchmark custom text-only model launch configurations on a single GPU.

This is used for experimental tuning without adding every test variant to
config/servers.yaml.
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

PAYLOADS: dict[str, dict[str, Any]] = {
    "reasoning": {
        "messages": [
            {
                "role": "user",
                "content": (
                    "If it takes 5 machines 5 minutes to make 5 widgets, how long "
                    "do 100 machines take to make 100 widgets? Answer briefly."
                ),
            }
        ],
        "max_tokens": 120,
    },
    "coding": {
        "messages": [
            {
                "role": "user",
                "content": (
                    "Write a Python function that merges two sorted lists and "
                    "include one short doctest."
                ),
            }
        ],
        "max_tokens": 220,
    },
    "developer_role": {
        "messages": [
            {
                "role": "developer",
                "content": (
                    "You are a precise coding assistant. Keep the answer compact. "
                    "Think internally but only return code."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Write Python code for is_palindrome(s: str) -> bool and "
                    "include three assert tests."
                ),
            },
        ],
        "max_tokens": 220,
    },
}

CONFIGS: list[dict[str, Any]] = [
    {
        "name": "heyuji_35b_abliterated_q2",
        "port": 8010,
        "model": "Qwen3.5-35B-A3B-abliterated-Q2_K.gguf",
        "ctx": 32768,
        "cache_type": "iq4_nl",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": 0,
        "chat_template_file": None,
    },
    {
        "name": "qwopus_9b_maxctx",
        "port": 8011,
        "model": "Qwen3.5-9B.Q4_K_M.gguf",
        "ctx": 262144,
        "cache_type": "q8_0",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": -1,
        "chat_template_file": None,
    },
    {
        "name": "base_27b_text_think_off",
        "port": 8012,
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
        "name": "base_27b_text_q8_fast",
        "port": 8013,
        "model": "Qwen3.5-27B-Q3_K_S.gguf",
        "ctx": 32768,
        "cache_type": "q8_0",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": 0,
        "chat_template_file": str(TEMPLATE),
    },
    {
        "name": "qwopus_27b_text_think_on",
        "port": 8014,
        "model": "Qwen3.5-27B.Q3_K_S.gguf",
        "ctx": 32768,
        "cache_type": "iq4_nl",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": -1,
        "chat_template_file": None,
    },
    {
        "name": "base_27b_iq4xs_iq4_32k",
        "port": 8018,
        "model": "Qwen3.5-27B-IQ4_XS.gguf",
        "ctx": 32768,
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
        "name": "abliterated_27b_q3ks_q8_32k",
        "port": 8020,
        "model": "Qwen3.5-27B-abliterated-Q3_K_S.gguf",
        "ctx": 32768,
        "cache_type": "q8_0",
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "presence_penalty": 0.0,
        "parallel": 1,
        "reasoning_budget": 0,
        "chat_template_file": str(TEMPLATE),
    },
    {
        "name": "heretic_27b_q4ks_iq4_16k",
        "port": 8021,
        "model": "Qwen3.5-27B-heretic-v2-Q4_K_S.gguf",
        "ctx": 16384,
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
    return cmd


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
        "reasoning_budget": cfg["reasoning_budget"],
        "chat_template_file": cfg.get("chat_template_file"),
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

    for label, extra in PAYLOADS.items():
        payload = {
            "model": cfg["model"],
            "temperature": cfg["temp"],
            "top_p": cfg["top_p"],
            "top_k": cfg["top_k"],
            **extra,
        }
        try:
            response, elapsed = post_json(api_url, payload)
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
                        "content_preview": message.get("content", "")[:400],
                        "reasoning_preview": message.get("reasoning_content", "")[:400],
                    }
                )
            else:
                run_result.update({"success": False, "error": response.text[:400]})
        except requests.RequestException as exc:
            run_result = {"success": False, "error": str(exc)}

        result["runs"][label] = run_result
        status = "OK" if run_result.get("success") else "FAIL"
        print(f"  {label}: {status} {run_result.get('gen_tps', 0):.1f} t/s", flush=True)

    proc.terminate()
    kill_servers()
    return result


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Benchmark custom text-only configurations")
    parser.add_argument(
        "--configs",
        nargs="+",
        help="Subset of config names to run",
    )
    args = parser.parse_args()

    selected = CONFIGS
    if args.configs:
        allowed = set(args.configs)
        selected = [cfg for cfg in CONFIGS if cfg["name"] in allowed]

    results: dict[str, Any] = {"timestamp": datetime.now().isoformat(), "results": []}
    try:
        for cfg in selected:
            results["results"].append(benchmark_config(cfg))
    finally:
        kill_servers()

    output = ROOT / "results" / f"custom_benchmark_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"RESULT_FILE={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
