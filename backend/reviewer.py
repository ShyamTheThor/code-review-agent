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
from backend.memory import generate_memory_context
from backend.models import Issue, ReviewResponse, Severity
from backend.hindsight_memory import (
    store_review_memory,
    recall_review_memories,
    reflect_on_memories,
)

logger = logging.getLogger(__name__)

# Strong, explicit system prompt. We constrain the model to emit ONLY a
# JSON object matching our schema so parsing is deterministic.
SYSTEM_PROMPT = """You are an expert {language} code reviewer with deep knowledge of
{conventions}, type safety, security, performance, readability, and maintainability.

Review the provided {language} code and identify concrete, actionable issues.
For each issue, assign a severity:
  - "High": bugs, security flaws, or anything that breaks correctness.
  - "Medium": maintainability or design problems that should be fixed soon.
  - "Low": style, naming, documentation, or minor improvements.

Respond with ONLY a valid JSON object in EXACTLY this schema:
{{
  "issues": [{{
    "type": "security" | "performance" | "style" | "logic",
    "line": integer,
    "message": "string",
    "suggestion": "string",
    "severity": "Low" | "Medium" | "High"
  }}],
  "suggestions": ["string"],
  "summary": "string"
}}

Rules:
  - Output JSON only. No markdown fences, no commentary, no text before or after.
  - "type" must be one of: security, performance, style, logic.
  - "line" is the integer line number where the issue occurs.
  - "message" is a detailed description.
  - "suggestion" is a concrete improvement action.
  - "summary" is a brief overall assessment (1-3 sentences).
  - If the code has no issues, return an empty "issues" list and say so in the summary."""


import re

# ... existing code ...

def _extract_context_keywords(code: str) -> str:
    """Extract key libraries and patterns from code to drive dynamic recall.
    
    This helps the agent find memories relevant to specific frameworks (e.g. FastAPI)
    rather than just generic 'python' memories.
    """
    keywords = ["code review"] # Base query
    
    # Common library/framework detection
    patterns = {
        "FastAPI/API": r"from fastapi|import fastapi|@app\.",
        "Database/SQL": r"sqlalchemy|SQLAlchemy|sqlite|postgres|session\.query",
        "AsyncIO": r"async def|await |import asyncio",
        "Pydantic": r"from pydantic|BaseModel",
        "Security": r"password|secret|token|apikey|os\.environ",
        "Threading": r"threading|multiprocessing|concurrent\.futures",
        "C++ Standard": r"#include <iostream>|std::",
        "C Standard": r"#include <stdio.h>|malloc\(",
    }
    
    for label, pattern in patterns.items():
        if re.search(pattern, code):
            keywords.append(label)
            
    # Also extract specific library imports (e.g. 'import pandas' -> 'pandas')
    imports = re.findall(r"^(?:import|from|#include <) (\w+)", code, re.MULTILINE)
    keywords.extend(imports[:3]) # Limit to top 3 unique imports
    
    return " ".join(list(dict.fromkeys(keywords))) # Unique keywords only


# ... existing code ...

def _generate_disposition(mental_model: str) -> str:
    """Determine the agent's 'personality' based on the developer's history.
    
    This is Step 3: Disposition-Aware Reasoning.
    """
    model_lower = mental_model.lower()
    
    # Logic to determine tone
    if "recurring" in model_lower or "persistent" in model_lower:
        return (
            "DISPOSITION: STERN MENTOR. The developer is repeating mistakes. "
            "Be very firm about recurring issues. Do not sugarcoat suggestions for "
            "problems they have seen before."
        )
    elif "senior" in model_lower or "expert" in model_lower or "strong" in model_lower:
        return (
            "DISPOSITION: PEER REVIEWER. The developer is experienced. "
            "Be concise, technical, and direct. Skip the basics; focus on deep "
            "architectural or performance optimizations."
        )
    elif "junior" in model_lower or "struggles" in model_lower:
        return (
            "DISPOSITION: PATIENT COACH. The developer is learning. "
            "Be encouraging and provide educational context in your suggestions. "
            "Explain the 'why' behind every fix."
        )
    
    return "DISPOSITION: PROFESSIONAL ANALYST. Maintain a balanced, objective tone."


async def review_code(
    client: AsyncGroq,
    settings: Settings,
    code: str,
    filename: str = "pasted_code.py",
    language: str = "python",
) -> ReviewResponse:
    """Send code to Groq, return a structured review, and persist it."""
    # Build memory context from historical reviews (Phase 2: Hindsight Memory).
    memory_context = await generate_memory_context()
    logger.info("Memory context injected:\n%s", memory_context)

    try:
        # Step 1: Dynamic Context-Aware Recall
        recall_query = f"{language} " + _extract_context_keywords(code)
        logger.info("Recall query generated: %s", recall_query)
        
        hindsight_memories = await recall_review_memories(recall_query)
        logger.info("Hindsight recall successful: %s", hindsight_memories)

        hindsight_context = ""

        if hindsight_memories and hasattr(hindsight_memories, "results"):
            memories = []

            for item in hindsight_memories.results[:5]:
                if hasattr(item, "text"):
                    memories.append(item.text)

            hindsight_context = "\n".join(memories)
            
        # Step 2: The Reflection Cycle (Mental Models)
        developer_mental_model = await reflect_on_memories(
            "Summarize this developer's recurring technical strengths and persistent "
            "weaknesses based on their past code reviews. Be concise and actionable."
        )
        if developer_mental_model:
            logger.info("Developer mental model generated: %s", developer_mental_model)
        else:
            developer_mental_model = "No consolidated mental model yet."

        # Step 3: Disposition-Aware Reasoning
        disposition = _generate_disposition(developer_mental_model)
        logger.info("Disposition selected: %s", disposition)

    except Exception:
        logger.exception("Hindsight memory operations failed")
        hindsight_memories = None
        developer_mental_model = "Memory unavailable."
        disposition = "DISPOSITION: DEFAULT."

    # Language-specific conventions
    conventions = "PEP 8"
    if language.lower() in ["c", "cpp"]:
        conventions = "C/C++ core guidelines, memory safety, and performance"
    elif language.lower() in ["javascript", "typescript"]:
        conventions = "modern ECMAScript standards and clean code principles"

    # Inject the historical patterns and disposition into the system prompt.
    system_content = (
        f"{SYSTEM_PROMPT.format(language=language, conventions=conventions)}\n\n"
        f"CURRENT PERSONA:\n{disposition}\n\n"
        f"Developer Mental Model (Learned Observations):\n"
        f"{developer_mental_model}\n\n"
        f"Specific Historical Memories:\n"
        f"{hindsight_context}"
    )
# ... rest of function ...

    try:
        completion = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": f"Review this {language} code:\n\n{code}"},
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
    # Storage is best-effort: a Hindsight failure must never fail the user's review.
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
        
        await store_review_memory(
            {
                "filename": filename,
                "language": language,
                "summary": review.summary,
                "issues": issues_payload,
                "suggestions": review.suggestions,
            }
        )
    except Exception:
        # Log and continue; the API response is unaffected.
        logger.exception("Failed to persist review; returning result anyway")

    return review
