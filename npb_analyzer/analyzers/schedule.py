"""
Schedule Analyzer - Schedule/Fatigue Impact Analysis
賽程疲勞分析模組
"""

from typing import Dict, Any, List
from npb_analyzer.models.game import GameInfo


def analyze_schedule(info: GameInfo) -> Dict[str, Any]:
    """
    分析賽程密度與球隊疲勞程度
    Analyze schedule density and team fatigue impact.

    Args:
        info: GameInfo dataclass with game information

    Returns:
        dict with:
            - fatigue_score (0-100): 疲勞指數 (越高越疲勞)
            - fatigue_level: 疲勞等級文字
            - notes: list of analysis notes
    """
    notes: List[str] = []
    fatigue_score = 0.0  # Start at 0 (fresh)

    # --- Double Header (連打) ---
    if info.days_since_last_game == 0:
        fatigue_score += 25
        notes.append(
            "連打 (Double Header) — 同日第二場，球員疲勞極高 (+25疲勞)"
        )

    # --- Recent Rest Benefit ---
    elif info.days_since_last_game >= 3:
        fatigue_score -= 15
        notes.append(
            f"休兵 {info.days_since_last_game} 天 — 充分休息，疲勞大幅恢復 (-15疲勞)"
        )
    elif info.days_since_last_game == 2:
        fatigue_score -= 10
        notes.append(
            f"休息 {info.days_since_last_game} 天 — 有一定休息，疲勞部分恢復 (-10疲勞)"
        )
    elif info.days_since_last_game == 1:
        notes.append(f"昨日有賽 — 正常輪換，疲勞累積中 (±0)")

    # --- Consecutive Games Played ---
    consecutive = info.consecutive_games_played
    if consecutive > 15:
        fatigue_score += 30
        notes.append(
            f"連續出賽 {consecutive} 場 — 高強度連戰，球員嚴重疲勞 (+30疲勞)"
        )
    elif consecutive > 10:
        fatigue_score += 20
        notes.append(
            f"連續出賽 {consecutive} 場 — 高密度賽程，疲勞明顯 (+20疲勞)"
        )
    elif consecutive > 7:
        fatigue_score += 12
        notes.append(
            f"連續出賽 {consecutive} 場 — 中等疲勞累積 (+12疲勞)"
        )
    elif consecutive > 4:
        fatigue_score += 6
        notes.append(
            f"連續出賽 {consecutive} 場 — 輕微疲勞 (+6疲勞)"
        )
    else:
        notes.append(f"連續出賽 {consecutive} 場 — 賽程密度正常")

    # --- Travel Game Impact ---
    if info.is_travel_game:
        fatigue_score += 15
        notes.append(
            "長途客場 (Long Distance Travel) — 交通疲勞，時差/舟車勞頓 (+15疲勞)"
        )

    # --- Consecutive Away Games ---
    away_games = info.consecutive_away_games
    if away_games > 8:
        fatigue_score += 15
        notes.append(
            f"連續客場 {away_games} 場 — 長期作客，主場劣勢累積嚴重 (+15疲勞)"
        )
    elif away_games > 5:
        fatigue_score += 10
        notes.append(
            f"連續客場 {away_games} 場 — 長客場旅程，主場劣勢顯著 (+10疲勞)"
        )
    elif away_games > 3:
        fatigue_score += 5
        notes.append(
            f"連續客場 {away_games} 場 — 有一定主場劣勢 (+5疲勞)"
        )
    elif away_games > 0:
        notes.append(f"連續客場 {away_games} 場 — 客場適應中")

    # Cap fatigue score
    fatigue_score = max(0.0, min(100.0, fatigue_score))

    # --- Fatigue Level Classification ---
    if fatigue_score >= 60:
        fatigue_level = "severe"
        fatigue_text = "嚴重疲勞 (Severe Fatigue)"
        notes.append("⚠ 賽程疲勞評估: 嚴重疲勞，對球隊表現有實質負面影響")
    elif fatigue_score >= 40:
        fatigue_level = "high"
        fatigue_text = "高度疲勞 (High Fatigue)"
        notes.append("注意: 賽程疲勞評估: 高度疲勞，影響投打發揮")
    elif fatigue_score >= 20:
        fatigue_level = "moderate"
        fatigue_text = "中度疲勞 (Moderate Fatigue)"
        notes.append("賽程疲勞評估: 中度疲勞，影響輕微")
    elif fatigue_score > 5:
        fatigue_level = "low"
        fatigue_text = "輕度疲勞 (Low Fatigue)"
        notes.append("賽程疲勞評估: 疲勞程度低，接近正常狀態")
    else:
        fatigue_level = "fresh"
        fatigue_text = "體力充沛 (Fresh)"
        notes.append("賽程疲勞評估: 球員體力充沛，狀態最佳")

    return {
        "fatigue_score": round(fatigue_score, 1),
        "fatigue_level": fatigue_level,
        "fatigue_text": fatigue_text,
        "consecutive_games": consecutive,
        "is_travel_game": info.is_travel_game,
        "consecutive_away_games": away_games,
        "days_since_last_game": info.days_since_last_game,
        "notes": notes,
    }
