"""
JobPulse – Agno Service Configuration
Loads environment variables from .env (or system environment).

Current mode: Option B — fully rule-based (no LLM).
No API keys required for the current agents.

To enable LLM-backed agents in the future (e.g. ResumeMatchAgent):
  - Uncomment GROQ_API_KEY / GROQ_MODEL below
  - Add `groq>=0.9.0` to requirements.txt
  - Set the key in your .env file
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Server ────────────────────────────────────────────────────────────────────
AGNO_HOST: str = os.getenv('AGNO_HOST', '0.0.0.0')
AGNO_PORT: int = int(os.getenv('AGNO_PORT', '8000'))

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO').upper()

# ── Future LLM config (uncomment when adding LLM-backed agents) ───────────────
# GROQ_API_KEY: str = os.getenv('GROQ_API_KEY', '')
# GROQ_MODEL:   str = os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')
