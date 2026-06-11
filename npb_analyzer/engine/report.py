"""
Report Generator - Full Analysis Report Output
完整分析報告生成器
"""

from typing import Dict, Any
from npb_analyzer.models.game import GameInfo


# Box-drawing character sets
BOX_DOUBLE_TOP = "╔" + "═" * 64 + "╗"
BOX_DOUBLE_MID = "╠" + "═" * 64 + "╣"
BOX_DOUBLE_BOT = "╚" + "═" * 64 + "╝"
BOX_SINGLE_MID = "╟" + "─" * 64 + "╢"

REPORT_WIDTH = 66
INNER_WIDTH = 62  # width inside box borders (REPORT_WIDTH - 4)


def _center(text: str, width: int = INNER_WIDTH) -> str:
    """Center text within width."""
    return text.center(width)


def _fmt_line(text: str) -> str:
    """Format a line within box borders."""
    # Truncate if too long to prevent box overflow
    if len(text) > INNER_WIDTH:
        text = text[:INNER_WIDTH - 1]
    return f"║ {text:<{INNER_WIDTH}} ║"


def _fmt_score_bar(score: float, width: int = 20) -> str:
    """Create a visual score bar."""
    score = max(0.0, min(100.0, score))
    filled = int((score / 100.0) * width)
    empty = width - filled
    bar = "█" * filled + "░" * empty
    return f"[{bar}] {score:.0f}/100"


def _score_to_stars(score: float) -> str:
    """Convert score to star rating."""
    if score >= 85:
        return "★★★★★"
    elif score >= 70:
        return "★★★★☆"
    elif score >= 55:
        return "★★★☆☆"
    elif score >= 40:
        return "★★☆☆☆"
    else:
        return "★☆☆☆☆"


def _win_prob_bar(home_prob: float, away_prob: float, width: int = 28) -> str:
    """Create a win probability split bar."""
    home_width = max(1, int(home_prob * width))
    away_width = max(1, width - home_width)
    home_bar = "H" * home_width
    away_bar = "A" * away_width
    return f"|{home_bar}|{away_bar}| {home_prob:.1%}:{away_prob:.1%}"


def generate_report(game_info: GameInfo, all_analysis: Dict[str, Any]) -> str:
    """
    生成完整格式化分析報告
    Generate a complete formatted analysis report.

    Args:
        game_info: GameInfo dataclass with game information
        all_analysis: dict containing all analysis results with keys:
            home_pitcher, away_pitcher, home_bullpen, away_bullpen,
            home_lineup, away_lineup, home_defense, away_defense,
            park, weather, home_form, away_form, home_schedule, away_schedule,
            odds, win_probability, totals, kelly, clv, monte_carlo, elo, bet_score

    Returns:
        str: Formatted report string for terminal output
    """
    lines = []

    def add(text: str = ""):
        lines.append(text)

    def box(text: str):
        lines.append(_fmt_line(text))

    # =========================================================
    # HEADER
    # =========================================================
    add(BOX_DOUBLE_TOP)
    box(_center("NPB 日本職棒 完整分析報告"))
    box(_center("NPB Professional Baseball Analysis Report"))
    add(BOX_SINGLE_MID)
    box(_center(f"比賽: {game_info.home_team} vs {game_info.away_team}"))
    box(_center(f"球場: {game_info.stadium}"))
    box(_center(f"時間: {game_info.datetime}"))
    day_night = "日場 (Day Game)" if game_info.is_day_game else "夜場 (Night Game)"
    box(_center(day_night))
    add(BOX_DOUBLE_MID)

    # =========================================================
    # WIN PROBABILITY MODEL
    # =========================================================
    win_prob = all_analysis.get("win_probability", {})
    home_wp = win_prob.get("home_win_prob", 0.5)
    away_wp = win_prob.get("away_win_prob", 0.5)
    home_cs = win_prob.get("home_composite_score", win_prob.get("composite_home_score", 50.0))
    away_cs = win_prob.get("away_composite_score", win_prob.get("composite_away_score", 50.0))

    box(_center("[ AI 勝率模型  Win Probability Model ]"))
    add(BOX_SINGLE_MID)
    box(f"  主隊 {game_info.home_team:<10} 勝率: {home_wp:.1%}  綜合分: {home_cs:.1f}")
    box(f"  客隊 {game_info.away_team:<10} 勝率: {away_wp:.1%}  綜合分: {away_cs:.1f}")
    box(f"  {_win_prob_bar(home_wp, away_wp)}")
    for note in win_prob.get("notes", []):
        box(f"  → {note}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 1: PITCHER ANALYSIS
    # =========================================================
    box(_center("[ 1. 先發投手分析  Starting Pitcher Analysis ]"))
    add(BOX_SINGLE_MID)

    home_p = all_analysis.get("home_pitcher", {})
    away_p = all_analysis.get("away_pitcher", {})

    box(f"  主隊先發 ({game_info.home_team}):")
    box(f"    {_fmt_score_bar(home_p.get('score', 50))}  {_score_to_stars(home_p.get('score', 50))}")
    box(f"    ERA: {home_p.get('era', 0):.2f}  WHIP: {home_p.get('whip', 0):.2f}  FIP: {home_p.get('fip', 0):.2f}")
    box(f"    K/9: {home_p.get('k9', 0):.1f}  BB/9: {home_p.get('bb9', 0):.1f}  休息: {home_p.get('rest_days', 5)}天")
    box(f"    評估: {home_p.get('advantage_text', 'N/A')}")
    for note in home_p.get("notes", [])[:4]:
        box(f"      · {note}")

    add(BOX_SINGLE_MID)
    box(f"  客隊先發 ({game_info.away_team}):")
    box(f"    {_fmt_score_bar(away_p.get('score', 50))}  {_score_to_stars(away_p.get('score', 50))}")
    box(f"    ERA: {away_p.get('era', 0):.2f}  WHIP: {away_p.get('whip', 0):.2f}  FIP: {away_p.get('fip', 0):.2f}")
    box(f"    K/9: {away_p.get('k9', 0):.1f}  BB/9: {away_p.get('bb9', 0):.1f}  休息: {away_p.get('rest_days', 5)}天")
    box(f"    評估: {away_p.get('advantage_text', 'N/A')}")
    for note in away_p.get("notes", [])[:4]:
        box(f"      · {note}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 2: BULLPEN ANALYSIS
    # =========================================================
    box(_center("[ 2. 牛棚分析  Bullpen Analysis ]"))
    add(BOX_SINGLE_MID)

    home_bp = all_analysis.get("home_bullpen", {})
    away_bp = all_analysis.get("away_bullpen", {})

    box(f"  主隊牛棚 ({game_info.home_team}):")
    box(f"    {_fmt_score_bar(home_bp.get('score', 50))}")
    box(f"    ERA: {home_bp.get('era', 0):.2f}  評級: {home_bp.get('era_rating', 'N/A')}")
    box(f"    疲勞指數: {home_bp.get('fatigue_level', 0):.0f}/100  近3日: {home_bp.get('last_3_days_ip', 0):.1f}局")
    closer_h = "可用 ✓" if home_bp.get("closer_available", True) else "不可用 ✗"
    setup_h = "疲勞 ✗" if home_bp.get("setup_fatigued", False) else "正常 ✓"
    box(f"    終結者: {closer_h}  中繼: {setup_h}")

    add(BOX_SINGLE_MID)
    box(f"  客隊牛棚 ({game_info.away_team}):")
    box(f"    {_fmt_score_bar(away_bp.get('score', 50))}")
    box(f"    ERA: {away_bp.get('era', 0):.2f}  評級: {away_bp.get('era_rating', 'N/A')}")
    box(f"    疲勞指數: {away_bp.get('fatigue_level', 0):.0f}/100  近3日: {away_bp.get('last_3_days_ip', 0):.1f}局")
    closer_a = "可用 ✓" if away_bp.get("closer_available", True) else "不可用 ✗"
    setup_a = "疲勞 ✗" if away_bp.get("setup_fatigued", False) else "正常 ✓"
    box(f"    終結者: {closer_a}  中繼: {setup_a}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 3: LINEUP ANALYSIS
    # =========================================================
    box(_center("[ 3. 打線分析  Lineup/Batting Analysis ]"))
    add(BOX_SINGLE_MID)

    home_lu = all_analysis.get("home_lineup", {})
    away_lu = all_analysis.get("away_lineup", {})

    box(f"  主隊打線 ({game_info.home_team}):")
    box(f"    {_fmt_score_bar(home_lu.get('score', 50))}  {_score_to_stars(home_lu.get('score', 50))}")
    box(f"    OPS: {home_lu.get('ops', 0):.3f}  wRC+: {home_lu.get('wrc_plus', 100):.0f}")
    box(f"    vs對方投手OPS: {home_lu.get('vs_pitcher_ops', 0):.3f}  預期得分: {home_lu.get('run_expectancy', 4):.2f}")
    for note in home_lu.get("notes", [])[:3]:
        box(f"      · {note}")

    add(BOX_SINGLE_MID)
    box(f"  客隊打線 ({game_info.away_team}):")
    box(f"    {_fmt_score_bar(away_lu.get('score', 50))}  {_score_to_stars(away_lu.get('score', 50))}")
    box(f"    OPS: {away_lu.get('ops', 0):.3f}  wRC+: {away_lu.get('wrc_plus', 100):.0f}")
    box(f"    vs對方投手OPS: {away_lu.get('vs_pitcher_ops', 0):.3f}  預期得分: {away_lu.get('run_expectancy', 4):.2f}")
    for note in away_lu.get("notes", [])[:3]:
        box(f"      · {note}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 4: DEFENSE ANALYSIS
    # =========================================================
    box(_center("[ 4. 守備分析  Defense Analysis ]"))
    add(BOX_SINGLE_MID)

    home_def = all_analysis.get("home_defense", {})
    away_def = all_analysis.get("away_defense", {})

    box(f"  主隊守備: {_fmt_score_bar(home_def.get('score', 50))}")
    box(f"    守備率: {home_def.get('fielding_pct', 0):.3f}  DRS: {home_def.get('drs', 0):+.0f}  UZR: {home_def.get('uzr', 0):+.1f}")
    box(f"  客隊守備: {_fmt_score_bar(away_def.get('score', 50))}")
    box(f"    守備率: {away_def.get('fielding_pct', 0):.3f}  DRS: {away_def.get('drs', 0):+.0f}  UZR: {away_def.get('uzr', 0):+.1f}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 5: PARK FACTOR
    # =========================================================
    park = all_analysis.get("park", {})
    box(_center("[ 5. 球場因子  Park Factor Analysis ]"))
    add(BOX_SINGLE_MID)
    box(f"  球場: {park.get('stadium', game_info.stadium)} ({park.get('stadium_en', '')})")
    park_type_labels = {
        "pitcher_friendly": "投手球場 (Pitcher-Friendly)",
        "hitter_friendly":  "打者球場 (Hitter-Friendly)",
        "neutral":          "中性球場 (Neutral Park)",
    }
    box(f"  類型: {park_type_labels.get(park.get('park_type', 'neutral'), 'N/A')}")
    box(f"  球場因子: {park.get('park_factor', 1.0):.3f}  全壘打因子: {park.get('hr_factor', 1.0):.3f}")
    box(f"  得分調整: {park.get('run_adjustment', 1.0):.3f}  草皮: {park.get('turf_type', 'natural')}")
    for note in park.get("notes", [])[:3]:
        box(f"  → {note}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 6: WEATHER ANALYSIS
    # =========================================================
    weather = all_analysis.get("weather", {})
    box(_center("[ 6. 天氣分析  Weather Analysis ]"))
    add(BOX_SINGLE_MID)
    box(f"  氣溫: {weather.get('temperature', 22):.0f}°C  濕度: {weather.get('humidity', 60):.0f}%  降雨: {weather.get('rain_pct', 0):.0f}%")
    box(f"  風向: {weather.get('wind_direction', 'none')}  風速: {weather.get('wind_speed_kmh', 0):.0f} km/h")
    box(f"  全壘打影響: {weather.get('hr_impact', 1.0):.3f}  得分影響: {weather.get('run_impact', 1.0):.3f}")
    pitcher_impact_map = {
        "favorable":   "對投手有利 (Favorable)",
        "unfavorable": "對投手不利 (Unfavorable)",
        "neutral":     "天氣中性 (Neutral)",
    }
    box(f"  投手影響: {pitcher_impact_map.get(weather.get('pitcher_impact', 'neutral'), 'N/A')}")
    for note in weather.get("notes", [])[:3]:
        box(f"  → {note}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 7: RECENT FORM
    # =========================================================
    home_form = all_analysis.get("home_form", {})
    away_form = all_analysis.get("away_form", {})
    box(_center("[ 7. 近期狀態  Recent Form Analysis ]"))
    add(BOX_SINGLE_MID)

    box(f"  主隊 ({game_info.home_team}): 狀態分 {home_form.get('form_score', 50):.0f}/100  {home_form.get('trend_text', 'N/A')}")
    box(f"    近5場: {home_form.get('last_5_record','N/A')} ({home_form.get('pct5',0):.1%})  近10場: {home_form.get('last_10_record','N/A')} ({home_form.get('pct10',0):.1%})")
    box(f"    近20場: {home_form.get('last_20_record','N/A')} ({home_form.get('pct20',0):.1%})  動能: {home_form.get('momentum',0):+.1%}")
    add(BOX_SINGLE_MID)
    box(f"  客隊 ({game_info.away_team}): 狀態分 {away_form.get('form_score', 50):.0f}/100  {away_form.get('trend_text', 'N/A')}")
    box(f"    近5場: {away_form.get('last_5_record','N/A')} ({away_form.get('pct5',0):.1%})  近10場: {away_form.get('last_10_record','N/A')} ({away_form.get('pct10',0):.1%})")
    box(f"    近20場: {away_form.get('last_20_record','N/A')} ({away_form.get('pct20',0):.1%})  動能: {away_form.get('momentum',0):+.1%}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 8: SCHEDULE / FATIGUE
    # =========================================================
    home_sched = all_analysis.get("home_schedule", {})
    away_sched = all_analysis.get("away_schedule", {})
    box(_center("[ 8. 賽程疲勞  Schedule & Fatigue Analysis ]"))
    add(BOX_SINGLE_MID)

    box(f"  主隊 ({game_info.home_team}): 疲勞指數 {home_sched.get('fatigue_score',0):.0f}/100  {home_sched.get('fatigue_text','N/A')}")
    box(f"    連續出賽: {home_sched.get('consecutive_games',0)} 場  連續客場: {home_sched.get('consecutive_away_games',0)} 場")
    box(f"  客隊 ({game_info.away_team}): 疲勞指數 {away_sched.get('fatigue_score',0):.0f}/100  {away_sched.get('fatigue_text','N/A')}")
    box(f"    連續出賽: {away_sched.get('consecutive_games',0)} 場  連續客場: {away_sched.get('consecutive_away_games',0)} 場")
    box(f"  距上場: {game_info.days_since_last_game} 天  長途客場: {'是' if game_info.is_travel_game else '否'}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 9: ODDS ANALYSIS
    # =========================================================
    odds = all_analysis.get("odds", {})
    box(_center("[ 9. 賠率線分析  Odds/Line Analysis ]"))
    add(BOX_SINGLE_MID)

    box(f"  讓分: 開盤 {odds.get('open_line',0):+.1f} -> 目前 {odds.get('current_line',0):+.1f} (移動 {odds.get('line_movement',0):+.2f})")
    box(f"  總分: 開盤 {odds.get('open_total',0):.1f} -> 目前 {odds.get('current_total',0):.1f} (移動 {odds.get('total_movement',0):+.1f})")
    box(f"  主隊賠率: {odds.get('home_ml',0):.2f} (隱含 {odds.get('home_implied_prob',0):.1%})")
    box(f"  客隊賠率: {odds.get('away_ml',0):.2f} (隱含 {odds.get('away_implied_prob',0):.1%})")
    box(f"  博彩抽水: {odds.get('vig',0):.1%}  Vegas偏向: {odds.get('vegas_bias','N/A')}")

    steam_indicator = ">> 蒸汽移動偵測!" if odds.get("steam_move") else "   無明顯蒸汽移動"
    box(f"  {steam_indicator}")

    sharp_lean = odds.get("sharp_lean", "none")
    sharp_labels = {"home": "精明資金 -> 主隊", "away": "精明資金 -> 客隊", "none": "精明資金方向不明"}
    box(f"  {sharp_labels.get(sharp_lean, 'N/A')}")

    if odds.get("value_bet_exists", False):
        box(f"  ★ 價值投注機會: {odds.get('value_details', 'N/A')}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 10: TOTALS MODEL
    # =========================================================
    totals = all_analysis.get("totals", {})
    box(_center("[ 10. 總得分預測  Totals Model ]"))
    add(BOX_SINGLE_MID)

    box(f"  預測主隊得分: {totals.get('predicted_home_runs', 0):.2f}")
    box(f"  預測客隊得分: {totals.get('predicted_away_runs', 0):.2f}")
    box(f"  預測總得分:   {totals.get('predicted_total', 0):.2f}")
    lean_text = totals.get("over_under_text", totals.get("lean_text", "N/A"))
    box(f"  大小分傾向:   {lean_text}")

    top3 = totals.get("top3_scores", [])
    if top3:
        add(BOX_SINGLE_MID)
        box("  最可能比分 (Poisson Distribution):")
        for i, score_item in enumerate(top3[:3], 1):
            box(
                f"  {i}. {game_info.home_team} {score_item.get('home_score',0)} - "
                f"{score_item.get('away_score',0)} {game_info.away_team} "
                f"(機率 {score_item.get('probability_pct',0):.1f}%)"
            )
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 11: MONTE CARLO SIMULATION
    # =========================================================
    mc = all_analysis.get("monte_carlo", {})
    box(_center("[ 11. 蒙地卡羅模擬  Monte Carlo (10,000 runs) ]"))
    add(BOX_SINGLE_MID)

    n_sims = mc.get("n_simulations", 10000)
    box(f"  模擬次數: {n_sims:,} 次")
    box(f"  主隊勝率: {mc.get('home_win_pct',0):.1%}  客隊: {mc.get('away_win_pct',0):.1%}  平局: {mc.get('tie_pct',0):.1%}")
    box(f"  大分: {mc.get('over_pct',0):.1%}  小分: {mc.get('under_pct',0):.1%}")
    ci = mc.get("confidence_interval_95", (0, 0))
    box(f"  總分95%CI: {ci[0]:.0f} - {ci[1]:.0f} 分  (平均 {mc.get('mean_total',0):.2f})")
    box(f"  標準差: {mc.get('std_dev_result',0):.2f}  信心度: {mc.get('confidence','N/A')}")

    mc_top = mc.get("score_distribution", [])
    if mc_top:
        box(f"  最常見比分: {mc_top[0].get('home_score',0)}-{mc_top[0].get('away_score',0)} ({mc_top[0].get('probability_pct',0):.1f}%)")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # SECTION 12: ELO RATING
    # =========================================================
    elo = all_analysis.get("elo", {})
    box(_center("[ 12. ELO評分系統  ELO Rating System ]"))
    add(BOX_SINGLE_MID)

    box(f"  主隊ELO: {elo.get('home_elo',1500):.0f} (+{elo.get('home_advantage',35):.0f}主場) = {elo.get('effective_home_elo',1535):.0f}")
    box(f"  客隊ELO: {elo.get('away_elo',1500):.0f}")
    box(f"  ELO差距: {elo.get('elo_diff',0):+.0f} 分")
    box(f"  ELO勝率 -> 主隊: {elo.get('home_win_prob',0.5):.1%}  客隊: {elo.get('away_win_prob',0.5):.1%}")
    for note in elo.get("notes", [])[-2:]:
        box(f"  → {note}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # BETTING SECTION
    # =========================================================
    box(_center("[ 投注建議  Betting Recommendations ]"))
    add(BOX_SINGLE_MID)

    kelly = all_analysis.get("kelly", {})
    box("  凱利公式 (Kelly Criterion):")
    box(f"    全凱利: {kelly.get('kelly_pct',0):.2f}%  1/4凱利: {kelly.get('fractional_kelly_pct',0):.2f}%")
    box(f"    期望值 (EV): {kelly.get('edge',0):+.2f}%")
    if kelly.get("bet_amount", 0) > 0:
        box(f"    建議投注金額: {kelly.get('bet_amount',0):.2f}")

    add(BOX_SINGLE_MID)
    clv = all_analysis.get("clv", {})
    box("  收盤線價值 (CLV):")
    box(f"    CLV: {clv.get('clv_pct',0):+.2f}%  評估: {clv.get('assessment','N/A')}")
    box(f"    開盤:{clv.get('open_odds',0):.2f} -> 收盤:{clv.get('close_odds',0):.2f} -> 您的:{clv.get('your_odds',0):.2f}")

    add(BOX_SINGLE_MID)
    box("  精明資金 (Sharp Money Tracking):")
    box(f"    方向: {sharp_labels.get(sharp_lean,'N/A')}  蒸汽移動: {'是' if odds.get('steam_move') else '否'}")
    box(f"    盤口移動幅度: {odds.get('line_movement_pct',0):.1%}")

    add(BOX_SINGLE_MID)
    vegas_bias_labels = {
        "home_favorite": f"市場偏向主隊 {game_info.home_team} (Home Favorite)",
        "away_favorite": f"市場偏向客隊 {game_info.away_team} (Away Favorite)",
        "even":          "市場勢均力敵 (Even Market)",
    }
    box(f"  Vegas偏向: {vegas_bias_labels.get(odds.get('vegas_bias','even'),'N/A')}")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # COMPOSITE BET SCORE
    # =========================================================
    bet_score_data = all_analysis.get("bet_score", {})
    bet_score_val = bet_score_data.get("bet_score", 0)
    grade = bet_score_data.get("grade", "C")
    stars = bet_score_data.get("star_rating", bet_score_data.get("stars", "★★★"))
    recommendation = bet_score_data.get("recommendation", "N/A")

    box(_center("[ 綜合投注評分  Composite Bet Score ]"))
    add(BOX_SINGLE_MID)
    box(_center(f"投注評分: {bet_score_val:.1f} / 100"))
    box(_center(_fmt_score_bar(bet_score_val, 30)))
    box(_center(f"等級: {grade}   {stars}"))
    add(BOX_SINGLE_MID)
    box(_center(f"最終建議: {recommendation}"))
    add(BOX_SINGLE_MID)

    comps = bet_score_data.get("component_scores", {})
    if comps:
        box("  分項分數:")
        box(f"    勝率邊際 (30%): {comps.get('edge_score',0):.0f}/100")
        box(f"    凱利指標 (20%): {comps.get('kelly_score',0):.0f}/100")
        box(f"    CLV價值  (20%): {comps.get('clv_score',0):.0f}/100")
        box(f"    模型信心 (15%): {comps.get('confidence_score',0):.0f}/100")
        box(f"    線值/精明(15%): {comps.get('line_score', comps.get('sharp_score', 0)):.0f}/100")
    add(BOX_DOUBLE_MID)

    # =========================================================
    # FINAL SUMMARY
    # =========================================================
    box(_center("[ 總結建議  Final Summary ]"))
    add(BOX_SINGLE_MID)

    if home_wp > 0.58:
        win_rec = f"勝負: 主隊 {game_info.home_team} 勝 (勝率 {home_wp:.1%})"
    elif away_wp > 0.58:
        win_rec = f"勝負: 客隊 {game_info.away_team} 勝 (勝率 {away_wp:.1%})"
    else:
        win_rec = f"勝負: 勢均力敵，主隊微優 ({home_wp:.1%})"
    box(f"  {win_rec}")

    ou_lean = totals.get("over_under_lean", "push")
    ou_line_val = totals.get("predicted_total", 7.5)
    ou_text_map = {
        "over":  f"大小分: 傾向大分 OVER {ou_line_val:.1f}",
        "under": f"大小分: 傾向小分 UNDER {ou_line_val:.1f}",
        "push":  f"大小分: 接近均等，中性 ({ou_line_val:.1f})",
    }
    box(f"  {ou_text_map.get(ou_lean, 'N/A')}")

    elo_home = elo.get("home_win_prob", 0.5)
    if abs(elo_home - home_wp) < 0.08:
        box(f"  ELO確認: 模型與ELO方向一致 (差距 {abs(elo_home - home_wp):.1%})")
    else:
        box(f"  ELO分歧: 模型({home_wp:.1%}) vs ELO({elo_home:.1%}) 差距 {abs(elo_home-home_wp):.1%}")

    add(BOX_SINGLE_MID)
    box(_center(f"[ 投注決策 ]  {stars}  等級 {grade}"))
    box(_center(recommendation))
    add(BOX_DOUBLE_BOT)
    add(f"  報告生成: {game_info.datetime}  | NPB Analyzer v1.0.0")
    add(f"  ※ 本報告僅供參考，不構成投資建議。請謹慎評估風險。")
    add("")

    return "\n".join(lines)
