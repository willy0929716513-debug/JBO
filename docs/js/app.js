'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  gender: 'male', age: null, height: null, weight: null,
  activity_level: 1.55, goal_mode: 'loss',
  calorie_goal: 2000, protein_goal: 150,
  carbs_goal: 225, fat_goal: 65, water_goal: 2000,
  claude_api_key: null,
};

const MEAL_META = [
  { id: 'breakfast', label: '早餐', icon: '🌅', color: '#F97316' },
  { id: 'lunch',     label: '午餐', icon: '☀️',  color: '#22C55E' },
  { id: 'dinner',    label: '晚餐', icon: '🌙',  color: '#3B82F6' },
  { id: 'snack',     label: '點心', icon: '🧃',  color: '#8B5CF6' },
];

const FOOD_DB = {
  '白飯':    { calories: 130, protein: 2.7,  carbs: 28.7, fat: 0.3  },
  '糙米飯':  { calories: 111, protein: 2.6,  carbs: 23.5, fat: 0.9  },
  '麵條':    { calories: 138, protein: 4.5,  carbs: 27.8, fat: 0.6  },
  '吐司':    { calories: 265, protein: 9.0,  carbs: 49.0, fat: 3.2  },
  '饅頭':    { calories: 223, protein: 7.1,  carbs: 46.2, fat: 0.7  },
  '地瓜':    { calories: 86,  protein: 1.6,  carbs: 20.0, fat: 0.1  },
  '燕麥':    { calories: 389, protein: 17.0, carbs: 66.0, fat: 7.0  },
  '全麥吐司':{ calories: 247, protein: 10.7, carbs: 41.4, fat: 3.9  },
  '玉米':    { calories: 86,  protein: 3.2,  carbs: 19.0, fat: 1.2  },
  '馬鈴薯':  { calories: 77,  protein: 2.0,  carbs: 17.5, fat: 0.1  },
  '雞胸肉':  { calories: 165, protein: 31.0, carbs: 0.0,  fat: 3.6  },
  '雞腿肉':  { calories: 209, protein: 26.0, carbs: 0.0,  fat: 11.0 },
  '豬里肌':  { calories: 143, protein: 22.0, carbs: 0.0,  fat: 5.4  },
  '豬五花':  { calories: 518, protein: 14.0, carbs: 0.0,  fat: 52.0 },
  '牛肉':    { calories: 250, protein: 26.0, carbs: 0.0,  fat: 15.0 },
  '鮭魚':    { calories: 208, protein: 20.0, carbs: 0.0,  fat: 13.0 },
  '鮪魚':    { calories: 128, protein: 28.0, carbs: 0.0,  fat: 1.2  },
  '蝦子':    { calories: 99,  protein: 24.0, carbs: 0.0,  fat: 0.3  },
  '雞蛋':    { calories: 155, protein: 13.0, carbs: 1.1,  fat: 11.0 },
  '豆腐':    { calories: 76,  protein: 8.0,  carbs: 1.9,  fat: 4.2  },
  '豆漿':    { calories: 54,  protein: 3.3,  carbs: 6.4,  fat: 1.7  },
  '鮪魚罐頭':{ calories: 116, protein: 25.5, carbs: 0.0,  fat: 1.0  },
  '花椰菜':  { calories: 34,  protein: 2.8,  carbs: 7.0,  fat: 0.4  },
  '高麗菜':  { calories: 25,  protein: 1.3,  carbs: 5.8,  fat: 0.1  },
  '菠菜':    { calories: 23,  protein: 2.9,  carbs: 3.6,  fat: 0.4  },
  '番茄':    { calories: 18,  protein: 0.9,  carbs: 3.9,  fat: 0.2  },
  '小黃瓜':  { calories: 16,  protein: 0.7,  carbs: 3.6,  fat: 0.1  },
  '胡蘿蔔':  { calories: 41,  protein: 0.9,  carbs: 9.6,  fat: 0.2  },
  '洋蔥':    { calories: 40,  protein: 1.1,  carbs: 9.3,  fat: 0.1  },
  '香菇':    { calories: 34,  protein: 2.2,  carbs: 6.8,  fat: 0.5  },
  '空心菜':  { calories: 19,  protein: 2.6,  carbs: 2.1,  fat: 0.3  },
  '茄子':    { calories: 25,  protein: 1.0,  carbs: 5.9,  fat: 0.2  },
  '蘋果':    { calories: 52,  protein: 0.3,  carbs: 14.0, fat: 0.2  },
  '香蕉':    { calories: 89,  protein: 1.1,  carbs: 23.0, fat: 0.3  },
  '橘子':    { calories: 47,  protein: 0.9,  carbs: 12.0, fat: 0.1  },
  '西瓜':    { calories: 30,  protein: 0.6,  carbs: 7.6,  fat: 0.2  },
  '葡萄':    { calories: 69,  protein: 0.7,  carbs: 18.0, fat: 0.2  },
  '芒果':    { calories: 60,  protein: 0.8,  carbs: 15.0, fat: 0.4  },
  '草莓':    { calories: 32,  protein: 0.7,  carbs: 7.7,  fat: 0.3  },
  '鳳梨':    { calories: 50,  protein: 0.5,  carbs: 13.1, fat: 0.1  },
  '牛奶':    { calories: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3  },
  '優格':    { calories: 59,  protein: 3.5,  carbs: 3.6,  fat: 3.3  },
  '起司':    { calories: 402, protein: 25.0, carbs: 1.3,  fat: 33.0 },
  '無糖優格':{ calories: 56,  protein: 10.0, carbs: 3.6,  fat: 0.4  },
  '花生醬':  { calories: 588, protein: 25.0, carbs: 20.0, fat: 50.0 },
  '橄欖油':  { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  '核桃':    { calories: 654, protein: 15.0, carbs: 14.0, fat: 65.0 },
  '杏仁':    { calories: 579, protein: 21.0, carbs: 22.0, fat: 50.0 },
  '可樂':    { calories: 37,  protein: 0.0,  carbs: 9.6,  fat: 0.0  },
  '柳橙汁':  { calories: 45,  protein: 0.7,  carbs: 10.4, fat: 0.2  },
  '黑咖啡':  { calories: 2,   protein: 0.3,  carbs: 0.0,  fat: 0.0  },
  '綠茶':    { calories: 1,   protein: 0.0,  carbs: 0.2,  fat: 0.0  },
};

// ── Storage ───────────────────────────────────────────────────────────────────

const DB = {
  _get: (k, def) => { try { return JSON.parse(localStorage.getItem(k) || def); } catch { return JSON.parse(def); } },

  getFoods:    () => DB._get('nm_foods', '[]'),
  getWater:    () => DB._get('nm_water', '[]'),
  getWeights:  () => DB._get('nm_weights', '[]'),
  getSettings: () => ({ ...DEFAULT_SETTINGS, ...DB._get('nm_settings', '{}') }),

  saveFoods:    d => localStorage.setItem('nm_foods', JSON.stringify(d)),
  saveWater:    d => localStorage.setItem('nm_water', JSON.stringify(d)),
  saveWeights:  d => localStorage.setItem('nm_weights', JSON.stringify(d)),
  saveSettings: d => localStorage.setItem('nm_settings', JSON.stringify(d)),
  getGoals:     () => DB._get('nm_goals', '{}'),
  saveGoals:    d => localStorage.setItem('nm_goals', JSON.stringify(d)),

  newId: () => `nm_${Date.now()}_${Math.floor(Math.random() * 9999)}`,

  addFood(entry) {
    entry.id = DB.newId();
    const all = DB.getFoods();
    all.push(entry);
    DB.saveFoods(all);
    return entry;
  },
  deleteFood(id) { DB.saveFoods(DB.getFoods().filter(f => f.id !== id)); },

  addWater(entry) {
    entry.id = DB.newId();
    const all = DB.getWater();
    all.push(entry);
    DB.saveWater(all);
    return entry;
  },
  deleteWater(id) { DB.saveWater(DB.getWater().filter(w => w.id !== id)); },

  upsertWeight(date, weight, notes) {
    const all = DB.getWeights().filter(w => w.date !== date);
    all.push({ id: DB.newId(), date, weight: parseFloat(weight), notes: notes || '' });
    DB.saveWeights(all.sort((a, b) => b.date.localeCompare(a.date)));
  },
  deleteWeight(id) { DB.saveWeights(DB.getWeights().filter(w => w.id !== id)); },
};

// ── Utils ─────────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split('T')[0]; }

function dateRange(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getSummary(date) {
  const foods = DB.getFoods().filter(f => f.date === date);
  const water = DB.getWater().filter(w => w.date === date);
  return {
    calories: foods.reduce((s, f) => s + f.calories, 0),
    protein:  foods.reduce((s, f) => s + f.protein, 0),
    carbs:    foods.reduce((s, f) => s + f.carbs, 0),
    fat:      foods.reduce((s, f) => s + f.fat, 0),
    water:    water.reduce((s, w) => s + w.amount, 0),
  };
}

function getMeals(date) {
  const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
  DB.getFoods().filter(f => f.date === date).forEach(f => {
    if (meals[f.meal_type]) meals[f.meal_type].push(f);
  });
  return meals;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Nutrition Science (Mifflin-St Jeor + TDEE + per-kg macros) ───────────────

let currentGender   = 'male';
let currentGoalMode = 'loss';

function calcBMR(gender, age, height, weight) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

function calcTDEE(bmr, activityLevel) {
  return Math.round(bmr * activityLevel);
}

function calcMacros(goalMode, tdee, weight, gender) {
  const minCal = gender === 'female' ? 1200 : 1500;
  let calories, protein, fat;
  if (goalMode === 'loss') {
    calories = Math.max(tdee - 500, minCal);
    protein  = Math.round(weight * 1.8);
    fat      = Math.round(weight * 1.0);
  } else if (goalMode === 'gain') {
    calories = tdee + 250;
    protein  = Math.round(weight * 2.0);
    fat      = Math.round(weight * 1.0);
  } else {
    calories = tdee;
    protein  = Math.round(weight * 1.4);
    fat      = Math.round(weight * 0.9);
  }
  const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 50);
  const water  = Math.round(weight * 35 / 100) * 100;
  return { calories, protein, fat, carbs, water };
}

function getBMIInfo(bmi) {
  if (bmi < 18.5) return ['體重過輕', '#3B82F6', '#DBEAFE', '建議增加優質蛋白質與健康脂肪攝取'];
  if (bmi < 24)   return ['健康體重', '#22C55E', '#DCFCE7', '維持目前飲食習慣，持續規律運動'];
  if (bmi < 27)   return ['體重過重', '#F97316', '#FFF7ED', '建議逐步減少精緻糖和高脂食物'];
  if (bmi < 30)   return ['輕度肥胖', '#EF4444', '#FEF2F2', '建議諮詢營養師制定個人化飲食計畫'];
  return               ['中重度肥胖', '#991B1B', '#FEE2E2', '建議尋求醫療協助並配合飲食介入'];
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg, dur = 2000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

// ── Ring ──────────────────────────────────────────────────────────────────────

function drawRing(svgId, val, goal, color, trackColor, size, stroke) {
  color      = color      || '#22C55E';
  trackColor = trackColor || '#E5E7EB';
  size       = size       || 160;
  stroke     = stroke     || 12;
  const r    = (size - stroke * 2) / 2;
  const cx   = size / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(val / (goal || 1), 1);
  const off  = circ * (1 - pct);
  const fill = val > goal ? '#EF4444' : color;
  const el   = document.getElementById(svgId);
  if (!el) return;
  el.setAttribute('width', size);
  el.setAttribute('height', size);
  el.setAttribute('viewBox', `0 0 ${size} ${size}`);
  el.innerHTML = `
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="${stroke}"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${fill}" stroke-width="${stroke}"
      stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 ${cx} ${cx})"
      style="transition:stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)"/>
  `;
}

// ── Router ─────────────────────────────────────────────────────────────────────

let charts = {};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-page]').forEach(n =>
    n.classList.toggle('active', n.dataset.page === page));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  if (page !== 'trends') {
    ['tCalChart','tWaterChart','tMacroChart','tWeightChart'].forEach(k => {
      if (charts[k]) { charts[k].destroy(); delete charts[k]; }
    });
  }
  if (page !== 'weight') {
    if (charts.wHistChart) { charts.wHistChart.destroy(); delete charts.wHistChart; }
  }

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'food-log':  renderFoodLog();   break;
    case 'water':     renderWater();     break;
    case 'weight':    renderWeight();    break;
    case 'trends':    renderTrends(7);   break;
    case 'settings':  renderSettings();  break;
    case 'goals':     renderGoals();     break;
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function renderDashboard() {
  const today    = todayStr();
  const settings = DB.getSettings();
  const sum      = getSummary(today);
  const meals    = getMeals(today);

  const dateEl = document.getElementById('dash-date');
  if (dateEl) dateEl.textContent = today;

  document.getElementById('ring-cal').textContent = Math.round(sum.calories);
  const remain = Math.max(settings.calorie_goal - sum.calories, 0);
  document.getElementById('ring-remain').textContent =
    sum.calories > settings.calorie_goal ? '🎉 已超過目標' : `還差 ${Math.round(remain)} 大卡`;
  drawRing('calRing', sum.calories, settings.calorie_goal);

  setBar('barProtein', sum.protein, settings.protein_goal, '#8B5CF6');
  setBar('barCarbs',   sum.carbs,   settings.carbs_goal,   '#06B6D4');
  setBar('barFat',     sum.fat,     settings.fat_goal,     '#EAB308');

  ['protein','carbs','fat'].forEach(k => {
    const el = document.getElementById(`dash-${k}`);
    if (el) el.textContent = `${Math.round(sum[k])}g`;
  });

  const wpct = Math.min((sum.water / settings.water_goal) * 100, 100);
  const wbar = document.getElementById('waterProgressBar');
  if (wbar) wbar.style.width = wpct + '%';
  const wtxt = document.getElementById('waterText');
  if (wtxt) wtxt.textContent = `${Math.round(sum.water)} / ${settings.water_goal} ml`;

  const mealsEl = document.getElementById('dash-meals');
  if (mealsEl) mealsEl.innerHTML = renderMealsHTML(meals, false);

  const wt    = DB.getWeights().find(w => w.date === today);
  const wtCard = document.getElementById('dash-weight');
  if (wtCard) {
    if (wt) {
      wtCard.style.display = 'block';
      const valEl = wtCard.querySelector('.wt-val');
      if (valEl) valEl.textContent = `${wt.weight} kg`;
    } else {
      wtCard.style.display = 'none';
    }
  }
}

function setBar(id, val, goal, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width      = Math.min((val / (goal || 1)) * 100, 100) + '%';
  el.style.background = color;
}

function renderMealsHTML(meals, showActions) {
  return MEAL_META.map(m => {
    const items    = meals[m.id] || [];
    const totalCal = items.reduce((s, f) => s + f.calories, 0);
    const addBtn   = showActions
      ? `<button onclick="setActiveMeal('${m.id}')" style="margin-left:auto;background:${m.color}22;border:none;border-radius:8px;padding:4px 10px;color:${m.color};font-size:0.75rem;font-weight:700;cursor:pointer">+ 新增</button>`
      : (items.length ? `<div class="meal-cals">${Math.round(totalCal)} kcal</div>` : '');

    const itemsHTML = items.length
      ? items.map(f => `
          <div class="food-item" id="fi-${esc(f.id)}">
            <div class="food-dot" style="background:${m.color}"></div>
            <div class="food-info">
              <div class="food-name-text">${esc(f.food_name)}</div>
              <div class="food-meta">${esc(f.amount)}${esc(f.unit)} · P ${Math.round(f.protein)}g · C ${Math.round(f.carbs)}g · F ${Math.round(f.fat)}g</div>
            </div>
            <div class="food-cal">${Math.round(f.calories)}</div>
            ${showActions ? `<button class="del-btn" onclick="deleteFoodItem('${esc(f.id)}')"><i class="bi bi-trash3"></i></button>` : ''}
          </div>`).join('')
      : `<div style="font-size:0.8rem;color:var(--muted);padding:6px 0">
           尚未記錄${showActions ? ` · <span onclick="setActiveMeal('${m.id}')" style="color:var(--green);cursor:pointer">+ 新增</span>` : ''}
         </div>`;

    return `
      <div class="meal-section">
        <div class="meal-header">
          <div class="meal-icon" style="background:${m.color}22;font-size:1rem">${m.icon}</div>
          <div class="meal-name">${m.label}</div>
          ${addBtn}
        </div>
        ${itemsHTML}
      </div>`;
  }).join('');
}

// ── Food Log ───────────────────────────────────────────────────────────────────

let activeMeal   = 'breakfast';
let selectedFood = null;
let searchCache  = [];

function renderFoodLog() {
  const today = todayStr();
  const dateEl = document.getElementById('fl-date');
  if (dateEl) dateEl.textContent = today;

  const meals   = getMeals(today);
  const flMeals = document.getElementById('fl-meals');
  if (flMeals) flMeals.innerHTML = renderMealsHTML(meals, true);

  const sum    = getSummary(today);
  const totalEl = document.getElementById('fl-total');
  if (totalEl) totalEl.textContent = `${Math.round(sum.calories)} kcal`;
}

function setActiveMeal(mt) {
  activeMeal = mt;
  document.querySelectorAll('.chip[data-meal]').forEach(c =>
    c.classList.toggle('active', c.dataset.meal === mt));
  const si = document.getElementById('foodSearch');
  if (si) si.focus();
}

function doSearch(q) {
  q = q.trim();
  const box   = document.getElementById('searchResults');
  const input = document.getElementById('foodSearch');
  if (!q) { box.classList.remove('show'); return; }

  searchCache = Object.entries(FOOD_DB)
    .filter(([name]) => name.includes(q))
    .map(([name, info]) => ({ name, ...info }))
    .slice(0, 15);

  if (!searchCache.length) { box.classList.remove('show'); return; }

  // Position fixed relative to the input element (avoids overflow:hidden clipping)
  const rect = input.getBoundingClientRect();
  box.style.top   = (rect.bottom + 6) + 'px';
  box.style.left  = rect.left + 'px';
  box.style.width = rect.width + 'px';

  box.innerHTML = searchCache.map((f, i) => `
    <div class="result-item" onclick="selectFoodByIdx(${i})">
      <div>
        <div class="result-name">${esc(f.name)}</div>
        <div class="result-info">蛋白 ${f.protein}g · 碳水 ${f.carbs}g · 脂肪 ${f.fat}g <span style="font-size:0.7rem">/100g</span></div>
      </div>
      <div class="result-cal">${f.calories} kcal</div>
    </div>`).join('');
  box.classList.add('show');
}

function selectFoodByIdx(i) {
  selectedFood = searchCache[i];
  document.getElementById('searchResults').classList.remove('show');
  document.getElementById('foodSearch').value = selectedFood.name;
  document.getElementById('modalFoodName').textContent = selectedFood.name;
  document.getElementById('modalCal').textContent = selectedFood.calories;
  document.getElementById('modalAmt').value = 100;
  updateModalCalc();
  document.getElementById('foodModal').classList.remove('hidden');
}

function updateModalCalc() {
  if (!selectedFood) return;
  const amt = parseFloat(document.getElementById('modalAmt').value) || 100;
  const r   = amt / 100;
  document.getElementById('modalCalc').textContent =
    `卡路里 ${Math.round(selectedFood.calories * r)} | 蛋白 ${(selectedFood.protein * r).toFixed(1)}g | 碳水 ${(selectedFood.carbs * r).toFixed(1)}g | 脂肪 ${(selectedFood.fat * r).toFixed(1)}g`;
}

function closeModal() {
  document.getElementById('foodModal').classList.add('hidden');
  selectedFood = null;
}

function confirmAddFood() {
  if (!selectedFood) return;
  const amt = parseFloat(document.getElementById('modalAmt').value) || 100;
  const r   = amt / 100;
  DB.addFood({
    date: todayStr(), meal_type: activeMeal,
    food_name: selectedFood.name, amount: amt, unit: 'g',
    calories: selectedFood.calories * r,
    protein:  selectedFood.protein  * r,
    carbs:    selectedFood.carbs    * r,
    fat:      selectedFood.fat      * r,
  });
  closeModal();
  document.getElementById('foodSearch').value = '';
  showToast(`✅ 已加入${MEAL_META.find(m => m.id === activeMeal)?.label || ''}`);
  renderFoodLog();
  if (document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
}

function deleteFoodItem(id) {
  DB.deleteFood(id);
  const el = document.getElementById(`fi-${id}`);
  if (el) el.style.opacity = '0.3';
  showToast('已刪除');
  setTimeout(() => renderFoodLog(), 300);
}

function openManualEntry()  { document.getElementById('manualModal').classList.remove('hidden'); }
function closeManualModal() { document.getElementById('manualModal').classList.add('hidden'); }

// ── AI Photo Scan ──────────────────────────────────────────────────────────────

let scanResults     = [];
let scanImageBase64 = null;
let scanMediaType   = 'image/jpeg';

function openPhotoScan() {
  document.getElementById('photoModal').classList.remove('hidden');
  scanResults     = [];
  scanImageBase64 = null;
  document.getElementById('scanDrop').style.display         = 'block';
  document.getElementById('scanPreviewWrap').style.display  = 'none';
  document.getElementById('scanAnalyzeBtn').style.display   = 'none';
  document.getElementById('scanResultsWrap').style.display  = 'none';
}

function closePhotoScan() {
  document.getElementById('photoModal').classList.add('hidden');
  document.getElementById('photoFileInput').value = '';
}

function triggerPhotoInput() {
  document.getElementById('photoFileInput').click();
}

function resizeImage(dataUrl, maxPx) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      const max = maxPx || 1024;
      if (w > max || h > max) {
        const ratio = Math.min(max / w, max / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}

async function handlePhotoSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  scanMediaType = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = async ev => {
    const resized = await resizeImage(ev.target.result, 1024);
    scanImageBase64 = resized.split(',')[1];
    scanMediaType   = 'image/jpeg'; // canvas always outputs jpeg after resize

    document.getElementById('scanPreviewImg').src        = resized;
    document.getElementById('scanDrop').style.display    = 'none';
    document.getElementById('scanPreviewWrap').style.display  = 'block';
    document.getElementById('scanResultsWrap').style.display  = 'none';
    document.getElementById('scanAnalyzeBtn').style.display   = 'flex';
  };
  reader.readAsDataURL(file);
}

async function analyzePhoto() {
  const s      = DB.getSettings();
  const apiKey = s.claude_api_key;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    showToast('請先在設定頁面填入 Claude API 金鑰');
    closePhotoScan();
    navigate('settings');
    return;
  }
  if (!scanImageBase64) return;

  const btn = document.getElementById('scanAnalyzeBtn');
  btn.disabled   = true;
  btn.innerHTML  = '<div style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px"></div>AI 分析中…';
  document.getElementById('scanResultsWrap').style.display    = 'block';
  document.getElementById('scanResultsContent').innerHTML     =
    '<div class="spinner"></div><div style="text-align:center;font-size:0.82rem;color:var(--muted);margin-top:10px">AI 正在辨識食物…</div>';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: scanMediaType, data: scanImageBase64 } },
            { type: 'text', text:
              '請分析這張食物照片，識別所有可見食物並估算熱量與三大營養素。\n' +
              '請只回傳 JSON，格式如下（不要其他文字）：\n' +
              '{"foods":[{"name":"食物名稱（繁體中文）","amount":100,"unit":"g","calories":150,"protein":5.0,"carbs":20.0,"fat":3.0}]}\n' +
              '請使用台灣常見食物的真實營養數據，amount 為目視估算份量。'
            }
          ]
        }]
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `API 錯誤 ${resp.status}`);
    }

    const data    = await resp.json();
    const text    = data.content?.[0]?.text || '';
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) throw new Error('無法解析 AI 回應，請重試');
    const parsed  = JSON.parse(jsonStr);
    scanResults   = (parsed.foods || []).filter(f => f.name && f.calories > 0);
    if (!scanResults.length) throw new Error('未偵測到食物，請換張照片');
    renderScanResults();
  } catch (err) {
    document.getElementById('scanResultsContent').innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--red)">
        <i class="bi bi-exclamation-circle" style="font-size:2rem;display:block;margin-bottom:8px"></i>
        <div style="font-size:0.84rem">${esc(String(err.message))}</div>
      </div>`;
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-stars"></i> 重新分析';
  }
}

function renderScanResults() {
  const total = scanResults.reduce((s, f) => s + (f.calories || 0), 0);
  document.getElementById('scanResultsContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="ai-badge"><i class="bi bi-stars"></i> AI 辨識結果</div>
      <div style="font-size:0.8rem;color:var(--muted)">共 <strong style="color:var(--orange)">${Math.round(total)}</strong> kcal</div>
    </div>
    ${scanResults.map((f, i) => `
      <div class="scan-food-card">
        <input type="checkbox" id="sfc-${i}" checked style="width:17px;height:17px;accent-color:var(--green);cursor:pointer;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div class="scan-food-name">${esc(f.name)}</div>
          <div class="scan-food-meta">約 ${f.amount}${f.unit||'g'} · 蛋白 ${(+f.protein||0).toFixed(1)}g · 碳水 ${(+f.carbs||0).toFixed(1)}g · 脂肪 ${(+f.fat||0).toFixed(1)}g</div>
        </div>
        <div class="scan-food-cal">${Math.round(f.calories)} kcal</div>
      </div>`).join('')}
    <button class="btn-primary" style="width:100%;justify-content:center;margin-top:12px" onclick="addScanResults()">
      <i class="bi bi-plus-circle"></i> 加入今日紀錄
    </button>`;
}

function addScanResults() {
  let added = 0;
  scanResults.forEach((f, i) => {
    const chk = document.getElementById(`sfc-${i}`);
    if (chk && chk.checked) {
      DB.addFood({
        date: todayStr(), meal_type: activeMeal,
        food_name: f.name,
        amount: f.amount || 100, unit: f.unit || 'g',
        calories: +f.calories || 0,
        protein:  +f.protein  || 0,
        carbs:    +f.carbs    || 0,
        fat:      +f.fat      || 0,
      });
      added++;
    }
  });
  if (added === 0) { showToast('請至少勾選一項食物'); return; }
  closePhotoScan();
  showToast(`✅ 已加入 ${added} 項食物到${MEAL_META.find(m => m.id === activeMeal)?.label || ''}！`);
  renderFoodLog();
  if (document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
}

function submitManualFood() {
  const name = document.getElementById('mName').value.trim();
  const cal  = parseFloat(document.getElementById('mCal').value);
  if (!name || !cal) { showToast('請填寫食物名稱和卡路里'); return; }
  DB.addFood({
    date: todayStr(), meal_type: activeMeal, food_name: name,
    amount: parseFloat(document.getElementById('mAmt').value) || 1, unit: '份',
    calories: cal,
    protein:  parseFloat(document.getElementById('mProtein').value) || 0,
    carbs:    parseFloat(document.getElementById('mCarbs').value)   || 0,
    fat:      parseFloat(document.getElementById('mFat').value)     || 0,
  });
  closeManualModal();
  showToast('✅ 已新增');
  ['mName','mCal','mProtein','mCarbs','mFat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('mAmt').value = 1;
  renderFoodLog();
}

// ── Water ─────────────────────────────────────────────────────────────────────

function renderWater() {
  const today    = todayStr();
  const settings = DB.getSettings();
  const logs     = DB.getWater().filter(w => w.date === today);
  const total    = logs.reduce((s, w) => s + w.amount, 0);
  const goal     = settings.water_goal;
  const pct      = Math.min((total / goal) * 100, 100);

  document.getElementById('waterRingVal').textContent  = Math.round(total);
  document.getElementById('waterRingGoal').textContent = `目標 ${goal} ml`;
  document.getElementById('waterPct').style.width      = pct + '%';
  const remEl = document.getElementById('waterRemain');
  if (remEl) {
    remEl.textContent = total >= goal ? '🎉 今日目標達成！' : `還差 ${Math.round(goal - total)} ml 達成目標`;
    remEl.style.color = total >= goal ? 'var(--green)' : 'var(--muted)';
  }
  drawRing('waterRing', total, goal, '#3B82F6', '#DBEAFE', 150, 12);

  const listEl = document.getElementById('waterList');
  if (!listEl) return;
  if (!logs.length) {
    listEl.innerHTML = '<div class="empty-state"><i class="bi bi-droplet" style="font-size:1.5rem;opacity:0.4;display:block;margin-bottom:6px"></i>還沒有記錄，快喝水吧！</div>';
    return;
  }
  listEl.innerHTML = [...logs].reverse().map(w => `
    <div class="water-log-item" id="wl-${esc(w.id)}">
      <i class="bi bi-droplet-fill" style="color:#3B82F6;font-size:1.1rem"></i>
      <div class="water-log-ml">${w.amount} ml</div>
      <div style="margin-left:auto;font-size:0.75rem;color:var(--muted)">${w.date}</div>
      <button class="del-btn" onclick="deleteWaterItem('${esc(w.id)}')"><i class="bi bi-trash3"></i></button>
    </div>`).join('');
}

function addWater(ml) {
  if (!ml || ml <= 0) { showToast('請輸入有效水量'); return; }
  DB.addWater({ date: todayStr(), amount: ml });
  showToast(`💧 +${ml}ml 已記錄`);
  renderWater();
}

function addCustomWater() {
  const ml = parseInt(document.getElementById('customWaterAmt').value);
  addWater(ml);
  document.getElementById('customWaterAmt').value = '';
}

function deleteWaterItem(id) {
  DB.deleteWater(id);
  showToast('已刪除');
  renderWater();
}

// ── Weight ─────────────────────────────────────────────────────────────────────

function renderWeight() {
  const today   = todayStr();
  const weights = DB.getWeights();
  const todayW  = weights.find(w => w.date === today);

  const inp     = document.getElementById('weightInput');
  const saveBtn = document.getElementById('weightSaveBtn');
  const noteEl  = document.getElementById('todayWeightNote');

  if (todayW) {
    if (inp)     inp.value            = todayW.weight;
    if (saveBtn) saveBtn.textContent  = '更新今日體重';
    if (noteEl)  { noteEl.textContent = `今日已記錄：${todayW.weight} kg`; noteEl.style.display = 'block'; }
  } else {
    if (saveBtn) saveBtn.textContent  = '記錄體重';
    if (noteEl)  noteEl.style.display = 'none';
  }

  const listEl = document.getElementById('weightList');
  if (listEl) {
    if (!weights.length) {
      listEl.innerHTML = '<div class="empty-state"><i class="bi bi-speedometer2" style="font-size:1.5rem;opacity:0.4;display:block;margin-bottom:6px"></i>還沒有體重記錄</div>';
    } else {
      listEl.innerHTML = weights.slice(0, 30).map(w => `
        <div class="weight-item" id="wt-${esc(w.id)}">
          <i class="bi bi-calendar3" style="color:var(--muted);font-size:0.9rem"></i>
          <div>
            <div style="font-size:0.8rem;font-weight:600">${w.date}</div>
            ${w.notes ? `<div style="font-size:0.72rem;color:var(--muted)">${esc(w.notes)}</div>` : ''}
          </div>
          <div class="weight-item-val">${w.weight} kg</div>
          <button class="del-btn" onclick="deleteWeightItem('${esc(w.id)}')"><i class="bi bi-trash3"></i></button>
        </div>`).join('');
    }
  }

  const wrapEl = document.getElementById('weightChartWrap');
  if (wrapEl) wrapEl.style.display = weights.length > 1 ? 'block' : 'none';
  if (weights.length > 1) {
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-20);
    renderWeightHistChart(sorted.map(w => w.date.slice(5)), sorted.map(w => w.weight));
  }
}

function submitWeight() {
  const w = parseFloat(document.getElementById('weightInput').value);
  if (!w || w < 20 || w > 300) { showToast('請輸入有效體重（20-300 kg）'); return; }
  const notes = document.getElementById('weightNotes')?.value || '';
  DB.upsertWeight(todayStr(), w, notes);
  showToast('✅ 體重已記錄');
  renderWeight();
}

function deleteWeightItem(id) {
  DB.deleteWeight(id);
  showToast('已刪除');
  renderWeight();
}

function calcBMI() {
  const h = parseFloat(document.getElementById('heightInput').value);
  const w = parseFloat(document.getElementById('bmiWeight').value);
  const r = document.getElementById('bmiResult');
  if (!h || !w || !r) { if (r) r.style.display = 'none'; return; }
  const bmi = w / ((h / 100) ** 2);
  document.getElementById('bmiVal').textContent = bmi.toFixed(1);
  r.style.display = 'block';
  const [label, color, bg] = getBMIInfo(bmi);
  r.style.background = bg;
  document.getElementById('bmiVal').style.color   = color;
  document.getElementById('bmiLabel').textContent  = label;
  document.getElementById('bmiLabel').style.color  = color;
}

function renderWeightHistChart(labels, data) {
  if (charts.wHistChart) { charts.wHistChart.destroy(); delete charts.wHistChart; }
  const ctx = document.getElementById('wHistChart')?.getContext('2d');
  if (!ctx) return;
  charts.wHistChart = mkLineChart(ctx, labels, data, '#EC4899');
}

// ── Trends ─────────────────────────────────────────────────────────────────────

function renderTrends(days) {
  document.querySelectorAll('.period-tab').forEach(t =>
    t.classList.toggle('active', parseInt(t.dataset.days) === days));

  const dates  = dateRange(days);
  const labels = dates.map(d => d.slice(5));
  const sums   = dates.map(d => getSummary(d));

  const wLogs = DB.getWeights()
    .filter(w => w.date >= dates[0])
    .sort((a, b) => a.date.localeCompare(b.date));

  const pairs = [
    ['tCalChart',    () => mkLineChart(document.getElementById('tCalChart')?.getContext('2d'),   labels, sums.map(s => Math.round(s.calories)), '#F97316')],
    ['tWaterChart',  () => mkBarChart(document.getElementById('tWaterChart')?.getContext('2d'),   labels, sums.map(s => Math.round(s.water)),    '#3B82F6')],
    ['tMacroChart',  () => mkMacroChart(labels, sums)],
    ['tWeightChart', () => wLogs.length > 0 ? mkLineChart(document.getElementById('tWeightChart')?.getContext('2d'), wLogs.map(w=>w.date.slice(5)), wLogs.map(w=>w.weight), '#EC4899') : null],
  ];

  pairs.forEach(([key, fn]) => {
    if (charts[key]) { charts[key].destroy(); delete charts[key]; }
    const c = fn();
    if (c) charts[key] = c;
  });
}

function mkLineChart(ctx, labels, data, color) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{
      data, borderColor: color, backgroundColor: color + '22',
      borderWidth: 2.5, pointBackgroundColor: color, pointRadius: 4, fill: true, tension: 0.4,
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

function mkBarChart(ctx, labels, data, color) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{
      data, backgroundColor: color + '33', borderColor: color, borderWidth: 2, borderRadius: 6,
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

function mkMacroChart(labels, sums) {
  const ctx = document.getElementById('tMacroChart')?.getContext('2d');
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '蛋白質', data: sums.map(s => Math.round(s.protein)), backgroundColor: '#8B5CF6', borderRadius: 3, stack: 'm' },
        { label: '碳水',   data: sums.map(s => Math.round(s.carbs)),   backgroundColor: '#06B6D4', borderRadius: 3, stack: 'm' },
        { label: '脂肪',   data: sums.map(s => Math.round(s.fat)),     backgroundColor: '#EAB308', borderRadius: 3, stack: 'm' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } }, stacked: true },
        y: { grid: { color: '#F3F4F6' }, ticks: { font: { size: 11 } }, stacked: true }
      }
    }
  });
}

// ── Settings ───────────────────────────────────────────────────────────────────

function setGender(g) {
  currentGender = g;
  document.getElementById('genderMale').classList.toggle('active', g === 'male');
  document.getElementById('genderFemale').classList.toggle('active', g === 'female');
  liveCalcTDEE();
}

function setGoalMode(mode) {
  currentGoalMode = mode;
  document.querySelectorAll('.goal-mode-card').forEach(el => {
    const isActive = el.dataset.mode === mode;
    el.classList.toggle('active', isActive);
    const checkEl = el.querySelector('.mode-check');
    if (checkEl) {
      checkEl.innerHTML = isActive
        ? '<i class="bi bi-check-circle-fill" style="color:var(--green);font-size:1.1rem"></i>'
        : '<i class="bi bi-circle" style="color:var(--border);font-size:1.1rem"></i>';
    }
  });
  liveCalcTDEE();
}

function liveCalcTDEE() {
  const age      = parseFloat(document.getElementById('sAge').value);
  const height   = parseFloat(document.getElementById('sHeight').value);
  const weight   = parseFloat(document.getElementById('sWeight').value);
  const activity = parseFloat(document.getElementById('sActivity').value) || 1.55;
  const tdeeCard  = document.getElementById('tdeeCard');
  const macroCard = document.getElementById('macroRecCard');

  if (!age || !height || !weight) {
    if (tdeeCard)  tdeeCard.style.display  = 'none';
    if (macroCard) macroCard.style.display = 'none';
    return;
  }

  const bmr    = calcBMR(currentGender, age, height, weight);
  const tdee   = calcTDEE(bmr, activity);
  const macros = calcMacros(currentGoalMode, tdee, weight, currentGender);

  const actLabels = { '1.2': '久坐', '1.375': '輕度活動', '1.55': '中度活動', '1.725': '積極運動', '1.9': '非常積極' };
  const actLabel  = actLabels[String(activity)] || '中度活動';

  if (tdeeCard) {
    tdeeCard.style.display = 'block';
    document.getElementById('tdeeContent').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="background:#F9FAFB;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">基礎代謝率 BMR</div>
          <div style="font-size:1.9rem;font-weight:800;color:var(--text)">${bmr}</div>
          <div style="font-size:0.7rem;color:var(--muted)">kcal / 天</div>
        </div>
        <div style="background:var(--green-light);border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">每日總消耗 TDEE</div>
          <div style="font-size:1.9rem;font-weight:800;color:var(--green)">${tdee}</div>
          <div style="font-size:0.7rem;color:var(--muted)">kcal / 天</div>
        </div>
      </div>
      <div style="font-size:0.74rem;color:var(--muted);background:#F9FAFB;border-radius:10px;padding:10px;line-height:1.7">
        <strong>Mifflin-St Jeor 公式</strong>（臨床最準確非侵入式公式）<br>
        活動係數 ×${activity}（${actLabel}）
      </div>
    `;
  }

  if (macroCard) {
    macroCard.style.display = 'block';
    const modeInfo = {
      loss:     { label: '減重 · TDEE − 500 kcal',     proteinRatio: '1.8g/kg', fatRatio: '1.0g/kg' },
      maintain: { label: '維持 · 等熱量飲食',           proteinRatio: '1.4g/kg', fatRatio: '0.9g/kg' },
      gain:     { label: '增肌 · TDEE + 250 kcal',     proteinRatio: '2.0g/kg', fatRatio: '1.0g/kg' },
    };
    const info = modeInfo[currentGoalMode] || modeInfo.maintain;

    document.getElementById('macroRecContent').innerHTML = `
      <div style="background:var(--green-light);border-radius:12px;padding:16px;text-align:center;margin-bottom:12px">
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">${info.label}</div>
        <div style="font-size:2.4rem;font-weight:800;color:var(--green);line-height:1">${macros.calories}</div>
        <div style="font-size:0.78rem;color:var(--muted);margin-top:4px">kcal / 天</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px">
        <div style="text-align:center;background:#F5F3FF;border-radius:10px;padding:10px">
          <div style="font-size:0.65rem;color:#8B5CF6;font-weight:700;margin-bottom:2px">蛋白質</div>
          <div style="font-size:1.1rem;font-weight:800;color:#8B5CF6">${macros.protein}g</div>
          <div style="font-size:0.62rem;color:var(--muted)">${info.proteinRatio}</div>
        </div>
        <div style="text-align:center;background:#ECFEFF;border-radius:10px;padding:10px">
          <div style="font-size:0.65rem;color:#06B6D4;font-weight:700;margin-bottom:2px">碳水</div>
          <div style="font-size:1.1rem;font-weight:800;color:#06B6D4">${macros.carbs}g</div>
          <div style="font-size:0.62rem;color:var(--muted)">剩餘熱量</div>
        </div>
        <div style="text-align:center;background:#FEFCE8;border-radius:10px;padding:10px">
          <div style="font-size:0.65rem;color:#EAB308;font-weight:700;margin-bottom:2px">脂肪</div>
          <div style="font-size:1.1rem;font-weight:800;color:#EAB308">${macros.fat}g</div>
          <div style="font-size:0.62rem;color:var(--muted)">${info.fatRatio}</div>
        </div>
        <div style="text-align:center;background:var(--blue-light);border-radius:10px;padding:10px">
          <div style="font-size:0.65rem;color:var(--blue);font-weight:700;margin-bottom:2px">飲水</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--blue)">${macros.water}ml</div>
          <div style="font-size:0.62rem;color:var(--muted)">35ml/kg</div>
        </div>
      </div>
    `;
  }

  document.getElementById('sCalorie').value = macros.calories;
  document.getElementById('sProtein').value = macros.protein;
  document.getElementById('sCarbs').value   = macros.carbs;
  document.getElementById('sFat').value     = macros.fat;
  document.getElementById('sWater').value   = macros.water;
}

function applyRecommended() {
  liveCalcTDEE();
  showToast('✅ 已套用建議值，記得儲存！');
  const adj = document.getElementById('manualAdj');
  if (adj && adj.style.display === 'none') toggleManualAdj();
}

function toggleManualAdj() {
  const adj = document.getElementById('manualAdj');
  const ch  = document.getElementById('adjChevron');
  if (!adj) return;
  const isOpen = adj.style.display !== 'none';
  adj.style.display = isOpen ? 'none' : 'block';
  if (ch) ch.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

function renderSettings() {
  const s = DB.getSettings();

  currentGender   = s.gender    || 'male';
  currentGoalMode = s.goal_mode || 'loss';

  document.getElementById('genderMale').classList.toggle('active', currentGender === 'male');
  document.getElementById('genderFemale').classList.toggle('active', currentGender === 'female');

  if (s.age)    document.getElementById('sAge').value    = s.age;
  if (s.height) document.getElementById('sHeight').value = s.height;

  const weights      = DB.getWeights();
  const latestWeight = weights.length > 0 ? weights[0].weight : (s.weight || null);
  if (latestWeight)  document.getElementById('sWeight').value = latestWeight;

  document.getElementById('sActivity').value = s.activity_level || 1.55;

  document.querySelectorAll('.goal-mode-card').forEach(el => {
    const isActive = el.dataset.mode === currentGoalMode;
    el.classList.toggle('active', isActive);
    const checkEl = el.querySelector('.mode-check');
    if (checkEl) {
      checkEl.innerHTML = isActive
        ? '<i class="bi bi-check-circle-fill" style="color:var(--green);font-size:1.1rem"></i>'
        : '<i class="bi bi-circle" style="color:var(--border);font-size:1.1rem"></i>';
    }
  });

  document.getElementById('sCalorie').value = s.calorie_goal || 2000;
  document.getElementById('sProtein').value = s.protein_goal || 150;
  document.getElementById('sCarbs').value   = s.carbs_goal   || 225;
  document.getElementById('sFat').value     = s.fat_goal     || 65;
  document.getElementById('sWater').value   = s.water_goal   || 2000;

  const apiEl = document.getElementById('sApiKey');
  if (apiEl && s.claude_api_key) apiEl.value = s.claude_api_key;

  liveCalcTDEE();
}

function saveSettings() {
  const age      = parseFloat(document.getElementById('sAge').value)      || null;
  const height   = parseFloat(document.getElementById('sHeight').value)   || null;
  const weight   = parseFloat(document.getElementById('sWeight').value)   || null;
  const activity = parseFloat(document.getElementById('sActivity').value) || 1.55;
  const apiKey   = document.getElementById('sApiKey').value.trim() || null;

  DB.saveSettings({
    gender:       currentGender,
    age, height, weight,
    activity_level: activity,
    goal_mode:    currentGoalMode,
    calorie_goal: parseFloat(document.getElementById('sCalorie').value) || 2000,
    protein_goal: parseFloat(document.getElementById('sProtein').value) || 150,
    carbs_goal:   parseFloat(document.getElementById('sCarbs').value)   || 225,
    fat_goal:     parseFloat(document.getElementById('sFat').value)     || 65,
    water_goal:   parseFloat(document.getElementById('sWater').value)   || 2000,
    claude_api_key: apiKey,
  });
  showToast('✅ 設定已儲存');
}

// ── Goals ──────────────────────────────────────────────────────────────────────

function renderGoals() {
  const g = DB.getGoals();
  const s = DB.getSettings();

  if (g.start_weight)  document.getElementById('gStartWeight').value  = g.start_weight;
  if (g.target_weight) document.getElementById('gTargetWeight').value = g.target_weight;
  if (g.target_date)   document.getElementById('gTargetDate').value   = g.target_date;

  const weights         = DB.getWeights();
  const latestWeight    = weights.length > 0 ? weights[0].weight : (s.weight || null);
  const profileComplete = !!(s.age && s.height && latestWeight);

  const noticeEl = document.getElementById('goalProfileNotice');
  if (noticeEl) noticeEl.style.display = profileComplete ? 'none' : 'block';

  if (g.start_weight && g.target_weight) {
    const currentWt = latestWeight || g.start_weight;
    _renderGoalProgress(g, currentWt);

    let bmr = null, tdee = null;
    if (profileComplete) {
      bmr  = calcBMR(s.gender || 'male', s.age, s.height, latestWeight);
      tdee = calcTDEE(bmr, s.activity_level || 1.55);
    }

    const height = s.height || g.height || null;
    if (height) _renderGoalBMI(g, currentWt, height);

    _renderGoalEstimate(g, currentWt, tdee, profileComplete, bmr, s);
  }
}

function saveGoals() {
  const startWeight  = parseFloat(document.getElementById('gStartWeight').value);
  const targetWeight = parseFloat(document.getElementById('gTargetWeight').value);
  const targetDate   = document.getElementById('gTargetDate').value;
  if (!startWeight || !targetWeight) { showToast('請填寫起始體重和目標體重'); return; }
  if (startWeight === targetWeight)  { showToast('起始體重和目標體重不能相同'); return; }
  DB.saveGoals({ start_weight: startWeight, target_weight: targetWeight, target_date: targetDate || null });
  showToast('✅ 目標已儲存');
  renderGoals();
}

function _renderGoalProgress(g, currentWt) {
  const isLosing  = g.target_weight < g.start_weight;
  const totalDiff = Math.abs(g.target_weight - g.start_weight);
  const achieved  = isLosing
    ? Math.max(0, g.start_weight - currentWt)
    : Math.max(0, currentWt - g.start_weight);
  const remaining = Math.abs(currentWt - g.target_weight);
  const pct       = Math.min((achieved / totalDiff) * 100, 100);
  const done      = isLosing ? currentWt <= g.target_weight : currentWt >= g.target_weight;
  const dir       = isLosing ? '減' : '增';

  const card = document.getElementById('goalProgress');
  card.style.display = 'block';
  document.getElementById('goalProgressContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;text-align:center">
      <div style="background:#F9FAFB;border-radius:12px;padding:12px">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">起始</div>
        <div style="font-size:1.4rem;font-weight:800">${g.start_weight}</div>
        <div style="font-size:0.7rem;color:var(--muted)">kg</div>
      </div>
      <div style="background:${done ? 'var(--green-light)' : 'var(--orange-light)'};border-radius:12px;padding:12px">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">現在</div>
        <div style="font-size:1.4rem;font-weight:800;color:${done ? 'var(--green)' : 'var(--orange)'}">${currentWt}</div>
        <div style="font-size:0.7rem;color:var(--muted)">kg</div>
      </div>
      <div style="background:var(--green-light);border-radius:12px;padding:12px">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">目標</div>
        <div style="font-size:1.4rem;font-weight:800;color:var(--green)">${g.target_weight}</div>
        <div style="font-size:0.7rem;color:var(--muted)">kg</div>
      </div>
    </div>
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:6px">
        <span style="color:var(--muted)">進度</span>
        <span style="font-weight:700;color:var(--green)">${pct.toFixed(1)}%</span>
      </div>
      <div style="height:14px;background:var(--border);border-radius:7px;overflow:hidden">
        <div style="height:100%;background:${done ? 'var(--green)' : 'linear-gradient(90deg,var(--green),var(--cyan))'};border-radius:7px;width:${pct}%;transition:width 0.6s"></div>
      </div>
    </div>
    ${done
      ? `<div style="text-align:center;padding:14px;background:var(--green-light);border-radius:12px;color:var(--green);font-weight:700;font-size:1rem">🎉 恭喜！已達成目標！</div>`
      : `<div style="display:flex;justify-content:space-between;font-size:0.82rem;padding:10px 0">
           <span style="color:var(--muted)">還差 <strong style="color:var(--orange);font-size:1rem">${remaining.toFixed(1)} kg</strong></span>
           ${achieved > 0 ? `<span style="color:var(--muted)">已${dir} <strong style="color:var(--green)">${achieved.toFixed(1)} kg</strong></span>` : ''}
         </div>`
    }
  `;
}

function _renderGoalBMI(g, currentWt, height) {
  const h   = height / 100;
  const cur = (currentWt / (h * h)).toFixed(1);
  const tgt = (g.target_weight / (h * h)).toFixed(1);

  const [cL, cC, cBg, cTip] = getBMIInfo(parseFloat(cur));
  const [tL, tC, tBg, tTip] = getBMIInfo(parseFloat(tgt));

  const card = document.getElementById('goalBMICard');
  card.style.display = 'block';
  document.getElementById('goalBMIContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div style="background:${cBg};border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">目前 BMI</div>
        <div style="font-size:2.2rem;font-weight:800;color:${cC};line-height:1">${cur}</div>
        <div style="font-size:0.78rem;font-weight:700;color:${cC};margin-top:4px">${cL}</div>
      </div>
      <div style="background:${tBg};border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">目標 BMI</div>
        <div style="font-size:2.2rem;font-weight:800;color:${tC};line-height:1">${tgt}</div>
        <div style="font-size:0.78rem;font-weight:700;color:${tC};margin-top:4px">${tL}</div>
      </div>
    </div>
    <div style="background:#F9FAFB;border-radius:10px;padding:12px;font-size:0.78rem;color:var(--text-2);line-height:1.8">
      <strong style="color:${cC}">目前：</strong>${cTip}<br>
      <strong style="color:${tC}">目標：</strong>${tTip}<br>
      <span style="font-size:0.7rem;color:var(--muted)">BMI 健康範圍 18.5–24.0（衛福部國健署標準）</span>
    </div>
  `;
}

function _renderGoalEstimate(g, currentWt, tdee, profileComplete, bmr, s) {
  const isLosing  = g.target_weight < g.start_weight;
  const remaining = Math.abs(currentWt - g.target_weight);
  const done      = isLosing ? currentWt <= g.target_weight : currentWt >= g.target_weight;

  const card = document.getElementById('goalEstimateCard');
  card.style.display = 'block';

  const recentDates = dateRange(7);
  const recentSums  = recentDates.map(d => getSummary(d).calories).filter(c => c > 0);
  const avgCal      = recentSums.length > 0 ? recentSums.reduce((a, b) => a + b, 0) / recentSums.length : 0;

  let html = '';

  if (profileComplete && tdee && bmr) {
    const macros = calcMacros(s.goal_mode || 'loss', tdee, currentWt, s.gender || 'male');
    html += `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:#F9FAFB;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:0.7rem;color:var(--muted);margin-bottom:2px">基礎代謝 BMR</div>
          <div style="font-size:1.5rem;font-weight:800">${bmr}</div>
          <div style="font-size:0.68rem;color:var(--muted)">kcal / 天</div>
        </div>
        <div style="background:var(--green-light);border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:0.7rem;color:var(--muted);margin-bottom:2px">每日消耗 TDEE</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--green)">${tdee}</div>
          <div style="font-size:0.68rem;color:var(--muted)">kcal / 天</div>
        </div>
      </div>
      <div style="background:var(--green-light);border-radius:10px;padding:12px;font-size:0.82rem;margin-bottom:14px;line-height:1.8">
        建議每日攝取：<strong style="color:var(--green);font-size:1rem">${macros.calories} kcal</strong><br>
        <span style="font-size:0.73rem;color:var(--muted)">蛋白 ${macros.protein}g · 碳水 ${macros.carbs}g · 脂肪 ${macros.fat}g · 水 ${macros.water}ml</span>
      </div>
    `;
  }

  if (g.target_date) {
    const today    = new Date();
    const target   = new Date(g.target_date);
    const daysLeft = Math.ceil((target - today) / 86400000);
    html += `
      <div style="background:${daysLeft > 0 ? 'var(--green-light)' : '#FEF2F2'};border-radius:12px;padding:16px;text-align:center;margin-bottom:14px">
        <div style="font-size:0.8rem;color:var(--muted);margin-bottom:4px">距離目標日期</div>
        <div style="font-size:2.5rem;font-weight:800;color:${daysLeft > 0 ? 'var(--green)' : '#EF4444'};line-height:1">${Math.max(0, daysLeft)}</div>
        <div style="font-size:0.78rem;color:var(--muted);margin-top:4px">天</div>
      </div>
    `;
    if (!done && daysLeft > 0 && remaining > 0 && tdee) {
      const kgPerDay  = remaining / daysLeft;
      const calPerDay = kgPerDay * 7700;
      const needCal   = isLosing ? Math.round(tdee - calPerDay) : Math.round(tdee + calPerDay);
      html += `
        <div style="background:#F9FAFB;border-radius:12px;padding:12px;font-size:0.82rem;line-height:1.9;margin-bottom:14px">
          每日需${isLosing ? '製造' : '增加'} <strong style="color:var(--orange)">${Math.round(calPerDay)} kcal</strong> 的熱量${isLosing ? '缺口' : '盈餘'}<br>
          建議每天攝取約 <strong style="color:var(--green)">${needCal} kcal</strong>
        </div>
      `;
    }
  }

  if (done) {
    html += `<div style="text-align:center;padding:14px;background:var(--green-light);border-radius:12px;color:var(--green);font-weight:700">🎉 已達成目標！繼續保持！</div>`;
  } else if (avgCal > 0) {
    const refTDEE   = tdee || (s && s.calorie_goal) || 2000;
    const dailyDiff = isLosing ? (refTDEE - avgCal) : (avgCal - refTDEE);
    const basis     = profileComplete ? `真實 TDEE ${refTDEE} kcal` : `目標攝取量 ${refTDEE} kcal`;
    html += `<div style="font-size:0.78rem;color:var(--muted);margin-bottom:8px">依過去 ${recentSums.length} 天飲食紀錄推算（基準：${basis}）</div>`;

    if (dailyDiff > 50) {
      const daysToGoal  = Math.round(remaining * 7700 / dailyDiff);
      const goalDate    = new Date();
      goalDate.setDate(goalDate.getDate() + daysToGoal);
      const goalDateStr = goalDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
      html += `
        <div style="background:var(--blue-light);border-radius:12px;padding:14px;font-size:0.84rem;line-height:2">
          平均每日攝取 <strong>${Math.round(avgCal)} kcal</strong><br>
          每日熱量${isLosing ? '缺口' : '盈餘'} <strong style="color:var(--green)">${Math.round(dailyDiff)} kcal</strong><br>
          預計約 <strong style="color:var(--green);font-size:1rem">${daysToGoal} 天</strong>後達成<br>
          <span style="color:var(--muted)">（約 ${goalDateStr}）</span>
        </div>
      `;
    } else if (dailyDiff <= 0) {
      html += `
        <div style="background:#FEF2F2;border-radius:12px;padding:14px;font-size:0.84rem;line-height:1.9;color:#EF4444">
          ⚠️ 目前攝取量（${Math.round(avgCal)} kcal）${isLosing ? '≥ 基準值，無法產生熱量缺口' : '低於基準值，無法增重'}<br>
          <span style="font-size:0.78rem">請${isLosing ? '減少' : '增加'}每日攝取量</span>
        </div>
      `;
    } else {
      html += `
        <div style="background:#FFF7ED;border-radius:12px;padding:14px;font-size:0.84rem;line-height:1.9;color:#F97316">
          目前熱量${isLosing ? '缺口' : '盈餘'}僅 ${Math.round(dailyDiff)} kcal，進度較慢<br>
          <span style="font-size:0.78rem">建議${isLosing ? '每日再減少 200-300 kcal 攝取' : '每日再增加 200-300 kcal 攝取'}</span>
        </div>
      `;
    }
  } else {
    html += `<div style="font-size:0.82rem;color:var(--muted);text-align:center;padding:14px">請先記錄幾天的飲食，才能計算預估時間</div>`;
  }

  document.getElementById('goalEstimateContent').innerHTML = html;
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');

  let timer;
  const si = document.getElementById('foodSearch');
  if (si) {
    si.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => doSearch(e.target.value), 250);
    });
  }

  document.querySelectorAll('.chip[data-meal]').forEach(chip => {
    chip.addEventListener('click', () => setActiveMeal(chip.dataset.meal));
  });

  document.addEventListener('click', e => {
    const s = document.getElementById('foodSearch');
    const r = document.getElementById('searchResults');
    if (s && r && !s.contains(e.target) && !r.contains(e.target)) {
      r.classList.remove('show');
    }
  });

  document.querySelectorAll('.period-tab').forEach(tab => {
    tab.addEventListener('click', () => renderTrends(parseInt(tab.dataset.days)));
  });

  ['heightInput','bmiWeight'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calcBMI);
  });

  ['foodModal','manualModal','photoModal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) {
      if (e.target === this) {
        if (id === 'foodModal') closeModal();
        else if (id === 'manualModal') closeManualModal();
        else closePhotoScan();
      }
    });
  });
});
