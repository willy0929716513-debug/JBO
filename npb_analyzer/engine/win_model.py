"""
Win Probability Model - AI-Weighted Win Probability Engine
AI加權勝率模型
"""

from typing import Dict, Any, List


# Model weights (must sum to 1.0)
WEIGHTS = {
    "pitcher":  0.35,
    "bullpen":  0.20,
    "lineup":   0.20,
    "defense":  0.05,
    "form":     0.10,
    "fatigue":  0.05,
    "park":     0.05,
}


def calculate_win_probability(
    home_scores: Dict[str, float],
    away_scores: Dict[str, float],
) -> Dict[str, Any]:
    """
    計算主客隊勝率（加權模型）
    Calculate win probability using weighted component scores.

    Args:
        home_scores: dict with component scores for home team:
            - pitcher_score (0-100)
            - bullpen_score (0-100)
            - lineup_score (0-100)
            - defense_score (0-100)
            - form_score (0-100)
            - fatigue_score (0-100, higher = more tired = worse)
            - park_adjustment (multiplier, e.g., 1.05 = home park advantage)
        away_scores: same structure for away team

    Returns:
        dict with home_win_prob, away_win_prob, composite scores, breakdown
    """
    notes: List[str] = []

    def _extract(scores: Dict, key: str, default: float = 50.0) -> float:
        return float(scores.get(key, default))

    # Extract scores
    home = {
        "pitcher":  _extract(home_scores, "pitcher_score"),
        "bullpen":  _extract(home_scores, "bullpen_score"),
        "lineup":   _extract(home_scores, "lineup_score"),
        "defense":  _extract(home_scores, "defense_score"),
        "form":     _extract(home_scores, "form_score"),
        "fatigue":  _extract(home_scores, "fatigue_score"),
    }
    away = {
        "pitcher":  _extract(away_scores, "pitcher_score"),
        "bullpen":  _extract(away_scores, "bullpen_score"),
        "lineup":   _extract(away_scores, "lineup_score"),
        "defense":  _extract(away_scores, "defense_score"),
        "form":     _extract(away_scores, "form_score"),
        "fatigue":  _extract(away_scores, "fatigue_score"),
    }

    # Fatigue is inverted (higher fatigue = lower effective score)
    home["fatigue_effective"] = 100.0 - home["fatigue"]
    away["fatigue_effective"] = 100.0 - away["fatigue"]

    # Weighted composite score
    home_composite = (
        home["pitcher"]          * WEIGHTS["pitcher"]
        + home["bullpen"]        * WEIGHTS["bullpen"]
        + home["lineup"]         * WEIGHTS["lineup"]
        + home["defense"]        * WEIGHTS["defense"]
        + home["form"]           * WEIGHTS["form"]
        + home["fatigue_effective"] * WEIGHTS["fatigue"]
    )
    away_composite = (
        away["pitcher"]          * WEIGHTS["pitcher"]
        + away["bullpen"]        * WEIGHTS["bullpen"]
        + away["lineup"]         * WEIGHTS["lineup"]
        + away["defense"]        * WEIGHTS["defense"]
        + away["form"]           * WEIGHTS["form"]
        + away["fatigue_effective"] * WEIGHTS["fatigue"]
    )

    # Park adjustment (home team gets park benefit)
    park_adj = float(home_scores.get("park_adjustment", 1.0))
    home_composite_adj = home_composite * park_adj

    # Normalize to win probability
    total = home_composite_adj + away_composite
    if total <= 0:
        home_win_prob = 0.5
        away_win_prob = 0.5
    else:
        home_win_prob = home_composite_adj / total
        away_win_prob = away_composite / total

    # Clamp to realistic range (5%-95%)
    home_win_prob = max(0.05, min(0.95, home_win_prob))
    away_win_prob = 1.0 - home_win_prob

    # Build breakdown
    breakdown = {
        "home": {
            k: round(v, 1) for k, v in home.items()
            if k != "fatigue_effective"
        },
        "away": {
            k: round(v, 1) for k, v in away.items()
            if k != "fatigue_effective"
        },
        "weights": WEIGHTS,
        "home_composite_raw": round(home_composite, 2),
        "away_composite_raw": round(away_composite, 2),
        "park_adjustment": round(park_adj, 3),
        "home_composite_adj": round(home_composite_adj, 2),
    }

    # Notes
    notes.append(
        f"加權複合分: 主隊 {home_composite_adj:.1f} vs 客隊 {away_composite:.1f}"
    )
    notes.append(
        f"模型勝率: 主隊 {home_win_prob:.1%} | 客隊 {away_win_prob:.1%}"
    )
    notes.append(
        f"先發(35%): 主{home['pitcher']:.0f} vs 客{away['pitcher']:.0f} | "
        f"牛棚(20%): 主{home['bullpen']:.0f} vs 客{away['bullpen']:.0f} | "
        f"打線(20%): 主{home['lineup']:.0f} vs 客{away['lineup']:.0f}"
    )
    notes.append(
        f"守備(5%): 主{home['defense']:.0f} vs 客{away['defense']:.0f} | "
        f"狀態(10%): 主{home['form']:.0f} vs 客{away['form']:.0f} | "
        f"體能(5%): 主疲勞{home['fatigue']:.0f} vs 客疲勞{away['fatigue']:.0f}"
    )

    if park_adj > 1.02:
        notes.append(f"球場加成: +{(park_adj-1)*100:.1f}% 利主隊")
    elif park_adj < 0.98:
        notes.append(f"球場影響: {(park_adj-1)*100:.1f}% 不利主隊")

    return {
        "home_win_prob": round(home_win_prob, 4),
        "away_win_prob": round(away_win_prob, 4),
        "home_composite_score": round(home_composite_adj, 2),
        "away_composite_score": round(away_composite, 2),
        "breakdown": breakdown,
        "notes": notes,
    }
