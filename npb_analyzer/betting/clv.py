"""
Closing Line Value (CLV) - Bet Quality Assessment
收盤線價值分析 — 投注品質評估
"""

from typing import Dict, Any, List


def calculate_clv(
    open_odds: float,
    close_odds: float,
    your_odds: float,
) -> Dict[str, Any]:
    """
    計算收盤線價值 (CLV)
    Calculate Closing Line Value — the gold standard of bet quality measurement.

    CLV Formula: CLV = (your_odds / close_odds) - 1
    - Positive CLV: your bet was at better odds than the closing line → profitable long-term
    - Negative CLV: you bet at worse odds than closing line → unfavorable long-term

    Args:
        open_odds: 開盤賠率 (opening decimal odds)
        close_odds: 收盤賠率 (closing decimal odds — most accurate market reflection)
        your_odds: 您的投注賠率 (the odds you actually received)

    Returns:
        dict with:
            - clv_value: CLV值 (float, positive = good)
            - clv_pct: CLV百分比 (%)
            - assessment: 評估 ("positive_clv"/"negative_clv"/"break_even")
            - notes: list of analysis notes
    """
    notes: List[str] = []

    # Validate inputs
    if close_odds <= 1.0 or your_odds <= 1.0 or open_odds <= 1.0:
        return {
            "clv_value": 0.0,
            "clv_pct": 0.0,
            "assessment": "break_even",
            "notes": ["無效賠率 — 所有賠率必須大於 1.0"],
        }

    # --- CLV Calculation ---
    # Main CLV: how your odds compare to closing line
    clv_value = (your_odds / close_odds) - 1.0
    clv_pct = clv_value * 100.0

    # Line movement from open to close
    open_to_close = (open_odds / close_odds) - 1.0
    open_to_close_pct = open_to_close * 100.0

    # Your timing advantage vs open line
    your_vs_open = (your_odds / open_odds) - 1.0
    your_vs_open_pct = your_vs_open * 100.0

    # --- Implied probability comparison ---
    open_implied = 1.0 / open_odds
    close_implied = 1.0 / close_odds
    your_implied = 1.0 / your_odds

    market_movement = close_implied - open_implied

    notes.append(
        f"開盤賠率: {open_odds:.3f} (隱含 {open_implied:.1%}) | "
        f"您的賠率: {your_odds:.3f} (隱含 {your_implied:.1%}) | "
        f"收盤賠率: {close_odds:.3f} (隱含 {close_implied:.1%})"
    )

    # --- Market Movement ---
    if abs(open_to_close_pct) > 5:
        if market_movement > 0:
            notes.append(
                f"市場移動: 賠率縮短 {abs(open_to_close_pct):.1f}% — 市場對此方較有信心"
            )
        else:
            notes.append(
                f"市場移動: 賠率拉長 {abs(open_to_close_pct):.1f}% — 市場對此方信心不足"
            )
    else:
        notes.append(f"市場移動幅度小 ({open_to_close_pct:+.1f}%) — 盤口穩定")

    # --- CLV Assessment ---
    if clv_value > 0.05:
        assessment = "positive_clv"
        notes.append(
            f"CLV: +{clv_pct:.1f}% — 強正收盤線價值! 長期下注品質優秀"
        )
        notes.append(
            "正CLV確認: 您在比收盤賠率更好的賠率下注，長期盈利關鍵指標"
        )
        quality_grade = "A" if clv_pct > 10 else "B+"
    elif clv_value > 0.01:
        assessment = "positive_clv"
        notes.append(
            f"CLV: +{clv_pct:.1f}% — 輕微正收盤線價值，方向正確"
        )
        quality_grade = "B"
    elif clv_value >= -0.01:
        assessment = "break_even"
        notes.append(
            f"CLV: {clv_pct:+.1f}% — 接近收支平衡，賠率略等於收盤線"
        )
        quality_grade = "C"
    elif clv_value >= -0.05:
        assessment = "negative_clv"
        notes.append(
            f"CLV: {clv_pct:.1f}% — 輕微負收盤線價值，稍微比市場收盤賠率差"
        )
        quality_grade = "D"
    else:
        assessment = "negative_clv"
        notes.append(
            f"CLV: {clv_pct:.1f}% — 明顯負收盤線價值，下注品質差"
        )
        notes.append("警告: 持續負CLV下注長期必然虧損")
        quality_grade = "F"

    # --- Timing Analysis ---
    if your_vs_open_pct > 3:
        notes.append(
            f"時機分析: 您的賠率比開盤高 {your_vs_open_pct:+.1f}% — 早盤下注佔優"
        )
    elif your_vs_open_pct < -3:
        notes.append(
            f"時機分析: 您的賠率比開盤低 {your_vs_open_pct:.1f}% — 晚盤下注較差"
        )
    else:
        notes.append(f"時機分析: 賠率接近開盤線 ({your_vs_open_pct:+.1f}%)")

    return {
        "clv_value": round(clv_value, 4),
        "clv_pct": round(clv_pct, 2),
        "assessment": assessment,
        "quality_grade": quality_grade,
        "open_odds": open_odds,
        "close_odds": close_odds,
        "your_odds": your_odds,
        "open_implied": round(open_implied, 4),
        "close_implied": round(close_implied, 4),
        "your_implied": round(your_implied, 4),
        "open_to_close_pct": round(open_to_close_pct, 2),
        "notes": notes,
    }
