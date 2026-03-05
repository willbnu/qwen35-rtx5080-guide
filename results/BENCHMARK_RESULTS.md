# Benchmark Results - RTX 5080 16GB

## Last Updated: March 5, 2026

---

## ⚠️ CRITICAL: --parallel 1 Required for 35B-A3B (GDN Hybrid Architecture)

**Discovery (March 5, 2026):** The 35B-A3B uses a Gated DeltaNet (GDN) hybrid architecture
with recurrent state buffers. The default `n_parallel=4` (auto) allocates 4x larger recurrent
state buffers (251 MB vs 62 MB), causing **10x generation slowdown** (9 t/s instead of 125 t/s).

**ALWAYS start the 35B-A3B server with `--parallel 1`.**

| Config                   | RS Buffer | Gen Speed       |
| ------------------------ | --------- | --------------- |
| `--parallel 1`           | 62 MB     | **~125 t/s** ✅ |
| `--parallel 4` (default) | 251 MB    | **~9 t/s** ❌   |

---

## Executive Summary

All three models run at full speed on RTX 5080 16GB — **one at a time only**.

| Model              | Config                                    | Avg Gen      | Peak          | Context  | Vision | VRAM    |
| ------------------ | ----------------------------------------- | ------------ | ------------- | -------- | ------ | ------- |
| **35B-A3B Q3_K_S** | 120K, iq4_nl KV, flash on, **parallel 1** | **120 t/s**  | **127 t/s**   | **120K** | ✅     | 15.4 GB |
| **9B Q4_K_XL**     | 256K, q8_0 KV, flash on                   | **97.5 t/s** | **112.2 t/s** | **256K** | ✅     | 10.6 GB |
| **27B Q3_K_S**     | 96K, iq4_nl KV, flash on, **parallel 1**  | **45.8 t/s** | **46.5 t/s**  | 96K      | ✅     | 14.5 GB |

---

## 35B-A3B Q3_K_S — Context Size Study (March 4, 2026)

### Key Finding: 155,904 tokens (≈152K) is the hard speed ceiling

The 35B-A3B uses a **hybrid recurrent architecture** (Gated DeltaNet + Gated Attention). A `CUDA_Host compute buffer` (pinned RAM, used for PCIe transfers per inference pass) grows proportionally with context. Above a threshold of ~312.5 MB, PCIe transfer volume per token exceeds the effective bandwidth → 10x slowdown.

**This is NOT a VRAM issue** — even 192K fits in VRAM (15.8 GB). It's a PCIe bandwidth bottleneck caused by the hybrid architecture's larger per-token transfer cost at bigger contexts.

| Context (tokens)    | CUDA0 Compute | CUDA_Host Compute | KV (iq4_nl) | VRAM Used    | Speed       | Status        |
| ------------------- | ------------- | ----------------- | ----------- | ------------ | ----------- | ------------- |
| 65,536 (64K)        | 493 MB        | 136 MB            | 360 MB      | ~15.0 GB     | 109 t/s     | ✅            |
| 98,304 (96K)        | 493 MB        | 200 MB            | 540 MB      | ~15.3 GB     | 109 t/s     | ✅            |
| 131,072 (128K)      | 493 MB        | 264 MB            | 720 MB      | ~15.4 GB     | 119 t/s     | ✅            |
| 143,360 (140K)      | 493 MB        | 288 MB            | 788 MB      | ~15.5 GB     | 115 t/s     | ✅            |
| 151,552 (148K)      | 493 MB        | 304 MB            | 833 MB      | ~15.5 GB     | 114 t/s     | ✅            |
| 155,648 (152K)      | 493 MB        | 312 MB            | 856 MB      | ~15.4 GB     | 114 t/s     | ✅            |
| **155,904 (≈152K)** | **493 MB**    | **312.52 MB**     | **856 MB**  | **15.4 GB**  | **125 t/s** | ✅ **MAX**    |
| 156,160             | 493 MB        | 313.02 MB         | 857 MB      | ~15.4 GB     | **9 t/s**   | ❌ PCIe cliff |
| 163,840 (160K)      | 516 MB        | 328 MB            | 900 MB      | ~15.4 GB     | 10 t/s      | ❌            |
| 196,608 (192K)      | 612 MB        | 392 MB            | 1,080 MB    | ~15.5 GB     | 8 t/s       | ❌            |
| 262,144 (256K)      | 804 MB        | 520 MB            | 1,440 MB    | **>16.3 GB** | 9 t/s       | ❌ OOM+PCIe   |

> **The cliff is at 312.52 → 313.02 MB CUDA_Host buffer** (a 0.5 MB jump between 155,904 and 156,160 tokens). This corresponds to an internal alignment boundary in llama.cpp's buffer allocation for this architecture.

### Why speed is consistent up to 155,904

- MoE: only 3B active params per token (8 routed + 1 shared from 256 experts)
- KV for MoE is tiny: only 856 MB at 152K (10 attention layers only, not all 40)
- All 41/41 layers on GPU (no PCIe for weight fetches)
- iq4_nl KV = minimal VRAM for KV while maintaining flash-attn compatibility
- CUDA_Host buffer stays ≤312.52 MB → within PCIe bandwidth limits

### 152K WITH vision — VERIFIED ✅ CURRENT DEFAULT

| Metric        | 64K (original) | 128K + vision | **152K + vision**         |
| ------------- | -------------- | ------------- | ------------------------- |
| Avg Gen       | 109.2 t/s      | 119.7 t/s     | **124.7 t/s**             |
| Peak Gen      | 109.5 t/s      | 161.7 t/s     | **166.4 t/s**             |
| Prompt Speed  | ~475 t/s       | ~524 t/s      | **538.4 t/s**             |
| VRAM Used     | ~15.0 GB       | 15.4 GB       | **15.4 GB (245 MB free)** |
| Context       | 64K            | 128K          | **152K (155,904 tokens)** |
| Vision        | ✅             | ✅            | ✅                        |
| CUDA_Host Buf | 136 MB         | 264 MB        | **312.52 MB**             |

**Benchmark file:** `results/benchmark_35b_152k_vis_final_20260304.json`
Use 128K as default. If you need longer context and can tolerate 10x slowdown, use 192K or 256K.

```

---

## 35B-A3B Q3_K_S — Full Verified Benchmark (128K + vision)

**Config:** `llama-server -c 131072 -ngl 99 --flash-attn on -ctk iq4_nl -ctv iq4_nl --mmproj mmproj-35B-F16.gguf`

| Test Type       | Result        |
| --------------- | ------------- |
| Simple avg      | 134.9 t/s     |
| Coding avg      | 109.3 t/s     |
| Reasoning avg   | 109.2 t/s     |
| **Overall avg** | **119.7 t/s** |
| Peak            | 161.7 t/s     |
| Prompt speed    | 523.9 t/s     |
| Total tests     | 15/15 ✅      |
| Date            | 2026-03-04    |

---

## 9B Q4_K_XL — Context Size & KV Quantization Study

### KV Quantization Head-to-Head @ 256K

| KV Type  | KV Size     | Avg Gen      | Peak Gen      | Min Gen      | Prompt      | Verdict       |
| -------- | ----------- | ------------ | ------------- | ------------ | ----------- | ------------- |
| iq4_nl   | 2304 MB     | 89.9 t/s     | 98.0 t/s      | 84.6 t/s     | 691 t/s     | ❌ Slowest    |
| q4_0     | 2304 MB     | 92.3 t/s     | 95.6 t/s      | 90.1 t/s     | 742 t/s     | ⚠️ Mid        |
| **q8_0** | **4352 MB** | **97.5 t/s** | **112.2 t/s** | **90.0 t/s** | **668 t/s** | ✅ **WINNER** |

> **Why q8_0 wins despite being 2× larger:** RTX 5080 has enough VRAM bandwidth that 8-bit reads are faster than dequantizing 4-bit. Higher precision also means less attention error over 256K tokens.

### Final Optimal Config (Port 8003)

```

-c 262144 --flash-attn on -ctk q8_0 -ctv q8_0 --chat-template-kwargs '{"enable_thinking":false}'

````

VRAM: 5.0 GB model + 4.25 GB KV + 0.9 GB mmproj + 0.5 GB compute = **10.6 GB — 5.4 GB headroom**

**Benchmark files:** `results/benchmark_port8003_20260304_195811.json`

---

## All Models — Current Best Results

### 35B-A3B Q3_K_S (Coding) ✅ PORT 8002 — **UPDATED 152K (hard max)**

| Metric | Value |
|--------|-------|
| **Avg Gen Speed** | **124.7 t/s** |
| **Peak Gen Speed** | **166.4 t/s** |
| Prompt Speed | ~538 t/s |
| GPU Layers | **41/41** (all on GPU) |
| KV Cache | iq4_nl — **856 MB** at 152K |
| Context | **155,904 tokens (≈152K)** — 2.4× original 64K |
| Graph Splits | 22 (architecture, NOT CPU offload) |
| Total VRAM | ~15.4 GB (245 MB free) |
| Vision | ✅ (mmproj-35B-F16.gguf, projection_dim=2048) |
| Date | 2026-03-04 |

### 9B Q4_K_XL (Fast Vision) ✅ PORT 8003

| Metric             | Value                                      |
| ------------------ | ------------------------------------------ |
| **Avg Gen Speed**  | **97.5 t/s**                               |
| **Peak Gen Speed** | **112.2 t/s**                              |
| Prompt Speed       | ~668 t/s                                   |
| Context            | **262,144 tokens (256K — full model max)** |
| KV Cache           | q8_0 — 4,352 MB (fastest on SM120)         |
| GPU Layers         | 33/33 (all on GPU)                         |
| Total VRAM         | ~10.6 GB (5.4 GB headroom)                 |
| Vision             | ✅                                         |
| Date               | 2026-03-04                                 |

### 27B Q3_K_S (Quality) ✅ PORT 8004

| Metric             | Value                              |
| ------------------ | ---------------------------------- |
| **Avg Gen Speed**  | **36.3 t/s**                       |
| **Peak Gen Speed** | **37.5 t/s**                       |
| **Min Gen Speed**  | **33.6 t/s**                       |
| Prompt Speed       | ~325 t/s                           |
| GPU Layers         | **65/65** (all on GPU)             |
| KV Cache           | iq4_nl — 1,152 MB at 64K           |
| Graph Splits       | 34 (architecture, NOT CPU offload) |
| Total VRAM         | ~12.9 GB                           |
| Vision             | ✅                                 |
| Date               | 2026-03-04                         |

> **Dense model**: all 27B params activate per token — best quality per generated token. 3x slower than 35B-A3B because of this.

---

## VRAM Budget — Actual Measurements

| Model + Config             | Weights   | KV Cache | mmproj  | RS + Compute | Total                                 | Free                |
| -------------------------- | --------- | -------- | ------- | ------------ | ------------------------------------- | ------------------- |
| 35B Q3_K_S 64K no-vis      | 14,150 MB | 360 MB   | —       | 742 MB       | 15,252 MB                             | ~1,050 MB           |
| 35B Q3_K_S 96K no-vis      | 14,150 MB | 540 MB   | —       | 692 MB       | 15,382 MB                             | ~921 MB             |
| **35B Q3_K_S 128K no-vis** | 14,150 MB | 720 MB   | —       | 744 MB       | **15,614 MB**                         | **689 MB**          |
| **35B Q3_K_S 128K + vis**  | 14,150 MB | 720 MB   | ~880 MB | 744 MB       | **~16,494 MB** → actual **15,783 MB** | **195 MB**          |
| 35B Q3_K_S 192K no-vis     | 14,150 MB | 1080 MB  | —       | 863 MB       | 16,093 MB                             | fits but PCIe-bound |
| 35B Q3_K_S 256K no-vis     | 14,150 MB | 1440 MB  | —       | 1055 MB      | **16,645 MB**                         | **OOM**             |
| 9B Q4_K_XL 256K + vis      | 5,000 MB  | 4,352 MB | 880 MB  | 500 MB       | 10,732 MB                             | 5,571 MB            |
| 27B Q3_K_S 64K + vis       | 11,190 MB | 1,152 MB | 930 MB  | 490 MB       | 13,762 MB                             | 2,541 MB            |

> **Note on 35B 128K+vis measured vs calculated:** Actual VRAM (15,783 MB) is lower than naive sum because WDDM shares some buffers with the display subsystem. The `mmproj` weights partially overlap with the compute buffer reservation.

---

## Models That Don't Work at Full Speed

| Model            | Size    | Issue                                    | Fix                   |
| ---------------- | ------- | ---------------------------------------- | --------------------- |
| 35B-A3B Q4_K_M   | 20.5 GB | Partial CPU offload → 3–4 t/s            | Use Q3_K_S instead ✅ |
| 35B-A3B at 192K+ | any     | PCIe CUDA_Host buffer bottleneck → 9 t/s | Use 128K ✅           |
| 27B Q4_K_M       | 16.7 GB | CUDA OOM                                 | Use Q3_K_S instead ✅ |
| heretic Q4_K_M   | 21.2 GB | Partial offload → ~7 t/s                 | Needs 24GB+ GPU       |

---

## Recommendations

### For RTX 5080 16GB — Run One At A Time

> 35B alone uses 15.4GB at 128K. No two models fit simultaneously.

| Use Case                | Model          | Port | Gen t/s | Context  | Notes                                      |
| ----------------------- | -------------- | ---- | ------- | -------- | ------------------------------------------ |
| **Coding** | 35B-A3B Q3_K_S | 8002 | **124** | **152K** | MoE, best speed + quality, 2.4x more context |
| **Vision / chat**       | 9B Q4_K_XL     | 8003 | **97**  | **256K** | Full model context, fast                   |
| **Quality / long-form** | 27B Q3_K_S     | 8004 | **36**  | 64K      | Dense, best quality per token              |

```bat
start_servers_speed.bat coding    REM 35B → port 8002, 128K, vision
start_servers_speed.bat vision    REM 9B  → port 8003, 256K
start_servers_speed.bat quality   REM 27B → port 8004, 64K
````

### For 24GB+ GPU (Future Upgrade)

| Use Case     | Model                   | Expected Speed     |
| ------------ | ----------------------- | ------------------ |
| Coding       | 35B-A3B Q4_K_M          | ~80–90 t/s         |
| Long context | 35B-A3B Q3_K_S          | 256K at full speed |
| Uncensored   | heretic Q4_K_M          | ~50 t/s            |
| Multi-server | 35B + 9B simultaneously | Finally possible   |

---

## Configuration Files

| File                        | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `config/servers.yaml`       | Unified server configuration                  |
| `start_servers_speed.bat`   | Speed profile startup (coding/vision/quality) |
| `tests/simple_benchmark.py` | Single-server benchmark                       |
| `tests/health_check.py`     | Server health monitoring                      |

---

_Updated: March 4, 2026_
_Hardware: RTX 5080 16GB (SM120, GDDR7, 960 GB/s), Ryzen 7 9800X3D, 96GB RAM, PCIe 5.0 x16_
