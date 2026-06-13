"""FastAPI application exposing the code review endpoints.

This module owns the web layer only:
  - Application lifecycle (a single reusable AsyncGroq client).
  - Request validation (via Pydantic models).
  - Delegation to the reviewer module.
  - Error translation into clean HTTP responses.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from groq import AsyncGroq

from backend.config import get_settings
from backend.models import ReviewRequest, ReviewResponse
from backend.reviewer import review_code

# Configure root logging once for the backend process.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage resources tied to the application's lifecycle.

    Builds settings and a single AsyncGroq client at startup, stores them
    on app.state for reuse across all requests, and closes the client
    cleanly on shutdown.
    """
    settings = get_settings()  # Fails fast if configuration is invalid.
    app.state.settings = settings
    app.state.groq_client = AsyncGroq(api_key=settings.groq_api_key)
    logger.info("Backend started. Using model: %s", settings.groq_model)

    yield

    # Graceful shutdown: release the HTTP connection pool.
    await app.state.groq_client.close()
    logger.info("Backend shut down. Groq client closed.")


app = FastAPI(
    title="Code Review Agent API",
    description="Phase 1 MVP: AI-powered Python code review via Groq (Qwen3-32B).",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health() -> dict:
    """Lightweight health check for the frontend and monitoring."""
    return {"status": "ok"}


@app.post("/review", response_model=ReviewResponse)
async def review(request: ReviewRequest, req: Request) -> ReviewResponse:
    """Accept Python code and return a structured LLM review.

    Input is validated by ReviewRequest (size limits included). Internal
    failures are logged in the reviewer and surfaced here as HTTP 502 so
    no internal detail leaks to the client.
    """
    settings = req.app.state.settings
    client = req.app.state.groq_client

    try:
        return await review_code(client, settings, request.code)
    except RuntimeError as exc:
        logger.warning("Review request failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
