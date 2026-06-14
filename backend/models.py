"""Pydantic models defining the API and LLM data contract for Phase 1."""

from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class Severity(str, Enum):
    """Severity levels for a detected code issue."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

    @classmethod
    def normalize(cls, value: str) -> "Severity":
        """Map arbitrary LLM severity strings to a known level.

        LLMs may return values like 'medium', 'CRITICAL', or 'warn'.
        We normalize case/whitespace and fall back to LOW for anything
        unrecognized so a single odd value never breaks parsing.
        """
        mapping = {
            "low": cls.LOW,
            "medium": cls.MEDIUM,
            "high": cls.HIGH,
            "critical": cls.HIGH,  # Phase 1 has no Critical tier; treat as High.
        }
        return mapping.get(str(value).strip().lower(), cls.LOW)


class ReviewRequest(BaseModel):
    """Incoming request body: the code to review."""
    # max_length mirrors the backend's input cap so oversized input gets a
    # clean 422 validation error instead of an expensive LLM call.
    code: str = Field(
        ...,
        min_length=1,
        max_length=50_000,
        description="Source code to review.",
    )
    language: str = Field(
        default="python",
        description="Programming language of the code.",
    )


class Issue(BaseModel):
    """A single issue found during review."""
    id: str = Field(..., description="Unique identifier for the issue.")
    type: str = Field(..., description="Category of the issue (security, performance, etc.).")
    line: int = Field(..., description="Line number of the issue.")
    message: str = Field(..., description="Detailed description of the issue.")
    suggestion: str = Field(..., description="Concrete improvement action.")
    severity: Severity = Field(..., description="Severity level of the issue.")


class ReviewResponse(BaseModel):
    """Structured review result returned to the frontend."""
    issues: List[Issue] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    summary: str = Field(..., description="Overall summary of the review.")
