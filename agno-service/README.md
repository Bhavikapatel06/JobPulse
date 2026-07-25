# JobPulse – Agno Python Microservice

A lightweight FastAPI microservice that provides AI-reasoning endpoints
consumed by the Node.js JobPulse backend via HTTP.

## Architecture

```
Node.js Backend (port 3000)
  ↓  POST /verify      (after scraping)
  ↓  POST /report      (after filtering)
Agno Service   (port 8000)
```

## Agents

| Agent | Endpoint | LLM? | Purpose |
|---|---|---|---|
| VerifierAgent | `POST /verify` | ❌ No | Rule-based job validation & dedup |
| ReportAgent   | `POST /report` | ❌ No | Rule-based Markdown report formatting |

> **Mode: Option B — fully rule-based. No API keys required.**
> Future agents (ResumeMatch, CareerAdvice, Interview) will add LLM backing
> to their own modules without changing existing code.

## Setup

### 1. Prerequisites

- Python 3.11+
- No API keys required for current agents

### 2. Create a virtual environment

```bash
cd agno-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment (optional)

```bash
copy .env.example .env   # Windows
# or
cp .env.example .env     # macOS/Linux
```

No API keys required. The default settings work out of the box.
To change port or log level, edit `AGNO_PORT` / `LOG_LEVEL` in `.env`.

### 5. Run the service

```bash
# Development (auto-reload on file changes)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or directly
python main.py
```

The service starts on **http://localhost:8000**.

Interactive API docs: **http://localhost:8000/docs**

## API Reference

### `GET /health`
Liveness probe. Returns `{ "status": "ok" }`.

### `POST /verify`
Validate and clean raw scraped jobs. No LLM calls.

**Request:**
```json
{
  "raw_jobs": [ { "title": "...", "applyLink": "...", ... } ],
  "company": "Stripe",
  "careers_url": "https://stripe.com/jobs"
}
```

**Response:**
```json
{
  "verified_jobs": [ { "jobId": "abc123", "title": "Software Engineer", ... } ],
  "removed_count": 3,
  "duration_ms": 12.4,
  "reason_summary": "Stripe: 7 verified, 2 rejected, 1 duplicate removed."
}
```

### `POST /report`
Generate a Markdown job report using Groq.

**Request:**
```json
{
  "user": {
    "name": "Alice",
    "desiredRole": "backend engineer",
    "companies": ["Stripe", "Vercel"],
    "filters": { "location": "Remote" }
  },
  "filtered_jobs": [ { "title": "...", "company": "Stripe", ... } ]
}
```

**Response:**
```json
{
  "report": "# JobPulse Report — Alice\n\n## Stripe...",
  "total_jobs": 5,
  "duration_ms": 1820.0
}
```

## Adding Future Agents

1. Create `agents/your_agent.py` with a `run_your_agent(...)` function.
2. Add Pydantic schemas to `models/schemas.py`.
3. Register the route in `main.py`.
4. Add a corresponding method in the Node.js `agnoClient.js`.

No other files need to change.

## Graceful Degradation

If this service is unreachable, the Node.js backend automatically falls back
to its built-in JS verifier and report generator. The pipeline never stops.
