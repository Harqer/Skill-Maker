import os
import requests

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

def scrape_with_firecrawl(url: str):
    response = requests.post(
        "https://api.firecrawl.dev/v1/scrape",
        headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}"},
        json={"url": url, "formats": ["markdown"]}
    )
    response.raise_for_status()
    data = response.json()
    if data.get("success"):
        return data.get("data", {}).get("markdown")
    return None

print(scrape_with_firecrawl("https://example.com")[:100])
