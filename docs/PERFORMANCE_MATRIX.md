# Performance Comparison Matrix - RTX 5080 16GB

## Test Date: March 5, 2026 (updated with --parallel 1 findings)

---

## ⚠️ CRITICAL: `--parallel 1` Required for 35B-A3B

The 35B-A3B uses a Gated DeltaNet (GDN) hybrid architecture. The default `n_parallel=auto` (4 slots) allocates 4× larger recurrent state buffers, causing **10× slowdown**. Always use `--parallel 1`.

---

## Model Performance Summary — Current Best (Verified)

| Model          | Quant   | Size    | Vision | GPU Layers | Context  | Gen t/s      | Prompt t/s | Notes                         |
| -------------- | ------- | ------- | ------ | ---------- | -------- | ------------ | ---------- | ----------------------------- |
| **35B-A3B** ✅ | Q3_K_S  | 14.2 GB | ✅     | 41/41      | **152K** | **~125 t/s** | ~538 t/s   | `--parallel 1` required       |
| **9B**         | Q4_K_XL | 5.7 GB  | ✅     | 33/33      | **256K** | **~97 t/s**  | ~668 t/s   | q8_0 KV, full model context   |
| **27B**        | Q3_K_S  | 11.4 GB | ✅     | 65/65      | **96K**  | **~46 t/s**  | ~300 t/s   | Dense, best quality per token |
| heretic-v1     | Q4_K_M  | 21.2 GB | ✅     | 25/41      | 32K      | ~7 t/s ⚠️    | ~66 t/s    | Decensored, VRAM-limited      |

### Historical (superseded — shown for comparison)

| Model   | Quant  | Config                            | Gen t/s | Why Slow                      |
| ------- | ------ | --------------------------------- | ------- | ----------------------------- |
| 35B-A3B | Q4_K_M | 64K, no vision, no --parallel 1   | ~70 t/s | Q4_K_M too large, CPU offload |
| 35B-A3B | Q3_K_S | 32K, vision, 30/40 layers, no -p1 | ~35 t/s | Partial GPU + wrong parallel  |
| 35B-A3B | Q3_K_S | 128K, vision, default parallel    | ~9 t/s  | Missing `--parallel 1`        |

### heretic-v1 Notes

- **Decensored**: 11/100 refusals vs 92/100 original
- **Quality**: KL divergence 0.0366 (minimal loss)
- **Speed**: Limited by VRAM (21.2 GB > 16 GB)
- **Best for**: Uncensored tasks (accept slower speed)

---

## Key Findings

### 35B-A3B Architecture Advantage

- **MoE (Mixture of Experts)**: 35B total, only 3B active per token
- **Why it's fast**: Only 8 routed + 1 shared expert activated
- **n_embd**: 2048 (smaller than 27B's 5120)
- **Layers**: 40 (10 attention + 30 GDN recurrent)
- **MUST use `--parallel 1`** — default auto causes 10× slowdown due to GDN RS buffer scaling

### Graph Splits Clarification

- Graph splits in logs do **NOT** always mean CPU offload
- For hybrid-attention models (GDN + MoE), splits = 2–34 are **normal architecture splits**, all on GPU
- 35B-A3B shows `graph splits = 22` at full speed (125 t/s) — this is expected
- Actual CPU offload shows as `offloaded X/Y layers` with X < Y in the startup logs

### Vision Compatibility

| Model   | n_embd | mmproj              | projection_dim | Match |
| ------- | ------ | ------------------- | -------------- | ----- |
| 35B-A3B | 2048   | mmproj-35B-F16.gguf | 2048           | ✅    |
| 27B     | 5120   | mmproj-27B-F16.gguf | 5120           | ✅    |
| 9B      | 4096   | mmproj-F16.gguf     | 4096           | ✅    |

---

## Recommended Configurations

> **⚠️ One server at a time.** The 35B alone uses 15.4 GB — no two models fit in 16 GB simultaneously.

### Coding (Best Overall)

```
Port 8002: 35B-A3B Q3_K_S + Vision
           - 152K context, ~125 t/s, --parallel 1
           - iq4_nl KV cache (856 MB)
           - Vision enabled (mmproj-35B-F16.gguf)
```

### Fast Vision / Long Context

```
Port 8003: 9B Q4_K_XL + Vision
           - 256K context (full model max), ~97 t/s
           - q8_0 KV cache (fastest on SM120)
```

### Quality / Long-Form

```
Port 8004: 27B Q3_K_S + Vision
           - 96K context, ~46 t/s
           - Dense model, best quality per token
           - --parallel 1 recommended
```

Switch between profiles with `start_servers_speed.bat coding|vision|quality`.

---

## Use Case Recommendations

| Task             | Best Model        | Speed       | Context  | Why                                        |
| ---------------- | ----------------- | ----------- | -------- | ------------------------------------------ |
| **Coding**       | 35B-A3B Q3_K_S    | **125 t/s** | 152K     | MoE, fastest + vision, `--parallel 1`      |
| **Fast Vision**  | 9B Q4_K_XL        | **97 t/s**  | **256K** | Full model context, fast vision            |
| **Quality/Long** | 27B Q3_K_S        | **46 t/s**  | 96K      | Dense, all 27B params active, best quality |
| **Long Context** | 9B Q4_K_XL        | **97 t/s**  | **256K** | 256K full model max                        |
| **Uncensored**   | heretic-v1 Q4_K_M | ~7 t/s ⚠️   | 32K      | Decensored (11% refusals), needs 24GB+ GPU |

---

## KV Cache Optimization

### MoE Models (35B-A3B) — use iq4_nl

```bash
--flash-attn on -ctk iq4_nl -ctv iq4_nl --parallel 1
```

### MoE vs Dense KV Strategy

| Model type    | Best KV  | KV @ Max Context | Why                                                 |
| ------------- | :------: | :--------------: | --------------------------------------------------- |
| MoE (35B-A3B) | `iq4_nl` |  856 MB @ 152K   | Only 10 attention layers → small KV → dequant wins  |
| Dense (9B)    |  `q8_0`  | 4,352 MB @ 256K  | 33 attention layers → large KV → bandwidth wins     |
| Dense (27B)   | `iq4_nl` |  1,728 MB @ 96K  | 65 layers but VRAM-constrained → iq4_nl enables 96K |

> **Never mix K and V quant types.** Always set `-ctk` and `-ctv` to the same value.

---

## Unsloth Recommended Settings

### For Coding (Non-Thinking Mode)

```bash
--temp 0.6 --top-p 0.95 --top-k 20
--presence-penalty 0.0
--parallel 1  # CRITICAL for 35B-A3B
--chat-template-kwargs '{"enable_thinking":false}'
```

### For General Tasks (Non-Thinking Mode)

```bash
--temp 0.7 --top-p 0.8 --top-k 20
--presence-penalty 1.5
--chat-template-kwargs '{"enable_thinking":false}'
```

---

## ~~RTX-STone~~ ❌ NOT RECOMMENDED

Previously listed as a potential 40-60% performance boost. **DO NOT INSTALL.**

- No GitHub repository (404 error)
- Requires Python 3.10-3.11 (incompatible with 3.12)
- 8 GB package size (suspicious for a driver patch)
- Official PyTorch nightly already supports SM120
- **Security risk** — unverified binary package

The actual performance gains came from `--parallel 1` (10×) and proper config tuning, not external tools.

---

_Updated: March 5, 2026_
_Hardware: RTX 5080 16GB, Ryzen **7** 9800X3D (NOT Ryzen 9), 96GB RAM_
