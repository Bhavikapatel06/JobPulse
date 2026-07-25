"""
ReportAgent – Rule-based Markdown report generation (no LLM).

Generates a structured, professional Markdown job report from
pre-filtered job listings using pure Python string formatting.

Design choice: Option B — Agno framework, rule-based logic only.
Zero API calls · Zero tokens · Deterministic · Instant

The Agno Agent class is intentionally not used here because no
AI reasoning is required for report formatting. Future agents
(ResumeMatchAgent, CareerAdviceAgent, InterviewAgent) can add
LLM backing to their own modules without modifying this file.
"""

import time
import logging
from typing import Any
from datetime import datetime, timezone

logger = logging.getLogger('agno-service.report-agent')


# ── Markdown helpers ──────────────────────────────────────────────────────────

_NOT_SPECIFIED_VALUES = frozenset({'not specified', '', 'none', 'n/a', 'null', 'undefined'})


def _is_meaningful(value: str) -> bool:
    """Return True if the value is worth displaying."""
    return bool(value) and value.strip().lower() not in _NOT_SPECIFIED_VALUES


def _field_line(icon: str, label: str, value: str) -> str | None:
    """Return a formatted bullet line, or None if the value is empty/default."""
    if not _is_meaningful(value):
        return None
    return f'  {icon} **{label}:** {value.strip()}'


# ── Single job formatter ──────────────────────────────────────────────────────

def _format_job(idx: int, job: dict[str, Any]) -> list[str]:
    """Format one job entry as a list of Markdown lines."""
    lines: list[str] = []

    title      = job.get('title', 'Untitled Position').strip()
    apply_link = (job.get('applyLink') or '').strip()

    # Title — hyperlinked when a valid apply URL exists
    if apply_link.startswith('http'):
        lines.append(f'### {idx}. [{title}]({apply_link})')
    else:
        lines.append(f'### {idx}. {title}')

    lines.append('')

    # Optional structured fields (hidden when "Not specified")
    for line in [
        _field_line('📍', 'Location',   job.get('location', '')),
        _field_line('💼', 'Type',       job.get('employmentType', '')),
        _field_line('🏷️', 'Experience', job.get('experience', '')),
        _field_line('🏢', 'Department', job.get('department', '')),
    ]:
        if line:
            lines.append(line)

    # Description (truncated at 150 chars)
    desc = (job.get('description') or '').strip()
    if desc:
        short = desc[:150] + ('…' if len(desc) > 150 else '')
        lines.append(f'  📝 **Description:** {short}')

    # Apply link row (always shown if present)
    if apply_link.startswith('http'):
        lines.append(f'  🔗 **Apply:** [View listing]({apply_link})')
    elif apply_link:
        lines.append(f'  🔗 **Apply:** {apply_link}')

    # Posted date
    posted = (job.get('postedDate') or '').strip()
    if posted:
        lines.append(f'  📅 **Posted:** {posted}')

    lines.append('')
    return lines


# ── Full report builder ───────────────────────────────────────────────────────

def _build_report(user: dict[str, Any], filtered_jobs: list[dict[str, Any]]) -> str:
    """Compose the complete Markdown report string."""
    now         = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    user_name   = user.get('name', 'User')
    desired_role = user.get('desiredRole', 'Not specified')
    companies   = ', '.join(user.get('companies', [])) or 'N/A'
    loc_filter  = user.get('filters', {}).get('location', '')
    exp_filter  = user.get('filters', {}).get('experienceLevel', '')

    lines: list[str] = []

    # ── Header ───────────────────────────────────────────────────────
    lines += [
        f'# 📋 JobPulse Report — {user_name}',
        '',
        f'> 🕐 Generated: **{now}**',
        '',
        '## Search Preferences',
        '',
        '| Setting | Value |',
        '|---------|-------|',
        f'| Desired Role | {desired_role} |',
        f'| Companies | {companies} |',
    ]
    if _is_meaningful(loc_filter):
        lines.append(f'| Location Filter | {loc_filter} |')
    if _is_meaningful(exp_filter):
        lines.append(f'| Experience Filter | {exp_filter} |')
    lines.append('')

    # ── No results ───────────────────────────────────────────────────
    if not filtered_jobs:
        lines += [
            '---',
            '',
            '> ⚠️ **No matching jobs found** based on your current preferences.',
            '>',
            '> **Tip:** Try broadening your role keyword or removing location / experience filters.',
            '',
            '---',
            f'*Total: 0 jobs · 0 companies · {now}*',
        ]
        return '\n'.join(lines)

    # ── Group by company ─────────────────────────────────────────────
    by_company: dict[str, list[dict[str, Any]]] = {}
    for job in filtered_jobs:
        company = (job.get('company') or 'Unknown').strip()
        by_company.setdefault(company, []).append(job)

    lines.append('---')
    lines.append('')

    job_idx = 1
    for company, jobs in by_company.items():
        job_label = 'job' if len(jobs) == 1 else 'jobs'
        lines.append(f'## 📌 {company}')
        lines.append(f'*{len(jobs)} matching {job_label}*')
        lines.append('')
        for job in jobs:
            lines.extend(_format_job(job_idx, job))
            job_idx += 1

    # ── Footer ───────────────────────────────────────────────────────
    total_companies = len(by_company)
    company_label   = 'company' if total_companies == 1 else 'companies'
    job_label_total = 'job' if len(filtered_jobs) == 1 else 'jobs'

    lines += [
        '---',
        '',
        f'✅ **Report complete** — '
        f'**{len(filtered_jobs)}** {job_label_total} across '
        f'**{total_companies}** {company_label}.',
        '',
        f'*Generated by JobPulse · {now}*',
    ]

    return '\n'.join(lines)


# ── Public entry point ────────────────────────────────────────────────────────

def run_report(
    user:          dict[str, Any],
    filtered_jobs: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Generate a Markdown job report using pure rule-based formatting.

    Option B: No LLM — deterministic, instant, zero tokens consumed.

    Returns a dict with:
      report      – Markdown string
      total_jobs  – number of jobs included in the report
      duration_ms – processing time in milliseconds
    """
    t_start   = time.monotonic()
    user_name = user.get('name', 'Unknown')

    logger.info(
        f'[ReportAgent] Formatting report for "{user_name}" '
        f'({len(filtered_jobs)} jobs, rule-based)...'
    )

    report_text = _build_report(user, filtered_jobs)
    duration_ms = round((time.monotonic() - t_start) * 1000, 2)

    logger.info(
        f'[ReportAgent] ✅ Report for "{user_name}" — '
        f'{len(filtered_jobs)} jobs, {len(report_text)} chars, {duration_ms}ms'
    )

    return {
        'report':      report_text,
        'total_jobs':  len(filtered_jobs),
        'duration_ms': duration_ms,
    }
