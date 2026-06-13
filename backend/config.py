"""Centralized configuration for the backend.

Loads environment variables from .env once and exposes a validated,
cached Settings object. All other modules import get_settings() rather
than reading os.environ directly, so configuration has a single source
of truth and fails fast with a clear message when misconfigured.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

# Load .env explicitly so configuration never depends on the caller
# exporting variables into the shell first.
load_dotenv()

# Groq-supported chat models allowed in Phase 1. Keeping an allow-list
# prevents silent typos in GROQ_MODEL from reaching the API.
SUPPORTED_MODELS = {
    "qwen/qwen3-32b",
}


class Settings(BaseModel):
    """Validated application settings."""

    groq_api_key: str = Field(..., description="Groq API key.")
    groq_model: str = Field("qwen/qwen3-32b", description="Groq chat model id.")
    request_timeout: float = Field(
        60.0, gt=0, description="Timeout (seconds) for the Groq API call."
    )
    max_code_chars: int = Field(
        50_000, gt=0, description="Maximum allowed length of submitted code."
    )

    @field_validator("groq_api_key")
    @classmethod
    def _validate_api_key(cls, v: str) -> str:
        """Ensure the API key is present and non-empty."""
        if not v or not v.strip():
            raise ValueError("GROQ_API_KEY must not be empty.")
        return v.strip()

    @field_validator("groq_model")
    @classmethod
    def _validate_model(cls, v: str) -> str:
        """Ensure the configured model is one we support."""
        model = v.strip()
        if model not in SUPPORTED_MODELS:
            raise ValueError(
                f"Unsupported GROQ_MODEL '{model}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_MODELS))}."
            )
        return model


@lru_cache
def get_settings() -> Settings:
    """Build and cache Settings from environment variables.

    Raises:
        RuntimeError: if required configuration is missing or invalid.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to your .env file.")

    try:
        return Settings(
            groq_api_key=api_key,
            groq_model=os.getenv("GROQ_MODEL", "qwen/qwen3-32b"),
            request_timeout=float(os.getenv("REQUEST_TIMEOUT", "60")),
            max_code_chars=int(os.getenv("MAX_CODE_CHARS", "50000")),
        )
    except ValueError as exc:
        # Covers both Pydantic validation errors and bad numeric env values.
        raise RuntimeError(f"Invalid configuration: {exc}") from exc
