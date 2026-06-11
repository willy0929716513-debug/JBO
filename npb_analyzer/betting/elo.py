"""
ELO Rating System - Team Strength Rating
ELO評分系統 — 球隊強度評估
"""

from typing import Dict, Any, List, Tuple
import math


# Default NPB ELO ratings (2024 season baseline)
# 日本職棒球隊ELO預設評分
NPB_ELO_DEFAULTS: Dict[str, float] = {
    "阪神": 1580,       # Tigers - 2023 champions
    "オリックス": 1560,  # Buffaloes - recent PL dominance
    "ソフトバンク": 1555, # Hawks - consistent powerhouse
    "広島": 1520,       # Carp - strong CL contender
    "DeNA": 1515,       # BayStars - rising power
    "巨人": 1510,       # Giants - traditional powerhouse
    "ロッテ": 1500,     # Marines - average baseline
    "西武": 1495,       # Lions - rebuilding
    "楽天": 1490,       # Eagles - rebuilding
    "日本ハム": 1485,   # Fighters - rebuilding with youth
    "ヤクルト": 1480,   # Swallows - post-championship decline
    "中日": 1475,       # Dragons - pitching-heavy, low offense
    # Alternate name mappings
    "Tigers": 1580,
    "Buffaloes": 1560,
    "Hawks": 1555,
    "Carp": 1520,
    "BayStars": 1515,
    "Giants": 1510,
    "Marines": 1500,
    "Lions": 1495,
    "Eagles": 1490,
    "Fighters": 1485,
    "Swallows": 1480,
    "Dragons": 1475,
}


def calculate_elo_win_prob(
    home_elo: float,
    away_elo: float,
    home_advantage: float = 35.0,
) -> Dict[str, Any]:
    """
    根據ELO評分計算勝率
    Calculate win probability based on ELO ratings.

    ELO Formula: P(A wins) = 1 / (1 + 10^((Rb - Ra) / 400))
    Home advantage adds 35 ELO points to home team by default.

    Args:
        home_elo: 主隊ELO評分
        away_elo: 客隊ELO評分
        home_advantage: 主場優勢ELO加成 (default 35.0)

    Returns:
        dict with:
            - home_win_prob: 主隊勝率
            - away_win_prob: 客隊勝率
            - elo_diff: ELO差距 (含主場加成)
    """
    notes: List[str] = []

    # Apply home advantage
    effective_home_elo = home_elo + home_advantage
    elo_diff = effective_home_elo - away_elo

    # ELO win probability formula
    home_win_prob = 1.0 / (1.0 + math.pow(10.0, -elo_diff / 400.0))
    away_win_prob = 1.0 - home_win_prob

    notes.append(
        f"主隊ELO: {home_elo:.0f} (+{home_advantage:.0f}主場優勢 = {effective_home_elo:.0f}) | "
        f"客隊ELO: {away_elo:.0f}"
    )
    notes.append(
        f"ELO差距: {elo_diff:+.0f} 分"
    )
    notes.append(
        f"ELO勝率預測: 主隊 {home_win_prob:.1%} vs 客隊 {away_win_prob:.1%}"
    )

    # Interpretation
    abs_diff = abs(elo_diff)
    if abs_diff >= 200:
        notes.append("ELO差距極大 — 強烈傾向一方獲勝")
    elif abs_diff >= 100:
        notes.append("ELO差距顯著 — 明顯強弱之分")
    elif abs_diff >= 50:
        notes.append("ELO差距適中 — 輕微優勢")
    else:
        notes.append("ELO差距微小 — 勢均力敵")

    return {
        "home_win_prob": round(home_win_prob, 4),
        "away_win_prob": round(away_win_prob, 4),
        "home_elo": home_elo,
        "away_elo": away_elo,
        "effective_home_elo": effective_home_elo,
        "elo_diff": round(elo_diff, 1),
        "home_advantage": home_advantage,
        "notes": notes,
    }


def update_elo(
    winner_elo: float,
    loser_elo: float,
    k: float = 20.0,
    home_advantage: float = 35.0,
    winner_is_home: bool = True,
) -> Tuple[float, float]:
    """
    更新ELO評分（比賽結束後）
    Update ELO ratings after a game result.

    Args:
        winner_elo: 獲勝方賽前ELO
        loser_elo: 落敗方賽前ELO
        k: K-factor (learning rate, default 20.0)
        home_advantage: 主場優勢ELO加成
        winner_is_home: 獲勝方是否為主隊

    Returns:
        Tuple of (new_winner_elo, new_loser_elo)
    """
    # Calculate expected win probability (winner's perspective)
    if winner_is_home:
        eff_winner = winner_elo + home_advantage
        eff_loser = loser_elo
    else:
        eff_winner = winner_elo
        eff_loser = loser_elo + home_advantage

    expected_win = 1.0 / (1.0 + math.pow(10.0, (eff_loser - eff_winner) / 400.0))
    expected_loss = 1.0 - expected_win

    # ELO update
    # Actual results: winner=1, loser=0
    new_winner_elo = winner_elo + k * (1.0 - expected_win)
    new_loser_elo = loser_elo + k * (0.0 - expected_loss)

    return round(new_winner_elo, 1), round(new_loser_elo, 1)


def get_team_elo(team_name: str, custom_elo: float = None) -> float:
    """
    取得球隊ELO評分
    Get team ELO rating from defaults or custom value.

    Args:
        team_name: 球隊名稱
        custom_elo: 自訂ELO值 (optional)

    Returns:
        ELO rating float
    """
    if custom_elo is not None:
        return custom_elo
    return NPB_ELO_DEFAULTS.get(team_name, 1500.0)
