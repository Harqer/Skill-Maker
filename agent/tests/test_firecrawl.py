"""Quick smoke-test: hit a live URL with Firecrawl via the shared scraper."""
from scraper import scrape_with_firecrawl

result = scrape_with_firecrawl("https://example.com")
if result:
    print(result[:100])
else:
    print("Firecrawl returned no content (check FIRECRAWL_API_KEY in Infisical).")
