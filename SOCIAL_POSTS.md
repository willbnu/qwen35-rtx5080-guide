# Social Media Posts — VISION + BREAKTHROUGH EDITION

---

## 📱 Reddit (r/LocalLLaMA)

**Title:**

```
[BENCHMARK] 120 t/s with 120K context AND vision enabled on 16GB GPUs. Found the exact token limit (155,904 theoretical, 120K practical). Here's the config.
```

**Body:**

```
After days of benchmarking Qwen3.5-35B-A3B on my RTX 5080 16GB, I cracked it.

**120 t/s generation. 120K context. Vision ENABLED. All on 16GB VRAM.**

Here's exactly what you need.

---

## The Numbers

| Metric | Value |
|--------|-------|
| Generation speed | **~120 t/s** |
| Prompt ingestion | **~500 t/s** |
| Context window | **120K tokens (155K theoretical max)** |
| **Vision/Multimodal** | **✅ Working at FULL SPEED** |
| VRAM used | **~15.4 GB** |
| All 41 layers | **100% on GPU** |

---

## 🖼️ Vision Works At Full Speed

This is the killer feature. You get:

- 📸 Image analysis
- 📄 PDF reading
- 🖥️ Screenshot understanding
- 📊 Chart/diagram interpretation
- 🎥 Video frame analysis

**All at 120 t/s.** No speed penalty.

Most local LLM setups sacrifice speed when you enable vision. This config gives you BOTH. The mmproj adds ~0.9 GB VRAM but zero slowdown.

---

## The Discovery

There's a HARD CLIFF at exactly 155,904 tokens:

```

✅ 155,904 tokens → 125 t/s (theoretical max)
✅ 120,000 tokens → 120 t/s (RECOMMENDED for Windows)
❌ 156,160 tokens → 9 t/s (93% slower!)

````

256 more tokens = 10× slower. It's a PCIe buffer alignment issue, NOT VRAM overflow. Model still fits.

**For Windows users:** I recommend 120K context. It gives you ~1GB VRAM headroom for the OS and other apps, with only 4% speed loss vs the theoretical max.

**The fix:** Set `-c 122880` (120K) for stable Windows usage.

---

## The Magic Config

```bash
# CRITICAL FLAGS for 120 t/s:
--parallel 1              # ← 10x speedup (GDN hybrid arch needs this!)
--reasoning-budget 0      # ← disable thinking for faster response

# Full config:
-m Qwen3.5-35B-A3B-Q3_K_S.gguf
--mmproj mmproj-35B-F16.gguf    # ← vision enabled
-c 122880 -ngl 99 --flash-attn on
-ctk iq4_nl -ctv iq4_nl
--parallel 1
--reasoning-budget 0
--temp 0.6 --top-p 0.95 --top-k 20
````

That's it. 120 t/s. 120K context. Vision working. All GPU.

---

## ⚠️ CRITICAL: --parallel 1

This flag is **MANDATORY** for the 35B-A3B model. Without it:

- Default: `--parallel auto` (4 slots)
- Result: **9 t/s** instead of **120 t/s**

The GDN (Gated DeltaNet) hybrid architecture allocates 4× larger recurrent state buffers by default. Use `--parallel 1` always.

---

## What You Get (Full Repo)

✅ **Copy-paste configs** — coding (35B), vision (9B), quality (27B)  
✅ **Vision test scripts** — verify multimodal works  
✅ **Windows launchers** — one command to start  
✅ **Python benchmarks** — verify speeds yourself  
✅ **SM120 native build included** — RTX 5080/5090 get max speed  
✅ **Full technical writeup** — why the cliff exists

**Repo:** https://github.com/willbnu/Qwen-3.5-16G-Vram-Local

---

## Works On All 16GB Cards

| GPU               | Est. Speed         |
| ----------------- | ------------------ |
| RTX 5080          | 120 t/s (verified) |
| RTX 4080          | ~90 t/s            |
| RTX 4070 Ti Super | ~80 t/s            |
| RTX 4060 Ti 16GB  | ~65 t/s            |
| RTX 3060 Ti 16GB  | ~55 t/s            |

Same 155,904 token limit applies to all. Use 120K for stable Windows usage.

---

Grab the repo, start the server, throw an image at it. Enjoy 120 t/s local multimodal AI.

https://github.com/willbnu/Qwen-3.5-16G-Vram-Local

```

---

## 🐦 X / Twitter Thread

**Post 1:**
```

I cracked it.

120 t/s generation. 120K context. Vision ENABLED.

All on 16GB VRAM. All GPU. Zero compromise.

Here's exactly how 👇

```

**Post 2:**
```

First — the vision breakthrough.

Most local LLMs slow down when you enable multimodal.

NOT this setup.

🖼️ Images
📄 PDFs  
🖥️ Screenshots
📊 Charts

All working at 120 t/s. No speed penalty.

This is rare.

```

**Post 3:**
```

The token limit discovery:

155,904 → 125 t/s (theoretical max)
120,000 → 120 t/s (RECOMMENDED)
156,160 → 9 t/s ❌

256 more tokens = 93% slower.

For Windows: use 120K context. Only 4% slower but stable with other apps.

```

**Post 4:**
```

⚠️ CRITICAL FLAG:

--parallel 1

Without it: 9 t/s
With it: 120 t/s

The 35B-A3B uses GDN hybrid architecture. Default parallel=4 creates 4× larger buffers = 10× slower.

Always add --parallel 1

```

**Post 5:**
```

What you get:

⚡ ~120 t/s generation
📥 ~500 t/s prompts
🧠 120K tokens context (155K max)
🖼️ Vision at FULL SPEED
💾 ~15.4 GB VRAM

All 41 layers on GPU. Zero offload.

```

**Post 6:**
```

The config:

--parallel 1 ← CRITICAL
--reasoning-budget 0
-m Qwen3.5-35B-A3B-Q3_K_S.gguf
--mmproj mmproj-35B-F16.gguf
-c 122880 -ngl 99
--flash-attn on
-ctk iq4_nl -ctv iq4_nl

Copy-paste. Done.

```

**Post 7:**
```

Full repo with:

✅ 3 server profiles
✅ Vision test scripts  
✅ Benchmarks
✅ SM120 native build included

Grab it:
https://github.com/willbnu/Qwen-3.5-16G-Vram-Local

Works on 3060 Ti through 5080.

#LocalLLM #Multimodal

```

---

## 🟠 Hacker News

**Title:**
```

Show HN: Qwen3.5-35B-A3B on 16GB GPU – 120 t/s with 120K context AND vision enabled, plus the exact token cliff I discovered

```

**Body:**
```

Hi HN,

After weeks of systematic benchmarking, I've cracked the optimal configuration for Qwen3.5-35B-A3B on consumer 16GB GPUs.

The headline: **120 t/s generation, ~500 t/s prompt ingestion, 120K context, vision enabled — all on a single 16GB card.**

---

## The Vision Breakthrough

Here's what makes this special: most local LLM setups sacrifice speed when you enable multimodal. Not this one.

You get:

- Image analysis
- PDF reading
- Screenshot understanding
- Chart/diagram interpretation

All at 120 t/s. The mmproj adds ~0.9 GB VRAM overhead but zero speed penalty.

This is genuinely useful for coding workflows — paste a screenshot of an error, a diagram of an architecture, or a PDF spec, and the model understands it at full inference speed.

---

## The Token Limit Discovery

There's a hard performance cliff at exactly 155,904 tokens:

| Context | Speed   |
| ------- | ------- |
| 155,904 | 125 t/s |
| 156,160 | 9 t/s   |

256 more tokens = 10× slowdown.

This is NOT a VRAM issue. The model fits at 192K and 256K too. It's a CUDA_Host compute buffer alignment boundary (~312.5 MB) that saturates PCIe bandwidth on this hybrid MoE architecture.

**For Windows users:** I recommend 120K context (122,880 tokens). This gives ~1GB VRAM headroom for the OS, with only 4% speed loss vs the theoretical max.

---

## ⚠️ Critical Flag: --parallel 1

This is mandatory for the 35B-A3B model:

- Default: `--parallel auto` (4 slots) → 9 t/s
- Fixed: `--parallel 1` → 120 t/s

The GDN hybrid architecture allocates recurrent state buffers per parallel slot. 4 slots = 4× buffers = 10× slower.

---

## The Optimal Config

```
-m Qwen3.5-35B-A3B-Q3_K_S.gguf
--mmproj mmproj-35B-F16.gguf
-c 122880 -ngl 99 --flash-attn on
-ctk iq4_nl -ctv iq4_nl
--parallel 1
--reasoning-budget 0
--temp 0.6 --top-p 0.95 --top-k 20
```

Results:

- ~120 t/s generation
- ~500 t/s prompt ingestion
- 120K tokens context (155K theoretical max)
- Vision working at full speed
- ~15.4 GB VRAM, all 41 layers on GPU

---

## Why "35B" Is Faster Than 27B

Mixture-of-Experts: 256 experts, only 8 routed + 1 shared activate per token. Effective compute ~3B parameters per forward pass.

That's why a "35B" model at 14.2 GB runs 3.4× faster than a dense 27B.

---

## What I Built

Complete drop-in repo:

- Three server profiles: coding (35B), vision (9B), quality (27B)
- Windows launchers — one command
- Python benchmark suite
- Vision test scripts
- SM120 native build included for RTX 5080/5090
- Full technical writeup

https://github.com/willbnu/Qwen-3.5-16G-Vram-Local

---

## Compatibility

Tested on RTX 5080 16GB. Works on any NVIDIA 16GB:

- RTX 4080: ~90 t/s
- RTX 4070 Ti Super: ~80 t/s
- RTX 4060 Ti 16GB: ~65 t/s
- RTX 3060 Ti 16GB: ~55 t/s

The 155,904 token cliff is architecture-dependent, not GPU-specific.

---

Hardware: RTX 5080 16GB, Ryzen 7 9800X3D, 96GB DDR5
Software: llama.cpp (SM120 native build)

```

---

## 🟣 LinkedIn (Bonus)

**Post:**
```

Most local LLMs slow down when you enable vision.

I found a setup that DOESN'T.

After weeks of benchmarking Qwen3.5-35B-A3B on my RTX 5080 16GB:

→ 120 t/s generation
→ 120K context
→ Vision ENABLED at full speed

Images, PDFs, screenshots, diagrams — all processed at 120 t/s with zero penalty.

This is genuinely useful. I can paste error screenshots, architecture diagrams, or spec PDFs directly into my coding workflow.

I also discovered the exact token limit:
• 155,904 tokens = 125 t/s (theoretical max)
• 120,000 tokens = 120 t/s (RECOMMENDED for Windows)
• 156,160 tokens = 9 t/s

A 256-token difference = 93% speed drop. It's a PCIe buffer issue, not VRAM.

⚠️ Critical tip: Use `--parallel 1` flag. Without it, you get 9 t/s instead of 120 t/s. The hybrid architecture needs single-slot inference.

I've open-sourced everything:
✅ Optimal configs
✅ Vision test scripts
✅ One-command launchers
✅ Full benchmarks
✅ SM120 native build included

Repo: https://github.com/willbnu/Qwen-3.5-16G-Vram-Local

Works on RTX 3060 Ti through 5080. Same results.

The future of AI is local, multimodal, and fast.

#AI #MachineLearning #LLM #Multimodal #VisionAI #NVIDIA

```

---

## 🔥 Key Messages to Emphasize

| What | Why It Matters |
|------|----------------|
| **Vision at full speed** | Rare — most setups slow down |
| **120 t/s + 120K + Vision** | Three things at once, not pick two |
| **Images, PDFs, screenshots** | Concrete use cases |
| **Zero penalty for vision** | The breakthrough |
| **--parallel 1 flag** | CRITICAL — 10x speedup |
| **120K practical / 155K max** | Practical advice for Windows |

---

## ⏰ Post Order

1. **Reddit** → Core audience, builds credibility
2. **Hacker News 2-3 hrs later** → West coast morning
3. **X/Twitter throughout** → Retweets amplify
4. **LinkedIn optional** → Professional network
