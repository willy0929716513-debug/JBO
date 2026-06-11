"""
Game Models - NPB Game Data Structures
比賽資料模型
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional


@dataclass
class PitcherStats:
    """
    先發投手統計數據
    Starting Pitcher Statistics
    """
    # Core ERA metrics
    era: float                          # 自責分率 ERA
    whip: float                         # 每局被上壘率 WHIP
    fip: float                          # 防守獨立防禦率 FIP
    xera: float                         # 預期防禦率 xERA

    # Strikeout / Walk rates
    k9: float                           # 每9局三振數 K/9
    bb9: float                          # 每9局保送數 BB/9

    # Recent performance
    recent_5_games: List[float] = field(default_factory=list)  # 近5場ERA (list of ERA per game)

    # Split ERA data
    home_era: float = 0.0               # 主場ERA
    away_era: float = 0.0               # 客場ERA
    day_era: float = 0.0                # 日場ERA
    night_era: float = 0.0              # 夜場ERA

    # vs opponent
    vs_opponent_era: float = 0.0        # 對戰本場對手ERA
    vs_opponent_games: int = 0          # 對戰本場對手出賽次數

    # Pitch mix (dict: pitch_type -> usage_pct)
    pitch_mix: Dict[str, float] = field(default_factory=dict)

    # Platoon splits (OPS allowed)
    vs_lhb_ops: float = 0.700           # 對左打者OPS
    vs_rhb_ops: float = 0.700           # 對右打者OPS

    # Physical condition
    pitch_count_limit: int = 100        # 投球上限
    rest_days: int = 5                  # 休息天數 (中4日=4, 中5日=5, 中6日=6)

    # Handedness
    handedness: str = "R"               # 投球手: "L" or "R"


@dataclass
class BullpenStats:
    """
    牛棚統計數據
    Bullpen Statistics
    """
    era: float                          # 牛棚防禦率

    # Workload / Fatigue indicators
    last_7_days_ip: float = 0.0         # 過去7天投球局數
    last_3_days_ip: float = 0.0         # 過去3天投球局數
    consecutive_days: int = 0           # 連續出賽天數

    # Key reliever availability
    closer_available: bool = True       # 終結者是否可用
    setup_fatigued: bool = False        # 主要設置投手是否疲勞

    # Overall quality
    save_opportunities: int = 0         # 救援機會數
    blown_saves: int = 0                # 失救數
    holds: int = 0                      # 中繼成功數


@dataclass
class TeamStats:
    """
    球隊打擊與守備統計
    Team Batting and Defense Statistics
    """
    # Batting metrics
    ops: float                          # 整體OPS
    wrc_plus: float                     # wRC+ (加權得分創造率+)
    runs_scored_last_10: List[float] = field(default_factory=list)  # 近10場得分
    slg: float = 0.400                  # 長打率 SLG
    obp: float = 0.330                  # 上壘率 OBP

    # Platoon splits
    vs_lhp_ops: float = 0.700           # 對左投OPS
    vs_rhp_ops: float = 0.700           # 對右投OPS

    # Defense metrics
    fielding_pct: float = 0.980         # 守備率
    drs: float = 0.0                    # 防守奔跑節省 DRS
    uzr: float = 0.0                    # 終極守備率 UZR
    catcher_cs_pct: float = 0.30        # 捕手盜壘阻殺率
    error_rate: float = 0.02            # 失誤率

    # Records
    last_5_record: str = "3-2"          # 近5場戰績 (e.g., "3-2")
    last_10_record: str = "5-5"         # 近10場戰績
    last_20_record: str = "10-10"       # 近20場戰績

    # Trend indicators
    team_ops_trend: float = 0.0         # OPS趨勢 (正值=上升)
    team_era_trend: float = 0.0         # ERA趨勢 (負值=改善)


@dataclass
class GameInfo:
    """
    比賽基本資訊
    Game Information
    """
    # Teams
    home_team: str                      # 主場球隊
    away_team: str                      # 客場球隊

    # Venue
    stadium: str                        # 球場名稱

    # Time
    datetime: str                       # 比賽日期時間 (ISO format)
    is_day_game: bool = False           # 是否為日場

    # Park factors
    park_factor: float = 1.00           # 球場得分因子
    hr_factor: float = 1.00             # 球場全壘打因子
    scoring_factor: float = 1.00        # 球場整體得分因子
    turf_type: str = "natural"          # 草皮類型: "artificial" / "natural"

    # Weather
    temperature: float = 22.0          # 氣溫 (°C)
    humidity: float = 60.0             # 濕度 (%)
    rain_pct: float = 0.0              # 降雨機率 (%)
    wind_direction: str = "none"        # 風向 (outfield/infield/cross/none)
    wind_speed_kmh: float = 0.0         # 風速 (km/h)

    # Schedule / Fatigue
    is_travel_game: bool = False        # 是否為長途客場
    consecutive_away_games: int = 0     # 連續客場場數
    consecutive_games_played: int = 0   # 連續出賽場數
    days_since_last_game: int = 1       # 距上場天數 (0=連打)
