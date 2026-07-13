import os
import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type


SIMPLESCRAPER_API_KEY = os.getenv("SIMPLESCRAPER_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((requests.exceptions.RequestException, requests.exceptions.Timeout))
)
def scrape_with_simplescraper(url: str) -> str:
    """Scrapes a single URL using Simplescraper Extract endpoint with exponential backoff."""
    print(f"Attempting to scrape {url} with Simplescraper...")
    if not SIMPLESCRAPER_API_KEY:
        print("SIMPLESCRAPER_API_KEY not set.")
        return None
        
    api_url = "https://api.simplescraper.io/v1/extract"
    headers = {
        'Authorization': f'Bearer {SIMPLESCRAPER_API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {
        "url": url,
        "markdown": True
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        if "markdown" in data:
            print("Successfully scraped with Simplescraper.")
            return data["markdown"]
        print("Simplescraper response missing 'markdown' field.")
        return None
    except Exception as e:
        print(f"Simplescraper failed: {e}")
        return None

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception)
)
def scrape_with_firecrawl(url: str) -> str:
    """Fallback to Firecrawl if Simplescraper fails, with exponential backoff."""
    print(f"Falling back to scrape {url} with Firecrawl...")
    if not FIRECRAWL_API_KEY:
        print("FIRECRAWL_API_KEY not set.")
        return None
        
    try:
        response = requests.post(
            "https://api.firecrawl.dev/v1/scrape",
            headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
            json={"url": url, "formats": ["markdown"]},
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        
        if data.get("success"):
            markdown_content = data.get("data", {}).get("markdown")
            if markdown_content:
                print("Successfully scraped with Firecrawl.")
                return markdown_content
                
        print("Firecrawl response missing 'markdown' field or success was False.")
        return None
    except Exception as e:
        print(f"Firecrawl failed: {e}")
        return None

def scrape_docs(url: str) -> str:
    """Main scraping function prioritizing Simplescraper, falling back to Firecrawl."""
    content = scrape_with_simplescraper(url)
    if content:
        return content
        
    content = scrape_with_firecrawl(url)
    if content:
        return content
        
    return f"Failed to scrape content from {url} using both Simplescraper and Firecrawl."
