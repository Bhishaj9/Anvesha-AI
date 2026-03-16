"""
sarvam_service.py — Sarvam AI Integration for Anvesha AI

Router      (Sarvam 30B):   Decomposes a user query into optimized SearxNG searches.
Synthesizer (Sarvam 105B):  Generates a cited "Sutra" response from search results.
STT         (Saaras V3):    Speech-to-text for voice input.
TTS         (Bulbul V3):    Text-to-speech for audio output.
"""

import base64
import json
import logging
import re
import httpx
from openai import AsyncOpenAI
from config import get_settings

logger = logging.getLogger("anvesha.sarvam")

# ─────────────────────────────────────────────────────────────────
# Client factory
# ─────────────────────────────────────────────────────────────────

def _get_client() -> AsyncOpenAI:
    """Create an AsyncOpenAI client pointed at the Sarvam API."""
    settings = get_settings()
    if not settings.SARVAM_API_KEY:
        raise ValueError(
            "SARVAM_API_KEY is not set. "
            "Please add it to your .env file (see .env.template)."
        )
    return AsyncOpenAI(
        api_key=settings.SARVAM_API_KEY,
        base_url=settings.SARVAM_API_BASE,
    )


# ─────────────────────────────────────────────────────────────────
# 1. THE ROUTER — Sarvam 30B
# ─────────────────────────────────────────────────────────────────

ROUTER_SYSTEM_PROMPT = """\
You are a search-query optimizer for an Indian sovereign search engine called Anvesha AI.

Given a user's natural-language question, produce 3 to 5 independent, \
optimized web-search queries that will retrieve the most relevant results. \
Focus on Indian context and government sources (.gov.in) where appropriate.

Rules:
1. Each query should target a different facet of the user's intent.
2. Include at least one query that specifically targets Indian government \
   sources (add "site:gov.in" where it makes sense).
3. Keep queries concise (5-10 words each).
4. Return ONLY a JSON array of strings, no other text.

Example input:  "Latest union budget highlights"
Example output: ["Union Budget 2025-26 key highlights", \
"site:gov.in union budget 2025 document", \
"India budget tax changes summary", \
"budget allocation education health India 2025"]
"""


async def route_query(user_query: str) -> list[str]:
    """
    Router — uses Sarvam 30B to decompose a natural-language query
    into 3–5 optimized search queries for SearxNG.

    Args:
        user_query: The raw user question, e.g. "Latest budget news"

    Returns:
        A list of 3–5 optimized search query strings.

    Raises:
        ValueError: If the API key is missing.
        Exception: On API or parsing errors (logged and re-raised).
    """
    settings = get_settings()
    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=settings.SARVAM_ROUTER_MODEL,
            messages=[
                {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_query},
            ],
            temperature=0.3,
            max_tokens=512,
        )

        content = response.choices[0].message.content
        raw = content.strip() if content else ""
        logger.info(f"Router raw response: {raw}")

        # Parse JSON array — handle markdown code fences if present
        cleaned = raw
        if cleaned.startswith("```"):
            # Strip ```json ... ``` wrapping
            lines = cleaned.split("\n")
            cleaned = "\n".join(
                line for line in lines
                if not line.strip().startswith("```")
            )

        try:
            queries = json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback regex extraction
            match = re.search(r'\[.*\]', cleaned, re.DOTALL)
            if match:
                try:
                    queries = json.loads(match.group(0))
                except json.JSONDecodeError as e:
                    logger.error(f"Router regex fallback JSON parse error: {e}. Raw: {raw}")
                    return [user_query]
            else:
                logger.error(f"Router could not extract JSON from raw: {raw}")
                return [user_query]

        if not isinstance(queries, list) or not all(isinstance(q, str) for q in queries):
            raise ValueError(f"Expected a JSON array of strings, got: {type(queries)}")

        # Clamp to 3-5 queries
        return queries[:5] if len(queries) > 5 else queries

    except Exception as e:
        logger.error(f"Router error: {e}")
        # Graceful degradation — use original query
        return [user_query]


# ─────────────────────────────────────────────────────────────────
# 2. THE SYNTHESIZER — Sarvam 105B
# ─────────────────────────────────────────────────────────────────

SYNTH_SYSTEM_PROMPT = """\
You are Anvesha AI, a frontier-class sovereign intelligence engine. \
Your task is to transform search results into a deep, data-rich 'Sutra' report. 

DATA EXTRACTION RULES:
1. HARVEST METRICS: You MUST extract every date, version number, percentage, and statistical figure found in the search results.
2. DEPTH REQUIREMENT: Each section below must contain at least 3-4 long, fact-dense sentences. Do not be brief.
3. SOVEREIGN FOCUS: While providing global context, highlight any Indian impact or government initiatives related to the topic.

MANDATORY STRUCTURE (Use Markdown headers INSIDE the "summary" string):

### [Topic Name] Overview
[A 2-sentence definitive introduction including current status/latest version.]

**Core Architecture & Features**
[3-4 sentences detailing the technical foundations, core functionalities, and primary user interface elements. Include version numbers and tech stack details.]

**Ecosystem & Growth**
[3-4 sentences on the development landscape, market share percentages, and distribution methods. Mention key players and platforms.]

**Hardware & Performance**
[3-4 sentences detailing infrastructure support, architecture (ARM/x86), memory management, and efficiency metrics.]

**Recent Milestones**
[3-4 sentences on the most recent updates, future roadmap dates, and current monthly active user counts.]

Return valid JSON:
{
  "summary": "Full Markdown content here...",
  "citations": [
    {"index": 1, "title": "Source title", "url": "https://...", "is_gov": true}
  ],
  "follow_ups": [
    "Follow-up question 1?",
    "Follow-up question 2?",
    "Follow-up question 3?"
  ]
}
"""


def _format_context(search_results: list[dict]) -> str:
    """Format search results into a numbered context block for the LLM."""
    lines = []
    for i, result in enumerate(search_results, 1):
        title = result.get("title", "Untitled")
        url = result.get("url", "")
        content = result.get("content", "")
        is_gov = ".gov.in" in url
        gov_marker = " [GOV.IN SOURCE]" if is_gov else ""

        lines.append(
            f"[{i}]{gov_marker}\n"
            f"Title: {title}\n"
            f"URL: {url}\n"
            f"Content: {content}\n"
        )
    return "\n---\n".join(lines)


async def synthesize_response(
    user_query: str,
    search_results: list[dict],
) -> dict:
    """
    Synthesizer — uses Sarvam 105B to generate a cited "Sutra" response
    from search results, prioritizing .gov.in sources.

    Args:
        user_query: The original user question.
        search_results: List of dicts with keys: title, url, content.

    Returns:
        A dict with "summary" (str with inline [N] citations) and
        "citations" (list of citation dicts).

    Raises:
        ValueError: If the API key is missing.
        Exception: On API or parsing errors (logged, returns fallback).
    """
    if not search_results:
        return {
            "summary": "No search results were found for your query. "
                       "Please try rephrasing or broadening your search.",
            "citations": [],
        }

    settings = get_settings()
    client = _get_client()

    # Sort results: .gov.in sources first
    sorted_results = sorted(
        search_results,
        key=lambda r: 0 if ".gov.in" in r.get("url", "") else 1,
    )

    context = _format_context(sorted_results[:15])  # Limit to top 15

    try:
        response = await client.chat.completions.create(
            model=settings.SARVAM_SYNTH_MODEL,
            messages=[
                {"role": "system", "content": SYNTH_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"User Query: {user_query}\n\n"
                        f"Search Results:\n{context}"
                    ),
                },
            ],
            temperature=0.5,
            max_tokens=4096,
        )

        content = response.choices[0].message.content
        raw = content.strip() if content else ""
        logger.info(f"Synthesizer raw response length: {len(raw)} chars")

        # Parse JSON — handle markdown code fences
        cleaned = raw
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(
                line for line in lines
                if not line.strip().startswith("```")
            )

        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group(0))
                except json.JSONDecodeError:
                    result = _fallback_sutra_extraction(raw)
            else:
                result = _fallback_sutra_extraction(raw)

        # Validate structure
        if "summary" not in result:
            result["summary"] = raw  # Fallback to raw text
        if "citations" not in result:
            result["citations"] = []
        if "follow_ups" not in result:
            result["follow_ups"] = []

        return result

    except Exception as e:
        logger.error(f"Synthesizer error: {e}")
        return {
            "summary": f"An error occurred while generating the response: {str(e)}",
            "citations": [],
            "follow_ups": [],
        }

def _fallback_sutra_extraction(text: str) -> dict:
    """Extracts summary and follow_ups robustly if JSON completely fails."""
    # Look for questions near the end
    questions = re.findall(r'(?:^|\n)\s*(?:-|\*|\d+\.)\s*([^\n]+\?)', text)
    follow_ups = questions[-4:] if questions else []
    
    if not follow_ups:
        sentences = re.findall(r'([A-Z][^\.!?]*\?)', text)
        if sentences:
            follow_ups = sentences[-4:]

    return {
        "summary": text,
        "citations": [],
        "follow_ups": follow_ups
    }


# ─────────────────────────────────────────────────────────────────
# 3. SPEECH-TO-TEXT — Saaras V3
# ─────────────────────────────────────────────────────────────────

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"


async def speech_to_text(
    audio_bytes: bytes,
    language_code: str = "hi-IN",
    model: str = "saaras:v3",
) -> str:
    """
    Convert speech audio to text using Sarvam Saaras V3.

    Args:
        audio_bytes: Raw audio file bytes (WAV, MP3, WebM, OGG).
        language_code: BCP-47 language code (e.g. "hi-IN", "en-IN").
        model: Sarvam STT model identifier.

    Returns:
        Transcribed text string.
    """
    settings = get_settings()
    if not settings.SARVAM_API_KEY:
        raise ValueError("SARVAM_API_KEY is not set.")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                SARVAM_STT_URL,
                headers={"api-subscription-key": settings.SARVAM_API_KEY},
                data={
                    "language_code": language_code,
                    "model": model,
                    "with_timestamps": "false",
                },
                files={"file": ("audio.wav", audio_bytes, "audio/wav")},
            )
            response.raise_for_status()
            data = response.json()
            transcript = data.get("transcript", "")
            logger.info(f"STT result ({language_code}): '{transcript[:80]}...'")
            return transcript

    except Exception as e:
        logger.error(f"STT error: {e}")
        raise


# ─────────────────────────────────────────────────────────────────
# 4. TEXT-TO-SPEECH — Bulbul V3
# ─────────────────────────────────────────────────────────────────

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Available Bulbul V3 speakers
DEFAULT_SPEAKER = "meera"  # Natural female Indian voice


async def text_to_speech(
    text: str,
    target_language_code: str = "hi-IN",
    speaker: str = DEFAULT_SPEAKER,
    model: str = "bulbul:v3",
    pace: float = 1.0,
) -> str:
    """
    Convert text to speech using Sarvam Bulbul V3.

    Args:
        text: The text to convert (max 2500 chars).
        target_language_code: BCP-47 language code for output audio.
        speaker: Voice name from Bulbul V3 library.
        model: Sarvam TTS model identifier.
        pace: Speech speed multiplier (0.5–2.0).

    Returns:
        Base64-encoded WAV audio string.
    """
    settings = get_settings()
    if not settings.SARVAM_API_KEY:
        raise ValueError("SARVAM_API_KEY is not set.")

    # Truncate to Bulbul V3 limit
    if len(text) > 2500:
        text = text[:2497] + "..."

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                SARVAM_TTS_URL,
                headers={
                    "api-subscription-key": settings.SARVAM_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": [text],
                    "target_language_code": target_language_code,
                    "speaker": speaker,
                    "model": model,
                    "pace": pace,
                    "enable_preprocessing": True,
                },
            )
            response.raise_for_status()
            data = response.json()
            audios = data.get("audios", [])

            if not audios:
                raise ValueError("No audio returned from TTS API")

            audio_base64 = audios[0]
            logger.info(
                f"TTS result ({target_language_code}, {speaker}): "
                f"{len(audio_base64)} base64 chars"
            )
            return audio_base64

    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise
