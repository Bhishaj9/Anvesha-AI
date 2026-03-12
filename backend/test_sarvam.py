"""
test_sarvam.py — Quick tests for the Sarvam AI service layer.

Run: python test_sarvam.py
Requires: SARVAM_API_KEY set in .env
"""

import asyncio
import json
import sys
from config import get_settings
from sarvam_service import route_query, synthesize_response


def print_section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


async def test_router():
    """Test the Router (Sarvam 30B) query decomposition."""
    print_section("TEST 1: Router — Query Decomposition (Sarvam 30B)")

    test_queries = [
        "Latest budget news",
        "RTI Act rules and amendments",
        "Digital India initiative progress 2025",
    ]

    for query in test_queries:
        print(f"Input:  \"{query}\"")
        try:
            result = await route_query(query)
            print(f"Output: {json.dumps(result, indent=2)}")
            print(f"Count:  {len(result)} queries")
            assert isinstance(result, list), "Expected list"
            assert len(result) >= 1, "Expected at least 1 query"
            print("Status: ✅ PASS\n")
        except Exception as e:
            print(f"Status: ❌ FAIL — {e}\n")


async def test_synthesizer():
    """Test the Synthesizer (Sarvam 105B) with mock search results."""
    print_section("TEST 2: Synthesizer — Sutra Generation (Sarvam 105B)")

    mock_results = [
        {
            "title": "Union Budget 2025-26 Highlights",
            "url": "https://www.indiabudget.gov.in/highlights",
            "content": "The Union Budget 2025-26 proposes significant changes to income tax slabs, "
                       "with the new regime offering zero tax up to ₹12 lakh. Infrastructure spending "
                       "increased to ₹11.2 lakh crore.",
        },
        {
            "title": "Budget 2025: Key Takeaways for Indian Economy",
            "url": "https://economictimes.indiatimes.com/budget-2025",
            "content": "Finance Minister announced major agricultural reforms and a new urban housing scheme. "
                       "The fiscal deficit target is set at 4.4% of GDP.",
        },
        {
            "title": "Digital India Budget Allocation 2025",
            "url": "https://www.digitalindia.gov.in/budget-2025",
            "content": "Digital India received ₹15,000 crore allocation for AI research and semiconductor "
                       "manufacturing. New centres of excellence to be established across 10 states.",
        },
        {
            "title": "Budget Analysis by Financial Experts",
            "url": "https://www.moneycontrol.com/budget-analysis",
            "content": "Market analysts view the budget positively, expecting GDP growth of 7% in FY26. "
                       "FDI reforms could attract $100 billion in investments.",
        },
    ]

    query = "What are the highlights of the 2025 Union Budget?"
    print(f"Query:   \"{query}\"")
    print(f"Context: {len(mock_results)} search results ({sum(1 for r in mock_results if '.gov.in' in r['url'])} .gov.in)\n")

    try:
        result = await synthesize_response(query, mock_results)
        print(f"Summary:\n{result.get('summary', 'N/A')}\n")
        print(f"Citations ({len(result.get('citations', []))}):")
        for c in result.get("citations", []):
            gov_tag = " 🏛️ GOV.IN" if c.get("is_gov") else ""
            print(f"  [{c.get('index')}] {c.get('title', 'N/A')} — {c.get('url', 'N/A')}{gov_tag}")
        print("\nStatus: ✅ PASS")
    except Exception as e:
        print(f"Status: ❌ FAIL — {e}")


async def test_synthesizer_empty():
    """Test the Synthesizer with no results."""
    print_section("TEST 3: Synthesizer — Empty Results")

    result = await synthesize_response("test query", [])
    print(f"Summary: {result.get('summary', 'N/A')}")
    assert "no search results" in result["summary"].lower() or "No search results" in result["summary"]
    print("Status: ✅ PASS")


async def main():
    settings = get_settings()
    print(f"Sarvam API Base: {settings.SARVAM_API_BASE}")
    print(f"Router Model:    {settings.SARVAM_ROUTER_MODEL}")
    print(f"Synth Model:     {settings.SARVAM_SYNTH_MODEL}")
    print(f"API Key:         {'***' + settings.SARVAM_API_KEY[-4:] if settings.SARVAM_API_KEY else 'NOT SET'}")

    if not settings.SARVAM_API_KEY or settings.SARVAM_API_KEY == "your_sarvam_api_key_here":
        print("\n⚠️  SARVAM_API_KEY is not configured.")
        print("   Set it in backend/.env to run live tests.")
        print("   Running offline tests only...\n")
        await test_synthesizer_empty()
        return

    await test_router()
    await test_synthesizer()
    await test_synthesizer_empty()


if __name__ == "__main__":
    asyncio.run(main())
