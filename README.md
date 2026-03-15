---
title: Anvesha AI
emoji: ⚡
colorFrom: yellow
colorTo: purple
sdk: docker
app_port: 3000
pinned: false
---

# Anvesha AI

Anvesha AI is a sovereign Indian search engine powered by open-source technologies and cutting-edge Indian LLMs, designed with a focus on privacy and local relevance. 

## Core Capabilities

- **Sutra Intelligence Pipeline:** A highly optimized dual-model approach utilizing Sarvam AI. A **Sarvam 30B Router** decomposes user queries into multi-faceted parallel searches, while the powerful **Sarvam 105B Synthesizer** distills the aggregated results into a rich, structured "Sutra" format with inline `.gov.in` citations and dynamic follow-up logic.
- **Multimodal Search:** Fully integrated Voice-in/Voice-out experience utilizing **Saaras V3** for highly accurate Indic speech-to-text recognition and **Bulbul V3** for natural, dynamic text-to-speech audio playback of synthesized search responses.

## Architecture

- **Frontend:** Next.js (Standalone, Tailwind Typography, Sliding Source Panels)
- **Backend:** FastAPI (Gunicorn + Uvicorn workers)
- **Search Engine:** SearxNG (Optimized for India)
- **Deployment:** Unified Monolith container deployed on Hugging Face Spaces

## Legal & Contribution

We welcome community contributions to improve the sovereign search experience! If you're interested in refining the Sutra Pipeline or expanding multimodal capabilities, feel free to open a Pull Request.

**Ownership & License Statement:**
Anvesha AI is a proprietary project of Bhishaj Technologies. While the code is visible for contribution, all publishing and distribution rights belong exclusively to Gaurav. Please see the `LICENSE` file for more details.
