# Code Review Agent with Agentic Memory

🚀 **Live Demo:** [code-review-agent-frontend-gray.vercel.app](https://code-review-agent-frontend-gray.vercel.app/)

A professional-grade, AI-powered code review assistant that doesn't just review code—it **learns** from your team’s coding patterns, architectural preferences, and recurring mistakes.

## The Problem
Code reviews in professional teams are often slow, inconsistent, and repetitive. Junior engineers repeat the same mistakes, and senior engineers waste time commenting on the same style violations, missing the bigger architectural picture.

## The Solution: Agentic Growth
Unlike stateless AI assistants, this Code Review Agent uses **Hindsight Memory** to build a persistent "Developer Mental Model." It tracks your past feedback, adapts its disposition (from "Patient Coach" to "Stern Mentor"), and catches issues based on your team's specific history rather than generic linting rules.

### Key Features
*   **Hindsight-Powered Memory:** Fully cloud-native persistence. Every review is stored and used to inform the agent's future behavior.
*   **Agentic History Retrieval:** History is not just a database log; the agent **reflects** on past reviews to reconstruct and summarize your growth trajectory for the dashboard.
*   **Disposition-Aware Reasoning:** The agent automatically adjusts its tone and strictness based on the developer's historical performance.
*   **Multi-Language Support:** Expert review capabilities for **Python, C, C++, TypeScript, JavaScript, Go, Rust, and Java**.
*   **Non-Blocking, Asynchronous Architecture:** Built on FastAPI, leveraging Hindsight’s reflection API to surface deep insights without blocking the review workflow.

## Technology Stack
*   **Memory Layer:** [Hindsight](https://hindsight.vectorize.io/) (Vectorize)
*   **LLM Inference:** [Groq](https://groq.com/) (Qwen3-32B)
*   **Backend:** FastAPI (Python)
*   **Frontend:** React, TailwindCSS, Monaco Editor

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (v3.13+)
*   [Groq API Key](https://groq.com/)
*   [Hindsight API Key](https://ui.hindsight.vectorize.io/)

### Configuration
Create a `.env` file in the root directory:
```bash
GROQ_API_KEY=your_groq_key
HINDSIGHT_API_KEY=your_hindsight_key
HINDSIGHT_BANK_ID=default
```

### Installation & Running

**1. Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
uvicorn main:app --port 8000
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Deployment

This project is configured to be deployed as two separate services: a Dockerized FastAPI backend and a static React frontend.

### 1. Deploying the Backend (Render)
The backend is ready to be deployed to [Render](https://render.com) using the included `Dockerfile` (or `Procfile`).

1. Go to Render and create a new **Web Service**.
2. Connect your GitHub repository.
3. Leave the **Root Directory** empty (Render will automatically detect the configuration in the root).
4. Add the following Environment Variables:
   * `GROQ_API_KEY`
   * `HINDSIGHT_API_KEY`
   * `HINDSIGHT_BANK_ID`
5. Click **Deploy**. Render will build the environment and give you a live URL (e.g., `https://your-backend.onrender.com`).

### 2. Deploying the Frontend (Vercel)
The frontend is a Vite/React application, perfect for free hosting on [Vercel](https://vercel.com).

1. Go to Vercel and create a new **Project**.
2. Connect the same GitHub repository.
3. **CRITICAL:** Set the **Root Directory** to `frontend`.
4. Add the following Environment Variable:
   * `VITE_API_BASE_URL` = `https://your-backend.onrender.com` (Your Render URL)
5. Click **Deploy**. Vercel will build the frontend and provide your live application URL.

## How It Solves the Hackathon Challenge
This project demonstrates that memory is not just a database—it is a reasoning layer.
1.  **Before Memory:** The agent was generic and provided the same feedback for everyone.
2.  **With Hindsight:** The agent identifies if you are an expert or a junior, remembers your "stubborn" habits (like missing `try-except` blocks), and proactively adjusts its review style to force you to improve.

---
*Built for the Hindsight Hackathon.*
