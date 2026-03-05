# Progress Checklist - RTX 5080 LLM Setup

## System Info

- **Date Started**: March 3, 2026
- **Date Updated**: March 5, 2026 (--parallel 1 discovery + SM120 native build)
- **GPU**: RTX 5080 16GB (SM120 - Blackwell)
- **CPU**: Ryzen **7** 9800X3D (8-core — NOT Ryzen 9)
- **RAM**: 96GB
- **Platform**: Windows 11 + llama.cpp (Native)

---

## Current Setup: llama.cpp Single-Server (One At A Time)

### Status: ✅ FULLY BENCHMARKED & OPTIMIZED

> ⚠️ **CRITICAL REALITY**: 35B-A3B alone uses 15.4GB VRAM at 128K — only 195MB headroom.
> No two of these models can run simultaneously on 16GB. Pick one per session.

### Verified Performance (Real Benchmarks — March 4, 2026)

| Server      | Port | Model        | Quant   | Context              | KV     | GPU Layers | Gen t/s      | Prompt t/s | VRAM    | Vision |
| ----------- | ---- | ------------ | ------- | -------------------- | ------ | ---------- | ------------ | ---------- | ------- | ------ |
| **35B-A3B** | 8002 | Q3_K_S MoE   | 3.94bpw | **120K (practical)** | iq4_nl | 41/41 ✅   | **~120 t/s** | ~500 t/s   | ~15.4GB | ✅     |
| **9B**      | 8003 | Q4_K_XL      | 4.9bpw  | 256K                 | q8_0   | 33/33 ✅   | **~97 t/s**  | ~668 t/s   | ~10.6GB | ✅     |
| **27B**     | 8004 | Q3_K_S dense | 3.94bpw | **96K**              | iq4_nl | 65/65 ✅   | **~46 t/s**  | ~300 t/s   | ~14.5GB | ✅     |

### Context Size Findings — 35B-A3B (March 4, 2026 NEW)

**TLDR: 155,904 tokens (≈152K) is the hard ceiling for full speed. 156,160+ hits PCIe bottleneck → 9 t/s.**

| Context            | Speed          | Fits VRAM?        | CUDA_Host Buf | Notes            |
| ------------------ | -------------- | ----------------- | ------------- | ---------------- |
| 64K                | 109 t/s ✅     | Yes (15.0 GB)     | 136 MB        | Previous default |
| 128K               | 119 t/s ✅     | Yes (15.4 GB)     | 264 MB        | Good             |
| 148K               | 114 t/s ✅     | Yes (15.5 GB)     | 304 MB        | Good             |
| **152K (155,904)** | **125 t/s ✅** | **Yes (15.4 GB)** | **312.52 MB** | **HARD MAX**     |
| 156,160            | 9 t/s ❌       | Yes (fits)        | 313.02 MB     | PCIe cliff       |
| 192K               | 8 t/s ❌       | Yes (15.5 GB)     | 392 MB        | PCIe bottleneck  |
| 256K               | 9 t/s ❌       | **NO (OOM)**      | 520 MB        | VRAM + PCIe      |

Root cause: `CUDA_Host compute buffer` crosses an internal alignment threshold at 313 MB. This buffer holds tensors transferred over PCIe per token. Past the threshold, PCIe transfer volume dominates token generation time → 10x slowdown. This is specific to the hybrid DeltaNet architecture.

### Use Case Routing

| Task                    | Best Choice    | Port | Why                                                                  |
| ----------------------- | -------------- | ---- | -------------------------------------------------------------------- |
| **Coding / fast chat**  | 35B-A3B Q3_K_S | 8002 | **120 t/s**, MoE efficiency, **120K** ctx, vision ✅, `--parallel 1` |
| **Vision / multimodal** | 9B Q4_K_XL     | 8003 | 97 t/s, **256K** ctx, vision ✅                                      |
| **Long-form / quality** | 27B Q3_K_S     | 8004 | **46 t/s**, **96K** ctx, dense model, best quality/token             |

---

## Completed Phases

### ~~Phase 1: SGLang + WSL2~~ ❌ ABANDONED

- 27B model doesn't fit in 16GB VRAM with KV cache
- AWQ kernel compatibility issues

### ~~Phase 2: Ollama + GGUF~~ ✅ SUPERSEDED

- Working but 30-50x slower than llama.cpp
- Kept for comparison purposes

### ~~Phase 3: Hybrid Setup~~ ✅ SUPERSEDED

- vLLM requires Linux/WSL, doesn't work native Windows
- Requires 48GB VRAM for 170K context

### Phase 4: llama.cpp Native ✅ COMPLETE

#### Completed Tasks

- [x] Analyzed why SGLang failed (27B doesn't fit in 16GB VRAM)
- [x] Migrated from Ollama to llama.cpp with CUDA (50x speedup)
- [x] Downloaded Unsloth GGUF models (9B, 27B, 35B-A3B)
- [x] Downloaded llama.cpp b8196 with CUDA (Windows native)
- [x] Created startup scripts with context selection
- [x] Updated OpenCode config with all 3 models
- [x] Ran benchmarks: 65-71 t/s (35B), 97-100 t/s (9B)
- [x] Increased context: 64K (35B), 128K (9B)
- [x] Got vision working on 9B model (port 8003)
- [x] Created unified startup script (start_all_servers.bat)
- [x] Created vision test script (test_vision.py)

#### 27B Vision Optimization (March 4, 2026)

- [x] Discovered Q3_K_S + iq4_nl + Flash Attention = 3x speedup
- [x] Achieved 65/65 GPU layers with 64K context
- [x] Created start_27b_vision.bat with optimal settings

#### 35B-A3B Vision Discovery (March 4, 2026) 🎉

- [x] **DISCOVERED: 35B-A3B + Vision WORKS!**
- [x] mmproj-35B-F16.gguf has projection_dim=2048 matching n_embd=2048
- [x] Tested Q3_K_S + Vision: 28-35 t/s generation
- [x] Created start_35b_a3b_vision_optimized.bat
- [x] Created test_35b_vision.py

#### heretic-v1 Testing (March 4, 2026) 🔓

- [x] Downloaded heretic-v1 Q4_K_M (21.2GB)
- [x] Downloaded mmproj-heretic-BF16 (903MB)
- [x] **Confirmed: Decensored (11/100 vs 92/100 refusals)**
- [x] Vision working with mmproj-BF16
- [x] Speed limited to ~7 t/s (VRAM constraints)
- [x] Created start_heretic_vision.bat

#### Documentation & Cleanup (March 4, 2026)

- [x] Created docs/COMPLETE_ANALYSIS.md
- [x] Created docs/PERFORMANCE_MATRIX.md
- [x] Created docs/KV_CACHE_ANALYSIS.md
- [x] Created docs/HERETIC_COMPARISON.md
- [x] Updated PROGRESS_CHECKLIST.md
- [x] **REPO CLEANUP**: Root reduced from 80 → 27 entries
  - Archived 10 obsolete benchmark scripts → archive/benchmarks/
  - Archived 17 obsolete startup/setup scripts → archive/scripts/
  - Archived 5 old test scripts → archive/tests/
  - Archived 12 outdated docs → archive/docs/
  - Moved all root-level \*.log files → logs/
  - Moved all JSON results → results/
  - Deleted junk (nul, fake zip)
- [x] **BENCHMARK REGRESSION FIX**: 9B server corrected
  - Bug: `--flash-attn auto` → Fix: `--flash-attn on`
  - Bug: 128K context with f16 KV → Fix: 64K + q8_0 KV cache
  - Bug: missing `--chat-template-kwargs` thinking disable → Fixed

#### --parallel 1 Discovery (March 5, 2026) 🚨 CRITICAL

- [x] **ROOT CAUSE FOUND: `--parallel 1` required for 35B-A3B GDN hybrid architecture**
  - Default `n_parallel=auto` selects 4 slots → 4x larger recurrent state (RS) buffers
  - RS buffer: 1 slot = 62 MB (fast), 4 slots = 251 MB (10x slower)
  - `--parallel 1` = **~125 t/s**, `--parallel 4` (default) = **~9 t/s**
- [x] Updated `start_servers_speed.bat` with `--parallel 1`
- [x] Updated `config/servers.yaml` with `parallel: 1` on all 35B-A3B server configs
- [x] Updated `results/BENCHMARK_RESULTS.md` with critical --parallel 1 warning
- [x] Updated `launch_sm120.ps1` with `--parallel 1`

#### SM120 Native Build (March 5, 2026) 🔧

- [x] Updated llama.cpp source from Aug 2024 (`0478174d`) → latest (`1a29907d`)
- [x] Built SM120-native binary at `llama.cpp/build-sm120/bin/Release/llama-server.exe`
  - CMake config: `CUDA_ARCHITECTURES=120`, `GGML_CUDA_FA_ALL_QUANTS=ON`
- [x] **Benchmarked: SM120 native = 125.8 t/s vs prebuilt b8196 = 124.8 t/s (~1% gain)**
  - Real benefit is eliminating JIT warmup on first requests, not raw speed
  - The actual 10x speedup came from `--parallel 1`, not SM120
- [x] Documented in `docs/RTX5080-NATIVE-BUILD.md` (corrected performance claims)

#### Research Analysis (March 4, 2026) 🔬

- [x] **RTX-STone Analysis**: Security concerns - NOT RECOMMENDED
  - No GitHub repository (404)
  - Requires Python 3.10-3.11 (user has 3.12)
  - Official PyTorch nightly already supports SM120
- [x] **FlashMLA Analysis**: For DeepSeek models only
  - 32x speedup for DeepSeek-V3
  - Not compatible with Qwen (different attention)
- [x] **PyTorch SM120 Analysis**: Not needed for llama.cpp
  - Official nightly cu128 supports SM120
  - llama.cpp is self-contained (doesn't use PyTorch)

---

## Technical Discoveries

### Critical Findings

1. **`--parallel 1` REQUIRED for 35B-A3B (CRITICAL)**: The GDN hybrid architecture allocates recurrent state (RS) buffers proportional to `n_parallel`. Default auto (4 slots) = 251 MB RS → 10x slowdown. With `--parallel 1` = 62 MB RS → full speed (~125 t/s). This is the single most impactful optimization found.

2. **SM120 Native Build = ~1% gain only**: Prebuilt b8196 (SM89 PTX JIT) = 124.8 t/s vs SM120 native = 125.8 t/s. The real benefit is eliminating 2-3 slow JIT warmup requests, not raw throughput.

3. **vLLM Requirements**: Needs Linux/WSL, doesn't work native Windows, requires 48GB VRAM for 170K context

4. **llama.cpp Advantages**: Windows native, 30-50x faster than Ollama, better VRAM efficiency

5. **Thinking Mode Issue**: Qwen3.5 has thinking mode causing 2-3x slowdown - must disable via chat template

6. **Vision Compatibility (MAJOR DISCOVERY)**:
   - 35B-A3B (n_embd=2048) ✅ works with mmproj-35B-F16.gguf (projection_dim=2048)
   - 27B (n_embd=5120) ✅ works with mmproj-27B-F16.gguf (projection_dim=5120)
   - 9B (n_embd=4096) ✅ works with mmproj-F16.gguf (projection_dim=4096)

7. **Context Scaling**: 9B can do 256K (full model max!), 35B-A3B can do 152K (155,904 tokens), 27B limited to 64K on 16GB VRAM

8. **Flash Attention Discovery**: Must be FORCED ON with `--flash-attn on` (not auto) for iq4_nl/q8_0 cache to work. New llama.cpp builds require `--flash-attn on` explicitly (not just `--flash-attn`).

9. **KV Cache Optimization**: iq4_nl = 75% smaller than f16 (ideal for large MoE models); q8_0 = fastest on SM120 (better bandwidth than dequant cost)

10. **Graph Splits Clarification**: "graph splits" in logs does NOT always mean CPU offload. For hybrid-attention models (9B Gated DeltaNet, 27B/35B MoE layers), splits = 2–34 are normal architecture splits, all on GPU. Actual CPU offload shows as partial `offloaded X/Y layers` with Y being total.

11. **heretic-v1 Decensoring**: MPOA (Magnitude-Preserving Orthogonal Ablation) reduces refusals from 92% to 11%

12. **SM120 Hardware Limits**:
    - 99KB shared memory (vs 227KB on datacenter)
    - No GMMA/TCGEN05 instructions
    - No TMEM (Tensor Memory)
    - Sparse attention not supported

### Model Architecture

| Model      | Type  | Active Params | Total Params | Vision | Refusals   |
| ---------- | ----- | ------------- | ------------ | ------ | ---------- |
| 35B-A3B    | MoE   | 3B            | 35B          | ✅     | 92/100     |
| heretic-v1 | MoE   | 3B            | 35B          | ✅     | **11/100** |
| 27B        | Dense | 27B           | 27B          | ✅     | Standard   |
| 9B         | Dense | 9B            | 9B           | ✅     | Standard   |

### MoE Efficiency (35B-A3B)

- Uses only 3B active params per token (8 routed + 1 shared expert from 256 total)
- This is why 35B generates at ~125 t/s while 27B only does ~36 t/s!
- **MUST use `--parallel 1`** — default auto (4 slots) causes 10x slowdown due to GDN RS buffer scaling

### iq4_nl KV Cache Benefits

| Model   | Context | f16 Cache | iq4_nl Cache | Savings |
| ------- | ------- | --------- | ------------ | ------- |
| 35B-A3B | 32K     | 1,280 MB  | **320 MB**   | 75%     |
| 27B     | 64K     | 8,192 MB  | **2,048 MB** | 75%     |
| 9B      | 128K    | 9,216 MB  | **2,304 MB** | 75%     |

---

## File Structure

```
qwen-llm/
├── llama-bin/                        # llama.cpp prebuilt binaries (b8196, ARCHS 500-890)
│   ├── llama-server.exe
│   ├── llama-mtmd-cli.exe
│   └── *.dll
├── llama.cpp/                        # Source + SM120 native build (ARCHS 1200)
│   └── build-sm120/bin/Release/
│       └── llama-server.exe          # SM120 native — 125.8 t/s (vs 124.8 prebuilt)
├── models/unsloth-gguf/              # All model files (DO NOT TOUCH)
│   ├── Qwen3.5-9B-UD-Q4_K_XL.gguf
│   ├── Qwen3.5-27B-Q3_K_S.gguf
│   ├── Qwen3.5-27B-Q4_K_M.gguf
│   ├── Qwen3.5-35B-A3B-Q3_K_S.gguf
│   ├── Qwen3.5-35B-A3B-Q4_K_M.gguf
│   ├── Qwen3.5-35B-A3B-heretic-Q4_K_M.gguf
│   ├── mmproj-F16.gguf              # 9B vision
│   ├── mmproj-27B-F16.gguf          # 27B vision
│   ├── mmproj-35B-F16.gguf          # 35B vision
│   └── mmproj-heretic-BF16.gguf     # heretic vision
├── config/
│   ├── servers.yaml                  # Source of truth for all server settings
│   └── config_loader.py              # Python config loader
├── tests/
│   ├── simple_benchmark.py           # Single-server benchmark
│   ├── health_check.py               # Server health monitor
│   ├── compare_models.py             # Model comparison tool
│   └── vision_test.py                # Vision testing utility
├── docs/                             # Active documentation
│   ├── KV_CACHE_ANALYSIS.md
│   ├── PERFORMANCE_MATRIX.md
│   ├── RESEARCH_FINDINGS.md
│   ├── RTX_STONE_ANALYSIS.md
│   ├── HERETIC_COMPARISON.md
│   └── 27B_OPTIMIZATION_ANALYSIS.md
├── archive/                          # Old files kept for reference
│   ├── benchmarks/                   # 10 old benchmark scripts
│   ├── scripts/                      # 17 old startup/setup scripts
│   ├── tests/                        # 5 old test scripts
│   └── docs/                         # 12 outdated docs
├── logs/                             # All server logs
├── results/                          # Benchmark results (JSON + MD)
├── start_servers_speed.bat           # ACTIVE: Speed profile (8002 + 8003)
├── start_servers_standard.bat        # ACTIVE: Standard profile (8002+8003+8004)
├── stop_servers.bat                  # Stop all servers
├── server_manager.py                 # Python server manager
├── test_vision.py                    # 9B vision test
├── test_35b_vision.py                # 35B vision test
├── qwen_api.py                       # API helper
├── PROGRESS_CHECKLIST.md             # This file
└── README.md
```

---

## Key Commands

### Server Management

```bash
# Start speed profile (35B Coding + 9B Fast Vision)
start_servers_speed.bat

# Start standard profile (35B Coding + 9B Vision + 27B Quality)
start_servers_standard.bat

# Stop all servers
stop_servers.bat

# Check server status
curl http://127.0.0.1:8002/health  # 35B Coding
curl http://127.0.0.1:8003/health  # 9B Fast Vision
curl http://127.0.0.1:8004/health  # 27B Quality Vision
```

### Vision Testing

```bash
# Test 9B vision
python test_vision.py image.png "Describe this"

# Test 35B vision
python test_35b_vision.py image.png "Describe this"
```

---

## API Format (Vision)

```python
import base64
import requests

# Encode image
with open('image.png', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# API call
payload = {
    'model': 'Qwen3.5-9B-UD-Q4_K_XL.gguf',
    'messages': [
        {'role': 'system', 'content': 'You are a helpful assistant.'},
        {
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'Describe this image'},
                {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{image_data}'}}
            ]
        }
    ],
    'max_tokens': 200
}

response = requests.post('http://127.0.0.1:8003/v1/chat/completions', json=payload)
```

---

## Unsloth Recommended Settings

### Coding (Non-Thinking)

```bash
--temp 0.6 --top-p 0.95 --top-k 20
--presence-penalty 0.0
--chat-template-kwargs "{\"enable_thinking\":false}"
```

### General (Non-Thinking)

```bash
--temp 0.7 --top-p 0.8 --top-k 20
--presence-penalty 1.5
```

---

## Research Conclusions

### RTX-STone: ❌ NOT RECOMMENDED

- No GitHub repository (404 error)
- Requires Python 3.10-3.11 (incompatible with 3.12)
- Official PyTorch nightly already supports SM120
- Security concerns: unverified 8GB package

### FlashMLA: ⚠️ ONLY FOR DEEPSEEK

- 32x speedup for DeepSeek-V3 models
- NOT compatible with Qwen (different attention architecture)
- Open source and legitimate (github.com/IISuperluminaLII)

### PyTorch SM120: ❌ NOT NEEDED

- llama.cpp is self-contained (doesn't use PyTorch)
- Only needed for training, Stable Diffusion, ComfyUI
- If needed: `pip install --pre torch --index-url https://download.pytorch.org/whl/nightly/cu128`

---

## Final Recommendations (Verified March 4, 2026)

> One server at a time — 35B alone fills 15.5GB of 16GB VRAM.

| Use Case         | Model              | Port | Quant   | KV     | Context  | Gen t/s  | Notes                     |
| ---------------- | ------------------ | ---- | ------- | ------ | -------- | -------- | ------------------------- |
| **Coding**       | 35B-A3B Q3_K_S MoE | 8002 | 3.94bpw | iq4_nl | **152K** | **~125** | `--parallel 1` REQUIRED   |
| **Fast Vision**  | 9B Q4_K_XL         | 8003 | 4.9bpw  | q8_0   | **256K** | **~97**  |                           |
| **Quality/Long** | 27B Q3_K_S dense   | 8004 | 3.94bpw | iq4_nl | 64K      | **~36**  |                           |
| **Uncensored**   | heretic-v1 Q4_K_M  | 8006 | 4.98bpw | f16    | 32K      | ~7 t/s   | Needs 24GB+ GPU for speed |

### Start Commands

```bat
start_servers_speed.bat coding    # 35B MoE — 125 t/s, 152K ctx, --parallel 1
start_servers_speed.bat vision    # 9B — 97 t/s, 256K context
start_servers_speed.bat quality   # 27B dense — 36 t/s, best quality per token
```

---

_Last Updated: March 5, 2026_
