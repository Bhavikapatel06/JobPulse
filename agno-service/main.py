"""
JobPulse – Agno Python Microservice
────────────────────────────────────────────────────────────────────

FastAPI application that exposes AI-reasoning endpoints consumed by
the Node.js backend via HTTP.

Endpoints:
  GET  /health   – Liveness probe
  POST /verify   – VerifierAgent (rule-based, 0 tokens)
  POST /report   – ReportAgent   (Agno + Groq LLM)

Future agents (add without touching Node.js agnoClient.js routing):
  POST /resume-match   – ResumeMatchAgent
  POST /career-advice  – CareerAdviceAgent
  POST /interview      – InterviewAgent
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

import config
from agents.verifier_agent import run_verifier
from agents.report_agent import run_report
from models.schemas import (
    VerifyRequest,
    VerifyResponse,
    ReportRequest,
    ReportResponse,
)

# ── Logging setup ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger('agno-service')

_startup_time = time.time()


# ── Application lifecycle ─────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('🐍  JobPulse Agno Service – starting up')
    logger.info(f'    Host  : {config.AGNO_HOST}:{config.AGNO_PORT}')
    logger.info('    Mode  : Rule-based (Option B)')
    logger.info('    Routes: GET /health  |  POST /verify  |  POST /report')
    yield
    logger.info('🛑  JobPulse Agno Service – shutting down')


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title='JobPulse Agno Service',
    description=(
        'AI-reasoning microservice for JobPulse.\n\n'
        '**Current mode: Option B — fully rule-based (no LLM)**\n\n'
        '- **VerifierAgent** — rule-based job validation (0 tokens)\n'
        '- **ReportAgent**   — rule-based Markdown report formatting (0 tokens)\n\n'
        'Future agents (ResumeMatch, CareerAdvice, Interview) can add LLM backing '
        'to their own modules without touching existing code.'
    ),
    version='1.0.0',
    lifespan=lifespan,
)


# ── Global error handler ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f'Unhandled error on {request.url.path}: {exc}')
    return JSONResponse(
        status_code=500,
        content={'detail': f'Internal server error: {str(exc)}'},
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get('/health', tags=['System'])
def health():
    """
    Liveness probe. Returns 200 when the service is ready.
    Node.js agnoClient uses this before falling back to JS logic.
    """
    return {
        'status':    'ok',
        'service':   'agno',
        'uptime_s':  round(time.time() - _startup_time, 1),
        'mode':      'rule-based',
    }


@app.post(
    '/verify',
    response_model=VerifyResponse,
    tags=['Agents'],
    summary='VerifierAgent – rule-based job validation (0 LLM tokens)',
)
async def verify(req: VerifyRequest):
    """
    Accepts raw scraped job objects from the Node.js ScrapingAgent.

    Applies rule-based validation:
    - Rejects junk titles (navigation items, empty strings)
    - Validates and sanitises apply links
    - Normalises location abbreviations and field whitespace
    - Deduplicates by SHA-256(title + applyLink)

    Returns clean, verified job objects ready for MongoDB.
    """
    logger.info(
        f'[VerifierAgent] → {len(req.raw_jobs)} raw jobs '
        f'for "{req.company or "unknown"}"'
    )
    try:
        result = run_verifier(req.raw_jobs, req.company, req.careers_url)
        logger.info(
            f'[VerifierAgent] ✅ {len(result["verified_jobs"])} verified, '
            f'{result["removed_count"]} removed '
            f'({result["duration_ms"]}ms) — {result["reason_summary"]}'
        )
        return result
    except Exception as exc:
        logger.error(f'[VerifierAgent] ❌ {exc}')
        raise HTTPException(status_code=500, detail=str(exc))


@app.post(
    '/report',
    response_model=ReportResponse,
    tags=['Agents'],
    summary='ReportAgent – rule-based Markdown report formatting (0 LLM tokens)',
)
async def report(req: ReportRequest):
    """
    Generates a readable Markdown job report for a user.

    Receives pre-filtered jobs (from Node.js FilteringAgent) and
    formats them into a structured Markdown document using pure
    rule-based Python logic — no LLM calls, no API tokens consumed.

    Output includes:
    - User preferences summary table
    - Jobs grouped by company with all available fields
    - Summary footer with total count and timestamp
    """
    user_name = req.user.get('name', 'Unknown')
    logger.info(
        f'[ReportAgent] → generating report for "{user_name}" '
        f'({len(req.filtered_jobs)} jobs)'
    )
    try:
        result = run_report(req.user, req.filtered_jobs)
        logger.info(
            f'[ReportAgent] ✅ report for "{user_name}" — '
            f'{result["total_jobs"]} jobs, {result["duration_ms"]}ms'
        )
        return result
    except Exception as exc:
        logger.error(f'[ReportAgent] ❌ {exc}')
        raise HTTPException(status_code=500, detail=str(exc))


# ── Dev runner (python main.py) ───────────────────────────────────────────────

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(
        'main:app',
        host=config.AGNO_HOST,
        port=config.AGNO_PORT,
        reload=True,
        log_level=config.LOG_LEVEL.lower(),
    )
