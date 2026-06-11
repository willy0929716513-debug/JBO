"""
NPB Analysis Web Dashboard - FastAPI Backend
NPB分析儀表板 — 後端API服務
"""

import sys
import os
from copy import copy
from typing import Any, Dict, Optional

# Add parent directory to path so we can import npb_analyzer
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from web.odds_fetcher import fetch_npb_odds

# NPB Analyzer imports
from npb_analyzer.models.game import GameInfo, PitcherStats, BullpenStats, TeamStats
from npb_analyzer.analyzers import (
    analyze_pitcher, analyze_bullpen, analyze_lineup,
    analyze_defense, analyze_park, analyze_weather,
    analyze_form, analyze_schedule, analyze_odds,
)
from npb_analyzer.betting import (
    kelly_criterion, calculate_clv, run_monte_carlo,
    calculate_elo_win_prob, calculate_bet_score,
    NPB_ELO_DEFAULTS,
)
from npb_analyzer.engine import calculate_win_probability, predict_total_runs, generate_report

# ─────────────────────────────────────────────────────────────
# FastAPI App Setup
# ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="NPB AI 分析儀表板",
    description="日本職棒賽事AI分析與投注建議平台",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & templates
_here = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(_here, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(_here, "templates"))


# ─────────────────────────────────────────────────────────────
# Sample data (imported from sample_game.py)
# ─────────────────────────────────────────────────────────────

def _get_sample_data() -> dict:
    """Import and return SAMPLE_DATA from sample_game.py."""
    import importlib.util
    sample_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_game.py")
    spec = importlib.util.spec_from_file_location("sample_game", sample_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.SAMPLE_DATA


# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.get("/")
async def index(request: Request):
    """Serve the main dashboard."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/odds")
async def get_odds(api_key: str = ""):
    """Fetch live NPB odds from The Odds API."""
    if not api_key:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "請提供 API Key / Please provide an API key", "games": []},
        )
    result = fetch_npb_odds(api_key)
    return result


@app.get("/api/sample")
async def get_sample():
    """Return SAMPLE_DATA as JSON for demo/testing."""
    try:
        data = _get_sample_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"載入範例資料失敗: {str(e)}")


@app.post("/api/analyze")
async def analyze(request: Request):
    """
    Run full NPB analysis on the provided game data.
    Accepts JSON body matching the SAMPLE_DATA format.
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="無效的 JSON 格式")

    try:
        result = _run_analysis(data)
        return result
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"缺少必要欄位: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失敗: {str(e)}")


# ─────────────────────────────────────────────────────────────
# Core Analysis Pipeline
# ─────────────────────────────────────────────────────────────

def _build_game_info(gi: dict) -> GameInfo:
    return GameInfo(
        home_team=gi["home_team"],
        away_team=gi["away_team"],
        stadium=gi["stadium"],
        datetime=gi["datetime"],
        is_day_game=gi.get("is_day_game", False),
        park_factor=gi.get("park_factor", 1.00),
        hr_factor=gi.get("hr_factor", 1.00),
        scoring_factor=gi.get("scoring_factor", 1.00),
        turf_type=gi.get("turf_type", "natural"),
        temperature=gi.get("temperature", 22.0),
        humidity=gi.get("humidity", 60.0),
        rain_pct=gi.get("rain_pct", 0.0),
        wind_direction=gi.get("wind_direction", "none"),
        wind_speed_kmh=gi.get("wind_speed_kmh", 0.0),
        is_travel_game=gi.get("is_travel_game", False),
        consecutive_away_games=gi.get("consecutive_away_games", 0),
        consecutive_games_played=gi.get("consecutive_games_played", 0),
        days_since_last_game=gi.get("days_since_last_game", 1),
    )


def _build_pitcher(p: dict) -> PitcherStats:
    return PitcherStats(
        era=p["era"],
        whip=p["whip"],
        fip=p["fip"],
        xera=p["xera"],
        k9=p["k9"],
        bb9=p["bb9"],
        recent_5_games=p.get("recent_5_games", []),
        home_era=p.get("home_era", 0.0),
        away_era=p.get("away_era", 0.0),
        day_era=p.get("day_era", 0.0),
        night_era=p.get("night_era", 0.0),
        vs_opponent_era=p.get("vs_opponent_era", 0.0),
        vs_opponent_games=p.get("vs_opponent_games", 0),
        vs_lhb_ops=p.get("vs_lhb_ops", 0.700),
        vs_rhb_ops=p.get("vs_rhb_ops", 0.700),
        pitch_count_limit=p.get("pitch_count_limit", 100),
        rest_days=p.get("rest_days", 5),
        handedness=p.get("handedness", "R"),
        pitch_mix=p.get("pitch_mix", {}),
    )


def _build_bullpen(b: dict) -> BullpenStats:
    return BullpenStats(
        era=b["era"],
        last_7_days_ip=b.get("last_7_days_ip", 0.0),
        last_3_days_ip=b.get("last_3_days_ip", 0.0),
        consecutive_days=b.get("consecutive_days", 0),
        closer_available=b.get("closer_available", True),
        setup_fatigued=b.get("setup_fatigued", False),
        save_opportunities=b.get("save_opportunities", 0),
        blown_saves=b.get("blown_saves", 0),
        holds=b.get("holds", 0),
    )


def _build_team_stats(t: dict) -> TeamStats:
    return TeamStats(
        ops=t["ops"],
        wrc_plus=t["wrc_plus"],
        runs_scored_last_10=t.get("runs_scored_last_10", []),
        slg=t.get("slg", 0.400),
        obp=t.get("obp", 0.330),
        vs_lhp_ops=t.get("vs_lhp_ops", 0.700),
        vs_rhp_ops=t.get("vs_rhp_ops", 0.700),
        fielding_pct=t.get("fielding_pct", 0.980),
        drs=t.get("drs", 0.0),
        uzr=t.get("uzr", 0.0),
        catcher_cs_pct=t.get("catcher_cs_pct", 0.30),
        error_rate=t.get("error_rate", 0.02),
        last_5_record=t.get("last_5_record", "3-2"),
        last_10_record=t.get("last_10_record", "5-5"),
        last_20_record=t.get("last_20_record", "10-10"),
        team_ops_trend=t.get("team_ops_trend", 0.0),
        team_era_trend=t.get("team_era_trend", 0.0),
    )


def _run_analysis(data: dict) -> dict:
    """
    Run the full NPB analysis pipeline and return structured JSON result.
    """
    # Build dataclass objects
    game_info = _build_game_info(data["game_info"])
    home_pitcher = _build_pitcher(data["home_pitcher"])
    away_pitcher = _build_pitcher(data["away_pitcher"])
    home_bullpen = _build_bullpen(data["home_bullpen"])
    away_bullpen = _build_bullpen(data["away_bullpen"])
    home_stats = _build_team_stats(data["home_team_stats"])
    away_stats = _build_team_stats(data["away_team_stats"])

    odds_data = data.get("odds", {})
    betting_data = data.get("betting", {})
    elo_overrides = data.get("elo_overrides", {})

    # ── Run all nine analyzers ──
    hp = analyze_pitcher(home_pitcher)
    ap = analyze_pitcher(away_pitcher)
    hb = analyze_bullpen(home_bullpen)
    ab = analyze_bullpen(away_bullpen)
    hl = analyze_lineup(home_stats, away_pitcher)
    al = analyze_lineup(away_stats, home_pitcher)
    hd = analyze_defense(home_stats)
    ad = analyze_defense(away_stats)
    park = analyze_park(game_info)
    weather = analyze_weather(game_info)
    hf = analyze_form(home_stats)
    af = analyze_form(away_stats)
    hs = analyze_schedule(game_info)

    # Away schedule (away team may be traveling)
    away_gi = copy(game_info)
    away_gi.is_travel_game = data["game_info"].get("is_travel_game", False)
    away_gi.consecutive_away_games = data["game_info"].get("consecutive_away_games", 0)
    as_ = analyze_schedule(away_gi)

    # ── Win Probability (pre-odds) ──
    wm = calculate_win_probability(
        {
            "pitcher_score": hp["score"],
            "bullpen_score": hb["score"],
            "lineup_score": hl["score"],
            "defense_score": hd["score"],
            "form_score": hf["form_score"],
            "fatigue_score": hs["fatigue_score"],
            "park_adjustment": park["run_adjustment"],
        },
        {
            "pitcher_score": ap["score"],
            "bullpen_score": ab["score"],
            "lineup_score": al["score"],
            "defense_score": ad["score"],
            "form_score": af["form_score"],
            "fatigue_score": as_["fatigue_score"],
            "park_adjustment": 1.0,
        },
    )

    # ── Odds Analysis ──
    open_line = odds_data.get("open_line", -1.5)
    current_line = odds_data.get("current_line", -1.5)
    open_total = odds_data.get("open_total", 7.5)
    current_total = odds_data.get("current_total", 7.5)
    home_ml = odds_data.get("home_ml", 1.90)
    away_ml = odds_data.get("away_ml", 1.90)

    od = analyze_odds(
        open_line=open_line,
        current_line=current_line,
        open_total=open_total,
        current_total=current_total,
        home_ml=home_ml,
        away_ml=away_ml,
        model_home_win_prob=wm["home_win_prob"],
    )

    # ── Totals Model ──
    tm = predict_total_runs(hl, al, hp, ap, park, weather)

    # ── Monte Carlo (10,000 simulations) ──
    mc = run_monte_carlo(wm["home_win_prob"], tm["predicted_total"], n_simulations=10000)

    # ── ELO Rating ──
    home_elo = elo_overrides.get("home_elo", NPB_ELO_DEFAULTS.get(game_info.home_team, 1500.0))
    away_elo = elo_overrides.get("away_elo", NPB_ELO_DEFAULTS.get(game_info.away_team, 1500.0))
    elo = calculate_elo_win_prob(home_elo=home_elo, away_elo=away_elo)

    # ── Kelly Criterion ──
    bankroll = betting_data.get("bankroll", 10000.0)
    your_odds_home = betting_data.get("your_odds", odds_data.get("your_odds_home", home_ml))
    your_odds_away = odds_data.get("your_odds_away", away_ml)

    hk = kelly_criterion(wm["home_win_prob"], your_odds_home, bankroll=bankroll)
    ak = kelly_criterion(wm["away_win_prob"], your_odds_away, bankroll=bankroll)

    # ── CLV ──
    open_odds_home = betting_data.get("open_odds", odds_data.get("home_ml", home_ml))
    close_odds_home = betting_data.get("close_odds", odds_data.get("close_ml_home", home_ml))
    hclv = calculate_clv(
        open_odds=open_odds_home,
        close_odds=close_odds_home,
        your_odds=your_odds_home,
    )

    open_odds_away = odds_data.get("away_ml", away_ml)
    close_odds_away = odds_data.get("close_ml_away", away_ml)
    aclv = calculate_clv(
        open_odds=open_odds_away,
        close_odds=close_odds_away,
        your_odds=your_odds_away,
    )

    # ── Composite Bet Score ──
    implied_home = 1.0 / max(home_ml, 1.01)
    edge = wm["home_win_prob"] - implied_home
    mc_confidence = max(0.0, min(1.0, 1.0 - mc["std_dev_result"] / 5.0))
    sharp_score = 1.0 if od.get("sharp_lean") == "home" else 0.5

    bs = calculate_bet_score({
        "win_prob_edge": edge,
        "kelly_pct": hk.get("kelly_pct", 0) / 100.0,
        "clv_value": hclv.get("clv_value", 0),
        "model_confidence": mc_confidence,
        "line_value": min(1.0, max(0.0, 0.5 + edge * 5)),
        "sharp_lean_score": sharp_score,
    })

    # ── Build Final Recommendation ──
    home_team = game_info.home_team
    away_team = game_info.away_team
    winner = home_team if wm["home_win_prob"] >= 0.5 else away_team

    ou_lean = tm["over_under_lean"]
    current_total_val = current_total
    if ou_lean == "over":
        total_rec = f"大分 (Over {current_total_val:.1f})"
    elif ou_lean == "under":
        total_rec = f"小分 (Under {current_total_val:.1f})"
    else:
        total_rec = f"中性 (Around {current_total_val:.1f})"

    spread_team = home_team if current_line <= 0 else away_team
    spread_val = abs(current_line)
    spread_rec = f"{spread_team} -{spread_val:.1f}"

    reasoning_parts = []
    if hp["score"] > ap["score"]:
        reasoning_parts.append(f"主隊先發({hp['score']:.0f}分)優於客隊({ap['score']:.0f}分)")
    else:
        reasoning_parts.append(f"客隊先發({ap['score']:.0f}分)優於主隊({hp['score']:.0f}分)")
    if hb["score"] > ab["score"]:
        reasoning_parts.append("主隊牛棚更強")
    if hf["form_score"] > af["form_score"]:
        reasoning_parts.append("主隊近期狀態更佳")
    reasoning_parts.append(f"模型勝率: 主隊{wm['home_win_prob']*100:.1f}% vs 客隊{wm['away_win_prob']*100:.1f}%")

    # ── Star Rating based on bet score ──
    bet_score_val = bs["bet_score"]
    if bet_score_val >= 80:
        star_rating = 5
    elif bet_score_val >= 70:
        star_rating = 4
    elif bet_score_val >= 60:
        star_rating = 3
    elif bet_score_val >= 50:
        star_rating = 2
    elif bet_score_val >= 35:
        star_rating = 1
    else:
        star_rating = 0

    # ── Structured JSON Response ──
    return {
        "game": {
            "home_team": home_team,
            "away_team": away_team,
            "stadium": game_info.stadium,
            "datetime": game_info.datetime,
            "is_day_game": game_info.is_day_game,
        },
        "pitcher": {
            "home_score": hp["score"],
            "away_score": ap["score"],
            "home_era": hp["era"],
            "away_era": ap["era"],
            "home_whip": hp["whip"],
            "away_whip": ap["whip"],
            "home_fip": hp["fip"],
            "away_fip": ap["fip"],
            "home_k9": hp["k9"],
            "away_k9": ap["k9"],
            "home_rest_days": hp["rest_days"],
            "away_rest_days": ap["rest_days"],
            "home_advantage": hp["advantage_text"],
            "away_advantage": ap["advantage_text"],
            "home_notes": hp["notes"],
            "away_notes": ap["notes"],
        },
        "bullpen": {
            "home_score": hb["score"],
            "away_score": ab["score"],
            "home_fatigue": hb["fatigue_level"],
            "away_fatigue": ab["fatigue_level"],
            "home_era": hb["era"],
            "away_era": ab["era"],
            "home_closer": hb["closer_available"],
            "away_closer": ab["closer_available"],
            "advantage": "home" if hb["score"] >= ab["score"] else "away",
            "home_notes": hb["notes"],
            "away_notes": ab["notes"],
        },
        "lineup": {
            "home_score": hl["score"],
            "away_score": al["score"],
            "home_run_expectancy": hl["run_expectancy"],
            "away_run_expectancy": al["run_expectancy"],
            "home_wrc_plus": hl["wrc_plus"],
            "away_wrc_plus": al["wrc_plus"],
            "home_ops": hl["ops"],
            "away_ops": al["ops"],
            "home_notes": hl["notes"],
            "away_notes": al["notes"],
        },
        "defense": {
            "home_score": hd["score"],
            "away_score": ad["score"],
            "home_fielding_pct": hd["fielding_pct"],
            "away_fielding_pct": ad["fielding_pct"],
            "home_drs": hd["drs"],
            "away_drs": ad["drs"],
            "advantage": "home" if hd["score"] >= ad["score"] else "away",
            "home_notes": hd["notes"],
            "away_notes": ad["notes"],
        },
        "park": {
            "park_type": park["park_type"],
            "park_factor": park["park_factor"],
            "hr_factor": park["hr_factor"],
            "run_adjustment": park["run_adjustment"],
            "stadium": park["stadium"],
            "notes": park["notes"],
        },
        "weather": {
            "hr_impact": weather["hr_impact"],
            "run_impact": weather["run_impact"],
            "pitcher_impact": weather["pitcher_impact"],
            "temperature": weather["temperature"],
            "humidity": weather["humidity"],
            "rain_pct": weather["rain_pct"],
            "wind_speed_kmh": weather["wind_speed_kmh"],
            "wind_direction": weather["wind_direction"],
            "weather_summary": weather["weather_summary"],
            "notes": weather["notes"],
        },
        "form": {
            "home_score": hf["form_score"],
            "home_trend": hf["trend"],
            "home_trend_text": hf["trend_text"],
            "home_last_5": hf["last_5_record"],
            "home_last_10": hf["last_10_record"],
            "away_score": af["form_score"],
            "away_trend": af["trend"],
            "away_trend_text": af["trend_text"],
            "away_last_5": af["last_5_record"],
            "away_last_10": af["last_10_record"],
            "home_notes": hf["notes"],
            "away_notes": af["notes"],
        },
        "schedule": {
            "home_fatigue": hs["fatigue_score"],
            "away_fatigue": as_["fatigue_score"],
            "home_fatigue_level": hs["fatigue_level"],
            "away_fatigue_level": as_["fatigue_level"],
            "home_notes": hs["notes"],
            "away_notes": as_["notes"],
        },
        "odds": {
            "value_bet_exists": od["value_bet_exists"],
            "sharp_lean": od["sharp_lean"],
            "steam_move": od["steam_move"],
            "home_ml": od["home_ml"],
            "away_ml": od["away_ml"],
            "home_implied_prob": od["home_implied_prob"],
            "away_implied_prob": od["away_implied_prob"],
            "current_line": od["current_line"],
            "current_total": od["current_total"],
            "vig": od["vig"],
            "notes": od["notes"],
        },
        "win_probability": {
            "home_win_prob": wm["home_win_prob"],
            "away_win_prob": wm["away_win_prob"],
            "home_composite_score": wm["home_composite_score"],
            "away_composite_score": wm["away_composite_score"],
            "notes": wm["notes"],
        },
        "totals": {
            "predicted_total": tm["predicted_total"],
            "predicted_home_runs": tm["predicted_home_runs"],
            "predicted_away_runs": tm["predicted_away_runs"],
            "over_under_lean": tm["over_under_lean"],
            "over_under_text": tm["over_under_text"],
            "top3_scores": tm["top3_scores"],
            "notes": tm["notes"],
        },
        "monte_carlo": {
            "home_win_pct": round(mc["home_win_pct"] * 100, 1),
            "away_win_pct": round(mc["away_win_pct"] * 100, 1),
            "tie_pct": round(mc["tie_pct"] * 100, 1),
            "over_pct": round(mc["over_pct"] * 100, 1),
            "under_pct": round(mc["under_pct"] * 100, 1),
            "mean_total": mc["mean_total"],
            "std_dev_result": mc["std_dev_result"],
            "confidence": mc["confidence"],
            "confidence_interval_95": mc["confidence_interval_95"],
            "score_distribution": mc["score_distribution"],
            "n_simulations": mc["n_simulations"],
            "notes": mc["notes"],
        },
        "elo": {
            "home_win_prob": elo["home_win_prob"],
            "away_win_prob": elo["away_win_prob"],
            "home_elo": elo["home_elo"],
            "away_elo": elo["away_elo"],
            "elo_diff": elo["elo_diff"],
            "notes": elo["notes"],
        },
        "kelly": {
            "home_kelly_pct": hk.get("kelly_pct", 0),
            "away_kelly_pct": ak.get("kelly_pct", 0),
            "home_fractional_kelly_pct": hk.get("fractional_kelly_pct", 0),
            "away_fractional_kelly_pct": ak.get("fractional_kelly_pct", 0),
            "home_bet_amount": hk.get("bet_amount", 0),
            "away_bet_amount": ak.get("bet_amount", 0),
            "home_edge": hk.get("edge", 0),
            "away_edge": ak.get("edge", 0),
            "recommendation": "bet home" if hk.get("kelly_pct", 0) > ak.get("kelly_pct", 0) and hk.get("kelly_pct", 0) > 0 else ("bet away" if ak.get("kelly_pct", 0) > 0 else "no bet"),
            "home_notes": hk.get("notes", []),
            "away_notes": ak.get("notes", []),
        },
        "clv": {
            "home_clv_value": hclv.get("clv_value", 0),
            "home_clv_pct": hclv.get("clv_pct", 0),
            "home_assessment": hclv.get("assessment", "break_even"),
            "away_clv_value": aclv.get("clv_value", 0),
            "away_clv_pct": aclv.get("clv_pct", 0),
            "away_assessment": aclv.get("assessment", "break_even"),
            "home_notes": hclv.get("notes", []),
            "away_notes": aclv.get("notes", []),
        },
        "bet_score": {
            "score": bs["bet_score"],
            "grade": bs["grade"],
            "recommendation": bs["recommendation"],
            "star_rating_text": bs["star_rating"],
            "component_scores": bs["component_scores"],
            "notes": bs["notes"],
        },
        "star_rating": star_rating,
        "final_recommendation": {
            "winner": winner,
            "spread": spread_rec,
            "total": total_rec,
            "reasoning": "；".join(reasoning_parts),
            "home_win_prob_pct": round(wm["home_win_prob"] * 100, 1),
            "away_win_prob_pct": round(wm["away_win_prob"] * 100, 1),
        },
    }
