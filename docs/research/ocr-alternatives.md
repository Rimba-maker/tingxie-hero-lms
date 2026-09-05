# Research note: Chinese handwriting OCR alternatives to Gemini

**Date:** 2026-09-05
**Prompted by:** user asking for a deep web/GitHub search for repos that could "upgrade the whole
system," specifically mentioning OCR / Chinese handwriting recognition.
**Verdict: do not switch.** Recorded here so this isn't re-researched from scratch next time, and
so the reasoning survives even if this exact conversation doesn't.

---

## What was actually asked (re-grounding)

`docs/reference/Technical Assignment...pdf`, Evaluation Focus section, verbatim:

> The accuracy of word recognition is **not** important for this task.

and Goals table in `PRD_TingXieHero.md` §2:

> **Explicitly NOT a goal:** AI grading accuracy. The client states this directly — the flow and
> architecture matter, not whether Gemini correctly reads the handwriting.

Any OCR-accuracy improvement is optimizing a criterion the client explicitly excluded from
evaluation. That's the lens every option below was judged through.

---

## Options researched

### 1. Specialized HCCR (Handwritten Chinese Character Recognition) repos — CASIA-HWDB-trained

- [intel/handwritten-chinese-ocr-samples](https://github.com/intel/handwritten-chinese-ocr-samples)
- [chongyangtao/DeepHCCR](https://github.com/chongyangtao/DeepHCCR) — GoogLeNet/AlexNet, Caffe
- [pavlo-melnyk/offline-HCCR](https://github.com/pavlo-melnyk/offline-HCCR) — 97.61% claimed accuracy, ~24.9MB model
- [peterWon/CASIA-HWDB-Recognition](https://github.com/peterWon/CASIA-HWDB-Recognition) — 95-97% claimed accuracy

**Why not:** these are single-character *classifiers*, not worksheet-photo pipelines.

- They expect an image of **one already-cropped character**, not a full Tian Zige worksheet photo.
  We'd have to build grid detection + perspective correction + per-cell cropping ourselves — a
  bigger, harder computer-vision project than the model itself, and one Gemini currently does for
  free as part of a single vision call.
- No "photo in, JSON out" API — this is academic reproduction code (2017-2020, several still on
  Caffe), not a package.
- Requires a separate Python/PyTorch/Caffe inference service — our stack is Next.js on Vercel
  serverless. That's new infrastructure, not an "equivalent substitution" (the assignment's own
  phrase, PDF §4 — substitutions are fine "as long as the core functionality remains identical,"
  and *more* moving parts for an unevaluated criterion isn't that).

### 2. PaddleOCR-VL (Baidu, 2026, 0.9B-param vision-language model)

- Paper: [PaddleOCR-VL: Boosting Multilingual Document Parsing via a 0.9B Ultra-Compact
  Vision-Language Model](https://arxiv.org/pdf/2510.14528)
- Reported result: best-in-class edit distance (0.034) on Chinese handwriting in the
  Ocean-OCR-Bench benchmark — genuinely the most technically interesting option found.

**Why not:** it's an open-weight model you self-host, not a hosted API. Adopting it means standing
up GPU/CPU inference infrastructure outside Vercel (a HF Inference Endpoint, Modal, or a dedicated
VM) — real infrastructure cost and a new deployment target, for a criterion ("accuracy") the client
said isn't evaluated. If this were a real product roadmap item post-assignment, it'd be worth a
prototype; for this assignment, it's the wrong trade.

### 3. Gemini 3 Pro instead of the current `gemini-flash-latest`

- [Best Handwriting OCR 2026: GPT, Claude, Gemini and TrOCR Compared](https://www.codesota.com/ocr/best-for-handwriting) — reports Gemini 3 Pro as the strongest model on handwritten documents among those compared (best character error rate, 28.5%, on a general handwriting benchmark — not Chinese-specific).

**The one option with no new infrastructure** — it's a one-line model-name change. Considered and
set aside anyway: Pro is slower and costs more per call than Flash, the current Flash-based
pipeline already works end-to-end (verified repeatedly this session, including the
`WorksheetOverlay` red-pen feature), and — same as above — the accuracy this would improve isn't
what's being evaluated. Worth revisiting only if the user wants to spend real money/latency on
better real-world grading quality post-submission, not for the assignment itself.

---

## Bottom line

Nothing found is worth integrating into this codebase for this assignment. The current
Gemini-based pipeline (`src/entities/submission/api/gradeWithGemini.ts`) already satisfies what's
actually evaluated — the photo → backend → correction → frontend-overlay flow — end-to-end, and
every alternative researched trades real infrastructure/complexity for an accuracy gain the client
explicitly excluded from grading.

**If this ever needs revisiting:** PaddleOCR-VL is the one worth a second look, and only in a
context where OCR accuracy is genuinely a product priority (i.e., past this assignment, in a real
product roadmap) and someone's willing to own a self-hosted inference deployment.

Sources (from the original search):
- [handwriting-ocr · GitHub Topics](https://github.com/topics/handwriting-ocr)
- [Yuliang-Liu/AWESOME-OCR-LLM](https://github.com/yuliang-liu/awesome-ocr-llm)
- [8 Top Open-Source OCR Models Compared: A Complete Guide](https://modal.com/blog/8-top-open-source-ocr-models-compared)
