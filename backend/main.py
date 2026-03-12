import asyncio
import logging
from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from typing import Optional

from config import get_settings
from sarvam_service import (
    route_query,
    synthesize_response,
    speech_to_text,
    text_to_speech,
)

# ── Logging ────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("anvesha.api")

# ── App ────────────────────────────────────────────────────────
settings = get_settings()
app = FastAPI(
    title="Anvesha AI Backend",
    description="Sovereign Indian search & intelligence API",
    version="0.4.0",
)

# CORS: allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──────────────────────────────────

class AskRequest(BaseModel):
    query: str
    region: str = "in-en"


class Citation(BaseModel):
    index: int
    title: str
    url: str
    is_gov: bool = False


class SutraResponse(BaseModel):
    summary: str
    citations: list[Citation] = []


class AskResponse(BaseModel):
    sutra: SutraResponse
    raw_results: list[dict] = []
    routed_queries: list[str] = []


class TTSRequest(BaseModel):
    text: str
    language: str = "en-IN"
    speaker: str = "meera"


class TTSResponse(BaseModel):
    audio_base64: str


class STTResponse(BaseModel):
    text: str


# ── Helpers ────────────────────────────────────────────────────

async def _searxng_search(client: httpx.AsyncClient, query: str, region: str) -> list[dict]:
    """Execute a single SearxNG search and return results."""
    try:
        response = await client.get(
            f"{settings.SEARXNG_BASE_URL}/search",
            params={
                "q": query,
                "format": "json",
                "pageno": 1,
                "time_range": "",
                "language": region.split("-")[1] if "-" in region else "en",
                "safesearch": 0,
            },
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        logger.warning(f"SearxNG search failed for '{query}': {e}")
        return []


def _deduplicate_results(results: list[dict]) -> list[dict]:
    """Remove duplicate results by URL, preserving order."""
    seen_urls = set()
    unique = []
    for r in results:
        url = r.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique.append(r)
    return unique


# ── Endpoints ──────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Welcome to Anvesha AI Backend", "version": "0.4.0"}


@app.get("/search")
async def search(
    q: str = Query(..., description="Search query"),
    region: Optional[str] = Query("in-en", description="Search region"),
):
    """Direct SearxNG pass-through (Week 1 legacy endpoint)."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.SEARXNG_BASE_URL}/search",
                params={
                    "q": q,
                    "format": "json",
                    "pageno": 1,
                    "time_range": "",
                    "language": region.split("-")[1] if "-" in region else "en",
                    "safesearch": 0,
                },
                timeout=15.0,
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    🧠 The Intelligence Pipeline — Week 3

    Full pipeline:
    1. Router (Sarvam 30B) decomposes the user query into optimized searches
    2. Fan-out SearxNG searches for each optimized query
    3. Deduplicate results
    4. Synthesizer (Sarvam 105B) generates a cited Sutra response
    5. Return the Sutra + raw results
    """
    logger.info(f"🔍 ASK request: '{request.query}'")

    # Step 1: Route the query
    routed_queries = await route_query(request.query)
    logger.info(f"Routed queries: {routed_queries}")

    # Step 2: Fan-out SearxNG searches
    async with httpx.AsyncClient() as client:
        tasks = [
            _searxng_search(client, q, request.region)
            for q in routed_queries
        ]
        all_results = await asyncio.gather(*tasks)

    merged = []
    for result_list in all_results:
        merged.extend(result_list)

    # Step 3: Deduplicate
    unique_results = _deduplicate_results(merged)
    logger.info(f"{len(merged)} total → {len(unique_results)} unique results")

    # Step 4: Synthesize
    sutra_data = await synthesize_response(request.query, unique_results)

    # Step 5: Return
    sutra = SutraResponse(
        summary=sutra_data.get("summary", ""),
        citations=[
            Citation(
                index=c.get("index", i + 1),
                title=c.get("title", ""),
                url=c.get("url", ""),
                is_gov=c.get("is_gov", False),
            )
            for i, c in enumerate(sutra_data.get("citations", []))
        ],
    )

    return AskResponse(
        sutra=sutra,
        raw_results=unique_results[:20],
        routed_queries=routed_queries,
    )


# ── Voice Endpoints — Week 4 ──────────────────────────────────

@app.post("/voice-to-text", response_model=STTResponse)
async def voice_to_text(
    file: UploadFile = File(..., description="Audio file (WAV, MP3, WebM, OGG)"),
    language: str = Query("en-IN", description="Language code (e.g. hi-IN, en-IN)"),
):
    """
    🎙️ Speech-to-Text — Sarvam Saaras V3

    Accepts an audio file upload and returns the transcribed text.
    """
    logger.info(f"🎙️ STT request: {file.filename} ({language})")

    audio_bytes = await file.read()
    if not audio_bytes:
        return STTResponse(text="")

    try:
        transcript = await speech_to_text(audio_bytes, language_code=language)
        logger.info(f"✅ STT complete: '{transcript[:60]}...'")
        return STTResponse(text=transcript)
    except Exception as e:
        logger.error(f"STT endpoint error: {e}")
        return STTResponse(text=f"[Voice recognition error: {str(e)}]")


@app.post("/text-to-voice", response_model=TTSResponse)
async def text_to_voice(request: TTSRequest):
    """
    🔊 Text-to-Speech — Sarvam Bulbul V3

    Accepts text and returns base64-encoded WAV audio.
    """
    logger.info(f"🔊 TTS request: '{request.text[:60]}...' ({request.language})")

    if not request.text.strip():
        return TTSResponse(audio_base64="")

    try:
        audio_b64 = await text_to_speech(
            text=request.text,
            target_language_code=request.language,
            speaker=request.speaker,
        )
        logger.info(f"✅ TTS complete: {len(audio_b64)} base64 chars")
        return TTSResponse(audio_base64=audio_b64)
    except Exception as e:
        logger.error(f"TTS endpoint error: {e}")
        return TTSResponse(audio_base64="")
