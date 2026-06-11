"""
Weather Analyzer - Weather Condition Impact Analysis
天氣影響分析模組
"""

from typing import Dict, Any, List
from npb_analyzer.models.game import GameInfo


def analyze_weather(info: GameInfo) -> Dict[str, Any]:
    """
    分析天氣條件對比賽的影響
    Analyze weather condition impact on game scoring and pitching.

    Args:
        info: GameInfo dataclass with game information

    Returns:
        dict with:
            - hr_impact: 全壘打影響倍率 (multiplier)
            - run_impact: 得分影響倍率 (multiplier)
            - pitcher_impact: 對投手的影響 ("favorable"/"unfavorable"/"neutral")
            - notes: list of analysis notes
    """
    notes: List[str] = []
    hr_impact = 1.0   # Multiplier for HR probability
    run_impact = 1.0  # Multiplier for total runs

    # --- Temperature Impact ---
    temp = info.temperature
    if temp > 30:
        hr_impact += 0.05
        run_impact += 0.03
        notes.append(
            f"高溫 {temp:.0f}°C — 球飛得更遠，有利打者 (HR+5%, 得分+3%)"
        )
    elif temp > 25:
        hr_impact += 0.02
        run_impact += 0.01
        notes.append(f"溫暖 {temp:.0f}°C — 輕微利打者 (HR+2%, 得分+1%)")
    elif temp >= 15:
        notes.append(f"適宜溫度 {temp:.0f}°C — 氣溫對比賽影響中性")
    elif temp >= 10:
        hr_impact -= 0.03
        run_impact -= 0.02
        notes.append(
            f"偏涼 {temp:.0f}°C — 球飛行距離縮短，輕微利投手 (HR-3%, 得分-2%)"
        )
    else:
        hr_impact -= 0.05
        run_impact -= 0.03
        notes.append(
            f"寒冷 {temp:.0f}°C — 球速下降，利於投手 (HR-5%, 得分-3%)"
        )

    # --- Wind Impact ---
    wind_speed = info.wind_speed_kmh
    wind_dir = info.wind_direction.lower()

    if wind_speed > 20:
        if "outfield" in wind_dir or wind_dir == "out":
            hr_impact += 0.10
            run_impact += 0.05
            notes.append(
                f"強風吹向外野 {wind_speed:.0f} km/h — 全壘打大幅增加 (HR+10%, 得分+5%)"
            )
        elif "infield" in wind_dir or wind_dir == "in":
            hr_impact -= 0.10
            run_impact -= 0.04
            notes.append(
                f"強風吹向內野 {wind_speed:.0f} km/h — 壓制全壘打 (HR-10%, 得分-4%)"
            )
        elif "cross" in wind_dir:
            hr_impact -= 0.03
            notes.append(
                f"橫向強風 {wind_speed:.0f} km/h — 輕微影響飛球軌跡 (HR-3%)"
            )
        else:
            notes.append(
                f"風速 {wind_speed:.0f} km/h — 強風，但方向不明確"
            )
    elif wind_speed > 10:
        notes.append(f"微風 {wind_speed:.0f} km/h — 風力對比賽影響輕微")
    else:
        notes.append(f"無風/微風 {wind_speed:.0f} km/h — 標準比賽條件")

    # --- Rain Impact ---
    rain_pct = info.rain_pct
    if rain_pct > 50:
        run_impact -= 0.08
        pitcher_impact = "unfavorable"
        notes.append(
            f"降雨機率 {rain_pct:.0f}% — 高降雨風險，球滑影響投手握球，打擊節奏紊亂 (得分-8%)"
        )
    elif rain_pct > 30:
        run_impact -= 0.05
        pitcher_impact = "unfavorable"
        notes.append(
            f"降雨機率 {rain_pct:.0f}% — 有雨可能，投手控球受影響 (得分-5%)"
        )
    elif rain_pct > 15:
        pitcher_impact = "neutral"
        notes.append(f"降雨機率 {rain_pct:.0f}% — 少量降雨可能，影響輕微")
    else:
        pitcher_impact = "favorable"
        notes.append(f"降雨機率 {rain_pct:.0f}% — 天氣晴朗，有利投手控球")

    # --- Humidity Impact ---
    humidity = info.humidity
    if humidity > 80:
        hr_impact -= 0.02
        notes.append(
            f"高濕度 {humidity:.0f}% — 球體微軟，HR輕微受壓制 (HR-2%)"
        )
    elif humidity > 65:
        notes.append(f"濕度 {humidity:.0f}% — 濕度正常，影響輕微")
    else:
        notes.append(f"乾燥 {humidity:.0f}% — 低濕度，球體緊實")

    # --- Combined Assessment ---
    total_effect = (hr_impact - 1.0) + (run_impact - 1.0)
    if total_effect > 0.10:
        weather_summary = "整體天氣條件有利打者得分"
    elif total_effect < -0.10:
        weather_summary = "整體天氣條件有利投手主導比賽"
    else:
        weather_summary = "整體天氣條件對比賽影響中性"

    notes.append(f"天氣總評: {weather_summary}")

    # Adjust pitcher_impact based on overall conditions
    if pitcher_impact == "favorable" and total_effect > 0.08:
        pitcher_impact = "neutral"
    elif pitcher_impact == "neutral" and total_effect > 0.12:
        pitcher_impact = "unfavorable"

    return {
        "hr_impact": round(hr_impact, 3),
        "run_impact": round(run_impact, 3),
        "pitcher_impact": pitcher_impact,
        "temperature": temp,
        "humidity": humidity,
        "rain_pct": rain_pct,
        "wind_speed_kmh": wind_speed,
        "wind_direction": info.wind_direction,
        "weather_summary": weather_summary,
        "notes": notes,
    }
