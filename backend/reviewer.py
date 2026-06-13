"""LLM review logic. This is the ONLY module that talks to Groq.

Responsibilities:
  - Build the review prompt.
  - Call Qwen3-32B via the async Groq client.
  - Safely parse and validate the JSON response into Pydantic models.
  - Persist every successful review (Phase 2: Hindsight Memory).

The Groq client is injected (built once at app startup) rather than
created here, so this module stays free of lifecycle concerns and is
easy to test.
"""

import json
import logging
import uuid

from groq import AsyncGroq

from backend.config import Settings
from backend.database import save_review
from backend.memory import generate_memory_context
from backend.models import Issue, ReviewResponse, Severity
from backend.hindsight_memory import (
    store_review_memory,
    recall_review_memories,
)

logger = logging.getLogger(__name__)

# Strong, explicit system prompt. We constrain the model to emit ONLY a
# JSON object matching our schema so parsing is deterministic.
SYSTEM_PROMPT = """You are an expert Python code reviewer with deep knowledge of
PEP 8, type safety, security, performance, readability, and maintainability.

Review the provided Python code and identify concrete, actionable issues.
For each issue, assign a severity:
  - "High": bugs, security flaws, or anything that breaks correctness.
  - "Medium": maintainability or design problems that should be fixed soon.
  - "Low": style, naming, documentation, or minor improvements.

Respond with ONLY a valid JSON object in EXACTLY this schema:
{
  "issues": [{
    "type": "security" | "performance" | "style" | "logic",
    "line": integer,
    "message": "string",
    "suggestion": "string",
    "severity": "Low" | "Medium" | "High"
  }],
  "suggestions": ["string"],
  "summary": "string"
}

Rules:
  - Output JSON only. No markdown fences, no commentary, no text before or after.
  - "type" must be one of: security, performance, style, logic.
  - "line" is the integer line number where the issue occurs.
  - "message" is a detailed description.
  - "suggestion" is a concrete improvement action.
  - "summary" is a brief overall assessment (1-3 sentences).
  - If the code has no issues, return an empty "issues" list and say so in the summary."""


async def review_code(
    client: AsyncGroq,
    settings: Settings,
    code: str,
    filename: str = "pasted_code.py",
) -> ReviewResponse:
    """Send code to Groq, return a structured review, and persist it."""
    # Build memory context from historical reviews (Phase 2: Hindsight Memory).
    memory_context = generate_memory_context()
    logger.info("Memory context injected:\n%s", memory_context)

    try:
        hindsight_memories = await recall_review_memories("python code review")
        logger.info("Hindsight recall successful: %s", hindsight_memories)

        hindsight_context = ""

        if hindsight_memories and hasattr(hindsight_memories, "results"):
            memories = []

            for item in hindsight_memories.results[:5]:
                if hasattr(item, "text"):
                    memories.append(item.text)

            hindsight_context = "\n".join(memories)
    except Exception:
        logger.exception("Hindsight recall failed")
        hindsight_memories = None

    # Inject the historical patterns into the system prompt so the model
    # pays extra attention to the user's recurring weak spots.
    system_content = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Historical review patterns:\n\n"
        f"{memory_context}\n\n"
        f"Hindsight memories:\n\n"
        f"{hindsight_context}"
    )

    try:
        completion = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": f"Review this Python code:\n\n{code}"},
            ],
            temperature=0.2,  # Low temperature for consistent, repeatable reviews.
            response_format={"type": "json_object"},  # Force JSON output.
            reasoning_format="hidden",  # Suppress Qwen reasoning traces.
            timeout=settings.request_timeout,  # Bound the network call.
        )
    except Exception as exc:
        # External API boundary: log the real error, raise a generic one.
        logger.exception("Groq API call failed")
        raise RuntimeError("Upstream LLM request failed.") from exc

    # --- Extract raw content, guarding against empty/None responses ---
    raw = completion.choices[0].message.content if completion.choices else None
    if not raw or not raw.strip():
        logger.error("Groq returned empty content")
        raise RuntimeError("LLM returned an empty response.")

    # --- Parse JSON safely ---
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Unparseable LLM output (first 500 chars): %s", raw[:500])
        raise RuntimeError("LLM returned malformed output.") from exc

    if not isinstance(data, dict):
        logger.error("LLM output was not a JSON object: %s", type(data).__name__)
        raise RuntimeError("LLM returned an unexpected response shape.")

    # --- Build issues defensively: one bad entry must not break the batch ---
    issues = []
    for item in data.get("issues", []):
        if not isinstance(item, dict) or "message" not in item:
            continue  # Skip malformed entries silently.
        
        issues.append(
            Issue(
                id=str(uuid.uuid4()),
                type=str(item.get("type", "style")),
                line=int(item.get("line", 0)),
                message=str(item["message"]),
                suggestion=str(item.get("suggestion", "No suggestion provided.")),
                severity=Severity.normalize(item.get("severity", "Low")),
            )
        )

    # --- Coerce suggestions to clean, non-empty strings ---
    suggestions = [
        str(s).strip()
        for s in data.get("suggestions", [])
        if isinstance(s, (str, int, float)) and str(s).strip()
    ]

    summary = str(data.get("summary", "")).strip() or "No summary provided."

    # --- Build the validated response object ---
    review = ReviewResponse(issues=issues, suggestions=suggestions, summary=summary)

    # --- Persist the review (Phase 2: Hindsight Memory) ---
    # Storage is best-effort: a DB failure must never fail the user's review.
    try:
        # Convert Pydantic issues into JSON-serializable dicts. Severity is a
        # str-enum, so issue.severity.value yields a plain string.
        issues_payload = [
            {
                "id": issue.id,
                "type": issue.type,
                "line": issue.line,
                "message": issue.message,
                "suggestion": issue.suggestion,
                "severity": issue.severity.value
            }
            for issue in review.issues
        ]
        save_review(
            filename=filename,
            summary=review.summary,
            issues=issues_payload,
            suggestions=review.suggestions,
        )
        await store_review_memory(
            {
                "filename": filename,
                "summary": review.summary,
                "issues": issues_payload,
                "suggestions": review.suggestions,
            }
        )
    except Exception:
        # Log and continue; the API response is unaffected.
        logger.exception("Failed to persist review; returning result anyway")

    return review
