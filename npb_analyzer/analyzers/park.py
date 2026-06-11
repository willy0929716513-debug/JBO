"""
Park Factor Analyzer - Stadium Park Factor Analysis
球場因子分析模組
"""

from typing import Dict, Any, List
from npb_analyzer.models.game import GameInfo


# NPB Stadium Park Factor Reference Data
# 日本職棒球場因子參考資料
NPB_PARK_FACTORS = {
    "東京ドーム": {
        "pf": 1.05, "hr_factor": 1.10, "type": "hitter_friendly",
        "name_en": "Tokyo Dome", "team": "巨人/Giants"
    },
    "甲子園": {
        "pf": 0.95, "hr_factor": 0.85, "type": "pitcher_friendly",
        "name_en": "Koshien Stadium", "team": "阪神/Tigers"
    },
    "ナゴヤドーム": {
        "pf": 0.93, "hr_factor": 0.80, "type": "pitcher_friendly",
        "name_en": "Nagoya Dome", "team": "中日/Dragons"
    },
    "バンテリンドームナゴヤ": {
        "pf": 0.93, "hr_factor": 0.80, "type": "pitcher_friendly",
        "name_en": "Vantelin Dome Nagoya", "team": "中日/Dragons"
    },
    "札幌ドーム": {
        "pf": 0.97, "hr_factor": 0.90, "type": "neutral",
        "name_en": "Sapporo Dome", "team": "日本ハム/Fighters"
    },
    "エスコンフィールドHOKKAIDO": {
        "pf": 1.01, "hr_factor": 1.05, "type": "neutral",
        "name_en": "ES CON Field Hokkaido", "team": "日本ハム/Fighters"
    },
    "ヤフオクドーム": {
        "pf": 1.02, "hr_factor": 1.05, "type": "neutral",
        "name_en": "PayPay Dome (Fukuoka)", "team": "ソフトバンク/Hawks"
    },
    "PayPayドーム": {
        "pf": 1.02, "hr_factor": 1.05, "type": "neutral",
        "name_en": "PayPay Dome (Fukuoka)", "team": "ソフトバンク/Hawks"
    },
    "マツダスタジアム": {
        "pf": 0.98, "hr_factor": 0.95, "type": "neutral",
        "name_en": "Mazda Stadium", "team": "広島/Carp"
    },
    "MAZDA Zoom-Zoom スタジアム広島": {
        "pf": 0.98, "hr_factor": 0.95, "type": "neutral",
        "name_en": "Mazda Zoom-Zoom Stadium Hiroshima", "team": "広島/Carp"
    },
    "QVCマリンフィールド": {
        "pf": 0.96, "hr_factor": 0.88, "type": "pitcher_friendly",
        "name_en": "ZoZo Marine Stadium", "team": "ロッテ/Marines"
    },
    "ZOZOマリン": {
        "pf": 0.96, "hr_factor": 0.88, "type": "pitcher_friendly",
        "name_en": "ZoZo Marine Stadium", "team": "ロッテ/Marines"
    },
    "ZOZOマリンスタジアム": {
        "pf": 0.96, "hr_factor": 0.88, "type": "pitcher_friendly",
        "name_en": "ZoZo Marine Stadium", "team": "ロッテ/Marines"
    },
    "ベルーナドーム": {
        "pf": 1.03, "hr_factor": 1.02, "type": "neutral",
        "name_en": "Belluna Dome", "team": "西武/Lions"
    },
    "横浜スタジアム": {
        "pf": 1.08, "hr_factor": 1.15, "type": "hitter_friendly",
        "name_en": "Yokohama Stadium", "team": "DeNA/BayStars"
    },
    "ハマスタ": {
        "pf": 1.08, "hr_factor": 1.15, "type": "hitter_friendly",
        "name_en": "Yokohama Stadium", "team": "DeNA/BayStars"
    },
    "神宮球場": {
        "pf": 1.06, "hr_factor": 1.12, "type": "hitter_friendly",
        "name_en": "Jingu Stadium", "team": "ヤクルト/Swallows"
    },
    "明治神宮野球場": {
        "pf": 1.06, "hr_factor": 1.12, "type": "hitter_friendly",
        "name_en": "Meiji Jingu Stadium", "team": "ヤクルト/Swallows"
    },
    "楽天生命パーク宮城": {
        "pf": 1.00, "hr_factor": 0.98, "type": "neutral",
        "name_en": "Rakuten Life Park Miyagi", "team": "楽天/Eagles"
    },
    "京セラドーム大阪": {
        "pf": 0.98, "hr_factor": 0.92, "type": "neutral",
        "name_en": "Kyocera Dome Osaka", "team": "オリックス/Buffaloes"
    },
}


def analyze_park(info: GameInfo) -> Dict[str, Any]:
    """
    分析球場因子對比賽的影響
    Analyze park factor impact on the game.

    Args:
        info: GameInfo dataclass with game information

    Returns:
        dict with:
            - park_type: 球場類型 ("pitcher_friendly"/"hitter_friendly"/"neutral")
            - run_adjustment: 得分調整倍率
            - hr_adjustment: 全壘打調整倍率
            - notes: list of analysis notes
    """
    notes: List[str] = []

    # Look up stadium in our reference data
    stadium = info.stadium
    park_data = None

    # Try exact match first
    if stadium in NPB_PARK_FACTORS:
        park_data = NPB_PARK_FACTORS[stadium]
    else:
        # Try partial match
        for key, data in NPB_PARK_FACTORS.items():
            if key in stadium or stadium in key:
                park_data = data
                break

    # Use GameInfo park factor if provided, otherwise use lookup
    if park_data:
        pf = info.park_factor if info.park_factor != 1.00 else park_data["pf"]
        hr_factor = info.hr_factor if info.hr_factor != 1.00 else park_data["hr_factor"]
        park_type = park_data["type"]
        name_en = park_data.get("name_en", stadium)
        notes.append(f"球場: {stadium} ({name_en})")
    else:
        # Fallback to GameInfo values
        pf = info.park_factor
        hr_factor = info.hr_factor
        name_en = stadium

        # Determine type from factors
        if pf >= 1.04:
            park_type = "hitter_friendly"
        elif pf <= 0.96:
            park_type = "pitcher_friendly"
        else:
            park_type = "neutral"

        notes.append(f"球場: {stadium} (資料庫未收錄，使用提供因子)")

    # --- Park Type Analysis ---
    if park_type == "hitter_friendly":
        run_adjustment = pf
        notes.append(
            f"打者球場 (Hitter-Friendly) — 球場因子 {pf:.2f}, 全壘打因子 {hr_factor:.2f}"
        )
        notes.append(f"建議: 偏向大分下注，全壘打率提高 {(hr_factor-1)*100:.0f}%")
    elif park_type == "pitcher_friendly":
        run_adjustment = pf
        notes.append(
            f"投手球場 (Pitcher-Friendly) — 球場因子 {pf:.2f}, 全壘打因子 {hr_factor:.2f}"
        )
        notes.append(f"建議: 偏向小分下注，全壘打受抑制 {(1-hr_factor)*100:.0f}%")
    else:
        run_adjustment = pf
        notes.append(
            f"中性球場 (Neutral Park) — 球場因子 {pf:.2f}, 全壘打因子 {hr_factor:.2f}"
        )

    # --- Turf Type Impact ---
    if info.turf_type == "artificial":
        notes.append("人工草皮 (Artificial Turf) — 速度優先，有利快速進攻")
        # Artificial turf slightly increases scoring
        run_adjustment *= 1.02
    else:
        notes.append("天然草皮 (Natural Turf) — 標準比賽環境")

    # --- Day/Night Game Impact ---
    if info.is_day_game:
        notes.append("日場 (Day Game) — 視線與打擊挑戰較高")
    else:
        notes.append("夜場 (Night Game) — 標準夜間比賽環境")

    return {
        "park_type": park_type,
        "park_factor": pf,
        "hr_factor": hr_factor,
        "run_adjustment": round(run_adjustment, 3),
        "hr_adjustment": round(hr_factor, 3),
        "stadium": stadium,
        "stadium_en": name_en,
        "turf_type": info.turf_type,
        "is_day_game": info.is_day_game,
        "notes": notes,
    }
