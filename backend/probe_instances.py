import httpx
import json
import sys

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/html",
}
params = {"q": "India government digital scheme", "format": "json"}

urls = [
    "https://search.inetol.net/search",
    "https://search.hbubli.cc/search",
]

for u in urls:
    print(f"\nTrying {u}...")
    try:
        r = httpx.get(u, params=params, headers=headers, timeout=15, follow_redirects=True)
        print(f"  Status: {r.status_code}")
        ct = r.headers.get("content-type", "unknown")
        print(f"  Content-Type: {ct}")
        print(f"  Body (first 500 chars): {r.text[:500]}")
    except Exception as e:
        print(f"  Error: {e}")
