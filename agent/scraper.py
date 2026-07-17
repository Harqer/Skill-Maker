"""
scraper.py — Multi-page markdown aggregator for Skill Maker

Priority chain for a given URL:
  1. SimpleScraper /v1/extract  → single-page markdown (fast, preferred)
  2. Firecrawl  /v1/scrape      → single-page markdown (fallback)
  3. Firecrawl  /v1/crawl       → multi-page async crawl (deep-docs fallback)

All scraped content is returned as a single merged markdown string ready
to be passed to the LLM for skill generation and to SkillOpt as training
context.

Secrets are injected via Infisical (SIMPLESCRAPER_API_KEY, FIRECRAWL_API_KEY).
No .env usage — this is a public repo.
"""

import time
import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import SIMPLESCRAPER_API_KEY, FIRECRAWL_API_KEY

# ── Constants ─────────────────────────────────────────────────────────────────

_SIMPLESCRAPER_EXTRACT = "https://api.simplescraper.io/v1/extract"
_FIRECRAWL_SCRAPE      = "https://api.firecrawl.dev/v1/scrape"
_FIRECRAWL_CRAWL       = "https://api.firecrawl.dev/v1/crawl"
_FIRECRAWL_CRAWL_GET   = "https://api.firecrawl.dev/v1/crawl/{job_id}"

_CRAWL_POLL_INTERVAL  = 3       # seconds between status checks
_CRAWL_MAX_WAIT       = 120     # seconds before giving up on crawl job
_CRAWL_MAX_PAGES      = 30      # cap pages to avoid massive context windows
_REQUEST_TIMEOUT      = 60      # seconds for all HTTP calls


# ── Layer 1: SimpleScraper /v1/extract ───────────────────────────────────────

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((requests.exceptions.RequestException, requests.exceptions.Timeout)),
)
def _scrape_simplescraper(url: str) -> str | None:
    """Single-page extraction via SimpleScraper (primary)."""
    if not SIMPLESCRAPER_API_KEY:
        print("[scraper] SIMPLESCRAPER_API_KEY not set — skipping SimpleScraper.")
        return None

    print(f"[scraper] SimpleScraper → {url}")
    try:
        resp = requests.post(
            _SIMPLESCRAPER_EXTRACT,
            headers={
                "Authorization": f"Bearer {SIMPLESCRAPER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"url": url, "extract_format": "markdown"},
            timeout=_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        # API returns {"markdown": "..."} or {"data": {"markdown": "..."}}
        md = data.get("markdown") or data.get("data", {}).get("markdown")
        if md:
            print(f"[scraper] SimpleScraper ✓  ({len(md):,} chars)")
            return md

        print("[scraper] SimpleScraper: no markdown field in response.")
        return None
    except Exception as exc:
        print(f"[scraper] SimpleScraper error: {exc}")
        return None


# ── Layer 2: Firecrawl /v1/scrape (single page) ──────────────────────────────

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((requests.exceptions.RequestException, requests.exceptions.Timeout)),
)
def _scrape_firecrawl_single(url: str) -> str | None:
    """Single-page markdown via Firecrawl /v1/scrape (first fallback)."""
    if not FIRECRAWL_API_KEY:
        print("[scraper] FIRECRAWL_API_KEY not set — skipping Firecrawl scrape.")
        return None

    print(f"[scraper] Firecrawl /scrape → {url}")
    try:
        resp = requests.post(
            _FIRECRAWL_SCRAPE,
            headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
            json={"url": url, "formats": ["markdown"]},
            timeout=_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("success"):
            md = data.get("data", {}).get("markdown")
            if md:
                print(f"[scraper] Firecrawl /scrape ✓  ({len(md):,} chars)")
                return md

        print("[scraper] Firecrawl /scrape: no markdown or success=False.")
        return None
    except Exception as exc:
        print(f"[scraper] Firecrawl /scrape error: {exc}")
        return None


# ── Layer 3: Firecrawl /v1/crawl (multi-page async) ──────────────────────────

def _scrape_firecrawl_crawl(url: str) -> str | None:
    """
    Multi-page async crawl via Firecrawl /v1/crawl (deep-docs fallback).

    Kicks off a crawl job, polls until complete, then aggregates all page
    markdowns into a single string separated by '---' section dividers.
    """
    if not FIRECRAWL_API_KEY:
        print("[scraper] FIRECRAWL_API_KEY not set — skipping Firecrawl crawl.")
        return None

    print(f"[scraper] Firecrawl /crawl (async multi-page) → {url}")
    headers = {"Authorization": f"Bearer {FIRECRAWL_API_KEY}"}

    # 1. Submit crawl job
    try:
        resp = requests.post(
            _FIRECRAWL_CRAWL,
            headers=headers,
            json={
                "url": url,
                "limit": _CRAWL_MAX_PAGES,
                "scrapeOptions": {"formats": ["markdown"]},
                "ignoreSitemap": False,
                "allowBackwardLinks": False,
            },
            timeout=_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        job_id = resp.json().get("id")
        if not job_id:
            print("[scraper] Firecrawl /crawl: no job id returned.")
            return None
        print(f"[scraper] Firecrawl /crawl job started: {job_id}")
    except Exception as exc:
        print(f"[scraper] Firecrawl /crawl submit error: {exc}")
        return None

    # 2. Poll for completion
    status_url = _FIRECRAWL_CRAWL_GET.format(job_id=job_id)
    deadline = time.time() + _CRAWL_MAX_WAIT
    pages: list[dict] = []

    while time.time() < deadline:
        time.sleep(_CRAWL_POLL_INTERVAL)
        try:
            status_resp = requests.get(status_url, headers=headers, timeout=_REQUEST_TIMEOUT)
            status_resp.raise_for_status()
            status_data = status_resp.json()
        except Exception as exc:
            print(f"[scraper] Firecrawl poll error: {exc}")
            break

        job_status = status_data.get("status", "")
        print(f"[scraper] Firecrawl /crawl status: {job_status} "
              f"({status_data.get('completed', 0)}/{status_data.get('total', '?')} pages)")

        if job_status == "completed":
            pages = status_data.get("data", [])
            break
        elif job_status in ("failed", "cancelled"):
            print(f"[scraper] Firecrawl /crawl job {job_status}.")
            return None
        # else: scraping / queued — keep polling

    if not pages:
        print("[scraper] Firecrawl /crawl: timed out or returned no pages.")
        return None

    # 3. Aggregate all pages into one markdown document
    sections: list[str] = []
    for page in pages:
        md   = page.get("markdown", "").strip()
        meta = page.get("metadata", {})
        src  = meta.get("sourceURL") or meta.get("url", "")
        if md:
            header = f"## Page: {src}\n\n" if src else ""
            sections.append(header + md)

    if not sections:
        print("[scraper] Firecrawl /crawl: pages had no markdown content.")
        return None

    combined = "\n\n---\n\n".join(sections)
    print(f"[scraper] Firecrawl /crawl ✓  ({len(pages)} pages, {len(combined):,} chars)")
    return combined


# ── Public API ────────────────────────────────────────────────────────────────

def scrape_docs(url: str) -> str:
    """
    Main entry point.  Tries each layer in order and returns the first
    successful markdown result.  Always returns a non-empty string.

    Layer order:
      1. SimpleScraper  (fast, single page)
      2. Firecrawl /scrape  (single page fallback)
      3. Firecrawl /crawl   (multi-page deep crawl, last resort)
    """
    for scraper_fn in (_scrape_simplescraper, _scrape_firecrawl_single, _scrape_firecrawl_crawl):
        content = scraper_fn(url)
        if content:
            return content

    return (
        f"[scraper] Failed to retrieve content from {url} "
        f"via SimpleScraper, Firecrawl /scrape, or Firecrawl /crawl. "
        f"SkillOpt training data for this URL will be limited."
    )


def scrape_docs_to_temp_store(url: str) -> dict:
    """
    Scrape a URL and return a structured result for downstream use.

    Returns:
        {
          "url": str,
          "markdown": str,
          "page_count": int,
          "source": "simplescraper" | "firecrawl_scrape" | "firecrawl_crawl" | "failed",
          "char_count": int,
        }

    This is the richer entry point used by the SkillOpt training pipeline
    to build skill_card training items from real scraped documentation.
    """
    result = {
        "url": url,
        "markdown": "",
        "page_count": 0,
        "source": "failed",
        "char_count": 0,
    }

    # Try each layer, record which succeeded
    content = _scrape_simplescraper(url)
    if content:
        result.update(markdown=content, source="simplescraper",
                      page_count=1, char_count=len(content))
        return result

    content = _scrape_firecrawl_single(url)
    if content:
        result.update(markdown=content, source="firecrawl_scrape",
                      page_count=1, char_count=len(content))
        return result

    content = _scrape_firecrawl_crawl(url)
    if content:
        page_count = content.count("## Page:") or 1
        result.update(markdown=content, source="firecrawl_crawl",
                      page_count=page_count, char_count=len(content))
        return result

    result["markdown"] = (
        f"Failed to scrape {url}. "
        f"All three layers (SimpleScraper, Firecrawl /scrape, Firecrawl /crawl) failed."
    )
    return result
