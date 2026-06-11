"""
Totals Model - Over/Under Run Prediction
大小分預測模型
"""

from typing import Dict, Any, List
import math


def _poisson_pmf(k: int, lam: float) -> float:
    """Poisson probability mass function."""
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return (math.exp(-lam) * (lam ** k)) / math.factorial(min(k, 20))


def predict_total_runs(
    home_lineup: Dict[str, Any],
    away_lineup: Dict[str, Any],
    home_pitcher: Dict[str, Any],
    away_pitcher: Dict[str, Any],
    park: Dict[str, Any],
    weather: Dict[str, Any],
) -> Dict[str, Any]:
    """
    預測比賽總得分與大小分
    Predict total runs scored and over/under lean.

    Args:
        home_lineup: Result from analyze_lineup() for home team
        away_lineup: Result from analyze_lineup() for away team
        home_pitcher: Result from analyze_pitcher() for home pitcher
        away_pitcher: Result from analyze_pitcher() for away pitcher
        park: Result from analyze_park()
        weather: Result from analyze_weather()

    Returns:
        dict with predicted_total, top3_scores, over_under_lean
    """
    notes: List[str] = []

    # --- Home Team Expected Runs ---
    # Away pitcher ERA → affects home team scoring
    away_era = away_pitcher.get("era", 4.00)
    home_run_exp = home_lineup.get("run_expectancy", 4.2)

    # ERA adjustment factor (baseline: 4.00 ERA = neutral, 1.0x)
    era_factor_home = max(away_era, 1.0) / 4.00
    era_factor_home = max(0.4, min(2.0, era_factor_home))
    home_expected_runs = home_run_exp * era_factor_home

    # --- Away Team Expected Runs ---
    home_era = home_pitcher.get("era", 4.00)
    away_run_exp = away_lineup.get("run_expectancy", 4.2)
    era_factor_away = max(home_era, 1.0) / 4.00
    era_factor_away = max(0.4, min(2.0, era_factor_away))
    away_expected_runs = away_run_exp * era_factor_away

    # --- Park Factor ---
    run_adj = park.get("run_adjustment", 1.0)
    home_expected_runs *= run_adj
    away_expected_runs *= run_adj

    # --- Weather Factor ---
    weather_run = weather.get("run_impact", 1.0)
    home_expected_runs *= weather_run
    away_expected_runs *= weather_run

    # --- Totals ---
    predicted_home = max(0.5, home_expected_runs)
    predicted_away = max(0.5, away_expected_runs)
    predicted_total = predicted_home + predicted_away

    notes.append(
        f"預測得分: 主隊 {predicted_home:.1f} + 客隊 {predicted_away:.1f} "
        f"= 總計 {predicted_total:.1f} 分"
    )
    notes.append(
        f"影響因子: 球場調整 {run_adj:.3f} | 天氣調整 {weather_run:.3f}"
    )
    notes.append(
        f"對方先發ERA調整: 主隊面對ERA {away_era:.2f} (×{era_factor_home:.2f}) | "
        f"客隊面對ERA {home_era:.2f} (×{era_factor_away:.2f})"
    )

    # --- Top 3 Predicted Scores (Poisson distribution) ---
    max_runs = 12
    score_probs = {}
    for h in range(max_runs + 1):
        for a in range(max_runs + 1):
            prob = _poisson_pmf(h, predicted_home) * _poisson_pmf(a, predicted_away)
            if prob > 0.001:
                score_probs[(h, a)] = prob

    sorted_scores = sorted(score_probs.items(), key=lambda x: x[1], reverse=True)
    top3_scores = []
    for (h_score, a_score), prob in sorted_scores[:3]:
        total_this = h_score + a_score
        top3_scores.append({
            "home_score": h_score,
            "away_score": a_score,
            "total": total_this,
            "probability": round(prob, 4),
            "probability_pct": round(prob * 100, 1),
        })

    if top3_scores:
        t = top3_scores[0]
        notes.append(
            f"最可能比分 #1: {t['home_score']}-{t['away_score']} "
            f"(機率 {t['probability_pct']:.1f}%)"
        )
        if len(top3_scores) > 1:
            t2 = top3_scores[1]
            notes.append(
                f"最可能比分 #2: {t2['home_score']}-{t2['away_score']} "
                f"(機率 {t2['probability_pct']:.1f}%)"
            )

    # --- Over/Under Lean ---
    # NPB average is ~7-8 runs/game
    npb_avg = 7.5
    diff_from_avg = predicted_total - npb_avg
    if predicted_total > npb_avg + 1.0:
        ou_lean = "over"
        ou_text = f"大分 (Over) — 預測總分 {predicted_total:.1f} 高於NPB均值"
    elif predicted_total < npb_avg - 1.0:
        ou_lean = "under"
        ou_text = f"小分 (Under) — 預測總分 {predicted_total:.1f} 低於NPB均值"
    else:
        ou_lean = "push"
        ou_text = f"中性 (Neutral) — 預測總分 {predicted_total:.1f} 接近NPB均值"

    notes.append(f"大小分傾向: {ou_text}")

    return {
        "predicted_total": round(predicted_total, 2),
        "predicted_home_runs": round(predicted_home, 2),
        "predicted_away_runs": round(predicted_away, 2),
        "top3_scores": top3_scores,
        "over_under_lean": ou_lean,
        "over_under_text": ou_text,
        "era_factor_home": round(era_factor_home, 3),
        "era_factor_away": round(era_factor_away, 3),
        "park_run_adjustment": round(run_adj, 3),
        "weather_run_impact": round(weather_run, 3),
        "notes": notes,
    }
