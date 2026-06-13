"""SQLite persistence layer for review history (Phase 2: Hindsight Memory).

Provides a small, dependency-free data access layer using the standard
library sqlite3 module. Reviews are stored with their issues and
suggestions serialized as JSON strings, and returned as Python dicts.
"""

import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pathlib import Path


logger = logging.getLogger(__name__)

# Database file lives alongside the backend package.
DB_PATH = Path(__file__).parent / "reviews.db"


@contextmanager
def _get_connection():
    """Yield a SQLite connection with row access by column name.

    Using a context manager guarantees the connection is always closed,
    even when an error occurs mid-operation.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enables dict-like access to columns.
    try:
        yield conn
        conn.commit()
    except sqlite3.Error:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Create the reviews table if it does not already exist.

    Safe to call on every startup; uses IF NOT EXISTS so it is idempotent.
    """
    try:
        with _get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    filename TEXT,
                    summary TEXT,
                    issues_json TEXT,
                    suggestions_json TEXT
                )
                """
            )
        logger.info("Database initialized at %s", DB_PATH)
    except sqlite3.Error:
        logger.exception("Failed to initialize the database")
        raise


def save_review(
    filename: str,
    summary: str,
    issues: List[Any],
    suggestions: List[Any],
) -> int:
    """Persist a single review and return its new row id.

    Issues and suggestions are serialized to JSON strings for storage.

    Args:
        filename: Name of the reviewed file (or a placeholder for pasted code).
        summary: Overall review summary.
        issues: List of issue objects/dicts.
        suggestions: List of suggestion strings.

    Returns:
        The autoincrement id of the inserted row.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        issues_json = json.dumps(issues)
        suggestions_json = json.dumps(suggestions)
    except (TypeError, ValueError):
        logger.exception("Failed to serialize review data to JSON")
        raise

    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO reviews
                    (timestamp, filename, summary, issues_json, suggestions_json)
                VALUES (?, ?, ?, ?, ?)
                """,
                (timestamp, filename, summary, issues_json, suggestions_json),
            )
            return cursor.lastrowid
    except sqlite3.Error:
        logger.exception("Failed to save review")
        raise


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert a DB row into a Python dict, deserializing JSON columns.

    Falls back to empty lists if stored JSON is missing or corrupt, so a
    single bad row never breaks reads.
    """
    def _safe_load(value: Optional[str]) -> List[Any]:
        if not value:
            return []
        try:
            return json.loads(value)
        except (TypeError, ValueError):
            logger.warning("Corrupt JSON in review id=%s; returning empty list", row["id"])
            return []

    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "filename": row["filename"],
        "summary": row["summary"],
        "issues": _safe_load(row["issues_json"]),
        "suggestions": _safe_load(row["suggestions_json"]),
    }


def get_all_reviews() -> List[Dict[str, Any]]:
    """Return all reviews as a list of dicts, newest first."""
    try:
        with _get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM reviews ORDER BY id DESC"
            ).fetchall()
        return [_row_to_dict(row) for row in rows]
    except sqlite3.Error:
        logger.exception("Failed to fetch reviews")
        raise


def get_review_by_id(review_id: int) -> Optional[Dict[str, Any]]:
    """Return a single review by id, or None if it does not exist."""
    try:
        with _get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM reviews WHERE id = ?", (review_id,)
            ).fetchone()
        return _row_to_dict(row) if row else None
    except sqlite3.Error:
        logger.exception("Failed to fetch review id=%s", review_id)
        raise
