'use strict';

// ─── Park Factor Database ───────────────────────────────────────────────────
const PARK_FACTORS = {
  '東京ドーム':     { pf: 1.05, hr_factor: 1.10, type: 'hitter_friendly',  name_en: 'Tokyo Dome' },
  '甲子園':         { pf: 0.95, hr_factor: 0.85, type: 'pitcher_friendly', name_en: 'Koshien Stadium' },
  'ナゴヤドーム':   { pf: 0.93, hr_factor: 0.80, type: 'pitcher_friendly', name_en: 'Nagoya Dome' },
  'バンテリンドームナゴヤ': { pf: 0.93, hr_factor: 0.80, type: 'pitcher_friendly', name_en: 'Vantelin Dome Nagoya' },
  '札幌ドーム':     { pf: 0.97, hr_factor: 0.90, type: 'neutral',          name_en: 'Sapporo Dome' },
  'エスコンフィールドHOKKAIDO': { pf: 1.01, hr_factor: 1.05, type: 'neutral', name_en: 'ES CON Field Hokkaido' },
  'PayPayドーム':   { pf: 1.02, hr_factor: 1.05, type: 'neutral',          name_en: 'PayPay Dome' },
  'ヤフオクドーム': { pf: 1.02, hr_factor: 1.05, type: 'neutral',          name_en: 'PayPay Dome (Fukuoka)' },
  'マツダスタジアム': { pf: 0.98, hr_factor: 0.95, type: 'neutral',        name_en: 'Mazda Stadium' },
  'ZOZOマリン':     { pf: 0.96, hr_factor: 0.88, type: 'pitcher_friendly', name_en: 'ZoZo Marine Stadium' },
  'ZOZOマリンスタジアム': { pf: 0.96, hr_factor: 0.88, type: 'pitcher_friendly', name_en: 'ZoZo Marine Stadium' },
  'QVCマリンフィールド': { pf: 0.96, hr_factor: 0.88, type: 'pitcher_friendly', name_en: 'ZoZo Marine Stadium' },
  'ベルーナドーム':  { pf: 1.03, hr_factor: 1.02, type: 'neutral',         name_en: 'Belluna Dome' },
  '横浜スタジアム': { pf: 1.08, hr_factor: 1.15, type: 'hitter_friendly',  name_en: 'Yokohama Stadium' },
  'ハマスタ':       { pf: 1.08, hr_factor: 1.15, type: 'hitter_friendly',  name_en: 'Yokohama Stadium' },
  '神宮球場':       { pf: 1.06, hr_factor: 1.12, type: 'hitter_friendly',  name_en: 'Jingu Stadium' },
  '明治神宮野球場': { pf: 1.06, hr_factor: 1.12, type: 'hitter_friendly',  name_en: 'Meiji Jingu Stadium' },
  '楽天生命パーク宮城': { pf: 1.00, hr_factor: 0.98, type: 'neutral',      name_en: 'Rakuten Life Park Miyagi' },
  '京セラドーム大阪': { pf: 0.98, hr_factor: 0.92, type: 'neutral',        name_en: 'Kyocera Dome Osaka' },
};

// ─── Analyze Pitcher ────────────────────────────────────────────────────────
function analyzePitcher(stats) {
  const notes = [];
  let score = 50.0;

  // ERA Scoring
  const era = stats.era || 4.50;
  if (era < 2.50) {
    score = 92.0;
    notes.push(`ERA ${era.toFixed(2)} — 頂級先發 (Elite Starter)`);
  } else if (era < 3.50) {
    score = 82.0;
    notes.push(`ERA ${era.toFixed(2)} — 優秀先發 (Above Average)`);
  } else if (era < 4.50) {
    score = 65.0;
    notes.push(`ERA ${era.toFixed(2)} — 中等先發 (Average Starter)`);
  } else if (era < 5.50) {
    score = 45.0;
    notes.push(`ERA ${era.toFixed(2)} — 偏弱先發 (Below Average)`);
  } else {
    score = 28.0;
    notes.push(`ERA ${era.toFixed(2)} — 高危先發 (High Risk Starter)`);
  }

  // WHIP Adjustment
  const whip = stats.whip || 1.30;
  if (whip < 1.00) {
    score += 10;
    notes.push(`WHIP ${whip.toFixed(2)} — 極低上壘率，優異控制 (+10)`);
  } else if (whip < 1.20) {
    score += 5;
    notes.push(`WHIP ${whip.toFixed(2)} — 良好控制 (+5)`);
  } else if (whip < 1.40) {
    notes.push(`WHIP ${whip.toFixed(2)} — 控制普通 (±0)`);
  } else {
    score -= 5;
    notes.push(`WHIP ${whip.toFixed(2)} — 控制偏差 (-5)`);
  }

  // FIP vs ERA Spread
  const fip = stats.fip || era;
  const eraFipDiff = fip - era;
  if (eraFipDiff < -0.50) {
    score -= 5;
    notes.push(`FIP ${fip.toFixed(2)} 遠高於 ERA ${era.toFixed(2)} (差距 ${Math.abs(eraFipDiff).toFixed(2)}) — 投手可能受益於運氣/守備，存在回歸風險 (-5)`);
  } else if (eraFipDiff > 0.50) {
    score += 3;
    notes.push(`ERA ${era.toFixed(2)} 高於 FIP ${fip.toFixed(2)} (差距 ${eraFipDiff.toFixed(2)}) — 投手受運氣不佳影響，實際表現較佳 (+3)`);
  } else {
    notes.push(`FIP ${fip.toFixed(2)} 與 ERA 接近 — 表現穩定`);
  }

  // Recent 5 Games Trend
  const recent5 = stats.recent_5_games || [];
  if (recent5.length >= 3) {
    const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
    const half = Math.floor(recent5.length / 2);
    if (half > 0) {
      const earlyAvg = recent5.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const lateAvg = recent5.slice(half).reduce((a, b) => a + b, 0) / (recent5.length - half);
      if (lateAvg < earlyAvg - 0.50) {
        score += 5;
        notes.push(`近期ERA趨勢改善: ${earlyAvg.toFixed(2)} → ${lateAvg.toFixed(2)} — 狀態上升中 (+5)`);
      } else if (lateAvg > earlyAvg + 0.50) {
        score -= 3;
        notes.push(`近期ERA趨勢惡化: ${earlyAvg.toFixed(2)} → ${lateAvg.toFixed(2)} — 狀態下滑中 (-3)`);
      } else {
        notes.push(`近5場平均ERA: ${recentAvg.toFixed(2)} — 狀態穩定`);
      }
    }
  }

  // Rest Days Adjustment
  const rest = stats.rest_days || 5;
  if (rest <= 4) {
    score -= 5;
    notes.push(`休息${rest}天 (中${rest - 1}日) — 短休息，可能體力下降 (-5)`);
  } else if (rest === 5) {
    notes.push(`休息${rest}天 (中${rest - 1}日) — 標準輪換，狀態正常 (±0)`);
  } else {
    score += 5;
    notes.push(`休息${rest}天 (中${rest - 1}日) — 充分休息，狀態佳 (+5)`);
  }

  // vs Opponent ERA
  const vsOppGames = stats.vs_opponent_games || 0;
  const vsOppEra = stats.vs_opponent_era || 0;
  if (vsOppGames >= 3 && vsOppEra > 0) {
    if (vsOppEra < era - 0.30) {
      score += 5;
      notes.push(`對戰本隊ERA ${vsOppEra.toFixed(2)} 優於本季ERA ${era.toFixed(2)} — 對陣相性佳 (+5)`);
    } else if (vsOppEra > era + 0.50) {
      score -= 5;
      notes.push(`對戰本隊ERA ${vsOppEra.toFixed(2)} 劣於本季ERA ${era.toFixed(2)} — 對陣相性差 (-5)`);
    } else {
      notes.push(`對戰本隊ERA ${vsOppEra.toFixed(2)} — 表現接近本季水準`);
    }
  }

  // K/9 and BB/9
  const k9 = stats.k9 || 7.0;
  const bb9 = stats.bb9 || 3.0;
  if (k9 > 9.0) {
    score += 3;
    notes.push(`K/9 ${k9.toFixed(1)} — 高三振率，壓制力強 (+3)`);
  } else if (k9 < 6.0) {
    score -= 2;
    notes.push(`K/9 ${k9.toFixed(1)} — 三振率偏低 (-2)`);
  }

  if (bb9 > 4.0) {
    score -= 3;
    notes.push(`BB/9 ${bb9.toFixed(1)} — 控球問題，保送率偏高 (-3)`);
  } else if (bb9 < 2.5) {
    score += 3;
    notes.push(`BB/9 ${bb9.toFixed(1)} — 控球精準 (+3)`);
  }

  score = Math.max(0, Math.min(100, score));

  let advantageText;
  if (score >= 80) advantageText = '強力優勢 (Strong Advantage)';
  else if (score >= 65) advantageText = '輕微優勢 (Slight Advantage)';
  else if (score >= 45) advantageText = '均勢 (Even)';
  else if (score >= 30) advantageText = '輕微劣勢 (Slight Disadvantage)';
  else advantageText = '明顯劣勢 (Clear Disadvantage)';

  return {
    score: Math.round(score * 10) / 10,
    advantage_text: advantageText,
    era, whip, fip, k9, bb9,
    rest_days: rest,
    notes,
  };
}

// ─── Analyze Bullpen ────────────────────────────────────────────────────────
function analyzeBullpen(stats) {
  const notes = [];
  let score = 50.0;
  let fatigueLevel = 0.0;

  // ERA Rating
  const era = stats.era || 4.00;
  let eraRating;
  if (era < 3.00) {
    eraRating = 'strong';
    score += 20;
    notes.push(`牛棚ERA ${era.toFixed(2)} — 強力牛棚 (Strong Bullpen) (+20)`);
  } else if (era < 4.00) {
    eraRating = 'average';
    notes.push(`牛棚ERA ${era.toFixed(2)} — 普通牛棚 (Average Bullpen) (±0)`);
  } else {
    eraRating = 'weak';
    score -= 20;
    notes.push(`牛棚ERA ${era.toFixed(2)} — 薄弱牛棚 (Weak Bullpen) (-20)`);
  }

  // Last 3 days workload
  const last3 = stats.last_3_days_ip || 0;
  if (last3 > 5.0) {
    fatigueLevel += 35;
    score -= 15;
    notes.push(`近3天投球局數 ${last3.toFixed(1)} 局 — 高負荷，嚴重疲勞 (-15)`);
  } else if (last3 > 3.0) {
    fatigueLevel += 20;
    score -= 8;
    notes.push(`近3天投球局數 ${last3.toFixed(1)} 局 — 中等負荷，有疲勞跡象 (-8)`);
  } else {
    notes.push(`近3天投球局數 ${last3.toFixed(1)} 局 — 負荷正常`);
  }

  // Last 7 days workload
  const last7 = stats.last_7_days_ip || 0;
  if (last7 > 12.0) {
    fatigueLevel += 25;
    score -= 10;
    notes.push(`近7天投球局數 ${last7.toFixed(1)} 局 — 週累積過高，需謹慎 (-10)`);
  } else if (last7 > 8.0) {
    fatigueLevel += 12;
    score -= 5;
    notes.push(`近7天投球局數 ${last7.toFixed(1)} 局 — 週累積偏高 (-5)`);
  } else {
    notes.push(`近7天投球局數 ${last7.toFixed(1)} 局 — 週累積正常`);
  }

  // Consecutive days
  const consecDays = stats.consecutive_days || 0;
  if (consecDays >= 3) {
    fatigueLevel += 20;
    score -= 8;
    notes.push(`連續出賽 ${consecDays} 天 — 高頻使用，疲勞累積 (-8)`);
  } else if (consecDays === 2) {
    fatigueLevel += 10;
    score -= 4;
    notes.push(`連續出賽 ${consecDays} 天 — 輕微疲勞 (-4)`);
  }

  // Closer availability
  if (!stats.closer_available) {
    score -= 15;
    fatigueLevel += 15;
    notes.push('終結者不可用 (Closer Unavailable) — 重大劣勢 (-15)');
  } else {
    notes.push('終結者可用 (Closer Available) ✓');
  }

  if (stats.setup_fatigued) {
    score -= 10;
    fatigueLevel += 10;
    notes.push('主要中繼投手疲勞 (Setup Reliever Fatigued) — 中段防守風險 (-10)');
  } else {
    notes.push('中繼投手狀態正常 (Setup Relievers Fresh) ✓');
  }

  // Blown saves
  const saveOpps = stats.save_opportunities || 0;
  const blownSaves = stats.blown_saves || 0;
  if (saveOpps > 0) {
    const blownRate = blownSaves / saveOpps;
    if (blownRate > 0.25) {
      score -= 8;
      notes.push(`救援失敗率 ${(blownRate * 100).toFixed(1)}% (${blownSaves}/${saveOpps}) — 終結能力堪憂 (-8)`);
    } else if (blownRate < 0.10) {
      score += 5;
      notes.push(`救援成功率高 ${((1 - blownRate) * 100).toFixed(1)}% — 終結能力穩定 (+5)`);
    }
  }

  score = Math.max(0, Math.min(100, score));
  fatigueLevel = Math.max(0, Math.min(100, fatigueLevel));

  let eraLabel;
  if (score >= 65) eraLabel = '強力優勢 (Strong)';
  else if (score >= 45) eraLabel = '均勢 (Even)';
  else eraLabel = '明顯劣勢 (Weak)';

  return {
    score: Math.round(score * 10) / 10,
    era_rating: eraRating,
    era,
    fatigue_level: Math.round(fatigueLevel * 10) / 10,
    era_label: eraLabel,
    closer_available: stats.closer_available,
    setup_fatigued: stats.setup_fatigued,
    last_3_days_ip: last3,
    last_7_days_ip: last7,
    notes,
  };
}

// ─── Analyze Lineup ─────────────────────────────────────────────────────────
function analyzeLineup(stats, opposingPitcher) {
  const notes = [];
  let score = 50.0;

  // wRC+ Scoring
  const wrc = stats.wrc_plus || 100;
  if (wrc > 110) {
    score = 82.0;
    notes.push(`wRC+ ${wrc.toFixed(0)} — 強力打線 (Strong Lineup, Elite Offense)`);
  } else if (wrc >= 90) {
    score = 65.0;
    notes.push(`wRC+ ${wrc.toFixed(0)} — 普通打線 (Average Lineup)`);
  } else {
    score = 42.0;
    notes.push(`wRC+ ${wrc.toFixed(0)} — 薄弱打線 (Weak Lineup)`);
  }

  // Handedness Matchup
  const pitcherHand = (opposingPitcher && opposingPitcher.handedness) || 'R';
  let relevantOps, matchupLabel, pitcherLabel;
  if (pitcherHand === 'L') {
    relevantOps = stats.vs_lhp_ops || stats.ops || 0.720;
    matchupLabel = '對左投OPS';
    pitcherLabel = '左投 (LHP)';
  } else {
    relevantOps = stats.vs_rhp_ops || stats.ops || 0.720;
    matchupLabel = '對右投OPS';
    pitcherLabel = '右投 (RHP)';
  }

  if (relevantOps > 0.780) {
    score += 10;
    notes.push(`${matchupLabel} ${relevantOps.toFixed(3)} vs ${pitcherLabel} — 打線相性優勢 (+10)`);
  } else if (relevantOps > 0.700) {
    notes.push(`${matchupLabel} ${relevantOps.toFixed(3)} vs ${pitcherLabel} — 打線相性一般 (±0)`);
  } else {
    score -= 8;
    notes.push(`${matchupLabel} ${relevantOps.toFixed(3)} vs ${pitcherLabel} — 打線相性劣勢 (-8)`);
  }

  // Overall OPS
  const ops = stats.ops || 0.720;
  if (ops > 0.800) {
    score += 8;
    notes.push(`整體OPS ${ops.toFixed(3)} — 強攻擊力 (+8)`);
  } else if (ops > 0.720) {
    notes.push(`整體OPS ${ops.toFixed(3)} — 攻擊力普通 (±0)`);
  } else {
    score -= 5;
    notes.push(`整體OPS ${ops.toFixed(3)} — 攻擊力偏弱 (-5)`);
  }

  // Recent 10-Game Scoring Trend
  const runs10 = stats.runs_scored_last_10 || [];
  let avgRuns = 4.0;
  if (runs10.length >= 5) {
    avgRuns = runs10.reduce((a, b) => a + b, 0) / runs10.length;
    const half = Math.floor(runs10.length / 2);
    const earlyAvg = runs10.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const lateAvg = runs10.slice(half).reduce((a, b) => a + b, 0) / (runs10.length - half);

    if (lateAvg > earlyAvg + 0.5) {
      score += 6;
      notes.push(`近10場得分趨勢上升: ${earlyAvg.toFixed(1)} → ${lateAvg.toFixed(1)} 分/場 — 打線火熱 (+6)`);
    } else if (lateAvg < earlyAvg - 0.5) {
      score -= 4;
      notes.push(`近10場得分趨勢下滑: ${earlyAvg.toFixed(1)} → ${lateAvg.toFixed(1)} 分/場 — 打線冷卻 (-4)`);
    } else {
      notes.push(`近10場平均得分: ${avgRuns.toFixed(1)} 分/場 — 得分穩定`);
    }

    if (avgRuns >= 5.0) {
      score += 5;
      notes.push(`近10場場均 ${avgRuns.toFixed(1)} 分 — 高產打線 (+5)`);
    } else if (avgRuns < 3.0) {
      score -= 5;
      notes.push(`近10場場均 ${avgRuns.toFixed(1)} 分 — 低迷得分能力 (-5)`);
    }
  }

  // Opposing Pitcher Vulnerability
  const oppEra = (opposingPitcher && opposingPitcher.era) || 4.00;
  if (oppEra > 5.0) {
    score += 8;
    notes.push(`對方先發ERA ${oppEra.toFixed(2)} — 可攻性高 (+8)`);
  } else if (oppEra > 4.0) {
    score += 4;
    notes.push(`對方先發ERA ${oppEra.toFixed(2)} — 有攻擊機會 (+4)`);
  } else if (oppEra < 2.50) {
    score -= 8;
    notes.push(`對方先發ERA ${oppEra.toFixed(2)} — 對方投手強力，得分困難 (-8)`);
  } else if (oppEra < 3.50) {
    score -= 4;
    notes.push(`對方先發ERA ${oppEra.toFixed(2)} — 對方投手穩定，得分受限 (-4)`);
  }

  // OPS Trend
  const opsTrend = stats.team_ops_trend || 0;
  if (opsTrend > 0.020) {
    score += 4;
    notes.push(`OPS上升趨勢 +${opsTrend.toFixed(3)} — 打線狀態改善中 (+4)`);
  } else if (opsTrend < -0.020) {
    score -= 4;
    notes.push(`OPS下滑趨勢 ${opsTrend.toFixed(3)} — 打線狀態下滑 (-4)`);
  }

  score = Math.max(0, Math.min(100, score));

  // Run Expectancy
  const baseRuns = 4.2;
  const wrcFactor = wrc / 100.0;
  const opsFactor = relevantOps / 0.720;
  const eraFactor = Math.max(0.5, Math.min(1.5, 4.5 / Math.max(oppEra, 1.0)));
  let runExpectancy = baseRuns * wrcFactor * 0.5 + baseRuns * opsFactor * 0.3 + baseRuns * eraFactor * 0.2;
  runExpectancy = Math.max(1.0, Math.min(10.0, runExpectancy));

  return {
    score: Math.round(score * 10) / 10,
    run_expectancy: Math.round(runExpectancy * 100) / 100,
    wrc_plus: wrc,
    ops,
    vs_pitcher_ops: relevantOps,
    pitcher_hand: pitcherHand,
    notes,
  };
}

// ─── Analyze Defense ────────────────────────────────────────────────────────
function analyzeDefense(stats) {
  const notes = [];
  let score = 50.0;

  // Fielding Percentage
  const fp = stats.fielding_pct || 0.980;
  if (fp >= 0.990) {
    score += 15;
    notes.push(`守備率 ${fp.toFixed(3)} — 精準守備，失誤率極低 (+15)`);
  } else if (fp >= 0.983) {
    score += 8;
    notes.push(`守備率 ${fp.toFixed(3)} — 守備穩健 (+8)`);
  } else if (fp >= 0.975) {
    notes.push(`守備率 ${fp.toFixed(3)} — 守備普通 (±0)`);
  } else {
    score -= 10;
    notes.push(`守備率 ${fp.toFixed(3)} — 守備偏差，失誤風險高 (-10)`);
  }

  // DRS
  const drs = stats.drs || 0;
  if (drs > 10) {
    score += 12;
    notes.push(`DRS +${drs.toFixed(0)} — 精英守備，大幅節省失分 (+12)`);
  } else if (drs > 0) {
    score += 5;
    notes.push(`DRS +${drs.toFixed(0)} — 守備優於平均 (+5)`);
  } else if (drs >= -5) {
    notes.push(`DRS ${drs.toFixed(0)} — 守備接近平均 (±0)`);
  } else if (drs >= -15) {
    score -= 8;
    notes.push(`DRS ${drs.toFixed(0)} — 守備低於平均 (-8)`);
  } else {
    score -= 15;
    notes.push(`DRS ${drs.toFixed(0)} — 守備薄弱，失分風險高 (-15)`);
  }

  // UZR
  const uzr = stats.uzr || 0;
  if (uzr > 5.0) {
    score += 8;
    notes.push(`UZR +${uzr.toFixed(1)} — 守備範圍優異 (+8)`);
  } else if (uzr > 0) {
    score += 3;
    notes.push(`UZR +${uzr.toFixed(1)} — 守備範圍良好 (+3)`);
  } else if (uzr >= -5.0) {
    notes.push(`UZR ${uzr.toFixed(1)} — 守備範圍普通 (±0)`);
  } else {
    score -= 8;
    notes.push(`UZR ${uzr.toFixed(1)} — 守備範圍偏差 (-8)`);
  }

  // Catcher CS%
  const csPct = stats.catcher_cs_pct || 0.28;
  if (csPct >= 0.35) {
    score += 6;
    notes.push(`捕手阻殺率 ${(csPct * 100).toFixed(1)}% — 強力阻殺，壓制盜壘 (+6)`);
  } else if (csPct >= 0.28) {
    notes.push(`捕手阻殺率 ${(csPct * 100).toFixed(1)}% — 阻殺率普通 (±0)`);
  } else {
    score -= 5;
    notes.push(`捕手阻殺率 ${(csPct * 100).toFixed(1)}% — 盜壘防守偏弱 (-5)`);
  }

  // Error Rate
  const errorRate = stats.error_rate || 0.020;
  if (errorRate < 0.015) {
    score += 5;
    notes.push(`失誤率 ${errorRate.toFixed(3)} — 極低失誤 (+5)`);
  } else if (errorRate < 0.025) {
    notes.push(`失誤率 ${errorRate.toFixed(3)} — 失誤率正常 (±0)`);
  } else {
    score -= 8;
    notes.push(`失誤率 ${errorRate.toFixed(3)} — 失誤率偏高 (-8)`);
  }

  score = Math.max(0, Math.min(100, score));

  let advantageText;
  if (score >= 65) advantageText = '守備優勢 (Defensive Advantage)';
  else if (score >= 40) advantageText = '守備均勢 (Defensive Even)';
  else advantageText = '守備劣勢 (Defensive Disadvantage)';

  return {
    score: Math.round(score * 10) / 10,
    advantage_text: advantageText,
    fielding_pct: fp,
    drs,
    uzr,
    catcher_cs_pct: csPct,
    error_rate: errorRate,
    notes,
  };
}

// ─── Analyze Park ───────────────────────────────────────────────────────────
function analyzePark(info) {
  const notes = [];
  const stadium = info.stadium || '';

  // Find park data
  let parkData = PARK_FACTORS[stadium];
  if (!parkData) {
    for (const [key, data] of Object.entries(PARK_FACTORS)) {
      if (key.includes(stadium) || stadium.includes(key)) {
        parkData = data;
        break;
      }
    }
  }

  let pf, hrFactor, parkType, nameEn;
  if (parkData) {
    pf = (info.park_factor && info.park_factor !== 1.00) ? info.park_factor : parkData.pf;
    hrFactor = (info.hr_factor && info.hr_factor !== 1.00) ? info.hr_factor : parkData.hr_factor;
    parkType = parkData.type;
    nameEn = parkData.name_en;
    notes.push(`球場: ${stadium} (${nameEn})`);
  } else {
    pf = info.park_factor || 1.00;
    hrFactor = info.hr_factor || 1.00;
    if (pf >= 1.04) parkType = 'hitter_friendly';
    else if (pf <= 0.96) parkType = 'pitcher_friendly';
    else parkType = 'neutral';
    nameEn = stadium;
    notes.push(`球場: ${stadium} (資料庫未收錄，使用提供因子)`);
  }

  let runAdj = pf;
  if (parkType === 'hitter_friendly') {
    notes.push(`打者球場 (Hitter-Friendly) — 球場因子 ${pf.toFixed(2)}, 全壘打因子 ${hrFactor.toFixed(2)}`);
    notes.push(`建議: 偏向大分下注，全壘打率提高 ${((hrFactor - 1) * 100).toFixed(0)}%`);
  } else if (parkType === 'pitcher_friendly') {
    notes.push(`投手球場 (Pitcher-Friendly) — 球場因子 ${pf.toFixed(2)}, 全壘打因子 ${hrFactor.toFixed(2)}`);
    notes.push(`建議: 偏向小分下注，全壘打受抑制 ${((1 - hrFactor) * 100).toFixed(0)}%`);
  } else {
    notes.push(`中性球場 (Neutral Park) — 球場因子 ${pf.toFixed(2)}, 全壘打因子 ${hrFactor.toFixed(2)}`);
  }

  if (info.turf_type === 'artificial') {
    notes.push('人工草皮 (Artificial Turf) — 速度優先，有利快速進攻');
    runAdj *= 1.02;
  } else {
    notes.push('天然草皮 (Natural Turf) — 標準比賽環境');
  }

  if (info.is_day_game) {
    notes.push('日場 (Day Game) — 視線與打擊挑戰較高');
  } else {
    notes.push('夜場 (Night Game) — 標準夜間比賽環境');
  }

  return {
    park_type: parkType,
    park_factor: pf,
    hr_factor: hrFactor,
    run_adjustment: Math.round(runAdj * 1000) / 1000,
    hr_adjustment: Math.round(hrFactor * 1000) / 1000,
    stadium,
    stadium_en: nameEn,
    turf_type: info.turf_type,
    is_day_game: info.is_day_game,
    notes,
  };
}

// ─── Analyze Weather ────────────────────────────────────────────────────────
function analyzeWeather(info) {
  const notes = [];
  let hrImpact = 1.0;
  let runImpact = 1.0;
  let pitcherImpact = 'favorable';

  // Temperature Impact
  const temp = info.temperature || 20;
  if (temp > 30) {
    hrImpact += 0.05;
    runImpact += 0.03;
    notes.push(`高溫 ${temp.toFixed(0)}°C — 球飛得更遠，有利打者 (HR+5%, 得分+3%)`);
  } else if (temp > 25) {
    hrImpact += 0.02;
    runImpact += 0.01;
    notes.push(`溫暖 ${temp.toFixed(0)}°C — 輕微利打者 (HR+2%, 得分+1%)`);
  } else if (temp >= 15) {
    notes.push(`適宜溫度 ${temp.toFixed(0)}°C — 氣溫對比賽影響中性`);
  } else if (temp >= 10) {
    hrImpact -= 0.03;
    runImpact -= 0.02;
    notes.push(`偏涼 ${temp.toFixed(0)}°C — 球飛行距離縮短，輕微利投手 (HR-3%, 得分-2%)`);
  } else {
    hrImpact -= 0.05;
    runImpact -= 0.03;
    notes.push(`寒冷 ${temp.toFixed(0)}°C — 球速下降，利於投手 (HR-5%, 得分-3%)`);
  }

  // Wind Impact
  const windSpeed = info.wind_speed_kmh || 0;
  const windDir = (info.wind_direction || 'none').toLowerCase();
  if (windSpeed > 20) {
    if (windDir.includes('outfield') || windDir === 'out') {
      hrImpact += 0.10;
      runImpact += 0.05;
      notes.push(`強風吹向外野 ${windSpeed.toFixed(0)} km/h — 全壘打大幅增加 (HR+10%, 得分+5%)`);
    } else if (windDir.includes('infield') || windDir === 'in') {
      hrImpact -= 0.10;
      runImpact -= 0.04;
      notes.push(`強風吹向內野 ${windSpeed.toFixed(0)} km/h — 壓制全壘打 (HR-10%, 得分-4%)`);
    } else if (windDir.includes('cross')) {
      hrImpact -= 0.03;
      notes.push(`橫向強風 ${windSpeed.toFixed(0)} km/h — 輕微影響飛球軌跡 (HR-3%)`);
    } else {
      notes.push(`風速 ${windSpeed.toFixed(0)} km/h — 強風，但方向不明確`);
    }
  } else if (windSpeed > 10) {
    notes.push(`微風 ${windSpeed.toFixed(0)} km/h — 風力對比賽影響輕微`);
  } else {
    notes.push(`無風/微風 ${windSpeed.toFixed(0)} km/h — 標準比賽條件`);
  }

  // Rain Impact
  const rainPct = info.rain_pct || 0;
  if (rainPct > 50) {
    runImpact -= 0.08;
    pitcherImpact = 'unfavorable';
    notes.push(`降雨機率 ${rainPct.toFixed(0)}% — 高降雨風險，球滑影響投手握球，打擊節奏紊亂 (得分-8%)`);
  } else if (rainPct > 30) {
    runImpact -= 0.05;
    pitcherImpact = 'unfavorable';
    notes.push(`降雨機率 ${rainPct.toFixed(0)}% — 有雨可能，投手控球受影響 (得分-5%)`);
  } else if (rainPct > 15) {
    pitcherImpact = 'neutral';
    notes.push(`降雨機率 ${rainPct.toFixed(0)}% — 少量降雨可能，影響輕微`);
  } else {
    pitcherImpact = 'favorable';
    notes.push(`降雨機率 ${rainPct.toFixed(0)}% — 天氣晴朗，有利投手控球`);
  }

  // Humidity Impact
  const humidity = info.humidity || 60;
  if (humidity > 80) {
    hrImpact -= 0.02;
    notes.push(`高濕度 ${humidity.toFixed(0)}% — 球體微軟，HR輕微受壓制 (HR-2%)`);
  } else if (humidity > 65) {
    notes.push(`濕度 ${humidity.toFixed(0)}% — 濕度正常，影響輕微`);
  } else {
    notes.push(`乾燥 ${humidity.toFixed(0)}% — 低濕度，球體緊實`);
  }

  // Combined Assessment
  const totalEffect = (hrImpact - 1.0) + (runImpact - 1.0);
  let weatherSummary;
  if (totalEffect > 0.10) weatherSummary = '整體天氣條件有利打者得分';
  else if (totalEffect < -0.10) weatherSummary = '整體天氣條件有利投手主導比賽';
  else weatherSummary = '整體天氣條件對比賽影響中性';

  notes.push(`天氣總評: ${weatherSummary}`);

  if (pitcherImpact === 'favorable' && totalEffect > 0.08) pitcherImpact = 'neutral';
  else if (pitcherImpact === 'neutral' && totalEffect > 0.12) pitcherImpact = 'unfavorable';

  return {
    hr_impact: Math.round(hrImpact * 1000) / 1000,
    run_impact: Math.round(runImpact * 1000) / 1000,
    pitcher_impact: pitcherImpact,
    temperature: temp,
    humidity,
    rain_pct: rainPct,
    wind_speed_kmh: windSpeed,
    wind_direction: info.wind_direction,
    weather_summary: weatherSummary,
    notes,
  };
}

// ─── Analyze Form ───────────────────────────────────────────────────────────
function analyzeForm(stats) {
  const notes = [];
  let score = 50.0;

  function parseRecord(rec) {
    try {
      const parts = (rec || '0-0').trim().split('-');
      return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0];
    } catch (e) { return [0, 0]; }
  }
  function winPct(w, l) {
    const t = w + l;
    return t === 0 ? 0.500 : w / t;
  }

  const [w5, l5] = parseRecord(stats.last_5_record);
  const [w10, l10] = parseRecord(stats.last_10_record);
  const [w20, l20] = parseRecord(stats.last_20_record);
  const pct5 = winPct(w5, l5);
  const pct10 = winPct(w10, l10);
  const pct20 = winPct(w20, l20);

  // Last 5 games
  if (pct5 >= 0.800) {
    score += 20;
    notes.push(`近5場戰績 ${stats.last_5_record} (${(pct5 * 100).toFixed(1)}%) — 近期大熱 (+20)`);
  } else if (pct5 >= 0.600) {
    score += 10;
    notes.push(`近5場戰績 ${stats.last_5_record} (${(pct5 * 100).toFixed(1)}%) — 近期狀態良好 (+10)`);
  } else if (pct5 >= 0.400) {
    notes.push(`近5場戰績 ${stats.last_5_record} (${(pct5 * 100).toFixed(1)}%) — 近期狀態普通 (±0)`);
  } else if (pct5 >= 0.200) {
    score -= 10;
    notes.push(`近5場戰績 ${stats.last_5_record} (${(pct5 * 100).toFixed(1)}%) — 近期狀態偏差 (-10)`);
  } else {
    score -= 20;
    notes.push(`近5場戰績 ${stats.last_5_record} (${(pct5 * 100).toFixed(1)}%) — 近期嚴重低迷 (-20)`);
  }

  // Last 10 games
  if (pct10 >= 0.700) {
    score += 12;
    notes.push(`近10場戰績 ${stats.last_10_record} (${(pct10 * 100).toFixed(1)}%) — 10場強勢 (+12)`);
  } else if (pct10 >= 0.600) {
    score += 6;
    notes.push(`近10場戰績 ${stats.last_10_record} (${(pct10 * 100).toFixed(1)}%) — 10場正向 (+6)`);
  } else if (pct10 >= 0.400) {
    notes.push(`近10場戰績 ${stats.last_10_record} (${(pct10 * 100).toFixed(1)}%) — 10場均衡 (±0)`);
  } else if (pct10 >= 0.300) {
    score -= 6;
    notes.push(`近10場戰績 ${stats.last_10_record} (${(pct10 * 100).toFixed(1)}%) — 10場偏差 (-6)`);
  } else {
    score -= 12;
    notes.push(`近10場戰績 ${stats.last_10_record} (${(pct10 * 100).toFixed(1)}%) — 10場嚴重低迷 (-12)`);
  }

  // Last 20 games
  if (pct20 >= 0.600) {
    score += 8;
    notes.push(`近20場戰績 ${stats.last_20_record} (${(pct20 * 100).toFixed(1)}%) — 長期強隊表現 (+8)`);
  } else if (pct20 >= 0.500) {
    score += 3;
    notes.push(`近20場戰績 ${stats.last_20_record} (${(pct20 * 100).toFixed(1)}%) — 長期表現穩定 (+3)`);
  } else if (pct20 >= 0.400) {
    score -= 3;
    notes.push(`近20場戰績 ${stats.last_20_record} (${(pct20 * 100).toFixed(1)}%) — 長期表現偏弱 (-3)`);
  } else {
    score -= 8;
    notes.push(`近20場戰績 ${stats.last_20_record} (${(pct20 * 100).toFixed(1)}%) — 長期低迷 (-8)`);
  }

  // Momentum
  const momentum = pct5 - pct20;
  if (momentum > 0.200) {
    score += 8;
    notes.push(`動能上升 +${(momentum * 100).toFixed(1)}% (近5場 vs 近20場基線) — 強勁上升趨勢 (+8)`);
  } else if (momentum > 0.100) {
    score += 4;
    notes.push(`動能輕微上升 +${(momentum * 100).toFixed(1)}% — 狀態改善中 (+4)`);
  } else if (momentum < -0.200) {
    score -= 8;
    notes.push(`動能下滑 ${(momentum * 100).toFixed(1)}% (近5場 vs 近20場基線) — 顯著衰退趨勢 (-8)`);
  } else if (momentum < -0.100) {
    score -= 4;
    notes.push(`動能輕微下滑 ${(momentum * 100).toFixed(1)}% — 狀態有所退步 (-4)`);
  }

  // OPS Trend
  const opsTrend = stats.team_ops_trend || 0;
  if (opsTrend > 0.030) {
    score += 5;
    notes.push(`打線OPS上升趨勢 ${opsTrend >= 0 ? '+' : ''}${opsTrend.toFixed(3)} — 攻擊力改善 (+5)`);
  } else if (opsTrend < -0.030) {
    score -= 5;
    notes.push(`打線OPS下滑趨勢 ${opsTrend.toFixed(3)} — 攻擊力衰退 (-5)`);
  }

  score = Math.max(0, Math.min(100, score));

  let trend, trendText;
  if (pct10 >= 0.600 && pct5 >= 0.600) { trend = 'hot'; trendText = '火熱狀態 (Hot Streak)'; }
  else if (pct10 <= 0.400 && pct5 <= 0.400) { trend = 'cold'; trendText = '低迷狀態 (Cold Streak)'; }
  else if (pct5 >= 0.600 && pct10 < 0.600) { trend = 'hot'; trendText = '近期回溫 (Recent Upswing)'; }
  else if (pct5 <= 0.400 && pct10 >= 0.400) { trend = 'cold'; trendText = '近期降溫 (Recent Downturn)'; }
  else { trend = 'neutral'; trendText = '狀態中性 (Neutral Form)'; }

  return {
    form_score: Math.round(score * 10) / 10,
    trend,
    trend_text: trendText,
    last_5_record: stats.last_5_record,
    last_10_record: stats.last_10_record,
    last_20_record: stats.last_20_record,
    pct5: Math.round(pct5 * 1000) / 1000,
    pct10: Math.round(pct10 * 1000) / 1000,
    pct20: Math.round(pct20 * 1000) / 1000,
    momentum: Math.round(momentum * 1000) / 1000,
    notes,
  };
}

// ─── Analyze Schedule ───────────────────────────────────────────────────────
function analyzeSchedule(info) {
  const notes = [];
  let fatigueScore = 0.0;

  // Double Header
  if (info.days_since_last_game === 0) {
    fatigueScore += 25;
    notes.push('連打 (Double Header) — 同日第二場，球員疲勞極高 (+25疲勞)');
  } else if (info.days_since_last_game >= 3) {
    fatigueScore -= 15;
    notes.push(`休兵 ${info.days_since_last_game} 天 — 充分休息，疲勞大幅恢復 (-15疲勞)`);
  } else if (info.days_since_last_game === 2) {
    fatigueScore -= 10;
    notes.push(`休息 ${info.days_since_last_game} 天 — 有一定休息，疲勞部分恢復 (-10疲勞)`);
  } else {
    notes.push('昨日有賽 — 正常輪換，疲勞累積中 (±0)');
  }

  // Consecutive games
  const consec = info.consecutive_games_played || 0;
  if (consec > 15) {
    fatigueScore += 30;
    notes.push(`連續出賽 ${consec} 場 — 高強度連戰，球員嚴重疲勞 (+30疲勞)`);
  } else if (consec > 10) {
    fatigueScore += 20;
    notes.push(`連續出賽 ${consec} 場 — 高密度賽程，疲勞明顯 (+20疲勞)`);
  } else if (consec > 7) {
    fatigueScore += 12;
    notes.push(`連續出賽 ${consec} 場 — 中等疲勞累積 (+12疲勞)`);
  } else if (consec > 4) {
    fatigueScore += 6;
    notes.push(`連續出賽 ${consec} 場 — 輕微疲勞 (+6疲勞)`);
  } else {
    notes.push(`連續出賽 ${consec} 場 — 賽程密度正常`);
  }

  // Travel game
  if (info.is_travel_game) {
    fatigueScore += 15;
    notes.push('長途客場 (Long Distance Travel) — 交通疲勞，時差/舟車勞頓 (+15疲勞)');
  }

  // Consecutive away games
  const awayGames = info.consecutive_away_games || 0;
  if (awayGames > 8) {
    fatigueScore += 15;
    notes.push(`連續客場 ${awayGames} 場 — 長期作客，主場劣勢累積嚴重 (+15疲勞)`);
  } else if (awayGames > 5) {
    fatigueScore += 10;
    notes.push(`連續客場 ${awayGames} 場 — 長客場旅程，主場劣勢顯著 (+10疲勞)`);
  } else if (awayGames > 3) {
    fatigueScore += 5;
    notes.push(`連續客場 ${awayGames} 場 — 有一定主場劣勢 (+5疲勞)`);
  } else if (awayGames > 0) {
    notes.push(`連續客場 ${awayGames} 場 — 客場適應中`);
  }

  fatigueScore = Math.max(0, Math.min(100, fatigueScore));

  let fatigueLevel, fatigueText;
  if (fatigueScore >= 60) {
    fatigueLevel = 'severe';
    fatigueText = '嚴重疲勞 (Severe Fatigue)';
    notes.push('⚠ 賽程疲勞評估: 嚴重疲勞，對球隊表現有實質負面影響');
  } else if (fatigueScore >= 40) {
    fatigueLevel = 'high';
    fatigueText = '高度疲勞 (High Fatigue)';
    notes.push('注意: 賽程疲勞評估: 高度疲勞，影響投打發揮');
  } else if (fatigueScore >= 20) {
    fatigueLevel = 'moderate';
    fatigueText = '中度疲勞 (Moderate Fatigue)';
    notes.push('賽程疲勞評估: 中度疲勞，影響輕微');
  } else if (fatigueScore > 5) {
    fatigueLevel = 'low';
    fatigueText = '輕度疲勞 (Low Fatigue)';
    notes.push('賽程疲勞評估: 疲勞程度低，接近正常狀態');
  } else {
    fatigueLevel = 'fresh';
    fatigueText = '體力充沛 (Fresh)';
    notes.push('賽程疲勞評估: 球員體力充沛，狀態最佳');
  }

  return {
    fatigue_score: Math.round(fatigueScore * 10) / 10,
    fatigue_level: fatigueLevel,
    fatigue_text: fatigueText,
    consecutive_games: consec,
    is_travel_game: info.is_travel_game,
    consecutive_away_games: awayGames,
    days_since_last_game: info.days_since_last_game,
    notes,
  };
}

// ─── Analyze Odds ───────────────────────────────────────────────────────────
function analyzeOdds(openLine, currentLine, openTotal, currentTotal, homeML, awayML, modelHomeWinProb) {
  const notes = [];

  // Line Movement
  const lineMovement = currentLine - openLine;
  const lineMovementPct = openLine !== 0 ? Math.abs(lineMovement) / Math.max(Math.abs(openLine), 0.5) : 0;
  const totalMovement = currentTotal - openTotal;

  // Steam Move Detection
  let steamMove = false;
  if (Math.abs(lineMovement) >= 0.15 || Math.abs(lineMovement) >= 1.5) {
    steamMove = true;
    const direction = lineMovement < 0 ? '主隊 (Home)' : '客隊 (Away)';
    notes.push(`蒸汽移動 (Steam Move) 偵測! 讓分從 ${openLine >= 0 ? '+' : ''}${openLine.toFixed(1)} 移至 ${currentLine >= 0 ? '+' : ''}${currentLine.toFixed(1)} — 精明資金流向 ${direction}`);
  } else {
    notes.push(`讓分移動: ${openLine >= 0 ? '+' : ''}${openLine.toFixed(1)} → ${currentLine >= 0 ? '+' : ''}${currentLine.toFixed(1)} (移動 ${lineMovement >= 0 ? '+' : ''}${lineMovement.toFixed(1)}) — 正常盤口調整`);
  }

  if (Math.abs(totalMovement) >= 0.5) {
    const totalDir = totalMovement > 0 ? '大分' : '小分';
    notes.push(`總分盤移動: ${openTotal.toFixed(1)} → ${currentTotal.toFixed(1)} (移動 ${totalMovement >= 0 ? '+' : ''}${totalMovement.toFixed(1)}) — 資金傾向${totalDir}`);
  } else {
    notes.push(`總分盤: ${openTotal.toFixed(1)} → ${currentTotal.toFixed(1)} — 總分盤穩定`);
  }

  // Implied Probability
  const homeImplied = homeML > 0 ? 1.0 / homeML : 0;
  const awayImplied = awayML > 0 ? 1.0 / awayML : 0;
  const totalImplied = homeImplied + awayImplied;
  const vig = totalImplied - 1.0;
  const homeNoVig = totalImplied > 0 ? homeImplied / totalImplied : 0.5;
  const awayNoVig = totalImplied > 0 ? awayImplied / totalImplied : 0.5;

  notes.push(`主隊賠率 ${homeML.toFixed(2)} → 隱含勝率 ${(homeNoVig * 100).toFixed(1)}% | 客隊賠率 ${awayML.toFixed(2)} → 隱含勝率 ${(awayNoVig * 100).toFixed(1)}%`);
  notes.push(`博彩抽水 (Vig/Juice): ${(vig * 100).toFixed(1)}%`);

  // Value Bet Detection
  let valueBetExists = false;
  let valueDetails = '';
  if (modelHomeWinProb !== null && modelHomeWinProb !== undefined) {
    const modelAwayWinProb = 1.0 - modelHomeWinProb;
    const homeEdge = modelHomeWinProb - homeNoVig;
    const awayEdge = modelAwayWinProb - awayNoVig;

    notes.push(`模型主隊勝率: ${(modelHomeWinProb * 100).toFixed(1)}% vs 市場隱含: ${(homeNoVig * 100).toFixed(1)}% (邊際: ${homeEdge >= 0 ? '+' : ''}${(homeEdge * 100).toFixed(1)}%)`);

    if (homeEdge > 0.05) {
      valueBetExists = true;
      valueDetails = `主隊價值投注 (邊際 +${(homeEdge * 100).toFixed(1)}%)`;
      notes.push(`價值投注發現! ${valueDetails}`);
    } else if (awayEdge > 0.05) {
      valueBetExists = true;
      valueDetails = `客隊價值投注 (邊際 +${(awayEdge * 100).toFixed(1)}%)`;
      notes.push(`價值投注發現! ${valueDetails}`);
    } else {
      notes.push('無顯著價值投注邊際 (<5%差距)');
    }
  }

  // Sharp Money Lean
  let sharpLean;
  if (steamMove) {
    if (lineMovement < 0) {
      sharpLean = 'home';
      notes.push('精明資金 (Sharp Money) 傾向: 主隊');
    } else {
      sharpLean = 'away';
      notes.push('精明資金 (Sharp Money) 傾向: 客隊');
    }
  } else if (Math.abs(lineMovement) > 0.05) {
    if (lineMovement < 0) {
      sharpLean = 'home';
      notes.push('輕微精明資金傾向: 主隊');
    } else {
      sharpLean = 'away';
      notes.push('輕微精明資金傾向: 客隊');
    }
  } else {
    sharpLean = 'none';
    notes.push('精明資金方向不明確');
  }

  // Vegas Bias
  let vegasBias;
  if (homeNoVig > 0.55) {
    vegasBias = 'home_favorite';
    notes.push(`賠率市場: 主隊大熱門 (市場勝率 ${(homeNoVig * 100).toFixed(1)}%)`);
  } else if (awayNoVig > 0.55) {
    vegasBias = 'away_favorite';
    notes.push(`賠率市場: 客隊大熱門 (市場勝率 ${(awayNoVig * 100).toFixed(1)}%)`);
  } else {
    vegasBias = 'even';
    notes.push(`賠率市場: 勢均力敵 (主 ${(homeNoVig * 100).toFixed(1)}% vs 客 ${(awayNoVig * 100).toFixed(1)}%)`);
  }

  return {
    value_bet_exists: valueBetExists,
    value_details: valueDetails,
    sharp_lean: sharpLean,
    steam_move: steamMove,
    line_movement: Math.round(lineMovement * 100) / 100,
    line_movement_pct: Math.round(lineMovementPct * 1000) / 1000,
    total_movement: Math.round(totalMovement * 100) / 100,
    open_line: openLine,
    current_line: currentLine,
    open_total: openTotal,
    current_total: currentTotal,
    home_ml: homeML,
    away_ml: awayML,
    home_implied_prob: Math.round(homeNoVig * 10000) / 10000,
    away_implied_prob: Math.round(awayNoVig * 10000) / 10000,
    vig: Math.round(vig * 10000) / 10000,
    vegas_bias: vegasBias,
    notes,
  };
}

// ─── Poisson PMF ─────────────────────────────────────────────────────────────
function poissonPMF(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1.0 : 0.0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

// ─── Win Probability Model ──────────────────────────────────────────────────
const WIN_MODEL_WEIGHTS = {
  pitcher: 0.35,
  bullpen: 0.20,
  lineup:  0.20,
  defense: 0.05,
  form:    0.10,
  fatigue: 0.05,
};

function calculateWinProbability(homeScores, awayScores) {
  const notes = [];

  function extract(scores, key, def) {
    return parseFloat(scores[key] != null ? scores[key] : def);
  }

  const home = {
    pitcher: extract(homeScores, 'pitcher_score', 50),
    bullpen: extract(homeScores, 'bullpen_score', 50),
    lineup:  extract(homeScores, 'lineup_score',  50),
    defense: extract(homeScores, 'defense_score', 50),
    form:    extract(homeScores, 'form_score',    50),
    fatigue: extract(homeScores, 'fatigue_score', 0),
  };
  const away = {
    pitcher: extract(awayScores, 'pitcher_score', 50),
    bullpen: extract(awayScores, 'bullpen_score', 50),
    lineup:  extract(awayScores, 'lineup_score',  50),
    defense: extract(awayScores, 'defense_score', 50),
    form:    extract(awayScores, 'form_score',    50),
    fatigue: extract(awayScores, 'fatigue_score', 0),
  };

  home.fatigue_effective = 100.0 - home.fatigue;
  away.fatigue_effective = 100.0 - away.fatigue;

  const homeComposite =
    home.pitcher          * WIN_MODEL_WEIGHTS.pitcher
    + home.bullpen        * WIN_MODEL_WEIGHTS.bullpen
    + home.lineup         * WIN_MODEL_WEIGHTS.lineup
    + home.defense        * WIN_MODEL_WEIGHTS.defense
    + home.form           * WIN_MODEL_WEIGHTS.form
    + home.fatigue_effective * WIN_MODEL_WEIGHTS.fatigue;

  const awayComposite =
    away.pitcher          * WIN_MODEL_WEIGHTS.pitcher
    + away.bullpen        * WIN_MODEL_WEIGHTS.bullpen
    + away.lineup         * WIN_MODEL_WEIGHTS.lineup
    + away.defense        * WIN_MODEL_WEIGHTS.defense
    + away.form           * WIN_MODEL_WEIGHTS.form
    + away.fatigue_effective * WIN_MODEL_WEIGHTS.fatigue;

  const parkAdj = parseFloat(homeScores.park_adjustment || 1.0);
  const homeCompositeAdj = homeComposite * parkAdj;

  const total = homeCompositeAdj + awayComposite;
  let homeWinProb = total <= 0 ? 0.5 : homeCompositeAdj / total;
  homeWinProb = Math.max(0.05, Math.min(0.95, homeWinProb));
  const awayWinProb = 1.0 - homeWinProb;

  notes.push(`加權複合分: 主隊 ${homeCompositeAdj.toFixed(1)} vs 客隊 ${awayComposite.toFixed(1)}`);
  notes.push(`模型勝率: 主隊 ${(homeWinProb * 100).toFixed(1)}% | 客隊 ${(awayWinProb * 100).toFixed(1)}%`);
  notes.push(`先發(35%): 主${home.pitcher.toFixed(0)} vs 客${away.pitcher.toFixed(0)} | 牛棚(20%): 主${home.bullpen.toFixed(0)} vs 客${away.bullpen.toFixed(0)} | 打線(20%): 主${home.lineup.toFixed(0)} vs 客${away.lineup.toFixed(0)}`);
  notes.push(`守備(5%): 主${home.defense.toFixed(0)} vs 客${away.defense.toFixed(0)} | 狀態(10%): 主${home.form.toFixed(0)} vs 客${away.form.toFixed(0)} | 體能(5%): 主疲勞${home.fatigue.toFixed(0)} vs 客疲勞${away.fatigue.toFixed(0)}`);

  if (parkAdj > 1.02) notes.push(`球場加成: +${((parkAdj - 1) * 100).toFixed(1)}% 利主隊`);
  else if (parkAdj < 0.98) notes.push(`球場影響: ${((parkAdj - 1) * 100).toFixed(1)}% 不利主隊`);

  return {
    home_win_prob: Math.round(homeWinProb * 10000) / 10000,
    away_win_prob: Math.round(awayWinProb * 10000) / 10000,
    home_composite_score: Math.round(homeCompositeAdj * 100) / 100,
    away_composite_score: Math.round(awayComposite * 100) / 100,
    breakdown: {
      home, away,
      weights: WIN_MODEL_WEIGHTS,
      home_composite_raw: Math.round(homeComposite * 100) / 100,
      away_composite_raw: Math.round(awayComposite * 100) / 100,
      park_adjustment: Math.round(parkAdj * 1000) / 1000,
      home_composite_adj: Math.round(homeCompositeAdj * 100) / 100,
    },
    notes,
  };
}

// ─── Totals Model ───────────────────────────────────────────────────────────
function predictTotalRuns(homeLineup, awayLineup, homePitcher, awayPitcher, park, weather) {
  const notes = [];

  const awayEra = (awayPitcher && awayPitcher.era) || 4.00;
  const homeRunExp = (homeLineup && homeLineup.run_expectancy) || 4.2;
  let eraFactorHome = Math.max(awayEra, 1.0) / 4.00;
  eraFactorHome = Math.max(0.4, Math.min(2.0, eraFactorHome));
  let homeExpectedRuns = homeRunExp * eraFactorHome;

  const homeEra = (homePitcher && homePitcher.era) || 4.00;
  const awayRunExp = (awayLineup && awayLineup.run_expectancy) || 4.2;
  let eraFactorAway = Math.max(homeEra, 1.0) / 4.00;
  eraFactorAway = Math.max(0.4, Math.min(2.0, eraFactorAway));
  let awayExpectedRuns = awayRunExp * eraFactorAway;

  const runAdj = (park && park.run_adjustment) || 1.0;
  homeExpectedRuns *= runAdj;
  awayExpectedRuns *= runAdj;

  const weatherRun = (weather && weather.run_impact) || 1.0;
  homeExpectedRuns *= weatherRun;
  awayExpectedRuns *= weatherRun;

  const predictedHome = Math.max(0.5, homeExpectedRuns);
  const predictedAway = Math.max(0.5, awayExpectedRuns);
  const predictedTotal = predictedHome + predictedAway;

  notes.push(`預測得分: 主隊 ${predictedHome.toFixed(1)} + 客隊 ${predictedAway.toFixed(1)} = 總計 ${predictedTotal.toFixed(1)} 分`);
  notes.push(`影響因子: 球場調整 ${runAdj.toFixed(3)} | 天氣調整 ${weatherRun.toFixed(3)}`);
  notes.push(`對方先發ERA調整: 主隊面對ERA ${awayEra.toFixed(2)} (×${eraFactorHome.toFixed(2)}) | 客隊面對ERA ${homeEra.toFixed(2)} (×${eraFactorAway.toFixed(2)})`);

  // Top scores via Poisson
  const maxRuns = 12;
  const scoreProbs = {};
  for (let h = 0; h <= maxRuns; h++) {
    for (let a = 0; a <= maxRuns; a++) {
      const prob = poissonPMF(h, predictedHome) * poissonPMF(a, predictedAway);
      if (prob > 0.001) scoreProbs[`${h}-${a}`] = { h, a, prob };
    }
  }
  const sorted = Object.values(scoreProbs).sort((x, y) => y.prob - x.prob);
  const top3 = sorted.slice(0, 3).map(({ h, a, prob }) => ({
    home_score: h,
    away_score: a,
    total: h + a,
    probability: Math.round(prob * 10000) / 10000,
    probability_pct: Math.round(prob * 1000) / 10,
  }));

  if (top3[0]) notes.push(`最可能比分 #1: ${top3[0].home_score}-${top3[0].away_score} (機率 ${top3[0].probability_pct.toFixed(1)}%)`);
  if (top3[1]) notes.push(`最可能比分 #2: ${top3[1].home_score}-${top3[1].away_score} (機率 ${top3[1].probability_pct.toFixed(1)}%)`);

  const npbAvg = 7.5;
  let ouLean, ouText;
  if (predictedTotal > npbAvg + 1.0) {
    ouLean = 'over';
    ouText = `大分 (Over) — 預測總分 ${predictedTotal.toFixed(1)} 高於NPB均值`;
  } else if (predictedTotal < npbAvg - 1.0) {
    ouLean = 'under';
    ouText = `小分 (Under) — 預測總分 ${predictedTotal.toFixed(1)} 低於NPB均值`;
  } else {
    ouLean = 'push';
    ouText = `中性 (Neutral) — 預測總分 ${predictedTotal.toFixed(1)} 接近NPB均值`;
  }
  notes.push(`大小分傾向: ${ouText}`);

  return {
    predicted_total: Math.round(predictedTotal * 100) / 100,
    predicted_home_runs: Math.round(predictedHome * 100) / 100,
    predicted_away_runs: Math.round(predictedAway * 100) / 100,
    top3_scores: top3,
    over_under_lean: ouLean,
    over_under_text: ouText,
    era_factor_home: Math.round(eraFactorHome * 1000) / 1000,
    era_factor_away: Math.round(eraFactorAway * 1000) / 1000,
    park_run_adjustment: Math.round(runAdj * 1000) / 1000,
    weather_run_impact: Math.round(weatherRun * 1000) / 1000,
    notes,
  };
}

// ─── Generate Final Recommendation ─────────────────────────────────────────
function generateFinalRecommendation(winProb, totals, betScore, odds) {
  const homeWin = winProb.home_win_prob;
  const awayWin = winProb.away_win_prob;
  const bs = betScore.bet_score;

  // Star rating
  let starRating;
  if (bs >= 80) starRating = 5;
  else if (bs >= 70) starRating = 4;
  else if (bs >= 60) starRating = 3;
  else if (bs >= 50) starRating = 2;
  else if (bs >= 35) starRating = 1;
  else starRating = 0;

  // Winner
  const winner = homeWin > awayWin ? '主隊勝' : '客隊勝';

  // Spread
  let spread;
  if (odds && odds.current_line) {
    const cl = odds.current_line;
    if (cl < 0) spread = `主隊讓 ${Math.abs(cl).toFixed(1)} 分`;
    else if (cl > 0) spread = `客隊讓 ${cl.toFixed(1)} 分`;
    else spread = '平局盤';
  } else {
    spread = homeWin > 0.6 ? '主隊讓分' : awayWin > 0.6 ? '客隊讓分' : '不建議讓分';
  }

  // Total
  const total = totals.over_under_text;

  // Reasoning
  const reasons = [];
  if (homeWin > 0.6) reasons.push(`主隊勝率 ${(homeWin * 100).toFixed(1)}% 具有明顯優勢`);
  else if (awayWin > 0.6) reasons.push(`客隊勝率 ${(awayWin * 100).toFixed(1)}% 具有明顯優勢`);
  else reasons.push(`雙方勢均力敵 (${(homeWin * 100).toFixed(1)}% vs ${(awayWin * 100).toFixed(1)}%)`);

  reasons.push(betScore.recommendation);
  if (totals.over_under_lean !== 'push') reasons.push(`大小分建議: ${totals.over_under_text}`);
  if (odds && odds.value_bet_exists) reasons.push(`發現價值投注: ${odds.value_details}`);

  return {
    star_rating: starRating,
    winner,
    spread,
    total,
    reasoning: reasons.join(' | '),
    bet_score: bs,
    grade: betScore.grade,
    recommendation: betScore.recommendation,
  };
}
