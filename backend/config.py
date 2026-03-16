from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Anvesha AI backend configuration.
    All values are loaded from the .env file in the backend directory.
    """

    # ── Sarvam AI ──────────────────────────────────────────────
    SARVAM_API_KEY: str = ""
    SARVAM_API_BASE: str = "https://api.sarvam.ai/v1"
    SARVAM_ROUTER_MODEL: str = "sarvam-30b"
    SARVAM_SYNTH_MODEL: str = "sarvam-105b"

    # ── SearxNG ────────────────────────────────────────────────
    SEARXNG_BASE_URL: str = "http://localhost:8888"
    SEARCH_REGION_DEFAULT: str = "in-en"
    SEARCH_LANG_DEFAULT: str = "en"

    # ── Frontend ───────────────────────────────────────────────
    FRONTEND_URL: str = "*"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton for app settings."""
    return Settings()
