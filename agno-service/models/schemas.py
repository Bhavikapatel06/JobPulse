"""
Pydantic v2 request / response schemas for the Agno microservice.
"""

from typing import Any
from pydantic import BaseModel, Field


# ── /verify ──────────────────────────────────────────────────────────────────

class VerifyRequest(BaseModel):
    raw_jobs:    list[dict[str, Any]] = Field(..., description='Raw job objects from ScrapingAgent')
    company:     str                  = Field('', description='Company display name (for logging)')
    careers_url: str                  = Field('', description='Fallback URL if applyLink is missing/invalid')


class VerifyResponse(BaseModel):
    verified_jobs:  list[dict[str, Any]] = Field(..., description='Cleaned, deduplicated job objects')
    removed_count:  int                  = Field(..., description='Total rejected + duplicate jobs')
    duration_ms:    float                = Field(..., description='Processing time in milliseconds')
    reason_summary: str                  = Field('',  description='Human-readable summary of what was done')


# ── /report ──────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    user:          dict[str, Any]       = Field(..., description='User preferences object')
    filtered_jobs: list[dict[str, Any]] = Field(..., description='Pre-filtered jobs from Node.js FilteringAgent')


class ReportResponse(BaseModel):
    report:      str   = Field(..., description='Generated Markdown report text')
    total_jobs:  int   = Field(..., description='Number of jobs included in the report')
    duration_ms: float = Field(..., description='Processing time in milliseconds')
