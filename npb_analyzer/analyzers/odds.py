"""
Odds Analyzer - Betting Line and Odds Analysis
賠率線分析模組
"""

from typing import Dict, Any, List, Optional


def _decimal_to_implied_prob(decimal_odds: float) -> float:
    """
    將十進位賠率轉換為隱含機率
    Convert decimal odds to implied probability.
    """
    if decimal_odds <= 0:
        return 0.0
    return 1.0 / decimal_odds


def _american_to_decimal(american_odds: float) -> float:
    """
    將美式賠率轉換為十進位賠率
    Convert American moneyline odds to decimal odds.
    """
    if american_odds > 0:
        return (american_odds / 100.0) + 1.0
    else:
        return (100.0 / abs(american_odds)) + 1.0


def analyze_odds(
    open_line: float,
    current_line: float,
    open_total: float,
    current_total: float,
    home_ml: float,
    away_ml: float,
    model_home_win_prob: Optional[float] = None,
) -> Dict[str, Any]:
    """
    分析盤口移動與尋找價值投注機會
    Analyze line movement and identify value betting opportunities.

    Args:
        open_line: 開盤讓分 (opening spread, positive = home favorite)
        current_line: 目前讓分 (current spread)
        open_total: 開盤總分 (opening total O/U)
        current_total: 目前總分 (current total O/U)
        home_ml: 主隊獨贏賠率 (home team moneyline, decimal odds)
        away_ml: 客隊獨贏賠率 (away team moneyline, decimal odds)
        model_home_win_prob: 模型計算的主隊勝率 (optional, for value detection)

    Returns:
        dict with:
            - value_bet_exists: 是否存在價值投注
            - sharp_lean: 精明資金傾向 ("home"/"away"/"none")
            - steam_move: 是否出現蒸汽移動 (steam move)
            - line_movement_pct: 盤口移動百分比
            - notes: list of analysis notes
    """
    notes: List[str] = []

    # --- Line Movement Analysis ---
    line_movement = current_line - open_line
    line_movement_pct = abs(line_movement) / max(abs(open_line), 0.5) if open_line != 0 else 0.0

    # Total line movement
    total_movement = current_total - open_total

    # --- Steam Move Detection ---
    steam_move = False
    if abs(line_movement) >= 0.15 or abs(line_movement) >= 1.5:
        steam_move = True
        direction = "主隊 (Home)" if line_movement < 0 else "客隊 (Away)"
        notes.append(
            f"蒸汽移動 (Steam Move) 偵測! 讓分從 {open_line:+.1f} 移至 {current_line:+.1f} — "
            f"精明資金流向 {direction}"
        )
    else:
        notes.append(
            f"讓分移動: {open_line:+.1f} → {current_line:+.1f} (移動 {line_movement:+.1f}) — "
            f"正常盤口調整"
        )

    # Total movement analysis
    if abs(total_movement) >= 0.5:
        total_dir = "大分" if total_movement > 0 else "小分"
        notes.append(
            f"總分盤移動: {open_total:.1f} → {current_total:.1f} (移動 {total_movement:+.1f}) — "
            f"資金傾向{total_dir}"
        )
    else:
        notes.append(
            f"總分盤: {open_total:.1f} → {current_total:.1f} — 總分盤穩定"
        )

    # --- Implied Probability from Moneyline ---
    home_implied = _decimal_to_implied_prob(home_ml)
    away_implied = _decimal_to_implied_prob(away_ml)

    # Calculate overround (vig)
    total_implied = home_implied + away_implied
    vig = total_implied - 1.0

    # No-vig implied probabilities
    if total_implied > 0:
        home_no_vig = home_implied / total_implied
        away_no_vig = away_implied / total_implied
    else:
        home_no_vig = 0.5
        away_no_vig = 0.5

    notes.append(
        f"主隊賠率 {home_ml:.2f} → 隱含勝率 {home_no_vig:.1%} | "
        f"客隊賠率 {away_ml:.2f} → 隱含勝率 {away_no_vig:.1%}"
    )
    notes.append(f"博彩抽水 (Vig/Juice): {vig:.1%}")

    # --- Value Bet Detection ---
    value_bet_exists = False
    value_details = ""

    if model_home_win_prob is not None:
        model_away_win_prob = 1.0 - model_home_win_prob
        home_edge = model_home_win_prob - home_no_vig
        away_edge = model_away_win_prob - away_no_vig

        notes.append(
            f"模型主隊勝率: {model_home_win_prob:.1%} vs 市場隱含: {home_no_vig:.1%} "
            f"(邊際: {home_edge:+.1%})"
        )

        if home_edge > 0.05:
            value_bet_exists = True
            value_details = f"主隊價值投注 (邊際 +{home_edge:.1%})"
            notes.append(f"價值投注發現! {value_details}")
        elif away_edge > 0.05:
            value_bet_exists = True
            value_details = f"客隊價值投注 (邊際 +{away_edge:.1%})"
            notes.append(f"價值投注發現! {value_details}")
        else:
            notes.append("無顯著價值投注邊際 (<5%差距)")

    # --- Sharp Money Lean (from line movement) ---
    if steam_move:
        if line_movement < 0:
            # Line moved in favor of home team → sharp money on home
            sharp_lean = "home"
            notes.append("精明資金 (Sharp Money) 傾向: 主隊")
        else:
            sharp_lean = "away"
            notes.append("精明資金 (Sharp Money) 傾向: 客隊")
    elif abs(line_movement) > 0.05:
        if line_movement < 0:
            sharp_lean = "home"
            notes.append("輕微精明資金傾向: 主隊")
        else:
            sharp_lean = "away"
            notes.append("輕微精明資金傾向: 客隊")
    else:
        sharp_lean = "none"
        notes.append("精明資金方向不明確")

    # --- Vegas Bias Indicator ---
    if home_no_vig > 0.55:
        vegas_bias = "home_favorite"
        notes.append(f"賠率市場: 主隊大熱門 (市場勝率 {home_no_vig:.1%})")
    elif away_no_vig > 0.55:
        vegas_bias = "away_favorite"
        notes.append(f"賠率市場: 客隊大熱門 (市場勝率 {away_no_vig:.1%})")
    else:
        vegas_bias = "even"
        notes.append(f"賠率市場: 勢均力敵 (主 {home_no_vig:.1%} vs 客 {away_no_vig:.1%})")

    return {
        "value_bet_exists": value_bet_exists,
        "value_details": value_details,
        "sharp_lean": sharp_lean,
        "steam_move": steam_move,
        "line_movement": round(line_movement, 2),
        "line_movement_pct": round(line_movement_pct, 3),
        "total_movement": round(total_movement, 2),
        "open_line": open_line,
        "current_line": current_line,
        "open_total": open_total,
        "current_total": current_total,
        "home_ml": home_ml,
        "away_ml": away_ml,
        "home_implied_prob": round(home_no_vig, 4),
        "away_implied_prob": round(away_no_vig, 4),
        "vig": round(vig, 4),
        "vegas_bias": vegas_bias,
        "notes": notes,
    }
