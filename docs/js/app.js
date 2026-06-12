'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const NPB_SPORT_KEY = 'baseball_npb';

// ─── API Key Management ──────────────────────────────────────────────────────
function getApiKey() { return localStorage.getItem('npb_odds_api_key') || ''; }
function saveApiKey(key) { localStorage.setItem('npb_odds_api_key', key); }

// ─── API Status ───────────────────────────────────────────────────────────────
function updateApiStatus(ok, msg) {
  const container = document.getElementById('odds-cards-container');
  if (!container) return;
  // Update the section header if we have a status indicator
  const statusEl = document.getElementById('api-status-msg');
  if (statusEl) {
    statusEl.textContent = msg || '';
    statusEl.style.color = ok ? 'var(--success)' : 'var(--danger)';
  }
}

// ─── Odds Loading ────────────────────────────────────────────────────────────
async function loadOdds() {
  const key = getApiKey();
  if (!key) { openApiKeyModal(); return; }

  showLoading('載入即時賠率...');
  const container = document.getElementById('odds-cards-container');
  if (container) container.innerHTML = '<div class="no-games-msg"><i class="fa-solid fa-rotate fa-spin" style="margin-right:8px"></i>載入中...</div>';

  try {
    const url = `${ODDS_API_BASE}/sports/${NPB_SPORT_KEY}/odds?apiKey=${key}&regions=eu&markets=h2h,totals&oddsFormat=decimal&dateFormat=iso`;
    const resp = await fetch(url);

    if (resp.status === 401) throw new Error('API Key 無效，請檢查您的 API Key');
    if (resp.status === 422) throw new Error('NPB 目前無賽事資料');
    if (!resp.ok) throw new Error(`API 錯誤 (${resp.status})`);

    const games = await resp.json();
    const remaining = resp.headers.get('x-requests-remaining') || '?';
    updateApiStatus(true, `${remaining} 次請求剩餘`);
    renderOddsCards(games);
  } catch (e) {
    renderOddsError(e.message);
    updateApiStatus(false, e.message);
  } finally {
    hideLoading();
  }
}

// ─── Render Odds Cards ────────────────────────────────────────────────────────
function renderOddsCards(games) {
  const container = document.getElementById('odds-cards-container');
  if (!container) return;

  if (!games || games.length === 0) {
    container.innerHTML = '<div class="no-games-msg"><i class="fa-solid fa-calendar-xmark" style="margin-right:8px"></i>NPB 目前無賽事</div>';
    return;
  }

  container.innerHTML = '';
  games.forEach(game => {
    // Extract teams
    const homeTeam = game.home_team || '主隊';
    const awayTeam = game.away_team || '客隊';

    // Format time
    const gameTime = game.commence_time ? formatGameTime(game.commence_time) : '時間未定';

    // Extract h2h odds (first bookmaker)
    let homeOdds = null, awayOdds = null, totalLine = null, totalOverOdds = null;
    if (game.bookmakers && game.bookmakers.length > 0) {
      for (const bk of game.bookmakers) {
        for (const market of (bk.markets || [])) {
          if (market.key === 'h2h') {
            for (const outcome of (market.outcomes || [])) {
              if (outcome.name === homeTeam) homeOdds = outcome.price;
              else if (outcome.name === awayTeam) awayOdds = outcome.price;
            }
          }
          if (market.key === 'totals' && !totalLine) {
            for (const outcome of (market.outcomes || [])) {
              if (outcome.name === 'Over') {
                totalLine = outcome.point;
                totalOverOdds = outcome.price;
              }
            }
          }
        }
        if (homeOdds && awayOdds) break;
      }
    }

    const card = document.createElement('div');
    card.className = 'odds-card';
    card.innerHTML = `
      <div class="odds-card-time"><i class="fa-regular fa-clock"></i> ${gameTime}</div>
      <div class="team-vs">
        <div class="team-name home">${homeTeam}</div>
        <div class="vs-sep">VS</div>
        <div class="team-name away">${awayTeam}</div>
      </div>
      <div class="odds-row">
        <div class="odds-pill">
          <span class="odds-label">主隊</span>
          <span class="odds-value">${homeOdds ? homeOdds.toFixed(2) : '—'}</span>
        </div>
        <div class="odds-pill">
          <span class="odds-label">客隊</span>
          <span class="odds-value">${awayOdds ? awayOdds.toFixed(2) : '—'}</span>
        </div>
      </div>
      ${totalLine ? `<div class="odds-total"><i class="fa-solid fa-calculator"></i> 大小分: ${totalLine} (大 ${totalOverOdds ? totalOverOdds.toFixed(2) : '—'})</div>` : ''}
      <button class="btn btn-primary btn-sm btn-full" onclick='prefillFromOdds(${JSON.stringify(game)})'>
        分析此場 <i class="fa-solid fa-arrow-right"></i>
      </button>
    `;
    container.appendChild(card);
  });
}

function renderOddsError(msg) {
  const container = document.getElementById('odds-cards-container');
  if (!container) return;
  container.innerHTML = `
    <div class="notice notice-error" style="width:100%">
      <i class="fa-solid fa-circle-exclamation"></i>
      <div>
        <strong>載入失敗:</strong> ${msg}
        <br><small>請確認 API Key 正確，或稍後再試。<a href="#" onclick="openApiKeyModal()">設定 API Key</a></small>
      </div>
    </div>`;
}

// ─── Format Game Time ─────────────────────────────────────────────────────────
function formatGameTime(isoStr) {
  try {
    const d = new Date(isoStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${month}月${day}日 ${h}:${m}`;
  } catch {
    return isoStr;
  }
}

// ─── Pre-fill from Odds Card ──────────────────────────────────────────────────
function prefillFromOdds(game) {
  const homeTeam = game.home_team || '';
  const awayTeam = game.away_team || '';

  setVal('home_team', homeTeam);
  setVal('away_team', awayTeam);

  if (game.commence_time) {
    const d = new Date(game.commence_time);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'00')}:${String(d.getMinutes()).padStart(2,'00')}`;
    setVal('datetime', dateStr);
  }

  // Extract odds
  let homeOdds = null, awayOdds = null, totalLine = null, totalCloseOdds = null;
  if (game.bookmakers && game.bookmakers.length > 0) {
    for (const bk of game.bookmakers) {
      for (const market of (bk.markets || [])) {
        if (market.key === 'h2h') {
          for (const outcome of (market.outcomes || [])) {
            if (outcome.name === homeTeam) homeOdds = outcome.price;
            else if (outcome.name === awayTeam) awayOdds = outcome.price;
          }
        }
        if (market.key === 'totals' && !totalLine) {
          for (const outcome of (market.outcomes || [])) {
            if (outcome.name === 'Over') {
              totalLine = outcome.point;
              totalCloseOdds = outcome.price;
            }
          }
        }
      }
      if (homeOdds && awayOdds) break;
    }
  }

  if (homeOdds) setVal('home_ml', homeOdds);
  if (awayOdds) setVal('away_ml', awayOdds);
  if (totalLine) {
    setVal('open_total', totalLine);
    setVal('current_total', totalLine);
  }
  if (homeOdds) setVal('your_odds', homeOdds);

  // Open input section and switch to odds tab
  openFormPanel();

  // Scroll to input section
  const sec = document.getElementById('analysis-form-section');
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  showToast('已載入賠率資料，請補充其他分析資訊後點擊「開始分析」', 'info');
}

// ─── Set Form Value Helper ────────────────────────────────────────────────────
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ─── Load Sample Data ─────────────────────────────────────────────────────────
function loadSampleData() {
  const sd = SAMPLE_DATA;
  const gi = sd.game_info;
  const hp = sd.home_pitcher;
  const ap = sd.away_pitcher;
  const hb = sd.home_bullpen;
  const ab = sd.away_bullpen;
  const hs = sd.home_team_stats;
  const as_ = sd.away_team_stats;
  const odds = sd.odds;
  const betting = sd.betting;

  // Basic info
  setVal('home_team', gi.home_team);
  setVal('away_team', gi.away_team);
  setVal('stadium', gi.stadium);
  setVal('datetime', gi.datetime);
  setVal('is_day_game', gi.is_day_game ? 'true' : 'false');
  setVal('turf_type', gi.turf_type);
  setVal('park_factor', gi.park_factor);
  setVal('hr_factor', gi.hr_factor);
  setVal('scoring_factor', gi.scoring_factor);
  setVal('temperature', gi.temperature);
  setVal('humidity', gi.humidity);
  setVal('rain_pct', gi.rain_pct);
  setVal('wind_direction', gi.wind_direction);
  setVal('wind_speed_kmh', gi.wind_speed_kmh);
  setVal('is_travel_game', gi.is_travel_game ? 'true' : 'false');
  setVal('consecutive_away_games', gi.consecutive_away_games);
  setVal('consecutive_games_played', gi.consecutive_games_played);
  setVal('days_since_last_game', gi.days_since_last_game);

  // Home pitcher
  setVal('home_era', hp.era);
  setVal('home_whip', hp.whip);
  setVal('home_fip', hp.fip);
  setVal('home_xera', hp.xera);
  setVal('home_k9', hp.k9);
  setVal('home_bb9', hp.bb9);
  setVal('home_rest_days', hp.rest_days);
  setVal('home_handedness', hp.handedness);
  setVal('home_pitcher_home_era', hp.home_era);
  setVal('home_pitcher_vs_opp_era', hp.vs_opponent_era);
  setVal('home_pitcher_vs_opp_games', hp.vs_opponent_games);
  setVal('home_vs_lhb_ops', hp.vs_lhb_ops);
  setVal('home_vs_rhb_ops', hp.vs_rhb_ops);
  setVal('home_recent_5_games', (hp.recent_5_games || []).join(', '));

  // Away pitcher
  setVal('away_era', ap.era);
  setVal('away_whip', ap.whip);
  setVal('away_fip', ap.fip);
  setVal('away_xera', ap.xera);
  setVal('away_k9', ap.k9);
  setVal('away_bb9', ap.bb9);
  setVal('away_rest_days', ap.rest_days);
  setVal('away_handedness', ap.handedness);
  setVal('away_pitcher_away_era', ap.away_era);
  setVal('away_pitcher_vs_opp_era', ap.vs_opponent_era);
  setVal('away_pitcher_vs_opp_games', ap.vs_opponent_games);
  setVal('away_vs_lhb_ops', ap.vs_lhb_ops);
  setVal('away_vs_rhb_ops', ap.vs_rhb_ops);
  setVal('away_recent_5_games', (ap.recent_5_games || []).join(', '));

  // Home bullpen
  setVal('home_bullpen_era', hb.era);
  setVal('home_bullpen_7ip', hb.last_7_days_ip);
  setVal('home_bullpen_3ip', hb.last_3_days_ip);
  setVal('home_bullpen_consec', hb.consecutive_days);
  setVal('home_closer_available', hb.closer_available ? 'true' : 'false');
  setVal('home_setup_fatigued', hb.setup_fatigued ? 'true' : 'false');

  // Away bullpen
  setVal('away_bullpen_era', ab.era);
  setVal('away_bullpen_7ip', ab.last_7_days_ip);
  setVal('away_bullpen_3ip', ab.last_3_days_ip);
  setVal('away_bullpen_consec', ab.consecutive_days);
  setVal('away_closer_available', ab.closer_available ? 'true' : 'false');
  setVal('away_setup_fatigued', ab.setup_fatigued ? 'true' : 'false');

  // Home team stats
  setVal('home_ops', hs.ops);
  setVal('home_wrc_plus', hs.wrc_plus);
  setVal('home_slg', hs.slg);
  setVal('home_obp', hs.obp);
  setVal('home_last_5', hs.last_5_record);
  setVal('home_last_10', hs.last_10_record);
  setVal('home_last_20', hs.last_20_record);
  setVal('home_fielding_pct', hs.fielding_pct);
  setVal('home_drs', hs.drs);
  setVal('home_uzr', hs.uzr);

  // Away team stats
  setVal('away_ops', as_.ops);
  setVal('away_wrc_plus', as_.wrc_plus);
  setVal('away_slg', as_.slg);
  setVal('away_obp', as_.obp);
  setVal('away_last_5', as_.last_5_record);
  setVal('away_last_10', as_.last_10_record);
  setVal('away_last_20', as_.last_20_record);
  setVal('away_fielding_pct', as_.fielding_pct);
  setVal('away_drs', as_.drs);
  setVal('away_uzr', as_.uzr);

  // Odds
  setVal('home_ml', odds.home_ml);
  setVal('away_ml', odds.away_ml);
  setVal('open_line', odds.open_line);
  setVal('current_line', odds.current_line);
  setVal('open_total', odds.open_total);
  setVal('current_total', odds.current_total);
  setVal('bankroll', betting.bankroll);
  setVal('your_odds', betting.your_odds);

  // Open form panel and scroll
  openFormPanel();
  const sec = document.getElementById('analysis-form-section');
  if (sec) sec.scrollIntoView({ behavior: 'smooth' });

  showToast('範例資料已載入 (阪神 vs 巨人 @ 甲子園)', 'success');

  // Auto-run analysis after short delay
  setTimeout(() => submitAnalysis(), 500);
}

// ─── Collect Form Data ────────────────────────────────────────────────────────
function collectFormData() {
  function fval(id, def = 0) {
    const el = document.getElementById(id);
    if (!el) return def;
    const v = parseFloat(el.value);
    return isNaN(v) ? def : v;
  }
  function sval(id, def = '') {
    const el = document.getElementById(id);
    return el ? el.value : def;
  }
  function bval(id, def = false) {
    const el = document.getElementById(id);
    return el ? el.value === 'true' : def;
  }
  function parseCSV(str) {
    return (str || '').split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  }

  const homeTeam = sval('home_team', '主隊');
  const awayTeam = sval('away_team', '客隊');

  return {
    game_info: {
      home_team: homeTeam,
      away_team: awayTeam,
      stadium: sval('stadium', '甲子園'),
      datetime: sval('datetime', '2024-07-20 18:00'),
      is_day_game: bval('is_day_game'),
      park_factor: fval('park_factor', 1.0),
      hr_factor: fval('hr_factor', 1.0),
      scoring_factor: fval('scoring_factor', 1.0),
      turf_type: sval('turf_type', 'natural'),
      temperature: fval('temperature', 20),
      humidity: fval('humidity', 60),
      rain_pct: fval('rain_pct', 10),
      wind_direction: sval('wind_direction', 'none'),
      wind_speed_kmh: fval('wind_speed_kmh', 0),
      is_travel_game: bval('is_travel_game'),
      consecutive_away_games: fval('consecutive_away_games', 0),
      consecutive_games_played: fval('consecutive_games_played', 0),
      days_since_last_game: fval('days_since_last_game', 1),
    },
    home_pitcher: {
      era: fval('home_era', 4.00),
      whip: fval('home_whip', 1.30),
      fip: fval('home_fip', 4.00),
      xera: fval('home_xera', 4.00),
      k9: fval('home_k9', 7.0),
      bb9: fval('home_bb9', 3.0),
      rest_days: fval('home_rest_days', 5),
      handedness: sval('home_handedness', 'R'),
      home_era: fval('home_pitcher_home_era', 4.00),
      away_era: fval('home_pitcher_home_era', 4.00),
      vs_opponent_era: fval('home_pitcher_vs_opp_era', 0),
      vs_opponent_games: fval('home_pitcher_vs_opp_games', 0),
      vs_lhb_ops: fval('home_vs_lhb_ops', 0.720),
      vs_rhb_ops: fval('home_vs_rhb_ops', 0.720),
      recent_5_games: parseCSV(sval('home_recent_5_games', '')),
    },
    away_pitcher: {
      era: fval('away_era', 4.00),
      whip: fval('away_whip', 1.30),
      fip: fval('away_fip', 4.00),
      xera: fval('away_xera', 4.00),
      k9: fval('away_k9', 7.0),
      bb9: fval('away_bb9', 3.0),
      rest_days: fval('away_rest_days', 5),
      handedness: sval('away_handedness', 'R'),
      home_era: fval('away_pitcher_away_era', 4.00),
      away_era: fval('away_pitcher_away_era', 4.00),
      vs_opponent_era: fval('away_pitcher_vs_opp_era', 0),
      vs_opponent_games: fval('away_pitcher_vs_opp_games', 0),
      vs_lhb_ops: fval('away_vs_lhb_ops', 0.720),
      vs_rhb_ops: fval('away_vs_rhb_ops', 0.720),
      recent_5_games: parseCSV(sval('away_recent_5_games', '')),
    },
    home_bullpen: {
      era: fval('home_bullpen_era', 4.00),
      last_7_days_ip: fval('home_bullpen_7ip', 5.0),
      last_3_days_ip: fval('home_bullpen_3ip', 2.0),
      consecutive_days: fval('home_bullpen_consec', 0),
      closer_available: bval('home_closer_available', true),
      setup_fatigued: bval('home_setup_fatigued', false),
      save_opportunities: 15,
      blown_saves: 3,
      holds: 30,
    },
    away_bullpen: {
      era: fval('away_bullpen_era', 4.00),
      last_7_days_ip: fval('away_bullpen_7ip', 5.0),
      last_3_days_ip: fval('away_bullpen_3ip', 2.0),
      consecutive_days: fval('away_bullpen_consec', 0),
      closer_available: bval('away_closer_available', true),
      setup_fatigued: bval('away_setup_fatigued', false),
      save_opportunities: 15,
      blown_saves: 3,
      holds: 30,
    },
    home_team_stats: {
      ops: fval('home_ops', 0.720),
      wrc_plus: fval('home_wrc_plus', 100),
      slg: fval('home_slg', 0.380),
      obp: fval('home_obp', 0.320),
      runs_scored_last_10: [4,5,3,6,4,5,3,4,5,4],
      vs_lhp_ops: fval('home_ops', 0.720),
      vs_rhp_ops: fval('home_ops', 0.720),
      fielding_pct: fval('home_fielding_pct', 0.982),
      drs: fval('home_drs', 0),
      uzr: fval('home_uzr', 0),
      catcher_cs_pct: 0.30,
      error_rate: 0.020,
      last_5_record: sval('home_last_5', '3-2'),
      last_10_record: sval('home_last_10', '5-5'),
      last_20_record: sval('home_last_20', '10-10'),
      team_ops_trend: 0,
      team_era_trend: 0,
    },
    away_team_stats: {
      ops: fval('away_ops', 0.720),
      wrc_plus: fval('away_wrc_plus', 100),
      slg: fval('away_slg', 0.380),
      obp: fval('away_obp', 0.320),
      runs_scored_last_10: [4,3,5,3,4,5,3,4,3,4],
      vs_lhp_ops: fval('away_ops', 0.720),
      vs_rhp_ops: fval('away_ops', 0.720),
      fielding_pct: fval('away_fielding_pct', 0.982),
      drs: fval('away_drs', 0),
      uzr: fval('away_uzr', 0),
      catcher_cs_pct: 0.28,
      error_rate: 0.022,
      last_5_record: sval('away_last_5', '3-2'),
      last_10_record: sval('away_last_10', '5-5'),
      last_20_record: sval('away_last_20', '10-10'),
      team_ops_trend: 0,
      team_era_trend: 0,
    },
    odds: {
      open_line: fval('open_line', -1.5),
      current_line: fval('current_line', -1.5),
      open_total: fval('open_total', 7.5),
      current_total: fval('current_total', 7.5),
      home_ml: fval('home_ml', 1.90),
      away_ml: fval('away_ml', 1.90),
    },
    betting: {
      your_odds: fval('your_odds', 1.90),
      bankroll: fval('bankroll', 10000),
      open_odds: fval('home_ml', 1.90),
      close_odds: fval('home_ml', 1.90),
    },
  };
}

// ─── Submit Analysis ──────────────────────────────────────────────────────────
function submitAnalysis() {
  const data = collectFormData();
  runAnalysis(data);
}

// ─── Run Analysis ─────────────────────────────────────────────────────────────
function runAnalysis(data) {
  showLoading('AI 正在分析中...');

  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    try {
      const gi = data.game_info;
      const hp = data.home_pitcher;
      const ap = data.away_pitcher;
      const hb = data.home_bullpen;
      const ab = data.away_bullpen;
      const hts = data.home_team_stats;
      const ats = data.away_team_stats;
      const oddsData = data.odds;
      const bettingData = data.betting;

      // Run all analyzers
      const homePitcher = analyzePitcher(hp);
      const awayPitcher = analyzePitcher(ap);
      const homeBullpen = analyzeBullpen(hb);
      const awayBullpen = analyzeBullpen(ab);
      const homeLineup = analyzeLineup(hts, ap);
      const awayLineup = analyzeLineup(ats, hp);
      const homeDefense = analyzeDefense(hts);
      const awayDefense = analyzeDefense(ats);
      const park = analyzePark(gi);
      const weather = analyzeWeather(gi);
      const homeForm = analyzeForm(hts);
      const awayForm = analyzeForm(ats);
      const homeSchedule = analyzeSchedule(gi);

      // Away schedule (away team traveling)
      const awayGI = Object.assign({}, gi, {
        is_travel_game: true,
        consecutive_away_games: gi.consecutive_away_games || 4,
      });
      const awaySchedule = analyzeSchedule(awayGI);

      // Win probability (pre-odds)
      const winModel = calculateWinProbability(
        {
          pitcher_score: homePitcher.score,
          bullpen_score: homeBullpen.score,
          lineup_score: homeLineup.score,
          defense_score: homeDefense.score,
          form_score: homeForm.form_score,
          fatigue_score: homeSchedule.fatigue_score,
          park_adjustment: park.run_adjustment,
        },
        {
          pitcher_score: awayPitcher.score,
          bullpen_score: awayBullpen.score,
          lineup_score: awayLineup.score,
          defense_score: awayDefense.score,
          form_score: awayForm.form_score,
          fatigue_score: awaySchedule.fatigue_score,
          park_adjustment: 1.0,
        }
      );

      // Odds analysis
      const oddsAnalysis = analyzeOdds(
        oddsData.open_line,
        oddsData.current_line,
        oddsData.open_total,
        oddsData.current_total,
        oddsData.home_ml,
        oddsData.away_ml,
        winModel.home_win_prob
      );

      // Totals model
      const totals = predictTotalRuns(homeLineup, awayLineup, homePitcher, awayPitcher, park, weather);

      // Monte Carlo (10,000 simulations)
      const mc = runMonteCarlo(winModel.home_win_prob, totals.predicted_total, 1.8, 10000);

      // ELO
      const homeElo = getTeamElo(gi.home_team);
      const awayElo = getTeamElo(gi.away_team);
      const elo = calculateEloWinProb(homeElo, awayElo, 35);

      // Kelly
      const homeKelly = kellyCriterion(winModel.home_win_prob, oddsData.home_ml, bettingData.bankroll, 0.25);
      const awayKelly = kellyCriterion(winModel.away_win_prob, oddsData.away_ml, bettingData.bankroll, 0.25);

      // CLV
      const homeCLV = calculateCLV(bettingData.open_odds, bettingData.close_odds, bettingData.your_odds);
      const awayCLV = calculateCLV(bettingData.open_odds * 1.05, bettingData.close_odds * 1.05, bettingData.your_odds * 1.05);

      // Bet Score
      const impliedHome = oddsData.home_ml > 0 ? 1.0 / oddsData.home_ml : 0.5;
      const edge = winModel.home_win_prob - impliedHome;
      const mcConfidence = Math.max(0, Math.min(1, 1.0 - mc.std_dev_result / 5.0));
      const sharpScore = oddsAnalysis.sharp_lean === 'home' ? 1.0 : 0.5;

      const betScore = calculateBetScore({
        win_prob_edge: edge,
        kelly_pct: (homeKelly.kelly_pct || 0) / 100.0,
        clv_value: homeCLV.clv_value || 0,
        model_confidence: mcConfidence,
        line_value: Math.min(1.0, Math.max(0.0, 0.5 + edge * 5)),
        sharp_lean_score: sharpScore,
      });

      // Final recommendation
      const finalRec = generateFinalRecommendation(winModel, totals, betScore, oddsAnalysis);

      // Render results
      const result = {
        game_info: gi,
        home_pitcher: homePitcher,
        away_pitcher: awayPitcher,
        home_bullpen: homeBullpen,
        away_bullpen: awayBullpen,
        home_lineup: homeLineup,
        away_lineup: awayLineup,
        home_defense: homeDefense,
        away_defense: awayDefense,
        park,
        weather,
        home_form: homeForm,
        away_form: awayForm,
        home_schedule: homeSchedule,
        away_schedule: awaySchedule,
        odds: oddsAnalysis,
        win_probability: winModel,
        totals,
        monte_carlo: mc,
        elo,
        home_kelly: homeKelly,
        away_kelly: awayKelly,
        home_clv: homeCLV,
        away_clv: awayCLV,
        bet_score: betScore,
        final_rec: finalRec,
        star_rating: finalRec.star_rating,
        home_elo: homeElo,
        away_elo: awayElo,
        raw_odds: oddsData,
        raw_betting: bettingData,
      };

      hideLoading();
      renderResults(result);
    } catch (err) {
      hideLoading();
      console.error('Analysis error:', err);
      showToast('分析發生錯誤: ' + err.message, 'error');
    }
  }, 50);
}

// ─── Render Results ───────────────────────────────────────────────────────────
function renderResults(r) {
  const sec = document.getElementById('results-section');
  if (!sec) return;
  sec.style.display = 'block';

  const gi = r.game_info;
  const homeTeam = gi.home_team;
  const awayTeam = gi.away_team;

  // Match header
  const homeEl = sec.querySelector('.match-team.home');
  const awayEl = sec.querySelector('.match-team.away');
  if (homeEl) homeEl.textContent = homeTeam;
  if (awayEl) awayEl.textContent = awayTeam;

  const stadiumEl = sec.querySelector('.match-stadium');
  const dtEl = sec.querySelector('.match-datetime');
  const dnEl = sec.querySelector('.match-day-night');
  if (stadiumEl) stadiumEl.textContent = gi.stadium;
  if (dtEl) dtEl.textContent = gi.datetime;
  if (dnEl) dnEl.textContent = gi.is_day_game ? '日場' : '夜場';

  // Win gauges
  const homeProb = r.win_probability.home_win_prob;
  const awayProb = r.win_probability.away_win_prob;
  animateGauge('win-gauge-fill-home', homeProb);
  animateGauge('win-gauge-fill-away', awayProb);
  setText('win-gauge-pct-home', `${(homeProb * 100).toFixed(1)}%`);
  setText('win-gauge-pct-away', `${(awayProb * 100).toFixed(1)}%`);
  setText('win-gauge-team-home', homeTeam);
  setText('win-gauge-team-away', awayTeam);
  setText('win-gauge-composite-home', `複合分: ${r.win_probability.home_composite_score.toFixed(1)}`);

  // Bet score dial
  drawBetScoreDial(r.bet_score.bet_score);
  setText('dial-score-num', r.bet_score.bet_score.toFixed(1));
  const dialNumEl = document.getElementById('dial-score-num');
  if (dialNumEl) dialNumEl.style.color = betScoreColor(r.bet_score.bet_score);
  setText('dial-grade', r.bet_score.grade);

  // Star rating display
  renderStars('star-rating-display', r.bet_score.star_rating);
  setText('rec-text', r.bet_score.recommendation);

  // Score bars overview
  renderScoreBar('pitcher-bar', r.home_pitcher.score, r.away_pitcher.score);
  renderScoreBar('bullpen-bar', r.home_bullpen.score, r.away_bullpen.score);
  renderScoreBar('lineup-bar', r.home_lineup.score, r.away_lineup.score);
  renderScoreBar('defense-bar', r.home_defense.score, r.away_defense.score);
  renderScoreBar('form-bar', r.home_form.form_score, r.away_form.form_score);

  // Pitcher card
  setText('pitcher-home-team', homeTeam);
  setText('pitcher-away-team', awayTeam);
  setText('pitcher-home-score', r.home_pitcher.score.toFixed(1));
  setText('pitcher-away-score', r.away_pitcher.score.toFixed(1));
  setText('pitcher-home-stats', `ERA ${r.home_pitcher.era.toFixed(2)} / WHIP ${r.home_pitcher.whip.toFixed(2)} / K9 ${r.home_pitcher.k9.toFixed(1)}`);
  setText('pitcher-away-stats', `ERA ${r.away_pitcher.era.toFixed(2)} / WHIP ${r.away_pitcher.whip.toFixed(2)} / K9 ${r.away_pitcher.k9.toFixed(1)}`);
  renderNotes('pitcher-notes', [...r.home_pitcher.notes.slice(0, 3), ...r.away_pitcher.notes.slice(0, 3)]);

  // Bullpen card
  setText('bullpen-home-era', r.home_bullpen.era.toFixed(2));
  setText('bullpen-away-era', r.away_bullpen.era.toFixed(2));
  setText('bullpen-home-fatigue', `${r.home_bullpen.fatigue_level.toFixed(0)}%`);
  setText('bullpen-away-fatigue', `${r.away_bullpen.fatigue_level.toFixed(0)}%`);
  setText('bullpen-home-closer', r.home_bullpen.closer_available ? '✓ 可用' : '✗ 不可用');
  setText('bullpen-away-closer', r.away_bullpen.closer_available ? '✓ 可用' : '✗ 不可用');
  const hCloserEl = document.getElementById('bullpen-home-closer');
  const aCloserEl = document.getElementById('bullpen-away-closer');
  if (hCloserEl) hCloserEl.style.color = r.home_bullpen.closer_available ? 'var(--success)' : 'var(--danger)';
  if (aCloserEl) aCloserEl.style.color = r.away_bullpen.closer_available ? 'var(--success)' : 'var(--danger)';

  // Lineup card
  setText('lineup-home-re', r.home_lineup.run_expectancy.toFixed(2) + ' 分');
  setText('lineup-away-re', r.away_lineup.run_expectancy.toFixed(2) + ' 分');
  setText('lineup-home-wrc', r.home_lineup.wrc_plus);
  setText('lineup-away-wrc', r.away_lineup.wrc_plus);

  // Park card
  const parkTypeMap = { hitter_friendly: '打者友好', pitcher_friendly: '投手友好', neutral: '中性球場' };
  setText('park-type', parkTypeMap[r.park.park_type] || r.park.park_type);
  setText('park-factor', r.park.park_factor.toFixed(3));
  setText('park-hr-factor', r.park.hr_factor.toFixed(3));
  setText('park-run-adj', `×${r.park.run_adjustment.toFixed(3)}`);
  renderNotes('park-notes', r.park.notes.slice(0, 3));

  // Weather card
  const weatherImpactEl = document.getElementById('weather-hr-impact');
  if (weatherImpactEl) {
    const hrImp = r.weather.hr_impact;
    weatherImpactEl.textContent = `×${hrImp.toFixed(3)}`;
    weatherImpactEl.style.color = hrImp > 1 ? 'var(--danger)' : hrImp < 1 ? 'var(--success)' : 'var(--text-primary)';
  }
  setText('weather-run-impact', `×${r.weather.run_impact.toFixed(3)}`);
  const pitcherImpactMap = { favorable: '有利投手', unfavorable: '不利投手', neutral: '中性' };
  setText('weather-pitcher-impact', pitcherImpactMap[r.weather.pitcher_impact] || r.weather.pitcher_impact);
  setText('weather-temp', `${r.weather.temperature.toFixed(0)}°C`);
  setText('weather-rain', `${r.weather.rain_pct.toFixed(0)}%`);
  setText('weather-wind', `${r.weather.wind_speed_kmh.toFixed(0)} km/h ${r.weather.wind_direction || ''}`);
  renderNotes('weather-notes', r.weather.notes.slice(0, 3));

  // Form card
  renderFormTrend('form-home-trend', r.home_form.trend, r.home_form.trend_text);
  renderFormTrend('form-away-trend', r.away_form.trend, r.away_form.trend_text);
  setText('form-home-records', `近5場: ${r.home_form.last_5_record} | 近10場: ${r.home_form.last_10_record} | 近20場: ${r.home_form.last_20_record}`);
  setText('form-away-records', `近5場: ${r.away_form.last_5_record} | 近10場: ${r.away_form.last_10_record} | 近20場: ${r.away_form.last_20_record}`);

  // Schedule card
  renderFatigueBar('schedule-home-bar', r.home_schedule.fatigue_score, r.home_schedule.fatigue_text);
  renderFatigueBar('schedule-away-bar', r.away_schedule.fatigue_score, r.away_schedule.fatigue_text);

  // Odds card
  setText('odds-value-bet', r.odds.value_bet_exists ? `✓ ${r.odds.value_details}` : '無顯著價值投注');
  const oddsValueEl = document.getElementById('odds-value-bet');
  if (oddsValueEl) oddsValueEl.style.color = r.odds.value_bet_exists ? 'var(--success)' : 'var(--text-muted)';
  const sharpMap = { home: `主隊 (${homeTeam})`, away: `客隊 (${awayTeam})`, none: '方向不明' };
  setText('odds-sharp-lean', sharpMap[r.odds.sharp_lean] || r.odds.sharp_lean);
  setText('odds-steam', r.odds.steam_move ? '✓ 蒸汽移動偵測' : '無蒸汽移動');
  const steamEl = document.getElementById('odds-steam');
  if (steamEl) steamEl.style.color = r.odds.steam_move ? 'var(--warning)' : 'var(--text-muted)';
  setText('odds-home-impl', `${(r.odds.home_implied_prob * 100).toFixed(1)}%`);
  setText('odds-away-impl', `${(r.odds.away_implied_prob * 100).toFixed(1)}%`);
  renderNotes('odds-notes', r.odds.notes.slice(0, 3));

  // Totals card
  setText('totals-predicted', r.totals.predicted_total.toFixed(2));
  const ouLeanEl = document.getElementById('totals-ou-lean');
  if (ouLeanEl) {
    ouLeanEl.textContent = r.totals.over_under_text;
    ouLeanEl.style.color = r.totals.over_under_lean === 'over' ? 'var(--danger)' : r.totals.over_under_lean === 'under' ? 'var(--success)' : 'var(--warning)';
  }
  setText('totals-home-runs', r.totals.predicted_home_runs.toFixed(2) + ' 分');
  setText('totals-away-runs', r.totals.predicted_away_runs.toFixed(2) + ' 分');

  // ELO / Kelly / CLV card
  setText('elo-home-prob', `${(r.elo.home_win_prob * 100).toFixed(1)}%`);
  setText('elo-away-prob', `${(r.elo.away_win_prob * 100).toFixed(1)}%`);
  setText('elo-home-elo', r.home_elo.toFixed(0));
  setText('elo-away-elo', r.away_elo.toFixed(0));
  setText('elo-diff', `${r.elo.elo_diff >= 0 ? '+' : ''}${r.elo.elo_diff.toFixed(0)}`);
  setText('kelly-home-pct', `${(r.home_kelly.kelly_pct || 0).toFixed(1)}%`);
  setText('kelly-away-pct', `${(r.away_kelly.kelly_pct || 0).toFixed(1)}%`);
  setText('kelly-home-frac', `${(r.home_kelly.fractional_kelly_pct || 0).toFixed(1)}%`);
  setText('kelly-away-frac', `${(r.away_kelly.fractional_kelly_pct || 0).toFixed(1)}%`);
  setText('kelly-home-amt', `¥${(r.home_kelly.bet_amount || 0).toFixed(0)}`);
  setText('kelly-away-amt', `¥${(r.away_kelly.bet_amount || 0).toFixed(0)}`);
  const homeCLVPct = r.home_clv.clv_pct || 0;
  const awayCLVPct = r.away_clv.clv_pct || 0;
  setText('clv-home', `${homeCLVPct >= 0 ? '+' : ''}${homeCLVPct.toFixed(1)}% (${r.home_clv.quality_grade || 'C'})`);
  setText('clv-away', `${awayCLVPct >= 0 ? '+' : ''}${awayCLVPct.toFixed(1)}% (${r.away_clv.quality_grade || 'C'})`);

  // Top 3 scores
  renderTop3Scores(r.totals.top3_scores);

  // Monte Carlo stats
  setText('mc-home-win', `${r.monte_carlo.home_win_pct.toFixed(1)}%`);
  setText('mc-away-win', `${r.monte_carlo.away_win_pct.toFixed(1)}%`);
  setText('mc-mean-total', r.monte_carlo.mean_total.toFixed(2));
  setText('mc-over', `${r.monte_carlo.over_pct.toFixed(1)}%`);
  setText('mc-under', `${r.monte_carlo.under_pct.toFixed(1)}%`);
  setText('mc-ci', r.monte_carlo.confidence_interval_95);

  // Monte Carlo chart
  renderMonteCarloChart(r.monte_carlo);

  // Final recommendation
  setText('rec-winner', r.final_rec.winner);
  setText('rec-spread', r.final_rec.spread);
  setText('rec-total', r.totals.over_under_text.split(' — ')[0] || r.final_rec.total);
  setText('rec-home-prob', `${(r.win_probability.home_win_prob * 100).toFixed(1)}%`);
  setText('rec-away-prob', `${(r.win_probability.away_win_prob * 100).toFixed(1)}%`);
  setText('rec-reasoning', r.final_rec.reasoning);
  renderStars('star-rating-rec', r.final_rec.star_rating);

  // Glow effect on recommendation box
  const recBox = sec.querySelector('.recommendation-box');
  if (recBox) {
    if (r.final_rec.star_rating >= 4) {
      recBox.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.4), 0 0 60px rgba(245, 158, 11, 0.2)';
      recBox.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    } else {
      recBox.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.4)';
      recBox.style.borderColor = 'rgba(0, 212, 255, 0.3)';
    }
  }

  // Scroll to results
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Helper: setText ──────────────────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ─── Animate Win Gauge ────────────────────────────────────────────────────────
function animateGauge(id, prob) {
  const el = document.getElementById(id);
  if (!el) return;
  const circumference = 2 * Math.PI * 60; // r=60
  const offset = circumference * (1 - prob);
  requestAnimationFrame(() => {
    el.style.strokeDashoffset = offset;
  });
}

// ─── Draw Bet Score Dial (Canvas) ─────────────────────────────────────────────
function drawBetScoreDial(score) {
  const canvas = document.getElementById('bet-score-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const W = 220, H = 130;
  const cx = W / 2, cy = H - 10;
  const r = 105;
  ctx.clearRect(0, 0, W, H);

  // Draw background arc zones (semi-circle: Math.PI to 2*Math.PI)
  const zones = [
    { from: 0, to: 0.4, color: '#ef4444' },   // 0-40: red
    { from: 0.4, to: 0.6, color: '#f59e0b' },  // 40-60: yellow
    { from: 0.6, to: 0.8, color: '#00d4ff' },  // 60-80: cyan
    { from: 0.8, to: 1.0, color: '#10b981' },  // 80-100: green
  ];

  zones.forEach(z => {
    const startAngle = Math.PI + z.from * Math.PI;
    const endAngle = Math.PI + z.to * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = z.color + '40';
    ctx.lineWidth = 18;
    ctx.stroke();
  });

  // Track arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 20;
  ctx.stroke();

  // Fill arc (animated via setTimeout)
  const fillAngle = Math.PI + (score / 100) * Math.PI;
  const color = betScoreColor(score);

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, fillAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Needle
  const needleAngle = Math.PI + (score / 100) * Math.PI;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(
    cx + (r - 20) * Math.cos(needleAngle),
    cy + (r - 20) * Math.sin(needleAngle)
  );
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Scale labels
  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('0', cx - r + 5, cy + 14);
  ctx.fillText('50', cx, cy - r + 14);
  ctx.fillText('100', cx + r - 5, cy + 14);
}

function betScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#00d4ff';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

// ─── Render Stars ─────────────────────────────────────────────────────────────
function renderStars(containerId, rating) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = i <= rating ? 'star lit' : 'star';
    star.textContent = '★';
    star.style.fontSize = '2.5rem';
    if (i <= rating) {
      star.style.color = '#f59e0b';
      star.style.filter = 'drop-shadow(0 0 8px #f59e0b)';
    } else {
      star.style.color = 'var(--text-muted)';
    }
    el.appendChild(star);
  }
}

// ─── Render Score Bar ─────────────────────────────────────────────────────────
function renderScoreBar(containerId, homeScore, awayScore) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const homeValEl = el.querySelector('.home-val');
  const awayValEl = el.querySelector('.away-val');
  const homeFillEl = el.querySelector('.home-fill');
  const awayFillEl = el.querySelector('.away-fill');

  if (homeValEl) homeValEl.textContent = homeScore.toFixed(1);
  if (awayValEl) awayValEl.textContent = awayScore.toFixed(1);

  // Animate bars
  requestAnimationFrame(() => {
    if (homeFillEl) homeFillEl.style.width = `${homeScore}%`;
    if (awayFillEl) awayFillEl.style.width = `${awayScore}%`;
  });
}

// ─── Render Form Trend Badge ──────────────────────────────────────────────────
function renderFormTrend(id, trend, trendText) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'pill';
  if (trend === 'hot') {
    el.classList.add('pill-hot');
    el.textContent = '🔥 ' + trendText;
  } else if (trend === 'cold') {
    el.classList.add('pill-cold');
    el.textContent = '❄️ ' + trendText;
  } else {
    el.classList.add('pill-neutral');
    el.textContent = '➡️ ' + trendText;
  }
}

// ─── Render Fatigue Bar ───────────────────────────────────────────────────────
function renderFatigueBar(containerId, fatigueScore, fatigueText) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const labelEl = el.querySelector('.fatigue-label');
  const valEl = el.querySelector('.fatigue-val');
  const fillEl = el.querySelector('.fatigue-fill');
  if (labelEl) labelEl.textContent = fatigueText || '';
  if (valEl) valEl.textContent = `${fatigueScore.toFixed(0)}%`;
  if (fillEl) {
    requestAnimationFrame(() => { fillEl.style.width = `${fatigueScore}%`; });
    // Color by severity
    if (fatigueScore >= 60) fillEl.style.background = 'linear-gradient(90deg, var(--danger), #ff6b6b)';
    else if (fatigueScore >= 40) fillEl.style.background = 'linear-gradient(90deg, var(--warning), #fbbf24)';
    else fillEl.style.background = 'linear-gradient(90deg, var(--success), #34d399)';
  }
}

// ─── Render Notes List ────────────────────────────────────────────────────────
function renderNotes(id, notes) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  (notes || []).slice(0, 5).forEach(note => {
    const li = document.createElement('li');
    li.textContent = note;
    el.appendChild(li);
  });
}

// ─── Render Top 3 Scores ──────────────────────────────────────────────────────
function renderTop3Scores(scores) {
  const el = document.getElementById('top3-scores');
  if (!el) return;
  el.innerHTML = '';
  const ranks = ['最可能', '第二', '第三'];
  (scores || []).slice(0, 3).forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'score-pred-card';
    card.innerHTML = `
      <div class="score-pred-rank">${ranks[i] || '#' + (i+1)}</div>
      <div class="score-pred-val">${s.home_score}-${s.away_score}</div>
      <div class="score-pred-prob">機率 ${s.probability_pct.toFixed(1)}%</div>
    `;
    el.appendChild(card);
  });
}

// ─── Monte Carlo Chart ────────────────────────────────────────────────────────
let mcChart = null;
function renderMonteCarloChart(mc) {
  const canvas = document.getElementById('mc-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (mcChart) { mcChart.destroy(); mcChart = null; }

  const dist = mc.score_distribution || [];
  const labels = dist.map(d => d.score);
  const values = dist.map(d => d.pct);
  const colors = dist.map(d => d.home_favored ? 'rgba(0, 212, 255, 0.7)' : 'rgba(124, 58, 237, 0.7)');
  const borderColors = dist.map(d => d.home_favored ? '#00d4ff' : '#7c3aed');

  mcChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '比分機率 (%)',
        data: values,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y.toFixed(1)}% (${Math.round(ctx.parsed.y * mc.n_simulations / 100)} 次)`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => v + '%' },
          beginAtZero: true,
        },
      },
    },
  });
}

// ─── Loading State ────────────────────────────────────────────────────────────
function showLoading(msg) {
  const overlay = document.getElementById('loading-overlay');
  const textEl = overlay && overlay.querySelector('.loading-text');
  if (overlay) overlay.classList.add('active');
  if (textEl) textEl.textContent = msg || 'AI 正在分析中...';
}
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('notice-container');
  if (!container) return;
  const typeMap = { info: 'notice-info', success: 'notice-success', error: 'notice-error', warn: 'notice-warn' };
  const iconMap = { info: 'fa-circle-info', success: 'fa-circle-check', error: 'fa-circle-exclamation', warn: 'fa-triangle-exclamation' };
  const notice = document.createElement('div');
  notice.className = `notice ${typeMap[type] || 'notice-info'}`;
  notice.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.info}"></i><span>${msg}</span>`;
  container.appendChild(notice);
  setTimeout(() => { notice.style.opacity = '0'; notice.style.transition = 'opacity 0.5s'; setTimeout(() => notice.remove(), 500); }, 4000);
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const activePane = document.getElementById(`tab-${tabName}`);
  if (activeBtn) activeBtn.classList.add('active');
  if (activePane) activePane.classList.add('active');
}

// ─── Form Panel Toggle ────────────────────────────────────────────────────────
function openFormPanel() {
  const body = document.getElementById('form-panel-body');
  const icon = document.querySelector('.toggle-icon');
  if (body) body.style.display = 'block';
  if (icon) icon.style.transform = 'rotate(180deg)';
}
function toggleFormPanel() {
  const body = document.getElementById('form-panel-body');
  const icon = document.querySelector('.toggle-icon');
  if (!body) return;
  const isVisible = body.style.display !== 'none';
  body.style.display = isVisible ? 'none' : 'block';
  if (icon) icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
}

// ─── Modal Management ─────────────────────────────────────────────────────────
function openApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) modal.classList.add('active');
  const input = document.getElementById('modal-api-key-input');
  if (input) input.value = getApiKey();
}
function closeApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) modal.classList.remove('active');
}
function saveApiKeyFromModal() {
  const input = document.getElementById('modal-api-key-input');
  const key = input ? input.value.trim() : '';
  if (key) {
    saveApiKey(key);
    closeApiKeyModal();
    showToast('API Key 已儲存，正在載入賠率...', 'success');
    loadOdds();
  } else {
    showToast('請輸入有效的 API Key', 'warn');
  }
}

// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLE_DATA = {
  game_info: {
    home_team: '阪神', away_team: '巨人', stadium: '甲子園',
    datetime: '2024-07-20 18:00', is_day_game: false,
    park_factor: 0.95, hr_factor: 0.85, scoring_factor: 0.93,
    turf_type: 'natural', temperature: 28, humidity: 72,
    rain_pct: 10, wind_direction: 'infield', wind_speed_kmh: 12,
    is_travel_game: false, consecutive_away_games: 4,
    consecutive_games_played: 6, days_since_last_game: 1,
  },
  home_pitcher: {
    era: 2.45, whip: 0.98, fip: 2.80, xera: 2.90,
    k9: 9.8, bb9: 2.1,
    recent_5_games: [1.8, 3.6, 2.0, 1.5, 2.7],
    home_era: 2.10, away_era: 2.85,
    day_era: 2.80, night_era: 2.20,
    vs_opponent_era: 2.15, vs_opponent_games: 8,
    vs_lhb_ops: 0.640, vs_rhb_ops: 0.680,
    pitch_count_limit: 100, rest_days: 6, handedness: 'R',
  },
  away_pitcher: {
    era: 3.85, whip: 1.22, fip: 3.70, xera: 3.95,
    k9: 7.2, bb9: 3.1,
    recent_5_games: [5.2, 3.1, 4.8, 3.6, 4.1],
    home_era: 3.40, away_era: 4.30,
    day_era: 4.10, night_era: 3.65,
    vs_opponent_era: 4.20, vs_opponent_games: 6,
    vs_lhb_ops: 0.720, vs_rhb_ops: 0.760,
    pitch_count_limit: 100, rest_days: 5, handedness: 'L',
  },
  home_bullpen: {
    era: 2.88, last_7_days_ip: 8.2, last_3_days_ip: 2.1,
    consecutive_days: 1, closer_available: true, setup_fatigued: false,
    save_opportunities: 18, blown_saves: 2, holds: 42,
  },
  away_bullpen: {
    era: 4.15, last_7_days_ip: 12.1, last_3_days_ip: 5.2,
    consecutive_days: 3, closer_available: false, setup_fatigued: true,
    save_opportunities: 15, blown_saves: 5, holds: 28,
  },
  home_team_stats: {
    ops: 0.768, wrc_plus: 112,
    runs_scored_last_10: [5, 3, 7, 4, 6, 5, 2, 8, 4, 6],
    slg: 0.410, obp: 0.348,
    vs_lhp_ops: 0.720, vs_rhp_ops: 0.780,
    fielding_pct: 0.988, drs: 12, uzr: 8.5,
    catcher_cs_pct: 0.38, error_rate: 0.014,
    last_5_record: '4-1', last_10_record: '7-3', last_20_record: '14-6',
    team_ops_trend: 0.025, team_era_trend: -0.15,
  },
  away_team_stats: {
    ops: 0.735, wrc_plus: 98,
    runs_scored_last_10: [3, 4, 5, 2, 6, 3, 4, 2, 5, 3],
    slg: 0.385, obp: 0.328,
    vs_lhp_ops: 0.750, vs_rhp_ops: 0.720,
    fielding_pct: 0.981, drs: 3, uzr: 1.2,
    catcher_cs_pct: 0.28, error_rate: 0.022,
    last_5_record: '2-3', last_10_record: '4-6', last_20_record: '9-11',
    team_ops_trend: -0.018, team_era_trend: 0.22,
  },
  odds: {
    open_line: -1.5, current_line: -1.8,
    open_total: 7.5, current_total: 7.0,
    home_ml: 1.72, away_ml: 2.15,
  },
  betting: {
    your_odds: 1.76, bankroll: 10000,
    open_odds: 1.78, close_odds: 1.72,
  },
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auto-load odds if API key exists
  if (getApiKey()) {
    loadOdds();
  } else {
    const container = document.getElementById('odds-cards-container');
    if (container) {
      container.innerHTML = `
        <div class="no-games-msg">
          <i class="fa-solid fa-key" style="margin-right:8px"></i>
          請先設定 API Key 以載入即時賠率
          <br><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="openApiKeyModal()">設定 API Key</button>
        </div>`;
    }
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Form panel toggle
  const header = document.getElementById('form-panel-header');
  if (header) header.addEventListener('click', toggleFormPanel);

  // Modal close on backdrop click
  const modal = document.getElementById('api-key-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeApiKeyModal();
    });
  }

  // Enter key in API modal
  const apiInput = document.getElementById('modal-api-key-input');
  if (apiInput) {
    apiInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveApiKeyFromModal();
    });
  }

  // Close loading on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeApiKeyModal(); hideLoading(); }
  });
});
