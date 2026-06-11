"""
Defense Analyzer - Defensive Performance Analysis
守備分析模組
"""

from typing import Dict, Any, List
from npb_analyzer.models.game import TeamStats


def analyze_defense(stats: TeamStats) -> Dict[str, Any]:
    """
    分析球隊守備能力
    Analyze team defensive capability and quality.

    Args:
        stats: TeamStats dataclass with team statistics

    Returns:
        dict with:
            - score (0-100): 守備優勢分數
            - advantage: 優勢方向 ("home"/"away"/"even")
            - notes: list of analysis notes
    """
    notes: List[str] = []
    score = 50.0  # Base score

    # --- Fielding Percentage ---
    fp = stats.fielding_pct
    if fp >= 0.990:
        score += 15
        notes.append(f"守備率 {fp:.3f} — 精準守備，失誤率極低 (+15)")
    elif fp >= 0.983:
        score += 8
        notes.append(f"守備率 {fp:.3f} — 守備穩健 (+8)")
    elif fp >= 0.975:
        notes.append(f"守備率 {fp:.3f} — 守備普通 (±0)")
    else:
        score -= 10
        notes.append(f"守備率 {fp:.3f} — 守備偏差，失誤風險高 (-10)")

    # --- DRS (Defensive Runs Saved) ---
    drs = stats.drs
    if drs > 10:
        score += 12
        notes.append(f"DRS +{drs:.0f} — 精英守備，大幅節省失分 (+12)")
    elif drs > 0:
        score += 5
        notes.append(f"DRS +{drs:.0f} — 守備優於平均 (+5)")
    elif drs >= -5:
        notes.append(f"DRS {drs:.0f} — 守備接近平均 (±0)")
    elif drs >= -15:
        score -= 8
        notes.append(f"DRS {drs:.0f} — 守備低於平均 (-8)")
    else:
        score -= 15
        notes.append(f"DRS {drs:.0f} — 守備薄弱，失分風險高 (-15)")

    # --- UZR (Ultimate Zone Rating) ---
    uzr = stats.uzr
    if uzr > 5.0:
        score += 8
        notes.append(f"UZR +{uzr:.1f} — 守備範圍優異 (+8)")
    elif uzr > 0:
        score += 3
        notes.append(f"UZR +{uzr:.1f} — 守備範圍良好 (+3)")
    elif uzr >= -5.0:
        notes.append(f"UZR {uzr:.1f} — 守備範圍普通 (±0)")
    else:
        score -= 8
        notes.append(f"UZR {uzr:.1f} — 守備範圍偏差 (-8)")

    # --- Catcher Caught Stealing (CS%) ---
    cs_pct = stats.catcher_cs_pct
    if cs_pct >= 0.35:
        score += 6
        notes.append(f"捕手阻殺率 {cs_pct:.1%} — 強力阻殺，壓制盜壘 (+6)")
    elif cs_pct >= 0.28:
        notes.append(f"捕手阻殺率 {cs_pct:.1%} — 阻殺率普通 (±0)")
    else:
        score -= 5
        notes.append(f"捕手阻殺率 {cs_pct:.1%} — 盜壘防守偏弱 (-5)")

    # --- Error Rate ---
    error_rate = stats.error_rate
    if error_rate < 0.015:
        score += 5
        notes.append(f"失誤率 {error_rate:.3f} — 極低失誤 (+5)")
    elif error_rate < 0.025:
        notes.append(f"失誤率 {error_rate:.3f} — 失誤率正常 (±0)")
    else:
        score -= 8
        notes.append(f"失誤率 {error_rate:.3f} — 失誤率偏高 (-8)")

    # Cap score
    score = max(0.0, min(100.0, score))

    # --- Determine Advantage ---
    if score >= 65:
        advantage = "home"  # Will be overridden by caller context
        advantage_text = "守備優勢 (Defensive Advantage)"
    elif score >= 40:
        advantage = "even"
        advantage_text = "守備均勢 (Defensive Even)"
    else:
        advantage = "away"
        advantage_text = "守備劣勢 (Defensive Disadvantage)"

    return {
        "score": round(score, 1),
        "advantage": advantage,
        "advantage_text": advantage_text,
        "fielding_pct": fp,
        "drs": drs,
        "uzr": uzr,
        "catcher_cs_pct": cs_pct,
        "error_rate": error_rate,
        "notes": notes,
    }
