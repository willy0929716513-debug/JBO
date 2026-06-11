"""
Odds Fetcher - Real NPB odds from The Odds API
即時NPB賠率抓取模組
"""

import httpx
from typing import Optional

ODDS_API_BASE = "https://api.the-odds-api.com/v4"
NPB_SPORT_KEY = "baseball_npb"


def fetch_npb_odds(api_key: str, regions: str = "eu", markets: str = "h2h,totals") -> dict:
    """
    Fetch live NPB odds from The Odds API.
    Returns list of games with h2h and totals markets.
    Free tier: 500 requests/month.
    """
    url = f"{ODDS_API_BASE}/sports/{NPB_SPORT_KEY}/odds"
    params = {
        "apiKey": api_key,
        "regions": regions,
        "markets": markets,
        "oddsFormat": "decimal",
        "dateFormat": "iso",
    }
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            remaining = resp.headers.get("x-requests-remaining", "?")
            return {
                "success": True,
                "games": data,
                "requests_remaining": remaining,
                "count": len(data),
            }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            return {"success": False, "error": "無效的 API Key / Invalid API key", "games": []}
        elif e.response.status_code == 422:
            return {"success": False, "error": "NPB 賽季未開始或無可用賽事", "games": []}
        return {"success": False, "error": str(e), "games": []}
    except Exception as e:
        return {"success": False, "error": str(e), "games": []}


def fetch_npb_events(api_key: str) -> dict:
    """Fetch upcoming NPB events (no odds, just schedule)."""
    url = f"{ODDS_API_BASE}/sports/{NPB_SPORT_KEY}/events"
    params = {"apiKey": api_key, "dateFormat": "iso"}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            return {"success": True, "events": resp.json()}
    except Exception as e:
        return {"success": False, "error": str(e), "events": []}
