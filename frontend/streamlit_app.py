"""Streamlit UI for the Code Review Agent.

This layer is presentation-only: it collects Python code (via upload or
paste), sends it to the FastAPI backend, and renders the structured
review. It contains no LLM or business logic.
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
            st.markdown(f"{index}. {title} **:{color}[{severity}]**")
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


# --- Backend availability check ---
backend_available = backend_is_up()
if not backend_available:
    st.error(
        f"Backend is not reachable at {BACKEND_URL}. "
        "Start the backend and reload this page."
    )

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
