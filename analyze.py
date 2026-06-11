#!/usr/bin/env python3
"""
NPB Game Analyzer - Main CLI Entry Point
NPB賽事分析系統 主程式
"""

import argparse
import json
import sys
from npb_analyzer.models.game import GameInfo, PitcherStats, BullpenStats, TeamStats
from npb_analyzer.models.player import Player
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
from npb_analyzer.betting.elo import get_team_elo
from npb_analyzer.engine import calculate_win_probability, predict_total_runs, generate_report


def load_game_from_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_game_info(data: dict) -> GameInfo:
    gi = data.get("game_info", {})
    return GameInfo(
        home_team=gi.get("home_team", "主隊"),
        away_team=gi.get("away_team", "客隊"),
        stadium=gi.get("stadium", "未知球場"),
        datetime=gi.get("datetime", "2024-01-01 18:00"),
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


def build_pitcher(data: dict) -> PitcherStats:
    return PitcherStats(
        era=data.get("era", 4.00),
        whip=data.get("whip", 1.30),
        fip=data.get("fip", 4.00),
        xera=data.get("xera", 4.00),
        k9=data.get("k9", 7.0),
        bb9=data.get("bb9", 3.0),
        recent_5_games=data.get("recent_5_games", []),
        home_era=data.get("home_era", 0.0),
        away_era=data.get("away_era", 0.0),
        day_era=data.get("day_era", 0.0),
        night_era=data.get("night_era", 0.0),
        vs_opponent_era=data.get("vs_opponent_era", 0.0),
        vs_opponent_games=data.get("vs_opponent_games", 0),
        vs_lhb_ops=data.get("vs_lhb_ops", 0.700),
        vs_rhb_ops=data.get("vs_rhb_ops", 0.700),
        pitch_count_limit=data.get("pitch_count_limit", 100),
        rest_days=data.get("rest_days", 5),
        handedness=data.get("handedness", "R"),
    )


def build_bullpen(data: dict) -> BullpenStats:
    return BullpenStats(
        era=data.get("era", 3.50),
        last_7_days_ip=data.get("last_7_days_ip", 6.0),
        last_3_days_ip=data.get("last_3_days_ip", 2.0),
        consecutive_days=data.get("consecutive_days", 1),
        closer_available=data.get("closer_available", True),
        setup_fatigued=data.get("setup_fatigued", False),
        save_opportunities=data.get("save_opportunities", 0),
        blown_saves=data.get("blown_saves", 0),
        holds=data.get("holds", 0),
    )


def build_team_stats(data: dict) -> TeamStats:
    return TeamStats(
        ops=data.get("ops", 0.720),
        wrc_plus=data.get("wrc_plus", 100.0),
        runs_scored_last_10=data.get("runs_scored_last_10", [4, 3, 5, 2, 6, 4, 3, 5, 4, 3]),
        slg=data.get("slg", 0.380),
        obp=data.get("obp", 0.330),
        vs_lhp_ops=data.get("vs_lhp_ops", 0.700),
        vs_rhp_ops=data.get("vs_rhp_ops", 0.720),
        fielding_pct=data.get("fielding_pct", 0.982),
        drs=data.get("drs", 0.0),
        uzr=data.get("uzr", 0.0),
        catcher_cs_pct=data.get("catcher_cs_pct", 0.30),
        error_rate=data.get("error_rate", 0.020),
        last_5_record=data.get("last_5_record", "3-2"),
        last_10_record=data.get("last_10_record", "5-5"),
        last_20_record=data.get("last_20_record", "10-10"),
        team_ops_trend=data.get("team_ops_trend", 0.0),
        team_era_trend=data.get("team_era_trend", 0.0),
    )


def run_analysis(data: dict, bankroll: float = 1000.0, home_elo_override: float = None,
                 away_elo_override: float = None) -> tuple:
    game_info = build_game_info(data)

    home_p = build_pitcher(data.get("home_pitcher", {}))
    away_p = build_pitcher(data.get("away_pitcher", {}))
    home_b = build_bullpen(data.get("home_bullpen", {}))
    away_b = build_bullpen(data.get("away_bullpen", {}))
    home_ts = build_team_stats(data.get("home_team_stats", {}))
    away_ts = build_team_stats(data.get("away_team_stats", {}))

    # Run all analyzers
    hp_result = analyze_pitcher(home_p)
    ap_result = analyze_pitcher(away_p)
    hb_result = analyze_bullpen(home_b)
    ab_result = analyze_bullpen(away_b)
    hl_result = analyze_lineup(home_ts, away_p)
    al_result = analyze_lineup(away_ts, home_p)
    hd_result = analyze_defense(home_ts)
    ad_result = analyze_defense(away_ts)
    park_result = analyze_park(game_info)
    weather_result = analyze_weather(game_info)
    hf_result = analyze_form(home_ts)
    af_result = analyze_form(away_ts)
    hs_result = analyze_schedule(game_info)

    # Away schedule (modify for away team)
    from copy import copy
    away_game_info = copy(game_info)
    away_game_info.is_travel_game = True
    away_game_info.consecutive_away_games = game_info.consecutive_away_games
    as_result = analyze_schedule(away_game_info)

    # Odds analysis
    odds_data = data.get("odds", {})
    if odds_data:
        od_result = analyze_odds(
            open_line=odds_data.get("open_line", 0.0),
            current_line=odds_data.get("current_line", 0.0),
            open_total=odds_data.get("open_total", 7.5),
            current_total=odds_data.get("current_total", 7.5),
            home_ml=odds_data.get("home_ml", 1.90),
            away_ml=odds_data.get("away_ml", 1.90),
            model_home_win_prob=None,  # Will update after win model
        )
    else:
        od_result = {}

    # Win Model
    home_scores = {
        "pitcher_score": hp_result["score"],
        "bullpen_score": hb_result["score"],
        "lineup_score": hl_result["score"],
        "defense_score": hd_result["score"],
        "form_score": hf_result["form_score"],
        "fatigue_score": hs_result["fatigue_score"],
        "park_adjustment": park_result["run_adjustment"],
    }
    away_scores = {
        "pitcher_score": ap_result["score"],
        "bullpen_score": ab_result["score"],
        "lineup_score": al_result["score"],
        "defense_score": ad_result["score"],
        "form_score": af_result["form_score"],
        "fatigue_score": as_result["fatigue_score"],
        "park_adjustment": 1.0,
    }
    wm_result = calculate_win_probability(home_scores, away_scores)

    # Update odds with model prob
    if odds_data:
        od_result = analyze_odds(
            open_line=odds_data.get("open_line", 0.0),
            current_line=odds_data.get("current_line", 0.0),
            open_total=odds_data.get("open_total", 7.5),
            current_total=odds_data.get("current_total", 7.5),
            home_ml=odds_data.get("home_ml", 1.90),
            away_ml=odds_data.get("away_ml", 1.90),
            model_home_win_prob=wm_result["home_win_prob"],
        )

    # Totals Model
    tm_result = predict_total_runs(hl_result, al_result, hp_result, ap_result,
                                    park_result, weather_result)

    # Monte Carlo
    mc_result = run_monte_carlo(
        home_win_prob=wm_result["home_win_prob"],
        expected_total=tm_result["predicted_total"],
        n_simulations=10000,
    )

    # ELO
    home_elo = home_elo_override or get_team_elo(game_info.home_team)
    away_elo = away_elo_override or get_team_elo(game_info.away_team)
    elo_result = calculate_elo_win_prob(home_elo, away_elo)

    # Kelly
    home_wp = wm_result["home_win_prob"]
    away_wp = wm_result["away_win_prob"]
    home_ml = odds_data.get("home_ml", 1.90) if odds_data else 1.90
    away_ml = odds_data.get("away_ml", 1.90) if odds_data else 1.90
    hk_result = kelly_criterion(home_wp, home_ml, bankroll=bankroll)
    ak_result = kelly_criterion(away_wp, away_ml, bankroll=bankroll)

    # CLV - calculate using open/current line as proxy if close_ml not available
    home_ml_open = odds_data.get("home_ml", 1.90) if odds_data else 1.90
    home_ml_close = odds_data.get("close_ml_home", home_ml_open) if odds_data else home_ml_open
    your_odds_home = odds_data.get("your_odds_home", home_ml_open) if odds_data else home_ml_open
    hclv_result = calculate_clv(
        open_odds=home_ml_open,
        close_odds=home_ml_close,
        your_odds=your_odds_home,
    )

    away_ml_open = odds_data.get("away_ml", 1.90) if odds_data else 1.90
    away_ml_close = odds_data.get("close_ml_away", away_ml_open) if odds_data else away_ml_open
    your_odds_away = odds_data.get("your_odds_away", away_ml_open) if odds_data else away_ml_open
    aclv_result = calculate_clv(
        open_odds=away_ml_open,
        close_odds=away_ml_close,
        your_odds=your_odds_away,
    )

    # Bet Score
    implied_home = 1.0 / home_ml if home_ml > 1 else 0.5
    edge = home_wp - implied_home
    mc_confidence = max(0, 1.0 - mc_result.get("std_dev_result", 2.0) / 5.0)
    sharp_score = 1.0 if od_result.get("sharp_lean") == "home" else \
                  0.0 if od_result.get("sharp_lean") == "away" else 0.5

    bs_result = calculate_bet_score({
        "win_prob_edge": edge,
        "kelly_pct": hk_result.get("kelly_pct", 0) / 100.0,
        "clv_value": hclv_result.get("clv_value", 0.0),
        "model_confidence": mc_confidence,
        "line_value": 0.5 + edge,
        "sharp_lean_score": sharp_score,
    })

    all_analysis = {
        "home_pitcher": hp_result,
        "away_pitcher": ap_result,
        "home_bullpen": hb_result,
        "away_bullpen": ab_result,
        "home_lineup": hl_result,
        "away_lineup": al_result,
        "home_defense": hd_result,
        "away_defense": ad_result,
        "park": park_result,
        "weather": weather_result,
        "home_form": hf_result,
        "away_form": af_result,
        "home_schedule": hs_result,
        "away_schedule": as_result,
        "odds": od_result,
        # Keys expected by report.py
        "win_probability": wm_result,
        "totals": tm_result,
        "monte_carlo": mc_result,
        "elo": elo_result,
        "kelly": hk_result,          # Primary Kelly (home team bet)
        "clv": hclv_result,          # Primary CLV (home team bet)
        "bet_score": bs_result,
        # Additional keys for extended use
        "win_model": wm_result,
        "totals_model": tm_result,
        "home_kelly": hk_result,
        "away_kelly": ak_result,
        "home_clv": hclv_result,
        "away_clv": aclv_result,
    }

    return game_info, all_analysis


def main():
    parser = argparse.ArgumentParser(
        description="NPB賽事分析系統 — Nippon Professional Baseball Analyzer"
    )
    parser.add_argument("--game", type=str, help="比賽資料 JSON 檔路徑")
    parser.add_argument("--home-elo", type=float, default=None, help="主隊ELO評分覆蓋")
    parser.add_argument("--away-elo", type=float, default=None, help="客隊ELO評分覆蓋")
    parser.add_argument("--bankroll", type=float, default=1000.0, help="投注本金")
    parser.add_argument("--output", type=str, default=None, help="輸出檔案路徑（預設: stdout）")
    args = parser.parse_args()

    if args.game:
        data = load_game_from_json(args.game)
    else:
        print("提示: 未指定 --game 參數，使用內建範例資料 (阪神 Tigers vs 巨人 Giants @ 甲子園)", file=sys.stderr)
        from sample_game import SAMPLE_DATA
        data = SAMPLE_DATA

    game_info, all_analysis = run_analysis(
        data,
        bankroll=args.bankroll,
        home_elo_override=args.home_elo,
        away_elo_override=args.away_elo,
    )

    report = generate_report(game_info, all_analysis)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"報告已輸出至: {args.output}")
    else:
        print(report)


if __name__ == "__main__":
    main()
