#!/usr/bin/env python3
"""
Sample Game - 阪神 Tigers vs 巨人 Giants @ 甲子園
範例比賽：NPB分析框架完整示範
"""

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

# ─────────────────────────────────────────────
# 比賽資訊
# ─────────────────────────────────────────────
game_info = GameInfo(
    home_team="阪神",
    away_team="巨人",
    stadium="甲子園",
    datetime="2024-07-20 18:00",
    is_day_game=False,
    park_factor=0.95,
    hr_factor=0.85,
    scoring_factor=0.93,
    turf_type="natural",
    # Weather
    temperature=28.0,
    humidity=72.0,
    rain_pct=10.0,
    wind_direction="infield",
    wind_speed_kmh=12.0,
    # Schedule
    is_travel_game=False,
    consecutive_away_games=0,
    consecutive_games_played=6,
    days_since_last_game=1,
)

# ─────────────────────────────────────────────
# 先發投手
# ─────────────────────────────────────────────
home_pitcher = PitcherStats(
    era=2.45, whip=0.98, fip=2.80, xera=2.90,
    k9=9.8, bb9=2.1,
    recent_5_games=[1.8, 3.6, 2.0, 1.5, 2.7],
    home_era=2.10, away_era=2.85,
    day_era=2.80, night_era=2.20,
    vs_opponent_era=2.15, vs_opponent_games=8,
    vs_lhb_ops=0.640, vs_rhb_ops=0.680,
    pitch_count_limit=100,
    rest_days=6,
    handedness="R",
)

away_pitcher = PitcherStats(
    era=3.85, whip=1.22, fip=3.70, xera=3.95,
    k9=7.2, bb9=3.1,
    recent_5_games=[5.2, 3.1, 4.8, 3.6, 4.1],
    home_era=3.40, away_era=4.30,
    day_era=4.10, night_era=3.65,
    vs_opponent_era=4.20, vs_opponent_games=6,
    vs_lhb_ops=0.720, vs_rhb_ops=0.760,
    pitch_count_limit=100,
    rest_days=5,
    handedness="L",
)

# ─────────────────────────────────────────────
# 牛棚
# ─────────────────────────────────────────────
home_bullpen = BullpenStats(
    era=2.88,
    last_7_days_ip=8.2,
    last_3_days_ip=2.1,
    consecutive_days=1,
    closer_available=True,
    setup_fatigued=False,
    save_opportunities=18,
    blown_saves=2,
    holds=42,
)

away_bullpen = BullpenStats(
    era=4.15,
    last_7_days_ip=12.1,
    last_3_days_ip=5.2,
    consecutive_days=3,
    closer_available=False,
    setup_fatigued=True,
    save_opportunities=15,
    blown_saves=5,
    holds=28,
)

# ─────────────────────────────────────────────
# 球隊打擊/守備統計
# ─────────────────────────────────────────────
home_team_stats = TeamStats(
    ops=0.768, wrc_plus=112,
    runs_scored_last_10=[5, 3, 7, 4, 6, 5, 2, 8, 4, 6],
    slg=0.410, obp=0.348,
    vs_lhp_ops=0.720, vs_rhp_ops=0.780,
    fielding_pct=0.988, drs=12.0, uzr=8.5,
    catcher_cs_pct=0.38, error_rate=0.014,
    last_5_record="4-1", last_10_record="7-3", last_20_record="14-6",
    team_ops_trend=0.025, team_era_trend=-0.15,
)

away_team_stats = TeamStats(
    ops=0.735, wrc_plus=98,
    runs_scored_last_10=[3, 4, 5, 2, 6, 3, 4, 2, 5, 3],
    slg=0.385, obp=0.328,
    vs_lhp_ops=0.750, vs_rhp_ops=0.720,
    fielding_pct=0.981, drs=3.0, uzr=1.2,
    catcher_cs_pct=0.28, error_rate=0.022,
    last_5_record="2-3", last_10_record="4-6", last_20_record="9-11",
    team_ops_trend=-0.018, team_era_trend=0.22,
)

# ─────────────────────────────────────────────
# 執行所有分析
# ─────────────────────────────────────────────
print("正在執行 NPB 賽事分析...")
print("Running NPB game analysis...\n")

hp = analyze_pitcher(home_pitcher)
ap = analyze_pitcher(away_pitcher)
hb = analyze_bullpen(home_bullpen)
ab = analyze_bullpen(away_bullpen)
hl = analyze_lineup(home_team_stats, away_pitcher)
al = analyze_lineup(away_team_stats, home_pitcher)
hd = analyze_defense(home_team_stats)
ad = analyze_defense(away_team_stats)
park = analyze_park(game_info)
weather = analyze_weather(game_info)
hf = analyze_form(home_team_stats)
af = analyze_form(away_team_stats)
hs = analyze_schedule(game_info)

# Away schedule (away team traveling)
from copy import copy
away_gi = copy(game_info)
away_gi.is_travel_game = True
away_gi.consecutive_away_games = 4
as_ = analyze_schedule(away_gi)

# Odds
od = analyze_odds(
    open_line=-1.5, current_line=-1.8,
    open_total=7.5, current_total=7.0,
    home_ml=1.72, away_ml=2.15,
    model_home_win_prob=None,
)

# Win Model
home_scores = {
    "pitcher_score": hp["score"],
    "bullpen_score": hb["score"],
    "lineup_score": hl["score"],
    "defense_score": hd["score"],
    "form_score": hf["form_score"],
    "fatigue_score": hs["fatigue_score"],
    "park_adjustment": park["run_adjustment"],
}
away_scores = {
    "pitcher_score": ap["score"],
    "bullpen_score": ab["score"],
    "lineup_score": al["score"],
    "defense_score": ad["score"],
    "form_score": af["form_score"],
    "fatigue_score": as_["fatigue_score"],
    "park_adjustment": 1.0,
}
wm = calculate_win_probability(home_scores, away_scores)

# Re-run odds with model win prob
od = analyze_odds(
    open_line=-1.5, current_line=-1.8,
    open_total=7.5, current_total=7.0,
    home_ml=1.72, away_ml=2.15,
    model_home_win_prob=wm["home_win_prob"],
)

# Totals
tm = predict_total_runs(hl, al, hp, ap, park, weather)

# Monte Carlo (10,000 simulations)
mc = run_monte_carlo(wm["home_win_prob"], tm["predicted_total"], n_simulations=10000)

# ELO
elo = calculate_elo_win_prob(
    home_elo=NPB_ELO_DEFAULTS["阪神"],
    away_elo=NPB_ELO_DEFAULTS["巨人"],
)

# Kelly Criterion
hk = kelly_criterion(wm["home_win_prob"], 1.72, bankroll=10000)
ak = kelly_criterion(wm["away_win_prob"], 2.15, bankroll=10000)

# CLV (simulate having bet at open, close is current_ml)
hclv = calculate_clv(open_odds=1.78, close_odds=1.72, your_odds=1.76)
aclv = calculate_clv(open_odds=2.10, close_odds=2.15, your_odds=2.12)

# Bet Score
implied_home = 1.0 / 1.72
edge = wm["home_win_prob"] - implied_home
mc_confidence = max(0, 1.0 - mc["std_dev_result"] / 5.0)
sharp_score = 1.0 if od.get("sharp_lean") == "home" else 0.5

bs = calculate_bet_score({
    "win_prob_edge": edge,
    "kelly_pct": hk.get("kelly_pct", 0) / 100.0,
    "clv_value": hclv.get("clv_value", 0),
    "model_confidence": mc_confidence,
    "line_value": min(1.0, max(0.0, 0.5 + edge * 5)),
    "sharp_lean_score": sharp_score,
})

# ─────────────────────────────────────────────
# 生成完整報告
# ─────────────────────────────────────────────
all_analysis = {
    "home_pitcher": hp, "away_pitcher": ap,
    "home_bullpen": hb, "away_bullpen": ab,
    "home_lineup": hl, "away_lineup": al,
    "home_defense": hd, "away_defense": ad,
    "park": park, "weather": weather,
    "home_form": hf, "away_form": af,
    "home_schedule": hs, "away_schedule": as_,
    "odds": od, "win_probability": wm,
    "totals": tm, "monte_carlo": mc,
    "elo": elo, "kelly": hk, "clv": hclv,
    "home_kelly": hk, "away_kelly": ak,
    "home_clv": hclv, "away_clv": aclv, "bet_score": bs,
}

report = generate_report(game_info, all_analysis)
print(report)
