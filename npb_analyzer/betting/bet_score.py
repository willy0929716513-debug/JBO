"""
Bet Score - Composite Betting Quality Score
綜合投注品質分數 (0-100)
"""

from typing import Dict, Any, List


def calculate_bet_score(components: Dict[str, float]) -> Dict[str, Any]:
    """
    計算綜合投注品質分數 (Bet Score)
    Calculate a composite bet quality score from multiple components.

    Args:
        components: dict with the following keys (all 0-1 or appropriate ranges):
            - win_prob_edge: 模型勝率 vs 市場隱含機率差距 (e.g., 0.08 = 8% edge)
            - kelly_pct: 凱利公式比例 (full kelly as decimal, e.g., 0.12 = 12%)
            - clv_value: 收盤線價值 CLV (e.g., 0.05 = 5% positive)
            - model_confidence: 模型信心度 (0-1, from Monte Carlo std dev)
            - line_value: 讓分/賠率線價值 (0-1)
            - sharp_lean_score: 精明資金傾向分數 (0-1, 1=strong agreement)

    Returns:
        dict with bet_score (0-100), grade, recommendation, notes
    """
    notes: List[str] = []

    # Extract components with defaults
    win_prob_edge = components.get("win_prob_edge", 0.0)
    kelly_pct = components.get("kelly_pct", 0.0)
    clv_value = components.get("clv_value", 0.0)
    model_confidence = components.get("model_confidence", 0.5)
    line_value = components.get("line_value", 0.5)
    sharp_lean_score = components.get("sharp_lean_score", 0.0)

    # --- Weighted scoring (total weight = 100%) ---

    # 1. Win Probability Edge (30%) - most important
    # Edge of 10%+ = 100 points, 0% = 50, negative = 0
    if win_prob_edge >= 0.10:
        edge_score = 100.0
    elif win_prob_edge >= 0.05:
        edge_score = 50.0 + (win_prob_edge - 0.05) * 1000
    elif win_prob_edge >= 0.0:
        edge_score = win_prob_edge * 1000
    else:
        edge_score = max(0.0, 50.0 + win_prob_edge * 500)
    edge_score = max(0.0, min(100.0, edge_score))
    edge_contribution = edge_score * 0.30

    # 2. Kelly Criterion (20%)
    # Kelly > 15% = 100 pts, 5-15% = 60-100, 0-5% = 0-60, negative = 0
    if kelly_pct >= 0.15:
        kelly_score = 100.0
    elif kelly_pct >= 0.05:
        kelly_score = 60.0 + (kelly_pct - 0.05) * 400
    elif kelly_pct > 0:
        kelly_score = kelly_pct * 1200
    else:
        kelly_score = 0.0
    kelly_score = max(0.0, min(100.0, kelly_score))
    kelly_contribution = kelly_score * 0.20

    # 3. CLV (20%)
    # CLV > 10% = 100 pts, 3-10% = 60-100, 0-3% = 30-60, negative = 0
    if clv_value >= 0.10:
        clv_score = 100.0
    elif clv_value >= 0.03:
        clv_score = 60.0 + (clv_value - 0.03) * 571
    elif clv_value >= 0.0:
        clv_score = 30.0 + clv_value * 1000
    else:
        clv_score = max(0.0, 30.0 + clv_value * 300)
    clv_score = max(0.0, min(100.0, clv_score))
    clv_contribution = clv_score * 0.20

    # 4. Model Confidence (15%)
    # 0-1 scale directly maps to 0-100
    confidence_score = model_confidence * 100.0
    confidence_contribution = confidence_score * 0.15

    # 5. Line Value (15%)
    line_score = line_value * 100.0
    line_contribution = line_score * 0.15

    # 6. Sharp Money (15% → but we only have 5% left after 30+20+20+15+15=100... wait)
    # Weights: 30+20+20+15+15 = 100, no sharp_lean needed
    # Let me adjust: 30+20+20+15+10+5 = 100
    sharp_score = sharp_lean_score * 100.0
    # Recalculate with proper weights
    # Final weights: win_edge=30, kelly=20, clv=20, confidence=15, line=10, sharp=5
    line_contribution = line_score * 0.10
    sharp_contribution = sharp_score * 0.05

    # Total Bet Score
    bet_score = (
        edge_contribution
        + kelly_contribution
        + clv_contribution
        + confidence_contribution
        + line_contribution
        + sharp_contribution
    )
    bet_score = max(0.0, min(100.0, bet_score))

    # --- Grade Assignment ---
    if bet_score >= 80:
        grade = "A+"
        recommendation = "強力推薦投注 (Strong Bet)"
        star_rating = "★★★★★"
    elif bet_score >= 70:
        grade = "A"
        recommendation = "推薦投注 (Good Bet)"
        star_rating = "★★★★"
    elif bet_score >= 60:
        grade = "B+"
        recommendation = "可考慮投注 (Moderate Bet)"
        star_rating = "★★★"
    elif bet_score >= 50:
        grade = "B"
        recommendation = "謹慎投注 (Cautious Bet)"
        star_rating = "★★"
    elif bet_score >= 35:
        grade = "C"
        recommendation = "觀望為宜 (Watch Only)"
        star_rating = "★"
    else:
        grade = "D"
        recommendation = "不建議投注 (Avoid)"
        star_rating = "✗"

    # Notes
    notes.append(f"投注品質評分: {bet_score:.1f}/100 — 等級 {grade} {star_rating}")
    notes.append(
        f"分項: 勝率邊際={edge_score:.0f}({edge_contribution:.1f}) | "
        f"凱利={kelly_score:.0f}({kelly_contribution:.1f}) | "
        f"CLV={clv_score:.0f}({clv_contribution:.1f})"
    )
    notes.append(
        f"  模型信心={confidence_score:.0f}({confidence_contribution:.1f}) | "
        f"線值={line_score:.0f}({line_contribution:.1f}) | "
        f"精明資金={sharp_score:.0f}({sharp_contribution:.1f})"
    )
    notes.append(f"最終建議: {recommendation}")

    return {
        "bet_score": round(bet_score, 1),
        "grade": grade,
        "star_rating": star_rating,
        "recommendation": recommendation,
        "component_scores": {
            "edge_score": round(edge_score, 1),
            "kelly_score": round(kelly_score, 1),
            "clv_score": round(clv_score, 1),
            "confidence_score": round(confidence_score, 1),
            "line_score": round(line_score, 1),
            "sharp_score": round(sharp_score, 1),
        },
        "notes": notes,
    }
