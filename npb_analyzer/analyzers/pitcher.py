"""
Pitcher Analyzer - Starting Pitcher Analysis
先發投手分析模組
"""

from typing import Dict, List, Any
from npb_analyzer.models.game import PitcherStats


def analyze_pitcher(stats: PitcherStats) -> Dict[str, Any]:
    """
    分析先發投手表現並計算優勢分數
    Analyze starting pitcher and calculate advantage score.

    Args:
        stats: PitcherStats dataclass with pitcher statistics

    Returns:
        dict with:
            - score (0-100): 投手優勢分數
            - advantage_text: 優勢描述文字
            - notes: list of analysis notes
    """
    notes: List[str] = []
    score = 50.0  # Base score

    # --- ERA Scoring (base score) ---
    era = stats.era
    if era < 2.50:
        score = 92.0
        notes.append(f"ERA {era:.2f} — 頂級先發 (Elite Starter)")
    elif era < 3.50:
        score = 82.0
        notes.append(f"ERA {era:.2f} — 優秀先發 (Above Average)")
    elif era < 4.50:
        score = 65.0
        notes.append(f"ERA {era:.2f} — 中等先發 (Average Starter)")
    elif era < 5.50:
        score = 45.0
        notes.append(f"ERA {era:.2f} — 偏弱先發 (Below Average)")
    else:
        score = 28.0
        notes.append(f"ERA {era:.2f} — 高危先發 (High Risk Starter)")

    # --- WHIP Adjustment ---
    whip = stats.whip
    if whip < 1.00:
        score += 10
        notes.append(f"WHIP {whip:.2f} — 極低上壘率，優異控制 (+10)")
    elif whip < 1.20:
        score += 5
        notes.append(f"WHIP {whip:.2f} — 良好控制 (+5)")
    elif whip < 1.40:
        notes.append(f"WHIP {whip:.2f} — 控制普通 (±0)")
    else:
        score -= 5
        notes.append(f"WHIP {whip:.2f} — 控制偏差 (-5)")

    # --- FIP vs ERA Spread ---
    fip = stats.fip
    era_fip_diff = fip - era
    if era_fip_diff < -0.50:
        # FIP significantly higher than ERA → pitcher benefiting from luck/defense
        score -= 5
        notes.append(
            f"FIP {fip:.2f} 遠高於 ERA {era:.2f} (差距 {abs(era_fip_diff):.2f}) — "
            f"投手可能受益於運氣/守備，存在回歸風險 (-5)"
        )
    elif era_fip_diff > 0.50:
        # ERA higher than FIP → pitcher has been unlucky
        score += 3
        notes.append(
            f"ERA {era:.2f} 高於 FIP {fip:.2f} (差距 {era_fip_diff:.2f}) — "
            f"投手受運氣不佳影響，實際表現較佳 (+3)"
        )
    else:
        notes.append(f"FIP {fip:.2f} 與 ERA 接近 — 表現穩定")

    # --- Recent 5 Games Trend ---
    if stats.recent_5_games and len(stats.recent_5_games) >= 3:
        recent_avg = sum(stats.recent_5_games) / len(stats.recent_5_games)
        # Check trend: compare first half vs second half
        half = len(stats.recent_5_games) // 2
        if half > 0:
            early_avg = sum(stats.recent_5_games[:half]) / half
            late_avg = sum(stats.recent_5_games[half:]) / (len(stats.recent_5_games) - half)
            if late_avg < early_avg - 0.50:
                score += 5
                notes.append(
                    f"近期ERA趨勢改善: {early_avg:.2f} → {late_avg:.2f} — 狀態上升中 (+5)"
                )
            elif late_avg > early_avg + 0.50:
                score -= 3
                notes.append(
                    f"近期ERA趨勢惡化: {early_avg:.2f} → {late_avg:.2f} — 狀態下滑中 (-3)"
                )
            else:
                notes.append(f"近5場平均ERA: {recent_avg:.2f} — 狀態穩定")

    # --- Rest Days Adjustment ---
    rest = stats.rest_days
    if rest <= 4:
        score -= 5
        notes.append(f"休息{rest}天 (中{rest-1}日) — 短休息，可能體力下降 (-5)")
    elif rest == 5:
        notes.append(f"休息{rest}天 (中{rest-1}日) — 標準輪換，狀態正常 (±0)")
    else:
        score += 5
        notes.append(f"休息{rest}天 (中{rest-1}日) — 充分休息，狀態佳 (+5)")

    # --- vs Opponent ERA ---
    if stats.vs_opponent_games >= 3 and stats.vs_opponent_era > 0:
        if stats.vs_opponent_era < stats.era - 0.30:
            score += 5
            notes.append(
                f"對戰本隊ERA {stats.vs_opponent_era:.2f} 優於本季ERA {stats.era:.2f} — "
                f"對陣相性佳 (+5)"
            )
        elif stats.vs_opponent_era > stats.era + 0.50:
            score -= 5
            notes.append(
                f"對戰本隊ERA {stats.vs_opponent_era:.2f} 劣於本季ERA {stats.era:.2f} — "
                f"對陣相性差 (-5)"
            )
        else:
            notes.append(f"對戰本隊ERA {stats.vs_opponent_era:.2f} — 表現接近本季水準")

    # --- K/9 and BB/9 ---
    if stats.k9 > 9.0:
        score += 3
        notes.append(f"K/9 {stats.k9:.1f} — 高三振率，壓制力強 (+3)")
    elif stats.k9 < 6.0:
        score -= 2
        notes.append(f"K/9 {stats.k9:.1f} — 三振率偏低 (-2)")

    if stats.bb9 > 4.0:
        score -= 3
        notes.append(f"BB/9 {stats.bb9:.1f} — 控球問題，保送率偏高 (-3)")
    elif stats.bb9 < 2.5:
        score += 3
        notes.append(f"BB/9 {stats.bb9:.1f} — 控球精準 (+3)")

    # Clamp score to 0-100
    score = max(0.0, min(100.0, score))

    # --- Advantage Text ---
    if score >= 80:
        advantage_text = "強力優勢 (Strong Advantage)"
    elif score >= 65:
        advantage_text = "輕微優勢 (Slight Advantage)"
    elif score >= 45:
        advantage_text = "均勢 (Even)"
    elif score >= 30:
        advantage_text = "輕微劣勢 (Slight Disadvantage)"
    else:
        advantage_text = "明顯劣勢 (Clear Disadvantage)"

    return {
        "score": round(score, 1),
        "advantage_text": advantage_text,
        "era": era,
        "whip": whip,
        "fip": fip,
        "k9": stats.k9,
        "bb9": stats.bb9,
        "rest_days": stats.rest_days,
        "notes": notes,
    }
