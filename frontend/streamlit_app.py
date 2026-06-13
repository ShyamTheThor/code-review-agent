"""Streamlit UI for the Code Review Agent.

This layer is presentation-only: it collects Python code (via upload or
paste), sends it to the FastAPI backend, and renders the structured
review. It contains no LLM or business logic.

Phase 2: adds a Review History sidebar backed by the existing
GET /history and GET /history/{review_id} endpoints.
"""

import os

from dotenv import load_dotenv
import requests
import streamlit as st

load_dotenv()

# Backend location is configurable via environment variable for different
# deployment targets; defaults to local development.
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Streamlit color tags for severity-based styling in markdown.
SEVERITY_COLORS = {"High": "red", "Medium": "orange", "Low": "blue"}

# Mirror of the backend cap so we can warn the user before sending.
MAX_CODE_CHARS = 50_000

st.set_page_config(page_title="Code Review Agent", page_icon="🧐")
st.title("🧐 Code Review Agent")
st.caption("Phase 1 MVP — paste or upload Python code for an AI-powered review.")


# ---------------------------------------------------------------------------
# Backend client helpers
# ---------------------------------------------------------------------------
@st.cache_data(ttl=10)
def backend_is_up() -> bool:
    """Probe the backend /health endpoint so we can warn the user early.

    Cached briefly to avoid hammering the backend on every Streamlit rerun.
    """
    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=3)
        return resp.ok
    except requests.RequestException:
        return False


def fetch_history():
    """Fetch the list of past reviews from GET /history.

    Returns (items, error_message). Exactly one of the two is meaningful:
    a non-None error_message indicates the list could not be loaded.
    """
    try:
        resp = requests.get(f"{BACKEND_URL}/history", timeout=10)
    except requests.Timeout:
        return None, "Loading history timed out."
    except requests.RequestException:
        return None, "Could not reach the backend to load history."

    if not resp.ok:
        return None, f"Backend returned HTTP {resp.status_code} for history."

    try:
        data = resp.json()
    except ValueError:
        return None, "Backend returned an invalid history response."

    # Accept either a bare list or a wrapped object without assuming a key:
    # only unwrap if the payload is a dict containing a single list value.
    if isinstance(data, dict):
        list_values = [v for v in data.values() if isinstance(v, list)]
        data = list_values[0] if len(list_values) == 1 else []

    if not isinstance(data, list):
        return None, "Backend returned an invalid history response."

    return data, None


def fetch_review(review_id):
    """Fetch a single review from GET /history/{review_id}.

    Returns (review_dict, error_message).
    """
    try:
        resp = requests.get(f"{BACKEND_URL}/history/{review_id}", timeout=15)
    except requests.Timeout:
        return None, "Loading the review timed out."
    except requests.RequestException:
        return None, "Could not reach the backend to load the review."

    if resp.status_code == 404:
        return None, "That review could not be found."
    if not resp.ok:
        return None, f"Backend returned HTTP {resp.status_code}."

    try:
        return resp.json(), None
    except ValueError:
        return None, "Backend returned an invalid response."


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------
def render_results(result: dict) -> None:
    """Render the structured review response using defensive key access."""
    # --- Issues Found (with color-coded severity) ---
    st.subheader("Issues Found")
    issues = result.get("issues", [])
    if issues:
        for index, issue in enumerate(issues, start=1):
            severity = issue.get("severity", "Low")
            color = SEVERITY_COLORS.get(severity, "gray")
            title = issue.get("title", "Unknown issue")
            st.markdown(f"{index}. {title} :{color}[{severity}]")
    else:
        st.markdown("_No issues found._")

    # --- Suggestions ---
    st.subheader("Suggestions")
    suggestions = result.get("suggestions", [])
    if suggestions:
        for suggestion in suggestions:
            st.markdown(f"- {suggestion}")
    else:
        st.markdown("_No suggestions provided._")

    # --- Overall Summary ---
    st.subheader("Overall Summary")
    st.info(result.get("summary", "No summary provided."))


def render_history_metadata(review: dict) -> None:
    """Render filename/timestamp metadata only when the backend provides it.

    These keys are not assumed to exist; we probe a few common names and
    silently skip any that are absent so we never display invented data.
    """
    filename = review.get("filename") or review.get("file_name")
    timestamp = (
        review.get("timestamp")
        or review.get("created_at")
        or review.get("created")
    )
    if filename:
        st.caption(f"**Filename:** {filename}")
    if timestamp:
        st.caption(f"**Timestamp:** {timestamp}")


def history_label(item: dict, fallback_index: int) -> tuple:
    """Build a sidebar label like 'Review #15' (optionally with filename).

    Returns (review_id, label). The id is probed defensively; if no id field
    is present we fall back to the list position.
    """
    review_id = item.get("id")
    if review_id is None:
        review_id = item.get("review_id", fallback_index)
    label = f"Review #{review_id}"
    filename = item.get("filename") or item.get("file_name")
    if filename:
        label += f" — {filename}"
    return review_id, label


# ---------------------------------------------------------------------------
# Sidebar: Review History (usable while reviewing new code)
# ---------------------------------------------------------------------------
def render_history_sidebar() -> None:
    """Load past reviews into the sidebar and let the user select one."""
    st.sidebar.header("Review History")

    items, error = fetch_history()

    if error:
        st.sidebar.warning(error)
        return

    if not items:
        st.sidebar.info("No previous reviews found.")
        return

    # Map a human-readable label back to its review id for selection.
    options = {}  # label -> review_id
    for fallback_index, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        review_id, label = history_label(item, fallback_index)
        options[label] = review_id

    if not options:
        st.sidebar.info("No previous reviews found.")
        return

    # index=None means nothing is preselected, so the main review workflow
    # stays the default view and the sidebar remains usable at any time.
    selected_label = st.sidebar.radio(
        "Select a review to view",
        options=list(options.keys()),
        index=None,
        key="history_selection",
    )

    if selected_label:
        st.session_state["selected_review_id"] = options[selected_label]
    else:
        st.session_state.pop("selected_review_id", None)


# ---------------------------------------------------------------------------
# Main page
# ---------------------------------------------------------------------------
# Render the sidebar first so history is available regardless of main state.
render_history_sidebar()

# --- Backend availability check ---
backend_available = backend_is_up()
if not backend_available:
    st.error(
        f"Backend is not reachable at {BACKEND_URL}. "
        "Start the backend and reload this page."
    )

# --- If a history item is selected, show it and skip the review form ---
selected_review_id = st.session_state.get("selected_review_id")
if selected_review_id is not None:
    st.subheader(f"Viewing Review #{selected_review_id}")
    with st.spinner("Loading review..."):
        review, error = fetch_review(selected_review_id)
    if error:
        st.error(error)
    else:
        render_history_metadata(review)
        render_results(review)
    # Let the user return to the live review workflow.
    if st.button("← Back to new review"):
        st.session_state.pop("selected_review_id", None)
        st.rerun()
    st.stop()

# --- Input: upload fills the editor; user can still edit before review ---
uploaded = st.file_uploader("Upload a .py file", type=["py"])
default_code = ""
if uploaded is not None:
    # errors="replace" guards against non-UTF-8 files instead of crashing.
    default_code = uploaded.read().decode("utf-8", errors="replace")

code = st.text_area(
    "Or paste your Python code here",
    value=default_code,
    height=300,
    placeholder="def add(a, b):\n    return a + b",
)

# --- Live character count with an over-limit warning ---
char_count = len(code)
if char_count > MAX_CODE_CHARS:
    st.warning(f"{char_count:,} characters — exceeds the {MAX_CODE_CHARS:,} limit.")
else:
    st.caption(f"{char_count:,} / {MAX_CODE_CHARS:,} characters")

# --- Review action ---
review_disabled = (
    not backend_available
    or not code.strip()
    or char_count > MAX_CODE_CHARS
)

if st.button("Review Code", type="primary", disabled=review_disabled):
    with st.spinner("Reviewing your code..."):
        try:
            resp = requests.post(
                f"{BACKEND_URL}/review",
                json={"code": code},
                timeout=90,
            )
        except requests.RequestException as exc:
            st.error(f"Failed to reach the backend: {exc}")
            st.stop()

    # --- Handle backend response codes explicitly ---
    if resp.status_code == 422:
        st.error("Code is empty or too large. Please adjust and try again.")
        st.stop()
    if resp.status_code == 502:
        st.error("The reviewer service failed (upstream LLM error). Try again shortly.")
        st.stop()
    if not resp.ok:
        st.error(f"Unexpected error from backend (HTTP {resp.status_code}).")
        st.stop()

    # --- Parse and render ---
    try:
        result = resp.json()
    except ValueError:
        st.error("Backend returned an invalid response.")
        st.stop()

    render_results(result)

