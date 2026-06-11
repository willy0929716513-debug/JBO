"""
Monte Carlo Simulation - Game Outcome Probability Modeling
蒙地卡羅模擬 — 比賽結果機率建模 (10,000次模擬)
"""

from typing import Dict, Any, List, Tuple
import numpy as np


def run_monte_carlo(
    home_win_prob: float,
    expected_total: float,
    std_dev: float = 1.8,
    n_simulations: int = 10000,
    random_seed: int = None,
) -> Dict[str, Any]:
    """
    使用蒙地卡羅方法模擬比賽結果
    Run Monte Carlo simulation to model game outcome probabilities.

    Uses Poisson distribution to model run scoring (appropriate for baseball).
    Home and away expected runs derived from win probability and total.

    Args:
        home_win_prob: 主隊勝率 (0.0 to 1.0)
        expected_total: 預期總得分
        std_dev: 得分標準差 (default 1.8 for NPB)
        n_simulations: 模擬次數 (default 10,000)
        random_seed: 隨機種子 (optional, for reproducibility)

    Returns:
        dict with:
            - home_win_pct: 主隊模擬勝率
            - away_win_pct: 客隊模擬勝率
            - over_pct: 超過預期總分機率
            - under_pct: 低於預期總分機率
            - score_distribution: 最常見得分組合 (top 5)
            - confidence_interval_95: 95% 信賴區間 (low, high)
            - std_dev_result: 模擬結果標準差
    """
    notes: List[str] = []

    if random_seed is not None:
        np.random.seed(random_seed)

    # Validate inputs
    home_win_prob = max(0.05, min(0.95, home_win_prob))
    away_win_prob = 1.0 - home_win_prob
    expected_total = max(2.0, expected_total)

    # --- Calculate Expected Runs per Team ---
    # Based on win probability and Pythagorean expectation
    # P(home win) ≈ home_runs^2 / (home_runs^2 + away_runs^2)
    # Solving: if total = H + A and P = H^2/(H^2+A^2)
    # Simpler approach: split total by win probability share
    # More accurate: use log5 style distribution

    # Home run share increases with win probability
    # At 50% win prob → 50/50 split
    # At 70% win prob → ~58/42 split (reflects stronger offense/pitching)
    home_run_share = 0.3 + (home_win_prob * 0.4)  # Maps 0.05→0.32, 0.5→0.50, 0.95→0.68
    away_run_share = 1.0 - home_run_share

    home_lambda = expected_total * home_run_share
    away_lambda = expected_total * away_run_share

    notes.append(
        f"模擬參數: 主隊期望得分 {home_lambda:.2f}, 客隊期望得分 {away_lambda:.2f}"
    )
    notes.append(f"模擬次數: {n_simulations:,} 次 | 標準差: {std_dev:.1f}")

    # --- Vectorized Poisson Simulation ---
    home_runs = np.random.poisson(home_lambda, n_simulations)
    away_runs = np.random.poisson(away_lambda, n_simulations)
    totals = home_runs + away_runs

    # --- Win/Loss/Tie Resolution ---
    # In NPB, ties can occur (extra innings limit)
    home_wins = np.sum(home_runs > away_runs)
    away_wins = np.sum(away_runs > home_runs)
    ties = np.sum(home_runs == away_runs)

    # For win probability, distribute ties proportionally
    home_win_pct = (home_wins + ties * home_win_prob) / n_simulations
    away_win_pct = (away_wins + ties * away_win_prob) / n_simulations

    # --- Over/Under ---
    over_count = np.sum(totals > expected_total)
    under_count = np.sum(totals < expected_total)
    push_count = np.sum(totals == expected_total)

    over_pct = over_count / n_simulations
    under_pct = under_count / n_simulations
    push_pct = push_count / n_simulations

    # --- Total Runs Statistics ---
    mean_total = float(np.mean(totals))
    std_total = float(np.std(totals))

    # 95% Confidence Interval
    ci_low = float(np.percentile(totals, 2.5))
    ci_high = float(np.percentile(totals, 97.5))

    # --- Score Distribution (Top 5 Most Common) ---
    score_counts: Dict[Tuple[int, int], int] = {}
    for h, a in zip(home_runs, away_runs):
        key = (int(h), int(a))
        score_counts[key] = score_counts.get(key, 0) + 1

    # Sort by frequency and get top 5
    top_scores_raw = sorted(score_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    score_distribution = []
    for (h_score, a_score), count in top_scores_raw:
        prob = count / n_simulations
        score_distribution.append({
            "home_score": h_score,
            "away_score": a_score,
            "probability": round(prob, 4),
            "probability_pct": round(prob * 100, 1),
            "count": count,
        })

    # --- Key Statistics ---
    notes.append(
        f"模擬結果: 主隊勝率 {home_win_pct:.1%} | 客隊勝率 {away_win_pct:.1%} | "
        f"平局率 {ties/n_simulations:.1%}"
    )
    notes.append(
        f"總分: 大分機率 {over_pct:.1%} | 小分機率 {under_pct:.1%} | "
        f"平推率 {push_pct:.1%}"
    )
    notes.append(
        f"95% 信賴區間: {ci_low:.0f} - {ci_high:.0f} 分 | 平均總分 {mean_total:.2f}"
    )

    if score_distribution:
        top = score_distribution[0]
        notes.append(
            f"最常見比分: {top['home_score']}-{top['away_score']} "
            f"(機率 {top['probability_pct']:.1f}%)"
        )

    # Confidence assessment
    if std_total < 2.0:
        confidence = "high"
        notes.append("模擬信心度: 高 (低標準差，結果集中)")
    elif std_total < 3.0:
        confidence = "medium"
        notes.append("模擬信心度: 中等")
    else:
        confidence = "low"
        notes.append("模擬信心度: 低 (高標準差，結果分散)")

    return {
        "home_win_pct": round(float(home_win_pct), 4),
        "away_win_pct": round(float(away_win_pct), 4),
        "tie_pct": round(float(ties / n_simulations), 4),
        "over_pct": round(float(over_pct), 4),
        "under_pct": round(float(under_pct), 4),
        "push_pct": round(float(push_pct), 4),
        "score_distribution": score_distribution,
        "confidence_interval_95": (round(ci_low, 1), round(ci_high, 1)),
        "mean_total": round(mean_total, 2),
        "std_dev_result": round(std_total, 2),
        "confidence": confidence,
        "home_lambda": round(home_lambda, 3),
        "away_lambda": round(away_lambda, 3),
        "n_simulations": n_simulations,
        "notes": notes,
    }
