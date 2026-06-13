"""Hindsight Cloud memory integration for the Code Review Agent.

A small, self-contained wrapper around the `hindsight-client` SDK. It is
decoupled from the rest of the app so it can be developed and tested in
isolation before being wired into reviewer.py.

Memory is treated as an optional enhancement: if it is misconfigured or the
backend is unreachable, these functions log and degrade gracefully instead of
crashing a code review.
"""

import logging
import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

from hindsight_client import Hindsight

logger = logging.getLogger(__name__)

load_dotenv()
# Configuration is read from the environment so secrets stay out of the code.
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
HINDSIGHT_BASE_URL = os.getenv(
    "HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io"
)
# Memory bank to read/write; defaults to "default" when not configured.
HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "default")

# Single shared client, built once on first use.
_client: Optional[Hindsight] = None


def _get_client() -> Optional[Hindsight]:
    """Return the shared Hindsight client, initializing it once.

    Returns None when the API key is missing or initialization fails, so
    callers can treat that as "memory disabled" without raising.
    """
    global _client

    if _client is not None:
        return _client

    if not HINDSIGHT_API_KEY:
        logger.warning("HINDSIGHT_API_KEY not set; Hindsight memory is disabled.")
        return None

    try:
        _client = Hindsight(
            base_url=HINDSIGHT_BASE_URL,
            api_key=HINDSIGHT_API_KEY,
        )
        return _client
    except Exception:
        logger.exception("Failed to initialize the Hindsight client.")
        return None


async def store_review_memory(review_data: Dict[str, Any]) -> bool:
    """Persist a single review outcome to Hindsight via retain().

    Returns True on success, False if memory is disabled or the call failed.
    Never raises.
    """
    if not review_data:
        logger.warning("store_review_memory called with empty data.")
        return False

    client = _get_client()
    if client is None:
        return False

    try:
        # retain() requires a bank_id and string content; serialize the
        # review payload to a string before storing.
        await client.aretain(bank_id=HINDSIGHT_BANK_ID, content=str(review_data))
        logger.info("Stored review memory in Hindsight.")
        return True
    except Exception:
        logger.exception("Failed to store review memory in Hindsight.")
        return False


async def recall_review_memories(query: str) -> List[Any]:
    """Retrieve past review memories relevant to a query via recall().

    Returns a list of memories, or an empty list if memory is disabled or the
    call failed. Never raises.
    """
    if not query or not query.strip():
        logger.warning("recall_review_memories called with an empty query.")
        return []

    client = _get_client()
    if client is None:
        return []

    try:
        results = await client.arecall(bank_id=HINDSIGHT_BANK_ID,query=query,
                                       )
        return results or []
    except Exception:
        logger.exception("Failed to recall review memories from Hindsight.")
        return []
