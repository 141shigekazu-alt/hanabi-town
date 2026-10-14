---
license: cc-by-4.0
library_name: onnx
tags:
  - music-structure-analysis
  - music-information-retrieval
  - audio
  - onnx
  - onnxruntime-web
  - webgpu
pipeline_tag: audio-classification
---

# LinkSeg 7-class — ONNX (onnxruntime-web)

An [onnxruntime-web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)-friendly
port of the pretrained **LinkSeg** 7-class music-structure / section-labeling model, for running
music structure analysis **entirely in the browser** (WebGPU-primary, WASM fallback).

- **npm package (recommended):** [`linkseg-web`](https://www.npmjs.com/package/linkseg-web) —
  `LinkSeg.load()` fetches this file (OPFS-cached) and runs the full pipeline.
- **Source / demo:** https://github.com/elicwhite/LinkSeg-web

## Attribution & license (CC-BY 4.0)

This model — architecture and learned weights — is the work of the LinkSeg authors and is licensed
**Creative Commons Attribution 4.0 International (CC-BY 4.0)**. If you use or redistribute it you
**must** preserve this attribution:

> M. Buisson, B. McFee, S. Essid — *Using Pairwise Link Prediction and Graph Attention Networks for
> Music Structure Analysis*, ISMIR 2024.

- Upstream project: https://github.com/morgan76/LinkSeg
- License: https://creativecommons.org/licenses/by/4.0/

The ONNX port (DGL graph ops rewritten as dense-tensor equivalents; mel front-end, `cdist`,
GroupNorm, EMA adaptive-pool and batch-stat BatchNorm decomposed to ONNX-standard ops) does **not**
modify the learned parameters and was validated byte-exact against the original PyTorch/DGL model.
The port/glue code (the `linkseg-web` package) is MIT; **the model weights remain CC-BY 4.0.**

## What it is

- **Format:** ONNX, opset 17, dynamic batch axis `N`. ~1.5 MB.
- **Input** `mel`: float32 `(N, 1, 64, 64)` — per-beat log-mel windows. torchaudio
  `MelSpectrogram(sr=22050, n_fft=1024, hop=256, n_mels=64, f_min=0, f_max=11025, power=2)` +
  `AmplitudeToDB(power)`, computed on the client (STFT stays out of the graph). `N` = number of
  (requantized) beats; needs ≥ 4.
- **Outputs:**
  - `bound` `(N-1,)` — per-adjacent-beat boundary activations (sigmoid).
  - `label` `(N, 7)` — class logits over {silence, verse, chorus, intro, outro, inst, bridge}.
  - `apred` `(N, N, 3)` — pairwise link logits (not used by the default decoder).
- **Decoding** (peak-pick boundaries + majority-vote labels) runs in JS.

It runs on the **full mix** — no source separation needed — plus beat times from any beat tracker
(LinkSeg is robust to the beat source).

## Usage

```js
import {LinkSeg} from 'linkseg-web';

const model = await LinkSeg.load(); // downloads this ONNX, caches in OPFS; WebGPU→WASM
const sections = await model.analyze({
  audio,        // Float32Array, mono (resampled to 22050 internally if needed)
  sampleRate,   // e.g. 44100
  beats,        // number[] beat times in seconds (your beat tracker)
});
// → [{ start, end, label }, ...]
```

WebGPU computes this model in fp32 and tracks the PyTorch reference tightly; WebGPU and WASM decode
identically, so auto-fallback to WASM is safe.
