"""Hindsight Cloud memory integration for the Code Review Agent.

A small, self-contained wrapper around the `hindsight-client` SDK. It is
decoupled from the rest of the app so it can be developed and tested in
isolation before being wired into reviewer.py.

Memory is treated as an optional enhancement: if it is misconfigured or the
backend is unreachable, these functions log and degrade gracefully instead of
crashing a code review.
"""

import json
import logging
import os
import re
from datetime import datetime, timezone
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


def _clean_reflection(text: str) -> str:
    """Strip memory_ids, JSON blocks, and other technical metadata from Hindsight reflection text.
    
    Hindsight's reflect() often includes references to the specific memories it
    used to build the reflection, sometimes as plain text headers and sometimes
    as trailing JSON blocks. We strip these so the final UI only shows
    the natural language insights.
    """
    if not text:
        return ""
    
    # 1. Strip everything from known metadata headers onwards.
    patterns = [
        r"(?i)\n*memory_ids:.*",
        r"(?i)\n*memory ids:.*",
        r"(?i)\n*observation_ids:.*",
        r"(?i)\n*observation ids:.*",
        r"(?i)\n*referenced memories:.*",
        r"(?i)\n*based on memories:.*"
    ]
    
    cleaned = text
    for pattern in patterns:
        cleaned = re.split(pattern, cleaned, flags=re.DOTALL)[0]
    
    # 2. Strip trailing JSON blocks (e.g., { "observation_ids": [...] })
    # This looks for a { at the start of a new block that continues to the end.
    cleaned = re.split(r"\n+\s*\{.*\}\s*$", cleaned, flags=re.DOTALL)[0]
    
    # 3. Trim trailing whitespace or artifacts like lone dashes from the split
    cleaned = cleaned.strip().rstrip("-").strip()
    
    return cleaned


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
        # We add a timestamp to the review data for chronological tracking.
        review_data["timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # retain() requires a bank_id and string content; serialize the
        # review payload to a string before storing.
        # We use JSON so we can parse it back out when listing.
        content = json.dumps(review_data)
        await client.aretain(bank_id=HINDSIGHT_BANK_ID, content=content)
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


async def get_all_review_memories() -> List[Dict[str, Any]]:
    """Return all reviews stored in Hindsight via an agentic reflection.
    
    This replaces SQLite's get_all_reviews() by asking the Hindsight agent
    to reconstruct the history from its memories.
    """
    client = _get_client()
    if client is None:
        return []

    try:
        # We ask Hindsight to summarize the reviews it has seen.
        # This is more robust than manual parsing because Hindsight 
        # understands the context of the memories.
        instruction = (
            "List the most recent 20 code reviews you have performed. "
            "For each review, provide: timestamp, filename, summary, issues, and suggestions. "
            "Format the output as a valid JSON array of objects. "
            "Respond ONLY with the JSON array, no commentary."
        )
        
        result_text = await reflect_on_memories(instruction)
        
        if not result_text:
            return []
            
        # Clean the result text in case the agent added markdown fences
        json_match = re.search(r"\[\s*\{.*\}\s*\]", result_text, re.DOTALL)
        if json_match:
            result_text = json_match.group(0)
            
        try:
            reviews = json.loads(result_text)
            if isinstance(reviews, list):
                # Ensure each review has an ID (we use a hash or timestamp if missing)
                for i, rev in enumerate(reviews):
                    if "id" not in rev:
                        rev["id"] = f"mem_{i}_{rev.get('timestamp', 'now')}"
                return reviews
        except json.JSONDecodeError:
            logger.error(f"Failed to parse agentic history JSON: {result_text[:200]}")
            
        # Fallback: use recall to get some fragments
        res = await client.arecall(bank_id=HINDSIGHT_BANK_ID, query="code review", limit=20)
        reviews = []
        if hasattr(res, "results"):
            for item in res.results:
                reviews.append({
                    "id": item.id,
                    "summary": item.text,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "filename": "historical_memory.py",
                    "issues": [],
                    "suggestions": []
                })
        return reviews
        
    except Exception:
        logger.exception("Failed to reconstruct review history from Hindsight.")
        return []


async def get_review_memory_by_id(memory_id: str) -> Optional[Dict[str, Any]]:
    """Return a single review by its Hindsight ID or via targeted recall."""
    client = _get_client()
    if client is None:
        return None

    try:
        # Ask the agent about this specific memory
        instruction = (
            f"Provide the full details for the code review with ID or context related to '{memory_id}'. "
            "Include timestamp, filename, summary, issues, and suggestions. "
            "Format as a JSON object. Respond ONLY with JSON."
        )
        
        result_text = await reflect_on_memories(instruction)
        if result_text:
            json_match = re.search(r"\{\s*.*\s*\}", result_text, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group(0))
                    data["id"] = memory_id
                    return data
                except:
                    pass
                    
        # Fallback: search in the reconstructed list
        all_memories = await get_all_review_memories()
        for mem in all_memories:
            if str(mem.get("id")) == memory_id:
                return mem
                
        return None
    except Exception:
        logger.exception(f"Failed to fetch review memory id={memory_id}")
        return None


async def reflect_on_memories(instruction: str) -> Optional[str]:
    """Use Hindsight's reflect() to reason over historical data.
    
    This is the core 'Agentic' feature: it doesn't just retrieve, it 
    thinks about the user's patterns based on the instruction.
    """
    client = _get_client()
    if client is None:
        return None

    try:
        # reflect() allows us to ask high-level questions like 
        # "What are this user's recurring weaknesses?"
        result = await client.areflect(
            bank_id=HINDSIGHT_BANK_ID,
            query=instruction
        )
        # Return only the generated text for easier consumption by the UI/LLM.
        raw_text = getattr(result, "text", str(result))
        return _clean_reflection(raw_text)
    except Exception:
        logger.exception("Failed to reflect on memories.")
        return None


async def close_hindsight_client():
    """Close the shared Hindsight client session cleanly."""
    global _client
    if _client is not None:
        try:
            await _client.aclose()
            _client = None
            logger.info("Hindsight client closed.")
        except Exception:
            logger.exception("Error closing Hindsight client.")
