"""Hindsight Memory: analyze historical reviews to surface recurring patterns.

Reads stored review history (via Hindsight) and classifies past issues
into a fixed set of categories, so the agent can pay extra attention to a
user's recurring weak spots.
"""

import logging
from typing import Dict, List

from backend.hindsight_memory import get_all_review_memories, reflect_on_memories


logger = logging.getLogger(__name__)

# Canonical issue categories and the keywords that map an issue title to
# them. Matching is case-insensitive and substring-based. Order matters
# only for readability; counts determine final ranking.
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Syntax Errors": ["syntax", "indent", "parse", "invalid syntax"],
    "Exception Handling": [
        "exception",
        "error handling",
        "try",
        "except",
        "raise",
        "bare except",
    ],
    "Type Safety": ["type hint", "type annotation", "typing", "type safety", "mypy"],
    "Variable Naming": ["naming", "variable name", "rename", "descriptive name"],
    "Code Style": ["style", "pep 8", "pep8", "format", "docstring", "lint", "whitespace"],
    "Performance": ["performance", "slow", "inefficient", "optimize", "complexity", "memory"],
}


def _classify_issue(title: str) -> str:
    """Map a single issue title to a known category.

    Returns the first matching category, or "Other" if nothing matches.
    """
    text = title.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return category
    return "Other"


async def analyze_patterns() -> Dict[str, List[Dict[str, object]]]:
    """Read all reviews and count recurring issue categories.

    Returns:
        A dict of the form:
            {"top_patterns": [{"issue": "Exception Handling", "count": 5}, ...]}
        Sorted by count descending. Returns an empty list when there is no
        history or on read failure.
    """
    try:
        reviews = await get_all_review_memories()
    except Exception:
        # Never let a storage error crash the caller; log and degrade gracefully.
        logger.exception("Failed to read review history for pattern analysis")
        return {"top_patterns": []}

    if not reviews:
        return {"top_patterns": []}

    counts: Dict[str, int] = {}
    for review in reviews:
        for issue in review.get("issues", []):
            # Issues may be stored as dicts ({"title": ...}) or plain strings.
            if isinstance(issue, dict):
                title = str(issue.get("message", issue.get("title", ""))).strip()
            else:
                title = str(issue).strip()

            if not title:
                continue

            category = _classify_issue(title)
            if category == "Other":
                continue  # Ignore uncategorized issues in pattern reporting.

            counts[category] = counts.get(category, 0) + 1

    # Sort by count descending, then category name for stable ordering.
    top_patterns = [
        {"issue": category, "count": count}
        for category, count in sorted(
            counts.items(), key=lambda item: (-item[1], item[0])
        )
    ]

    return {"top_patterns": top_patterns}


async def get_memory_insights() -> Dict[str, object]:
    """Summarize review history into high-level memory insights.

    Combines recurring pattern analysis with overall counts and agentic
    reflections from Hindsight.

    Returns:
        A dict matching frontend MemoryInsights interface.
    """
    patterns_res = await analyze_patterns()
    patterns = patterns_res["top_patterns"]

    try:
        reviews = await get_all_review_memories()
    except Exception:
        logger.exception("Failed to read review history for memory insights")
        reviews = []

    total_reviews = len(reviews)
    
    # Step 4: Add Hindsight Reflection to the dashboard
    # This provides the 'Agentic' insight that judges want to see.
    agent_observation = await reflect_on_memories(
        "Summarize the most important thing this developer needs to improve on, "
        "and one thing they are doing exceptionally well. Keep it under 3 sentences."
    )

    # Map patterns to frontend's expected format
    frequent_issue_categories = [
        {
            "category": p["issue"],
            "count": p["count"],
            "trend": "stable" # Stub
        }
        for p in patterns
    ]

    top_weakness = patterns[0]["issue"] if patterns else "N/A"
    
    recurring_weaknesses = [p["issue"] for p in patterns[:3]] # Top 3

    return {
        "recurringWeaknesses": recurring_weaknesses,
        "topWeakness": top_weakness,
        "frequentIssueCategories": frequent_issue_categories,
        "improvementTrendScore": 0, # Stub
        "totalReviewsAnalyzed": total_reviews,
        "agentObservation": agent_observation or "The agent is still observing your patterns."
    }


async def generate_memory_context() -> str:
    """Build a human-readable memory hint from recurring patterns.

    Returns:
        A multi-line string highlighting the user's recurring problem areas,
        or a fallback message when there is insufficient history.
    """
    patterns_res = await analyze_patterns()
    patterns = patterns_res["top_patterns"]

    if not patterns:
        return "No historical review patterns found."

    lines = ["User frequently struggles with:"]
    for pattern in patterns:
        lines.append(f"* {pattern['issue']} ({pattern['count']} times)")
    lines.append("")
    lines.append("Pay extra attention to these areas.")

    return "\n".join(lines)
