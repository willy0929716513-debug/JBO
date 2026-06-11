'use strict';

// ─── NPB ELO Defaults ────────────────────────────────────────────────────────
const NPB_ELO_DEFAULTS = {
  '阪神': 1580,
  'オリックス': 1560,
  'ソフトバンク': 1555,
  '広島': 1520,
  'DeNA': 1515,
  '巨人': 1510,
  'ロッテ': 1500,
  '西武': 1495,
  '楽天': 1490,
  '日本ハム': 1485,
  'ヤクルト': 1480,
  '中日': 1475,
  'Tigers': 1580,
  'Buffaloes': 1560,
  'Hawks': 1555,
  'Carp': 1520,
  'BayStars': 1515,
  'Giants': 1510,
  'Marines': 1500,
  'Lions': 1495,
  'Eagles': 1490,
  'Fighters': 1485,
  'Swallows': 1480,
  'Dragons': 1475,
};

function getTeamElo(teamName) {
  return NPB_ELO_DEFAULTS[teamName] || 1500;
}

// ─── Kelly Criterion ─────────────────────────────────────────────────────────
function kellyCriterion(winProb, decimalOdds, bankroll = 10000, fraction = 0.25) {
  const notes = [];

  if (winProb <= 0 || winProb >= 1) {
    return { kelly_pct: 0, fractional_kelly_pct: 0, bet_amount: 0, edge: 0, notes: ['無效勝率 — 勝率必須在 0-100% 之間'] };
  }
  if (decimalOdds <= 1.0) {
    return { kelly_pct: 0, fractional_kelly_pct: 0, bet_amount: 0, edge: 0, notes: ['無效賠率 — 十進位賠率必須大於 1.0'] };
  }

  const b = decimalOdds - 1.0;
  const p = winProb;
  const q = 1.0 - p;

  const kellyPct = (b * p - q) / b;
  const fractionalKellyPct = kellyPct * fraction;
  const ev = (p * b) - q;
  const edgePct = ev * 100;

  if (kellyPct <= 0) {
    notes.push(`凱利公式: 負值 (${(kellyPct * 100).toFixed(1)}%) — 無投注優勢，建議不投 (Negative Edge)`);
    notes.push(`期望值 (EV): ${ev.toFixed(3)} — 負期望值投注`);
    return {
      kelly_pct: 0,
      fractional_kelly_pct: 0,
      bet_amount: 0,
      edge: Math.round(edgePct * 100) / 100,
      notes,
    };
  }

  const betAmount = Math.max(0, fractionalKellyPct * bankroll);

  notes.push(`凱利公式計算: b=${b.toFixed(2)}, p=${(p * 100).toFixed(1)}%, q=${(q * 100).toFixed(1)}%`);
  notes.push(`全凱利比例: ${(kellyPct * 100).toFixed(1)}% — 理論最佳但高風險`);
  notes.push(`四分之一凱利 (${(fraction * 100).toFixed(0)}%): ${(fractionalKellyPct * 100).toFixed(1)}% — 保守建議比例`);
  notes.push(`期望值 (EV): +${ev.toFixed(3)} per unit — 每單位正期望值 ${edgePct.toFixed(1)}%`);

  if (kellyPct > 0.20) {
    notes.push(`⚠ 全凱利比例 ${(kellyPct * 100).toFixed(1)}% 偏高 — 強烈建議使用分數凱利控制風險`);
  } else if (kellyPct > 0.10) {
    notes.push(`凱利比例 ${(kellyPct * 100).toFixed(1)}% — 中等規模投注`);
  } else {
    notes.push(`凱利比例 ${(kellyPct * 100).toFixed(1)}% — 小額投注，邊際合理`);
  }

  if (bankroll !== 1.0) {
    notes.push(`建議投注金額: ${betAmount.toFixed(2)} (本金 ${bankroll.toFixed(2)} × ${(fractionalKellyPct * 100).toFixed(1)}%)`);
  }

  return {
    kelly_pct: Math.round(kellyPct * 10000) / 100,
    fractional_kelly_pct: Math.round(fractionalKellyPct * 10000) / 100,
    bet_amount: Math.round(betAmount * 100) / 100,
    edge: Math.round(edgePct * 100) / 100,
    ev_per_unit: Math.round(ev * 10000) / 10000,
    b_value: Math.round(b * 1000) / 1000,
    fraction_used: fraction,
    notes,
  };
}

// ─── CLV (Closing Line Value) ────────────────────────────────────────────────
function calculateCLV(openOdds, closeOdds, yourOdds) {
  const notes = [];

  if (closeOdds <= 1.0 || yourOdds <= 1.0 || openOdds <= 1.0) {
    return { clv_value: 0, clv_pct: 0, assessment: 'break_even', quality_grade: 'C', notes: ['無效賠率 — 所有賠率必須大於 1.0'] };
  }

  const clvValue = (yourOdds / closeOdds) - 1.0;
  const clvPct = clvValue * 100.0;
  const openToClose = (openOdds / closeOdds) - 1.0;
  const openToClosePct = openToClose * 100.0;
  const yourVsOpen = (yourOdds / openOdds) - 1.0;
  const yourVsOpenPct = yourVsOpen * 100.0;

  const openImplied = 1.0 / openOdds;
  const closeImplied = 1.0 / closeOdds;
  const yourImplied = 1.0 / yourOdds;
  const marketMovement = closeImplied - openImplied;

  notes.push(`開盤賠率: ${openOdds.toFixed(3)} (隱含 ${(openImplied * 100).toFixed(1)}%) | 您的賠率: ${yourOdds.toFixed(3)} (隱含 ${(yourImplied * 100).toFixed(1)}%) | 收盤賠率: ${closeOdds.toFixed(3)} (隱含 ${(closeImplied * 100).toFixed(1)}%)`);

  if (Math.abs(openToClosePct) > 5) {
    if (marketMovement > 0) {
      notes.push(`市場移動: 賠率縮短 ${Math.abs(openToClosePct).toFixed(1)}% — 市場對此方較有信心`);
    } else {
      notes.push(`市場移動: 賠率拉長 ${Math.abs(openToClosePct).toFixed(1)}% — 市場對此方信心不足`);
    }
  } else {
    notes.push(`市場移動幅度小 (${openToClosePct >= 0 ? '+' : ''}${openToClosePct.toFixed(1)}%) — 盤口穩定`);
  }

  let assessment, qualityGrade;
  if (clvValue > 0.05) {
    assessment = 'positive_clv';
    notes.push(`CLV: +${clvPct.toFixed(1)}% — 強正收盤線價值! 長期下注品質優秀`);
    notes.push('正CLV確認: 您在比收盤賠率更好的賠率下注，長期盈利關鍵指標');
    qualityGrade = clvPct > 10 ? 'A' : 'B+';
  } else if (clvValue > 0.01) {
    assessment = 'positive_clv';
    notes.push(`CLV: +${clvPct.toFixed(1)}% — 輕微正收盤線價值，方向正確`);
    qualityGrade = 'B';
  } else if (clvValue >= -0.01) {
    assessment = 'break_even';
    notes.push(`CLV: ${clvPct >= 0 ? '+' : ''}${clvPct.toFixed(1)}% — 接近收支平衡，賠率略等於收盤線`);
    qualityGrade = 'C';
  } else if (clvValue >= -0.05) {
    assessment = 'negative_clv';
    notes.push(`CLV: ${clvPct.toFixed(1)}% — 輕微負收盤線價值，稍微比市場收盤賠率差`);
    qualityGrade = 'D';
  } else {
    assessment = 'negative_clv';
    notes.push(`CLV: ${clvPct.toFixed(1)}% — 明顯負收盤線價值，下注品質差`);
    notes.push('警告: 持續負CLV下注長期必然虧損');
    qualityGrade = 'F';
  }

  if (yourVsOpenPct > 3) {
    notes.push(`時機分析: 您的賠率比開盤高 ${yourVsOpenPct >= 0 ? '+' : ''}${yourVsOpenPct.toFixed(1)}% — 早盤下注佔優`);
  } else if (yourVsOpenPct < -3) {
    notes.push(`時機分析: 您的賠率比開盤低 ${yourVsOpenPct.toFixed(1)}% — 晚盤下注較差`);
  } else {
    notes.push(`時機分析: 賠率接近開盤線 (${yourVsOpenPct >= 0 ? '+' : ''}${yourVsOpenPct.toFixed(1)}%)`);
  }

  return {
    clv_value: Math.round(clvValue * 10000) / 10000,
    clv_pct: Math.round(clvPct * 100) / 100,
    assessment,
    quality_grade: qualityGrade,
    open_odds: openOdds,
    close_odds: closeOdds,
    your_odds: yourOdds,
    open_implied: Math.round(openImplied * 10000) / 10000,
    close_implied: Math.round(closeImplied * 10000) / 10000,
    your_implied: Math.round(yourImplied * 10000) / 10000,
    open_to_close_pct: Math.round(openToClosePct * 100) / 100,
    notes,
  };
}

// ─── ELO Win Probability ─────────────────────────────────────────────────────
function calculateEloWinProb(homeElo, awayElo, homeAdvantage = 35) {
  const notes = [];
  const effectiveHomeElo = homeElo + homeAdvantage;
  const eloDiff = effectiveHomeElo - awayElo;
  const homeWinProb = 1.0 / (1.0 + Math.pow(10.0, -eloDiff / 400.0));
  const awayWinProb = 1.0 - homeWinProb;

  notes.push(`主隊ELO: ${homeElo.toFixed(0)} (+${homeAdvantage.toFixed(0)}主場優勢 = ${effectiveHomeElo.toFixed(0)}) | 客隊ELO: ${awayElo.toFixed(0)}`);
  notes.push(`ELO差距: ${eloDiff >= 0 ? '+' : ''}${eloDiff.toFixed(0)} 分`);
  notes.push(`ELO勝率預測: 主隊 ${(homeWinProb * 100).toFixed(1)}% vs 客隊 ${(awayWinProb * 100).toFixed(1)}%`);

  const absDiff = Math.abs(eloDiff);
  if (absDiff >= 200) notes.push('ELO差距極大 — 強烈傾向一方獲勝');
  else if (absDiff >= 100) notes.push('ELO差距顯著 — 明顯強弱之分');
  else if (absDiff >= 50) notes.push('ELO差距適中 — 輕微優勢');
  else notes.push('ELO差距微小 — 勢均力敵');

  return {
    home_win_prob: Math.round(homeWinProb * 10000) / 10000,
    away_win_prob: Math.round(awayWinProb * 10000) / 10000,
    home_elo: homeElo,
    away_elo: awayElo,
    effective_home_elo: effectiveHomeElo,
    elo_diff: Math.round(eloDiff * 10) / 10,
    home_advantage: homeAdvantage,
    notes,
  };
}

// ─── Poisson Sampling (Knuth's Algorithm) ────────────────────────────────────
function poissonSample(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// ─── Monte Carlo Simulation (10,000 games) ───────────────────────────────────
function runMonteCarlo(homeWinProb, expectedTotal, stdDev = 1.8, nSimulations = 10000) {
  // Calculate home/away expected runs
  const homeRunShare = 0.5 + (homeWinProb - 0.5) * 0.4;
  const homeExpected = expectedTotal * homeRunShare;
  const awayExpected = expectedTotal * (1 - homeRunShare);

  let homeWins = 0;
  let awayWins = 0;
  let ties = 0;
  let overCount = 0;
  let underCount = 0;
  const scoreDist = {};
  const totalScores = [];

  // Use NPB average total as the over/under baseline
  const ouLine = expectedTotal;

  for (let i = 0; i < nSimulations; i++) {
    const homeRuns = poissonSample(homeExpected);
    const awayRuns = poissonSample(awayExpected);
    const gameTotal = homeRuns + awayRuns;

    totalScores.push(gameTotal);

    if (homeRuns > awayRuns) homeWins++;
    else if (awayRuns > homeRuns) awayWins++;
    else ties++;

    if (gameTotal > ouLine) overCount++;
    else if (gameTotal < ouLine) underCount++;

    const scoreKey = `${homeRuns}-${awayRuns}`;
    scoreDist[scoreKey] = (scoreDist[scoreKey] || 0) + 1;
  }

  // Sort score distribution by frequency
  const sortedScores = Object.entries(scoreDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([score, count]) => ({
      score,
      count,
      probability: count / nSimulations,
      pct: Math.round(count / nSimulations * 1000) / 10,
      home_favored: parseInt(score.split('-')[0]) > parseInt(score.split('-')[1]),
    }));

  // Calculate mean and std dev
  const mean = totalScores.reduce((a, b) => a + b, 0) / nSimulations;
  const variance = totalScores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / nSimulations;
  const stdDevResult = Math.sqrt(variance);

  // 95% confidence interval (approx: mean ± 1.96 * stdDev / sqrt(n))
  const se = stdDevResult / Math.sqrt(nSimulations);
  const ci95Low = Math.max(0, Math.round((mean - 1.96 * stdDevResult) * 10) / 10);
  const ci95High = Math.round((mean + 1.96 * stdDevResult) * 10) / 10;

  // Adjust for ties (split half/half between home/away)
  const homeWinPct = (homeWins + ties * 0.5) / nSimulations;
  const awayWinPct = (awayWins + ties * 0.5) / nSimulations;
  const overPct = overCount / nSimulations;
  const underPct = underCount / nSimulations;

  return {
    home_win_pct: Math.round(homeWinPct * 10000) / 100,
    away_win_pct: Math.round(awayWinPct * 10000) / 100,
    over_pct: Math.round(overPct * 10000) / 100,
    under_pct: Math.round(underPct * 10000) / 100,
    mean_total: Math.round(mean * 100) / 100,
    std_dev_result: Math.round(stdDevResult * 100) / 100,
    score_distribution: sortedScores,
    confidence_interval_95: `${ci95Low}-${ci95High}`,
    n_simulations: nSimulations,
    home_expected: Math.round(homeExpected * 100) / 100,
    away_expected: Math.round(awayExpected * 100) / 100,
  };
}

// ─── Bet Score ────────────────────────────────────────────────────────────────
function calculateBetScore(components) {
  const notes = [];

  const winProbEdge = components.win_prob_edge || 0;
  const kellyPct = components.kelly_pct || 0;
  const clvValue = components.clv_value || 0;
  const modelConfidence = components.model_confidence != null ? components.model_confidence : 0.5;
  const lineValue = components.line_value != null ? components.line_value : 0.5;
  const sharpLeanScore = components.sharp_lean_score || 0;

  // 1. Win Probability Edge (30%)
  let edgeScore;
  if (winProbEdge >= 0.10) edgeScore = 100.0;
  else if (winProbEdge >= 0.05) edgeScore = 50.0 + (winProbEdge - 0.05) * 1000;
  else if (winProbEdge >= 0.0) edgeScore = winProbEdge * 1000;
  else edgeScore = Math.max(0, 50.0 + winProbEdge * 500);
  edgeScore = Math.max(0, Math.min(100, edgeScore));
  const edgeContribution = edgeScore * 0.30;

  // 2. Kelly (20%)
  let kellyScore;
  if (kellyPct >= 0.15) kellyScore = 100.0;
  else if (kellyPct >= 0.05) kellyScore = 60.0 + (kellyPct - 0.05) * 400;
  else if (kellyPct > 0) kellyScore = kellyPct * 1200;
  else kellyScore = 0.0;
  kellyScore = Math.max(0, Math.min(100, kellyScore));
  const kellyContribution = kellyScore * 0.20;

  // 3. CLV (20%)
  let clvScore;
  if (clvValue >= 0.10) clvScore = 100.0;
  else if (clvValue >= 0.03) clvScore = 60.0 + (clvValue - 0.03) * 571;
  else if (clvValue >= 0.0) clvScore = 30.0 + clvValue * 1000;
  else clvScore = Math.max(0, 30.0 + clvValue * 300);
  clvScore = Math.max(0, Math.min(100, clvScore));
  const clvContribution = clvScore * 0.20;

  // 4. Model Confidence (15%)
  const confidenceScore = modelConfidence * 100.0;
  const confidenceContribution = confidenceScore * 0.15;

  // 5. Line Value (10%)
  const lineScore = lineValue * 100.0;
  const lineContribution = lineScore * 0.10;

  // 6. Sharp Money (5%)
  const sharpScore = sharpLeanScore * 100.0;
  const sharpContribution = sharpScore * 0.05;

  let betScore = edgeContribution + kellyContribution + clvContribution + confidenceContribution + lineContribution + sharpContribution;
  betScore = Math.max(0, Math.min(100, betScore));

  let grade, recommendation, starRating;
  if (betScore >= 80) {
    grade = 'A+'; recommendation = '強力推薦投注 (Strong Bet)'; starRating = 5;
  } else if (betScore >= 70) {
    grade = 'A'; recommendation = '推薦投注 (Good Bet)'; starRating = 4;
  } else if (betScore >= 60) {
    grade = 'B+'; recommendation = '可考慮投注 (Moderate Bet)'; starRating = 3;
  } else if (betScore >= 50) {
    grade = 'B'; recommendation = '謹慎投注 (Cautious Bet)'; starRating = 2;
  } else if (betScore >= 35) {
    grade = 'C'; recommendation = '觀望為宜 (Watch Only)'; starRating = 1;
  } else {
    grade = 'D'; recommendation = '不建議投注 (Avoid)'; starRating = 0;
  }

  notes.push(`投注品質評分: ${betScore.toFixed(1)}/100 — 等級 ${grade}`);
  notes.push(`分項: 勝率邊際=${edgeScore.toFixed(0)}(${edgeContribution.toFixed(1)}) | 凱利=${kellyScore.toFixed(0)}(${kellyContribution.toFixed(1)}) | CLV=${clvScore.toFixed(0)}(${clvContribution.toFixed(1)})`);
  notes.push(`  模型信心=${confidenceScore.toFixed(0)}(${confidenceContribution.toFixed(1)}) | 線值=${lineScore.toFixed(0)}(${lineContribution.toFixed(1)}) | 精明資金=${sharpScore.toFixed(0)}(${sharpContribution.toFixed(1)})`);
  notes.push(`最終建議: ${recommendation}`);

  return {
    bet_score: Math.round(betScore * 10) / 10,
    grade,
    star_rating: starRating,
    recommendation,
    component_scores: {
      edge_score: Math.round(edgeScore * 10) / 10,
      kelly_score: Math.round(kellyScore * 10) / 10,
      clv_score: Math.round(clvScore * 10) / 10,
      confidence_score: Math.round(confidenceScore * 10) / 10,
      line_score: Math.round(lineScore * 10) / 10,
      sharp_score: Math.round(sharpScore * 10) / 10,
    },
    notes,
  };
}
