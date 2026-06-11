"""
Lineup Analyzer - Batting/Lineup Analysis
打線分析模組
"""

from typing import Dict, Any, List, Optional
from npb_analyzer.models.game import TeamStats, PitcherStats
from npb_analyzer.models.player import Player, calculate_lineup_injury_impact


def analyze_lineup(
    stats: TeamStats,
    opposing_pitcher: PitcherStats,
    players: Optional[List[Player]] = None
) -> Dict[str, Any]:
    """
    分析打線整體攻擊力與預期得分
    Analyze lineup offensive capability and expected run production.

    Args:
        stats: TeamStats dataclass with team statistics
        opposing_pitcher: PitcherStats of the opposing pitcher
        players: Optional list of Player objects for injury assessment

    Returns:
        dict with:
            - score (0-100): 打線優勢分數
            - run_expectancy: 預期得分
            - notes: list of analysis notes
    """
    notes: List[str] = []
    score = 50.0  # Base score

    # --- wRC+ Scoring ---
    wrc = stats.wrc_plus
    if wrc > 110:
        score = 82.0
        notes.append(f"wRC+ {wrc:.0f} — 強力打線 (Strong Lineup, Elite Offense)")
    elif wrc >= 90:
        score = 65.0
        notes.append(f"wRC+ {wrc:.0f} — 普通打線 (Average Lineup)")
    else:
        score = 42.0
        notes.append(f"wRC+ {wrc:.0f} — 薄弱打線 (Weak Lineup)")

    # --- Handedness Matchup vs Opposing Pitcher ---
    pitcher_hand = opposing_pitcher.handedness
    if pitcher_hand == "L":
        # Batter faces left-handed pitcher → use vs_lhp_ops
        relevant_ops = stats.vs_lhp_ops
        matchup_label = "對左投OPS"
        pitcher_label = "左投 (LHP)"
    else:
        # Batter faces right-handed pitcher → use vs_rhp_ops
        relevant_ops = stats.vs_rhp_ops
        matchup_label = "對右投OPS"
        pitcher_label = "右投 (RHP)"

    if relevant_ops > 0.780:
        score += 10
        notes.append(f"{matchup_label} {relevant_ops:.3f} vs {pitcher_label} — 打線相性優勢 (+10)")
    elif relevant_ops > 0.700:
        notes.append(f"{matchup_label} {relevant_ops:.3f} vs {pitcher_label} — 打線相性一般 (±0)")
    else:
        score -= 8
        notes.append(f"{matchup_label} {relevant_ops:.3f} vs {pitcher_label} — 打線相性劣勢 (-8)")

    # --- Overall OPS Assessment ---
    if stats.ops > 0.800:
        score += 8
        notes.append(f"整體OPS {stats.ops:.3f} — 強攻擊力 (+8)")
    elif stats.ops > 0.720:
        notes.append(f"整體OPS {stats.ops:.3f} — 攻擊力普通 (±0)")
    else:
        score -= 5
        notes.append(f"整體OPS {stats.ops:.3f} — 攻擊力偏弱 (-5)")

    # --- Recent 10-Game Scoring Trend ---
    if stats.runs_scored_last_10 and len(stats.runs_scored_last_10) >= 5:
        avg_runs = sum(stats.runs_scored_last_10) / len(stats.runs_scored_last_10)

        # Check trend: compare first half vs second half
        half = len(stats.runs_scored_last_10) // 2
        early_avg = sum(stats.runs_scored_last_10[:half]) / half
        late_avg = sum(stats.runs_scored_last_10[half:]) / (len(stats.runs_scored_last_10) - half)

        if late_avg > early_avg + 0.5:
            score += 6
            notes.append(
                f"近10場得分趨勢上升: {early_avg:.1f} → {late_avg:.1f} 分/場 — 打線火熱 (+6)"
            )
        elif late_avg < early_avg - 0.5:
            score -= 4
            notes.append(
                f"近10場得分趨勢下滑: {early_avg:.1f} → {late_avg:.1f} 分/場 — 打線冷卻 (-4)"
            )
        else:
            notes.append(f"近10場平均得分: {avg_runs:.1f} 分/場 — 得分穩定")

        # Run production level
        if avg_runs >= 5.0:
            score += 5
            notes.append(f"近10場場均 {avg_runs:.1f} 分 — 高產打線 (+5)")
        elif avg_runs < 3.0:
            score -= 5
            notes.append(f"近10場場均 {avg_runs:.1f} 分 — 低迷得分能力 (-5)")
    else:
        avg_runs = 4.0  # Default NPB average

    # --- Opposing Pitcher Vulnerability ---
    opp_era = opposing_pitcher.era
    if opp_era > 5.0:
        score += 8
        notes.append(f"對方先發ERA {opp_era:.2f} — 可攻性高 (+8)")
    elif opp_era > 4.0:
        score += 4
        notes.append(f"對方先發ERA {opp_era:.2f} — 有攻擊機會 (+4)")
    elif opp_era < 2.50:
        score -= 8
        notes.append(f"對方先發ERA {opp_era:.2f} — 對方投手強力，得分困難 (-8)")
    elif opp_era < 3.50:
        score -= 4
        notes.append(f"對方先發ERA {opp_era:.2f} — 對方投手穩定，得分受限 (-4)")

    # --- Injury Impact ---
    injury_impact = 0.0
    if players:
        injury_impact = calculate_lineup_injury_impact(players)
        if injury_impact > 30:
            penalty = min(15, injury_impact * 0.3)
            score -= penalty
            notes.append(
                f"傷兵影響指數 {injury_impact:.0f} — 陣容受損嚴重 (-{penalty:.0f})"
            )
        elif injury_impact > 10:
            penalty = injury_impact * 0.2
            score -= penalty
            notes.append(
                f"傷兵影響指數 {injury_impact:.0f} — 陣容輕微受損 (-{penalty:.0f})"
            )
        else:
            notes.append(f"傷兵影響指數 {injury_impact:.0f} — 陣容健康")

    # --- OPS Trend ---
    if stats.team_ops_trend > 0.020:
        score += 4
        notes.append(f"OPS上升趨勢 +{stats.team_ops_trend:.3f} — 打線狀態改善中 (+4)")
    elif stats.team_ops_trend < -0.020:
        score -= 4
        notes.append(f"OPS下滑趨勢 {stats.team_ops_trend:.3f} — 打線狀態下滑 (-4)")

    # Cap score
    score = max(0.0, min(100.0, score))

    # --- Calculate Run Expectancy ---
    # Base NPB average: ~4.2 runs/game
    base_runs = 4.2
    wrc_factor = wrc / 100.0  # Normalize wRC+
    ops_factor = relevant_ops / 0.720  # Normalize vs pitcher hand
    era_factor = max(0.5, min(1.5, 4.5 / max(opp_era, 1.0)))  # Higher ERA = more runs

    run_expectancy = base_runs * wrc_factor * 0.5 + base_runs * ops_factor * 0.3 + base_runs * era_factor * 0.2
    run_expectancy = max(1.0, min(10.0, run_expectancy))

    return {
        "score": round(score, 1),
        "run_expectancy": round(run_expectancy, 2),
        "wrc_plus": wrc,
        "ops": stats.ops,
        "vs_pitcher_ops": relevant_ops,
        "pitcher_hand": pitcher_hand,
        "injury_impact": round(injury_impact, 1),
        "notes": notes,
    }
