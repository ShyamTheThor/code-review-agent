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

from groq import AsyncGroq

from backend.config import Settings
from backend.database import save_review
from backend.memory import generate_memory_context
from backend.models import Issue, ReviewResponse, Severity

logger = logging.getLogger(__name__)

# Strong, explicit system prompt. We constrain the model to emit ONLY a
# JSON object matching our schema so parsing is deterministic. Examples
# of valid severities are listed to reduce out-of-vocabulary values.
SYSTEM_PROMPT = """You are an expert Python code reviewer with deep knowledge of
PEP 8, type safety, security, performance, readability, and maintainability.

Review the provided Python code and identify concrete, actionable issues.
For each issue, assign a severity:
  - "High": bugs, security flaws, or anything that breaks correctness.
  - "Medium": maintainability or design problems that should be fixed soon.
  - "Low": style, naming, documentation, or minor improvements.

Respond with ONLY a valid JSON object in EXACTLY this schema:
{
  "issues": [{"title": "string", "severity": "Low" | "Medium" | "High"}],
  "suggestions": ["string"],
  "summary": "string"
}

Rules:
  - Output JSON only. No markdown fences, no commentary, no text before or after.
  - "title" is a short, specific description of the issue.
  - "suggestions" are concrete improvement actions.
  - "summary" is a brief overall assessment (1-3 sentences).
  - If the code has no issues, return an empty "issues" list and say so in the summary."""


async def review_code(
    client: AsyncGroq,
    settings: Settings,
    code: str,
    filename: str = "pasted_code.py",
) -> ReviewResponse:
    """Send code to Groq, return a structured review, and persist it.

    Args:
        client: A reusable AsyncGroq client (created at app startup).
        settings: Validated application settings (model, timeout, etc.).
        code: The Python source code to review.
        filename: Name of the reviewed file (defaults to a placeholder for
            pasted code). Used only for storage.

    Returns:
        A ReviewResponse with issues, suggestions, and a summary.

    Raises:
        RuntimeError: if the LLM call fails or returns unusable output.
                      The real cause is logged; callers surface a generic
                      message to clients.
    """
    # Build memory context from historical reviews (Phase 2: Hindsight Memory).
    memory_context = generate_memory_context()
    logger.info("Memory context injected:\n%s", memory_context)

    # Inject the historical patterns into the system prompt so the model
    # pays extra attention to the user's recurring weak spots.
    system_content = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Historical review patterns:\n\n"
        f"{memory_context}"
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
        if not isinstance(item, dict) or "title" not in item:
            continue  # Skip malformed entries silently.
        issues.append(
            Issue(
                title=str(item["title"]),
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
            {"title": issue.title, "severity": issue.severity.value}
            for issue in review.issues
        ]
        save_review(
            filename=filename,
            summary=review.summary,
            issues=issues_payload,
            suggestions=review.suggestions,
        )
    except Exception:
        # Log and continue; the API response is unaffected.
        logger.exception("Failed to persist review; returning result anyway")

    return review
