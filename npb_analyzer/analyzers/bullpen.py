"""
Bullpen Analyzer - Relief Pitching Analysis
牛棚分析模組
"""

from typing import Dict, Any, List
from npb_analyzer.models.game import BullpenStats


def analyze_bullpen(stats: BullpenStats) -> Dict[str, Any]:
    """
    分析牛棚疲勞度與整體素質
    Analyze bullpen quality and fatigue level.

    Args:
        stats: BullpenStats dataclass with bullpen statistics

    Returns:
        dict with:
            - era_rating: 牛棚ERA評級 ("strong"/"average"/"weak")
            - fatigue_level: 疲勞指數 (0-100, 越高越疲勞)
            - score: 牛棚整體分數 (0-100)
            - advantage: 優勢方向 ("home"/"away"/"even")
            - notes: list of analysis notes
    """
    notes: List[str] = []
    score = 50.0  # Base score
    fatigue_level = 0.0

    # --- ERA Rating ---
    era = stats.era
    if era < 3.00:
        era_rating = "strong"
        score += 20
        notes.append(f"牛棚ERA {era:.2f} — 強力牛棚 (Strong Bullpen) (+20)")
    elif era < 4.00:
        era_rating = "average"
        notes.append(f"牛棚ERA {era:.2f} — 普通牛棚 (Average Bullpen) (±0)")
    else:
        era_rating = "weak"
        score -= 20
        notes.append(f"牛棚ERA {era:.2f} — 薄弱牛棚 (Weak Bullpen) (-20)")

    # --- Fatigue Assessment ---

    # Last 3 days workload (critical indicator)
    if stats.last_3_days_ip > 5.0:
        fatigue_level += 35
        score -= 15
        notes.append(
            f"近3天投球局數 {stats.last_3_days_ip:.1f} 局 — 高負荷，嚴重疲勞 (-15)"
        )
    elif stats.last_3_days_ip > 3.0:
        fatigue_level += 20
        score -= 8
        notes.append(
            f"近3天投球局數 {stats.last_3_days_ip:.1f} 局 — 中等負荷，有疲勞跡象 (-8)"
        )
    else:
        notes.append(
            f"近3天投球局數 {stats.last_3_days_ip:.1f} 局 — 負荷正常"
        )

    # Last 7 days workload (weekly accumulation)
    if stats.last_7_days_ip > 12.0:
        fatigue_level += 25
        score -= 10
        notes.append(
            f"近7天投球局數 {stats.last_7_days_ip:.1f} 局 — 週累積過高，需謹慎 (-10)"
        )
    elif stats.last_7_days_ip > 8.0:
        fatigue_level += 12
        score -= 5
        notes.append(
            f"近7天投球局數 {stats.last_7_days_ip:.1f} 局 — 週累積偏高 (-5)"
        )
    else:
        notes.append(
            f"近7天投球局數 {stats.last_7_days_ip:.1f} 局 — 週累積正常"
        )

    # Consecutive days pitched
    if stats.consecutive_days >= 3:
        fatigue_level += 20
        score -= 8
        notes.append(
            f"連續出賽 {stats.consecutive_days} 天 — 高頻使用，疲勞累積 (-8)"
        )
    elif stats.consecutive_days == 2:
        fatigue_level += 10
        score -= 4
        notes.append(f"連續出賽 {stats.consecutive_days} 天 — 輕微疲勞 (-4)")

    # --- Key Reliever Availability ---
    if not stats.closer_available:
        score -= 15
        fatigue_level += 15
        notes.append("終結者不可用 (Closer Unavailable) — 重大劣勢 (-15)")
    else:
        notes.append("終結者可用 (Closer Available) ✓")

    if stats.setup_fatigued:
        score -= 10
        fatigue_level += 10
        notes.append("主要中繼投手疲勞 (Setup Reliever Fatigued) — 中段防守風險 (-10)")
    else:
        notes.append("中繼投手狀態正常 (Setup Relievers Fresh) ✓")

    # --- Blown Saves Consideration ---
    if stats.save_opportunities > 0:
        blown_save_rate = stats.blown_saves / stats.save_opportunities
        if blown_save_rate > 0.25:
            score -= 8
            notes.append(
                f"救援失敗率 {blown_save_rate:.1%} ({stats.blown_saves}/{stats.save_opportunities}) — 終結能力堪憂 (-8)"
            )
        elif blown_save_rate < 0.10:
            score += 5
            notes.append(
                f"救援成功率高 {1-blown_save_rate:.1%} — 終結能力穩定 (+5)"
            )

    # Cap values
    score = max(0.0, min(100.0, score))
    fatigue_level = max(0.0, min(100.0, fatigue_level))

    # --- Determine Advantage ---
    if score >= 65:
        advantage = "home"  # Will be overridden by caller based on which team
        era_label = "強力優勢 (Strong)"
    elif score >= 45:
        advantage = "even"
        era_label = "均勢 (Even)"
    else:
        advantage = "away"
        era_label = "明顯劣勢 (Weak)"

    return {
        "score": round(score, 1),
        "era_rating": era_rating,
        "era": era,
        "fatigue_level": round(fatigue_level, 1),
        "advantage": advantage,
        "era_label": era_label,
        "closer_available": stats.closer_available,
        "setup_fatigued": stats.setup_fatigued,
        "last_3_days_ip": stats.last_3_days_ip,
        "last_7_days_ip": stats.last_7_days_ip,
        "notes": notes,
    }
