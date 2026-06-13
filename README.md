# AI-Powered Code Review Agent

A comprehensive full-stack application that provides automated, AI-driven code reviews. The agent analyzes Python source code for security, performance, style, and logic issues, and provides actionable improvement suggestions.

## 1. Project Architecture

This application follows a strict separation of concerns:

- **Backend:** A FastAPI-based REST API that orchestrates the review process. It handles LLM interaction (via Groq), database operations (SQLite), and memory retrieval (Hindsight Cloud).
- **Frontend:** A React+Vite application that provides a modern, interactive workspace utilizing Monaco Editor for code input and a dashboard for monitoring code quality trends.

### Data Flow
1. User inputs code via the **Frontend Workspace**.
2. Frontend sends a `POST` request to the **Backend** `/review` endpoint.
3. Backend validates input and prompts **Groq (Qwen3-32B)** with context from historical data (via Hindsight).
4. Backend parses structured JSON, persists the review to SQLite, and returns results to the Frontend for rendering.

## 2. System Requirements

- **Python 3.10+**
- **Node.js 20+ & npm 10+**
- **Git**

## 3. Detailed Setup Instructions

### 3.1 Clone the Repository
```bash
git clone <your-repo-url>
cd code-review-agent
```

### 3.2 Backend Configuration
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r ../requirements.txt

# Create and configure .env
cp .env.example .env
# Required: Set GROQ_API_KEY
# Optional: Set HINDSIGHT_API_KEY and HINDSIGHT_BANK_ID for memory features
```

### 3.3 Frontend Configuration
```bash
cd ../frontend
npm install

# Create and configure .env
cat <<EOF > .env
VITE_API_BASE_URL=http://localhost:8000
EOF
```

## 4. Running the Application

This project requires two terminal sessions.

### Terminal 1: Backend
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```
*API documentation is automatically available at `http://localhost:8000/docs`.*

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
*The application is available at the URL provided by Vite (typically `http://localhost:5173`).*

## 5. Troubleshooting

| Issue | Resolution |
| :--- | :--- |
| **CORS Errors** | Ensure backend `CORSMiddleware` is configured to allow `http://localhost:5173`. |
| **Backend 404** | Verify that `VITE_API_BASE_URL` in `frontend/.env` matches the backend port. |
| **LLM Fails** | Ensure `GROQ_API_KEY` is correctly set in `backend/.env`. |
| **Memory Issues** | Verify `HINDSIGHT_API_KEY` and connection status in logs. |

## 6. API Reference

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns `{"status": "ok"}`. |
| `POST` | `/review` | Analyzes code payload. Returns structured `ReviewResponse`. |
| `GET` | `/history` | Returns all past reviews. |
| `GET` | `/memory` | Returns historical insights/trends. |

## 7. Project Structure
- `/backend`: FastAPI application, database logic, Pydantic models.
- `/frontend`: React+Vite source code (components, hooks, pages, services).
