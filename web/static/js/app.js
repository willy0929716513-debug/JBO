/**
 * NPB AI 分析儀表板 — Frontend Logic
 * app.js
 */

'use strict';

// ── State ────────────────────────────────────────────────────
let mcChart = null;
let currentAnalysisData = null;

// ── DOM Helpers ──────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function qs(sel, ctx = document) { return ctx.querySelector(sel); }

// ── API Key Management ───────────────────────────────────────
function getApiKey() {
  return localStorage.getItem('npb_odds_api_key') || '';
}

function saveApiKey(key) {
  localStorage.setItem('npb_odds_api_key', key.trim());
}

function openApiKeyModal() {
  const modal = $('#api-key-modal');
  const input = $('#modal-api-key-input');
  input.value = getApiKey();
  modal.classList.add('active');
  setTimeout(() => input.focus(), 100);
}

function closeApiKeyModal() {
  $('#api-key-modal').classList.remove('active');
}

function saveApiKeyFromModal() {
  const input = $('#modal-api-key-input');
  const key = input.value.trim();
  if (!key) {
    showNotice('請輸入有效的 API Key', 'error');
    return;
  }
  saveApiKey(key);
  closeApiKeyModal();
  showNotice('API Key 已儲存', 'success');
  loadOdds();
}

// ── Loading Overlay ──────────────────────────────────────────
function showLoading(msg = 'AI 正在分析中...', sub = '請稍候，這可能需要幾秒鐘') {
  const overlay = $('#loading-overlay');
  qs('.loading-text', overlay).textContent = msg;
  qs('.loading-sub', overlay).textContent = sub;
  overlay.classList.add('active');
}

function hideLoading() {
  $('#loading-overlay').classList.remove('active');
}

// ── Notice / Toast ───────────────────────────────────────────
function showNotice(msg, type = 'info', duration = 4000) {
  const container = $('#notice-container');
  const icons = { info: 'fa-circle-info', success: 'fa-circle-check', warn: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };
  const div = document.createElement('div');
  div.className = `notice notice-${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warn' ? 'warn' : 'info'}`;
  div.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), duration);
}

// ── Live Odds Loading ────────────────────────────────────────
async function loadOdds() {
  const key = getApiKey();
  const section = $('#odds-section');
  const oddsContainer = $('#odds-cards-container');

  oddsContainer.innerHTML = '<div class="no-games-msg"><i class="fa-solid fa-rotate fa-spin" style="margin-right:8px"></i>載入賠率中...</div>';

  if (!key) {
    oddsContainer.innerHTML = `
      <div class="no-games-msg">
        <i class="fa-solid fa-key" style="color:var(--warning);margin-bottom:8px;display:block;font-size:1.5rem"></i>
        <p>請設定 Odds API Key 以查看即時賠率</p>
        <button class="btn btn-outline btn-sm mt-2" onclick="openApiKeyModal()">設定 API Key</button>
      </div>`;
    return;
  }

  try {
    const resp = await fetch(`/api/odds?api_key=${encodeURIComponent(key)}`);
    const data = await resp.json();

    if (!data.success) {
      oddsContainer.innerHTML = `
        <div class="no-games-msg">
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--warning);font-size:1.5rem;margin-bottom:8px;display:block"></i>
          <p>${data.error || '無法取得賠率資料'}</p>
        </div>`;
      return;
    }

    if (!data.games || data.games.length === 0) {
      oddsContainer.innerHTML = `
        <div class="no-games-msg">
          <i class="fa-solid fa-baseball" style="font-size:1.5rem;margin-bottom:8px;display:block;color:var(--text-muted)"></i>
          <p>目前沒有即時 NPB 賽事賠率</p>
          <p class="text-xs text-muted mt-1">NPB賽季可能尚未開始，或賠率商尚未提供盤口</p>
        </div>`;
      return;
    }

    renderOddsCards(data.games);

    if (data.requests_remaining !== '?') {
      const rem = document.createElement('div');
      rem.className = 'text-xs text-muted mt-2';
      rem.style.textAlign = 'right';
      rem.textContent = `API 剩餘請求次數: ${data.requests_remaining}`;
      oddsContainer.parentElement.appendChild(rem);
    }
  } catch (err) {
    oddsContainer.innerHTML = `
      <div class="no-games-msg">
        <p class="text-danger">無法連接 Odds API: ${err.message}</p>
      </div>`;
  }
}

function renderOddsCards(games) {
  const container = $('#odds-cards-container');
  container.innerHTML = '';

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'odds-card';

    const commenceTime = new Date(game.commence_time);
    const timeStr = commenceTime.toLocaleDateString('zh-TW', {
      month: 'short', day: 'numeric', weekday: 'short'
    }) + ' ' + commenceTime.toLocaleTimeString('zh-TW', {
      hour: '2-digit', minute: '2-digit'
    });

    // Extract h2h odds
    let homeOdds = '-', awayOdds = '-';
    let totalLine = '-', overOdds = '-', underOdds = '-';

    const h2h = game.bookmakers?.find(b => b.markets?.find(m => m.key === 'h2h'));
    if (h2h) {
      const market = h2h.markets.find(m => m.key === 'h2h');
      if (market) {
        const homeOut = market.outcomes.find(o => o.name === game.home_team);
        const awayOut = market.outcomes.find(o => o.name === game.away_team);
        if (homeOut) homeOdds = homeOut.price.toFixed(2);
        if (awayOut) awayOdds = awayOut.price.toFixed(2);
      }
    }

    // First bookmaker with h2h (fallback)
    if (homeOdds === '-' && game.bookmakers?.length > 0) {
      for (const bk of game.bookmakers) {
        const m = bk.markets?.find(m => m.key === 'h2h');
        if (m) {
          const homeOut = m.outcomes.find(o => o.name === game.home_team);
          const awayOut = m.outcomes.find(o => o.name === game.away_team);
          if (homeOut) homeOdds = homeOut.price.toFixed(2);
          if (awayOut) awayOdds = awayOut.price.toFixed(2);
          break;
        }
      }
    }

    const totalsBk = game.bookmakers?.find(b => b.markets?.find(m => m.key === 'totals'));
    if (totalsBk) {
      const tm = totalsBk.markets.find(m => m.key === 'totals');
      if (tm) {
        const over = tm.outcomes.find(o => o.name === 'Over');
        const under = tm.outcomes.find(o => o.name === 'Under');
        if (over) { totalLine = over.point; overOdds = over.price.toFixed(2); }
        if (under) { underOdds = under.price.toFixed(2); }
      }
    }

    card.innerHTML = `
      <div class="odds-card-time"><i class="fa-regular fa-clock"></i> ${timeStr}</div>
      <div class="team-vs">
        <div class="team-name home">${game.home_team}</div>
        <div class="vs-sep">VS</div>
        <div class="team-name away">${game.away_team}</div>
      </div>
      <div class="odds-row">
        <div class="odds-pill">
          <span class="odds-label">主隊賠率</span>
          <span class="odds-value">${homeOdds}</span>
        </div>
        <div class="odds-pill">
          <span class="odds-label">客隊賠率</span>
          <span class="odds-value" style="color:var(--purple)">${awayOdds}</span>
        </div>
      </div>
      <div class="odds-total">
        <i class="fa-solid fa-chart-line" style="color:var(--warning)"></i>
        大小分: <strong>${totalLine}</strong> &nbsp;
        大分: <strong>${overOdds}</strong> / 小分: <strong>${underOdds}</strong>
      </div>
      <button class="btn btn-outline btn-sm btn-full" onclick="prefillFromOdds(${JSON.stringify({
        home_team: game.home_team,
        away_team: game.away_team,
        home_ml: homeOdds !== '-' ? parseFloat(homeOdds) : 1.90,
        away_ml: awayOdds !== '-' ? parseFloat(awayOdds) : 1.90,
        current_total: totalLine !== '-' ? parseFloat(totalLine) : 7.5,
        datetime: game.commence_time,
      }).replace(/"/g, '&quot;')})">
        <i class="fa-solid fa-chart-bar"></i> 分析此場
      </button>
    `;

    container.appendChild(card);
  });
}

function prefillFromOdds(gameData) {
  // Fill basic info
  setVal('home_team', gameData.home_team);
  setVal('away_team', gameData.away_team);
  setVal('home_ml', gameData.home_ml);
  setVal('away_ml', gameData.away_ml);
  setVal('current_total', gameData.current_total);
  setVal('open_total', gameData.current_total);
  setVal('current_line', '-1.5');
  setVal('open_line', '-1.5');

  // Format datetime for input
  if (gameData.datetime) {
    const dt = new Date(gameData.datetime);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    const fmt = local.toISOString().slice(0, 16).replace('T', ' ');
    setVal('datetime', fmt);
  }

  // Scroll to form and expand it
  const form = $('#analysis-form-section');
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const body = $('#form-panel-body');
  body.style.display = 'block';

  showNotice(`已載入 ${gameData.home_team} vs ${gameData.away_team} 的賠率資料`, 'success');
}

function setVal(id, val) {
  const el = $(`#${id}`) || $(`[name="${id}"]`);
  if (el) el.value = val;
}

// ── Sample Data ──────────────────────────────────────────────
async function loadSampleData() {
  showLoading('載入範例資料中...', '正在從伺服器獲取阪神 vs 巨人範例');
  try {
    const resp = await fetch('/api/sample');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    fillFormWithData(data);
    hideLoading();
    showNotice('已載入範例資料：阪神 Tigers vs 巨人 Giants', 'success');
    // Auto expand form
    $('#form-panel-body').style.display = 'block';
    $('#analysis-form-section').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    hideLoading();
    showNotice(`載入範例資料失敗: ${err.message}`, 'error');
  }
}

function fillFormWithData(data) {
  const gi = data.game_info || {};
  const hp = data.home_pitcher || {};
  const ap = data.away_pitcher || {};
  const hb = data.home_bullpen || {};
  const ab = data.away_bullpen || {};
  const hts = data.home_team_stats || {};
  const ats = data.away_team_stats || {};
  const odds = data.odds || {};
  const betting = data.betting || {};

  // Game info
  setVal('home_team', gi.home_team || '');
  setVal('away_team', gi.away_team || '');
  setVal('stadium', gi.stadium || '');
  setVal('datetime', gi.datetime || '');
  setVal('is_day_game', gi.is_day_game ? 'true' : 'false');
  setVal('park_factor', gi.park_factor || 1.00);
  setVal('hr_factor', gi.hr_factor || 1.00);
  setVal('scoring_factor', gi.scoring_factor || 1.00);
  setVal('turf_type', gi.turf_type || 'natural');
  setVal('temperature', gi.temperature || 22);
  setVal('humidity', gi.humidity || 60);
  setVal('rain_pct', gi.rain_pct || 0);
  setVal('wind_direction', gi.wind_direction || 'none');
  setVal('wind_speed_kmh', gi.wind_speed_kmh || 0);
  setVal('is_travel_game', gi.is_travel_game ? 'true' : 'false');
  setVal('consecutive_away_games', gi.consecutive_away_games || 0);
  setVal('consecutive_games_played', gi.consecutive_games_played || 0);
  setVal('days_since_last_game', gi.days_since_last_game !== undefined ? gi.days_since_last_game : 1);

  // Home pitcher
  setVal('home_era', hp.era || '');
  setVal('home_whip', hp.whip || '');
  setVal('home_fip', hp.fip || '');
  setVal('home_xera', hp.xera || '');
  setVal('home_k9', hp.k9 || '');
  setVal('home_bb9', hp.bb9 || '');
  setVal('home_rest_days', hp.rest_days || 5);
  setVal('home_handedness', hp.handedness || 'R');
  setVal('home_pitcher_home_era', hp.home_era || '');
  setVal('home_pitcher_vs_opp_era', hp.vs_opponent_era || '');
  setVal('home_pitcher_vs_opp_games', hp.vs_opponent_games || 0);
  setVal('home_vs_lhb_ops', hp.vs_lhb_ops || '');
  setVal('home_vs_rhb_ops', hp.vs_rhb_ops || '');
  setVal('home_recent_5_games', (hp.recent_5_games || []).join(', '));

  // Away pitcher
  setVal('away_era', ap.era || '');
  setVal('away_whip', ap.whip || '');
  setVal('away_fip', ap.fip || '');
  setVal('away_xera', ap.xera || '');
  setVal('away_k9', ap.k9 || '');
  setVal('away_bb9', ap.bb9 || '');
  setVal('away_rest_days', ap.rest_days || 5);
  setVal('away_handedness', ap.handedness || 'R');
  setVal('away_pitcher_away_era', ap.away_era || '');
  setVal('away_pitcher_vs_opp_era', ap.vs_opponent_era || '');
  setVal('away_pitcher_vs_opp_games', ap.vs_opponent_games || 0);
  setVal('away_vs_lhb_ops', ap.vs_lhb_ops || '');
  setVal('away_vs_rhb_ops', ap.vs_rhb_ops || '');
  setVal('away_recent_5_games', (ap.recent_5_games || []).join(', '));

  // Bullpens
  setVal('home_bullpen_era', hb.era || '');
  setVal('home_bullpen_7ip', hb.last_7_days_ip || '');
  setVal('home_bullpen_3ip', hb.last_3_days_ip || '');
  setVal('home_bullpen_consec', hb.consecutive_days || 0);
  setVal('home_closer_available', hb.closer_available ? 'true' : 'false');
  setVal('home_setup_fatigued', hb.setup_fatigued ? 'true' : 'false');

  setVal('away_bullpen_era', ab.era || '');
  setVal('away_bullpen_7ip', ab.last_7_days_ip || '');
  setVal('away_bullpen_3ip', ab.last_3_days_ip || '');
  setVal('away_bullpen_consec', ab.consecutive_days || 0);
  setVal('away_closer_available', ab.closer_available ? 'true' : 'false');
  setVal('away_setup_fatigued', ab.setup_fatigued ? 'true' : 'false');

  // Team stats
  setVal('home_ops', hts.ops || '');
  setVal('home_wrc_plus', hts.wrc_plus || '');
  setVal('home_slg', hts.slg || '');
  setVal('home_obp', hts.obp || '');
  setVal('home_last_5', hts.last_5_record || '3-2');
  setVal('home_last_10', hts.last_10_record || '5-5');
  setVal('home_last_20', hts.last_20_record || '10-10');
  setVal('home_fielding_pct', hts.fielding_pct || '');
  setVal('home_drs', hts.drs || 0);
  setVal('home_uzr', hts.uzr || 0);

  setVal('away_ops', ats.ops || '');
  setVal('away_wrc_plus', ats.wrc_plus || '');
  setVal('away_slg', ats.slg || '');
  setVal('away_obp', ats.obp || '');
  setVal('away_last_5', ats.last_5_record || '3-2');
  setVal('away_last_10', ats.last_10_record || '5-5');
  setVal('away_last_20', ats.last_20_record || '10-10');
  setVal('away_fielding_pct', ats.fielding_pct || '');
  setVal('away_drs', ats.drs || 0);
  setVal('away_uzr', ats.uzr || 0);

  // Odds
  setVal('open_line', odds.open_line || -1.5);
  setVal('current_line', odds.current_line || -1.5);
  setVal('open_total', odds.open_total || 7.5);
  setVal('current_total', odds.current_total || 7.5);
  setVal('home_ml', odds.home_ml || 1.90);
  setVal('away_ml', odds.away_ml || 1.90);
  setVal('bankroll', betting.bankroll || 10000);
  setVal('your_odds', betting.your_odds || odds.home_ml || 1.90);
}

// ── Build JSON from form ─────────────────────────────────────
function buildFormData() {
  function gf(id) {
    const el = $(`#${id}`);
    return el ? el.value : '';
  }
  function gfNum(id, def = 0) {
    const v = gf(id);
    const n = parseFloat(v);
    return isNaN(n) ? def : n;
  }
  function gfInt(id, def = 0) {
    const v = gf(id);
    const n = parseInt(v);
    return isNaN(n) ? def : n;
  }
  function gfBool(id, def = false) {
    const v = gf(id);
    return v === 'true' ? true : v === 'false' ? false : def;
  }
  function gfList(id) {
    const v = gf(id);
    if (!v) return [];
    return v.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
  }

  return {
    game_info: {
      home_team: gf('home_team') || '主隊',
      away_team: gf('away_team') || '客隊',
      stadium: gf('stadium') || '未知球場',
      datetime: gf('datetime') || new Date().toISOString().slice(0, 16).replace('T', ' '),
      is_day_game: gfBool('is_day_game'),
      park_factor: gfNum('park_factor', 1.00),
      hr_factor: gfNum('hr_factor', 1.00),
      scoring_factor: gfNum('scoring_factor', 1.00),
      turf_type: gf('turf_type') || 'natural',
      temperature: gfNum('temperature', 22),
      humidity: gfNum('humidity', 60),
      rain_pct: gfNum('rain_pct', 0),
      wind_direction: gf('wind_direction') || 'none',
      wind_speed_kmh: gfNum('wind_speed_kmh', 0),
      is_travel_game: gfBool('is_travel_game'),
      consecutive_away_games: gfInt('consecutive_away_games', 0),
      consecutive_games_played: gfInt('consecutive_games_played', 0),
      days_since_last_game: gfInt('days_since_last_game', 1),
    },
    home_pitcher: {
      era: gfNum('home_era', 4.00),
      whip: gfNum('home_whip', 1.30),
      fip: gfNum('home_fip', 4.00),
      xera: gfNum('home_xera', 4.00),
      k9: gfNum('home_k9', 7.0),
      bb9: gfNum('home_bb9', 3.0),
      recent_5_games: gfList('home_recent_5_games'),
      home_era: gfNum('home_pitcher_home_era', gfNum('home_era', 4.00)),
      away_era: gfNum('home_pitcher_home_era', gfNum('home_era', 4.00)),
      day_era: gfNum('home_era', 4.00),
      night_era: gfNum('home_era', 4.00),
      vs_opponent_era: gfNum('home_pitcher_vs_opp_era', gfNum('home_era', 4.00)),
      vs_opponent_games: gfInt('home_pitcher_vs_opp_games', 0),
      vs_lhb_ops: gfNum('home_vs_lhb_ops', 0.700),
      vs_rhb_ops: gfNum('home_vs_rhb_ops', 0.700),
      pitch_count_limit: 100,
      rest_days: gfInt('home_rest_days', 5),
      handedness: gf('home_handedness') || 'R',
      pitch_mix: {},
    },
    away_pitcher: {
      era: gfNum('away_era', 4.00),
      whip: gfNum('away_whip', 1.30),
      fip: gfNum('away_fip', 4.00),
      xera: gfNum('away_xera', 4.00),
      k9: gfNum('away_k9', 7.0),
      bb9: gfNum('away_bb9', 3.0),
      recent_5_games: gfList('away_recent_5_games'),
      home_era: gfNum('away_pitcher_away_era', gfNum('away_era', 4.00)),
      away_era: gfNum('away_pitcher_away_era', gfNum('away_era', 4.00)),
      day_era: gfNum('away_era', 4.00),
      night_era: gfNum('away_era', 4.00),
      vs_opponent_era: gfNum('away_pitcher_vs_opp_era', gfNum('away_era', 4.00)),
      vs_opponent_games: gfInt('away_pitcher_vs_opp_games', 0),
      vs_lhb_ops: gfNum('away_vs_lhb_ops', 0.700),
      vs_rhb_ops: gfNum('away_vs_rhb_ops', 0.700),
      pitch_count_limit: 100,
      rest_days: gfInt('away_rest_days', 5),
      handedness: gf('away_handedness') || 'R',
      pitch_mix: {},
    },
    home_bullpen: {
      era: gfNum('home_bullpen_era', 3.50),
      last_7_days_ip: gfNum('home_bullpen_7ip', 0),
      last_3_days_ip: gfNum('home_bullpen_3ip', 0),
      consecutive_days: gfInt('home_bullpen_consec', 0),
      closer_available: gfBool('home_closer_available', true),
      setup_fatigued: gfBool('home_setup_fatigued', false),
      save_opportunities: 10,
      blown_saves: 1,
      holds: 20,
    },
    away_bullpen: {
      era: gfNum('away_bullpen_era', 3.50),
      last_7_days_ip: gfNum('away_bullpen_7ip', 0),
      last_3_days_ip: gfNum('away_bullpen_3ip', 0),
      consecutive_days: gfInt('away_bullpen_consec', 0),
      closer_available: gfBool('away_closer_available', true),
      setup_fatigued: gfBool('away_setup_fatigued', false),
      save_opportunities: 10,
      blown_saves: 2,
      holds: 18,
    },
    home_team_stats: {
      ops: gfNum('home_ops', 0.720),
      wrc_plus: gfNum('home_wrc_plus', 100),
      runs_scored_last_10: [4, 3, 5, 4, 6, 3, 4, 5, 3, 4],
      slg: gfNum('home_slg', 0.400),
      obp: gfNum('home_obp', 0.330),
      vs_lhp_ops: gfNum('home_ops', 0.720),
      vs_rhp_ops: gfNum('home_ops', 0.720),
      fielding_pct: gfNum('home_fielding_pct', 0.980),
      drs: gfNum('home_drs', 0),
      uzr: gfNum('home_uzr', 0),
      catcher_cs_pct: 0.30,
      error_rate: 0.020,
      last_5_record: gf('home_last_5') || '3-2',
      last_10_record: gf('home_last_10') || '5-5',
      last_20_record: gf('home_last_20') || '10-10',
      team_ops_trend: 0.0,
      team_era_trend: 0.0,
    },
    away_team_stats: {
      ops: gfNum('away_ops', 0.720),
      wrc_plus: gfNum('away_wrc_plus', 100),
      runs_scored_last_10: [3, 4, 3, 5, 3, 4, 3, 4, 3, 4],
      slg: gfNum('away_slg', 0.400),
      obp: gfNum('away_obp', 0.330),
      vs_lhp_ops: gfNum('away_ops', 0.720),
      vs_rhp_ops: gfNum('away_ops', 0.720),
      fielding_pct: gfNum('away_fielding_pct', 0.980),
      drs: gfNum('away_drs', 0),
      uzr: gfNum('away_uzr', 0),
      catcher_cs_pct: 0.28,
      error_rate: 0.022,
      last_5_record: gf('away_last_5') || '3-2',
      last_10_record: gf('away_last_10') || '5-5',
      last_20_record: gf('away_last_20') || '10-10',
      team_ops_trend: 0.0,
      team_era_trend: 0.0,
    },
    odds: {
      open_line: gfNum('open_line', -1.5),
      current_line: gfNum('current_line', -1.5),
      open_total: gfNum('open_total', 7.5),
      current_total: gfNum('current_total', 7.5),
      home_ml: gfNum('home_ml', 1.90),
      away_ml: gfNum('away_ml', 1.90),
      close_ml_home: gfNum('home_ml', 1.90),
      close_ml_away: gfNum('away_ml', 1.90),
    },
    betting: {
      your_odds: gfNum('your_odds', gfNum('home_ml', 1.90)),
      bankroll: gfNum('bankroll', 10000),
      open_odds: gfNum('home_ml', 1.90),
      close_odds: gfNum('home_ml', 1.90),
    },
    elo_overrides: {},
  };
}

// ── Run Analysis ─────────────────────────────────────────────
async function runAnalysis(data) {
  showLoading('AI 正在分析中...', '執行9項分析模組 + 蒙地卡羅模擬 10,000次...');
  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: '伺服器錯誤' }));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }

    const result = await resp.json();
    hideLoading();
    currentAnalysisData = result;
    renderResults(result);
    $('#results-section').style.display = 'block';
    setTimeout(() => {
      $('#results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  } catch (err) {
    hideLoading();
    showNotice(`分析失敗: ${err.message}`, 'error', 8000);
  }
}

// ── Render Results ───────────────────────────────────────────
function renderResults(result) {
  const home = result.game.home_team;
  const away = result.game.away_team;

  // Match Header
  qs('.match-team.home').textContent = home;
  qs('.match-team.away').textContent = away;
  qs('.match-stadium').textContent = result.game.stadium;
  qs('.match-datetime').textContent = result.game.datetime;
  qs('.match-day-night').textContent = result.game.is_day_game ? '日場' : '夜場';

  // Win Gauges
  const homeProb = result.win_probability.home_win_prob;
  const awayProb = result.win_probability.away_win_prob;
  drawWinGauge('home', homeProb, home);
  drawWinGauge('away', awayProb, away);

  // Bet Score Dial
  drawBetScoreDial(result.bet_score.score, result.bet_score.grade);

  // Star Rating
  renderStarRating(result.star_rating);

  // Bet recommendation text
  qs('#rec-text').textContent = result.bet_score.recommendation;

  // Score bars (pitcher, bullpen, lineup, defense, form)
  renderScoreBar('#pitcher-bar', result.pitcher.home_score, result.pitcher.away_score);
  renderScoreBar('#bullpen-bar', result.bullpen.home_score, result.bullpen.away_score);
  renderScoreBar('#lineup-bar', result.lineup.home_score, result.lineup.away_score);
  renderScoreBar('#defense-bar', result.defense.home_score, result.defense.away_score);
  renderScoreBar('#form-bar', result.form.home_score, result.form.away_score);

  // Pitcher Card
  qs('#pitcher-home-score').textContent = result.pitcher.home_score;
  qs('#pitcher-away-score').textContent = result.pitcher.away_score;
  qs('#pitcher-home-team').textContent = home;
  qs('#pitcher-away-team').textContent = away;
  qs('#pitcher-home-stats').innerHTML = `ERA ${result.pitcher.home_era} / WHIP ${result.pitcher.home_whip} / K9 ${result.pitcher.home_k9}`;
  qs('#pitcher-away-stats').innerHTML = `ERA ${result.pitcher.away_era} / WHIP ${result.pitcher.away_whip} / K9 ${result.pitcher.away_k9}`;
  renderNotes('#pitcher-notes', result.pitcher.home_notes.slice(0, 3));

  // Bullpen Card
  qs('#bullpen-home-era').textContent = result.bullpen.home_era;
  qs('#bullpen-away-era').textContent = result.bullpen.away_era;
  qs('#bullpen-home-fatigue').textContent = result.bullpen.home_fatigue;
  qs('#bullpen-away-fatigue').textContent = result.bullpen.away_fatigue;
  qs('#bullpen-home-closer').textContent = result.bullpen.home_closer ? '可用 ✓' : '不可用 ✗';
  qs('#bullpen-away-closer').textContent = result.bullpen.away_closer ? '可用 ✓' : '不可用 ✗';
  qs('#bullpen-home-closer').style.color = result.bullpen.home_closer ? 'var(--success)' : 'var(--danger)';
  qs('#bullpen-away-closer').style.color = result.bullpen.away_closer ? 'var(--success)' : 'var(--danger)';

  // Lineup Card
  qs('#lineup-home-re').textContent = result.lineup.home_run_expectancy.toFixed(1);
  qs('#lineup-away-re').textContent = result.lineup.away_run_expectancy.toFixed(1);
  qs('#lineup-home-wrc').textContent = result.lineup.home_wrc_plus;
  qs('#lineup-away-wrc').textContent = result.lineup.away_wrc_plus;

  // Park Card
  const parkTypeLabels = { pitcher_friendly: '投手球場', hitter_friendly: '打者球場', neutral: '中性球場' };
  qs('#park-type').textContent = parkTypeLabels[result.park.park_type] || result.park.park_type;
  qs('#park-factor').textContent = result.park.park_factor;
  qs('#park-hr-factor').textContent = result.park.hr_factor;
  qs('#park-run-adj').textContent = result.park.run_adjustment;
  renderNotes('#park-notes', result.park.notes.slice(0, 3));

  // Weather Card
  const wimpactLabels = { favorable: '有利 (投手)', unfavorable: '不利', neutral: '中性' };
  qs('#weather-hr-impact').textContent = result.weather.hr_impact.toFixed(3);
  qs('#weather-run-impact').textContent = result.weather.run_impact.toFixed(3);
  qs('#weather-pitcher-impact').textContent = wimpactLabels[result.weather.pitcher_impact] || result.weather.pitcher_impact;
  qs('#weather-temp').textContent = `${result.weather.temperature}°C`;
  qs('#weather-rain').textContent = `${result.weather.rain_pct}%`;
  qs('#weather-wind').textContent = `${result.weather.wind_speed_kmh} km/h ${result.weather.wind_direction}`;
  renderNotes('#weather-notes', result.weather.notes.slice(0, 2));

  // Form Card
  const trendMap = { hot: 'pill-hot', cold: 'pill-cold', neutral: 'pill-neutral' };
  qs('#form-home-trend').className = `pill ${trendMap[result.form.home_trend] || 'pill-neutral'}`;
  qs('#form-home-trend').textContent = result.form.home_trend === 'hot' ? '火熱' : result.form.home_trend === 'cold' ? '低迷' : '中性';
  qs('#form-away-trend').className = `pill ${trendMap[result.form.away_trend] || 'pill-neutral'}`;
  qs('#form-away-trend').textContent = result.form.away_trend === 'hot' ? '火熱' : result.form.away_trend === 'cold' ? '低迷' : '中性';
  qs('#form-home-records').textContent = `近5: ${result.form.home_last_5} | 近10: ${result.form.home_last_10}`;
  qs('#form-away-records').textContent = `近5: ${result.form.away_last_5} | 近10: ${result.form.away_last_10}`;

  // Schedule Card
  renderFatigueBar('#schedule-home-bar', result.schedule.home_fatigue, home);
  renderFatigueBar('#schedule-away-bar', result.schedule.away_fatigue, away);

  // Odds Analysis Card
  qs('#odds-value-bet').textContent = result.odds.value_bet_exists ? '存在價值投注 ✓' : '無明顯價值投注';
  qs('#odds-value-bet').style.color = result.odds.value_bet_exists ? 'var(--success)' : 'var(--text-secondary)';
  qs('#odds-sharp-lean').textContent = result.odds.sharp_lean === 'home' ? `主隊 (${home})` : result.odds.sharp_lean === 'away' ? `客隊 (${away})` : '不明確';
  qs('#odds-steam').textContent = result.odds.steam_move ? '是 (Steam Move 偵測)' : '否';
  qs('#odds-steam').style.color = result.odds.steam_move ? 'var(--warning)' : 'var(--text-secondary)';
  qs('#odds-home-impl').textContent = `${(result.odds.home_implied_prob * 100).toFixed(1)}%`;
  qs('#odds-away-impl').textContent = `${(result.odds.away_implied_prob * 100).toFixed(1)}%`;
  renderNotes('#odds-notes', result.odds.notes.slice(0, 3));

  // Totals
  qs('#totals-predicted').textContent = result.totals.predicted_total.toFixed(1);
  qs('#totals-home-runs').textContent = result.totals.predicted_home_runs.toFixed(1);
  qs('#totals-away-runs').textContent = result.totals.predicted_away_runs.toFixed(1);
  const ouLabels = { over: '大分 (Over)', under: '小分 (Under)', push: '中性 (Neutral)' };
  qs('#totals-ou-lean').textContent = ouLabels[result.totals.over_under_lean] || result.totals.over_under_lean;
  qs('#totals-ou-lean').style.color = result.totals.over_under_lean === 'over' ? 'var(--danger)' : 'var(--success)';

  // Top 3 Scores
  renderTop3Scores(result.totals.top3_scores, home, away);

  // Monte Carlo
  renderMonteCarloChart(result.monte_carlo);
  qs('#mc-home-win').textContent = `${result.monte_carlo.home_win_pct}%`;
  qs('#mc-away-win').textContent = `${result.monte_carlo.away_win_pct}%`;
  qs('#mc-over').textContent = `${result.monte_carlo.over_pct}%`;
  qs('#mc-under').textContent = `${result.monte_carlo.under_pct}%`;
  qs('#mc-mean-total').textContent = result.monte_carlo.mean_total.toFixed(1);
  const ci = result.monte_carlo.confidence_interval_95;
  qs('#mc-ci').textContent = `${ci[0]} ~ ${ci[1]}`;

  // ELO Table
  qs('#elo-home-prob').textContent = `${(result.elo.home_win_prob * 100).toFixed(1)}%`;
  qs('#elo-away-prob').textContent = `${(result.elo.away_win_prob * 100).toFixed(1)}%`;
  qs('#elo-home-elo').textContent = result.elo.home_elo;
  qs('#elo-away-elo').textContent = result.elo.away_elo;
  qs('#elo-diff').textContent = `${result.elo.elo_diff > 0 ? '+' : ''}${result.elo.elo_diff}`;

  // Kelly Table
  qs('#kelly-home-pct').textContent = `${result.kelly.home_kelly_pct.toFixed(1)}%`;
  qs('#kelly-away-pct').textContent = `${result.kelly.away_kelly_pct.toFixed(1)}%`;
  qs('#kelly-home-frac').textContent = `${result.kelly.home_fractional_kelly_pct.toFixed(1)}%`;
  qs('#kelly-away-frac').textContent = `${result.kelly.away_fractional_kelly_pct.toFixed(1)}%`;
  qs('#kelly-home-amt').textContent = `¥${result.kelly.home_bet_amount.toFixed(0)}`;
  qs('#kelly-away-amt').textContent = `¥${result.kelly.away_bet_amount.toFixed(0)}`;

  // CLV
  const clvLabels = { positive_clv: '正CLV (優質)', negative_clv: '負CLV (差)', break_even: '持平' };
  qs('#clv-home').textContent = `${(result.clv.home_clv_value * 100).toFixed(1)}% (${clvLabels[result.clv.home_assessment] || result.clv.home_assessment})`;
  qs('#clv-away').textContent = `${(result.clv.away_clv_value * 100).toFixed(1)}% (${clvLabels[result.clv.away_assessment] || result.clv.away_assessment})`;
  qs('#clv-home').style.color = result.clv.home_clv_value > 0 ? 'var(--success)' : 'var(--danger)';
  qs('#clv-away').style.color = result.clv.away_clv_value > 0 ? 'var(--success)' : 'var(--danger)';

  // Final Recommendation
  const rec = result.final_recommendation;
  qs('#rec-winner').textContent = rec.winner;
  qs('#rec-spread').textContent = rec.spread;
  qs('#rec-total').textContent = rec.total;
  qs('#rec-home-prob').textContent = `${rec.home_win_prob_pct}%`;
  qs('#rec-away-prob').textContent = `${rec.away_win_prob_pct}%`;
  qs('#rec-reasoning').textContent = rec.reasoning;
}

// ── Animation Helpers ────────────────────────────────────────
function drawWinGauge(side, prob, teamName) {
  const pct = Math.round(prob * 100);
  const circumference = 2 * Math.PI * 60; // 377
  const offset = circumference - (prob * circumference);

  const fill = $(`#win-gauge-fill-${side}`);
  const pctEl = $(`#win-gauge-pct-${side}`);
  const teamEl = $(`#win-gauge-team-${side}`);

  if (fill) {
    fill.style.strokeDashoffset = circumference; // reset
    setTimeout(() => {
      fill.style.strokeDashoffset = offset;
    }, 100);
  }
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (teamEl) teamEl.textContent = teamName;
}

function drawBetScoreDial(score, grade) {
  const canvas = $('#bet-score-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H - 20;
  const r = Math.min(cx, cy) - 10;

  ctx.clearRect(0, 0, W, H);

  // Draw zone arcs (180° from left to right)
  const zones = [
    { start: Math.PI, end: Math.PI * 1.4, color: '#ef4444' },  // 0-40 red
    { start: Math.PI * 1.4, end: Math.PI * 1.6, color: '#f59e0b' }, // 40-60 yellow
    { start: Math.PI * 1.6, end: Math.PI * 1.8, color: '#00d4ff' }, // 60-80 cyan
    { start: Math.PI * 1.8, end: Math.PI * 2, color: '#10b981' },  // 80-100 green
  ];

  zones.forEach(z => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, z.start, z.end);
    ctx.strokeStyle = z.color;
    ctx.lineWidth = 16;
    ctx.globalAlpha = 0.25;
    ctx.stroke();
  });

  // Draw filled arc up to score
  const scoreRatio = Math.min(score / 100, 1);
  const startAngle = Math.PI;
  const endAngle = Math.PI + scoreRatio * Math.PI;

  // Pick color based on score
  let dialColor = '#ef4444';
  if (score >= 80) dialColor = '#10b981';
  else if (score >= 60) dialColor = '#00d4ff';
  else if (score >= 40) dialColor = '#f59e0b';

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = dialColor;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.shadowColor = dialColor;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Needle
  const needleAngle = startAngle + scoreRatio * Math.PI;
  const nx = cx + (r - 8) * Math.cos(needleAngle);
  const ny = cy + (r - 8) * Math.sin(needleAngle);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Score text
  const scoreEl = $('#dial-score-num');
  const gradeEl = $('#dial-grade');
  if (scoreEl) scoreEl.textContent = Math.round(score);
  if (gradeEl) {
    gradeEl.textContent = grade;
    gradeEl.style.color = dialColor;
  }
}

function renderStarRating(count) {
  const container = $('#star-rating-display');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = `star${i <= count ? ' lit' : ''}`;
    star.textContent = '★';
    container.appendChild(star);
  }
}

function renderScoreBar(selector, homeScore, awayScore) {
  const el = document.querySelector(selector);
  if (!el) return;
  const homeBar = el.querySelector('.home-fill');
  const awayBar = el.querySelector('.away-fill');
  const homeVal = el.querySelector('.home-val');
  const awayVal = el.querySelector('.away-val');
  const total = homeScore + awayScore || 100;

  if (homeVal) homeVal.textContent = homeScore;
  if (awayVal) awayVal.textContent = awayScore;

  setTimeout(() => {
    if (homeBar) homeBar.style.width = `${(homeScore / 100) * 100}%`;
    if (awayBar) awayBar.style.width = `${(awayScore / 100) * 100}%`;
  }, 150);
}

function renderFatigueBar(selector, fatigue, teamName) {
  const el = document.querySelector(selector);
  if (!el) return;
  const bar = el.querySelector('.fatigue-fill');
  const label = el.querySelector('.fatigue-label');
  const val = el.querySelector('.fatigue-val');

  if (label) label.textContent = teamName;
  if (val) val.textContent = Math.round(fatigue);

  let color = 'var(--success)';
  if (fatigue >= 60) color = 'var(--danger)';
  else if (fatigue >= 40) color = 'var(--warning)';
  else if (fatigue >= 20) color = 'var(--cyan)';

  setTimeout(() => {
    if (bar) {
      bar.style.width = `${fatigue}%`;
      bar.style.background = color;
      bar.style.boxShadow = `0 0 8px ${color}`;
    }
  }, 150);
}

function renderNotes(selector, notes) {
  const el = document.querySelector(selector);
  if (!el || !notes) return;
  el.innerHTML = notes.map(n => `<li>${n}</li>`).join('');
}

function renderTop3Scores(scores, home, away) {
  const container = $('#top3-scores');
  if (!container || !scores) return;
  const labels = ['最可能', '第二可能', '第三可能'];
  container.innerHTML = scores.slice(0, 3).map((s, i) => `
    <div class="score-pred-card">
      <div class="score-pred-rank">${labels[i] || `#${i+1}`}</div>
      <div class="score-pred-val">${s.home_score}-${s.away_score}</div>
      <div class="score-pred-prob text-muted">${s.probability_pct}%</div>
    </div>
  `).join('');
}

function renderMonteCarloChart(mc) {
  const ctx = document.getElementById('mc-chart');
  if (!ctx) return;

  const dist = mc.score_distribution || [];
  const labels = dist.map(d => `${d.home_score}-${d.away_score}`);
  const probs = dist.map(d => d.probability_pct);

  if (mcChart) { mcChart.destroy(); }

  mcChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '比分機率 (%)',
        data: probs,
        backgroundColor: labels.map((_, i) => {
          const alpha = 0.4 + (i === 0 ? 0.4 : 0);
          return i === 0
            ? 'rgba(0, 212, 255, 0.8)'
            : `rgba(124, 58, 237, ${0.5 - i * 0.07})`;
        }),
        borderColor: labels.map((_, i) => i === 0 ? '#00d4ff' : '#7c3aed'),
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
          backgroundColor: '#0f1629',
          borderColor: '#00d4ff',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.raw.toFixed(1)}% 機率`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { color: 'rgba(0, 212, 255, 0.05)' },
        },
        y: {
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => v + '%' },
          grid: { color: 'rgba(0, 212, 255, 0.05)' },
        },
      },
    },
  });
}

// ── Tab navigation ───────────────────────────────────────────
function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tab-group').parentElement;
      const target = btn.dataset.tab;

      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = group.querySelector(`#tab-${target}`);
      if (pane) pane.classList.add('active');
    });
  });
}

// ── Form panel toggle ────────────────────────────────────────
function initFormPanel() {
  const header = $('#form-panel-header');
  const body = $('#form-panel-body');
  const icon = header?.querySelector('.toggle-icon');
  if (!header || !body) return;

  header.addEventListener('click', () => {
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  });
}

// ── Submit form ──────────────────────────────────────────────
function submitAnalysis() {
  const data = buildFormData();
  runAnalysis(data);
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFormPanel();

  // Auto-load odds
  loadOdds();

  // Close modal on backdrop click
  $('#api-key-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeApiKeyModal();
  });

  // Enter key in API key input
  $('#modal-api-key-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveApiKeyFromModal();
  });
});

// Expose to HTML onclick handlers
window.openApiKeyModal = openApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKeyFromModal = saveApiKeyFromModal;
window.loadOdds = loadOdds;
window.loadSampleData = loadSampleData;
window.submitAnalysis = submitAnalysis;
window.prefillFromOdds = prefillFromOdds;
