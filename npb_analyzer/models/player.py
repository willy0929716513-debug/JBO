"""
Player Models - NPB Player Data Structures
球員資料模型
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Player:
    """
    球員基本資料與近期表現
    Player Profile and Recent Performance
    """
    name: str                           # 球員姓名
    team: str                           # 所屬球隊
    position: str                       # 守備位置 (C/1B/2B/3B/SS/LF/CF/RF/DH/SP/RP)

    # Batting stats
    ops_last_10: float = 0.700          # 近10場OPS
    ops_season: float = 0.700           # 本季OPS

    # Health status
    injury_status: str = "active"       # 傷勢狀態: "active" / "day-to-day" / "IL"

    # Impact weighting
    importance_score: float = 5.0       # 重要性分數 (0-10, 10=核心球員)

    # Optional additional info
    batting_order: Optional[int] = None  # 打序 (1-9)
    batting_hand: str = "R"             # 打擊側: "L" / "R" / "S" (switch)
    age: Optional[int] = None           # 年齡


@dataclass
class InjuryImpact:
    """
    傷兵對球隊陣容的影響評估
    Injury Impact Assessment on Team Lineup
    """
    player: Player                      # 受傷球員

    # Impact scoring
    impact_score: float = 0.0           # 傷兵影響分數 (0-100, 100=最大負面影響)

    # Context
    replacement_player: Optional[str] = None   # 替補球員姓名
    replacement_ops: float = 0.600              # 替補球員OPS
    games_missed_estimated: int = 0             # 預計缺席場數
    notes: str = ""                             # 附加說明

    def calculate_impact(self) -> float:
        """
        計算傷兵影響分數
        Calculate the injury impact score based on player importance and status.
        """
        base_impact = self.player.importance_score * 10  # Convert 0-10 to 0-100

        status_multiplier = {
            "active": 0.0,
            "day-to-day": 0.5,
            "IL": 1.0,
        }.get(self.player.injury_status, 0.0)

        # OPS drop from replacement
        ops_drop = max(0.0, self.player.ops_season - self.replacement_ops)
        ops_impact = ops_drop * 50  # Scale OPS drop to impact points

        raw_impact = (base_impact * status_multiplier) + (ops_impact * status_multiplier)
        self.impact_score = min(100.0, raw_impact)
        return self.impact_score


def calculate_lineup_injury_impact(players: List[Player]) -> float:
    """
    計算整體陣容傷兵影響
    Calculate overall lineup injury impact from a list of players.

    Returns a score from 0-100 where higher means lineup is more hurt.
    """
    if not players:
        return 0.0

    total_impact = 0.0
    for player in players:
        if player.injury_status == "IL":
            # Full impact for IL players
            impact = player.importance_score * 10
        elif player.injury_status == "day-to-day":
            # Partial impact for day-to-day
            impact = player.importance_score * 5
        else:
            impact = 0.0
        total_impact += impact

    # Cap at 100
    return min(100.0, total_impact)
