"""
Form Analyzer - Recent Team Form Analysis
近期狀態分析模組
"""

from typing import Dict, Any, List, Tuple
from npb_analyzer.models.game import TeamStats


def _parse_record(record_str: str) -> Tuple[int, int]:
    """
    解析勝負紀錄字串
    Parse a "W-L" record string into (wins, losses).

    Args:
        record_str: Record string like "3-2", "7-3", etc.

    Returns:
        Tuple of (wins, losses)
    """
    try:
        parts = record_str.strip().split("-")
        wins = int(parts[0])
        losses = int(parts[1])
        return wins, losses
    except (ValueError, IndexError):
        return 0, 0


def _win_pct(wins: int, losses: int) -> float:
    """Calculate win percentage."""
    total = wins + losses
    if total == 0:
        return 0.500
    return wins / total


def analyze_form(stats: TeamStats) -> Dict[str, Any]:
    """
    分析球隊近期狀態趨勢
    Analyze team recent form and momentum trend.

    Args:
        stats: TeamStats dataclass with team statistics

    Returns:
        dict with:
            - form_score (0-100): 狀態分數
            - trend: 趨勢方向 ("hot"/"cold"/"neutral")
            - notes: list of analysis notes
    """
    notes: List[str] = []
    score = 50.0  # Base score

    # --- Parse Recent Records ---
    w5, l5 = _parse_record(stats.last_5_record)
    w10, l10 = _parse_record(stats.last_10_record)
    w20, l20 = _parse_record(stats.last_20_record)

    pct5 = _win_pct(w5, l5)
    pct10 = _win_pct(w10, l10)
    pct20 = _win_pct(w20, l20)

    # --- Last 5 Games (Most Recent, Highest Weight) ---
    if pct5 >= 0.800:
        score += 20
        notes.append(f"近5場戰績 {stats.last_5_record} ({pct5:.1%}) — 近期大熱 (+20)")
    elif pct5 >= 0.600:
        score += 10
        notes.append(f"近5場戰績 {stats.last_5_record} ({pct5:.1%}) — 近期狀態良好 (+10)")
    elif pct5 >= 0.400:
        notes.append(f"近5場戰績 {stats.last_5_record} ({pct5:.1%}) — 近期狀態普通 (±0)")
    elif pct5 >= 0.200:
        score -= 10
        notes.append(f"近5場戰績 {stats.last_5_record} ({pct5:.1%}) — 近期狀態偏差 (-10)")
    else:
        score -= 20
        notes.append(f"近5場戰績 {stats.last_5_record} ({pct5:.1%}) — 近期嚴重低迷 (-20)")

    # --- Last 10 Games (Medium Weight) ---
    if pct10 >= 0.700:
        score += 12
        notes.append(f"近10場戰績 {stats.last_10_record} ({pct10:.1%}) — 10場強勢 (+12)")
    elif pct10 >= 0.600:
        score += 6
        notes.append(f"近10場戰績 {stats.last_10_record} ({pct10:.1%}) — 10場正向 (+6)")
    elif pct10 >= 0.400:
        notes.append(f"近10場戰績 {stats.last_10_record} ({pct10:.1%}) — 10場均衡 (±0)")
    elif pct10 >= 0.300:
        score -= 6
        notes.append(f"近10場戰績 {stats.last_10_record} ({pct10:.1%}) — 10場偏差 (-6)")
    else:
        score -= 12
        notes.append(f"近10場戰績 {stats.last_10_record} ({pct10:.1%}) — 10場嚴重低迷 (-12)")

    # --- Last 20 Games (Long-term baseline) ---
    if pct20 >= 0.600:
        score += 8
        notes.append(f"近20場戰績 {stats.last_20_record} ({pct20:.1%}) — 長期強隊表現 (+8)")
    elif pct20 >= 0.500:
        score += 3
        notes.append(f"近20場戰績 {stats.last_20_record} ({pct20:.1%}) — 長期表現穩定 (+3)")
    elif pct20 >= 0.400:
        score -= 3
        notes.append(f"近20場戰績 {stats.last_20_record} ({pct20:.1%}) — 長期表現偏弱 (-3)")
    else:
        score -= 8
        notes.append(f"近20場戰績 {stats.last_20_record} ({pct20:.1%}) — 長期低迷 (-8)")

    # --- Momentum (Trend from 20 games to recent 5) ---
    momentum = pct5 - pct20
    if momentum > 0.200:
        score += 8
        notes.append(
            f"動能上升 +{momentum:.1%} (近5場 vs 近20場基線) — 強勁上升趨勢 (+8)"
        )
    elif momentum > 0.100:
        score += 4
        notes.append(
            f"動能輕微上升 +{momentum:.1%} — 狀態改善中 (+4)"
        )
    elif momentum < -0.200:
        score -= 8
        notes.append(
            f"動能下滑 {momentum:.1%} (近5場 vs 近20場基線) — 顯著衰退趨勢 (-8)"
        )
    elif momentum < -0.100:
        score -= 4
        notes.append(f"動能輕微下滑 {momentum:.1%} — 狀態有所退步 (-4)")

    # --- OPS Trend ---
    if stats.team_ops_trend > 0.030:
        score += 5
        notes.append(f"打線OPS上升趨勢 {stats.team_ops_trend:+.3f} — 攻擊力改善 (+5)")
    elif stats.team_ops_trend < -0.030:
        score -= 5
        notes.append(f"打線OPS下滑趨勢 {stats.team_ops_trend:+.3f} — 攻擊力衰退 (-5)")

    # Cap score
    score = max(0.0, min(100.0, score))

    # --- Determine Trend ---
    if pct10 >= 0.600 and pct5 >= 0.600:
        trend = "hot"
        trend_text = "火熱狀態 (Hot Streak)"
    elif pct10 <= 0.400 and pct5 <= 0.400:
        trend = "cold"
        trend_text = "低迷狀態 (Cold Streak)"
    elif pct5 >= 0.600 and pct10 < 0.600:
        trend = "hot"
        trend_text = "近期回溫 (Recent Upswing)"
    elif pct5 <= 0.400 and pct10 >= 0.400:
        trend = "cold"
        trend_text = "近期降溫 (Recent Downturn)"
    else:
        trend = "neutral"
        trend_text = "狀態中性 (Neutral Form)"

    return {
        "form_score": round(score, 1),
        "trend": trend,
        "trend_text": trend_text,
        "last_5_record": stats.last_5_record,
        "last_10_record": stats.last_10_record,
        "last_20_record": stats.last_20_record,
        "pct5": round(pct5, 3),
        "pct10": round(pct10, 3),
        "pct20": round(pct20, 3),
        "momentum": round(momentum, 3),
        "notes": notes,
    }
