"""
Kelly Criterion - Optimal Bet Sizing
凱利公式最佳投注計算
"""

from typing import Dict, Any, List


def kelly_criterion(
    win_prob: float,
    decimal_odds: float,
    bankroll: float = 1.0,
    fraction: float = 0.25,
) -> Dict[str, Any]:
    """
    使用凱利公式計算最佳投注比例
    Calculate optimal bet size using the Kelly Criterion.

    Formula: f* = (b*p - q) / b
    where:
        b = decimal_odds - 1  (net profit per unit wagered)
        p = win probability
        q = 1 - p (loss probability)

    Default uses 1/4 Kelly (fraction=0.25) for conservative risk management.

    Args:
        win_prob: 勝率 (0.0 to 1.0)
        decimal_odds: 十進位賠率 (e.g., 2.10 means bet 1 win 2.10)
        bankroll: 本金金額 (default 1.0 for percentage display)
        fraction: 凱利分數 (0.25 = 四分之一凱利，保守推薦)

    Returns:
        dict with:
            - kelly_pct: 全凱利投注比例 (%)
            - fractional_kelly_pct: 分數凱利投注比例 (%)
            - bet_amount: 建議投注金額
            - edge: 投注優勢 (%)
            - notes: list of analysis notes
    """
    notes: List[str] = []

    # Validate inputs
    if not (0.0 < win_prob < 1.0):
        return {
            "kelly_pct": 0.0,
            "fractional_kelly_pct": 0.0,
            "bet_amount": 0.0,
            "edge": 0.0,
            "notes": ["無效勝率 — 勝率必須在 0-100% 之間"],
        }

    if decimal_odds <= 1.0:
        return {
            "kelly_pct": 0.0,
            "fractional_kelly_pct": 0.0,
            "bet_amount": 0.0,
            "edge": 0.0,
            "notes": ["無效賠率 — 十進位賠率必須大於 1.0"],
        }

    # Kelly formula variables
    b = decimal_odds - 1.0  # Net profit per unit wagered
    p = win_prob
    q = 1.0 - p            # Loss probability

    # Full Kelly percentage
    kelly_pct = (b * p - q) / b

    # Fractional Kelly
    fractional_kelly_pct = kelly_pct * fraction

    # Expected value (edge)
    # EV = p * b - q  (per unit bet)
    ev = (p * b) - q
    edge_pct = ev * 100

    # Bet amount based on bankroll
    bet_amount = max(0.0, fractional_kelly_pct * bankroll)

    # --- Analysis Notes ---
    if kelly_pct <= 0:
        notes.append(
            f"凱利公式: 負值 ({kelly_pct:.1%}) — 無投注優勢，建議不投 (Negative Edge)"
        )
        notes.append(f"期望值 (EV): {ev:.3f} — 負期望值投注")
        return {
            "kelly_pct": 0.0,
            "fractional_kelly_pct": 0.0,
            "bet_amount": 0.0,
            "edge": round(edge_pct, 2),
            "notes": notes,
        }

    notes.append(
        f"凱利公式計算: b={b:.2f}, p={p:.1%}, q={q:.1%}"
    )
    notes.append(
        f"全凱利比例: {kelly_pct:.1%} — 理論最佳但高風險"
    )
    notes.append(
        f"四分之一凱利 ({fraction:.0%}): {fractional_kelly_pct:.1%} — 保守建議比例"
    )
    notes.append(
        f"期望值 (EV): +{ev:.3f} per unit — 每單位正期望值 {edge_pct:.1f}%"
    )

    if kelly_pct > 0.20:
        notes.append(
            f"⚠ 全凱利比例 {kelly_pct:.1%} 偏高 — 強烈建議使用分數凱利控制風險"
        )
    elif kelly_pct > 0.10:
        notes.append(f"凱利比例 {kelly_pct:.1%} — 中等規模投注")
    else:
        notes.append(f"凱利比例 {kelly_pct:.1%} — 小額投注，邊際合理")

    if bankroll != 1.0:
        notes.append(
            f"建議投注金額: {bet_amount:.2f} (本金 {bankroll:.2f} × {fractional_kelly_pct:.1%})"
        )

    return {
        "kelly_pct": round(kelly_pct * 100, 2),       # As percentage
        "fractional_kelly_pct": round(fractional_kelly_pct * 100, 2),
        "bet_amount": round(bet_amount, 2),
        "edge": round(edge_pct, 2),
        "ev_per_unit": round(ev, 4),
        "b_value": round(b, 3),
        "fraction_used": fraction,
        "notes": notes,
    }
