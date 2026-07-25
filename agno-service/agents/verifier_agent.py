"""
VerifierAgent – Rule-based job validation (no LLM calls).

Validates, cleans, and deduplicates raw job listings extracted by
the Node.js ScrapingAgent before they are saved to MongoDB.

Option B: Deterministic rule-based logic only.
Zero tokens consumed. No Agno Agent class used here.

Rules applied (mirror of JS verifierAgent.js + enhancements):
  1. Title verification   – reject navigation junk, empty, or too-short titles.
  2. Link verification    – require valid absolute HTTP/HTTPS URL; reject assets.
  3. Field normalization  – strip HTML, collapse whitespace, title-case company.
  4. Location expansion   – expand common abbreviations (US → United States).
  5. Deduplication        – unique by SHA-256(title + applyLink).
"""

import hashlib
import re
import time
from typing import Any
from urllib.parse import urlparse, parse_qs


# ── Junk title patterns ──────────────────────────────────────────────────────

_JUNK_TITLE_RE: list[re.Pattern] = [
    re.compile(r'^\s*sign\s+in\s*$', re.I),
    re.compile(r'^\s*log\s+in\s*$', re.I),
    re.compile(r'^\s*careers?\s*$', re.I),
    re.compile(r'^\s*home\s*$', re.I),
    re.compile(r'^\s*jobs?\s*$', re.I),
    re.compile(r'^\s*search\s*$', re.I),
    re.compile(r'^\s*search\s+jobs\s*$', re.I),
    re.compile(r'^\s*apply\s*$', re.I),
    re.compile(r'^\s*apply\s+now\s*$', re.I),
    re.compile(r'^\s*view\s+all\s+jobs\s*$', re.I),
    re.compile(r'^\s*see\s+all\s+jobs\s*$', re.I),
    re.compile(r'^\s*privacy\s+policy\s*$', re.I),
    re.compile(r'^\s*terms\s+of\s+service\s*$', re.I),
    re.compile(r'^\s*terms?\s+&?\s+conditions?\s*$', re.I),
    re.compile(r'^\s*skip\s+to\s+main\s+content\s*$', re.I),
    re.compile(r'^\s*cookie\s+settings?\s*$', re.I),
    re.compile(r'^\s*about\s+us\s*$', re.I),
    re.compile(r'^\s*contact\s+us\s*$', re.I),
    re.compile(r'^\s*(undefined|null|none|n/a)\s*$', re.I),
    re.compile(r'^\s*back\s*$', re.I),
    re.compile(r'^\s*menu\s*$', re.I),
    re.compile(r'^\s*filter\s*$', re.I),
]

# ── Static-asset link extensions that are never apply links ──────────────────

_JUNK_EXTENSIONS: frozenset[str] = frozenset([
    '.mp4', '.mp3', '.wav', '.ogg',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2',
    '.css', '.js', '.map',
])

# Apply-link path suffixes that represent listing pages, not individual jobs
_JUNK_PATHS: frozenset[str] = frozenset(['/search', '/jobs', '/search-jobs', '/careers'])

# ── Location abbreviation expansion ─────────────────────────────────────────

_LOCATION_ABBR: list[tuple[re.Pattern, str]] = [
    (re.compile(r'\bU\.?S\.?A?\.?\b'), 'United States'),
    (re.compile(r'\bUnited States of America\b', re.I), 'United States'),
    (re.compile(r'\bU\.?K\.?\b'), 'United Kingdom'),
    (re.compile(r'\bGreat Britain\b', re.I), 'United Kingdom'),
    (re.compile(r'\b(?<!\w)IN(?!\w)\b'), 'India'),
    (re.compile(r'\bDE\b'), 'Germany'),
    (re.compile(r'\b(?<!\w)CA(?!\w)\b'), 'Canada'),
    (re.compile(r'\bAU\b'), 'Australia'),
    (re.compile(r'\bSG\b'), 'Singapore'),
    (re.compile(r'\bAE\b'), 'United Arab Emirates'),
    (re.compile(r'\bNL\b'), 'Netherlands'),
    (re.compile(r'\bFR\b'), 'France'),
]

# ── Known company name suffixes to preserve (never lowercase these) ──────────
_PRESERVE_CAPS: frozenset[str] = frozenset([
    'IBM', 'AWS', 'GCP', 'SAP', 'HPE', 'KPMG', 'EY', 'PwC',
    'LLC', 'LLP', 'Inc', 'Ltd', 'Corp', 'SE', 'AG', 'NV', 'BV',
])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def _strip_html(text: str) -> str:
    return re.sub(r'<[^>]+>', '', text or '')


def _clean(text: str) -> str:
    """Strip HTML tags and collapse whitespace."""
    return re.sub(r'\s+', ' ', _strip_html(str(text or ''))).strip()


def _is_valid_title(title: str) -> bool:
    """Return True if `title` looks like a genuine job title."""
    if not title or not isinstance(title, str):
        return False
    t = title.strip()
    if len(t) < 3 or len(t) > 150:
        return False
    for pattern in _JUNK_TITLE_RE:
        if pattern.match(t):
            return False
    return True


def _is_valid_link(link: str) -> bool:
    """Return True if `link` is a plausible job-application URL."""
    if not link or not isinstance(link, str):
        return False
    s = link.strip()
    if not (s.startswith('http://') or s.startswith('https://')):
        return False
    try:
        parsed = urlparse(s)
        path_lower = parsed.path.lower()

        # Reject static assets
        for ext in _JUNK_EXTENSIONS:
            if path_lower.endswith(ext):
                return False

        # Reject bare listing pages without a job-specific query param
        if path_lower.rstrip('/') in _JUNK_PATHS:
            qs = parse_qs(parsed.query)
            has_job_id = any(k in qs for k in ('jobId', 'reqid', 'id', 'jid', 'job_id'))
            if not has_job_id:
                return False

        return True
    except Exception:
        return False


def _normalize_location(location: str) -> str:
    """Expand location abbreviations to full names."""
    result = location
    for pattern, replacement in _LOCATION_ABBR:
        result = pattern.sub(replacement, result)
    return result.strip()


def _normalize_company(name: str) -> str:
    """
    Title-case company name while preserving known all-caps abbreviations.
    e.g. 'IBM india' → 'IBM India'
    """
    if not name:
        return name
    words = name.strip().split()
    return ' '.join(
        w if w.upper() in _PRESERVE_CAPS else w.capitalize()
        for w in words
    )


# ── Core verification logic ───────────────────────────────────────────────────

def _verify_single(raw: dict[str, Any], fallback_url: str) -> dict[str, Any] | None:
    """
    Verify and clean a single raw job object.
    Returns a clean dict or None if the job is invalid.
    """
    if not isinstance(raw, dict):
        return None

    # 1. Title
    title = _clean(raw.get('title', ''))
    if not _is_valid_title(title):
        return None

    # 2. Apply link  (handle both camelCase and snake_case keys)
    apply_link = _clean(
        raw.get('applyLink') or raw.get('apply_link') or ''
    )
    if not _is_valid_link(apply_link):
        apply_link = fallback_url.strip() if _is_valid_link(fallback_url) else ''
    if not apply_link:
        return None

    # 3. Normalise remaining fields
    raw_location = _clean(raw.get('location', '') or 'Not specified') or 'Not specified'
    location = _normalize_location(raw_location)

    experience     = _clean(raw.get('experience', '') or 'Not specified') or 'Not specified'
    employment_type = _clean(
        raw.get('employmentType') or raw.get('employment_type') or 'Not specified'
    ) or 'Not specified'
    description    = _clean(raw.get('description', ''))[:300]
    posted_date    = raw.get('postedDate') or raw.get('posted_date') or None
    department     = _clean(raw.get('department', ''))

    # 4. Stable jobId
    job_id = (
        raw.get('jobId') or raw.get('job_id')
        or _sha256(f"{title.lower()}_{apply_link.lower()}")
    )

    return {
        'jobId':          job_id,
        'title':          title,
        'location':       location,
        'experience':     experience,
        'employmentType': employment_type,
        'department':     department,
        'description':    description,
        'applyLink':      apply_link,
        'postedDate':     posted_date,
    }


# ── Public entry point ────────────────────────────────────────────────────────

def run_verifier(
    raw_jobs:    list[dict[str, Any]],
    company:     str = '',
    careers_url: str = '',
) -> dict[str, Any]:
    """
    Verify a list of raw scraped job objects.

    Returns a dict with:
      verified_jobs  – list of clean, deduplicated job dicts
      removed_count  – number of jobs rejected
      duration_ms    – processing time
      reason_summary – human-readable summary string
    """
    t_start = time.monotonic()

    if not isinstance(raw_jobs, list) or len(raw_jobs) == 0:
        return {
            'verified_jobs':  [],
            'removed_count':  0,
            'duration_ms':    0.0,
            'reason_summary': f'{company or "Jobs"}: no raw jobs provided.',
        }

    seen:     dict[str, dict[str, Any]] = {}
    rejected: int = 0

    for raw in raw_jobs:
        clean = _verify_single(raw, careers_url)
        if clean is None:
            rejected += 1
            continue
        # Deduplicate by jobId (first-seen wins)
        if clean['jobId'] not in seen:
            seen[clean['jobId']] = clean

    verified   = list(seen.values())
    duration   = round((time.monotonic() - t_start) * 1000, 2)
    duplicates = len(raw_jobs) - rejected - len(verified)

    summary = (
        f'{company or "Jobs"}: {len(verified)} verified, '
        f'{rejected} rejected (junk/invalid), '
        f'{duplicates} duplicates removed.'
    )

    return {
        'verified_jobs':  verified,
        'removed_count':  rejected + duplicates,
        'duration_ms':    duration,
        'reason_summary': summary,
    }
