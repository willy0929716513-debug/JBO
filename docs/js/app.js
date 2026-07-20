'use strict';

// ── Push Worker URL (fill in after deploying Cloudflare Worker) ──────────────
const PUSH_WORKER_URL = '';
const VAPID_PUBLIC_KEY = 'BF1Ebypxb5Bi92iqYRtXo-SL2Fz_T9VJJUXLtSj1n7BjyZFqR4aiYpdWkOEXrhLoS4iLFSJ4vQ1hxi6dLSaCbUo';

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  gender: 'male', age: null, height: null, weight: null,
  activity_level: 1.55, goal_mode: 'loss',
  calorie_goal: 2000, protein_goal: 150,
  carbs_goal: 225, fat_goal: 65, water_goal: 2000,
  gemini_api_key: null,
};

const MEAL_META = [
  { id: 'breakfast', label: '早餐', icon: '🌅', color: '#F97316' },
  { id: 'lunch',     label: '午餐', icon: '☀️',  color: '#22C55E' },
  { id: 'dinner',    label: '晚餐', icon: '🌙',  color: '#3B82F6' },
  { id: 'snack',     label: '點心', icon: '🧃',  color: '#8B5CF6' },
  { id: 'fruit',     label: '水果', icon: '🍎', color: '#EC4899' },
];

const FOOD_DB = {
  // ══ 米飯類 ══
  '白飯':        { calories: 130, protein: 2.7,  carbs: 28.7, fat: 0.3  },
  '糙米飯':      { calories: 111, protein: 2.6,  carbs: 23.5, fat: 0.9  },
  '五穀飯':      { calories: 120, protein: 3.2,  carbs: 25.0, fat: 1.0  },
  '紫米飯':      { calories: 128, protein: 3.0,  carbs: 27.0, fat: 0.8  },
  '稀飯':        { calories: 46,  protein: 1.1,  carbs: 10.2, fat: 0.1  },
  '地瓜粥':      { calories: 55,  protein: 1.2,  carbs: 12.5, fat: 0.1  },
  '皮蛋瘦肉粥':  { calories: 75,  protein: 5.5,  carbs: 10.0, fat: 1.5  },
  '炒飯':        { calories: 175, protein: 4.5,  carbs: 30.0, fat: 4.5  },
  '蛋炒飯':      { calories: 185, protein: 6.5,  carbs: 29.0, fat: 5.5  },
  '雞肉炒飯':    { calories: 190, protein: 9.0,  carbs: 28.5, fat: 5.0  },
  '滷肉飯':      { calories: 210, protein: 8.5,  carbs: 32.0, fat: 6.5  },
  '雞腿飯':      { calories: 230, protein: 14.0, carbs: 28.0, fat: 7.0  },
  '排骨飯':      { calories: 250, protein: 13.0, carbs: 28.0, fat: 9.5  },
  '便當':        { calories: 650, protein: 25.0, carbs: 85.0, fat: 20.0 },
  '鮭魚飯':      { calories: 195, protein: 12.0, carbs: 28.0, fat: 4.5  },
  '丼飯':        { calories: 220, protein: 12.0, carbs: 32.0, fat: 5.5  },
  '親子丼':      { calories: 195, protein: 13.0, carbs: 25.0, fat: 5.5  },
  '牛肉丼':      { calories: 215, protein: 14.0, carbs: 27.0, fat: 6.0  },
  '壽司':        { calories: 145, protein: 5.5,  carbs: 26.0, fat: 2.0  },
  '手捲':        { calories: 155, protein: 5.5,  carbs: 26.0, fat: 3.5  },
  '飯糰':        { calories: 185, protein: 5.0,  carbs: 38.0, fat: 1.5  },
  // ══ 麵類 ══
  '麵條':        { calories: 138, protein: 4.5,  carbs: 27.8, fat: 0.6  },
  '陽春麵':      { calories: 140, protein: 4.8,  carbs: 28.5, fat: 0.8  },
  '烏龍麵':      { calories: 105, protein: 2.6,  carbs: 21.6, fat: 0.4  },
  '拉麵':        { calories: 137, protein: 4.9,  carbs: 25.9, fat: 1.7  },
  '泡麵':        { calories: 445, protein: 9.5,  carbs: 62.0, fat: 17.5 },
  '乾麵':        { calories: 155, protein: 5.0,  carbs: 30.0, fat: 1.5  },
  '刀削麵':      { calories: 130, protein: 4.2,  carbs: 26.5, fat: 0.5  },
  '義大利麵':    { calories: 157, protein: 5.8,  carbs: 30.9, fat: 0.9  },
  '麵線':        { calories: 119, protein: 3.5,  carbs: 24.5, fat: 0.5  },
  '粄條':        { calories: 110, protein: 2.0,  carbs: 24.5, fat: 0.3  },
  '河粉':        { calories: 108, protein: 2.2,  carbs: 24.0, fat: 0.2  },
  '米粉':        { calories: 109, protein: 0.8,  carbs: 25.5, fat: 0.2  },
  '冬粉':        { calories: 84,  protein: 0.0,  carbs: 21.0, fat: 0.0  },
  '牛肉麵':      { calories: 195, protein: 12.0, carbs: 25.0, fat: 5.5  },
  '肉絲麵':      { calories: 170, protein: 9.5,  carbs: 25.5, fat: 3.5  },
  '排骨麵':      { calories: 210, protein: 12.5, carbs: 24.5, fat: 7.0  },
  '雞絲麵':      { calories: 165, protein: 11.0, carbs: 24.0, fat: 3.0  },
  '擔仔麵':      { calories: 150, protein: 7.5,  carbs: 23.5, fat: 3.5  },
  '意麵':        { calories: 145, protein: 5.0,  carbs: 27.5, fat: 2.0  },
  '炒米粉':      { calories: 135, protein: 3.5,  carbs: 27.0, fat: 2.0  },
  // ══ 麵包 早餐 ══
  '吐司':        { calories: 265, protein: 9.0,  carbs: 49.0, fat: 3.2  },
  '全麥吐司':    { calories: 247, protein: 10.7, carbs: 41.4, fat: 3.9  },
  '饅頭':        { calories: 223, protein: 7.1,  carbs: 46.2, fat: 0.7  },
  '花捲':        { calories: 215, protein: 6.5,  carbs: 43.5, fat: 1.8  },
  '包子':        { calories: 223, protein: 8.5,  carbs: 38.0, fat: 4.5  },
  '叉燒包':      { calories: 280, protein: 10.0, carbs: 40.0, fat: 8.5  },
  '菜包':        { calories: 190, protein: 6.0,  carbs: 36.0, fat: 3.0  },
  '蛋餅':        { calories: 255, protein: 9.8,  carbs: 33.2, fat: 9.2  },
  '蔥蛋餅':      { calories: 270, protein: 10.5, carbs: 33.5, fat: 10.5 },
  '起司蛋餅':    { calories: 305, protein: 13.0, carbs: 33.5, fat: 13.0 },
  '燒餅':        { calories: 326, protein: 8.5,  carbs: 59.0, fat: 6.5  },
  '油條':        { calories: 386, protein: 7.2,  carbs: 50.5, fat: 17.5 },
  '燒餅油條':    { calories: 360, protein: 8.0,  carbs: 55.0, fat: 12.0 },
  '蛋餅加蛋':    { calories: 310, protein: 16.5, carbs: 33.5, fat: 13.0 },
  '漢堡':        { calories: 295, protein: 17.0, carbs: 30.0, fat: 11.5 },
  '三明治':      { calories: 220, protein: 10.5, carbs: 28.0, fat: 7.5  },
  '潛艇堡':      { calories: 250, protein: 13.5, carbs: 32.0, fat: 7.0  },
  '貝果':        { calories: 245, protein: 9.5,  carbs: 48.0, fat: 1.5  },
  '可頌':        { calories: 406, protein: 8.2,  carbs: 45.5, fat: 21.0 },
  '菠蘿麵包':    { calories: 355, protein: 7.0,  carbs: 55.0, fat: 12.0 },
  '紅豆麵包':    { calories: 310, protein: 7.5,  carbs: 56.0, fat: 6.5  },
  '奶油麵包':    { calories: 330, protein: 7.0,  carbs: 52.0, fat: 10.5 },
  '肉鬆麵包':    { calories: 340, protein: 10.5, carbs: 50.0, fat: 10.0 },
  '墨西哥捲餅':  { calories: 215, protein: 8.5,  carbs: 30.5, fat: 7.5  },
  // ══ 蛋類 ══
  '雞蛋':        { calories: 155, protein: 13.0, carbs: 1.1,  fat: 11.0 },
  '水煮蛋':      { calories: 155, protein: 13.0, carbs: 1.1,  fat: 11.0 },
  '荷包蛋':      { calories: 196, protein: 13.6, carbs: 0.6,  fat: 15.5 },
  '炒蛋':        { calories: 185, protein: 13.5, carbs: 1.5,  fat: 14.0 },
  '蒸蛋':        { calories: 80,  protein: 7.5,  carbs: 1.0,  fat: 5.0  },
  '茶葉蛋':      { calories: 163, protein: 13.5, carbs: 2.5,  fat: 11.0 },
  '溏心蛋':      { calories: 155, protein: 13.0, carbs: 1.1,  fat: 11.0 },
  '滷蛋':        { calories: 163, protein: 13.5, carbs: 2.5,  fat: 11.0 },
  '皮蛋':        { calories: 171, protein: 13.7, carbs: 2.8,  fat: 12.0 },
  '鹹蛋':        { calories: 190, protein: 13.5, carbs: 1.0,  fat: 14.5 },
  '蛋花湯':      { calories: 35,  protein: 3.5,  carbs: 1.5,  fat: 1.5  },
  '歐姆蛋':      { calories: 195, protein: 13.5, carbs: 1.5,  fat: 15.0 },
  '班尼迪克蛋':  { calories: 290, protein: 17.0, carbs: 16.0, fat: 18.0 },
  // ══ 雞肉 ══
  '雞胸肉':      { calories: 165, protein: 31.0, carbs: 0.0,  fat: 3.6  },
  '雞腿肉':      { calories: 209, protein: 26.0, carbs: 0.0,  fat: 11.0 },
  '雞翅':        { calories: 290, protein: 27.0, carbs: 0.0,  fat: 19.0 },
  '雞排':        { calories: 285, protein: 25.0, carbs: 10.5, fat: 15.5 },
  '炸雞':        { calories: 285, protein: 25.0, carbs: 10.5, fat: 15.5 },
  '炸雞塊':      { calories: 265, protein: 22.0, carbs: 13.5, fat: 13.5 },
  '烤雞':        { calories: 215, protein: 27.0, carbs: 0.0,  fat: 11.5 },
  '滷雞腿':      { calories: 195, protein: 25.0, carbs: 2.5,  fat: 9.5  },
  '鹽酥雞':      { calories: 310, protein: 20.5, carbs: 15.0, fat: 18.5 },
  '香雞排':      { calories: 285, protein: 25.0, carbs: 10.5, fat: 15.5 },
  '鹽水雞':      { calories: 170, protein: 28.0, carbs: 2.0,  fat: 5.5  },
  '白斬雞':      { calories: 185, protein: 26.0, carbs: 0.5,  fat: 8.5  },
  '三杯雞':      { calories: 210, protein: 22.5, carbs: 5.5,  fat: 11.0 },
  '宮保雞丁':    { calories: 185, protein: 18.5, carbs: 8.5,  fat: 9.0  },
  '雞丁':        { calories: 175, protein: 22.0, carbs: 4.0,  fat: 7.5  },
  '棒棒腿':      { calories: 209, protein: 26.0, carbs: 0.0,  fat: 11.0 },
  // ══ 豬肉 ══
  '豬里肌':      { calories: 143, protein: 22.0, carbs: 0.0,  fat: 5.4  },
  '豬五花':      { calories: 518, protein: 14.0, carbs: 0.0,  fat: 52.0 },
  '排骨':        { calories: 292, protein: 18.0, carbs: 0.0,  fat: 24.0 },
  '豬排':        { calories: 282, protein: 20.5, carbs: 8.5,  fat: 17.5 },
  '炸豬排':      { calories: 320, protein: 20.0, carbs: 12.0, fat: 21.0 },
  '滷肉':        { calories: 290, protein: 16.0, carbs: 5.0,  fat: 23.0 },
  '控肉':        { calories: 350, protein: 15.0, carbs: 8.0,  fat: 29.0 },
  '豬腳':        { calories: 260, protein: 20.0, carbs: 0.5,  fat: 20.0 },
  '叉燒':        { calories: 290, protein: 19.5, carbs: 8.5,  fat: 19.5 },
  '香腸':        { calories: 345, protein: 14.5, carbs: 4.5,  fat: 30.5 },
  '臘腸':        { calories: 508, protein: 22.0, carbs: 3.5,  fat: 44.5 },
  '火腿':        { calories: 145, protein: 19.5, carbs: 2.5,  fat: 6.0  },
  '培根':        { calories: 541, protein: 37.0, carbs: 1.4,  fat: 42.0 },
  '豬血糕':      { calories: 161, protein: 7.5,  carbs: 30.0, fat: 1.5  },
  '豬肝':        { calories: 135, protein: 20.5, carbs: 3.5,  fat: 3.5  },
  '豬心':        { calories: 118, protein: 17.0, carbs: 0.0,  fat: 5.5  },
  '豬大腸':      { calories: 186, protein: 14.0, carbs: 0.0,  fat: 14.5 },
  '肉鬆':        { calories: 400, protein: 37.5, carbs: 20.0, fat: 18.5 },
  '肉燥':        { calories: 295, protein: 16.0, carbs: 4.0,  fat: 24.0 },
  // ══ 牛肉 ══
  '牛肉':        { calories: 250, protein: 26.0, carbs: 0.0,  fat: 15.0 },
  '牛排':        { calories: 271, protein: 26.0, carbs: 0.0,  fat: 18.0 },
  '漢堡排':      { calories: 295, protein: 18.0, carbs: 8.0,  fat: 21.0 },
  '牛腱':        { calories: 151, protein: 22.5, carbs: 1.0,  fat: 6.0  },
  '牛肚':        { calories: 97,  protein: 14.5, carbs: 0.0,  fat: 4.5  },
  '牛舌':        { calories: 224, protein: 17.5, carbs: 0.0,  fat: 16.5 },
  '霜降牛肉':    { calories: 380, protein: 18.0, carbs: 0.0,  fat: 34.0 },
  '沙朗牛排':    { calories: 271, protein: 26.0, carbs: 0.0,  fat: 18.0 },
  '牛絞肉':      { calories: 254, protein: 24.5, carbs: 0.0,  fat: 16.5 },
  '紅燒牛肉':    { calories: 180, protein: 18.0, carbs: 5.0,  fat: 9.5  },
  // ══ 海鮮 ══
  '鮭魚':        { calories: 208, protein: 20.0, carbs: 0.0,  fat: 13.0 },
  '鮪魚':        { calories: 128, protein: 28.0, carbs: 0.0,  fat: 1.2  },
  '鮪魚罐頭':    { calories: 116, protein: 25.5, carbs: 0.0,  fat: 1.0  },
  '虱目魚':      { calories: 165, protein: 22.0, carbs: 0.0,  fat: 8.5  },
  '吳郭魚':      { calories: 129, protein: 26.0, carbs: 0.0,  fat: 2.7  },
  '鱸魚':        { calories: 124, protein: 24.0, carbs: 0.0,  fat: 2.5  },
  '秋刀魚':      { calories: 297, protein: 18.5, carbs: 0.0,  fat: 24.5 },
  '鯖魚':        { calories: 205, protein: 19.0, carbs: 0.0,  fat: 13.5 },
  '鱈魚':        { calories: 82,  protein: 18.0, carbs: 0.0,  fat: 0.7  },
  '比目魚':      { calories: 91,  protein: 19.5, carbs: 0.0,  fat: 1.2  },
  '土魠魚':      { calories: 155, protein: 22.5, carbs: 0.0,  fat: 7.0  },
  '土魠魚羹':    { calories: 95,  protein: 7.5,  carbs: 10.5, fat: 2.5  },
  '土魠魚羹飯':  { calories: 108, protein: 6.5,  carbs: 17.5, fat: 2.0  },
  '土托魚羹':    { calories: 95,  protein: 7.5,  carbs: 10.5, fat: 2.5  },
  '土托魚羹飯':  { calories: 108, protein: 6.5,  carbs: 17.5, fat: 2.0  },
  '魚羹飯':      { calories: 105, protein: 6.0,  carbs: 17.0, fat: 2.0  },
  '魚羹':        { calories: 88,  protein: 6.5,  carbs: 10.0, fat: 2.0  },
  '魚羹湯':      { calories: 70,  protein: 6.0,  carbs: 8.0,  fat: 1.5  },
  '蝦子':        { calories: 99,  protein: 24.0, carbs: 0.0,  fat: 0.3  },
  '草蝦':        { calories: 98,  protein: 22.5, carbs: 0.0,  fat: 0.5  },
  '龍蝦':        { calories: 98,  protein: 21.5, carbs: 0.3,  fat: 0.8  },
  '螃蟹':        { calories: 97,  protein: 18.5, carbs: 0.0,  fat: 2.0  },
  '花枝':        { calories: 92,  protein: 17.0, carbs: 3.0,  fat: 1.2  },
  '透抽':        { calories: 90,  protein: 16.5, carbs: 2.5,  fat: 1.5  },
  '章魚':        { calories: 82,  protein: 15.0, carbs: 2.2,  fat: 1.0  },
  '蛤蜊':        { calories: 74,  protein: 13.0, carbs: 3.7,  fat: 0.7  },
  '牡蠣':        { calories: 69,  protein: 8.5,  carbs: 4.0,  fat: 1.8  },
  '蚵仔':        { calories: 69,  protein: 8.5,  carbs: 4.0,  fat: 1.8  },
  '干貝':        { calories: 111, protein: 24.0, carbs: 0.0,  fat: 0.5  },
  '魚板':        { calories: 113, protein: 12.0, carbs: 11.5, fat: 1.8  },
  '竹輪':        { calories: 121, protein: 12.2, carbs: 13.5, fat: 2.2  },
  '炸竹輪':      { calories: 190, protein: 11.0, carbs: 17.0, fat: 8.5  },
  '銀魚':        { calories: 96,  protein: 19.5, carbs: 0.0,  fat: 1.8  },
  '炸銀魚':      { calories: 210, protein: 16.0, carbs: 12.0, fat: 11.0 },
  '小銀魚':      { calories: 96,  protein: 19.5, carbs: 0.0,  fat: 1.8  },
  '魚丸':        { calories: 110, protein: 8.5,  carbs: 12.5, fat: 2.5  },
  '蟹肉棒':      { calories: 94,  protein: 8.5,  carbs: 13.0, fat: 0.5  },
  // ══ 豆製品 ══
  '豆腐':        { calories: 76,  protein: 8.0,  carbs: 1.9,  fat: 4.2  },
  '嫩豆腐':      { calories: 55,  protein: 5.5,  carbs: 1.4,  fat: 2.8  },
  '板豆腐':      { calories: 76,  protein: 8.0,  carbs: 1.9,  fat: 4.2  },
  '豆干':        { calories: 160, protein: 17.0, carbs: 3.5,  fat: 8.5  },
  '百頁豆腐':    { calories: 215, protein: 13.5, carbs: 4.5,  fat: 16.0 },
  '豆皮':        { calories: 197, protein: 23.5, carbs: 1.5,  fat: 10.5 },
  '豆腐乳':      { calories: 130, protein: 10.5, carbs: 3.5,  fat: 8.5  },
  '豆漿':        { calories: 54,  protein: 3.3,  carbs: 6.4,  fat: 1.7  },
  '無糖豆漿':    { calories: 35,  protein: 3.2,  carbs: 1.5,  fat: 1.5  },
  '毛豆':        { calories: 122, protein: 11.0, carbs: 8.9,  fat: 5.2  },
  '黃豆':        { calories: 446, protein: 36.5, carbs: 30.2, fat: 19.9 },
  '黑豆':        { calories: 341, protein: 21.6, carbs: 23.7, fat: 14.0 },
  '紅豆':        { calories: 314, protein: 20.0, carbs: 63.0, fat: 0.6  },
  '納豆':        { calories: 200, protein: 16.5, carbs: 12.5, fat: 10.0 },
  '臭豆腐':      { calories: 216, protein: 14.5, carbs: 10.0, fat: 13.0 },
  // ══ 蔬菜 ══
  '花椰菜':      { calories: 34,  protein: 2.8,  carbs: 7.0,  fat: 0.4  },
  '綠花椰菜':    { calories: 34,  protein: 2.8,  carbs: 7.0,  fat: 0.4  },
  '白花椰菜':    { calories: 25,  protein: 1.9,  carbs: 5.0,  fat: 0.3  },
  '高麗菜':      { calories: 25,  protein: 1.3,  carbs: 5.8,  fat: 0.1  },
  '大白菜':      { calories: 16,  protein: 1.2,  carbs: 3.2,  fat: 0.2  },
  '小白菜':      { calories: 13,  protein: 1.5,  carbs: 2.2,  fat: 0.2  },
  '菠菜':        { calories: 23,  protein: 2.9,  carbs: 3.6,  fat: 0.4  },
  '番茄':        { calories: 18,  protein: 0.9,  carbs: 3.9,  fat: 0.2  },
  '小番茄':      { calories: 18,  protein: 0.9,  carbs: 3.9,  fat: 0.2  },
  '小黃瓜':      { calories: 16,  protein: 0.7,  carbs: 3.6,  fat: 0.1  },
  '大黃瓜':      { calories: 13,  protein: 0.6,  carbs: 2.9,  fat: 0.1  },
  '苦瓜':        { calories: 17,  protein: 1.0,  carbs: 4.0,  fat: 0.2  },
  '絲瓜':        { calories: 20,  protein: 1.2,  carbs: 4.4,  fat: 0.1  },
  '南瓜':        { calories: 26,  protein: 1.0,  carbs: 6.5,  fat: 0.1  },
  '冬瓜':        { calories: 13,  protein: 0.4,  carbs: 3.0,  fat: 0.2  },
  '胡蘿蔔':      { calories: 41,  protein: 0.9,  carbs: 9.6,  fat: 0.2  },
  '白蘿蔔':      { calories: 18,  protein: 0.6,  carbs: 4.1,  fat: 0.1  },
  '洋蔥':        { calories: 40,  protein: 1.1,  carbs: 9.3,  fat: 0.1  },
  '蒜頭':        { calories: 149, protein: 6.4,  carbs: 33.1, fat: 0.5  },
  '薑':          { calories: 80,  protein: 1.8,  carbs: 17.8, fat: 0.8  },
  '辣椒':        { calories: 40,  protein: 2.0,  carbs: 8.8,  fat: 0.4  },
  '青椒':        { calories: 20,  protein: 0.9,  carbs: 4.6,  fat: 0.2  },
  '紅椒':        { calories: 31,  protein: 1.0,  carbs: 6.0,  fat: 0.3  },
  '玉米':        { calories: 86,  protein: 3.2,  carbs: 19.0, fat: 1.2  },
  '玉米筍':      { calories: 31,  protein: 2.4,  carbs: 6.0,  fat: 0.2  },
  '香菇':        { calories: 34,  protein: 2.2,  carbs: 6.8,  fat: 0.5  },
  '金針菇':      { calories: 37,  protein: 2.7,  carbs: 7.4,  fat: 0.3  },
  '杏鮑菇':      { calories: 35,  protein: 3.7,  carbs: 6.1,  fat: 0.2  },
  '鴻喜菇':      { calories: 22,  protein: 2.2,  carbs: 4.7,  fat: 0.1  },
  '舞菇':        { calories: 26,  protein: 2.0,  carbs: 4.4,  fat: 0.3  },
  '空心菜':      { calories: 19,  protein: 2.6,  carbs: 2.1,  fat: 0.3  },
  '地瓜葉':      { calories: 28,  protein: 2.9,  carbs: 4.0,  fat: 0.3  },
  '茄子':        { calories: 25,  protein: 1.0,  carbs: 5.9,  fat: 0.2  },
  '豆芽菜':      { calories: 30,  protein: 3.0,  carbs: 5.9,  fat: 0.2  },
  '綠豆芽':      { calories: 30,  protein: 3.0,  carbs: 5.9,  fat: 0.2  },
  '生菜':        { calories: 15,  protein: 1.4,  carbs: 2.9,  fat: 0.2  },
  '萵苣':        { calories: 15,  protein: 1.4,  carbs: 2.9,  fat: 0.2  },
  '韭菜':        { calories: 32,  protein: 2.3,  carbs: 5.7,  fat: 0.4  },
  '青蔥':        { calories: 30,  protein: 1.8,  carbs: 6.3,  fat: 0.2  },
  '芹菜':        { calories: 14,  protein: 0.7,  carbs: 3.0,  fat: 0.2  },
  '西洋芹':      { calories: 14,  protein: 0.7,  carbs: 3.0,  fat: 0.2  },
  '青江菜':      { calories: 13,  protein: 1.5,  carbs: 2.2,  fat: 0.2  },
  '山蘇':        { calories: 24,  protein: 3.2,  carbs: 3.5,  fat: 0.3  },
  '龍鬚菜':      { calories: 28,  protein: 2.8,  carbs: 4.5,  fat: 0.3  },
  '秋葵':        { calories: 33,  protein: 1.9,  carbs: 7.5,  fat: 0.2  },
  '蘆筍':        { calories: 20,  protein: 2.2,  carbs: 3.9,  fat: 0.1  },
  '竹筍':        { calories: 27,  protein: 2.6,  carbs: 5.2,  fat: 0.3  },
  '荸薺':        { calories: 97,  protein: 1.4,  carbs: 23.9, fat: 0.1  },
  '蓮藕':        { calories: 74,  protein: 2.6,  carbs: 17.2, fat: 0.1  },
  '牛蒡':        { calories: 72,  protein: 1.5,  carbs: 17.3, fat: 0.2  },
  '山藥':        { calories: 118, protein: 1.5,  carbs: 27.9, fat: 0.2  },
  '芋頭':        { calories: 116, protein: 1.5,  carbs: 26.5, fat: 0.2  },
  '地瓜':        { calories: 86,  protein: 1.6,  carbs: 20.0, fat: 0.1  },
  '馬鈴薯':      { calories: 77,  protein: 2.0,  carbs: 17.5, fat: 0.1  },
  '豌豆':        { calories: 81,  protein: 5.4,  carbs: 14.5, fat: 0.4  },
  '四季豆':      { calories: 31,  protein: 1.8,  carbs: 7.0,  fat: 0.1  },
  '皇帝豆':      { calories: 115, protein: 7.3,  carbs: 21.5, fat: 0.4  },
  // ══ 水果 ══
  '蘋果':        { calories: 52,  protein: 0.3,  carbs: 14.0, fat: 0.2  },
  '香蕉':        { calories: 89,  protein: 1.1,  carbs: 23.0, fat: 0.3  },
  '橘子':        { calories: 47,  protein: 0.9,  carbs: 12.0, fat: 0.1  },
  '柳橙':        { calories: 47,  protein: 0.9,  carbs: 12.0, fat: 0.1  },
  '西瓜':        { calories: 30,  protein: 0.6,  carbs: 7.6,  fat: 0.2  },
  '葡萄':        { calories: 69,  protein: 0.7,  carbs: 18.0, fat: 0.2  },
  '芒果':        { calories: 60,  protein: 0.8,  carbs: 15.0, fat: 0.4  },
  '草莓':        { calories: 32,  protein: 0.7,  carbs: 7.7,  fat: 0.3  },
  '鳳梨':        { calories: 50,  protein: 0.5,  carbs: 13.1, fat: 0.1  },
  '木瓜':        { calories: 43,  protein: 0.5,  carbs: 11.0, fat: 0.3  },
  '奇異果':      { calories: 61,  protein: 1.1,  carbs: 15.0, fat: 0.5  },
  '水梨':        { calories: 58,  protein: 0.4,  carbs: 15.5, fat: 0.1  },
  '藍莓':        { calories: 57,  protein: 0.7,  carbs: 14.5, fat: 0.3  },
  '葡萄柚':      { calories: 42,  protein: 0.8,  carbs: 10.7, fat: 0.1  },
  '火龍果':      { calories: 50,  protein: 1.2,  carbs: 11.0, fat: 0.4  },
  '荔枝':        { calories: 66,  protein: 0.8,  carbs: 16.5, fat: 0.4  },
  '龍眼':        { calories: 60,  protein: 1.3,  carbs: 15.1, fat: 0.1  },
  '釋迦':        { calories: 94,  protein: 2.1,  carbs: 23.7, fat: 0.3  },
  '蓮霧':        { calories: 35,  protein: 0.6,  carbs: 8.5,  fat: 0.2  },
  '芭樂':        { calories: 68,  protein: 2.6,  carbs: 14.3, fat: 1.0  },
  '楊桃':        { calories: 31,  protein: 1.0,  carbs: 7.0,  fat: 0.3  },
  '百香果':      { calories: 97,  protein: 2.2,  carbs: 23.4, fat: 0.7  },
  '李子':        { calories: 46,  protein: 0.7,  carbs: 11.4, fat: 0.3  },
  '桃子':        { calories: 39,  protein: 0.9,  carbs: 9.5,  fat: 0.3  },
  '水蜜桃':      { calories: 39,  protein: 0.9,  carbs: 9.5,  fat: 0.3  },
  '柿子':        { calories: 70,  protein: 0.6,  carbs: 18.6, fat: 0.2  },
  '椰子':        { calories: 354, protein: 3.3,  carbs: 15.2, fat: 33.5 },
  '酪梨':        { calories: 160, protein: 2.0,  carbs: 9.0,  fat: 14.7 },
  '覆盆子':      { calories: 52,  protein: 1.2,  carbs: 11.9, fat: 0.7  },
  '黑莓':        { calories: 43,  protein: 1.4,  carbs: 10.2, fat: 0.5  },
  '哈密瓜':      { calories: 34,  protein: 0.8,  carbs: 8.2,  fat: 0.2  },
  '香瓜':        { calories: 34,  protein: 0.8,  carbs: 8.2,  fat: 0.2  },
  '棗子':        { calories: 79,  protein: 1.2,  carbs: 20.2, fat: 0.2  },
  // 柑橘類
  '柚子':        { calories: 38,  protein: 0.8,  carbs: 8.6,  fat: 0.1  },
  '文旦':        { calories: 38,  protein: 0.7,  carbs: 9.0,  fat: 0.1  },
  '椪柑':        { calories: 42,  protein: 0.8,  carbs: 10.5, fat: 0.1  },
  '茂谷柑':      { calories: 45,  protein: 0.8,  carbs: 11.5, fat: 0.2  },
  '砂糖橘':      { calories: 40,  protein: 0.8,  carbs: 9.8,  fat: 0.1  },
  '柑橘':        { calories: 44,  protein: 0.9,  carbs: 11.2, fat: 0.1  },
  '金桔':        { calories: 71,  protein: 1.9,  carbs: 15.9, fat: 0.9  },
  '檸檬':        { calories: 29,  protein: 1.1,  carbs: 9.3,  fat: 0.3  },
  '萊姆':        { calories: 30,  protein: 0.7,  carbs: 10.5, fat: 0.2  },
  // 熱帶水果
  '榴槤':        { calories: 147, protein: 1.5,  carbs: 27.1, fat: 5.3  },
  '山竹':        { calories: 73,  protein: 0.4,  carbs: 17.9, fat: 0.6  },
  '紅毛丹':      { calories: 82,  protein: 0.7,  carbs: 20.6, fat: 0.2  },
  '人心果':      { calories: 83,  protein: 0.4,  carbs: 20.0, fat: 1.1  },
  '芭蕉':        { calories: 122, protein: 1.3,  carbs: 31.9, fat: 0.4  },
  // 溫帶水果
  '青蘋果':      { calories: 52,  protein: 0.3,  carbs: 13.8, fat: 0.2  },
  '富士蘋果':    { calories: 54,  protein: 0.3,  carbs: 14.4, fat: 0.2  },
  '西洋梨':      { calories: 57,  protein: 0.4,  carbs: 15.2, fat: 0.1  },
  '黃金奇異果':  { calories: 64,  protein: 1.0,  carbs: 15.8, fat: 0.3  },
  '巨峰葡萄':    { calories: 65,  protein: 0.5,  carbs: 16.7, fat: 0.2  },
  '麝香葡萄':    { calories: 67,  protein: 0.6,  carbs: 17.2, fat: 0.2  },
  '油桃':        { calories: 44,  protein: 1.1,  carbs: 10.6, fat: 0.3  },
  '杏':          { calories: 48,  protein: 1.4,  carbs: 11.1, fat: 0.4  },
  '梅子':        { calories: 30,  protein: 0.9,  carbs: 7.2,  fat: 0.2  },
  '石榴':        { calories: 83,  protein: 1.7,  carbs: 18.7, fat: 1.2  },
  '枇杷':        { calories: 47,  protein: 0.4,  carbs: 12.1, fat: 0.2  },
  '無花果':      { calories: 74,  protein: 0.8,  carbs: 19.2, fat: 0.3  },
  // 莓果類
  '蔓越莓':      { calories: 46,  protein: 0.4,  carbs: 12.2, fat: 0.1  },
  '桑椹':        { calories: 43,  protein: 1.4,  carbs: 9.8,  fat: 0.4  },
  '紅龍果':      { calories: 55,  protein: 1.2,  carbs: 12.2, fat: 0.6  },
  // 乾燥水果
  '葡萄乾':      { calories: 299, protein: 3.1,  carbs: 79.2, fat: 0.5  },
  '蔓越莓乾':    { calories: 308, protein: 0.2,  carbs: 82.5, fat: 1.4  },
  '杏桃乾':      { calories: 241, protein: 3.4,  carbs: 62.6, fat: 0.5  },
  '無花果乾':    { calories: 249, protein: 3.3,  carbs: 63.9, fat: 0.9  },
  '芒果乾':      { calories: 319, protein: 2.4,  carbs: 78.6, fat: 1.2  },
  '鳳梨乾':      { calories: 321, protein: 0.9,  carbs: 83.4, fat: 0.3  },
  '紅棗乾':      { calories: 264, protein: 3.7,  carbs: 64.0, fat: 1.1  },
  '黑棗乾':      { calories: 280, protein: 2.5,  carbs: 70.6, fat: 0.7  },
  '龍眼乾':      { calories: 273, protein: 4.9,  carbs: 70.7, fat: 0.4  },
  '香蕉乾':      { calories: 346, protein: 3.9,  carbs: 88.3, fat: 0.7  },
  // ══ 乳製品 ══
  '全脂牛奶':    { calories: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3  },
  '牛奶':        { calories: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3  },
  '低脂牛奶':    { calories: 42,  protein: 3.4,  carbs: 5.0,  fat: 1.0  },
  '脫脂牛奶':    { calories: 34,  protein: 3.4,  carbs: 5.1,  fat: 0.1  },
  '優格':        { calories: 59,  protein: 3.5,  carbs: 3.6,  fat: 3.3  },
  '無糖優格':    { calories: 56,  protein: 10.0, carbs: 3.6,  fat: 0.4  },
  '希臘優格':    { calories: 97,  protein: 9.0,  carbs: 3.6,  fat: 5.0  },
  '起司':        { calories: 402, protein: 25.0, carbs: 1.3,  fat: 33.0 },
  '莫扎瑞拉':    { calories: 280, protein: 22.0, carbs: 2.2,  fat: 20.0 },
  '奶油':        { calories: 717, protein: 0.9,  carbs: 0.1,  fat: 81.1 },
  '鮮奶油':      { calories: 340, protein: 2.0,  carbs: 2.8,  fat: 36.0 },
  '冰淇淋':      { calories: 207, protein: 3.5,  carbs: 24.0, fat: 11.0 },
  '布丁':        { calories: 125, protein: 4.5,  carbs: 19.5, fat: 3.5  },
  '奶昔':        { calories: 112, protein: 3.2,  carbs: 18.0, fat: 3.0  },
  // ══ 堅果種子 ══
  '花生':        { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2 },
  '花生醬':      { calories: 588, protein: 25.0, carbs: 20.0, fat: 50.0 },
  '核桃':        { calories: 654, protein: 15.0, carbs: 14.0, fat: 65.0 },
  '杏仁':        { calories: 579, protein: 21.0, carbs: 22.0, fat: 50.0 },
  '腰果':        { calories: 553, protein: 18.2, carbs: 30.2, fat: 43.8 },
  '開心果':      { calories: 562, protein: 20.3, carbs: 27.5, fat: 45.4 },
  '夏威夷豆':    { calories: 718, protein: 7.9,  carbs: 13.8, fat: 75.8 },
  '榛果':        { calories: 628, protein: 15.0, carbs: 16.7, fat: 60.8 },
  '葵花籽':      { calories: 584, protein: 20.8, carbs: 20.0, fat: 51.5 },
  '南瓜籽':      { calories: 559, protein: 30.2, carbs: 10.7, fat: 49.1 },
  '芝麻':        { calories: 573, protein: 17.7, carbs: 23.4, fat: 49.7 },
  '亞麻籽':      { calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2 },
  '奇亞籽':      { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  // ══ 油脂 ══
  '橄欖油':      { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  '椰子油':      { calories: 892, protein: 0.0,  carbs: 0.0,  fat: 99.1 },
  '玄米油':      { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  '芥花油':      { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  '麻油':        { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  // ══ 早餐店熱門 ══
  '蛋餅加火腿':  { calories: 330, protein: 16.0, carbs: 33.5, fat: 14.5 },
  '鮪魚蛋餅':    { calories: 320, protein: 18.5, carbs: 33.0, fat: 12.5 },
  '漢堡加蛋':    { calories: 370, protein: 20.5, carbs: 31.0, fat: 17.0 },
  '肉蛋吐司':    { calories: 360, protein: 18.5, carbs: 35.5, fat: 16.0 },
  '總匯三明治':  { calories: 350, protein: 18.5, carbs: 36.0, fat: 15.0 },
  '車輪餅':      { calories: 250, protein: 5.5,  carbs: 47.0, fat: 5.5  },
  '紅豆餅':      { calories: 260, protein: 6.0,  carbs: 50.0, fat: 4.5  },
  '古早味蛋糕':  { calories: 320, protein: 7.0,  carbs: 50.0, fat: 10.0 },
  // ══ 台灣小吃 ══
  '滷味':        { calories: 180, protein: 15.0, carbs: 10.0, fat: 8.0  },
  '貢丸':        { calories: 220, protein: 15.0, carbs: 12.0, fat: 11.5 },
  '肉圓':        { calories: 250, protein: 8.0,  carbs: 38.0, fat: 8.0  },
  '蚵仔煎':      { calories: 195, protein: 7.5,  carbs: 27.0, fat: 7.0  },
  '春捲':        { calories: 210, protein: 6.5,  carbs: 26.5, fat: 9.0  },
  '潤餅':        { calories: 200, protein: 7.0,  carbs: 31.0, fat: 6.0  },
  '割包':        { calories: 350, protein: 14.5, carbs: 45.0, fat: 12.5 },
  '刈包':        { calories: 350, protein: 14.5, carbs: 45.0, fat: 12.5 },
  '鹽酥雞':      { calories: 310, protein: 20.5, carbs: 15.0, fat: 18.5 },
  '甜不辣':      { calories: 140, protein: 7.5,  carbs: 16.5, fat: 5.0  },
  '天婦羅':      { calories: 150, protein: 6.5,  carbs: 17.5, fat: 6.0  },
  '豬血糕':      { calories: 161, protein: 7.5,  carbs: 30.0, fat: 1.5  },
  '米血':        { calories: 161, protein: 7.5,  carbs: 30.0, fat: 1.5  },
  '芋圓':        { calories: 190, protein: 1.5,  carbs: 44.5, fat: 0.5  },
  '地瓜圓':      { calories: 185, protein: 1.0,  carbs: 43.5, fat: 0.5  },
  '湯圓':        { calories: 190, protein: 2.5,  carbs: 43.0, fat: 1.5  },
  '粽子':        { calories: 210, protein: 6.5,  carbs: 36.0, fat: 5.0  },
  '碗粿':        { calories: 130, protein: 3.5,  carbs: 27.5, fat: 1.0  },
  '虱目魚粥':    { calories: 110, protein: 8.5,  carbs: 15.5, fat: 2.0  },
  '蚵仔麵線':    { calories: 125, protein: 5.5,  carbs: 22.0, fat: 2.5  },
  '大腸麵線':    { calories: 130, protein: 5.0,  carbs: 23.0, fat: 2.5  },
  '鹹粥':        { calories: 95,  protein: 5.5,  carbs: 15.5, fat: 1.5  },
  '薑母鴨':      { calories: 215, protein: 18.0, carbs: 5.5,  fat: 13.0 },
  '羊肉爐':      { calories: 185, protein: 20.0, carbs: 3.5,  fat: 10.5 },
  '燒酒雞':      { calories: 175, protein: 20.5, carbs: 4.0,  fat: 8.5  },
  '鐵板麵':      { calories: 200, protein: 9.0,  carbs: 29.5, fat: 6.0  },
  '炒米粉':      { calories: 135, protein: 3.5,  carbs: 27.0, fat: 2.0  },
  '蘿蔔糕':      { calories: 140, protein: 2.5,  carbs: 28.5, fat: 2.0  },
  '芋粿巧':      { calories: 165, protein: 2.5,  carbs: 35.0, fat: 1.5  },
  '鍋貼':        { calories: 185, protein: 7.5,  carbs: 24.5, fat: 6.5  },
  '水煎包':      { calories: 195, protein: 7.0,  carbs: 28.0, fat: 6.5  },
  '生煎包':      { calories: 200, protein: 7.5,  carbs: 28.5, fat: 7.0  },
  '小籠包':      { calories: 175, protein: 8.5,  carbs: 20.5, fat: 6.5  },
  '燒賣':        { calories: 155, protein: 8.0,  carbs: 19.5, fat: 5.0  },
  '蝦餃':        { calories: 145, protein: 7.5,  carbs: 18.0, fat: 4.5  },
  '腸粉':        { calories: 115, protein: 5.0,  carbs: 18.0, fat: 2.5  },
  '蘿蔔絲餅':    { calories: 230, protein: 4.5,  carbs: 33.5, fat: 9.0  },
  // ══ 火鍋料 ══
  '火鍋':        { calories: 160, protein: 12.0, carbs: 15.0, fat: 6.0  },
  '豬肉片':      { calories: 225, protein: 18.5, carbs: 0.0,  fat: 16.5 },
  '牛肉片':      { calories: 250, protein: 22.0, carbs: 0.0,  fat: 17.5 },
  '羊肉片':      { calories: 206, protein: 20.0, carbs: 0.0,  fat: 13.5 },
  '鴨血':        { calories: 28,  protein: 5.0,  carbs: 0.5,  fat: 0.5  },
  '凍豆腐':      { calories: 82,  protein: 8.5,  carbs: 2.0,  fat: 4.5  },
  '火鍋料':      { calories: 130, protein: 7.5,  carbs: 13.5, fat: 5.0  },
  '丸子':        { calories: 155, protein: 10.0, carbs: 12.5, fat: 7.0  },
  '蛋餃':        { calories: 180, protein: 11.5, carbs: 5.5,  fat: 12.5 },
  // ══ 速食 ══
  '麥當勞大麥克': { calories: 550, protein: 25.0, carbs: 45.0, fat: 30.0 },
  '薯餅':        { calories: 160, protein: 1.5,  carbs: 16.5, fat: 10.0 },
  '薯條(小)':    { calories: 230, protein: 2.5,  carbs: 30.0, fat: 11.0 },
  '薯條(中)':    { calories: 320, protein: 3.5,  carbs: 41.0, fat: 15.0 },
  '薯條(大)':    { calories: 490, protein: 5.0,  carbs: 64.0, fat: 23.0 },
  '麥克雞塊(6)': { calories: 270, protein: 16.0, carbs: 16.0, fat: 16.0 },
  '大亨堡':      { calories: 330, protein: 11.5, carbs: 34.0, fat: 16.5 },
  '披薩':        { calories: 266, protein: 11.0, carbs: 33.0, fat: 10.0 },
  '炸物':        { calories: 300, protein: 12.0, carbs: 25.0, fat: 17.0 },
  // ══ 飲料 ══
  '水':          { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '黑咖啡':      { calories: 2,   protein: 0.3,  carbs: 0.0,  fat: 0.0  },
  '美式咖啡':    { calories: 5,   protein: 0.3,  carbs: 0.5,  fat: 0.0  },
  '拿鐵':        { calories: 67,  protein: 3.5,  carbs: 6.5,  fat: 2.8  },
  '卡布奇諾':    { calories: 74,  protein: 4.0,  carbs: 6.8,  fat: 3.2  },
  '摩卡':        { calories: 110, protein: 3.5,  carbs: 14.5, fat: 4.5  },
  '燕麥拿鐵':    { calories: 95,  protein: 3.0,  carbs: 13.5, fat: 3.0  },
  '冰拿鐵':      { calories: 67,  protein: 3.5,  carbs: 6.5,  fat: 2.8  },
  '綠茶':        { calories: 1,   protein: 0.0,  carbs: 0.2,  fat: 0.0  },
  '紅茶':        { calories: 1,   protein: 0.1,  carbs: 0.3,  fat: 0.0  },
  '烏龍茶':      { calories: 1,   protein: 0.0,  carbs: 0.2,  fat: 0.0  },
  '茉莉花茶':    { calories: 1,   protein: 0.0,  carbs: 0.2,  fat: 0.0  },
  '珍珠奶茶':    { calories: 80,  protein: 1.0,  carbs: 16.0, fat: 1.5  },
  '珍珠紅茶':    { calories: 68,  protein: 0.5,  carbs: 15.0, fat: 0.2  },
  '青蛙撞奶':    { calories: 90,  protein: 2.5,  carbs: 15.5, fat: 2.5  },
  '多多綠':      { calories: 75,  protein: 0.8,  carbs: 17.0, fat: 0.5  },
  '豆漿':        { calories: 54,  protein: 3.3,  carbs: 6.4,  fat: 1.7  },
  '無糖豆漿':    { calories: 35,  protein: 3.2,  carbs: 1.5,  fat: 1.5  },
  '牛奶':        { calories: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3  },
  '可樂':        { calories: 37,  protein: 0.0,  carbs: 9.6,  fat: 0.0  },
  '零卡可樂':    { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '0卡可樂':     { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  'Coke Zero':   { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  'Diet Coke':   { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '零卡雪碧':    { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '無糖汽水':    { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '雪碧':        { calories: 38,  protein: 0.0,  carbs: 9.6,  fat: 0.0  },
  '汽水':        { calories: 37,  protein: 0.0,  carbs: 9.6,  fat: 0.0  },
  '芬達':        { calories: 44,  protein: 0.0,  carbs: 11.0, fat: 0.0  },
  '柳橙汁':      { calories: 45,  protein: 0.7,  carbs: 10.4, fat: 0.2  },
  '蘋果汁':      { calories: 46,  protein: 0.1,  carbs: 11.4, fat: 0.1  },
  '葡萄汁':      { calories: 60,  protein: 0.4,  carbs: 14.8, fat: 0.1  },
  '芒果汁':      { calories: 55,  protein: 0.5,  carbs: 13.5, fat: 0.2  },
  '番茄汁':      { calories: 17,  protein: 0.9,  carbs: 3.5,  fat: 0.1  },
  '運動飲料':    { calories: 25,  protein: 0.0,  carbs: 6.3,  fat: 0.0  },
  '椰子水':      { calories: 19,  protein: 0.7,  carbs: 3.7,  fat: 0.2  },
  '啤酒':        { calories: 43,  protein: 0.5,  carbs: 3.6,  fat: 0.0  },
  '紅酒':        { calories: 85,  protein: 0.1,  carbs: 2.6,  fat: 0.0  },
  '白酒':        { calories: 82,  protein: 0.1,  carbs: 2.8,  fat: 0.0  },
  '威士忌':      { calories: 250, protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '高梁酒':      { calories: 270, protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  // ══ 甜點點心 ══
  '蛋糕':        { calories: 347, protein: 5.5,  carbs: 53.0, fat: 13.0 },
  '起司蛋糕':    { calories: 321, protein: 7.5,  carbs: 29.0, fat: 20.0 },
  '戚風蛋糕':    { calories: 280, protein: 6.5,  carbs: 42.0, fat: 10.0 },
  '提拉米蘇':    { calories: 302, protein: 6.5,  carbs: 28.5, fat: 18.5 },
  '餅乾':        { calories: 450, protein: 6.5,  carbs: 65.0, fat: 18.0 },
  '消化餅':      { calories: 467, protein: 7.5,  carbs: 67.0, fat: 19.5 },
  '巧克力':      { calories: 546, protein: 5.0,  carbs: 60.0, fat: 31.0 },
  '黑巧克力':    { calories: 598, protein: 7.8,  carbs: 45.9, fat: 43.1 },
  '牛奶巧克力':  { calories: 535, protein: 7.7,  carbs: 59.4, fat: 30.0 },
  '麻糬':        { calories: 235, protein: 3.5,  carbs: 54.0, fat: 0.8  },
  '湯圓':        { calories: 190, protein: 2.5,  carbs: 43.0, fat: 1.5  },
  '紅豆湯':      { calories: 110, protein: 4.0,  carbs: 23.5, fat: 0.3  },
  '綠豆湯':      { calories: 90,  protein: 5.0,  carbs: 17.5, fat: 0.2  },
  '仙草':        { calories: 18,  protein: 0.3,  carbs: 4.5,  fat: 0.1  },
  '豆花':        { calories: 50,  protein: 3.5,  carbs: 6.5,  fat: 1.2  },
  '花生湯':      { calories: 155, protein: 5.5,  carbs: 19.5, fat: 7.0  },
  '芒果冰':      { calories: 150, protein: 1.5,  carbs: 35.5, fat: 1.0  },
  '剉冰':        { calories: 120, protein: 1.0,  carbs: 28.5, fat: 0.5  },
  '冰棒':        { calories: 60,  protein: 0.1,  carbs: 15.0, fat: 0.0  },
  '牛奶冰棒':    { calories: 130, protein: 2.5,  carbs: 20.0, fat: 4.5  },
  '紅豆冰棒':    { calories: 128, protein: 2.0,  carbs: 25.5, fat: 2.0  },
  '綠豆冰棒':    { calories: 110, protein: 2.5,  carbs: 22.0, fat: 1.5  },
  '巧克力冰棒':  { calories: 220, protein: 2.5,  carbs: 24.0, fat: 13.0 },
  '雪糕':        { calories: 200, protein: 3.0,  carbs: 22.0, fat: 11.5 },
  '霜淇淋':      { calories: 167, protein: 3.5,  carbs: 23.0, fat: 7.0  },
  '冰淇淋三明治':{ calories: 210, protein: 3.5,  carbs: 31.0, fat: 8.0  },
  '雪泥':        { calories: 85,  protein: 0.2,  carbs: 21.5, fat: 0.0  },
  '愛玉':        { calories: 38,  protein: 0.1,  carbs: 9.5,  fat: 0.1  },
  '龍鬚糖':      { calories: 390, protein: 3.5,  carbs: 90.0, fat: 3.5  },
  '牛軋糖':      { calories: 420, protein: 8.5,  carbs: 68.5, fat: 13.5 },
  '太陽餅':      { calories: 410, protein: 5.5,  carbs: 59.5, fat: 17.5 },
  '鳳梨酥':      { calories: 380, protein: 4.5,  carbs: 55.0, fat: 16.0 },
  '老婆餅':      { calories: 400, protein: 5.0,  carbs: 62.0, fat: 15.0 },
  '蛋黃酥':      { calories: 360, protein: 6.5,  carbs: 45.0, fat: 17.5 },
  '月餅':        { calories: 400, protein: 6.0,  carbs: 60.0, fat: 15.5 },
  '糖果':        { calories: 390, protein: 0.0,  carbs: 98.0, fat: 0.0  },
  '軟糖':        { calories: 330, protein: 5.5,  carbs: 76.5, fat: 0.2  },
  '棉花糖':      { calories: 318, protein: 1.8,  carbs: 81.3, fat: 0.1  },
  // ══ 零食 ══
  '洋芋片':      { calories: 536, protein: 7.0,  carbs: 53.0, fat: 34.6 },
  '玉米片':      { calories: 357, protein: 8.0,  carbs: 73.6, fat: 4.8  },
  '爆米花':      { calories: 375, protein: 12.0, carbs: 74.0, fat: 4.5  },
  '仙貝':        { calories: 375, protein: 7.5,  carbs: 78.0, fat: 3.5  },
  '米果':        { calories: 370, protein: 7.0,  carbs: 77.0, fat: 3.0  },
  '海苔':        { calories: 35,  protein: 5.5,  carbs: 4.5,  fat: 0.4  },
  '肉乾':        { calories: 320, protein: 38.0, carbs: 18.5, fat: 10.0 },
  '魷魚絲':      { calories: 290, protein: 40.0, carbs: 20.0, fat: 5.0  },
  '蒟蒻':        { calories: 10,  protein: 0.1,  carbs: 2.0,  fat: 0.0  },
  '布丁':        { calories: 125, protein: 4.5,  carbs: 19.5, fat: 3.5  },
  '果凍':        { calories: 78,  protein: 1.5,  carbs: 18.5, fat: 0.0  },
  '洋芋片(原味)':{ calories: 536, protein: 7.0,  carbs: 53.0, fat: 34.6 },
  // ══ 穀物雜糧 ══
  '燕麥':        { calories: 389, protein: 17.0, carbs: 66.0, fat: 7.0  },
  '燕麥片':      { calories: 389, protein: 17.0, carbs: 66.0, fat: 7.0  },
  '即食燕麥':    { calories: 379, protein: 13.5, carbs: 68.0, fat: 6.5  },
  '薏仁':        { calories: 360, protein: 12.8, carbs: 71.9, fat: 3.3  },
  '小米':        { calories: 361, protein: 11.0, carbs: 72.9, fat: 4.2  },
  '糯米':        { calories: 348, protein: 6.7,  carbs: 78.3, fat: 0.5  },
  '蕎麥':        { calories: 343, protein: 13.3, carbs: 71.5, fat: 3.4  },
  '大麥':        { calories: 354, protein: 12.5, carbs: 73.5, fat: 2.3  },
  '藜麥':        { calories: 368, protein: 14.1, carbs: 64.2, fat: 6.1  },
  // ══ 便利商店 ══
  '御飯糰(鮪魚)':      { calories: 175, protein: 7.0,  carbs: 30.0, fat: 3.0  },
  '御飯糰(鮭魚)':      { calories: 185, protein: 8.0,  carbs: 30.0, fat: 4.0  },
  '御飯糰(梅子)':      { calories: 155, protein: 4.0,  carbs: 33.0, fat: 0.5  },
  '御飯糰(雞肉)':      { calories: 195, protein: 9.0,  carbs: 30.0, fat: 4.5  },
  '御飯糰(起司蛋)':    { calories: 200, protein: 8.5,  carbs: 31.0, fat: 5.0  },
  '便利商店便當(雞腿)':{ calories: 280, protein: 15.0, carbs: 38.0, fat: 8.0  },
  '便利商店便當(排骨)':{ calories: 300, protein: 14.0, carbs: 40.0, fat: 10.0 },
  '關東煮(綜合)':      { calories: 80,  protein: 5.0,  carbs: 8.0,  fat: 2.0  },
  '三明治(雞蛋起司)':  { calories: 215, protein: 9.5,  carbs: 27.0, fat: 7.5  },
  '三明治(火腿起司)':  { calories: 235, protein: 11.0, carbs: 27.0, fat: 9.0  },
  '鮮食肉包':          { calories: 240, protein: 9.0,  carbs: 36.0, fat: 6.5  },
  '鮮食豆沙包':        { calories: 270, protein: 7.0,  carbs: 48.0, fat: 6.0  },
  '鮮食鮮奶饅頭':      { calories: 250, protein: 8.0,  carbs: 47.0, fat: 3.5  },
  '便利商店涼麵':      { calories: 175, protein: 5.0,  carbs: 30.0, fat: 4.5  },
  '輕食蔬果沙拉':      { calories: 60,  protein: 2.0,  carbs: 8.0,  fat: 2.0  },
  '鮮食壽司盒':        { calories: 160, protein: 6.0,  carbs: 30.0, fat: 2.0  },
  '地瓜(便利商店)':    { calories: 125, protein: 1.5,  carbs: 29.0, fat: 0.1  },
  '沙拉雞胸肉':        { calories: 110, protein: 23.0, carbs: 1.0,  fat: 1.5  },
  '燕麥奶':            { calories: 63,  protein: 1.5,  carbs: 12.0, fat: 1.2  },
  '關東煮(蘿蔔)':      { calories: 25,  protein: 0.7,  carbs: 5.5,  fat: 0.1  },
  '關東煮(油豆腐)':    { calories: 145, protein: 9.5,  carbs: 5.0,  fat: 10.0 },
  // ══ 日式料理 ══
  '握壽司(鮭魚)':      { calories: 160, protein: 8.0,  carbs: 24.0, fat: 4.0  },
  '握壽司(鮪魚)':      { calories: 155, protein: 10.0, carbs: 23.0, fat: 3.0  },
  '握壽司(蝦)':        { calories: 145, protein: 8.0,  carbs: 23.0, fat: 2.0  },
  '握壽司(海膽)':      { calories: 170, protein: 9.0,  carbs: 23.0, fat: 4.5  },
  '手捲(綜合)':        { calories: 180, protein: 7.0,  carbs: 28.0, fat: 4.5  },
  '味噌湯':            { calories: 40,  protein: 2.5,  carbs: 4.5,  fat: 1.5  },
  '豚骨拉麵':          { calories: 430, protein: 18.0, carbs: 58.0, fat: 14.0 },
  '醬油拉麵':          { calories: 390, protein: 17.0, carbs: 55.0, fat: 11.0 },
  '味噌拉麵':          { calories: 400, protein: 17.0, carbs: 55.0, fat: 12.0 },
  '鹽味拉麵':          { calories: 370, protein: 16.0, carbs: 54.0, fat: 10.0 },
  '炒烏龍':            { calories: 250, protein: 10.0, carbs: 38.0, fat: 6.0  },
  '天婦羅(綜合)':      { calories: 280, protein: 10.0, carbs: 28.0, fat: 14.0 },
  '炸豬排(日式)':      { calories: 330, protein: 21.0, carbs: 20.0, fat: 19.0 },
  '豬排丼':            { calories: 350, protein: 18.0, carbs: 46.0, fat: 10.0 },
  '親子丼':            { calories: 300, protein: 18.0, carbs: 38.0, fat: 8.5  },
  '牛丼':              { calories: 320, protein: 16.0, carbs: 38.0, fat: 11.0 },
  '照燒雞':            { calories: 225, protein: 22.0, carbs: 10.0, fat: 10.0 },
  '章魚燒':            { calories: 200, protein: 7.0,  carbs: 26.0, fat: 7.5  },
  '可樂餅':            { calories: 210, protein: 6.0,  carbs: 26.0, fat: 9.0  },
  '茶碗蒸':            { calories: 65,  protein: 5.5,  carbs: 3.5,  fat: 2.5  },
  '唐揚炸雞':          { calories: 260, protein: 18.0, carbs: 14.0, fat: 15.0 },
  '壽喜燒':            { calories: 185, protein: 13.0, carbs: 12.0, fat: 10.0 },
  '生魚片(綜合)':      { calories: 130, protein: 20.0, carbs: 2.0,  fat: 4.5  },
  '日式蕎麥麵':        { calories: 130, protein: 5.0,  carbs: 26.0, fat: 1.0  },
  '日式烏龍麵':        { calories: 105, protein: 3.0,  carbs: 22.0, fat: 0.5  },
  '味噌鯖魚':          { calories: 185, protein: 19.5, carbs: 5.0,  fat: 8.5  },
  '日式煎餃':          { calories: 240, protein: 10.0, carbs: 26.0, fat: 10.0 },
  '日式茶漬飯':        { calories: 175, protein: 8.0,  carbs: 32.0, fat: 2.0  },
  // ══ 韓式料理 ══
  '韓式拌飯':          { calories: 350, protein: 15.0, carbs: 55.0, fat: 8.0  },
  '韓式炸雞':          { calories: 290, protein: 20.0, carbs: 18.0, fat: 16.0 },
  '辣炒年糕':          { calories: 195, protein: 3.5,  carbs: 41.0, fat: 2.0  },
  '韓式泡菜鍋':        { calories: 120, protein: 8.0,  carbs: 10.0, fat: 5.0  },
  '部隊鍋':            { calories: 200, protein: 10.0, carbs: 22.0, fat: 8.0  },
  '韓式豆腐鍋':        { calories: 90,  protein: 7.0,  carbs: 7.0,  fat: 3.5  },
  '韓式烤豬五花':      { calories: 300, protein: 14.0, carbs: 0.0,  fat: 27.0 },
  '韓式烤牛肉':        { calories: 220, protein: 22.0, carbs: 5.0,  fat: 13.0 },
  '韓式冷麵':          { calories: 165, protein: 5.0,  carbs: 33.0, fat: 1.5  },
  '辛拉麵':            { calories: 500, protein: 10.0, carbs: 65.0, fat: 22.0 },
  '韓式煎餅':          { calories: 250, protein: 8.0,  carbs: 32.0, fat: 10.0 },
  '海苔飯捲':          { calories: 180, protein: 6.0,  carbs: 30.0, fat: 4.0  },
  '韓式泡菜':          { calories: 30,  protein: 2.0,  carbs: 5.0,  fat: 0.5  },
  '韓式魚板':          { calories: 85,  protein: 7.0,  carbs: 10.0, fat: 2.0  },
  '甜辣醬炸雞':        { calories: 310, protein: 19.0, carbs: 22.0, fat: 16.0 },
  '起司炸雞':          { calories: 320, protein: 19.0, carbs: 18.0, fat: 18.0 },
  '韓式炸醬麵':        { calories: 420, protein: 13.0, carbs: 65.0, fat: 12.0 },
  '韓式豆漿麵':        { calories: 380, protein: 14.0, carbs: 58.0, fat: 10.0 },
  '韓式海帶湯':        { calories: 35,  protein: 3.0,  carbs: 4.0,  fat: 1.0  },
  '韓式糖餅':          { calories: 305, protein: 5.0,  carbs: 55.0, fat: 8.0  },
  // ══ 西式料理 ══
  '義大利麵(肉醬)':    { calories: 320, protein: 14.0, carbs: 42.0, fat: 10.5 },
  '義大利麵(白醬)':    { calories: 370, protein: 12.0, carbs: 40.0, fat: 17.0 },
  '義大利麵(青醬)':    { calories: 355, protein: 11.0, carbs: 38.0, fat: 16.5 },
  '義大利麵(番茄)':    { calories: 290, protein: 10.0, carbs: 43.0, fat: 8.0  },
  '培根蛋義大利麵':    { calories: 420, protein: 16.0, carbs: 44.0, fat: 20.0 },
  '蒜香義大利麵':      { calories: 310, protein: 10.0, carbs: 40.0, fat: 13.0 },
  '披薩(起司)':        { calories: 270, protein: 11.0, carbs: 33.0, fat: 10.0 },
  '披薩(夏威夷)':      { calories: 260, protein: 10.0, carbs: 33.0, fat: 9.5  },
  '焗烤飯':            { calories: 340, protein: 13.0, carbs: 48.0, fat: 10.0 },
  '焗烤麵':            { calories: 360, protein: 13.0, carbs: 47.0, fat: 12.0 },
  '凱薩沙拉':          { calories: 160, protein: 7.0,  carbs: 10.0, fat: 11.0 },
  '洋蔥湯':            { calories: 80,  protein: 3.0,  carbs: 12.0, fat: 2.5  },
  '蘑菇湯':            { calories: 95,  protein: 3.0,  carbs: 10.0, fat: 4.5  },
  '牛排(菲力)':        { calories: 250, protein: 28.0, carbs: 0.0,  fat: 15.0 },
  '烤雞腿(西式)':      { calories: 280, protein: 25.0, carbs: 0.0,  fat: 20.0 },
  '可頌':              { calories: 406, protein: 8.2,  carbs: 45.9, fat: 21.0 },
  '布里歐':            { calories: 350, protein: 8.0,  carbs: 48.0, fat: 14.0 },
  '西式漢堡(牛肉)':    { calories: 295, protein: 15.0, carbs: 28.0, fat: 13.0 },
  '恩佐沙拉':          { calories: 130, protein: 10.0, carbs: 8.0,  fat: 7.0  },
  '馬鈴薯泥':          { calories: 135, protein: 2.5,  carbs: 26.0, fat: 3.5  },
  // ══ 健康食品 ══
  '希臘優格':          { calories: 97,  protein: 9.0,  carbs: 4.0,  fat: 5.0  },
  '無糖希臘優格':      { calories: 59,  protein: 10.0, carbs: 3.5,  fat: 0.4  },
  '蛋白棒':            { calories: 380, protein: 30.0, carbs: 38.0, fat: 10.0 },
  '格蘭諾拉麥片':      { calories: 471, protein: 10.0, carbs: 64.0, fat: 20.0 },
  '蛋白粉':            { calories: 380, protein: 75.0, carbs: 8.0,  fat: 4.0  },
  '乳清蛋白粉':        { calories: 380, protein: 75.0, carbs: 8.0,  fat: 4.0  },
  '植物蛋白粉':        { calories: 360, protein: 70.0, carbs: 12.0, fat: 5.0  },
  '羽衣甘藍':          { calories: 49,  protein: 4.3,  carbs: 9.0,  fat: 0.9  },
  '低卡代餐':          { calories: 200, protein: 20.0, carbs: 25.0, fat: 3.0  },
  '能量棒':            { calories: 420, protein: 10.0, carbs: 65.0, fat: 14.0 },
  '杏仁醬':            { calories: 614, protein: 21.0, carbs: 22.0, fat: 55.0 },
  '堅果棒':            { calories: 450, protein: 12.0, carbs: 55.0, fat: 22.0 },
  '燕麥蛋白球':        { calories: 390, protein: 15.0, carbs: 52.0, fat: 14.0 },
  '纖維餅乾':          { calories: 350, protein: 7.0,  carbs: 60.0, fat: 10.0 },
  '燕麥奶昔':          { calories: 145, protein: 6.0,  carbs: 22.0, fat: 3.5  },
  // ══ 更多速食 ══
  '肯德基炸雞腿':      { calories: 285, protein: 22.0, carbs: 13.0, fat: 16.0 },
  '肯德基原味雞':      { calories: 265, protein: 25.0, carbs: 9.0,  fat: 15.0 },
  '摩斯漢堡(米漢堡)': { calories: 360, protein: 12.0, carbs: 60.0, fat: 8.0  },
  '漢堡王華堡':        { calories: 540, protein: 28.0, carbs: 47.0, fat: 27.0 },
  '炸雞排(便當)':      { calories: 300, protein: 20.0, carbs: 20.0, fat: 17.0 },
  '鹽酥雞(夜市)':      { calories: 380, protein: 22.0, carbs: 25.0, fat: 22.0 },
  '熱狗堡':            { calories: 290, protein: 11.0, carbs: 32.0, fat: 13.0 },
  '雙層起司堡':        { calories: 480, protein: 24.0, carbs: 38.0, fat: 26.0 },
  '炸蝦堡':            { calories: 380, protein: 16.0, carbs: 42.0, fat: 16.0 },
  // ══ 更多早餐店 ══
  '燒肉飯':            { calories: 510, protein: 25.0, carbs: 65.0, fat: 17.0 },
  '皮蛋瘦肉粥':        { calories: 130, protein: 7.0,  carbs: 20.0, fat: 3.0  },
  '地瓜稀飯':          { calories: 100, protein: 1.5,  carbs: 22.0, fat: 0.5  },
  '蔥油餅':            { calories: 350, protein: 7.0,  carbs: 50.0, fat: 14.0 },
  '菜脯蛋':            { calories: 155, protein: 8.5,  carbs: 3.0,  fat: 12.0 },
  '米漿':              { calories: 74,  protein: 1.0,  carbs: 16.0, fat: 0.8  },
  '豆花':              { calories: 60,  protein: 3.5,  carbs: 9.5,  fat: 1.0  },
  '粉漿蛋餅':          { calories: 230, protein: 10.0, carbs: 30.0, fat: 8.0  },
  '鮪魚起司蛋餅':      { calories: 310, protein: 17.0, carbs: 30.0, fat: 13.0 },
  '培根起司蛋餅':      { calories: 340, protein: 17.5, carbs: 32.0, fat: 15.0 },
  // ══ 更多火鍋料 ══
  '甜不辣':            { calories: 130, protein: 9.0,  carbs: 15.0, fat: 3.5  },
  '黑輪':              { calories: 110, protein: 8.0,  carbs: 12.0, fat: 3.0  },
  '旗魚丸':            { calories: 85,  protein: 10.0, carbs: 8.0,  fat: 2.0  },
  '魚蛋':              { calories: 80,  protein: 8.5,  carbs: 7.5,  fat: 2.5  },
  '豆皮捲':            { calories: 215, protein: 14.0, carbs: 5.0,  fat: 16.0 },
  '雞肉丸':            { calories: 145, protein: 13.0, carbs: 8.0,  fat: 7.0  },
  '蝦仁丸':            { calories: 95,  protein: 11.0, carbs: 7.0,  fat: 2.5  },
  '火鍋米血':          { calories: 165, protein: 6.5,  carbs: 32.0, fat: 1.5  },
  '魚皮':              { calories: 120, protein: 18.0, carbs: 2.0,  fat: 5.0  },
  '鴨腸':              { calories: 115, protein: 12.0, carbs: 0.5,  fat: 7.0  },
  // ══ 更多牛肉 ══
  '牛肋條':            { calories: 320, protein: 18.0, carbs: 0.0,  fat: 28.0 },
  '牛腩':              { calories: 305, protein: 17.0, carbs: 0.0,  fat: 26.0 },
  '牛小排':            { calories: 350, protein: 17.0, carbs: 0.0,  fat: 31.0 },
  '牛肉丸':            { calories: 195, protein: 14.0, carbs: 8.0,  fat: 11.0 },
  '骰子牛':            { calories: 280, protein: 21.0, carbs: 0.0,  fat: 22.0 },
  '牛肉片(火鍋)':      { calories: 180, protein: 20.0, carbs: 0.0,  fat: 11.0 },
  // ══ 更多豬肉 ══
  '豬絞肉':            { calories: 220, protein: 16.0, carbs: 0.0,  fat: 18.0 },
  '豬頸肉':            { calories: 285, protein: 17.0, carbs: 0.0,  fat: 24.0 },
  '豬肋排':            { calories: 295, protein: 17.0, carbs: 0.0,  fat: 25.0 },
  '豬舌':              { calories: 195, protein: 19.0, carbs: 0.0,  fat: 13.0 },
  '豬耳朵':            { calories: 180, protein: 20.0, carbs: 0.0,  fat: 11.0 },
  '豬腳筋':            { calories: 215, protein: 24.0, carbs: 0.0,  fat: 13.0 },
  // ══ 更多雞肉 ══
  '去骨雞腿排':        { calories: 185, protein: 17.0, carbs: 0.0,  fat: 13.0 },
  '烤雞翅':            { calories: 265, protein: 25.0, carbs: 3.0,  fat: 17.0 },
  '雞胸肉片':          { calories: 155, protein: 30.0, carbs: 0.0,  fat: 3.5  },
  '水煮雞胸':          { calories: 150, protein: 31.0, carbs: 0.0,  fat: 2.5  },
  '香草烤雞腿':        { calories: 240, protein: 21.0, carbs: 0.0,  fat: 17.0 },
  '雞米花':            { calories: 280, protein: 19.0, carbs: 15.0, fat: 17.0 },
  // ══ 更多油脂 ══
  '葵花油':            { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  '花生油':            { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  '芝麻油':            { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  '豬油':              { calories: 882, protein: 0.0,  carbs: 0.0,  fat: 99.5 },
  '無鹽奶油':          { calories: 717, protein: 0.9,  carbs: 0.1,  fat: 81.0 },
  '苦茶油':            { calories: 884, protein: 0.0,  carbs: 0.0,  fat: 100.0},
  // ══ 中式家常菜 ══
  '番茄炒蛋':    { calories: 85,  protein: 5.5,  carbs: 5.0,  fat: 5.0  },
  '麻婆豆腐':    { calories: 95,  protein: 6.5,  carbs: 5.0,  fat: 6.0  },
  '糖醋排骨':    { calories: 220, protein: 14.0, carbs: 18.0, fat: 10.0 },
  '魚香肉絲':    { calories: 130, protein: 10.0, carbs: 8.0,  fat: 7.0  },
  '回鍋肉':      { calories: 195, protein: 12.0, carbs: 5.0,  fat: 15.0 },
  '紅燒獅子頭':  { calories: 210, protein: 14.0, carbs: 5.0,  fat: 16.0 },
  '紅燒豆腐':    { calories: 90,  protein: 7.0,  carbs: 4.0,  fat: 5.5  },
  '蒜泥白肉':    { calories: 170, protein: 13.0, carbs: 2.0,  fat: 13.0 },
  '東坡肉':      { calories: 375, protein: 11.0, carbs: 8.0,  fat: 35.0 },
  '三杯雞':      { calories: 175, protein: 16.0, carbs: 5.0,  fat: 11.0 },
  '薑絲炒大腸':  { calories: 155, protein: 11.0, carbs: 4.0,  fat: 11.5 },
  '炒青菜':      { calories: 45,  protein: 2.0,  carbs: 5.0,  fat: 2.5  },
  '炒空心菜':    { calories: 40,  protein: 2.0,  carbs: 4.5,  fat: 2.0  },
  '炒菠菜':      { calories: 38,  protein: 2.5,  carbs: 3.5,  fat: 2.0  },
  '蒸魚':        { calories: 95,  protein: 18.0, carbs: 1.0,  fat: 2.5  },
  '清蒸蛋':      { calories: 65,  protein: 6.0,  carbs: 1.0,  fat: 4.0  },
  '涼拌小黃瓜':  { calories: 25,  protein: 1.0,  carbs: 4.5,  fat: 0.5  },
  '涼拌木耳':    { calories: 30,  protein: 1.0,  carbs: 6.0,  fat: 0.3  },
  '蔥爆牛肉':    { calories: 160, protein: 16.0, carbs: 4.0,  fat: 9.0  },
  '薑母鴨':      { calories: 185, protein: 16.0, carbs: 5.0,  fat: 12.0 },
  '藥燉排骨':    { calories: 155, protein: 15.0, carbs: 6.0,  fat: 8.0  },
  // ══ 更多台灣小吃 ══
  '米苔目':      { calories: 100, protein: 1.5,  carbs: 23.0, fat: 0.2  },
  '鼎邊銼':      { calories: 90,  protein: 3.0,  carbs: 18.0, fat: 1.0  },
  '客家粄條':    { calories: 115, protein: 3.0,  carbs: 25.0, fat: 0.5  },
  '蘿蔔糕(煎)':  { calories: 150, protein: 2.5,  carbs: 26.0, fat: 4.0  },
  '菜頭粿':      { calories: 130, protein: 2.0,  carbs: 24.0, fat: 3.0  },
  '蝦捲':        { calories: 200, protein: 10.0, carbs: 12.0, fat: 13.0 },
  '擔仔麵':      { calories: 120, protein: 6.0,  carbs: 18.0, fat: 2.5  },
  '鐵板麵':      { calories: 280, protein: 12.0, carbs: 38.0, fat: 9.0  },
  '炒米粉':      { calories: 170, protein: 4.0,  carbs: 32.0, fat: 3.5  },
  '蚵仔酥':      { calories: 230, protein: 9.0,  carbs: 18.0, fat: 14.0 },
  '香腸(烤)':    { calories: 300, protein: 14.0, carbs: 10.0, fat: 24.0 },
  '烤玉米':      { calories: 105, protein: 3.0,  carbs: 22.0, fat: 1.5  },
  '紅茶蛋':      { calories: 78,  protein: 6.5,  carbs: 0.5,  fat: 5.5  },
  '花生粉糯米糍': { calories: 230, protein: 4.0, carbs: 44.0, fat: 4.5  },
  '烤肉串':      { calories: 185, protein: 16.0, carbs: 4.0,  fat: 12.0 },
  '台式炒麵':    { calories: 175, protein: 6.0,  carbs: 28.0, fat: 5.0  },
  // ══ 更多麵食 ══
  '炸醬麵':      { calories: 195, protein: 9.0,  carbs: 28.0, fat: 6.0  },
  '擔擔麵':      { calories: 210, protein: 10.0, carbs: 28.0, fat: 8.0  },
  '雲吞麵':      { calories: 155, protein: 8.0,  carbs: 24.0, fat: 3.0  },
  '蔥油拌麵':    { calories: 190, protein: 6.0,  carbs: 30.0, fat: 6.0  },
  '麻醬麵':      { calories: 220, protein: 8.0,  carbs: 30.0, fat: 9.0  },
  '刀削麵':      { calories: 135, protein: 4.5,  carbs: 27.0, fat: 1.0  },
  '粄條':        { calories: 108, protein: 2.0,  carbs: 24.0, fat: 0.5  },
  '河粉':        { calories: 96,  protein: 2.0,  carbs: 22.0, fat: 0.2  },
  '冬粉':        { calories: 351, protein: 0.2,  carbs: 86.0, fat: 0.1  },
  '泡麵':        { calories: 430, protein: 9.0,  carbs: 60.0, fat: 18.0 },
  '碗麵':        { calories: 380, protein: 8.0,  carbs: 55.0, fat: 14.0 },
  // ══ 港式料理 ══
  '叉燒飯':      { calories: 195, protein: 14.0, carbs: 28.0, fat: 4.0  },
  '叉燒包':      { calories: 200, protein: 8.0,  carbs: 30.0, fat: 6.0  },
  '腸粉':        { calories: 95,  protein: 3.0,  carbs: 16.0, fat: 2.5  },
  '蝦餃':        { calories: 55,  protein: 4.0,  carbs: 6.5,  fat: 1.5  },
  '燒賣':        { calories: 65,  protein: 4.5,  carbs: 6.0,  fat: 2.5  },
  '港式蘿蔔糕':  { calories: 90,  protein: 2.0,  carbs: 17.0, fat: 2.0  },
  '港式奶茶':    { calories: 70,  protein: 2.5,  carbs: 8.0,  fat: 3.0  },
  '鴛鴦':        { calories: 50,  protein: 1.5,  carbs: 6.5,  fat: 2.0  },
  '菠蘿包':      { calories: 310, protein: 7.0,  carbs: 47.0, fat: 11.0 },
  '奶黃包':      { calories: 220, protein: 6.5,  carbs: 32.0, fat: 8.0  },
  '煲仔飯':      { calories: 185, protein: 8.0,  carbs: 30.0, fat: 4.5  },
  '燒鵝飯':      { calories: 230, protein: 16.0, carbs: 25.0, fat: 8.0  },
  '港式燒臘':    { calories: 250, protein: 18.0, carbs: 5.0,  fat: 19.0 },
  // ══ 東南亞料理 ══
  '越南河粉':    { calories: 115, protein: 6.0,  carbs: 20.0, fat: 1.5  },
  '泰式炒河粉':  { calories: 185, protein: 10.0, carbs: 22.0, fat: 7.0  },
  '星洲炒米':    { calories: 175, protein: 9.0,  carbs: 20.0, fat: 7.0  },
  '海南雞飯':    { calories: 165, protein: 14.0, carbs: 18.0, fat: 4.5  },
  '泰式綠咖哩':  { calories: 120, protein: 8.0,  carbs: 6.0,  fat: 8.0  },
  '泰式紅咖哩':  { calories: 130, protein: 9.0,  carbs: 7.0,  fat: 9.0  },
  '叻沙':        { calories: 155, protein: 8.0,  carbs: 18.0, fat: 6.5  },
  '沙嗲串':      { calories: 165, protein: 14.0, carbs: 5.0,  fat: 11.0 },
  '越式春捲':    { calories: 85,  protein: 4.0,  carbs: 12.0, fat: 3.0  },
  '印尼炒飯':    { calories: 185, protein: 7.0,  carbs: 28.0, fat: 6.0  },
  // ══ 更多日式料理 ══
  '日式咖哩':    { calories: 155, protein: 6.0,  carbs: 22.0, fat: 5.0  },
  '日式炒麵':    { calories: 185, protein: 8.0,  carbs: 28.0, fat: 5.5  },
  '茶泡飯':      { calories: 110, protein: 4.0,  carbs: 22.0, fat: 0.8  },
  '鰻魚飯':      { calories: 210, protein: 12.0, carbs: 25.0, fat: 7.5  },
  '天婦羅':      { calories: 230, protein: 9.0,  carbs: 18.0, fat: 14.0 },
  '日式冷麵':    { calories: 130, protein: 5.0,  carbs: 26.0, fat: 0.5  },
  '壽喜燒':      { calories: 145, protein: 11.0, carbs: 10.0, fat: 7.0  },
  '涮涮鍋':      { calories: 120, protein: 12.0, carbs: 5.0,  fat: 6.0  },
  '日式唐揚雞':  { calories: 245, protein: 18.0, carbs: 12.0, fat: 14.0 },
  '玉子燒':      { calories: 120, protein: 8.0,  carbs: 4.0,  fat: 8.0  },
  '味噌豬排':    { calories: 290, protein: 20.0, carbs: 14.0, fat: 18.0 },
  '日式薑汁燒肉':{ calories: 195, protein: 16.0, carbs: 7.0,  fat: 12.0 },
  // ══ 更多韓式料理 ══
  '石鍋拌飯':    { calories: 175, protein: 8.0,  carbs: 28.0, fat: 4.0  },
  '泡菜鍋':      { calories: 85,  protein: 6.0,  carbs: 7.0,  fat: 3.5  },
  '部隊鍋':      { calories: 120, protein: 7.0,  carbs: 12.0, fat: 5.0  },
  '韓式炒碼麵':  { calories: 165, protein: 8.0,  carbs: 25.0, fat: 4.5  },
  '韓式血腸':    { calories: 175, protein: 9.0,  carbs: 15.0, fat: 9.0  },
  '海鮮煎餅':    { calories: 160, protein: 8.0,  carbs: 18.0, fat: 6.5  },
  '玉米起司':    { calories: 145, protein: 5.0,  carbs: 18.0, fat: 6.5  },
  '韓式冷麵':    { calories: 140, protein: 5.0,  carbs: 28.0, fat: 1.5  },
  '韓式豆腐鍋':  { calories: 75,  protein: 5.5,  carbs: 4.0,  fat: 4.0  },
  '辣炒年糕':    { calories: 155, protein: 4.0,  carbs: 30.0, fat: 2.5  },
  // ══ 更多西式料理 ══
  '義式燉飯':    { calories: 150, protein: 5.0,  carbs: 25.0, fat: 4.0  },
  '千層麵':      { calories: 165, protein: 9.0,  carbs: 17.0, fat: 7.0  },
  '義大利肉醬麵':{ calories: 175, protein: 10.0, carbs: 22.0, fat: 6.0  },
  '白醬義大利麵':{ calories: 185, protein: 7.0,  carbs: 22.0, fat: 8.5  },
  '蘑菇義大利麵':{ calories: 155, protein: 6.0,  carbs: 22.0, fat: 5.5  },
  '法式洋蔥湯':  { calories: 65,  protein: 3.0,  carbs: 9.0,  fat: 2.0  },
  '起司漢堡':    { calories: 295, protein: 17.0, carbs: 24.0, fat: 14.0 },
  'BLT三明治':   { calories: 255, protein: 12.0, carbs: 26.0, fat: 12.0 },
  '法棍':        { calories: 274, protein: 9.0,  carbs: 55.0, fat: 1.5  },
  '佛卡夏':      { calories: 270, protein: 7.0,  carbs: 43.0, fat: 8.0  },
  '希臘沙拉':    { calories: 70,  protein: 2.5,  carbs: 5.0,  fat: 5.0  },
  '烤牛排':      { calories: 210, protein: 26.0, carbs: 0.0,  fat: 12.0 },
  '帕尼尼':      { calories: 250, protein: 13.0, carbs: 25.0, fat: 11.0 },
  '薯餅':        { calories: 260, protein: 3.0,  carbs: 30.0, fat: 15.0 },
  // ══ 更多甜點 ══
  '甜甜圈':      { calories: 380, protein: 5.5,  carbs: 48.0, fat: 19.0 },
  '馬卡龍':      { calories: 415, protein: 6.0,  carbs: 65.0, fat: 16.0 },
  '鬆餅':        { calories: 225, protein: 6.0,  carbs: 33.0, fat: 8.0  },
  '可麗餅':      { calories: 195, protein: 5.5,  carbs: 28.0, fat: 7.0  },
  '磅蛋糕':      { calories: 385, protein: 5.5,  carbs: 50.0, fat: 19.0 },
  '蛋塔':        { calories: 265, protein: 5.5,  carbs: 28.0, fat: 15.0 },
  '泡芙':        { calories: 230, protein: 5.0,  carbs: 23.0, fat: 13.5 },
  '奶油酥餅':    { calories: 480, protein: 5.0,  carbs: 57.0, fat: 26.0 },
  '馬芬蛋糕':    { calories: 380, protein: 5.5,  carbs: 52.0, fat: 17.0 },
  '紅絲絨蛋糕':  { calories: 355, protein: 5.0,  carbs: 48.0, fat: 17.0 },
  '舒芙蕾':      { calories: 195, protein: 7.5,  carbs: 26.0, fat: 7.0  },
  '卡士達':      { calories: 125, protein: 4.0,  carbs: 16.0, fat: 5.0  },
  '可麗露':      { calories: 270, protein: 5.0,  carbs: 47.0, fat: 7.0  },
  '巴斯克起司蛋糕':{ calories: 340, protein: 7.0, carbs: 23.0, fat: 26.0},
  '達克瓦茲':    { calories: 350, protein: 7.0,  carbs: 42.0, fat: 18.0 },
  // ══ 更多飲料 ══
  '冬瓜茶':      { calories: 45,  protein: 0.0,  carbs: 11.5, fat: 0.0  },
  '仙草茶':      { calories: 10,  protein: 0.1,  carbs: 2.5,  fat: 0.0  },
  '青草茶':      { calories: 8,   protein: 0.1,  carbs: 2.0,  fat: 0.0  },
  '楊桃汁':      { calories: 35,  protein: 0.3,  carbs: 9.0,  fat: 0.0  },
  '梅子汁':      { calories: 40,  protein: 0.2,  carbs: 10.0, fat: 0.0  },
  '麥茶':        { calories: 1,   protein: 0.0,  carbs: 0.3,  fat: 0.0  },
  '菊花茶':      { calories: 5,   protein: 0.1,  carbs: 1.2,  fat: 0.0  },
  '玫瑰花茶':    { calories: 8,   protein: 0.1,  carbs: 2.0,  fat: 0.0  },
  '紅棗茶':      { calories: 35,  protein: 0.3,  carbs: 9.0,  fat: 0.0  },
  '桂圓茶':      { calories: 40,  protein: 0.5,  carbs: 10.0, fat: 0.0  },
  '薑茶':        { calories: 30,  protein: 0.2,  carbs: 7.5,  fat: 0.0  },
  '檸檬汁':      { calories: 22,  protein: 0.4,  carbs: 6.9,  fat: 0.2  },
  '蔓越莓汁':    { calories: 46,  protein: 0.4,  carbs: 12.0, fat: 0.1  },
  '西瓜汁':      { calories: 30,  protein: 0.6,  carbs: 7.5,  fat: 0.2  },
  '胡蘿蔔汁':    { calories: 40,  protein: 0.9,  carbs: 9.3,  fat: 0.2  },
  '番茄汁':      { calories: 17,  protein: 0.8,  carbs: 3.5,  fat: 0.2  },
  '燕麥奶':      { calories: 47,  protein: 1.0,  carbs: 9.0,  fat: 1.0  },
  '杏仁奶':      { calories: 17,  protein: 0.6,  carbs: 1.5,  fat: 1.1  },
  '椰奶':        { calories: 230, protein: 2.3,  carbs: 6.0,  fat: 24.0 },
  '可可牛奶':    { calories: 83,  protein: 3.4,  carbs: 11.7, fat: 2.5  },
  '濃縮咖啡':    { calories: 9,   protein: 0.6,  carbs: 1.5,  fat: 0.2  },
  '冷萃咖啡':    { calories: 5,   protein: 0.3,  carbs: 0.5,  fat: 0.0  },
  '摩卡':        { calories: 130, protein: 4.5,  carbs: 18.0, fat: 5.5  },
  '焦糖瑪奇朵':  { calories: 160, protein: 5.5,  carbs: 24.0, fat: 5.5  },
  '抹茶拿鐵':    { calories: 155, protein: 6.0,  carbs: 22.0, fat: 5.0  },
  '薑黃拿鐵':    { calories: 130, protein: 4.5,  carbs: 18.0, fat: 5.0  },
  '黑糖珍奶':    { calories: 210, protein: 3.5,  carbs: 40.0, fat: 4.5  },
  '芋頭珍奶':    { calories: 200, protein: 3.0,  carbs: 38.0, fat: 4.5  },
  '草莓珍奶':    { calories: 185, protein: 3.0,  carbs: 36.0, fat: 4.0  },
  '多多綠':      { calories: 75,  protein: 1.0,  carbs: 17.5, fat: 0.2  },
  '養樂多':      { calories: 65,  protein: 1.0,  carbs: 15.0, fat: 0.0  },
  '運動飲料':    { calories: 25,  protein: 0.0,  carbs: 6.5,  fat: 0.0  },
  '能量飲料':    { calories: 45,  protein: 0.3,  carbs: 11.3, fat: 0.0  },
  '全糖紅茶':    { calories: 50,  protein: 0.0,  carbs: 13.0, fat: 0.0  },
  '半糖紅茶':    { calories: 25,  protein: 0.0,  carbs: 6.5,  fat: 0.0  },
  '無糖紅茶':    { calories: 2,   protein: 0.0,  carbs: 0.5,  fat: 0.0  },
  // ══ 更多蔬菜 ══
  '紫甘藍':      { calories: 31,  protein: 1.4,  carbs: 7.4,  fat: 0.2  },
  '球芽甘藍':    { calories: 43,  protein: 3.4,  carbs: 9.0,  fat: 0.3  },
  '莧菜':        { calories: 23,  protein: 2.5,  carbs: 4.0,  fat: 0.3  },
  '龍鬚菜':      { calories: 26,  protein: 2.0,  carbs: 4.5,  fat: 0.3  },
  '過貓':        { calories: 22,  protein: 2.0,  carbs: 3.5,  fat: 0.3  },
  '昆布':        { calories: 43,  protein: 1.7,  carbs: 9.6,  fat: 0.6  },
  '海帶芽':      { calories: 45,  protein: 3.0,  carbs: 9.1,  fat: 0.6  },
  '羽衣甘藍':    { calories: 49,  protein: 4.3,  carbs: 9.0,  fat: 0.9  },
  '紫蘇':        { calories: 37,  protein: 3.9,  carbs: 7.0,  fat: 0.1  },
  '香菜':        { calories: 23,  protein: 2.1,  carbs: 3.7,  fat: 0.5  },
  '韭黃':        { calories: 22,  protein: 2.0,  carbs: 3.2,  fat: 0.3  },
  '珊瑚草':      { calories: 12,  protein: 0.5,  carbs: 2.8,  fat: 0.0  },
  '竹筍':        { calories: 27,  protein: 2.6,  carbs: 5.2,  fat: 0.3  },
  '荸薺':        { calories: 97,  protein: 1.4,  carbs: 23.9, fat: 0.1  },
  '百合':        { calories: 160, protein: 3.8,  carbs: 38.8, fat: 0.1  },
  '茭白筍':      { calories: 22,  protein: 1.5,  carbs: 4.6,  fat: 0.2  },
  '小白菜':      { calories: 13,  protein: 1.5,  carbs: 2.2,  fat: 0.2  },
  '油菜':        { calories: 28,  protein: 3.0,  carbs: 4.6,  fat: 0.4  },
  '大白菜':      { calories: 16,  protein: 1.2,  carbs: 3.2,  fat: 0.2  },
  '甜椒(紅)':    { calories: 31,  protein: 1.0,  carbs: 6.0,  fat: 0.3  },
  '甜椒(黃)':    { calories: 27,  protein: 1.0,  carbs: 6.3,  fat: 0.2  },
  '洋蔥(紫)':    { calories: 44,  protein: 1.2,  carbs: 10.1, fat: 0.1  },
  '小番茄':      { calories: 18,  protein: 0.9,  carbs: 3.9,  fat: 0.2  },
  // ══ 更多海鮮 ══
  '鯛魚':        { calories: 128, protein: 26.0, carbs: 0.0,  fat: 2.7  },
  '旗魚':        { calories: 109, protein: 23.5, carbs: 0.0,  fat: 1.5  },
  '比目魚':      { calories: 91,  protein: 19.0, carbs: 0.0,  fat: 1.5  },
  '鱸魚':        { calories: 97,  protein: 19.0, carbs: 0.0,  fat: 2.5  },
  '吳郭魚':      { calories: 96,  protein: 20.0, carbs: 0.0,  fat: 1.7  },
  '龍膽石斑':    { calories: 100, protein: 20.5, carbs: 0.0,  fat: 2.0  },
  '海瓜子':      { calories: 51,  protein: 7.5,  carbs: 4.0,  fat: 0.8  },
  '蝦米':        { calories: 198, protein: 42.0, carbs: 1.5,  fat: 2.0  },
  '蚵仔':        { calories: 69,  protein: 7.0,  carbs: 5.0,  fat: 2.5  },
  '鮑魚':        { calories: 105, protein: 17.0, carbs: 6.0,  fat: 1.0  },
  '海蜇皮':      { calories: 33,  protein: 6.0,  carbs: 2.6,  fat: 0.1  },
  '魚丸':        { calories: 91,  protein: 10.0, carbs: 8.0,  fat: 1.5  },
  '蟹肉棒':      { calories: 95,  protein: 8.0,  carbs: 11.0, fat: 1.0  },
  '魚鬆':        { calories: 360, protein: 38.0, carbs: 19.0, fat: 13.0 },
  '鮭魚卵':      { calories: 250, protein: 29.0, carbs: 4.0,  fat: 14.0 },
  // ══ 調味料醬料 ══
  '醬油':        { calories: 53,  protein: 5.0,  carbs: 8.0,  fat: 0.1  },
  '醬油膏':      { calories: 70,  protein: 4.5,  carbs: 13.0, fat: 0.1  },
  '鹽':          { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '白糖':        { calories: 387, protein: 0.0,  carbs: 100.0,fat: 0.0  },
  '味噌':        { calories: 199, protein: 12.0, carbs: 26.0, fat: 6.0  },
  '美乃滋':      { calories: 680, protein: 1.5,  carbs: 0.6,  fat: 75.0 },
  '番茄醬':      { calories: 100, protein: 1.5,  carbs: 25.0, fat: 0.1  },
  '芥末醬':      { calories: 65,  protein: 3.0,  carbs: 8.0,  fat: 2.5  },
  '豆瓣醬':      { calories: 70,  protein: 3.5,  carbs: 9.0,  fat: 2.0  },
  '烏醋':        { calories: 18,  protein: 0.5,  carbs: 4.5,  fat: 0.0  },
  'XO醬':        { calories: 220, protein: 8.0,  carbs: 8.0,  fat: 18.0 },
  '沙茶醬':      { calories: 390, protein: 6.5,  carbs: 12.0, fat: 37.0 },
  '蠔油':        { calories: 87,  protein: 3.0,  carbs: 16.0, fat: 0.5  },
  '甜辣醬':      { calories: 115, protein: 1.0,  carbs: 28.0, fat: 0.2  },
  '芝麻醬':      { calories: 570, protein: 17.0, carbs: 26.0, fat: 48.0 },
  '沙拉醬':      { calories: 300, protein: 1.0,  carbs: 10.0, fat: 28.0 },
  '千島醬':      { calories: 340, protein: 0.8,  carbs: 12.0, fat: 32.0 },
  '凱薩醬':      { calories: 350, protein: 2.5,  carbs: 5.0,  fat: 36.0 },
  '巴薩米克醋':  { calories: 88,  protein: 0.5,  carbs: 17.0, fat: 0.0  },
  '辣豆瓣醬':    { calories: 80,  protein: 4.0,  carbs: 10.0, fat: 3.0  },
  // ══ 健身補給 ══
  '乳清蛋白':    { calories: 400, protein: 80.0, carbs: 8.0,  fat: 5.0  },
  '酪蛋白':      { calories: 380, protein: 78.0, carbs: 6.0,  fat: 4.0  },
  '肌酸':        { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '能量棒':      { calories: 380, protein: 10.0, carbs: 55.0, fat: 12.0 },
  '蛋白棒':      { calories: 320, protein: 25.0, carbs: 28.0, fat: 10.0 },
  '堅果棒':      { calories: 450, protein: 9.0,  carbs: 48.0, fat: 26.0 },
  '格蘭諾拉':    { calories: 471, protein: 10.0, carbs: 64.0, fat: 20.0 },
  '高蛋白飲':    { calories: 150, protein: 30.0, carbs: 5.0,  fat: 2.0  },
  '電解質飲料':  { calories: 20,  protein: 0.0,  carbs: 5.0,  fat: 0.0  },
  '植物蛋白':    { calories: 370, protein: 75.0, carbs: 7.0,  fat: 4.5  },

  // ══ 台灣便當/定食 ══
  '雞腿便當':    { calories: 650, protein: 28.0, carbs: 80.0, fat: 22.0 },
  '排骨便當':    { calories: 680, protein: 26.0, carbs: 82.0, fat: 25.0 },
  '控肉便當':    { calories: 700, protein: 22.0, carbs: 85.0, fat: 28.0 },
  '雞腿飯':      { calories: 580, protein: 26.0, carbs: 72.0, fat: 20.0 },
  '排骨飯':      { calories: 600, protein: 22.0, carbs: 75.0, fat: 22.0 },
  '控肉飯':      { calories: 130, protein: 6.5,  carbs: 15.5, fat: 5.5  },
  '瓜仔肉飯':    { calories: 120, protein: 5.5,  carbs: 16.0, fat: 4.5  },
  '虱目魚便當':  { calories: 550, protein: 24.0, carbs: 72.0, fat: 16.0 },

  // ══ 台灣粥品 ══
  '白粥':        { calories: 46,  protein: 1.0,  carbs: 10.1, fat: 0.1  },
  '皮蛋瘦肉粥':  { calories: 75,  protein: 5.5,  carbs: 10.5, fat: 1.5  },
  '虱目魚粥':    { calories: 80,  protein: 6.5,  carbs: 10.0, fat: 2.0  },
  '地瓜粥':      { calories: 55,  protein: 1.0,  carbs: 12.5, fat: 0.1  },
  '廣東粥':      { calories: 78,  protein: 5.0,  carbs: 11.5, fat: 1.5  },
  '鹹粥':        { calories: 90,  protein: 5.5,  carbs: 13.0, fat: 2.0  },

  // ══ 台灣小吃補充 ══
  '擔仔麵':      { calories: 155, protein: 7.5,  carbs: 24.0, fat: 3.5  },
  '筒仔米糕':    { calories: 165, protein: 5.5,  carbs: 26.0, fat: 5.0  },
  '碗粿':        { calories: 120, protein: 3.5,  carbs: 22.0, fat: 2.0  },
  '芋粿巧':      { calories: 145, protein: 2.5,  carbs: 28.0, fat: 2.5  },
  '潤餅':        { calories: 190, protein: 7.5,  carbs: 28.0, fat: 5.5  },
  '刈包':        { calories: 310, protein: 12.0, carbs: 38.0, fat: 12.0 },
  '割包':        { calories: 310, protein: 12.0, carbs: 38.0, fat: 12.0 },
  '豬血糕':      { calories: 145, protein: 5.5,  carbs: 28.0, fat: 1.5  },
  '米血':        { calories: 145, protein: 5.5,  carbs: 28.0, fat: 1.5  },
  '甜不辣':      { calories: 115, protein: 8.0,  carbs: 14.0, fat: 2.5  },
  '臭豆腐':      { calories: 130, protein: 9.5,  carbs: 5.5,  fat: 8.0  },
  '蚵嗲':        { calories: 180, protein: 6.5,  carbs: 22.0, fat: 7.5  },
  '台式香腸':    { calories: 280, protein: 14.0, carbs: 8.0,  fat: 22.0 },
  '糯米腸':      { calories: 175, protein: 4.5,  carbs: 30.0, fat: 4.0  },
  '烤玉米':      { calories: 95,  protein: 3.0,  carbs: 20.5, fat: 1.5  },
  '棺材板':      { calories: 280, protein: 8.5,  carbs: 32.0, fat: 13.0 },
  '蚵仔煎':      { calories: 150, protein: 7.0,  carbs: 18.0, fat: 5.5  },

  // ══ 關東煮 ══
  '關東煮蘿蔔':  { calories: 18,  protein: 0.6,  carbs: 3.8,  fat: 0.1  },
  '關東煮蛋':    { calories: 78,  protein: 6.0,  carbs: 1.0,  fat: 5.5  },
  '關東煮豆腐':  { calories: 55,  protein: 5.5,  carbs: 1.5,  fat: 3.0  },
  '關東煮貢丸':  { calories: 120, protein: 8.5,  carbs: 9.5,  fat: 5.0  },
  '關東煮魚板':  { calories: 95,  protein: 9.5,  carbs: 9.0,  fat: 2.0  },
  '關東煮黑輪':  { calories: 95,  protein: 8.0,  carbs: 10.0, fat: 2.5  },
  '關東煮昆布':  { calories: 15,  protein: 0.5,  carbs: 3.0,  fat: 0.1  },
  '茶葉蛋':      { calories: 80,  protein: 6.5,  carbs: 1.2,  fat: 5.5  },

  // ══ 日式料理補充 ══
  '親子丼':      { calories: 165, protein: 10.5, carbs: 20.0, fat: 5.0  },
  '豬排丼':      { calories: 185, protein: 10.0, carbs: 22.0, fat: 6.5  },
  '牛丼':        { calories: 155, protein: 8.5,  carbs: 19.0, fat: 5.0  },
  '海鮮丼':      { calories: 145, protein: 11.5, carbs: 18.0, fat: 3.0  },
  '鮭魚丼':      { calories: 170, protein: 12.5, carbs: 19.0, fat: 5.5  },
  '鮪魚丼':      { calories: 155, protein: 13.0, carbs: 18.5, fat: 3.5  },
  '烏龍麵':      { calories: 105, protein: 3.5,  carbs: 21.5, fat: 0.5  },
  '炒烏龍':      { calories: 145, protein: 5.5,  carbs: 24.0, fat: 3.5  },
  '豚骨拉麵':    { calories: 180, protein: 9.5,  carbs: 23.5, fat: 6.0  },
  '味噌拉麵':    { calories: 165, protein: 8.5,  carbs: 23.0, fat: 4.5  },
  '醬油拉麵':    { calories: 155, protein: 8.0,  carbs: 22.5, fat: 4.0  },
  '鹽味拉麵':    { calories: 150, protein: 7.5,  carbs: 22.0, fat: 3.5  },
  '天婦羅':      { calories: 220, protein: 8.5,  carbs: 20.0, fat: 12.0 },
  '唐揚雞':      { calories: 250, protein: 17.5, carbs: 14.0, fat: 13.5 },
  '日式炸豬排':  { calories: 270, protein: 16.0, carbs: 16.0, fat: 16.0 },
  '章魚燒':      { calories: 185, protein: 7.5,  carbs: 24.0, fat: 7.0  },
  '大阪燒':      { calories: 175, protein: 8.5,  carbs: 18.0, fat: 7.5  },
  '壽喜燒':      { calories: 145, protein: 10.0, carbs: 12.0, fat: 6.0  },
  '茶碗蒸':      { calories: 60,  protein: 5.5,  carbs: 3.5,  fat: 2.5  },
  '味噌湯':      { calories: 40,  protein: 2.5,  carbs: 4.5,  fat: 1.5  },
  '日式炒飯':    { calories: 165, protein: 5.5,  carbs: 28.0, fat: 4.0  },
  '鰻魚飯':      { calories: 185, protein: 12.0, carbs: 22.0, fat: 6.0  },
  '海鮮烏龍':    { calories: 130, protein: 8.5,  carbs: 20.5, fat: 2.5  },
  '串燒雞腿':    { calories: 165, protein: 17.5, carbs: 0.5,  fat: 10.5 },
  '串燒雞翅':    { calories: 185, protein: 16.0, carbs: 2.0,  fat: 13.0 },
  '串燒豬五花':  { calories: 280, protein: 12.5, carbs: 1.0,  fat: 25.5 },
  '松阪豬':      { calories: 235, protein: 17.0, carbs: 0.5,  fat: 18.5 },

  // ══ 韓式料理補充 ══
  '石鍋拌飯':    { calories: 145, protein: 6.5,  carbs: 22.0, fat: 3.5  },
  '泡菜炒飯':    { calories: 165, protein: 5.5,  carbs: 28.0, fat: 4.5  },
  '韓式炸雞':    { calories: 280, protein: 19.0, carbs: 16.0, fat: 16.0 },
  '炒年糕':      { calories: 165, protein: 3.5,  carbs: 32.0, fat: 3.0  },
  '韓式煎餅':    { calories: 175, protein: 5.5,  carbs: 22.0, fat: 7.5  },
  '部隊鍋':      { calories: 120, protein: 7.0,  carbs: 13.0, fat: 4.0  },
  '韓式冷麵':    { calories: 120, protein: 4.5,  carbs: 22.5, fat: 1.5  },
  '豆腐鍋':      { calories: 80,  protein: 6.5,  carbs: 6.5,  fat: 3.0  },
  '海鮮煎餅':    { calories: 180, protein: 7.5,  carbs: 22.0, fat: 7.0  },
  '韓式烤肉':    { calories: 215, protein: 18.5, carbs: 3.5,  fat: 14.5 },
  '韓式豬五花':  { calories: 310, protein: 13.5, carbs: 2.5,  fat: 28.0 },
  '辣炒雞':      { calories: 175, protein: 15.5, carbs: 10.0, fat: 7.5  },
  '辣牛肉湯':    { calories: 65,  protein: 5.5,  carbs: 5.5,  fat: 2.0  },

  // ══ 港式料理補充 ══
  '蝦餃':        { calories: 100, protein: 5.5,  carbs: 13.0, fat: 2.5  },
  '燒賣':        { calories: 110, protein: 6.5,  carbs: 12.5, fat: 3.5  },
  '叉燒包':      { calories: 200, protein: 7.5,  carbs: 28.0, fat: 6.5  },
  '蘿蔔糕':      { calories: 110, protein: 2.0,  carbs: 22.0, fat: 1.5  },
  '腸粉':        { calories: 115, protein: 3.5,  carbs: 21.5, fat: 1.5  },
  '煲仔飯':      { calories: 155, protein: 6.5,  carbs: 24.0, fat: 4.0  },
  '菠蘿包':      { calories: 320, protein: 7.0,  carbs: 52.0, fat: 9.0  },
  '港式奶茶':    { calories: 70,  protein: 2.5,  carbs: 9.0,  fat: 2.5  },
  '鴛鴦奶茶':    { calories: 65,  protein: 2.0,  carbs: 9.5,  fat: 2.0  },
  '椰汁糕':      { calories: 150, protein: 1.5,  carbs: 25.0, fat: 5.0  },
  '芒果布丁':    { calories: 120, protein: 2.5,  carbs: 22.0, fat: 3.0  },
  '叉燒':        { calories: 185, protein: 20.0, carbs: 8.5,  fat: 7.5  },
  '燒鴨':        { calories: 210, protein: 19.0, carbs: 2.0,  fat: 14.0 },
  '脆皮燒肉':    { calories: 420, protein: 20.5, carbs: 1.0,  fat: 38.0 },

  // ══ 西式料理補充 ══
  '義大利麵':    { calories: 160, protein: 6.0,  carbs: 30.5, fat: 1.5  },
  '白醬義大利麵': { calories: 210, protein: 7.5,  carbs: 28.0, fat: 8.0  },
  '紅醬義大利麵': { calories: 180, protein: 7.0,  carbs: 30.0, fat: 4.5  },
  '青醬義大利麵': { calories: 230, protein: 7.5,  carbs: 28.5, fat: 10.0 },
  '焗烤飯':      { calories: 195, protein: 8.5,  carbs: 28.0, fat: 6.5  },
  '焗烤義大利麵': { calories: 215, protein: 9.0,  carbs: 26.0, fat: 8.5  },
  '凱薩沙拉':    { calories: 110, protein: 5.5,  carbs: 7.5,  fat: 7.5  },
  '牛排':        { calories: 250, protein: 27.0, carbs: 0.0,  fat: 16.0 },
  '豬排':        { calories: 225, protein: 22.0, carbs: 2.5,  fat: 14.5 },
  '炸魚薯條':    { calories: 270, protein: 12.5, carbs: 28.0, fat: 13.0 },
  '玉米濃湯':    { calories: 85,  protein: 2.5,  carbs: 14.0, fat: 2.5  },
  '蘑菇濃湯':    { calories: 75,  protein: 2.0,  carbs: 9.5,  fat: 3.5  },
  '南瓜濃湯':    { calories: 70,  protein: 1.5,  carbs: 12.0, fat: 2.0  },
  '洋蔥湯':      { calories: 50,  protein: 2.0,  carbs: 7.5,  fat: 1.5  },
  '披薩':        { calories: 265, protein: 11.0, carbs: 33.0, fat: 10.0 },
  '起司披薩':    { calories: 285, protein: 12.5, carbs: 33.0, fat: 12.0 },
  '夏威夷披薩':  { calories: 255, protein: 10.5, carbs: 34.0, fat: 9.5  },
  '漢堡':        { calories: 295, protein: 15.0, carbs: 28.0, fat: 14.0 },
  '雙層漢堡':    { calories: 450, protein: 25.0, carbs: 35.0, fat: 24.0 },
  '熱狗':        { calories: 290, protein: 11.0, carbs: 26.0, fat: 16.0 },
  '三明治':      { calories: 240, protein: 12.0, carbs: 28.0, fat: 9.5  },
  '鮪魚三明治':  { calories: 260, protein: 15.0, carbs: 27.0, fat: 10.0 },
  '起司蛋三明治': { calories: 275, protein: 13.5, carbs: 26.0, fat: 13.0 },

  // ══ 便利商店 補充 ══
  '御飯糰':      { calories: 185, protein: 4.5,  carbs: 38.0, fat: 1.5  },
  '鮭魚御飯糰':  { calories: 195, protein: 6.5,  carbs: 37.0, fat: 2.5  },
  '梅子御飯糰':  { calories: 175, protein: 3.5,  carbs: 38.5, fat: 0.5  },
  '起司漢堡':    { calories: 320, protein: 16.0, carbs: 29.0, fat: 15.5 },
  '肉鬆麵包':    { calories: 310, protein: 8.5,  carbs: 46.0, fat: 10.0 },
  '茶葉麵包':    { calories: 285, protein: 7.0,  carbs: 47.0, fat: 8.0  },
  '雞腿堡':      { calories: 380, protein: 18.5, carbs: 38.0, fat: 17.0 },

  // ══ 東南亞料理補充 ══
  '越南河粉':    { calories: 100, protein: 6.5,  carbs: 16.5, fat: 1.5  },
  '春捲':        { calories: 170, protein: 5.5,  carbs: 20.0, fat: 7.5  },
  '打拋豬肉':    { calories: 165, protein: 13.5, carbs: 5.5,  fat: 9.5  },
  '泰式炒河粉':  { calories: 185, protein: 9.5,  carbs: 24.0, fat: 6.0  },
  '泰式打拋':    { calories: 155, protein: 13.0, carbs: 5.0,  fat: 9.0  },
  '泰式綠咖哩':  { calories: 145, protein: 8.5,  carbs: 8.5,  fat: 9.0  },
  '泰式紅咖哩':  { calories: 150, protein: 9.0,  carbs: 9.0,  fat: 9.5  },
  '椰奶咖哩':    { calories: 165, protein: 9.0,  carbs: 9.5,  fat: 10.5 },
  '印度咖哩':    { calories: 155, protein: 8.5,  carbs: 14.0, fat: 7.5  },
  '馬來沙嗲':    { calories: 175, protein: 14.5, carbs: 5.5,  fat: 11.0 },
  '叻沙':        { calories: 135, protein: 7.0,  carbs: 14.0, fat: 6.0  },

  // ══ 甜點點心補充 ══
  '芋圓':        { calories: 135, protein: 1.5,  carbs: 30.5, fat: 1.0  },
  '粉圓':        { calories: 135, protein: 0.2,  carbs: 33.5, fat: 0.1  },
  '仙草凍':      { calories: 30,  protein: 0.5,  carbs: 7.5,  fat: 0.1  },
  '燒仙草':      { calories: 80,  protein: 0.8,  carbs: 20.0, fat: 0.2  },
  '愛玉':        { calories: 28,  protein: 0.2,  carbs: 7.0,  fat: 0.1  },
  '粉粿':        { calories: 95,  protein: 0.3,  carbs: 23.5, fat: 0.1  },
  '黑糖粉粿':    { calories: 110, protein: 0.3,  carbs: 27.5, fat: 0.1  },
  '雪花冰':      { calories: 155, protein: 2.5,  carbs: 32.0, fat: 2.5  },
  '芋泥':        { calories: 155, protein: 2.0,  carbs: 33.0, fat: 2.5  },
  '麻糬':        { calories: 235, protein: 3.5,  carbs: 52.0, fat: 1.5  },
  '大福':        { calories: 210, protein: 3.5,  carbs: 46.0, fat: 1.5  },
  '草莓大福':    { calories: 175, protein: 3.0,  carbs: 38.0, fat: 1.5  },
  '銅鑼燒':      { calories: 265, protein: 5.5,  carbs: 48.0, fat: 6.0  },
  '蛋黃酥':      { calories: 380, protein: 7.0,  carbs: 47.0, fat: 18.0 },
  '鳳梨酥':      { calories: 400, protein: 5.0,  carbs: 58.0, fat: 16.0 },
  '太陽餅':      { calories: 415, protein: 5.5,  carbs: 60.0, fat: 17.0 },
  '牛軋糖':      { calories: 430, protein: 8.5,  carbs: 68.0, fat: 14.0 },
  '杏仁豆腐':    { calories: 70,  protein: 1.5,  carbs: 14.5, fat: 1.0  },
  '芒果冰':      { calories: 130, protein: 1.0,  carbs: 31.5, fat: 0.5  },
  '草莓冰':      { calories: 115, protein: 0.8,  carbs: 28.0, fat: 0.3  },
  '綠豆糕':      { calories: 340, protein: 8.5,  carbs: 67.0, fat: 4.0  },
  '蛋糕':        { calories: 355, protein: 5.5,  carbs: 52.0, fat: 14.5 },
  '起司蛋糕':    { calories: 325, protein: 6.5,  carbs: 32.0, fat: 19.0 },
  '生乳捲':      { calories: 280, protein: 5.0,  carbs: 32.0, fat: 14.5 },
  '奶油泡芙':    { calories: 300, protein: 5.5,  carbs: 30.0, fat: 17.0 },
  '蛋塔':        { calories: 265, protein: 5.5,  carbs: 30.0, fat: 14.0 },
  '巧克力蛋糕':  { calories: 380, protein: 5.5,  carbs: 55.0, fat: 16.0 },

  // ══ 飲料補充 ══
  '珍珠奶茶':    { calories: 65,  protein: 0.8,  carbs: 14.5, fat: 1.0  },
  '鮮奶茶':      { calories: 55,  protein: 1.5,  carbs: 9.5,  fat: 1.5  },
  '紅茶':        { calories: 2,   protein: 0.1,  carbs: 0.5,  fat: 0.0  },
  '無糖紅茶':    { calories: 2,   protein: 0.1,  carbs: 0.5,  fat: 0.0  },
  '綠茶':        { calories: 2,   protein: 0.2,  carbs: 0.3,  fat: 0.0  },
  '無糖綠茶':    { calories: 2,   protein: 0.2,  carbs: 0.3,  fat: 0.0  },
  '烏龍茶':      { calories: 1,   protein: 0.1,  carbs: 0.2,  fat: 0.0  },
  '無糖烏龍':    { calories: 1,   protein: 0.1,  carbs: 0.2,  fat: 0.0  },
  '多多':        { calories: 70,  protein: 1.5,  carbs: 16.0, fat: 0.2  },
  '養樂多':      { calories: 70,  protein: 1.5,  carbs: 16.0, fat: 0.2  },
  '沙士':        { calories: 38,  protein: 0.0,  carbs: 9.5,  fat: 0.0  },
  '黑松沙士':    { calories: 38,  protein: 0.0,  carbs: 9.5,  fat: 0.0  },
  '蘋果西打':    { calories: 42,  protein: 0.0,  carbs: 10.5, fat: 0.0  },
  '芬達橘子':    { calories: 42,  protein: 0.0,  carbs: 10.5, fat: 0.0  },
  '罐裝咖啡':    { calories: 45,  protein: 0.5,  carbs: 9.5,  fat: 0.5  },
  '黑咖啡':      { calories: 4,   protein: 0.3,  carbs: 0.7,  fat: 0.0  },
  '美式咖啡':    { calories: 4,   protein: 0.3,  carbs: 0.7,  fat: 0.0  },
  '拿鐵':        { calories: 55,  protein: 2.8,  carbs: 5.5,  fat: 2.5  },
  '卡布奇諾':    { calories: 50,  protein: 2.5,  carbs: 5.0,  fat: 2.0  },
  '摩卡':        { calories: 80,  protein: 2.5,  carbs: 11.0, fat: 3.0  },
  '燕麥奶':      { calories: 45,  protein: 1.0,  carbs: 8.5,  fat: 1.0  },
  '杏仁奶':      { calories: 15,  protein: 0.5,  carbs: 1.5,  fat: 1.0  },
  '豆奶':        { calories: 45,  protein: 3.5,  carbs: 4.5,  fat: 1.5  },
  '木瓜牛奶':    { calories: 68,  protein: 2.5,  carbs: 12.0, fat: 1.5  },
  '草莓牛奶':    { calories: 65,  protein: 2.5,  carbs: 11.5, fat: 1.5  },
  '巧克力牛奶':  { calories: 75,  protein: 3.5,  carbs: 12.0, fat: 2.0  },
  '低脂牛奶':    { calories: 42,  protein: 3.5,  carbs: 5.0,  fat: 1.0  },
  '全脂牛奶':    { calories: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3  },
  '檸檬水':      { calories: 8,   protein: 0.1,  carbs: 2.0,  fat: 0.0  },
  '果汁':        { calories: 45,  protein: 0.5,  carbs: 11.0, fat: 0.1  },
  '番石榴汁':    { calories: 42,  protein: 0.5,  carbs: 10.0, fat: 0.2  },

  // ══ 零食補充 ══
  '洋芋片':      { calories: 535, protein: 7.0,  carbs: 53.0, fat: 34.0 },
  '餅乾':        { calories: 480, protein: 7.5,  carbs: 67.0, fat: 20.0 },
  '巧克力':      { calories: 545, protein: 5.5,  carbs: 60.0, fat: 31.0 },
  '黑巧克力':    { calories: 560, protein: 6.5,  carbs: 48.0, fat: 38.0 },
  '糖果':        { calories: 390, protein: 0.0,  carbs: 98.0, fat: 0.0  },
  '軟糖':        { calories: 330, protein: 5.5,  carbs: 77.0, fat: 0.2  },
  '爆米花':      { calories: 380, protein: 12.0, carbs: 74.0, fat: 4.5  },
  '奶油爆米花':  { calories: 480, protein: 8.5,  carbs: 68.0, fat: 20.0 },
  '仙貝':        { calories: 375, protein: 7.5,  carbs: 83.0, fat: 1.5  },
  '米果':        { calories: 375, protein: 7.5,  carbs: 83.0, fat: 1.5  },
  '乖乖':        { calories: 495, protein: 5.5,  carbs: 70.0, fat: 21.5 },
  '蝦味先':      { calories: 480, protein: 6.5,  carbs: 64.0, fat: 22.5 },
  '科學麵':      { calories: 480, protein: 8.5,  carbs: 58.0, fat: 23.0 },
  '泡麵（乾）':  { calories: 460, protein: 10.5, carbs: 64.0, fat: 18.5 },
  '果凍':        { calories: 60,  protein: 1.0,  carbs: 14.5, fat: 0.0  },
  '布丁':        { calories: 115, protein: 3.0,  carbs: 19.0, fat: 3.0  },

  // ══ 中式家常菜補充 ══
  '回鍋肉':      { calories: 255, protein: 14.5, carbs: 7.5,  fat: 19.0 },
  '宮保雞丁':    { calories: 175, protein: 14.0, carbs: 7.5,  fat: 10.0 },
  '麻婆豆腐':    { calories: 100, protein: 7.5,  carbs: 5.5,  fat: 5.5  },
  '魚香茄子':    { calories: 95,  protein: 4.5,  carbs: 8.5,  fat: 5.5  },
  '紅燒肉':      { calories: 290, protein: 14.5, carbs: 8.5,  fat: 22.5 },
  '東坡肉':      { calories: 350, protein: 14.0, carbs: 12.5, fat: 28.0 },
  '糖醋排骨':    { calories: 240, protein: 13.5, carbs: 18.0, fat: 12.0 },
  '糖醋魚':      { calories: 170, protein: 12.5, carbs: 14.5, fat: 5.5  },
  '清蒸魚':      { calories: 110, protein: 18.0, carbs: 1.5,  fat: 3.5  },
  '蒸蛋':        { calories: 75,  protein: 6.5,  carbs: 2.5,  fat: 4.5  },
  '炒青菜':      { calories: 55,  protein: 2.0,  carbs: 5.5,  fat: 3.0  },
  '蒜炒空心菜':  { calories: 60,  protein: 2.5,  carbs: 6.0,  fat: 3.0  },
  '炒高麗菜':    { calories: 55,  protein: 1.5,  carbs: 6.5,  fat: 2.5  },
  '乾煸四季豆':  { calories: 80,  protein: 3.5,  carbs: 8.0,  fat: 4.0  },
  '番茄炒蛋':    { calories: 110, protein: 6.5,  carbs: 6.5,  fat: 6.5  },
  '韭黃炒蛋':    { calories: 120, protein: 7.5,  carbs: 3.5,  fat: 8.5  },
  '地三鮮':      { calories: 130, protein: 3.5,  carbs: 15.0, fat: 6.5  },
  '紅燒豆腐':    { calories: 100, protein: 8.5,  carbs: 4.5,  fat: 5.5  },
  '滷豬腳':      { calories: 235, protein: 17.5, carbs: 8.0,  fat: 15.5 },
  '清炒蝦仁':    { calories: 90,  protein: 16.5, carbs: 2.5,  fat: 2.0  },

  // ══ 早餐店補充 ══
  '飯糰':        { calories: 280, protein: 8.5,  carbs: 52.0, fat: 4.5  },
  '燒餅油條':    { calories: 370, protein: 9.5,  carbs: 50.0, fat: 15.5 },
  '燒餅':        { calories: 280, protein: 7.5,  carbs: 47.0, fat: 7.0  },
  '油條':        { calories: 390, protein: 9.5,  carbs: 47.0, fat: 18.5 },
  '蘿蔔絲餅':    { calories: 250, protein: 5.5,  carbs: 34.0, fat: 11.0 },
  '鍋貼':        { calories: 195, protein: 8.5,  carbs: 24.0, fat: 7.5  },
  '水餃':        { calories: 155, protein: 7.5,  carbs: 21.0, fat: 5.0  },
  '煎餃':        { calories: 190, protein: 8.0,  carbs: 22.0, fat: 8.0  },
  '小籠包':      { calories: 165, protein: 8.5,  carbs: 20.0, fat: 5.5  },
  '湯包':        { calories: 130, protein: 6.5,  carbs: 17.0, fat: 4.0  },
  '韭菜盒子':    { calories: 225, protein: 7.5,  carbs: 28.0, fat: 9.5  },

  // ══ 鴨肉系列 ══
  '鴨肉麵羹':    { calories: 80,  protein: 5.5,  carbs: 9.0,  fat: 2.0  },
  '鴨肉羹':      { calories: 88,  protein: 6.5,  carbs: 8.5,  fat: 2.5  },
  '鴨肉飯':      { calories: 130, protein: 9.0,  carbs: 15.5, fat: 4.0  },
  '鴨肉米粉':    { calories: 78,  protein: 5.0,  carbs: 8.5,  fat: 2.0  },
  '薑母鴨':      { calories: 165, protein: 16.0, carbs: 4.5,  fat: 9.5  },
  '鹽水鴨':      { calories: 185, protein: 20.0, carbs: 1.0,  fat: 11.0 },
  '烤鴨':        { calories: 200, protein: 19.5, carbs: 0.5,  fat: 13.5 },
  '北京烤鴨':    { calories: 255, protein: 15.5, carbs: 5.0,  fat: 19.5 },

  // ══ 虱目魚系列 ══
  '虱目魚湯':    { calories: 55,  protein: 8.0,  carbs: 0.5,  fat: 2.5  },
  '虱目魚粥':    { calories: 65,  protein: 5.5,  carbs: 7.5,  fat: 1.5  },
  '虱目魚肚':    { calories: 215, protein: 20.0, carbs: 0.0,  fat: 14.5 },
  '香煎虱目魚':  { calories: 185, protein: 22.0, carbs: 1.0,  fat: 10.0 },
  '虱目魚肚粥':  { calories: 75,  protein: 5.5,  carbs: 7.5,  fat: 2.5  },

  // ══ 台式家常菜補充 ══
  '麻油雞':      { calories: 158, protein: 18.5, carbs: 0.5,  fat: 9.0  },
  '麻油雞飯':    { calories: 138, protein: 10.5, carbs: 15.0, fat: 4.5  },
  '麻油腰子':    { calories: 118, protein: 14.5, carbs: 1.5,  fat: 6.0  },
  '瓜仔肉':      { calories: 168, protein: 12.5, carbs: 5.5,  fat: 11.0 },
  '瓜仔肉飯':    { calories: 128, protein: 7.5,  carbs: 16.5, fat: 3.5  },
  '三色蛋':      { calories: 155, protein: 10.5, carbs: 2.0,  fat: 12.0 },
  '皮蛋豆腐':    { calories: 78,  protein: 5.5,  carbs: 3.5,  fat: 4.5  },
  '蝦仁炒蛋':    { calories: 122, protein: 12.5, carbs: 1.0,  fat: 7.5  },
  '青椒炒肉絲':  { calories: 118, protein: 10.5, carbs: 5.0,  fat: 6.5  },
  '台式鹹豬肉':  { calories: 305, protein: 15.5, carbs: 2.5,  fat: 26.0 },
  '芹菜炒花枝':  { calories: 78,  protein: 10.5, carbs: 4.0,  fat: 2.0  },
  '炒蛤蜊':      { calories: 62,  protein: 8.5,  carbs: 3.5,  fat: 1.5  },
  '九層塔炒蛤蜊':{ calories: 68,  protein: 8.5,  carbs: 4.0,  fat: 1.5  },
  '台式泡菜':    { calories: 28,  protein: 1.0,  carbs: 6.0,  fat: 0.2  },
  '高麗菜滷':    { calories: 35,  protein: 1.5,  carbs: 4.0,  fat: 1.0  },
  '小魚乾炒花生':{ calories: 355, protein: 28.0, carbs: 10.5, fat: 22.0 },
  '滷豬腳':      { calories: 235, protein: 17.5, carbs: 8.0,  fat: 15.5 },
  '薑燒豬肉':    { calories: 175, protein: 14.5, carbs: 8.0,  fat: 10.0 },
  '梅子豬排':    { calories: 195, protein: 15.5, carbs: 10.0, fat: 11.0 },
  '水蓮炒肉':    { calories: 95,  protein: 7.5,  carbs: 4.5,  fat: 5.5  },
  '焢肉飯':      { calories: 208, protein: 9.5,  carbs: 24.0, fat: 8.5  },
  '炸排骨飯':    { calories: 175, protein: 9.5,  carbs: 18.0, fat: 7.0  },
  '炸雞腿飯':    { calories: 162, protein: 10.5, carbs: 16.5, fat: 5.5  },
  '雞絲涼麵':    { calories: 145, protein: 7.5,  carbs: 20.5, fat: 4.5  },
  '豬血湯':      { calories: 42,  protein: 5.5,  carbs: 3.0,  fat: 0.8  },
  '四神湯':      { calories: 55,  protein: 4.5,  carbs: 6.5,  fat: 1.5  },
  '冬瓜排骨湯':  { calories: 38,  protein: 3.0,  carbs: 3.5,  fat: 1.0  },
  '藥膳排骨湯':  { calories: 52,  protein: 4.5,  carbs: 3.5,  fat: 1.5  },
  '貢丸湯':      { calories: 58,  protein: 5.0,  carbs: 4.5,  fat: 2.0  },
  '餛飩湯':      { calories: 52,  protein: 4.0,  carbs: 5.5,  fat: 1.5  },
  '蛤蜊湯':      { calories: 35,  protein: 4.5,  carbs: 2.0,  fat: 0.5  },
  '絲瓜蛤蜊':    { calories: 38,  protein: 4.5,  carbs: 2.5,  fat: 0.5  },
  '酸辣湯':      { calories: 48,  protein: 3.5,  carbs: 5.5,  fat: 1.5  },
  '西湖牛肉羹':  { calories: 62,  protein: 5.5,  carbs: 6.0,  fat: 1.5  },
  '紫菜蛋花湯':  { calories: 25,  protein: 2.5,  carbs: 2.0,  fat: 0.8  },
  '味噌蛤蜊湯':  { calories: 38,  protein: 4.0,  carbs: 3.0,  fat: 0.8  },
  '肉骨茶':      { calories: 82,  protein: 8.5,  carbs: 2.5,  fat: 4.5  },
  '薑絲大腸':    { calories: 115, protein: 8.0,  carbs: 3.5,  fat: 8.0  },

  // ══ 飯便當補充 ══
  '排骨飯':      { calories: 155, protein: 8.5,  carbs: 18.0, fat: 5.5  },
  '控肉飯':      { calories: 208, protein: 9.5,  carbs: 22.5, fat: 8.5  },
  '雞腿排飯':    { calories: 158, protein: 11.5, carbs: 16.5, fat: 5.5  },
  '燒肉飯':      { calories: 168, protein: 10.0, carbs: 16.5, fat: 6.0  },
  '鮭魚炒飯':    { calories: 168, protein: 8.5,  carbs: 22.5, fat: 5.0  },
  '蝦仁炒飯':    { calories: 162, protein: 8.0,  carbs: 22.0, fat: 4.5  },
  '皮蛋瘦肉粥':  { calories: 72,  protein: 5.5,  carbs: 10.0, fat: 1.5  },
  '廣東粥':      { calories: 68,  protein: 5.0,  carbs: 9.5,  fat: 1.5  },
  '鹹粥':        { calories: 62,  protein: 4.5,  carbs: 8.5,  fat: 1.5  },

  // ══ 夜市/台式小吃補充 ══
  '胡椒餅':      { calories: 225, protein: 8.5,  carbs: 32.0, fat: 7.5  },
  '割包':        { calories: 285, protein: 12.5, carbs: 36.0, fat: 10.0 },
  '刈包':        { calories: 285, protein: 12.5, carbs: 36.0, fat: 10.0 },
  '炸臭豆腐':    { calories: 188, protein: 10.5, carbs: 12.0, fat: 11.0 },
  '麻辣臭豆腐':  { calories: 120, protein: 8.5,  carbs: 8.5,  fat: 5.5  },
  '台灣漢堡':    { calories: 285, protein: 12.5, carbs: 36.0, fat: 10.0 },
  '鹽酥雞':      { calories: 295, protein: 22.5, carbs: 12.5, fat: 17.5 },
  '蚵仔麵線':    { calories: 75,  protein: 4.5,  carbs: 10.5, fat: 1.5  },
  '甜不辣':      { calories: 105, protein: 8.5,  carbs: 10.5, fat: 3.5  },
  '涼圓':        { calories: 125, protein: 1.5,  carbs: 29.5, fat: 0.5  },
  '花枝漿':      { calories: 82,  protein: 11.5, carbs: 5.5,  fat: 1.5  },
  '肉羹':        { calories: 85,  protein: 7.0,  carbs: 9.5,  fat: 2.0  },
  '肉羹麵':      { calories: 108, protein: 6.5,  carbs: 15.0, fat: 2.5  },
  '米血':        { calories: 135, protein: 4.0,  carbs: 28.0, fat: 1.0  },
  '蘿蔔糕':      { calories: 150, protein: 2.5,  carbs: 26.5, fat: 4.0  },

  // ══ 飲料補充 ══
  '黑松沙士':    { calories: 42,  protein: 0.0,  carbs: 10.5, fat: 0.0  },
  '蘋果西打':    { calories: 40,  protein: 0.0,  carbs: 10.0, fat: 0.0  },
  '維大力':      { calories: 38,  protein: 0.0,  carbs: 9.5,  fat: 0.0  },
  '舒跑':        { calories: 25,  protein: 0.0,  carbs: 6.3,  fat: 0.0  },
  '光泉鮮奶':    { calories: 62,  protein: 3.1,  carbs: 4.8,  fat: 3.3  },
  '味全鮮奶':    { calories: 62,  protein: 3.1,  carbs: 4.8,  fat: 3.3  },
  '統一鮮奶':    { calories: 62,  protein: 3.1,  carbs: 4.8,  fat: 3.3  },
  '麥香紅茶':    { calories: 38,  protein: 0.0,  carbs: 9.5,  fat: 0.0  },
  '麥香奶茶':    { calories: 50,  protein: 0.5,  carbs: 11.5, fat: 0.5  },
  '統一麥茶':    { calories: 5,   protein: 0.0,  carbs: 1.2,  fat: 0.0  },
  '古道梅子綠茶':{ calories: 28,  protein: 0.0,  carbs: 7.0,  fat: 0.0  },
  '御茶園每朝健康綠茶': { calories: 0, protein: 0.0, carbs: 0.0, fat: 0.0 },
  '茶裏王':      { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },
  '純喫茶':      { calories: 18,  protein: 0.0,  carbs: 4.5,  fat: 0.0  },
  '原萃':        { calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0  },

  // ══ 韓式豆腐煲 ══
  '韓式大醬炸魚嫩豆腐煲': { calories: 109, protein: 6.8, carbs: 11.7, fat: 3.9 },

  // ══ 台式飯糰系列 ══
  '台式飯糰':     { calories: 175, protein: 3.5,  carbs: 36.0, fat: 1.5  },
  '肉鬆飯糰':     { calories: 205, protein: 7.0,  carbs: 37.0, fat: 3.5  },
  '油條飯糰':     { calories: 235, protein: 6.0,  carbs: 38.0, fat: 6.5  },
  '蛋黃飯糰':     { calories: 210, protein: 7.0,  carbs: 35.0, fat: 4.5  },
  '菜脯飯糰':     { calories: 175, protein: 4.5,  carbs: 34.0, fat: 2.0  },
  '燒肉飯糰':     { calories: 205, protein: 8.0,  carbs: 33.0, fat: 4.0  },
  '鮪魚飯糰':     { calories: 190, protein: 8.5,  carbs: 34.0, fat: 2.5  },
  '肉鬆油條飯糰': { calories: 250, protein: 7.5,  carbs: 38.5, fat: 7.0  },

  // ══ 台灣特色小吃 ══
  '油飯':         { calories: 195, protein: 5.5,  carbs: 35.0, fat: 4.5  },
  '大腸包小腸':   { calories: 265, protein: 9.0,  carbs: 38.5, fat: 9.0  },
  '花枝丸':       { calories: 105, protein: 10.5, carbs: 10.0, fat: 2.5  },
  '蔥抓餅':       { calories: 340, protein: 7.5,  carbs: 48.0, fat: 14.0 },
  '蔥油餅加蛋':   { calories: 390, protein: 10.0, carbs: 50.0, fat: 17.0 },
  '紅龜粿':       { calories: 210, protein: 3.5,  carbs: 43.0, fat: 3.0  },
  '鹼粽':         { calories: 175, protein: 3.5,  carbs: 38.5, fat: 1.0  },
  '菜粽':         { calories: 175, protein: 4.5,  carbs: 30.0, fat: 5.0  },
  '肉粽(台式)':   { calories: 190, protein: 6.5,  carbs: 30.0, fat: 6.0  },
  '粽子(北部)':   { calories: 180, protein: 6.5,  carbs: 28.5, fat: 5.5  },
  '粽子(南部)':   { calories: 200, protein: 7.0,  carbs: 31.5, fat: 6.5  },
  '米苔目湯':     { calories: 75,  protein: 2.5,  carbs: 15.5, fat: 0.5  },
  '米苔目乾':     { calories: 100, protein: 3.0,  carbs: 20.0, fat: 1.0  },
  '水晶餃':       { calories: 105, protein: 4.5,  carbs: 16.0, fat: 2.5  },
  '鯛魚燒':       { calories: 240, protein: 5.5,  carbs: 44.5, fat: 5.5  },
  '炸蝦':         { calories: 190, protein: 14.5, carbs: 11.0, fat: 10.0 },
  '炸花枝':       { calories: 195, protein: 13.5, carbs: 12.0, fat: 10.5 },
  '豬腳飯':       { calories: 200, protein: 10.5, carbs: 22.0, fat: 8.5  },
  '雞腳':         { calories: 215, protein: 18.0, carbs: 0.0,  fat: 16.0 },
  '鳳爪':         { calories: 215, protein: 18.0, carbs: 0.0,  fat: 16.0 },
  '雞爪':         { calories: 215, protein: 18.0, carbs: 0.0,  fat: 16.0 },
  '豬皮':         { calories: 415, protein: 44.0, carbs: 0.0,  fat: 26.0 },
  '白菜滷':       { calories: 45,  protein: 2.5,  carbs: 5.5,  fat: 1.5  },
  '燙青菜':       { calories: 35,  protein: 2.0,  carbs: 4.5,  fat: 1.0  },
  '燴飯':         { calories: 115, protein: 6.5,  carbs: 16.5, fat: 2.5  },
  '肉燥拌麵':     { calories: 158, protein: 7.5,  carbs: 23.0, fat: 4.5  },
  '乾麵(肉燥)':   { calories: 160, protein: 7.5,  carbs: 24.0, fat: 4.5  },
  '蝦仁湯麵':     { calories: 110, protein: 7.0,  carbs: 16.5, fat: 1.5  },
  '清雞湯':       { calories: 18,  protein: 2.5,  carbs: 0.5,  fat: 0.5  },
  '雞湯麵':       { calories: 115, protein: 7.5,  carbs: 17.5, fat: 2.0  },
  '排骨蓮藕湯':   { calories: 45,  protein: 3.5,  carbs: 5.5,  fat: 1.5  },
  '羅宋湯':       { calories: 52,  protein: 3.5,  carbs: 6.5,  fat: 1.5  },
  '福菜肉片湯':   { calories: 40,  protein: 4.0,  carbs: 2.5,  fat: 1.5  },
  '苦瓜排骨湯':   { calories: 35,  protein: 3.5,  carbs: 3.0,  fat: 1.0  },
  '玉米排骨湯':   { calories: 42,  protein: 3.5,  carbs: 4.5,  fat: 1.0  },
  '大骨湯':       { calories: 15,  protein: 1.5,  carbs: 0.5,  fat: 0.5  },

  // ══ 鵝肉系列 ══
  '鵝肉':         { calories: 240, protein: 22.0, carbs: 0.0,  fat: 16.5 },
  '鵝肉飯':       { calories: 140, protein: 10.5, carbs: 16.5, fat: 3.5  },
  '鵝肉麵':       { calories: 120, protein: 8.5,  carbs: 16.0, fat: 2.5  },
  '鵝肉湯麵':     { calories: 120, protein: 8.5,  carbs: 16.0, fat: 2.5  },
  '切仔鴨':       { calories: 175, protein: 17.5, carbs: 0.5,  fat: 11.5 },

  // ══ 台灣飲料補充 ══
  '甘蔗汁':       { calories: 48,  protein: 0.2,  carbs: 12.5, fat: 0.0  },
  '冬瓜露':       { calories: 52,  protein: 0.0,  carbs: 13.5, fat: 0.0  },
  '紅茶冰':       { calories: 25,  protein: 0.0,  carbs: 6.5,  fat: 0.0  },
  '仙草蜜':       { calories: 55,  protein: 0.3,  carbs: 14.0, fat: 0.1  },
  '芋圓仙草':     { calories: 125, protein: 1.5,  carbs: 28.5, fat: 0.8  },
  '豆花飲':       { calories: 75,  protein: 3.5,  carbs: 12.5, fat: 1.5  },
  '台灣啤酒':     { calories: 42,  protein: 0.3,  carbs: 3.5,  fat: 0.0  },
  '罐裝啤酒':     { calories: 43,  protein: 0.3,  carbs: 3.5,  fat: 0.0  },

  // ══ 食材補充 ══
  '黑木耳':       { calories: 20,  protein: 0.9,  carbs: 5.5,  fat: 0.1  },
  '白木耳':       { calories: 15,  protein: 0.5,  carbs: 3.5,  fat: 0.1  },
  '魚豆腐':       { calories: 155, protein: 11.5, carbs: 14.0, fat: 6.0  },
  '海帶結':       { calories: 22,  protein: 1.0,  carbs: 4.5,  fat: 0.3  },
  '海帶':         { calories: 43,  protein: 1.7,  carbs: 9.6,  fat: 0.6  },
  '九層塔':       { calories: 23,  protein: 2.5,  carbs: 3.0,  fat: 0.6  },
  '豆薯':         { calories: 38,  protein: 1.4,  carbs: 8.8,  fat: 0.1  },
  '豆腐衣':       { calories: 197, protein: 23.5, carbs: 1.5,  fat: 10.5 },
  '素雞':         { calories: 190, protein: 15.0, carbs: 6.0,  fat: 12.0 },
  '猴頭菇':       { calories: 35,  protein: 2.5,  carbs: 7.0,  fat: 0.5  },
  '松露':         { calories: 92,  protein: 9.5,  carbs: 13.5, fat: 1.0  },
  '豬骨':         { calories: 165, protein: 20.0, carbs: 0.0,  fat: 9.5  },

  // ══ 中式家常菜（補） ══
  '酸菜魚':       { calories: 105, protein: 10.5, carbs: 5.5,  fat: 5.0  },
  '夫妻肺片':     { calories: 165, protein: 12.5, carbs: 5.0,  fat: 11.0 },
  '口水雞':       { calories: 155, protein: 14.5, carbs: 4.5,  fat: 9.0  },
  '水煮牛肉':     { calories: 130, protein: 14.5, carbs: 5.0,  fat: 6.5  },
  '水煮魚':       { calories: 110, protein: 12.5, carbs: 3.5,  fat: 5.0  },
  '剁椒魚頭':     { calories: 90,  protein: 12.0, carbs: 3.0,  fat: 3.5  },
  '蔥爆羊肉':     { calories: 180, protein: 16.0, carbs: 4.5,  fat: 11.0 },
  '薑蔥炒蟹':     { calories: 110, protein: 14.0, carbs: 4.5,  fat: 4.0  },
  '蒜蓉蝦':       { calories: 100, protein: 15.5, carbs: 3.0,  fat: 3.0  },
  '豉汁蒸排骨':   { calories: 165, protein: 12.5, carbs: 5.5,  fat: 10.5 },
  '梅菜扣肉':     { calories: 285, protein: 12.5, carbs: 8.5,  fat: 22.5 },
  '清燉羊肉':     { calories: 115, protein: 13.5, carbs: 1.5,  fat: 6.5  },
  '蔥燒豆腐':     { calories: 80,  protein: 6.5,  carbs: 3.5,  fat: 4.5  },
  '雪菜肉絲':     { calories: 95,  protein: 8.5,  carbs: 3.5,  fat: 5.5  },
  '冬菜蒸肉':     { calories: 220, protein: 13.5, carbs: 3.0,  fat: 17.0 },
  '炒豆芽':       { calories: 40,  protein: 3.0,  carbs: 5.0,  fat: 1.0  },
  '炒韭菜':       { calories: 55,  protein: 2.5,  carbs: 5.5,  fat: 2.5  },
  '炒茄子':       { calories: 65,  protein: 1.5,  carbs: 7.0,  fat: 3.5  },
  '蝦仁炒豆腐':   { calories: 85,  protein: 10.0, carbs: 2.5,  fat: 4.0  },
  '炒玉米':       { calories: 100, protein: 3.0,  carbs: 17.5, fat: 2.5  },
  '椒鹽豆腐':     { calories: 140, protein: 9.5,  carbs: 8.5,  fat: 7.5  },
  '芙蓉蛋':       { calories: 105, protein: 7.5,  carbs: 2.5,  fat: 7.5  },

  // ══ 世界食物 ══
  '烤饢':         { calories: 310, protein: 9.0,  carbs: 52.0, fat: 7.5  },
  '蒜香烤饢':     { calories: 350, protein: 9.5,  carbs: 52.0, fat: 11.5 },
  '印度香飯':     { calories: 195, protein: 8.0,  carbs: 28.0, fat: 6.0  },
  '薩摩薩':       { calories: 265, protein: 5.5,  carbs: 31.0, fat: 13.5 },
  '沙威瑪':       { calories: 225, protein: 14.5, carbs: 18.0, fat: 10.0 },
  '鷹嘴豆泥':     { calories: 166, protein: 7.5,  carbs: 14.5, fat: 9.5  },
  '法拉費':       { calories: 333, protein: 13.5, carbs: 32.0, fat: 17.5 },
  '塔可':         { calories: 195, protein: 8.5,  carbs: 22.0, fat: 8.0  },
  '墨西哥夾餅':   { calories: 195, protein: 8.5,  carbs: 22.0, fat: 8.0  },
  '玉米脆片':     { calories: 487, protein: 7.5,  carbs: 64.0, fat: 24.0 },
  '墨西哥薄脆':   { calories: 487, protein: 7.5,  carbs: 64.0, fat: 24.0 },
  '酪梨醬':       { calories: 150, protein: 2.0,  carbs: 8.5,  fat: 13.5 },
  '冬陰功湯':     { calories: 52,  protein: 4.5,  carbs: 4.0,  fat: 2.0  },
  '泰式酸辣湯':   { calories: 52,  protein: 4.5,  carbs: 4.0,  fat: 2.0  },
  '越式法包':     { calories: 245, protein: 12.5, carbs: 32.0, fat: 8.0  },
  '越南法包':     { calories: 245, protein: 12.5, carbs: 32.0, fat: 8.0  },
  '希臘旋轉肉':   { calories: 220, protein: 16.0, carbs: 15.0, fat: 10.5 },
  '西班牙海鮮燉飯':{ calories: 185, protein: 9.0, carbs: 25.0, fat: 5.5  },
  '德國香腸':     { calories: 315, protein: 13.5, carbs: 3.0,  fat: 28.0 },
  '英式炸魚':     { calories: 220, protein: 14.0, carbs: 16.0, fat: 11.0 },
  '英式早餐':     { calories: 200, protein: 11.0, carbs: 8.0,  fat: 14.0 },
  '肉桂捲':       { calories: 380, protein: 6.0,  carbs: 60.0, fat: 14.0 },
  '法式吐司':     { calories: 240, protein: 7.5,  carbs: 33.0, fat: 9.0  },
  '格子鬆餅':     { calories: 230, protein: 6.5,  carbs: 35.0, fat: 8.0  },
  '班戟':         { calories: 220, protein: 5.5,  carbs: 30.0, fat: 9.0  },
  '歐姆蛋':       { calories: 180, protein: 12.0, carbs: 1.5,  fat: 14.0 },
  '荷蘭鬆餅':     { calories: 210, protein: 7.0,  carbs: 28.0, fat: 8.5  },
  '布朗尼':       { calories: 415, protein: 5.5,  carbs: 55.0, fat: 20.0 },
  '奶酪':         { calories: 115, protein: 3.5,  carbs: 14.5, fat: 5.5  },
  '焦糖布丁':     { calories: 120, protein: 3.5,  carbs: 18.5, fat: 4.0  },
  '義式奶凍':     { calories: 180, protein: 3.5,  carbs: 20.0, fat: 10.0 },
  '西班牙吉拿棒': { calories: 385, protein: 5.0,  carbs: 48.0, fat: 20.0 },
  '葡式蛋塔':     { calories: 265, protein: 5.5,  carbs: 30.0, fat: 14.0 },
  '美式炒蛋':     { calories: 185, protein: 13.5, carbs: 1.5,  fat: 14.0 },
  '水牛城雞翅':   { calories: 290, protein: 23.5, carbs: 6.5,  fat: 19.0 },
  'BBQ雞翅':      { calories: 275, protein: 24.0, carbs: 9.0,  fat: 17.0 },
  '烤肋排':       { calories: 295, protein: 20.0, carbs: 0.0,  fat: 24.0 },
  '炸雞三明治':   { calories: 320, protein: 18.5, carbs: 30.0, fat: 14.0 },
  '雞肉玉米餅':   { calories: 210, protein: 12.5, carbs: 22.0, fat: 8.0  },
  '摩洛哥燉肉':   { calories: 155, protein: 12.0, carbs: 12.0, fat: 6.0  },
  '韓式辣炒魷魚': { calories: 135, protein: 14.5, carbs: 10.0, fat: 4.0  },
  '日式抹茶冰淇淋':{ calories: 195, protein: 4.0, carbs: 26.0, fat: 9.0  },
  '日式麻糬冰':   { calories: 210, protein: 3.5,  carbs: 38.5, fat: 5.5  },
  '黑芝麻湯圓':   { calories: 220, protein: 3.5,  carbs: 36.0, fat: 8.0  },
  '花生湯圓':     { calories: 210, protein: 4.0,  carbs: 33.5, fat: 7.5  },
  '芝麻球':       { calories: 280, protein: 5.5,  carbs: 35.5, fat: 14.0 },
  '開口笑':       { calories: 395, protein: 7.5,  carbs: 48.5, fat: 20.0 },
  '蛋散':         { calories: 450, protein: 6.5,  carbs: 57.0, fat: 22.0 },
  '咖哩餃':       { calories: 245, protein: 6.5,  carbs: 28.0, fat: 12.0 },
  '芝麻糊':       { calories: 285, protein: 7.5,  carbs: 30.0, fat: 16.0 },
  '核桃糊':       { calories: 270, protein: 5.5,  carbs: 32.0, fat: 14.0 },
  '杏仁茶':       { calories: 80,  protein: 2.5,  carbs: 12.5, fat: 3.0  },
};

// ── 食物別名（搜尋關鍵字對應正式名稱）────────────────────────────────────────
const FOOD_ALIASES = {
  // 常見縮寫/俗名
  '珍奶':   '珍珠奶茶', '波霸奶茶': '珍珠奶茶', '波霸': '珍珠奶茶',
  '奶茶':   '珍珠奶茶',
  '可可':   '巧克力牛奶',
  '麥片':   '燕麥片', '燕麥': '燕麥片',
  '優酪乳': '優格', '優形': '優格',
  '沙拉':   '生菜沙拉',
  '雞蛋':   '雞蛋', '蛋': '雞蛋',
  '白蛋':   '水煮蛋', '水煮蛋': '水煮蛋',
  '滷蛋':   '溏心蛋',
  '菜飯':   '炒飯',
  '雞肉飯': '雞腿飯',
  '便當':   '雞腿便當',
  '自助餐': '雞腿飯',
  '滷肉':   '滷肉飯', '焢肉': '控肉飯', '焢肉飯': '控肉飯',
  '地瓜':   '地瓜', '番薯': '地瓜',
  '玉米':   '玉米',
  '南瓜':   '南瓜',
  '火腿':   '火腿片',
  '香腸':   '台式香腸',
  '貢丸':   '關東煮貢丸',
  '魚丸':   '魚丸',
  '魚板':   '關東煮魚板',
  '黑輪':   '關東煮黑輪',
  '蘿蔔':   '關東煮蘿蔔',
  '章魚':   '章魚燒',
  '炸蝦':   '炸蝦',
  '蝦':     '蝦子',
  '螃蟹':   '螃蟹', '蟹': '螃蟹',
  '蛤蜊':   '蛤蜊',
  '牡蠣':   '蚵仔', '蚵':  '蚵仔',
  '燕麥粥': '燕麥片',
  '豆花':   '豆腐花',
  '豆腐花': '嫩豆腐',
  '皮蛋':   '皮蛋',
  '鴨蛋':   '鴨蛋',
  '鮭魚':   '鮭魚', '三文魚': '鮭魚',
  '鮪魚':   '鮪魚', '吞拿魚': '鮪魚',
  '秋刀':   '秋刀魚',
  '虱目魚': '虱目魚',
  '烤魚':   '烤鯖魚',
  '蒸魚':   '清蒸魚',
  '炸魚':   '炸魚薯條',
  '雞胸':   '雞胸肉',
  '雞腿':   '烤雞腿',
  '雞翅':   '雞翅',
  '豬肉':   '豬排',
  '豬肚':   '豬肚',
  '五花肉': '豬五花',
  '牛肉':   '牛肉',
  '羊肉':   '羊肉',
  '滷豆干': '豆干',
  '毛豆':   '毛豆',
  '花椰菜': '白花椰菜',
  '西蘭花': '綠花椰菜', '花椰': '綠花椰菜',
  '玉米筍': '玉米筍',
  '木耳':   '黑木耳',
  '金針菇': '金針菇',
  '杏鮑菇': '杏鮑菇',
  '香菇':   '香菇',
  'KFC':    '炸雞', 'kfc': '炸雞',
  'MOS':    '漢堡', '摩斯': '漢堡',
  '麥當勞': '漢堡', '肯德基': '炸雞',
  '必勝客': '披薩',
  '拿坡里': '紅醬義大利麵',
  '卡邦尼': '白醬義大利麵', '奶油培根': '白醬義大利麵',
  '拿鐵咖啡': '拿鐵',
  '黑咖啡': '美式咖啡', 'americano': '美式咖啡',
  '豆腐湯': '味噌湯',
  '蔥花蛋': '炒蛋',
  '高蛋白': '乳清蛋白',
  '蛋白粉': '乳清蛋白',
  '地瓜葉': '地瓜葉',
  '空心菜': '蒜炒空心菜',
  '苦瓜':   '苦瓜',
  '茄子':   '魚香茄子',
  '番茄蛋': '番茄炒蛋', '蕃茄蛋': '番茄炒蛋',
  '大腸麵線': '大腸麵線',
  '麻辣鍋': '麻辣火鍋',
  '壽喜鍋': '壽喜燒',
  '涮涮鍋': '火鍋',
  '土城魚羹': '土魠魚羹飯',
  // 新增別名
  '鴨羹':     '鴨肉麵羹', '鴨肉羹湯': '鴨肉羹',
  '四神':     '四神湯',   '麻油':     '麻油雞',
  '雲吞湯':   '餛飩湯',   '雲吞':     '餛飩湯',
  '蚵麵線':   '蚵仔麵線', '肉羹湯':   '肉羹',
  '豬血':     '豬血湯',   '冬瓜湯':   '冬瓜排骨湯',
  '藥燉':     '藥膳排骨湯', '肉骨':   '肉骨茶',
  '胡椒':     '胡椒餅',
  '茶裏王':   '茶裏王',   '維大力':   '維大力',
  '傳統飯糰': '台式飯糰', '早餐飯糰': '台式飯糰',
  '油條肉鬆飯糰': '肉鬆油條飯糰',
  // 台灣特色補充
  '糯米油飯': '油飯',     '米糕':     '油飯',
  '大腸包':   '大腸包小腸', '糯米腸':  '大腸包小腸',
  '花枝球':   '花枝丸',   '花枝漿':   '花枝丸',
  '蔥油抓餅': '蔥抓餅',   '手抓餅':   '蔥抓餅',
  '紅龜':     '紅龜粿',   '龜粿':     '紅龜粿',
  '甜粽':     '鹼粽',
  '土地公粽': '菜粽',
  '南部粽':   '粽子(南部)', '北部粽':  '粽子(北部)',
  '豬腳便當': '豬腳飯',
  '蔥白菜':   '白菜滷',   '滷白菜':   '白菜滷',
  '燙菜':     '燙青菜',
  '滑蛋燴飯': '燴飯',     '肉燥燴飯': '燴飯',
  '乾拌麵':   '肉燥拌麵',
  '雞爪':     '鳳爪',
  '鵝':       '鵝肉',
  '甘蔗':     '甘蔗汁',
  '黑木耳':   '黑木耳',   '木耳':     '黑木耳',
  '銀耳':     '白木耳',   '白木耳':   '白木耳',
  '海帶':     '海帶結',   '昆布結':   '海帶結',
  '打拋肉':   '打拋豬肉',
  // 世界食物
  'naan':     '烤饢',    '印度烤餅': '烤饢',
  'biryani':  '印度香飯', '香料飯':  '印度香飯',
  'shawarma': '沙威瑪',  '旋轉烤肉': '沙威瑪',
  'hummus':   '鷹嘴豆泥',
  'falafel':  '法拉費',  '炸豆丸':  '法拉費',
  'taco':     '塔可',    '墨西哥捲': '塔可',
  'nachos':   '玉米脆片',
  'guacamole':'酪梨醬',
  'tom yum':  '冬陰功湯', '冬陰功': '冬陰功湯',
  'banh mi':  '越式法包', '法包':   '越式法包',
  'gyros':    '希臘旋轉肉',
  'paella':   '西班牙海鮮燉飯', '海鮮燉飯': '西班牙海鮮燉飯',
  'bratwurst':'德國香腸',
  'samosa':   '薩摩薩',  '咖哩角':  '薩摩薩',
  '肉桂包':   '肉桂捲',  '法式肉桂': '肉桂捲',
  '法式麵包片':'法式吐司',
  '比利時鬆餅':'格子鬆餅',
  '布朗尼蛋糕':'布朗尼',
  'bbq':      'BBQ雞翅',
  '辣翅':     '水牛城雞翅', '水牛翅': '水牛城雞翅',
  '酸菜魚湯': '酸菜魚',
  '夫妻牛肉': '夫妻肺片',
  '芝麻糊圓': '芝麻球',  '煎堆':    '芝麻球',
};

// ── 常見份量（市面標準份量，不需自己查）──────────────────────────────────────
const FOOD_SERVING = {
  // 米飯
  '白飯':           { amt: 200, label: '1碗' },
  '糙米飯':         { amt: 200, label: '1碗' },
  '五穀飯':         { amt: 200, label: '1碗' },
  '紫米飯':         { amt: 200, label: '1碗' },
  '燕麥飯':         { amt: 200, label: '1碗' },
  '炒飯':           { amt: 250, label: '1碗' },
  '蛋炒飯':         { amt: 250, label: '1碗' },
  '揚州炒飯':       { amt: 250, label: '1碗' },
  '日式炒飯':       { amt: 250, label: '1碗' },
  '泡菜炒飯':       { amt: 250, label: '1碗' },
  '滷肉飯':         { amt: 300, label: '1碗' },
  '控肉飯':         { amt: 300, label: '1碗' },
  '瓜仔肉飯':       { amt: 300, label: '1碗' },
  '雞腿飯':         { amt: 450, label: '1盒' },
  '排骨飯':         { amt: 450, label: '1盒' },
  '雞腿便當':       { amt: 550, label: '1盒' },
  '排骨便當':       { amt: 550, label: '1盒' },
  '控肉便當':       { amt: 550, label: '1盒' },
  '虱目魚便當':     { amt: 500, label: '1盒' },
  '鰻魚飯':         { amt: 350, label: '1碗' },
  '親子丼':         { amt: 350, label: '1碗' },
  '豬排丼':         { amt: 350, label: '1碗' },
  '牛丼':           { amt: 350, label: '1碗' },
  '海鮮丼':         { amt: 350, label: '1碗' },
  '鮭魚丼':         { amt: 350, label: '1碗' },
  '鮪魚丼':         { amt: 350, label: '1碗' },
  '石鍋拌飯':       { amt: 350, label: '1碗' },
  '煲仔飯':         { amt: 350, label: '1碗' },
  '飯糰':           { amt: 110, label: '1個' },
  '御飯糰':         { amt: 110, label: '1個' },
  '鮭魚御飯糰':     { amt: 110, label: '1個' },
  '梅子御飯糰':     { amt: 110, label: '1個' },
  // 粥
  '白粥':           { amt: 250, label: '1碗' },
  '皮蛋瘦肉粥':     { amt: 300, label: '1碗' },
  '虱目魚粥':       { amt: 300, label: '1碗' },
  '地瓜粥':         { amt: 250, label: '1碗' },
  '廣東粥':         { amt: 300, label: '1碗' },
  '鹹粥':           { amt: 300, label: '1碗' },
  // 麵條
  '泡麵':           { amt: 85,  label: '1包' },
  '白麵條':         { amt: 200, label: '1碗' },
  '烏龍麵':         { amt: 200, label: '1碗' },
  '炒烏龍':         { amt: 300, label: '1盤' },
  '海鮮烏龍':       { amt: 300, label: '1碗' },
  '牛肉麵':         { amt: 400, label: '1碗' },
  '麻辣麵':         { amt: 350, label: '1碗' },
  '豚骨拉麵':       { amt: 350, label: '1碗' },
  '味噌拉麵':       { amt: 350, label: '1碗' },
  '醬油拉麵':       { amt: 350, label: '1碗' },
  '鹽味拉麵':       { amt: 350, label: '1碗' },
  '蚵仔麵線':       { amt: 300, label: '1碗' },
  '大腸麵線':       { amt: 300, label: '1碗' },
  '義大利麵':       { amt: 200, label: '1人份' },
  '白醬義大利麵':   { amt: 200, label: '1人份' },
  '紅醬義大利麵':   { amt: 200, label: '1人份' },
  '青醬義大利麵':   { amt: 200, label: '1人份' },
  '焗烤義大利麵':   { amt: 250, label: '1人份' },
  '焗烤飯':         { amt: 250, label: '1人份' },
  '乾麵':           { amt: 200, label: '1碗' },
  '油麵':           { amt: 200, label: '1碗' },
  '冬粉':           { amt: 150, label: '1碗' },
  '河粉':           { amt: 200, label: '1碗' },
  '越南河粉':       { amt: 350, label: '1碗' },
  '粄條':           { amt: 200, label: '1碗' },
  '意麵':           { amt: 200, label: '1碗' },
  '擔仔麵':         { amt: 200, label: '1碗' },
  '韓式冷麵':       { amt: 300, label: '1碗' },
  // 蛋
  '雞蛋':           { amt: 60,  label: '1顆' },
  '水煮蛋':         { amt: 60,  label: '1顆' },
  '溏心蛋':         { amt: 60,  label: '1顆' },
  '荷包蛋':         { amt: 70,  label: '1顆' },
  '煎蛋':           { amt: 70,  label: '1顆' },
  '炒蛋':           { amt: 120, label: '2顆份' },
  '皮蛋':           { amt: 65,  label: '1顆' },
  '鵪鶉蛋':         { amt: 12,  label: '1顆' },
  '茶葉蛋':         { amt: 65,  label: '1顆' },
  '關東煮蛋':       { amt: 65,  label: '1顆' },
  '蒸蛋':           { amt: 150, label: '1碗' },
  '茶碗蒸':         { amt: 150, label: '1碗' },
  '番茄炒蛋':       { amt: 200, label: '1盤' },
  '韭黃炒蛋':       { amt: 150, label: '1盤' },
  // 雞肉
  '雞胸肉':         { amt: 150, label: '1塊' },
  '雞腿肉':         { amt: 200, label: '1隻' },
  '烤雞腿':         { amt: 200, label: '1隻' },
  '炸雞腿':         { amt: 200, label: '1隻' },
  '滷雞腿':         { amt: 200, label: '1隻' },
  '雞翅':           { amt: 60,  label: '1隻' },
  '雞爪':           { amt: 30,  label: '1隻' },
  '雞排':           { amt: 180, label: '1塊' },
  '炸雞排':         { amt: 180, label: '1塊' },
  '唐揚雞':         { amt: 150, label: '1人份' },
  '韓式炸雞':       { amt: 200, label: '1人份' },
  '炸雞':           { amt: 130, label: '1塊' },
  '辣炒雞':         { amt: 200, label: '1人份' },
  // 豬肉
  '豬排':           { amt: 120, label: '1片' },
  '炸豬排':         { amt: 120, label: '1片' },
  '日式炸豬排':     { amt: 120, label: '1片' },
  '培根':           { amt: 30,  label: '2片' },
  '豬五花':         { amt: 100, label: '約3片' },
  '韓式豬五花':     { amt: 150, label: '1人份' },
  '松阪豬':         { amt: 150, label: '1人份' },
  '滷豬腳':         { amt: 150, label: '1份' },
  '叉燒':           { amt: 100, label: '約4片' },
  '燒鴨':           { amt: 150, label: '1份' },
  '脆皮燒肉':       { amt: 100, label: '1份' },
  '紅燒肉':         { amt: 150, label: '1份' },
  '東坡肉':         { amt: 150, label: '1份' },
  '回鍋肉':         { amt: 150, label: '1盤' },
  '糖醋排骨':       { amt: 150, label: '1人份' },
  // 牛肉
  '牛排':           { amt: 200, label: '1份' },
  '牛肉':           { amt: 100, label: '1份' },
  '韓式烤肉':       { amt: 150, label: '1人份' },
  // 海鮮
  '鮭魚':           { amt: 120, label: '1片' },
  '鯖魚':           { amt: 120, label: '1片' },
  '秋刀魚':         { amt: 100, label: '1條' },
  '虱目魚':         { amt: 120, label: '1片' },
  '鱈魚':           { amt: 120, label: '1片' },
  '鮪魚罐頭':       { amt: 75,  label: '半罐' },
  '鮪魚':           { amt: 100, label: '1份' },
  '蝦子':           { amt: 100, label: '約10隻' },
  '草蝦':           { amt: 120, label: '約8隻' },
  '透抽':           { amt: 100, label: '1隻' },
  '花枝':           { amt: 100, label: '1份' },
  '蛤蜊':           { amt: 100, label: '約10個' },
  '甜不辣':         { amt: 100, label: '3-4片' },
  '蚵仔煎':         { amt: 200, label: '1份' },
  '土魠魚羹飯':     { amt: 350, label: '1碗' },
  '土魠魚羹':       { amt: 250, label: '1碗' },
  '土托魚羹飯':     { amt: 350, label: '1碗' },
  '土托魚羹':       { amt: 250, label: '1碗' },
  '魚羹飯':         { amt: 350, label: '1碗' },
  '魚羹':           { amt: 250, label: '1碗' },
  '魚羹湯':         { amt: 250, label: '1碗' },
  '清蒸魚':         { amt: 200, label: '1份' },
  '糖醋魚':         { amt: 200, label: '1份' },
  '清炒蝦仁':       { amt: 150, label: '1盤' },
  // 豆製品
  '豆腐':           { amt: 100, label: '1小塊' },
  '板豆腐':         { amt: 150, label: '半塊' },
  '嫩豆腐':         { amt: 100, label: '半盒' },
  '豆干':           { amt: 40,  label: '1片' },
  '毛豆':           { amt: 80,  label: '半碗' },
  '麻婆豆腐':       { amt: 200, label: '1盤' },
  '紅燒豆腐':       { amt: 150, label: '1盤' },
  // 蔬菜
  '炒青菜':         { amt: 150, label: '1盤' },
  '炒高麗菜':       { amt: 150, label: '1盤' },
  '蒜炒空心菜':     { amt: 150, label: '1盤' },
  '乾煸四季豆':     { amt: 150, label: '1盤' },
  '地三鮮':         { amt: 200, label: '1盤' },
  '宮保雞丁':       { amt: 200, label: '1盤' },
  '魚香茄子':       { amt: 200, label: '1盤' },
  // 水果
  '蘋果':           { amt: 200, label: '1顆' },
  '香蕉':           { amt: 120, label: '1根' },
  '柳橙':           { amt: 180, label: '1顆' },
  '橘子':           { amt: 150, label: '1顆' },
  '葡萄':           { amt: 150, label: '1串(小)' },
  '草莓':           { amt: 150, label: '約10顆' },
  '芒果':           { amt: 200, label: '半顆' },
  '西瓜':           { amt: 300, label: '1片' },
  '鳳梨':           { amt: 200, label: '2片' },
  '番茄':           { amt: 150, label: '1顆' },
  '小番茄':         { amt: 100, label: '約10顆' },
  '奇異果':         { amt: 80,  label: '1顆' },
  '藍莓':           { amt: 100, label: '1杯' },
  '火龍果':         { amt: 200, label: '半顆' },
  '荔枝':           { amt: 100, label: '約8顆' },
  '龍眼':           { amt: 100, label: '約15顆' },
  '芭樂':           { amt: 200, label: '半顆' },
  '木瓜':           { amt: 200, label: '1片' },
  '蓮霧':           { amt: 100, label: '1顆' },
  '水蜜桃':         { amt: 180, label: '1顆' },
  '梨子':           { amt: 200, label: '1顆' },
  '葡萄柚':         { amt: 200, label: '半顆' },
  '哈密瓜':         { amt: 200, label: '1片' },
  '百香果':         { amt: 60,  label: '1顆' },
  // 乳製品
  '牛奶':           { amt: 240, label: '1杯' },
  '全脂牛奶':       { amt: 240, label: '1杯' },
  '低脂牛奶':       { amt: 240, label: '1杯' },
  '豆漿':           { amt: 250, label: '1杯' },
  '無糖豆漿':       { amt: 250, label: '1杯' },
  '優格':           { amt: 150, label: '1杯' },
  '起司片':         { amt: 20,  label: '1片' },
  '奶油':           { amt: 10,  label: '1茶匙' },
  // 麵包
  '吐司':           { amt: 30,  label: '1片' },
  '全麥吐司':       { amt: 30,  label: '1片' },
  '白吐司':         { amt: 30,  label: '1片' },
  '法國麵包':       { amt: 50,  label: '1段' },
  '貝果':           { amt: 100, label: '1個' },
  '可頌':           { amt: 60,  label: '1個' },
  '菠蘿包':         { amt: 80,  label: '1個' },
  '肉鬆麵包':       { amt: 80,  label: '1個' },
  '燒餅':           { amt: 80,  label: '1個' },
  '油條':           { amt: 50,  label: '1根' },
  '燒餅油條':       { amt: 130, label: '1套' },
  // 飲料
  '可樂':           { amt: 330, label: '1罐' },
  '零卡可樂':       { amt: 330, label: '1罐' },
  '0卡可樂':        { amt: 330, label: '1罐' },
  'Coke Zero':      { amt: 330, label: '1罐' },
  '雪碧':           { amt: 330, label: '1罐' },
  '沙士':           { amt: 330, label: '1罐' },
  '黑松沙士':       { amt: 330, label: '1罐' },
  '蘋果西打':       { amt: 330, label: '1罐' },
  '芬達':           { amt: 330, label: '1罐' },
  '珍珠奶茶':       { amt: 500, label: '1杯(大)' },
  '鮮奶茶':         { amt: 500, label: '1杯' },
  '黑咖啡':         { amt: 240, label: '1杯' },
  '美式咖啡':       { amt: 240, label: '1杯' },
  '拿鐵':           { amt: 360, label: '1杯(大)' },
  '卡布奇諾':       { amt: 240, label: '1杯' },
  '摩卡':           { amt: 360, label: '1杯' },
  '港式奶茶':       { amt: 350, label: '1杯' },
  '罐裝咖啡':       { amt: 240, label: '1罐' },
  '柳橙汁':         { amt: 250, label: '1杯' },
  '蘋果汁':         { amt: 250, label: '1杯' },
  '番石榴汁':       { amt: 250, label: '1杯' },
  '木瓜牛奶':       { amt: 500, label: '1杯' },
  '草莓牛奶':       { amt: 240, label: '1杯' },
  '巧克力牛奶':     { amt: 240, label: '1杯' },
  '燒仙草':         { amt: 500, label: '1杯' },
  '愛玉':           { amt: 150, label: '1碗' },
  '多多':           { amt: 100, label: '1瓶' },
  '養樂多':         { amt: 100, label: '1瓶' },
  '啤酒':           { amt: 330, label: '1罐' },
  '紅酒':           { amt: 150, label: '1杯' },
  '檸檬水':         { amt: 300, label: '1杯' },
  // 速食
  '漢堡':           { amt: 180, label: '1個' },
  '雙層漢堡':       { amt: 250, label: '1個' },
  '起司漢堡':       { amt: 200, label: '1個' },
  '雞腿堡':         { amt: 220, label: '1個' },
  '薯條':           { amt: 115, label: '1份(中)' },
  '熱狗':           { amt: 120, label: '1條' },
  '披薩':           { amt: 100, label: '1片' },
  '起司披薩':       { amt: 100, label: '1片' },
  '三明治':         { amt: 120, label: '1個' },
  '鮪魚三明治':     { amt: 130, label: '1個' },
  '起司蛋三明治':   { amt: 130, label: '1個' },
  // 日式小吃
  '天婦羅':         { amt: 150, label: '1人份' },
  '章魚燒':         { amt: 150, label: '1份(6顆)' },
  '大阪燒':         { amt: 200, label: '1份' },
  '串燒雞腿':       { amt: 50,  label: '1串' },
  '串燒雞翅':       { amt: 60,  label: '1串' },
  '串燒豬五花':     { amt: 40,  label: '1串' },
  '味噌湯':         { amt: 200, label: '1碗' },
  // 港式點心
  '蝦餃':           { amt: 120, label: '4顆' },
  '燒賣':           { amt: 100, label: '4顆' },
  '叉燒包':         { amt: 80,  label: '1個' },
  '腸粉':           { amt: 150, label: '1份' },
  '蘿蔔糕':         { amt: 80,  label: '1塊' },
  // 台灣小吃
  '刈包':           { amt: 150, label: '1個' },
  '割包':           { amt: 150, label: '1個' },
  '小籠包':         { amt: 120, label: '5顆' },
  '湯包':           { amt: 120, label: '5顆' },
  '水餃':           { amt: 150, label: '6-8顆' },
  '煎餃':           { amt: 150, label: '6顆' },
  '鍋貼':           { amt: 150, label: '6顆' },
  '韭菜盒子':       { amt: 90,  label: '1個' },
  '台式香腸':       { amt: 60,  label: '1條' },
  '糯米腸':         { amt: 80,  label: '1條' },
  '豬血糕':         { amt: 100, label: '1串' },
  '米血':           { amt: 100, label: '1串' },
  '碗粿':           { amt: 150, label: '1碗' },
  '筒仔米糕':       { amt: 120, label: '1個' },
  '潤餅':           { amt: 180, label: '1捲' },
  '蚵嗲':           { amt: 80,  label: '1個' },
  '棺材板':         { amt: 120, label: '1個' },
  '炒年糕':         { amt: 250, label: '1人份' },
  // 關東煮
  '關東煮蘿蔔':     { amt: 80,  label: '1塊' },
  '關東煮蛋':       { amt: 65,  label: '1顆' },
  '關東煮豆腐':     { amt: 100, label: '1塊' },
  '關東煮貢丸':     { amt: 40,  label: '2顆' },
  '關東煮魚板':     { amt: 40,  label: '1片' },
  '關東煮黑輪':     { amt: 50,  label: '1條' },
  '關東煮昆布':     { amt: 30,  label: '1段' },
  // 甜點
  '蛋糕':           { amt: 80,  label: '1片' },
  '起司蛋糕':       { amt: 80,  label: '1片' },
  '巧克力蛋糕':     { amt: 80,  label: '1片' },
  '生乳捲':         { amt: 80,  label: '1片' },
  '布丁':           { amt: 100, label: '1個' },
  '果凍':           { amt: 100, label: '1個' },
  '冰淇淋':         { amt: 90,  label: '1球' },
  '麻糬':           { amt: 50,  label: '1顆' },
  '大福':           { amt: 50,  label: '1顆' },
  '草莓大福':       { amt: 50,  label: '1顆' },
  '銅鑼燒':         { amt: 60,  label: '1個' },
  '蛋塔':           { amt: 75,  label: '1個' },
  '奶油泡芙':       { amt: 80,  label: '1個' },
  '蛋黃酥':         { amt: 55,  label: '1顆' },
  '鳳梨酥':         { amt: 35,  label: '1個' },
  '太陽餅':         { amt: 40,  label: '1個' },
  '牛軋糖':         { amt: 15,  label: '1顆' },
  '芋圓':           { amt: 100, label: '1份' },
  '仙草凍':         { amt: 150, label: '1碗' },
  '燒仙草':         { amt: 500, label: '1杯' },
  '雪花冰':         { amt: 250, label: '1碗' },
  '芒果冰':         { amt: 250, label: '1碗' },
  '草莓冰':         { amt: 250, label: '1碗' },
  // 零食
  '洋芋片':         { amt: 30,  label: '小包' },
  '餅乾':           { amt: 30,  label: '5-6片' },
  '巧克力':         { amt: 30,  label: '3格' },
  '爆米花':         { amt: 50,  label: '1份' },
  // 堅果
  '杏仁':           { amt: 28,  label: '約20顆' },
  '核桃':           { amt: 28,  label: '約7顆' },
  '腰果':           { amt: 28,  label: '約15顆' },
  '花生':           { amt: 28,  label: '約35顆' },
  '開心果':         { amt: 28,  label: '約49顆' },
  // 健身
  '乳清蛋白':       { amt: 30,  label: '1匙' },
  '蛋白棒':         { amt: 55,  label: '1條' },
  '能量棒':         { amt: 50,  label: '1條' },

  // ── 主食・飯類 ──
  '稀飯':           { amt: 250, label: '1碗' },
  '雞肉炒飯':       { amt: 300, label: '1碗' },
  '便當':           { amt: 500, label: '1份' },
  '鮭魚飯':         { amt: 300, label: '1碗' },
  '丼飯':           { amt: 400, label: '1碗' },
  '牛肉丼':         { amt: 400, label: '1碗' },
  '親子丼':         { amt: 400, label: '1碗' },
  '豬排丼':         { amt: 420, label: '1碗' },
  '鰻魚飯':         { amt: 350, label: '1碗' },
  '海南雞飯':       { amt: 380, label: '1份' },
  '炒飯':           { amt: 300, label: '1碗' },
  '蛋炒飯':         { amt: 300, label: '1碗' },
  '福建炒飯':       { amt: 350, label: '1碗' },
  '菜飯':           { amt: 250, label: '1碗' },
  '紅豆飯':         { amt: 200, label: '1碗' },
  '紫米飯':         { amt: 200, label: '1碗' },
  '糙米飯':         { amt: 200, label: '1碗' },
  '五穀飯':         { amt: 200, label: '1碗' },
  '壽司':           { amt: 30,  label: '1貫' },
  '手捲':           { amt: 120, label: '1捲' },
  '散壽司':         { amt: 300, label: '1盒' },
  '飯糰':           { amt: 110, label: '1個' },
  '御飯糰':         { amt: 110, label: '1個' },

  // ── 麵類 ──
  '麵條':           { amt: 200, label: '1碗' },
  '陽春麵':         { amt: 250, label: '1碗' },
  '拉麵':           { amt: 450, label: '1碗' },
  '刀削麵':         { amt: 300, label: '1碗' },
  '麵線':           { amt: 200, label: '1碗' },
  '米粉':           { amt: 200, label: '1碗' },
  '肉絲麵':         { amt: 350, label: '1碗' },
  '排骨麵':         { amt: 450, label: '1碗' },
  '雞絲麵':         { amt: 350, label: '1碗' },
  '炒米粉':         { amt: 250, label: '1份' },
  '炒麵':           { amt: 300, label: '1份' },
  '意麵':           { amt: 300, label: '1碗' },
  '烏龍麵':         { amt: 300, label: '1碗' },
  '蕎麥麵':         { amt: 250, label: '1份' },
  '義大利麵':       { amt: 300, label: '1份' },
  '冬粉':           { amt: 200, label: '1碗' },
  '寬粉':           { amt: 200, label: '1碗' },
  '河粉':           { amt: 200, label: '1碗' },
  '泡麵':           { amt: 85,  label: '1包' },
  '速食麵':         { amt: 85,  label: '1包' },
  '雞湯麵':         { amt: 85,  label: '1包' },
  '醬油拉麵':       { amt: 450, label: '1碗' },
  '味噌拉麵':       { amt: 500, label: '1碗' },
  '豚骨拉麵':       { amt: 500, label: '1碗' },
  '擔擔麵':         { amt: 400, label: '1碗' },
  '蚵仔麵線':       { amt: 300, label: '1碗' },
  '台式牛肉麵':     { amt: 500, label: '1碗' },
  '韓式冷麵':       { amt: 350, label: '1份' },

  // ── 麵包・早餐 ──
  '饅頭':           { amt: 75,  label: '1個' },
  '花捲':           { amt: 75,  label: '1個' },
  '包子':           { amt: 80,  label: '1個' },
  '菜包':           { amt: 80,  label: '1個' },
  '蛋餅':           { amt: 170, label: '1份' },
  '蔥蛋餅':         { amt: 180, label: '1份' },
  '起司蛋餅':       { amt: 195, label: '1份' },
  '蛋餅加蛋':       { amt: 220, label: '1份' },
  '潛艇堡':         { amt: 230, label: '1個' },
  '菠蘿麵包':       { amt: 80,  label: '1個' },
  '紅豆麵包':       { amt: 80,  label: '1個' },
  '奶油麵包':       { amt: 75,  label: '1個' },
  '墨西哥捲餅':     { amt: 200, label: '1捲' },
  '可頌':           { amt: 55,  label: '1個' },
  '法國麵包':       { amt: 60,  label: '2片' },
  '雜糧麵包':       { amt: 35,  label: '1片' },
  '全麥麵包':       { amt: 35,  label: '1片' },
  '貝果':           { amt: 105, label: '1個' },
  '英式馬芬':       { amt: 57,  label: '1個' },
  '披薩':           { amt: 110, label: '1片' },
  '厚片土司':       { amt: 80,  label: '1片' },
  '漢堡':           { amt: 200, label: '1個' },
  '大麥克':         { amt: 200, label: '1個' },
  '雙層牛肉堡':     { amt: 200, label: '1個' },
  '雞腿堡':         { amt: 200, label: '1個' },
  '熱狗堡':         { amt: 150, label: '1個' },

  // ── 蛋類 ──
  '滷蛋':           { amt: 60,  label: '1顆' },
  '鹹蛋':           { amt: 60,  label: '1顆' },
  '蛋花湯':         { amt: 250, label: '1碗' },
  '歐姆蛋':         { amt: 150, label: '1份' },
  '班尼迪克蛋':     { amt: 200, label: '1份' },
  '茶葉蛋':         { amt: 55,  label: '1顆' },
  '鐵板蛋':         { amt: 55,  label: '1顆' },
  '荷包蛋':         { amt: 55,  label: '1顆' },

  // ── 雞肉 ──
  '炸雞塊':         { amt: 150, label: '6塊' },
  '烤雞':           { amt: 200, label: '1份' },
  '鹽酥雞':         { amt: 150, label: '1份' },
  '香雞排':         { amt: 180, label: '1片' },
  '鹽水雞':         { amt: 150, label: '1份' },
  '白斬雞':         { amt: 150, label: '1份' },
  '三杯雞':         { amt: 200, label: '1份' },
  '雞丁':           { amt: 150, label: '1份' },
  '棒棒腿':         { amt: 100, label: '1支' },
  '雞翅':           { amt: 70,  label: '1支' },
  '雞胸肉':         { amt: 120, label: '1塊' },
  '雞腿肉':         { amt: 150, label: '1隻' },
  '滷雞翅':         { amt: 70,  label: '1支' },
  '雞心':           { amt: 80,  label: '1份' },
  '雞胗':           { amt: 80,  label: '1份' },
  '雞肝':           { amt: 80,  label: '1份' },
  '雞皮':           { amt: 50,  label: '1份' },

  // ── 豬肉 ──
  '豬里肌':         { amt: 120, label: '1片' },
  '排骨':           { amt: 150, label: '1份' },
  '滷肉':           { amt: 150, label: '1份' },
  '控肉':           { amt: 200, label: '1份' },
  '豬腳':           { amt: 200, label: '1份' },
  '香腸':           { amt: 50,  label: '1條' },
  '臘腸':           { amt: 50,  label: '1條' },
  '火腿':           { amt: 30,  label: '1片' },
  '豬肝':           { amt: 100, label: '1份' },
  '豬心':           { amt: 100, label: '1份' },
  '豬大腸':         { amt: 100, label: '1份' },
  '肉鬆':           { amt: 15,  label: '1匙' },
  '肉燥':           { amt: 50,  label: '1份' },
  '漢堡排':         { amt: 100, label: '1片' },
  '豬頸肉':         { amt: 120, label: '1份' },
  '豬五花':         { amt: 120, label: '1份' },
  '豬小排':         { amt: 150, label: '1份' },
  '豬耳朵':         { amt: 80,  label: '1份' },
  '豬舌':           { amt: 80,  label: '1份' },
  '豬血':           { amt: 100, label: '1塊' },
  '豬絞肉':         { amt: 100, label: '1份' },
  '叉燒肉':         { amt: 80,  label: '3片' },

  // ── 牛肉 ──
  '牛腱':           { amt: 120, label: '1份' },
  '牛肚':           { amt: 100, label: '1份' },
  '牛舌':           { amt: 100, label: '1份' },
  '霜降牛肉':       { amt: 120, label: '1份' },
  '沙朗牛排':       { amt: 250, label: '1份' },
  '牛絞肉':         { amt: 100, label: '1份' },
  '紅燒牛肉':       { amt: 200, label: '1份' },
  '菲力牛排':       { amt: 200, label: '1份' },
  '肋眼牛排':       { amt: 250, label: '1份' },
  '牛小排':         { amt: 200, label: '1份' },
  '牛肋條':         { amt: 150, label: '1份' },
  '牛腩':           { amt: 150, label: '1份' },
  '牛肝':           { amt: 100, label: '1份' },

  // ── 海鮮 ──
  '吳郭魚':         { amt: 200, label: '1條' },
  '鱸魚':           { amt: 200, label: '1條' },
  '比目魚':         { amt: 150, label: '1片' },
  '土魠魚':         { amt: 150, label: '1片' },
  '龍蝦':           { amt: 300, label: '1隻' },
  '螃蟹':           { amt: 200, label: '1隻' },
  '章魚':           { amt: 100, label: '1份' },
  '牡蠣':           { amt: 80,  label: '6顆' },
  '蚵仔':           { amt: 80,  label: '6顆' },
  '干貝':           { amt: 40,  label: '3顆' },
  '魚板':           { amt: 40,  label: '2片' },
  '竹輪':           { amt: 40,  label: '1條' },
  '炸竹輪':         { amt: 50,  label: '1條' },
  '銀魚':           { amt: 80,  label: '1份' },
  '炸銀魚':         { amt: 80,  label: '1份' },
  '小銀魚':         { amt: 30,  label: '1匙' },
  '魚丸':           { amt: 100, label: '5顆' },
  '蟹肉棒':         { amt: 25,  label: '1條' },
  '蝦仁':           { amt: 100, label: '1份' },
  '草蝦':           { amt: 100, label: '5隻' },
  '烏賊':           { amt: 100, label: '1份' },
  '花枝':           { amt: 100, label: '1份' },
  '透抽':           { amt: 100, label: '1份' },
  '魚卵':           { amt: 30,  label: '1份' },
  '鮭魚卵':         { amt: 30,  label: '1匙' },
  '生蠔':           { amt: 80,  label: '4顆' },
  '文蛤':           { amt: 100, label: '1份' },
  '蛤蜊':           { amt: 100, label: '1份' },
  '小卷':           { amt: 100, label: '1份' },
  '鰻魚':           { amt: 100, label: '1份' },
  '秋刀魚':         { amt: 120, label: '1條' },
  '鯖魚':           { amt: 120, label: '1條' },
  '虱目魚':         { amt: 150, label: '1片' },
  '旗魚':           { amt: 120, label: '1片' },
  '油魚':           { amt: 120, label: '1片' },

  // ── 豆類・豆製品 ──
  '百頁豆腐':       { amt: 100, label: '1塊' },
  '豆皮':           { amt: 40,  label: '1片' },
  '豆腐乳':         { amt: 20,  label: '1塊' },
  '黃豆':           { amt: 30,  label: '2匙' },
  '黑豆':           { amt: 30,  label: '2匙' },
  '紅豆':           { amt: 30,  label: '2匙' },
  '納豆':           { amt: 50,  label: '1盒' },
  '臭豆腐':         { amt: 150, label: '1塊' },
  '豆漿':           { amt: 240, label: '1杯' },
  '豆腐':           { amt: 100, label: '半盒' },
  '嫩豆腐':         { amt: 100, label: '半盒' },
  '雞蛋豆腐':       { amt: 80,  label: '1塊' },
  '凍豆腐':         { amt: 100, label: '1塊' },
  '黑豆漿':         { amt: 240, label: '1杯' },

  // ── 蔬菜 ──
  '花椰菜':         { amt: 100, label: '1份' },
  '青花菜':         { amt: 100, label: '1份' },
  '高麗菜':         { amt: 100, label: '1份' },
  '白菜':           { amt: 100, label: '1份' },
  '大白菜':         { amt: 120, label: '1份' },
  '小白菜':         { amt: 100, label: '1份' },
  '菠菜':           { amt: 100, label: '1份' },
  '莧菜':           { amt: 100, label: '1份' },
  '空心菜':         { amt: 100, label: '1份' },
  '地瓜葉':         { amt: 100, label: '1份' },
  '茼蒿':           { amt: 100, label: '1份' },
  '韭黃':           { amt: 80,  label: '1份' },
  '韭菜':           { amt: 80,  label: '1份' },
  '洋蔥':           { amt: 100, label: '半顆' },
  '青蔥':           { amt: 20,  label: '1根' },
  '大蒜':           { amt: 10,  label: '2瓣' },
  '薑':             { amt: 10,  label: '3片' },
  '胡蘿蔔':         { amt: 80,  label: '半根' },
  '白蘿蔔':         { amt: 100, label: '1塊' },
  '蓮藕':           { amt: 100, label: '2片' },
  '牛蒡':           { amt: 80,  label: '1份' },
  '芹菜':           { amt: 80,  label: '1份' },
  '青椒':           { amt: 80,  label: '半顆' },
  '甜椒':           { amt: 80,  label: '半顆' },
  '辣椒':           { amt: 10,  label: '1條' },
  '茄子':           { amt: 100, label: '1份' },
  '番茄':           { amt: 120, label: '1顆' },
  '小番茄':         { amt: 100, label: '10顆' },
  '秋葵':           { amt: 80,  label: '5根' },
  '玉米':           { amt: 170, label: '1根' },
  '玉米筍':         { amt: 80,  label: '5根' },
  '竹筍':           { amt: 100, label: '1份' },
  '綠竹筍':         { amt: 100, label: '1份' },
  '桂竹筍':         { amt: 100, label: '1份' },
  '山藥':           { amt: 100, label: '1份' },
  '芋頭':           { amt: 100, label: '1份' },
  '地瓜':           { amt: 130, label: '1條' },
  '馬鈴薯':         { amt: 130, label: '1顆' },
  '南瓜':           { amt: 100, label: '1份' },
  '苦瓜':           { amt: 100, label: '1份' },
  '冬瓜':           { amt: 100, label: '1份' },
  '絲瓜':           { amt: 100, label: '1份' },
  '黃瓜':           { amt: 100, label: '半條' },
  '小黃瓜':         { amt: 100, label: '1條' },
  '蘆筍':           { amt: 80,  label: '5根' },
  '香菇':           { amt: 30,  label: '3朵' },
  '金針菇':         { amt: 80,  label: '1份' },
  '杏鮑菇':         { amt: 80,  label: '1根' },
  '鴻喜菇':         { amt: 80,  label: '1份' },
  '舞菇':           { amt: 80,  label: '1份' },
  '木耳':           { amt: 80,  label: '1份' },
  '海帶':           { amt: 80,  label: '1份' },
  '海帶芽':         { amt: 30,  label: '1份(泡發後)' },
  '豆芽菜':         { amt: 80,  label: '1份' },
  '綠豆芽':         { amt: 80,  label: '1份' },
  '黃豆芽':         { amt: 80,  label: '1份' },
  '萵苣':           { amt: 80,  label: '1份' },
  '蘿蔓':           { amt: 80,  label: '1份' },
  '皇帝豆':         { amt: 80,  label: '1份' },
  '毛豆':           { amt: 50,  label: '約30顆' },
  '四季豆':         { amt: 80,  label: '1份' },
  '豌豆':           { amt: 80,  label: '1份' },
  '荷蘭豆':         { amt: 80,  label: '1份' },
  '甜豆':           { amt: 80,  label: '1份' },
  '蓮子':           { amt: 30,  label: '1份' },
  '薏仁':           { amt: 30,  label: '2匙' },
  '紅薏仁':         { amt: 30,  label: '2匙' },

  // ── 水果 ──
  '水梨':           { amt: 200, label: '1顆' },
  '葡萄':           { amt: 100, label: '10顆' },
  '藍莓':           { amt: 80,  label: '1份' },
  '草莓':           { amt: 100, label: '6顆' },
  '覆盆子':         { amt: 80,  label: '1份' },
  '荔枝':           { amt: 100, label: '6顆' },
  '龍眼':           { amt: 100, label: '10顆' },
  '榴槤':           { amt: 150, label: '1份' },
  '百香果':         { amt: 80,  label: '1顆' },
  '楊桃':           { amt: 150, label: '1顆' },
  '蓮霧':           { amt: 80,  label: '1顆' },
  '柿子':           { amt: 130, label: '1顆' },
  '棗子':           { amt: 60,  label: '3顆' },
  '火龍果':         { amt: 200, label: '半顆' },
  '諾麗果':         { amt: 100, label: '1份' },
  '椰子':           { amt: 240, label: '1杯椰子水' },
  '酪梨':           { amt: 150, label: '半顆' },
  '番石榴':         { amt: 150, label: '半顆' },
  '木瓜':           { amt: 200, label: '1份' },
  '鳳梨':           { amt: 150, label: '1份' },
  '哈密瓜':         { amt: 200, label: '1份' },
  '西瓜':           { amt: 250, label: '1份' },
  '葡萄乾':         { amt: 30,  label: '1匙' },
  '蔓越莓乾':       { amt: 30,  label: '1匙' },
  '無花果乾':       { amt: 40,  label: '4顆' },
  '黑棗乾':         { amt: 30,  label: '3顆' },
  '杏桃乾':         { amt: 30,  label: '3片' },
  '芒果乾':         { amt: 30,  label: '1份' },

  // ── 乳製品 ──
  '保久乳':         { amt: 200, label: '1瓶' },
  '低脂牛奶':       { amt: 240, label: '1杯' },
  '全脂牛奶':       { amt: 240, label: '1杯' },
  '脫脂牛奶':       { amt: 240, label: '1杯' },
  '優酪乳':         { amt: 200, label: '1瓶' },
  '希臘優格':       { amt: 150, label: '1盒' },
  '起司片':         { amt: 20,  label: '1片' },
  '莫札瑞拉起司':   { amt: 30,  label: '1份' },
  '帕瑪森起司':     { amt: 15,  label: '1匙' },
  '奶油起司':       { amt: 30,  label: '1份' },
  '鮮奶油':         { amt: 30,  label: '1匙' },
  '冰淇淋':         { amt: 100, label: '1球' },
  '冰棒':           { amt: 60,  label: '1支' },
  '奶昔':           { amt: 300, label: '1杯' },
  '煉乳':           { amt: 20,  label: '1匙' },

  // ── 堅果・油脂 ──
  '南瓜子':         { amt: 28,  label: '約30顆' },
  '葵瓜子':         { amt: 28,  label: '1份' },
  '芝麻':           { amt: 15,  label: '1匙' },
  '亞麻子':         { amt: 15,  label: '1匙' },
  '奇亞籽':         { amt: 15,  label: '1匙' },
  '松子':           { amt: 28,  label: '1份' },
  '夏威夷豆':       { amt: 28,  label: '約10顆' },
  '榛果':           { amt: 28,  label: '約10顆' },
  '橄欖油':         { amt: 14,  label: '1匙' },
  '奶油':           { amt: 14,  label: '1匙' },
  '豬油':           { amt: 14,  label: '1匙' },
  '芝麻油':         { amt: 14,  label: '1匙' },
  '花生油':         { amt: 14,  label: '1匙' },
  '椰子油':         { amt: 14,  label: '1匙' },
  '亞麻籽油':       { amt: 14,  label: '1匙' },

  // ── 飲料 ──
  '美式咖啡':       { amt: 240, label: '1杯' },
  '拿鐵':           { amt: 360, label: '1杯' },
  '卡布奇諾':       { amt: 240, label: '1杯' },
  '摩卡':           { amt: 360, label: '1杯' },
  '濃縮咖啡':       { amt: 30,  label: '1shot' },
  '冷萃咖啡':       { amt: 240, label: '1杯' },
  '抹茶拿鐵':       { amt: 360, label: '1杯' },
  '豆漿拿鐵':       { amt: 360, label: '1杯' },
  '燕麥拿鐵':       { amt: 360, label: '1杯' },
  '紅茶':           { amt: 480, label: '1杯' },
  '綠茶':           { amt: 480, label: '1杯' },
  '烏龍茶':         { amt: 480, label: '1杯' },
  '鮮奶茶':         { amt: 480, label: '1杯' },
  '果茶':           { amt: 480, label: '1杯' },
  '可樂':           { amt: 330, label: '1罐' },
  '雪碧':           { amt: 330, label: '1罐' },
  '汽水':           { amt: 330, label: '1罐' },
  '零卡可樂':       { amt: 330, label: '1罐' },
  '柳橙汁':         { amt: 240, label: '1杯' },
  '蘋果汁':         { amt: 240, label: '1杯' },
  '葡萄汁':         { amt: 240, label: '1杯' },
  '番茄汁':         { amt: 240, label: '1杯' },
  '運動飲料':       { amt: 350, label: '1瓶' },
  '椰子水':         { amt: 330, label: '1罐' },
  '蔓越莓汁':       { amt: 240, label: '1杯' },
  '鳳梨汁':         { amt: 240, label: '1杯' },
  '芭樂汁':         { amt: 240, label: '1杯' },
  '薑黃拿鐵':       { amt: 240, label: '1杯' },
  '啤酒':           { amt: 330, label: '1罐' },
  '紅酒':           { amt: 150, label: '1杯' },
  '白酒':           { amt: 150, label: '1杯' },
  '威士忌':         { amt: 45,  label: '1shot' },
  '燒酒':           { amt: 45,  label: '1shot' },
  '梅酒':           { amt: 100, label: '1杯' },
  '高粱酒':         { amt: 45,  label: '1shot' },

  // ── 台式小吃 ──
  '肉圓':           { amt: 120, label: '1顆' },
  '碗粿':           { amt: 200, label: '1碗' },
  '筒仔米糕':       { amt: 200, label: '1份' },
  '油飯':           { amt: 200, label: '1份' },
  '粽子':           { amt: 150, label: '1顆' },
  '鹼粽':           { amt: 80,  label: '1顆' },
  '素粽':           { amt: 150, label: '1顆' },
  '豬血糕':         { amt: 80,  label: '1塊' },
  '臭豆腐鍋':       { amt: 350, label: '1份' },
  '麻辣臭豆腐':     { amt: 350, label: '1份' },
  '薑母鴨':         { amt: 400, label: '1份' },
  '羊肉爐':         { amt: 400, label: '1份' },
  '薑汁番薯湯':     { amt: 300, label: '1碗' },
  '芋圓':           { amt: 100, label: '1份' },
  '地瓜球':         { amt: 100, label: '1份' },
  '蚵嗲':           { amt: 90,  label: '1個' },
  '蚵仔煎':         { amt: 150, label: '1份' },
  '炸薯條':         { amt: 117, label: '中份' },
  '雞蛋糕':         { amt: 120, label: '4個' },
  '甜不辣':         { amt: 100, label: '1份' },
  '大腸包小腸':     { amt: 200, label: '1份' },
  '潤餅':           { amt: 200, label: '1捲' },
  '車輪餅':         { amt: 100, label: '1個' },
  '紅豆餅':         { amt: 100, label: '1個' },
  '麻糬':           { amt: 50,  label: '1顆' },
  '湯圓':           { amt: 30,  label: '3顆' },
  '元宵':           { amt: 50,  label: '3顆' },
  '包餡湯圓':       { amt: 50,  label: '3顆' },

  // ── 火鍋 ──
  '火鍋':           { amt: 600, label: '1份' },
  '麻辣鍋':        { amt: 600, label: '1份' },
  '涮涮鍋':         { amt: 600, label: '1份' },
  '薑母鴨鍋':       { amt: 500, label: '1份' },
  '火鍋料':         { amt: 150, label: '1份' },
  '燕餃':           { amt: 60,  label: '5顆' },
  '蛋餃':           { amt: 60,  label: '5顆' },
  '魚餃':           { amt: 60,  label: '5顆' },
  '豬肉丸':         { amt: 100, label: '5顆' },
  '牛肉丸':         { amt: 100, label: '5顆' },
  '花枝丸':         { amt: 100, label: '5顆' },
  '貢丸':           { amt: 60,  label: '3顆' },
  '豬血':           { amt: 100, label: '2塊' },

  // ── 日式料理 ──
  '天婦羅':         { amt: 100, label: '3件' },
  '章魚燒':         { amt: 120, label: '6顆' },
  '大阪燒':         { amt: 200, label: '1份' },
  '茶碗蒸':         { amt: 150, label: '1碗' },
  '味噌湯':         { amt: 200, label: '1碗' },
  '壽喜燒':         { amt: 300, label: '1份' },
  '日式炸豬排':     { amt: 150, label: '1片' },
  '日式炸雞':       { amt: 150, label: '1份' },
  '日式咖哩':       { amt: 400, label: '1份' },
  '日式炒麵':       { amt: 300, label: '1份' },
  '便當(日式)':     { amt: 500, label: '1份' },
  '關東煮':         { amt: 200, label: '1份' },
  '串燒':           { amt: 80,  label: '2串' },
  '鰻魚定食':       { amt: 400, label: '1份' },
  '壽司定食':       { amt: 350, label: '1份' },
  '生魚片':         { amt: 100, label: '5片' },

  // ── 韓式料理 ──
  '石鍋拌飯':       { amt: 450, label: '1碗' },
  '部隊鍋':         { amt: 500, label: '1份' },
  '韓式炸雞':       { amt: 200, label: '1份' },
  '韓式燒肉':       { amt: 150, label: '1份' },
  '泡菜鍋':         { amt: 500, label: '1份' },
  '辣炒年糕':       { amt: 200, label: '1份' },
  '海苔飯捲':       { amt: 100, label: '1捲' },
  '韓式豆腐鍋':     { amt: 400, label: '1份' },
  '韓式炒碼麵':     { amt: 500, label: '1碗' },
  '韓式泡麵':       { amt: 120, label: '1包' },
  '韓式炒飯':       { amt: 300, label: '1份' },
  '參雞湯':         { amt: 600, label: '1份' },
  '泡菜':           { amt: 50,  label: '1份' },
  '韓式煎餅':       { amt: 150, label: '1份' },

  // ── 西式料理 ──
  '薯餅':           { amt: 90,  label: '1份' },
  '薯泥':           { amt: 150, label: '1份' },
  '烤薯條':         { amt: 117, label: '1份' },
  '洋蔥圈':         { amt: 100, label: '1份' },
  '凱薩沙拉':       { amt: 200, label: '1份' },
  '希臘沙拉':       { amt: 200, label: '1份' },
  '尼斯沙拉':       { amt: 250, label: '1份' },
  '生菜沙拉':       { amt: 150, label: '1份' },
  '蔬果沙拉':       { amt: 150, label: '1份' },
  '烤雞沙拉':       { amt: 250, label: '1份' },
  '玉米濃湯':       { amt: 300, label: '1碗' },
  '番茄湯':         { amt: 300, label: '1碗' },
  '南瓜湯':         { amt: 300, label: '1碗' },
  '羅宋湯':         { amt: 300, label: '1碗' },
  '牛肉清湯':       { amt: 300, label: '1碗' },
  '雞肉清湯':       { amt: 300, label: '1碗' },
  '燉飯':           { amt: 350, label: '1份' },
  '義大利肉醬':     { amt: 150, label: '1份' },
  '白醬義大利麵':   { amt: 350, label: '1份' },
  '紅醬義大利麵':   { amt: 350, label: '1份' },
  '青醬義大利麵':   { amt: 350, label: '1份' },
  '千層麵':         { amt: 300, label: '1份' },
  '焗烤':           { amt: 300, label: '1份' },
  '法式洋蔥湯':     { amt: 300, label: '1碗' },
  '烤豬肋排':       { amt: 300, label: '1份' },
  '炸魚薯條':       { amt: 400, label: '1份' },

  // ── 甜點・點心 ──
  '鬆餅':           { amt: 130, label: '1份' },
  '法式薄餅':       { amt: 100, label: '2片' },
  '貝果加奶油起司': { amt: 135, label: '1個' },
  '奶凍':           { amt: 100, label: '1份' },
  '提拉米蘇':       { amt: 100, label: '1份' },
  '起司蛋糕':       { amt: 100, label: '1片' },
  '磅蛋糕':         { amt: 80,  label: '1片' },
  '年糕':           { amt: 100, label: '1份' },
  '紅龜粿':         { amt: 80,  label: '1個' },
  '芝麻球':         { amt: 40,  label: '1個' },
  '芒果雪糕':       { amt: 80,  label: '1支' },
  '鳳梨酥':         { amt: 40,  label: '1個' },
  '太陽餅':         { amt: 50,  label: '1個' },
  '月餅':           { amt: 80,  label: 'half顆' },
  '蛋塔':           { amt: 75,  label: '1個' },
  '老婆餅':         { amt: 60,  label: '1個' },
  '核桃糕':         { amt: 50,  label: '1份' },
  '杏仁豆腐':       { amt: 150, label: '1份' },
  '愛玉':           { amt: 200, label: '1碗' },
  '粉圓':           { amt: 50,  label: '1份' },
  '燒麻糬':         { amt: 80,  label: '1份' },
  '冬瓜茶':         { amt: 480, label: '1杯' },
  '冬瓜磚':         { amt: 30,  label: '1份(衝泡用)' },
  '鬆糕':           { amt: 80,  label: '1片' },
  '甜甜圈':         { amt: 60,  label: '1個' },
  '泡芙':           { amt: 80,  label: '1個' },
  '閃電泡芙':       { amt: 80,  label: '1個' },
  '馬卡龍':         { amt: 20,  label: '1個' },
  '巧克力蛋糕':     { amt: 100, label: '1片' },
  '戚風蛋糕':       { amt: 80,  label: '1片' },
  '布朗尼':         { amt: 60,  label: '1塊' },
  '餅乾棒':         { amt: 35,  label: '1份' },
  '薯片':           { amt: 30,  label: '小包' },
  '仙貝':           { amt: 15,  label: '1片' },
  '旺旺仙貝':       { amt: 15,  label: '1片' },
  '米菓':           { amt: 20,  label: '3片' },
  '黑糖糕':         { amt: 80,  label: '1塊' },
  '地瓜餅乾':       { amt: 30,  label: '5片' },
  '蛋卷':           { amt: 20,  label: '2支' },
  '鳳梨糕':         { amt: 40,  label: '1個' },
  '芋頭酥':         { amt: 50,  label: '1個' },

  // ── 超商・快餐 ──
  '御飯糰(鮭魚)':   { amt: 110, label: '1個' },
  '御飯糰(鮪魚)':   { amt: 110, label: '1個' },
  '御飯糰(明太子)': { amt: 110, label: '1個' },
  '三明治':         { amt: 130, label: '1個' },
  '雞蛋沙拉三明治': { amt: 120, label: '1個' },
  '鮪魚三明治':     { amt: 120, label: '1個' },
  '烤雞腿便當':     { amt: 500, label: '1份' },
  '排骨便當':       { amt: 500, label: '1份' },
  '雞腿便當':       { amt: 500, label: '1份' },
  '關東煮綜合':     { amt: 200, label: '1份' },
  '微波便當':       { amt: 450, label: '1份' },
  '泡麵(超商)':     { amt: 85,  label: '1碗' },
  '茶葉蛋(超商)':   { amt: 55,  label: '1顆' },
  '雞蛋布丁':       { amt: 80,  label: '1個' },
  '玉米濃湯(超商)': { amt: 200, label: '1杯' },
  '御好燒':         { amt: 150, label: '1份' },
  '燒烤醬肉串':     { amt: 80,  label: '2串' },

  // ── 調味料・醬料 ──
  '番茄醬':         { amt: 17,  label: '1匙' },
  '黃芥末醬':       { amt: 15,  label: '1匙' },
  '美乃滋':         { amt: 15,  label: '1匙' },
  '沙茶醬':         { amt: 15,  label: '1匙' },
  '豆瓣醬':         { amt: 15,  label: '1匙' },
  '辣椒醬':         { amt: 10,  label: '1匙' },
  '烤肉醬':         { amt: 15,  label: '1匙' },
  '照燒醬':         { amt: 15,  label: '1匙' },
  '蠔油':           { amt: 15,  label: '1匙' },
  '醬油膏':         { amt: 15,  label: '1匙' },
  '醋':             { amt: 15,  label: '1匙' },
  '白醋':           { amt: 15,  label: '1匙' },
  '烏醋':           { amt: 15,  label: '1匙' },
  '砂糖':           { amt: 12,  label: '1匙' },
  '黑糖':           { amt: 12,  label: '1匙' },
  '蜂蜜':           { amt: 21,  label: '1匙' },
  '楓糖漿':         { amt: 20,  label: '1匙' },
  '龍眼蜜':         { amt: 21,  label: '1匙' },
  '花生醬':         { amt: 32,  label: '2匙' },
  '芝麻醬':         { amt: 16,  label: '1匙' },
  '味噌':           { amt: 15,  label: '1匙' },
  '咖哩塊':         { amt: 25,  label: '1塊' },
  '咖哩粉':         { amt: 5,   label: '1匙' },

  // ── 穀物・燕麥 ──
  '燕麥片':         { amt: 40,  label: '半杯(乾)' },
  '即食燕麥':       { amt: 40,  label: '半杯(乾)' },
  '麥片':           { amt: 40,  label: '半杯(乾)' },
  '玉米片':         { amt: 30,  label: '1份' },
  '全穀片':         { amt: 30,  label: '1份' },
  '藜麥':           { amt: 45,  label: '3匙(乾)' },
  '小米':           { amt: 50,  label: '1份(乾)' },
  '糯米':           { amt: 50,  label: '1份(乾)' },
  '黑米':           { amt: 50,  label: '1份(乾)' },
  '十穀米':         { amt: 50,  label: '1份(乾)' },
  '大麥':           { amt: 50,  label: '1份(乾)' },
  '蕎麥':           { amt: 40,  label: '1份(乾)' },

  // ── 健身・補充品 ──
  '奶昔(健身)':     { amt: 350, label: '1杯' },
  'BCAA':           { amt: 10,  label: '1份' },
  '肌酸':           { amt: 5,   label: '1份' },
  '膠原蛋白':       { amt: 10,  label: '1份' },
  '蛋白粉':         { amt: 30,  label: '1匙' },
  '增重粉':         { amt: 80,  label: '1份' },
  '魚油':           { amt: 2,   label: '1顆膠囊' },
  '乳清蛋白粉':     { amt: 30,  label: '1匙' },
  '植物蛋白粉':     { amt: 30,  label: '1匙' },
  '低卡代餐':       { amt: 30,  label: '1份' },
  '燕麥蛋白球':     { amt: 40,  label: '1顆' },
  '纖維餅乾':       { amt: 25,  label: '2片' },
  '燕麥奶昔':       { amt: 350, label: '1杯' },
  '酪蛋白':         { amt: 30,  label: '1匙' },
  '格蘭諾拉':       { amt: 45,  label: '半杯' },
  '格蘭諾拉麥片':   { amt: 45,  label: '半杯' },
  '高蛋白飲':       { amt: 330, label: '1瓶' },
  '電解質飲料':     { amt: 500, label: '1瓶' },
  '植物蛋白':       { amt: 30,  label: '1份' },
  '堅果棒':         { amt: 35,  label: '1條' },
  '杏仁醬':         { amt: 32,  label: '2匙' },
  '羽衣甘藍':       { amt: 80,  label: '1份' },

  // ── 蔬菜(補) ──
  '綠花椰菜':       { amt: 100, label: '1份' },
  '白花椰菜':       { amt: 100, label: '1份' },
  '大黃瓜':         { amt: 100, label: '半條' },
  '蒜頭':           { amt: 10,  label: '2瓣' },
  '紅椒':           { amt: 80,  label: '半顆' },
  '生菜':           { amt: 60,  label: '1份' },
  '西洋芹':         { amt: 80,  label: '1份' },
  '青江菜':         { amt: 100, label: '1份' },
  '山蘇':           { amt: 100, label: '1份' },
  '龍鬚菜':         { amt: 80,  label: '1份' },
  '荸薺':           { amt: 80,  label: '6顆' },
  '紫甘藍':         { amt: 80,  label: '1份' },
  '球芽甘藍':       { amt: 80,  label: '6顆' },
  '過貓':           { amt: 100, label: '1份' },
  '昆布':           { amt: 50,  label: '1份' },
  '紫蘇':           { amt: 5,   label: '3片' },
  '香菜':           { amt: 10,  label: '少許' },
  '珊瑚草':         { amt: 30,  label: '1份(泡發)' },
  '百合':           { amt: 50,  label: '1份' },
  '茭白筍':         { amt: 100, label: '1份' },
  '油菜':           { amt: 100, label: '1份' },
  '甜椒(紅)':       { amt: 80,  label: '半顆' },
  '甜椒(黃)':       { amt: 80,  label: '半顆' },
  '洋蔥(紫)':       { amt: 100, label: '半顆' },

  // ── 水果(補) ──
  '釋迦':           { amt: 200, label: '1顆' },
  '李子':           { amt: 70,  label: '1顆' },
  '桃子':           { amt: 150, label: '1顆' },
  '黑莓':           { amt: 80,  label: '1份' },
  '香瓜':           { amt: 200, label: '半顆' },
  '柚子':           { amt: 200, label: '1份' },
  '文旦':           { amt: 200, label: '半顆' },
  '椪柑':           { amt: 150, label: '1顆' },
  '茂谷柑':         { amt: 150, label: '1顆' },
  '砂糖橘':         { amt: 80,  label: '3顆' },
  '柑橘':           { amt: 120, label: '1顆' },
  '金桔':           { amt: 15,  label: '2顆' },
  '檸檬':           { amt: 80,  label: '1顆' },
  '萊姆':           { amt: 80,  label: '1顆' },
  '山竹':           { amt: 80,  label: '3顆' },
  '紅毛丹':         { amt: 60,  label: '5顆' },
  '人心果':         { amt: 100, label: '1顆' },
  '芭蕉':           { amt: 80,  label: '1根' },
  '青蘋果':         { amt: 180, label: '1顆' },
  '富士蘋果':       { amt: 200, label: '1顆' },
  '西洋梨':         { amt: 200, label: '1顆' },
  '黃金奇異果':     { amt: 80,  label: '1顆' },
  '巨峰葡萄':       { amt: 100, label: '8顆' },
  '麝香葡萄':       { amt: 100, label: '8顆' },
  '油桃':           { amt: 140, label: '1顆' },
  '杏':             { amt: 40,  label: '1顆' },
  '梅子':           { amt: 30,  label: '1顆' },
  '石榴':           { amt: 150, label: '半顆' },
  '枇杷':           { amt: 50,  label: '2顆' },
  '無花果':         { amt: 60,  label: '1顆' },
  '蔓越莓':         { amt: 80,  label: '1份' },
  '桑椹':           { amt: 80,  label: '1份' },
  '紅龍果':         { amt: 200, label: '半顆' },
  '鳳梨乾':         { amt: 30,  label: '1份' },
  '紅棗乾':         { amt: 30,  label: '5顆' },
  '龍眼乾':         { amt: 30,  label: '10顆' },
  '香蕉乾':         { amt: 30,  label: '1份' },

  // ── 乳製品(補) ──
  '無糖優格':       { amt: 150, label: '1盒' },
  '無糖希臘優格':   { amt: 150, label: '1盒' },
  '起司':           { amt: 20,  label: '1片' },
  '莫扎瑞拉':       { amt: 30,  label: '1份' },

  // ── 堅果・油脂(補) ──
  '葵花籽':         { amt: 28,  label: '1份' },
  '南瓜籽':         { amt: 28,  label: '約30顆' },
  '亞麻籽':         { amt: 15,  label: '1匙' },
  '玄米油':         { amt: 14,  label: '1匙' },
  '芥花油':         { amt: 14,  label: '1匙' },
  '麻油':           { amt: 14,  label: '1匙' },
  '葵花油':         { amt: 14,  label: '1匙' },
  '無鹽奶油':       { amt: 14,  label: '1匙' },
  '苦茶油':         { amt: 14,  label: '1匙' },

  // ── 早餐(補) ──
  '蛋餅加火腿':     { amt: 200, label: '1份' },
  '鮪魚蛋餅':       { amt: 195, label: '1份' },
  '漢堡加蛋':       { amt: 220, label: '1份' },
  '肉蛋吐司':       { amt: 180, label: '1份' },
  '總匯三明治':     { amt: 180, label: '1份' },
  '粉漿蛋餅':       { amt: 170, label: '1份' },
  '鮪魚起司蛋餅':   { amt: 210, label: '1份' },
  '培根起司蛋餅':   { amt: 210, label: '1份' },

  // ── 台式小吃(補) ──
  '古早味蛋糕':     { amt: 80,  label: '1片' },
  '滷味':           { amt: 150, label: '1份' },
  '春捲':           { amt: 120, label: '1捲' },
  '地瓜圓':         { amt: 100, label: '1份' },
  '燒酒雞':         { amt: 400, label: '1份' },
  '鐵板麵':         { amt: 300, label: '1份' },
  '芋粿巧':         { amt: 100, label: '2個' },
  '水煎包':         { amt: 80,  label: '1個' },
  '生煎包':         { amt: 80,  label: '1個' },
  '蘿蔔絲餅':       { amt: 100, label: '1份' },
  '蔥油餅':         { amt: 100, label: '1份' },
  '菜脯蛋':         { amt: 120, label: '1份' },
  '米漿':           { amt: 240, label: '1杯' },
  '黑輪':           { amt: 80,  label: '1份' },
  '旗魚丸':         { amt: 80,  label: '4顆' },
  '魚蛋':           { amt: 60,  label: '4顆' },
  '豆皮捲':         { amt: 50,  label: '1捲' },
  '蚵仔酥':         { amt: 150, label: '1份' },
  '香腸(烤)':       { amt: 50,  label: '1條' },
  '烤玉米':         { amt: 170, label: '1根' },
  '紅茶蛋':         { amt: 55,  label: '1顆' },
  '花生粉糯米糍':   { amt: 60,  label: '1個' },
  '烤肉串':         { amt: 80,  label: '2串' },
  '台式炒麵':       { amt: 300, label: '1份' },
  '米苔目':         { amt: 250, label: '1碗' },
  '鼎邊銼':         { amt: 300, label: '1碗' },
  '客家粄條':       { amt: 300, label: '1碗' },
  '蘿蔔糕(煎)':     { amt: 100, label: '2片' },
  '菜頭粿':         { amt: 100, label: '2片' },
  '蝦捲':           { amt: 80,  label: '1條' },
  '燒肉飯':         { amt: 400, label: '1份' },
  '地瓜稀飯':       { amt: 250, label: '1碗' },
  '炸醬麵':         { amt: 350, label: '1碗' },
  '雲吞麵':         { amt: 350, label: '1碗' },
  '蔥油拌麵':       { amt: 300, label: '1份' },
  '麻醬麵':         { amt: 300, label: '1份' },
  '碗麵':           { amt: 300, label: '1碗' },

  // ── 火鍋食材(補) ──
  '豬肉片':         { amt: 150, label: '1份' },
  '牛肉片':         { amt: 150, label: '1份' },
  '羊肉片':         { amt: 150, label: '1份' },
  '鴨血':           { amt: 100, label: '2塊' },
  '丸子':           { amt: 60,  label: '3顆' },
  '雞肉丸':         { amt: 60,  label: '3顆' },
  '蝦仁丸':         { amt: 60,  label: '3顆' },
  '火鍋米血':       { amt: 100, label: '2塊' },
  '魚皮':           { amt: 50,  label: '1份' },
  '鴨腸':           { amt: 80,  label: '1份' },
  '骰子牛':         { amt: 150, label: '1份' },
  '牛肉片(火鍋)':   { amt: 150, label: '1份' },
  '豬肋排':         { amt: 200, label: '1份' },
  '豬腳筋':         { amt: 80,  label: '1份' },

  // ── 速食(補) ──
  '麥當勞大麥克':   { amt: 200, label: '1個' },
  '薯條(小)':       { amt: 80,  label: '1份' },
  '薯條(中)':       { amt: 117, label: '1份' },
  '薯條(大)':       { amt: 154, label: '1份' },
  '麥克雞塊(6)':    { amt: 106, label: '6塊' },
  '大亨堡':         { amt: 150, label: '1個' },
  '炸物':           { amt: 150, label: '1份' },
  '鹽酥雞(夜市)':   { amt: 150, label: '1份' },
  '雙層起司堡':     { amt: 200, label: '1個' },
  '炸蝦堡':         { amt: 180, label: '1個' },
  '肯德基炸雞腿':   { amt: 130, label: '1隻' },
  '肯德基原味雞':   { amt: 100, label: '1塊' },
  '摩斯漢堡(米漢堡)': { amt: 220, label: '1個' },
  '漢堡王華堡':     { amt: 210, label: '1個' },
  '炸雞排(便當)':   { amt: 500, label: '1份' },
  '去骨雞腿排':     { amt: 160, label: '1片' },
  '烤雞翅':         { amt: 70,  label: '1支' },
  '雞胸肉片':       { amt: 120, label: '1份' },
  '水煮雞胸':       { amt: 120, label: '1份' },
  '香草烤雞腿':     { amt: 160, label: '1隻' },
  '雞米花':         { amt: 150, label: '1份' },

  // ── 飲料(補) ──
  '水':             { amt: 250, label: '1杯' },
  '冰拿鐵':         { amt: 360, label: '1杯' },
  '茉莉花茶':       { amt: 480, label: '1杯' },
  '珍珠紅茶':       { amt: 500, label: '1杯' },
  '青蛙撞奶':       { amt: 500, label: '1杯' },
  '多多綠':         { amt: 500, label: '1杯' },
  'Diet Coke':      { amt: 330, label: '1罐' },
  '零卡雪碧':       { amt: 330, label: '1罐' },
  '無糖汽水':       { amt: 330, label: '1罐' },
  '芒果汁':         { amt: 240, label: '1杯' },
  '能量飲料':       { amt: 250, label: '1罐' },
  '全糖紅茶':       { amt: 500, label: '1杯' },
  '半糖紅茶':       { amt: 500, label: '1杯' },
  '無糖紅茶':       { amt: 500, label: '1杯' },
  '無糖綠茶':       { amt: 500, label: '1杯' },
  '無糖烏龍':       { amt: 500, label: '1杯' },
  '仙草茶':         { amt: 480, label: '1杯' },
  '青草茶':         { amt: 480, label: '1杯' },
  '楊桃汁':         { amt: 480, label: '1杯' },
  '梅子汁':         { amt: 240, label: '1杯' },
  '麥茶':           { amt: 480, label: '1杯' },
  '菊花茶':         { amt: 480, label: '1杯' },
  '玫瑰花茶':       { amt: 480, label: '1杯' },
  '紅棗茶':         { amt: 480, label: '1杯' },
  '桂圓茶':         { amt: 480, label: '1杯' },
  '薑茶':           { amt: 240, label: '1杯' },
  '檸檬汁':         { amt: 240, label: '1杯' },
  '西瓜汁':         { amt: 240, label: '1杯' },
  '胡蘿蔔汁':       { amt: 240, label: '1杯' },
  '燕麥奶':         { amt: 240, label: '1杯' },
  '杏仁奶':         { amt: 240, label: '1杯' },
  '椰奶':           { amt: 240, label: '1杯' },
  '可可牛奶':       { amt: 240, label: '1杯' },
  '焦糖瑪奇朵':     { amt: 360, label: '1杯' },
  '黑糖珍奶':       { amt: 500, label: '1杯' },
  '芋頭珍奶':       { amt: 500, label: '1杯' },
  '草莓珍奶':       { amt: 500, label: '1杯' },
  '芬達橘子':       { amt: 330, label: '1罐' },
  '豆奶':           { amt: 240, label: '1杯' },
  '果汁':           { amt: 240, label: '1杯' },
  '鴛鴦奶茶':       { amt: 480, label: '1杯' },
  '高梁酒':         { amt: 45,  label: '1shot' },

  // ── 甜點・冰品(補) ──
  '消化餅':         { amt: 25,  label: '2片' },
  '黑巧克力':       { amt: 30,  label: '3格' },
  '牛奶巧克力':     { amt: 30,  label: '3格' },
  '紅豆湯':         { amt: 250, label: '1碗' },
  '綠豆湯':         { amt: 250, label: '1碗' },
  '仙草':           { amt: 200, label: '1碗' },
  '豆花':           { amt: 250, label: '1碗' },
  '花生湯':         { amt: 250, label: '1碗' },
  '剉冰':           { amt: 300, label: '1碗' },
  '牛奶冰棒':       { amt: 70,  label: '1支' },
  '紅豆冰棒':       { amt: 70,  label: '1支' },
  '綠豆冰棒':       { amt: 70,  label: '1支' },
  '巧克力冰棒':     { amt: 70,  label: '1支' },
  '雪糕':           { amt: 70,  label: '1支' },
  '霜淇淋':         { amt: 100, label: '1支' },
  '冰淇淋三明治':   { amt: 100, label: '1個' },
  '雪泥':           { amt: 200, label: '1杯' },
  '龍鬚糖':         { amt: 20,  label: '1份' },
  '糖果':           { amt: 15,  label: '3顆' },
  '軟糖':           { amt: 20,  label: '5顆' },
  '棉花糖':         { amt: 15,  label: '3顆' },
  '芒果布丁':       { amt: 100, label: '1個' },
  '椰汁糕':         { amt: 80,  label: '1塊' },
  '粉粿':           { amt: 150, label: '1份' },
  '黑糖粉粿':       { amt: 150, label: '1份' },
  '芋泥':           { amt: 100, label: '1份' },
  '綠豆糕':         { amt: 30,  label: '1個' },
  '馬芬蛋糕':       { amt: 80,  label: '1個' },
  '紅絲絨蛋糕':     { amt: 100, label: '1片' },
  '舒芙蕾':         { amt: 120, label: '1份' },
  '卡士達':         { amt: 80,  label: '1份' },
  '可麗露':         { amt: 35,  label: '1個' },
  '巴斯克起司蛋糕': { amt: 100, label: '1片' },
  '達克瓦茲':       { amt: 40,  label: '1個' },

  // ── 零食(補) ──
  '海苔':           { amt: 5,   label: '1包' },
  '肉乾':           { amt: 30,  label: '1份' },
  '魷魚絲':         { amt: 25,  label: '1份' },
  '蒟蒻':           { amt: 100, label: '1包' },
  '洋芋片(原味)':   { amt: 30,  label: '小包' },
  '米果':           { amt: 20,  label: '3片' },
  '燕麥':           { amt: 40,  label: '半杯(乾)' },
  '奶油爆米花':     { amt: 50,  label: '1份' },
  '乖乖':           { amt: 30,  label: '小包' },
  '蝦味先':         { amt: 30,  label: '小包' },
  '科學麵':         { amt: 40,  label: '1包' },
  '泡麵（乾）':     { amt: 85,  label: '1包' },

  // ── 超商食品(補) ──
  '御飯糰(梅子)':   { amt: 110, label: '1個' },
  '御飯糰(雞肉)':   { amt: 110, label: '1個' },
  '御飯糰(起司蛋)': { amt: 110, label: '1個' },
  '便利商店便當(雞腿)': { amt: 500, label: '1份' },
  '便利商店便當(排骨)': { amt: 500, label: '1份' },
  '關東煮(綜合)':   { amt: 200, label: '1份' },
  '三明治(雞蛋起司)': { amt: 120, label: '1個' },
  '三明治(火腿起司)': { amt: 120, label: '1個' },
  '鮮食肉包':       { amt: 80,  label: '1個' },
  '鮮食豆沙包':     { amt: 80,  label: '1個' },
  '鮮食鮮奶饅頭':   { amt: 75,  label: '1個' },
  '便利商店涼麵':   { amt: 200, label: '1份' },
  '輕食蔬果沙拉':   { amt: 150, label: '1份' },
  '鮮食壽司盒':     { amt: 220, label: '1盒' },
  '地瓜(便利商店)': { amt: 130, label: '1條' },
  '沙拉雞胸肉':     { amt: 120, label: '1份' },
  '關東煮(蘿蔔)':   { amt: 80,  label: '2塊' },
  '關東煮(油豆腐)': { amt: 60,  label: '1塊' },

  // ── 日式料理(補) ──
  '握壽司(鮭魚)':   { amt: 35,  label: '1貫' },
  '握壽司(鮪魚)':   { amt: 35,  label: '1貫' },
  '握壽司(蝦)':     { amt: 30,  label: '1貫' },
  '握壽司(海膽)':   { amt: 30,  label: '1貫' },
  '手捲(綜合)':     { amt: 120, label: '1捲' },
  '天婦羅(綜合)':   { amt: 100, label: '3件' },
  '炸豬排(日式)':   { amt: 150, label: '1片' },
  '照燒雞':         { amt: 150, label: '1份' },
  '可樂餅':         { amt: 100, label: '1個' },
  '唐揚炸雞':       { amt: 150, label: '1份' },
  '生魚片(綜合)':   { amt: 100, label: '5片' },
  '日式蕎麥麵':     { amt: 250, label: '1份' },
  '日式烏龍麵':     { amt: 300, label: '1碗' },
  '味噌鯖魚':       { amt: 120, label: '1份' },
  '日式煎餃':       { amt: 120, label: '6個' },
  '日式茶漬飯':     { amt: 300, label: '1碗' },
  '茶泡飯':         { amt: 300, label: '1碗' },
  '日式冷麵':       { amt: 250, label: '1份' },
  '日式唐揚雞':     { amt: 150, label: '1份' },
  '玉子燒':         { amt: 80,  label: '1份' },
  '味噌豬排':       { amt: 200, label: '1份' },
  '日式薑汁燒肉':   { amt: 150, label: '1份' },
  '叉燒飯':         { amt: 400, label: '1份' },
  '港式蘿蔔糕':     { amt: 100, label: '2片' },
  '鴛鴦':           { amt: 480, label: '1杯' },
  '奶黃包':         { amt: 60,  label: '1個' },
  '燒鵝飯':         { amt: 450, label: '1份' },
  '港式燒臘':       { amt: 150, label: '1份' },

  // ── 韓式料理(補) ──
  '韓式拌飯':       { amt: 450, label: '1碗' },
  '韓式泡菜鍋':     { amt: 500, label: '1份' },
  '韓式烤豬五花':   { amt: 150, label: '1份' },
  '韓式烤牛肉':     { amt: 150, label: '1份' },
  '辛拉麵':         { amt: 120, label: '1包' },
  '韓式泡菜':       { amt: 50,  label: '1份' },
  '韓式魚板':       { amt: 80,  label: '1份' },
  '甜辣醬炸雞':     { amt: 200, label: '1份' },
  '起司炸雞':       { amt: 200, label: '1份' },
  '韓式炸醬麵':     { amt: 450, label: '1碗' },
  '韓式豆漿麵':     { amt: 450, label: '1碗' },
  '韓式海帶湯':     { amt: 300, label: '1碗' },
  '韓式糖餅':       { amt: 80,  label: '1個' },
  '韓式血腸':       { amt: 100, label: '1份' },
  '海鮮煎餅':       { amt: 150, label: '1份' },
  '玉米起司':       { amt: 150, label: '1份' },

  // ── 西式料理(補) ──
  '義大利麵(肉醬)': { amt: 350, label: '1份' },
  '義大利麵(白醬)': { amt: 350, label: '1份' },
  '義大利麵(青醬)': { amt: 350, label: '1份' },
  '義大利麵(番茄)': { amt: 350, label: '1份' },
  '培根蛋義大利麵': { amt: 350, label: '1份' },
  '蒜香義大利麵':   { amt: 350, label: '1份' },
  '披薩(起司)':     { amt: 110, label: '1片' },
  '披薩(夏威夷)':   { amt: 110, label: '1片' },
  '夏威夷披薩':     { amt: 110, label: '1片' },
  '焗烤麵':         { amt: 300, label: '1份' },
  '洋蔥湯':         { amt: 300, label: '1碗' },
  '蘑菇湯':         { amt: 300, label: '1碗' },
  '牛排(菲力)':     { amt: 200, label: '1份' },
  '烤雞腿(西式)':   { amt: 160, label: '1隻' },
  '布里歐':         { amt: 60,  label: '1個' },
  '西式漢堡(牛肉)': { amt: 220, label: '1個' },
  '恩佐沙拉':       { amt: 200, label: '1份' },
  '馬鈴薯泥':       { amt: 150, label: '1份' },
  '義大利肉醬麵':   { amt: 350, label: '1份' },
  '蘑菇義大利麵':   { amt: 350, label: '1份' },
  'BLT三明治':      { amt: 150, label: '1份' },
  '法棍':           { amt: 60,  label: '2片' },
  '佛卡夏':         { amt: 80,  label: '1份' },
  '烤牛排':         { amt: 250, label: '1份' },
  '帕尼尼':         { amt: 180, label: '1份' },
  '可麗餅':         { amt: 100, label: '1份' },
  '奶油酥餅':       { amt: 50,  label: '1個' },
  '義式燉飯':       { amt: 350, label: '1份' },
  '法式洋蔥湯':     { amt: 300, label: '1碗' },

  // ── 東南亞料理 ──
  '泰式炒河粉':     { amt: 300, label: '1份' },
  '星洲炒米':       { amt: 250, label: '1份' },
  '泰式綠咖哩':     { amt: 350, label: '1份' },
  '泰式紅咖哩':     { amt: 350, label: '1份' },
  '叻沙':           { amt: 500, label: '1份' },
  '沙嗲串':         { amt: 80,  label: '2串' },
  '越式春捲':       { amt: 100, label: '1捲' },
  '印尼炒飯':       { amt: 300, label: '1份' },
  '打拋豬肉':       { amt: 200, label: '1份' },
  '泰式打拋':       { amt: 200, label: '1份' },
  '椰奶咖哩':       { amt: 350, label: '1份' },
  '印度咖哩':       { amt: 300, label: '1份' },
  '馬來沙嗲':       { amt: 80,  label: '2串' },

  // ── 中式料理 ──
  '魚香肉絲':       { amt: 150, label: '1份' },
  '紅燒獅子頭':     { amt: 200, label: '1顆' },
  '蒜泥白肉':       { amt: 150, label: '1份' },
  '薑絲炒大腸':     { amt: 150, label: '1份' },
  '炒空心菜':       { amt: 150, label: '1份' },
  '炒菠菜':         { amt: 150, label: '1份' },
  '蒸魚':           { amt: 200, label: '1份' },
  '清蒸蛋':         { amt: 150, label: '1份' },
  '涼拌小黃瓜':     { amt: 100, label: '1份' },
  '涼拌木耳':       { amt: 100, label: '1份' },
  '蔥爆牛肉':       { amt: 200, label: '1份' },
  '藥燉排骨':       { amt: 300, label: '1份' },
  '茶葉麵包':       { amt: 35,  label: '1片' },

  // ── 海鮮(補) ──
  '鯛魚':           { amt: 150, label: '1片' },
  '龍膽石斑':       { amt: 200, label: '1份' },
  '海瓜子':         { amt: 100, label: '1份' },
  '蝦米':           { amt: 15,  label: '1匙' },
  '鮑魚':           { amt: 100, label: '1顆' },
  '海蜇皮':         { amt: 80,  label: '1份' },
  '魚鬆':           { amt: 15,  label: '1匙' },

  // ── 調味料(補) ──
  '醬油':           { amt: 15,  label: '1匙' },
  '鹽':             { amt: 5,   label: '1匙' },
  '白糖':           { amt: 12,  label: '1匙' },
  '芥末醬':         { amt: 10,  label: '1匙' },
  'XO醬':           { amt: 15,  label: '1匙' },
  '甜辣醬':         { amt: 15,  label: '1匙' },
  '沙拉醬':         { amt: 15,  label: '1匙' },
  '千島醬':         { amt: 15,  label: '1匙' },
  '凱薩醬':         { amt: 15,  label: '1匙' },
  '巴薩米克醋':     { amt: 15,  label: '1匙' },
  '辣豆瓣醬':       { amt: 15,  label: '1匙' },

  // ── 其他 ──
  '豆腐鍋':         { amt: 400, label: '1份' },
  '辣牛肉湯':       { amt: 300, label: '1碗' },
  '蘑菇濃湯':       { amt: 300, label: '1碗' },
  '南瓜濃湯':       { amt: 300, label: '1碗' },
  '茶葉蛋(超商)':   { amt: 55,  label: '1顆' },

  // ── 鴨肉系列 ──
  '鴨肉麵羹':       { amt: 350, label: '1碗' },
  '鴨肉羹':         { amt: 300, label: '1碗' },
  '鴨肉飯':         { amt: 350, label: '1碗' },
  '鴨肉米粉':       { amt: 300, label: '1碗' },
  '鹽水鴨':         { amt: 150, label: '1份' },
  '烤鴨':           { amt: 150, label: '1份' },
  '北京烤鴨':       { amt: 200, label: '1份' },

  // ── 虱目魚系列 ──
  '虱目魚湯':       { amt: 300, label: '1碗' },
  '虱目魚肚':       { amt: 120, label: '1片' },
  '香煎虱目魚':     { amt: 120, label: '1片' },
  '虱目魚肚粥':     { amt: 300, label: '1碗' },

  // ── 台式家常菜 ──
  '麻油雞':         { amt: 400, label: '1份' },
  '麻油雞飯':       { amt: 400, label: '1份' },
  '麻油腰子':       { amt: 150, label: '1份' },
  '瓜仔肉':         { amt: 150, label: '1份' },
  '三色蛋':         { amt: 150, label: '1份' },
  '皮蛋豆腐':       { amt: 150, label: '1份' },
  '蝦仁炒蛋':       { amt: 150, label: '1盤' },
  '青椒炒肉絲':     { amt: 150, label: '1盤' },
  '台式鹹豬肉':     { amt: 120, label: '1份' },
  '芹菜炒花枝':     { amt: 150, label: '1盤' },
  '炒蛤蜊':         { amt: 200, label: '1盤' },
  '九層塔炒蛤蜊':   { amt: 200, label: '1盤' },
  '台式泡菜':       { amt: 80,  label: '1份' },
  '高麗菜滷':       { amt: 150, label: '1盤' },
  '小魚乾炒花生':   { amt: 50,  label: '1份' },
  '薑燒豬肉':       { amt: 150, label: '1份' },
  '梅子豬排':       { amt: 150, label: '1份' },
  '水蓮炒肉':       { amt: 150, label: '1盤' },
  '焢肉飯':         { amt: 350, label: '1碗' },
  '炸排骨飯':       { amt: 400, label: '1份' },
  '炸雞腿飯':       { amt: 450, label: '1份' },
  '雞絲涼麵':       { amt: 300, label: '1份' },
  '豬血湯':         { amt: 250, label: '1碗' },
  '四神湯':         { amt: 350, label: '1碗' },
  '冬瓜排骨湯':     { amt: 300, label: '1碗' },
  '藥膳排骨湯':     { amt: 300, label: '1碗' },
  '貢丸湯':         { amt: 250, label: '1碗' },
  '餛飩湯':         { amt: 300, label: '1碗' },
  '蛤蜊湯':         { amt: 250, label: '1碗' },
  '絲瓜蛤蜊':       { amt: 250, label: '1碗' },
  '酸辣湯':         { amt: 250, label: '1碗' },
  '西湖牛肉羹':     { amt: 250, label: '1碗' },
  '紫菜蛋花湯':     { amt: 250, label: '1碗' },
  '味噌蛤蜊湯':     { amt: 250, label: '1碗' },
  '肉骨茶':         { amt: 400, label: '1份' },
  '薑絲大腸':       { amt: 150, label: '1盤' },

  // ── 飯便當補充 ──
  '雞腿排飯':       { amt: 400, label: '1份' },
  '鮭魚炒飯':       { amt: 300, label: '1碗' },
  '蝦仁炒飯':       { amt: 300, label: '1碗' },

  // ── 夜市小吃 ──
  '胡椒餅':         { amt: 120, label: '1個' },
  '炸臭豆腐':       { amt: 200, label: '1份' },
  '台灣漢堡':       { amt: 150, label: '1個' },
  '涼圓':           { amt: 100, label: '1份' },
  '花枝漿':         { amt: 100, label: '1份' },
  '肉羹':           { amt: 250, label: '1碗' },
  '肉羹麵':         { amt: 350, label: '1碗' },

  // ── 台灣品牌飲料 ──
  '維大力':         { amt: 330, label: '1罐' },
  '舒跑':           { amt: 350, label: '1瓶' },
  '光泉鮮奶':       { amt: 236, label: '1瓶' },
  '味全鮮奶':       { amt: 236, label: '1瓶' },
  '統一鮮奶':       { amt: 236, label: '1瓶' },
  '麥香紅茶':       { amt: 300, label: '1瓶' },
  '麥香奶茶':       { amt: 300, label: '1瓶' },
  '統一麥茶':       { amt: 480, label: '1瓶' },
  '古道梅子綠茶':   { amt: 500, label: '1瓶' },
  '御茶園每朝健康綠茶': { amt: 530, label: '1瓶' },
  '茶裏王':         { amt: 580, label: '1瓶' },
  '純喫茶':         { amt: 500, label: '1瓶' },
  '原萃':           { amt: 580, label: '1瓶' },

  // ── 韓式豆腐煲 ──
  '韓式大醬炸魚嫩豆腐煲': { amt: 700, label: '1份(含飯)' },

  // ── 台式飯糰 ──
  '台式飯糰':     { amt: 200, label: '1個' },
  '肉鬆飯糰':     { amt: 220, label: '1個' },
  '油條飯糰':     { amt: 230, label: '1個' },
  '蛋黃飯糰':     { amt: 210, label: '1個' },
  '菜脯飯糰':     { amt: 200, label: '1個' },
  '燒肉飯糰':     { amt: 210, label: '1個' },
  '鮪魚飯糰':     { amt: 200, label: '1個' },
  '肉鬆油條飯糰': { amt: 240, label: '1個' },

  // 台灣特色
  '油飯':           { amt: 200, label: '1碗' },
  '大腸包小腸':     { amt: 250, label: '1條' },
  '花枝丸':         { amt: 50,  label: '1顆' },
  '蔥抓餅':         { amt: 120, label: '1片' },
  '蔥油餅加蛋':     { amt: 130, label: '1片' },
  '紅龜粿':         { amt: 100, label: '1個' },
  '鹼粽':           { amt: 120, label: '1個' },
  '菜粽':           { amt: 150, label: '1個' },
  '肉粽(台式)':     { amt: 180, label: '1個' },
  '粽子(北部)':     { amt: 170, label: '1個' },
  '粽子(南部)':     { amt: 200, label: '1個' },
  '米苔目湯':       { amt: 300, label: '1碗' },
  '米苔目乾':       { amt: 300, label: '1碗' },
  '水晶餃':         { amt: 150, label: '1份(6顆)' },
  '鯛魚燒':         { amt: 80,  label: '1個' },
  '炸蝦':           { amt: 60,  label: '1尾' },
  '炸花枝':         { amt: 80,  label: '1份' },
  '豬腳飯':         { amt: 450, label: '1份(含飯)' },
  '雞腳':           { amt: 50,  label: '1隻' },
  '鳳爪':           { amt: 50,  label: '1隻' },
  '雞爪':           { amt: 50,  label: '1隻' },
  '白菜滷':         { amt: 200, label: '1份' },
  '燙青菜':         { amt: 200, label: '1份' },
  '燴飯':           { amt: 400, label: '1份(含飯)' },
  '肉燥拌麵':       { amt: 300, label: '1碗' },
  '乾麵(肉燥)':     { amt: 300, label: '1碗' },
  '清雞湯':         { amt: 300, label: '1碗' },
  '雞湯麵':         { amt: 350, label: '1碗' },
  '排骨蓮藕湯':     { amt: 350, label: '1碗' },
  '羅宋湯':         { amt: 300, label: '1碗' },
  '福菜肉片湯':     { amt: 300, label: '1碗' },
  '苦瓜排骨湯':     { amt: 350, label: '1碗' },
  '玉米排骨湯':     { amt: 350, label: '1碗' },
  '大骨湯':         { amt: 300, label: '1碗' },
  // 鵝肉
  '鵝肉':           { amt: 150, label: '1份' },
  '鵝肉飯':         { amt: 450, label: '1份(含飯)' },
  '鵝肉麵':         { amt: 400, label: '1碗' },
  // 食材
  '黑木耳':         { amt: 100, label: '1份' },
  '白木耳':         { amt: 100, label: '1份' },
  '魚豆腐':         { amt: 50,  label: '1塊' },
  '海帶結':         { amt: 100, label: '1份' },
  '九層塔':         { amt: 20,  label: '1把' },
  '素雞':           { amt: 100, label: '1份' },
  // 台灣飲料
  '甘蔗汁':         { amt: 480, label: '1大杯' },
  '仙草蜜':         { amt: 500, label: '1杯' },
  '芋圓仙草':       { amt: 500, label: '1杯' },
  '台灣啤酒':       { amt: 355, label: '1罐' },
  // 中式補充
  '酸菜魚':         { amt: 400, label: '1份' },
  '夫妻肺片':       { amt: 250, label: '1份' },
  '口水雞':         { amt: 250, label: '1份' },
  '水煮牛肉':       { amt: 300, label: '1份' },
  '梅菜扣肉':       { amt: 250, label: '1份' },
  // 世界食物
  '烤饢':           { amt: 120, label: '1片' },
  '蒜香烤饢':       { amt: 120, label: '1片' },
  '印度香飯':       { amt: 350, label: '1份' },
  '薩摩薩':         { amt: 80,  label: '1個' },
  '沙威瑪':         { amt: 250, label: '1份' },
  '鷹嘴豆泥':       { amt: 100, label: '2湯匙' },
  '法拉費':         { amt: 120, label: '4顆' },
  '塔可':           { amt: 150, label: '1個' },
  '玉米脆片':       { amt: 50,  label: '1把' },
  '酪梨醬':         { amt: 60,  label: '2湯匙' },
  '冬陰功湯':       { amt: 400, label: '1碗' },
  '越式法包':       { amt: 200, label: '1個' },
  '希臘旋轉肉':     { amt: 200, label: '1份' },
  '西班牙海鮮燉飯': { amt: 350, label: '1份' },
  '德國香腸':       { amt: 120, label: '1條' },
  '肉桂捲':         { amt: 100, label: '1個' },
  '法式吐司':       { amt: 120, label: '2片' },
  '格子鬆餅':       { amt: 120, label: '1片' },
  '布朗尼':         { amt: 60,  label: '1塊' },
  '奶酪':           { amt: 130, label: '1杯' },
  '焦糖布丁':       { amt: 130, label: '1杯' },
  '水牛城雞翅':     { amt: 120, label: '4支' },
  'BBQ雞翅':        { amt: 120, label: '4支' },
  '芝麻球':         { amt: 50,  label: '3顆' },
  '芝麻糊':         { amt: 250, label: '1碗' },
  '核桃糊':         { amt: 250, label: '1碗' },
  '杏仁茶':         { amt: 300, label: '1碗' },
};



// ── Exercise DB (MET values from Compendium of Physical Activities 2011) ──────

const EXERCISE_DB = {
  // ══ 跑步 有氧 ══
  '健走':                 { met: 3.5,  icon: '🚶', cat: '跑步有氧' },
  '快走':                 { met: 4.3,  icon: '🚶', cat: '跑步有氧' },
  '健步走/競走':          { met: 6.5,  icon: '🚶', cat: '跑步有氧' },
  '慢跑':                 { met: 8.3,  icon: '🏃', cat: '跑步有氧' },
  '跑步(中速)':           { met: 9.8,  icon: '🏃', cat: '跑步有氧' },
  '跑步(快速)':           { met: 11.8, icon: '🏃', cat: '跑步有氧' },
  '跑步(衝刺)':           { met: 14.5, icon: '🏃', cat: '跑步有氧' },
  '跳繩(慢速)':           { met: 8.8,  icon: '⚡', cat: '跑步有氧' },
  '跳繩(中速)':           { met: 11.8, icon: '⚡', cat: '跑步有氧' },
  '跳繩(快速)':           { met: 12.3, icon: '⚡', cat: '跑步有氧' },
  'HIIT高強度間歇':       { met: 12.0, icon: '⚡', cat: '跑步有氧' },
  'Tabata':              { met: 12.5, icon: '⚡', cat: '跑步有氧' },
  '爬樓梯':              { met: 8.0,  icon: '🪜', cat: '跑步有氧' },
  '爬山/健行':           { met: 7.8,  icon: '⛰️', cat: '跑步有氧' },
  '登山(陡坡)':          { met: 8.3,  icon: '⛰️', cat: '跑步有氧' },
  '波比跳':              { met: 8.0,  icon: '⚡', cat: '跑步有氧' },
  '開合跳(跳躍分腿)':   { met: 8.0,  icon: '⚡', cat: '跑步有氧' },
  '登山者式':            { met: 8.0,  icon: '💪', cat: '跑步有氧' },
  '有氧舞蹈':            { met: 7.3,  icon: '💃', cat: '跑步有氧' },
  // ══ 室內有氧器材 ══
  '室內腳踏車(輕鬆)':    { met: 3.5,  icon: '🚴', cat: '室內器材' },
  '室內腳踏車(中等)':    { met: 6.8,  icon: '🚴', cat: '室內器材' },
  '室內腳踏車(激烈)':    { met: 8.8,  icon: '🚴', cat: '室內器材' },
  '飛輪課(Spinning)':    { met: 8.5,  icon: '🚴', cat: '室內器材' },
  '飛輪(高強度)':        { met: 14.0, icon: '🚴', cat: '室內器材' },
  '跑步機(步行)':        { met: 3.8,  icon: '🏃', cat: '室內器材' },
  '跑步機(慢跑)':        { met: 8.0,  icon: '🏃', cat: '室內器材' },
  '跑步機(跑步)':        { met: 9.8,  icon: '🏃', cat: '室內器材' },
  '跑步機(坡度快走)':    { met: 5.3,  icon: '🏃', cat: '室內器材' },
  '橢圓機(輕鬆)':        { met: 5.0,  icon: '🏃', cat: '室內器材' },
  '橢圓機(中等)':        { met: 7.0,  icon: '🏃', cat: '室內器材' },
  '橢圓機(激烈)':        { met: 9.0,  icon: '🏃', cat: '室內器材' },
  '划船機(輕鬆)':        { met: 7.0,  icon: '🚣', cat: '室內器材' },
  '划船機(激烈)':        { met: 8.5,  icon: '🚣', cat: '室內器材' },
  '爬梯機/StairMaster':  { met: 9.0,  icon: '🪜', cat: '室內器材' },
  '踏步機':              { met: 4.0,  icon: '🪜', cat: '室內器材' },
  '手腳並用訓練機':      { met: 5.0,  icon: '🏋️', cat: '室內器材' },
  // ══ 室內健身/重量訓練 ══
  '重量訓練(輕度)':      { met: 3.5,  icon: '🏋️', cat: '室內健身' },
  '重量訓練(中度)':      { met: 5.0,  icon: '🏋️', cat: '室內健身' },
  '重量訓練(高強度)':    { met: 6.0,  icon: '🏋️', cat: '室內健身' },
  '槓鈴深蹲':            { met: 5.0,  icon: '🏋️', cat: '室內健身' },
  '槓鈴臥推':            { met: 5.0,  icon: '🏋️', cat: '室內健身' },
  '硬舉':                { met: 6.0,  icon: '🏋️', cat: '室內健身' },
  '槓鈴肩推/推舉':       { met: 4.0,  icon: '🏋️', cat: '室內健身' },
  '啞鈴訓練':            { met: 3.5,  icon: '🏋️', cat: '室內健身' },
  '壺鈴訓練':            { met: 8.2,  icon: '🏋️', cat: '室內健身' },
  '彈力帶訓練':          { met: 3.0,  icon: '💪', cat: '室內健身' },
  'TRX懸吊訓練':         { met: 4.0,  icon: '💪', cat: '室內健身' },
  '機械式器材訓練':      { met: 3.5,  icon: '🏋️', cat: '室內健身' },
  '環狀訓練(Circuit)':   { met: 8.0,  icon: '🏋️', cat: '室內健身' },
  'CrossFit':            { met: 9.0,  icon: '🏋️', cat: '室內健身' },
  '超級組訓練':          { met: 6.0,  icon: '🏋️', cat: '室內健身' },
  '功能性訓練':          { met: 5.5,  icon: '🏋️', cat: '室內健身' },
  '奧林匹克舉重':        { met: 6.0,  icon: '🏋️', cat: '室內健身' },
  '健美訓練':            { met: 5.5,  icon: '🏋️', cat: '室內健身' },
  // ══ 居家/徒手訓練 ══
  '深蹲':                { met: 5.0,  icon: '💪', cat: '居家訓練' },
  '弓箭步':              { met: 4.5,  icon: '💪', cat: '居家訓練' },
  '伏地挺身':            { met: 3.8,  icon: '💪', cat: '居家訓練' },
  '仰臥起坐':            { met: 3.0,  icon: '💪', cat: '居家訓練' },
  '捲腹':                { met: 2.8,  icon: '💪', cat: '居家訓練' },
  '平板撐(棒式)':        { met: 3.0,  icon: '💪', cat: '居家訓練' },
  '引體向上/拉單槓':     { met: 4.0,  icon: '💪', cat: '居家訓練' },
  '核心訓練':            { met: 3.8,  icon: '💪', cat: '居家訓練' },
  '臀橋/臀推':           { met: 2.5,  icon: '💪', cat: '居家訓練' },
  '側棒式':              { met: 2.5,  icon: '💪', cat: '居家訓練' },
  '跪姿伏地挺身':        { met: 2.8,  icon: '💪', cat: '居家訓練' },
  '超人式(背部訓練)':    { met: 2.0,  icon: '💪', cat: '居家訓練' },
  '手臂圈':              { met: 2.5,  icon: '💪', cat: '居家訓練' },
  '徒手腹肌訓練':        { met: 3.5,  icon: '💪', cat: '居家訓練' },
  // ══ 球類運動 ══
  '籃球':                { met: 8.0,  icon: '🏀', cat: '球類' },
  '沙灘籃球':            { met: 8.0,  icon: '🏀', cat: '球類' },
  '排球':                { met: 4.0,  icon: '🏐', cat: '球類' },
  '沙灘排球':            { met: 8.0,  icon: '🏐', cat: '球類' },
  '桌球':                { met: 4.0,  icon: '🏓', cat: '球類' },
  '羽球(休閒)':          { met: 4.5,  icon: '🏸', cat: '球類' },
  '羽球(競賽)':          { met: 7.0,  icon: '🏸', cat: '球類' },
  '網球(單打)':          { met: 7.3,  icon: '🎾', cat: '球類' },
  '網球(雙打)':          { met: 5.0,  icon: '🎾', cat: '球類' },
  '壁球(Squash)':        { met: 12.1, icon: '🎾', cat: '球類' },
  '足球':                { met: 7.0,  icon: '⚽', cat: '球類' },
  '棒球/壘球':           { met: 5.0,  icon: '⚾', cat: '球類' },
  '手球':                { met: 12.0, icon: '🤾', cat: '球類' },
  '橄欖球':              { met: 8.3,  icon: '🏉', cat: '球類' },
  '高爾夫(步行)':        { met: 4.8,  icon: '⛳', cat: '球類' },
  '高爾夫(搭車)':        { met: 3.5,  icon: '⛳', cat: '球類' },
  '保齡球':              { met: 3.0,  icon: '🎳', cat: '球類' },
  '撞球/台球':           { met: 2.5,  icon: '🎱', cat: '球類' },
  '飛盤(Ultimate)':      { met: 7.0,  icon: '🥏', cat: '球類' },
  '美式足球':            { met: 8.0,  icon: '🏈', cat: '球類' },
  // ══ 水上運動 ══
  '游泳(自由式輕鬆)':    { met: 5.8,  icon: '🏊', cat: '水上運動' },
  '游泳(自由式激烈)':    { met: 9.8,  icon: '🏊', cat: '水上運動' },
  '游泳(蛙式)':          { met: 10.3, icon: '🏊', cat: '水上運動' },
  '游泳(蝶式)':          { met: 13.8, icon: '🏊', cat: '水上運動' },
  '游泳(背式)':          { met: 9.5,  icon: '🏊', cat: '水上運動' },
  '水中有氧':            { met: 5.5,  icon: '🏊', cat: '水上運動' },
  '水中慢跑':            { met: 9.8,  icon: '🏊', cat: '水上運動' },
  '衝浪':                { met: 3.0,  icon: '🏄', cat: '水上運動' },
  '立槳/SUP':            { met: 6.0,  icon: '🏄', cat: '水上運動' },
  '獨木舟/皮划艇':       { met: 5.0,  icon: '🚣', cat: '水上運動' },
  '浮潛/潛水':           { met: 5.0,  icon: '🤿', cat: '水上運動' },
  '水球':                { met: 10.0, icon: '🏊', cat: '水上運動' },
  // ══ 格鬥/武術 ══
  '拳擊(訓練/打沙包)':   { met: 5.5,  icon: '🥊', cat: '格鬥武術' },
  '拳擊(實戰/對打)':     { met: 12.8, icon: '🥊', cat: '格鬥武術' },
  '泰拳/踢拳道':         { met: 12.0, icon: '🥊', cat: '格鬥武術' },
  '跆拳道':              { met: 10.3, icon: '🥋', cat: '格鬥武術' },
  '空手道':              { met: 10.0, icon: '🥋', cat: '格鬥武術' },
  '柔道/柔術':           { met: 10.0, icon: '🥋', cat: '格鬥武術' },
  '巴西柔術(BJJ)':       { met: 8.0,  icon: '🥋', cat: '格鬥武術' },
  '散打/武術':           { met: 10.0, icon: '🥋', cat: '格鬥武術' },
  '劍道':                { met: 10.0, icon: '🥋', cat: '格鬥武術' },
  '太極拳':              { met: 3.0,  icon: '🥋', cat: '格鬥武術' },
  '太極劍/功夫':         { met: 4.0,  icon: '🥋', cat: '格鬥武術' },
  '摔跤/角力':           { met: 7.0,  icon: '🤼', cat: '格鬥武術' },
  // ══ 舞蹈 ══
  '街舞/嘻哈':           { met: 6.5,  icon: '💃', cat: '舞蹈' },
  'Zumba':               { met: 6.0,  icon: '💃', cat: '舞蹈' },
  '國標舞(快舞)':        { met: 5.0,  icon: '💃', cat: '舞蹈' },
  '國標舞(慢舞)':        { met: 3.0,  icon: '💃', cat: '舞蹈' },
  '探戈/恰恰':           { met: 4.8,  icon: '💃', cat: '舞蹈' },
  '薩爾薩舞':            { met: 5.0,  icon: '💃', cat: '舞蹈' },
  '芭蕾舞':              { met: 5.5,  icon: '💃', cat: '舞蹈' },
  '現代舞/爵士舞':       { met: 5.0,  icon: '💃', cat: '舞蹈' },
  '鋼管舞':              { met: 6.0,  icon: '💃', cat: '舞蹈' },
  'K-pop舞蹈':           { met: 5.5,  icon: '💃', cat: '舞蹈' },
  // ══ 戶外休閒 ══
  '騎腳踏車(一般)':      { met: 6.8,  icon: '🚴', cat: '戶外休閒' },
  '騎腳踏車(快速)':      { met: 10.0, icon: '🚴', cat: '戶外休閒' },
  '騎腳踏車(山地車)':    { met: 8.5,  icon: '🚴', cat: '戶外休閒' },
  '直排輪/溜冰鞋':       { met: 7.5,  icon: '⛸️', cat: '戶外休閒' },
  '溜冰/冰刀':           { met: 7.0,  icon: '⛸️', cat: '戶外休閒' },
  '滑板':                { met: 5.0,  icon: '🛹', cat: '戶外休閒' },
  '滑雪(高山滑雪)':      { met: 5.3,  icon: '⛷️', cat: '戶外休閒' },
  '越野滑雪':            { met: 9.0,  icon: '⛷️', cat: '戶外休閒' },
  '單板滑雪':            { met: 5.3,  icon: '🏂', cat: '戶外休閒' },
  '跑酷(Parkour)':       { met: 10.0, icon: '🏃', cat: '戶外休閒' },
  '射箭':                { met: 3.5,  icon: '🏹', cat: '戶外休閒' },
  '釣魚(站立)':          { met: 2.5,  icon: '🎣', cat: '戶外休閒' },
  '攀岩(室内)':          { met: 8.0,  icon: '🧗', cat: '戶外休閒' },
  '攀岩(戶外)':          { met: 11.0, icon: '🧗', cat: '戶外休閒' },
  // ══ 瑜珈/身心 ══
  '瑜珈(哈達)':          { met: 2.5,  icon: '🧘', cat: '瑜珈身心' },
  '瑜珈(流瑜珈)':        { met: 3.5,  icon: '🧘', cat: '瑜珈身心' },
  '瑜珈(熱瑜珈/高溫)':  { met: 4.0,  icon: '🧘', cat: '瑜珈身心' },
  '瑜珈(空中瑜珈)':      { met: 4.5,  icon: '🧘', cat: '瑜珈身心' },
  '皮拉提斯':            { met: 3.0,  icon: '🧘', cat: '瑜珈身心' },
  '皮拉提斯(器械)':      { met: 3.5,  icon: '🧘', cat: '瑜珈身心' },
  '伸展/緩和運動':       { met: 2.3,  icon: '🤸', cat: '瑜珈身心' },
  '體操/翻滾':           { met: 3.5,  icon: '🤸', cat: '瑜珈身心' },
  '冥想/呼吸練習':       { met: 1.3,  icon: '🧘', cat: '瑜珈身心' },
  // ══ 生活活動 ══
  '做家事(激烈)':        { met: 3.8,  icon: '🧹', cat: '生活活動' },
  '做家事(一般)':        { met: 2.5,  icon: '🧹', cat: '生活活動' },
  '搬重物/搬家':         { met: 5.0,  icon: '📦', cat: '生活活動' },
  '跳舞(社交)':          { met: 5.5,  icon: '💃', cat: '生活活動' },
  '遛狗(快步)':          { met: 3.5,  icon: '🐕', cat: '生活活動' },
  '遛狗(慢走)':          { met: 2.5,  icon: '🐕', cat: '生活活動' },
  '園藝/除草':           { met: 3.5,  icon: '🌱', cat: '生活活動' },
  '洗車':                { met: 2.5,  icon: '🚗', cat: '生活活動' },
  '購物走動':            { met: 2.3,  icon: '🛍️', cat: '生活活動' },
  '照顧小孩(追跑)':      { met: 3.0,  icon: '👶', cat: '生活活動' },
};

const EXERCISE_QUICK = ['慢跑','飛輪課(Spinning)','室內腳踏車(中等)','重量訓練(中度)','游泳(自由式輕鬆)','HIIT高強度間歇','跳繩(中速)','瑜珈(哈達)'];

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

  getExercises:  () => DB._get('nm_exercises', '[]'),
  saveExercises: d  => localStorage.setItem('nm_exercises', JSON.stringify(d)),
  addExercise(entry) {
    entry.id = DB.newId();
    const all = DB.getExercises();
    all.push(entry);
    DB.saveExercises(all);
    return entry;
  },
  deleteExercise(id) { DB.saveExercises(DB.getExercises().filter(e => e.id !== id)); },
};

// ── Utils ─────────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

let currentFoodDate = todayStr();

function foodDateShift(days) {
  const d = new Date(currentFoodDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const next = d.toISOString().split('T')[0];
  if (next > todayStr()) return;
  currentFoodDate = next;
  renderFoodLog();
}

function foodDateLabel(dateStr) {
  const today = todayStr();
  if (dateStr === today) return '今天';
  const yest = new Date(today + 'T00:00:00');
  yest.setDate(yest.getDate() - 1);
  if (dateStr === yest.toISOString().split('T')[0]) return '昨天';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

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
  const exes  = DB.getExercises().filter(e => e.date === date);
  return {
    calories:         foods.reduce((s, f) => s + f.calories, 0),
    protein:          foods.reduce((s, f) => s + f.protein, 0),
    carbs:            foods.reduce((s, f) => s + f.carbs, 0),
    fat:              foods.reduce((s, f) => s + f.fat, 0),
    water:            water.reduce((s, w) => s + w.amount, 0),
    exercise_burned:  exes.reduce((s, e) => s + e.calories_burned, 0),
    exercise_minutes: exes.reduce((s, e) => s + e.duration, 0),
  };
}

function getMeals(date) {
  const meals = { breakfast: [], lunch: [], dinner: [], snack: [], fruit: [] };
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
    ['tCalChart','tWaterChart','tMacroChart','tWeightChart','tWeeklyChart'].forEach(k => {
      if (charts[k]) { charts[k].destroy(); delete charts[k]; }
    });
  }
  if (page !== 'weight') {
    if (charts.wHistChart) { charts.wHistChart.destroy(); delete charts.wHistChart; }
  }

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'food-log':  currentFoodDate = todayStr(); renderFoodLog(); break;
    case 'exercise':  currentExerciseDate = todayStr(); renderExercise(); break;
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
  if (dateEl) {
    const d = new Date();
    const days = ['日','一','二','三','四','五','六'];
    dateEl.textContent = `${d.getMonth()+1}月${d.getDate()}日 週${days[d.getDay()]}`;
  }
  const greetEl = document.getElementById('dash-greeting');
  if (greetEl) {
    const h = new Date().getHours();
    const emoji = h < 6 ? '🌙' : h < 12 ? '🌞' : h < 14 ? '☀️' : h < 18 ? '🌤️' : h < 21 ? '🌙' : '🌛';
    const msg   = h < 6  ? '夜深了，注意休息'
                : h < 10 ? '早安！記得吃早餐'
                : h < 14 ? '午安！午餐記錄了嗎？'
                : h < 18 ? '下午好！補充水分中'
                : h < 21 ? '晚上好！記錄今天晚餐'
                :           '睡前回顧今日飲食';
    greetEl.innerHTML = `${msg} <span>${emoji}</span>`;
  }

  const exBurned = sum.exercise_burned || 0;
  const netCal   = sum.calories - exBurned;
  document.getElementById('ring-cal').textContent = Math.round(sum.calories);
  const remain = Math.max(settings.calorie_goal - netCal, 0);
  document.getElementById('ring-remain').textContent =
    netCal > settings.calorie_goal ? '🎉 已超過目標' : `還差 ${Math.round(remain)} 大卡`;
  drawRing('calRing', netCal, settings.calorie_goal);

  const exRow = document.getElementById('dash-exercise-row');
  const exTxt = document.getElementById('dash-exercise-text');
  if (exRow && exTxt) {
    if (exBurned > 0) {
      exRow.style.display = 'block';
      exTxt.textContent   = `-${Math.round(exBurned)} kcal · 淨攝取 ${Math.round(netCal)} kcal`;
    } else {
      exRow.style.display = 'none';
    }
  }

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
  if (mealsEl) {
    const totalItems = Object.values(meals).reduce((s, a) => s + a.length, 0);
    const emptyBanner = totalItems === 0
      ? `<div style="text-align:center;padding:20px 0 12px">
           <div style="font-size:2rem;margin-bottom:6px">🌱</div>
           <div style="font-weight:700;font-size:0.9rem;color:var(--text);margin-bottom:4px">開始記錄今天的飲食吧！</div>
           <div style="font-size:0.78rem;color:var(--muted)">點「新增飲食」或前往飲食頁面開始追蹤</div>
         </div>`
      : '';
    mealsEl.innerHTML = emptyBanner + renderMealsHTML(meals, false);
  }

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

  // Calorie total summary
  const calSumEl = document.getElementById('dash-cal-summary');
  if (calSumEl) {
    const intake  = Math.round(sum.calories);
    const burned  = Math.round(exBurned);
    const net     = Math.round(netCal);
    const goal    = settings.calorie_goal;
    const over    = net > goal;
    const diff    = Math.abs(net - goal);

    const mealMeta = [
      { id: 'breakfast', label: '早餐', icon: '🌅' },
      { id: 'lunch',     label: '午餐', icon: '☀️' },
      { id: 'dinner',    label: '晚餐', icon: '🌙' },
      { id: 'snack',     label: '點心', icon: '🍿' },
    ];
    const mealRows = mealMeta.map(m => {
      const items = meals[m.id] || [];
      const cal   = Math.round(items.reduce((s, f) => s + f.calories, 0));
      const pct   = intake > 0 ? Math.round((cal / intake) * 100) : 0;
      if (!items.length) return '';
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:1rem;width:20px;text-align:center">${m.icon}</span>
          <span style="font-size:0.82rem;color:var(--text-2);width:32px">${m.label}</span>
          <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
            <div style="height:100%;background:var(--green);border-radius:3px;width:${pct}%;transition:width 0.4s"></div>
          </div>
          <span style="font-size:0.82rem;font-weight:700;color:var(--text);min-width:56px;text-align:right">${cal} kcal</span>
        </div>`;
    }).filter(Boolean).join('');

    calSumEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="text-align:center;background:var(--green-light);border-radius:12px;padding:12px 6px">
          <div style="font-size:0.65rem;color:var(--muted);margin-bottom:4px">攝取</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--green);line-height:1">${intake}</div>
          <div style="font-size:0.62rem;color:var(--muted);margin-top:2px">kcal</div>
        </div>
        <div style="text-align:center;background:${burned ? 'var(--orange-light)' : '#F9FAFB'};border-radius:12px;padding:12px 6px">
          <div style="font-size:0.65rem;color:var(--muted);margin-bottom:4px">運動消耗</div>
          <div style="font-size:1.5rem;font-weight:800;color:${burned ? 'var(--orange)' : 'var(--muted)'};line-height:1">${burned > 0 ? '-' + burned : '—'}</div>
          <div style="font-size:0.62rem;color:var(--muted);margin-top:2px">${burned > 0 ? 'kcal' : '未記錄'}</div>
        </div>
        <div style="text-align:center;background:${over ? '#FEF2F2' : 'var(--blue-light)'};border-radius:12px;padding:12px 6px">
          <div style="font-size:0.65rem;color:var(--muted);margin-bottom:4px">淨攝取</div>
          <div style="font-size:1.5rem;font-weight:800;color:${over ? 'var(--red)' : 'var(--blue)'};line-height:1">${net}</div>
          <div style="font-size:0.62rem;color:var(--muted);margin-top:2px">kcal</div>
        </div>
      </div>
      ${mealRows ? `<div style="margin-bottom:10px">${mealRows}</div>` : '<div style="text-align:center;padding:8px 0;font-size:0.82rem;color:var(--muted)">今天還沒有飲食記錄</div>'}
      <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-top:6px">
        <span style="color:var(--muted)">每日目標 ${goal} kcal</span>
        <span style="font-weight:700;color:${over ? 'var(--red)' : 'var(--green)'}">
          ${over ? `超出 ${diff} kcal` : (net === 0 ? '尚未記錄' : `還差 ${diff} kcal`)}
        </span>
      </div>`;
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
              <div class="food-meta">${esc(f.amount)}${esc(f.unit)} · P ${Math.round(f.protein)}g${f.calories>0?'('+Math.round(f.protein*4/f.calories*100)+'%)':''} · C ${Math.round(f.carbs)}g${f.calories>0?'('+Math.round(f.carbs*4/f.calories*100)+'%)':''} · F ${Math.round(f.fat)}g${f.calories>0?'('+Math.round(f.fat*9/f.calories*100)+'%)':''}</div>
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

function openFoodDatePicker() {
  const inp = document.getElementById('fl-date-input');
  if (!inp) return;
  inp.max   = todayStr();
  inp.value = currentFoodDate;
  try { inp.showPicker(); } catch { inp.click(); }
}

function pickFoodDate(val) {
  if (!val || val > todayStr()) return;
  currentFoodDate = val;
  renderFoodLog();
}

function renderFoodLog() {
  const labelEl = document.getElementById('fl-date-label');
  if (labelEl) labelEl.textContent = foodDateLabel(currentFoodDate);

  const meals   = getMeals(currentFoodDate);
  const flMeals = document.getElementById('fl-meals');
  if (flMeals) flMeals.innerHTML = renderMealsHTML(meals, true);

  const sum    = getSummary(currentFoodDate);
  const goal   = DB.getSettings().calorie_goal;
  const diff   = Math.round(sum.calories) - goal;
  const totalEl = document.getElementById('fl-total');
  if (totalEl) {
    const diffText = sum.calories === 0 ? '' :
      diff > 0  ? `<span style="color:var(--orange);font-size:0.75rem;margin-left:6px">超過 ${diff} kcal</span>` :
      diff < 0  ? `<span style="color:var(--green);font-size:0.75rem;margin-left:6px">還差 ${-diff} kcal</span>` :
                  `<span style="color:var(--green);font-size:0.75rem;margin-left:6px">✓ 剛好達標</span>`;
    totalEl.innerHTML = `${Math.round(sum.calories)} kcal${diffText}`;
  }

  renderRecentFoods();
}

function setActiveMeal(mt) {
  activeMeal = mt;
  document.querySelectorAll('.chip[data-meal]').forEach(c =>
    c.classList.toggle('active', c.dataset.meal === mt));
  const si = document.getElementById('foodSearch');
  if (si) si.focus();
}

function boldMatch(text, q) {
  if (!q) return esc(text);
  const idx = text.indexOf(q);
  if (idx >= 0) {
    return esc(text.slice(0, idx)) +
      '<strong style="color:var(--green)">' + esc(text.slice(idx, idx + q.length)) + '</strong>' +
      esc(text.slice(idx + q.length));
  }
  return esc(text);
}

const NUTRITION_KEYWORDS = {
  '低卡':   info => info.calories < 100,
  '低熱量': info => info.calories < 100,
  '高蛋白': info => info.protein >= 20,
  '低脂':   info => info.fat <= 3,
  '低碳水': info => info.carbs <= 10,
  '減醣':   info => info.carbs <= 20,
  '生酮':   info => info.carbs <= 5 && info.fat >= 10,
  '素食':   info => info.protein < 15 && info.fat < 10 && info.calories < 200,
};

function foodScore(name, q) {
  if (name === q)           return 100;
  if (name.startsWith(q))  return 85;
  if (name.includes(q))    return 70;
  // score by how many unique query characters appear in the food name
  const chars  = [...new Set(q.split(''))];
  const matched = chars.filter(ch => name.includes(ch)).length;
  if (matched === 0) return 0;
  return Math.round((matched / chars.length) * 40);
}

function doSearch(q) {
  q = q.trim();
  const box   = document.getElementById('searchResults');
  const input = document.getElementById('foodSearch');
  if (!q) { box.classList.remove('show'); return; }

  const nutFilter = NUTRITION_KEYWORDS[q];
  const entries   = Object.entries(FOOD_DB);

  // Collect canonical names from aliases that match the query
  const qLow = q.toLowerCase();
  const aliasTargets = new Set();
  for (const [alias, canonical] of Object.entries(FOOD_ALIASES)) {
    if (alias.toLowerCase().includes(qLow) || qLow.includes(alias.toLowerCase())) {
      aliasTargets.add(canonical);
    }
  }

  if (nutFilter) {
    searchCache = entries
      .filter(([, info]) => nutFilter(info))
      .sort((a, b) => a[1].calories - b[1].calories)
      .map(([name, info]) => ({ name, ...info }))
      .slice(0, 15);
  } else {
    searchCache = entries
      .map(([name, info]) => {
        let score = foodScore(name, q);
        if (aliasTargets.has(name)) score = Math.max(score, 80);
        return { name, score, ...info };
      })
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score || a.name.length - b.name.length)
      .slice(0, 15);
  }

  if (!searchCache.length) {
    fetchOnlineFoods(q, box, input);
    return;
  }

  const rect = input.getBoundingClientRect();
  box.style.top   = (rect.bottom + 6) + 'px';
  box.style.left  = rect.left + 'px';
  box.style.width = rect.width + 'px';

  box.innerHTML = searchCache.map((f, i) => {
    const srv = FOOD_SERVING[f.name];
    const srvTag = srv
      ? `<span style="color:var(--green,#22C55E);font-weight:600">${srv.label}</span> · ${srv.amt}g · `
      : '';
    return `
    <div class="result-item" onclick="selectFoodByIdx(${i})">
      <div>
        <div class="result-name">${boldMatch(f.name, q)}</div>
        <div class="result-info">${srvTag}蛋白 ${f.protein}g · 碳水 ${f.carbs}g · 脂肪 ${f.fat}g</div>
      </div>
      <div class="result-cal">${f.calories} kcal</div>
    </div>`;
  }).join('');
  box.classList.add('show');
}

async function fetchOnlineFoods(q, box, input) {
  const rect = input.getBoundingClientRect();
  box.style.top   = (rect.bottom + 6) + 'px';
  box.style.left  = rect.left + 'px';
  box.style.width = rect.width + 'px';
  box.innerHTML = `<div class="result-item" style="justify-content:center;color:var(--muted);font-size:0.85rem">🌐 線上搜尋中…</div>`;
  box.classList.add('show');
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms=${encodeURIComponent(q)}&json=1&page_size=10&fields=product_name,nutriments`;
    const res = await fetch(url);
    const data = await res.json();
    const products = (data.products || []).filter(p =>
      p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] >= 0
    ).slice(0, 8);
    if (!products.length) {
      box.innerHTML = `<div class="result-item" style="justify-content:center;color:var(--muted);font-size:0.85rem">找不到「${q}」相關食物</div>`;
      return;
    }
    searchCache = products.map(p => ({
      name:     p.product_name.length > 35 ? p.product_name.substring(0, 35) + '…' : p.product_name,
      calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
      protein:  Math.round((p.nutriments['proteins_100g']       || 0) * 10) / 10,
      carbs:    Math.round((p.nutriments['carbohydrates_100g']  || 0) * 10) / 10,
      fat:      Math.round((p.nutriments['fat_100g']            || 0) * 10) / 10,
    }));
    box.innerHTML =
      `<div style="padding:5px 12px;font-size:0.7rem;color:var(--muted);border-bottom:1px solid var(--border)">🌐 線上搜尋結果（數值僅供參考）</div>` +
      searchCache.map((f, i) => `
        <div class="result-item" onclick="selectFoodByIdx(${i})">
          <div>
            <div class="result-name">${f.name}</div>
            <div class="result-info">蛋白 ${f.protein}g · 碳水 ${f.carbs}g · 脂肪 ${f.fat}g <span style="font-size:0.7rem">/100g</span></div>
          </div>
          <div class="result-cal">${f.calories} kcal</div>
        </div>`).join('');
    box.classList.add('show');
  } catch {
    box.innerHTML = `<div class="result-item" style="justify-content:center;color:var(--muted);font-size:0.85rem">線上搜尋失敗，請確認網路</div>`;
  }
}

function _srvUnit(label) {
  // extract unit word from labels like "1碗","1杯(大)","約10顆","半碗","½個","1人份"
  const clean = label.replace(/^[約约半½¼\s]*/, '');
  const m = clean.match(/[0-9]+(?:[.\-\/][0-9]+)?\s*([^\d(（(）)]+)/) ||
            clean.match(/^([^\d(（(）)0-9]+)/);
  return m ? m[1].trim() || '份' : '份';
}

function selectFoodByIdx(i) {
  selectedFood = searchCache[i];
  document.getElementById('searchResults').classList.remove('show');
  document.getElementById('foodSearch').value = selectedFood.name;
  document.getElementById('modalFoodName').textContent = selectedFood.name;
  document.getElementById('modalCal').textContent = selectedFood.calories;
  const srv = FOOD_SERVING[selectedFood.name];
  const defaultAmt = srv ? srv.amt : 100;
  document.getElementById('modalAmt').value = defaultAmt;
  const hint = document.getElementById('modalSrvHint');
  if (hint) hint.textContent = srv ? `常見份量：${srv.label}（${srv.amt}g）` : '';
  const btnsEl = document.getElementById('modalServingBtns');
  if (btnsEl) {
    if (srv) {
      btnsEl.style.display = 'flex';
      const unit = _srvUnit(srv.label);
      btnsEl.innerHTML = [['½', 0.5], ['1', 1], ['1.5', 1.5], ['2', 2]].map(([label, mult]) => {
        const a = Math.round(srv.amt * mult);
        return `<button type="button" onclick="document.getElementById('modalAmt').value=${a};updateModalCalc();document.querySelectorAll('.srv-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')" class="srv-btn${mult === 1 ? ' active' : ''}" style="flex:1;padding:7px 2px;font-size:0.78rem;font-weight:700;background:#F0FDF4;border:1.5px solid var(--green);border-radius:8px;cursor:pointer;color:var(--green-dark);text-align:center;line-height:1.3">${label}${unit}<br><span style="font-size:0.65rem;color:var(--muted);font-weight:400">${a}g</span></button>`;
      }).join('');
    } else {
      btnsEl.style.display = 'none';
      btnsEl.innerHTML = '';
    }
  }
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
  const amt = parseFloat(document.getElementById('modalAmt').value);
  if (!amt || amt <= 0) { showToast('請輸入有效份量（大於 0）'); return; }
  const r   = amt / 100;
  DB.addFood({
    date: currentFoodDate, meal_type: activeMeal,
    food_name: selectedFood.name, amount: amt, unit: 'g',
    calories: selectedFood.calories * r,
    protein:  selectedFood.protein  * r,
    carbs:    selectedFood.carbs    * r,
    fat:      selectedFood.fat      * r,
  });
  _saveRecentFood(selectedFood);
  closeModal();
  document.getElementById('foodSearch').value = '';
  showToast(`✅ 已加入${MEAL_META.find(m => m.id === activeMeal)?.label || ''}`);
  renderFoodLog();
  if (document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
}

let _recentFoodsCache = null;
function _getRecentFoods() {
  if (!_recentFoodsCache) _recentFoodsCache = JSON.parse(localStorage.getItem('nm_recent_foods') || '[]');
  return _recentFoodsCache;
}
function _saveRecentFood(food) {
  const recent = _getRecentFoods();
  const idx = recent.findIndex(f => f.name === food.name);
  if (idx >= 0) recent.splice(idx, 1);
  recent.unshift({ name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat });
  _recentFoodsCache = recent.slice(0, 10);
  localStorage.setItem('nm_recent_foods', JSON.stringify(_recentFoodsCache));
}
function renderRecentFoods() {
  const el = document.getElementById('recentFoodsWrap');
  if (!el) return;
  const recent = _getRecentFoods();
  if (!recent.length) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `<div style="font-size:0.78rem;font-weight:700;color:var(--muted);margin-bottom:8px"><i class="bi bi-clock-history"></i> 最近吃過</div>`
    + `<div style="display:flex;flex-wrap:wrap;gap:6px">`
    + recent.map((f, i) => `<button class="recent-chip" onclick="quickAddRecent(${i})">${esc(f.name)}</button>`).join('')
    + `</div>`;
}
function quickAddRecent(i) {
  const f = _getRecentFoods()[i];
  if (!f) return;
  selectedFood = f;
  const srv = FOOD_SERVING[f.name];
  const defaultAmt = srv ? srv.amt : 100;
  document.getElementById('modalFoodName').textContent = f.name;
  document.getElementById('modalCal').textContent = f.calories;
  document.getElementById('modalAmt').value = defaultAmt;
  const hint = document.getElementById('modalSrvHint');
  if (hint) hint.textContent = srv ? `常見份量：${srv.label}（${srv.amt}g）` : '';
  const btnsEl = document.getElementById('modalServingBtns');
  if (btnsEl) {
    if (srv) {
      btnsEl.style.display = 'flex';
      const unit2 = _srvUnit(srv.label);
      btnsEl.innerHTML = [['½', 0.5], ['1', 1], ['1.5', 1.5], ['2', 2]].map(([label, mult]) => {
        const a = Math.round(srv.amt * mult);
        return `<button type="button" onclick="document.getElementById('modalAmt').value=${a};updateModalCalc();document.querySelectorAll('.srv-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')" class="srv-btn${mult === 1 ? ' active' : ''}" style="flex:1;padding:7px 2px;font-size:0.78rem;font-weight:700;background:#F0FDF4;border:1.5px solid var(--green);border-radius:8px;cursor:pointer;color:var(--green-dark);text-align:center;line-height:1.3">${label}${unit2}<br><span style="font-size:0.65rem;color:var(--muted);font-weight:400">${a}g</span></button>`;
      }).join('');
    } else {
      btnsEl.style.display = 'none';
    }
  }
  updateModalCalc();
  document.getElementById('foodModal').classList.remove('hidden');
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
let scanOriginals   = [];
let scanImageBase64 = null;
let scanMediaType   = 'image/jpeg';
let scanMealType    = 'lunch';

function openPhotoScan() {
  scanMealType = activeMeal;
  document.getElementById('photoModal').classList.remove('hidden');
  scanResults     = [];
  scanOriginals   = [];
  scanImageBase64 = null;
  document.getElementById('scanDrop').style.display         = 'block';
  document.getElementById('scanPreviewWrap').style.display  = 'none';
  document.getElementById('scanAnalyzeBtn').style.display   = 'none';
  document.getElementById('scanResultsWrap').style.display  = 'none';
  _updateScanMealBtns();
}

function setScanMeal(meal) {
  scanMealType = meal;
  _updateScanMealBtns();
}

function _updateScanMealBtns() {
  document.querySelectorAll('.scan-meal-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.meal === scanMealType);
  });
}

function closePhotoScan() {
  document.getElementById('photoModal').classList.add('hidden');
  document.getElementById('photoCameraInput').value = '';
  document.getElementById('photoLibInput').value = '';
}

function triggerPhotoCamera() {
  document.getElementById('photoCameraInput').click();
}

function triggerPhotoLibrary() {
  document.getElementById('photoLibInput').click();
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

function matchBraces(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function extractJSON(text) {
  // strip markdown code fence first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const src = fenceMatch ? fenceMatch[1] : text;
  const start = src.indexOf('{');
  if (start === -1) return null;
  const end = matchBraces(src, start);
  if (end === -1) return null;
  return src.slice(start, end + 1);
}

function _showAskUserHint(reason) {
  document.getElementById('scanResultsContent').innerHTML = `
    <div style="padding:16px 4px">
      <div style="text-align:center;margin-bottom:14px">
        <i class="bi bi-question-circle" style="font-size:2.2rem;color:var(--muted);display:block;margin-bottom:8px"></i>
        <div style="font-size:0.9rem;font-weight:600">AI 無法確定這是什麼食物</div>
        <div style="font-size:0.75rem;color:var(--muted);margin-top:4px">描述一下，AI 會重新幫你辨識</div>
      </div>
      <input type="text" id="userFoodHint" class="form-input"
        placeholder="例：炸銀魚、竹輪、天婦羅便當..."
        style="width:100%;box-sizing:border-box;margin-bottom:10px;padding:10px;font-size:0.9rem"
        onkeydown="if(event.key==='Enter'){const v=this.value.trim();if(v)analyzePhoto(v);}">
      <button class="btn-primary" style="width:100%;justify-content:center"
        onclick="const v=document.getElementById('userFoodHint').value.trim();if(v)analyzePhoto(v);else document.getElementById('userFoodHint').focus();">
        <i class="bi bi-stars"></i> 告訴 AI 重新辨識
      </button>
    </div>`;
  document.getElementById('userFoodHint').focus();
}

async function analyzePhoto(userHint = '') {
  const s      = DB.getSettings();
  const apiKey = s.gemini_api_key;
  if (!apiKey || apiKey.length < 20) {
    showToast('請先在設定頁面填入 Gemini API 金鑰');
    closePhotoScan();
    navigate('settings');
    return;
  }
  if (!scanImageBase64) return;

  const btn = document.getElementById('scanAnalyzeBtn');
  btn.disabled  = true;
  btn.innerHTML = '<div style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;vertical-align:middle;margin-right:6px"></div>AI 分析中…';
  document.getElementById('scanResultsWrap').style.display  = 'block';
  document.getElementById('scanResultsContent').innerHTML   =
    '<div class="spinner"></div><div style="text-align:center;font-size:0.82rem;color:var(--muted);margin-top:10px">AI 正在辨識食物…</div>';

  const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro-latest',
  ];
  const _sysTxt =
    'You are an elite-level nutritionist, registered dietitian, and food analyst with 20+ years of expertise in Asian cuisines — especially Taiwanese home cooking, night market street food, Japanese cuisine, Korean cuisine, Chinese regional dishes, and Western fast food. ' +
    'You have encyclopedic knowledge of the USDA food database, Taiwan TFDA food composition tables, Japan MEXT nutrient database, and Korea NFRI food database. ' +
    'You can identify foods from visual cues including color, texture, sauce sheen, steam, container type, and cultural presentation style. ' +
    'You NEVER refuse or say you cannot identify food. You always provide your best nutritional estimate based on visual evidence and culinary expertise. ' +
    'You understand that accurate food logging helps people manage their health, so you take every analysis seriously and are as precise as possible.';

  // v1beta supports system_instruction; v1 does not — prepend to user content instead
  const _buildBody = (useSysField, userText) => JSON.stringify(useSysField ? {
    system_instruction: { parts: [{ text: _sysTxt }] },
    contents: [{ parts: [{ inline_data: { mime_type: scanMediaType, data: scanImageBase64 } }, { text: userText }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
  } : {
    contents: [{ parts: [{ inline_data: { mime_type: scanMediaType, data: scanImageBase64 } }, { text: _sysTxt + '\n\n' + userText }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
  });

  const _geminiUserText = (
          'Carefully analyze this food photo and return complete nutritional information.\n\n' +

          '━━ STEP 1: VISUAL SCAN ━━\n' +
          'Examine the ENTIRE image:\n' +
          '• Container: 便當盒/碗/盤/袋/紙杯/塑膠杯/鐵鍋/砂鍋/包裝袋/紙盒\n' +
          '• ★ LABELS & STICKERS: Read ANY text on cups, bags, boxes, wrappers — brand name, drink name, sugar level sticker, size sticker, nutritional panel\n' +
          '• Cooking evidence: oil sheen=炒/炸, dark glaze=滷/紅燒/蜜汁, steam=蒸, grill marks=烤, pale/translucent=燙/水煮\n' +
          '• All food including small sides, sauces, garnishes, toppings, condiments\n\n' +

          '━━ STEP 2: DECOMPOSE INTO INDIVIDUAL ITEMS ━━\n' +
          'ALWAYS split complex meals. NEVER lump different foods.\n\n' +
          '便當/Bento → 白飯 + each protein + each veg side + egg + sauce (3–7 entries)\n' +
          '自助餐/合菜 → each dish separately\n' +
          '早餐組合 → 蛋餅, 土司, 荷包蛋, 豆漿 all separate\n' +
          '湯麵 → 麵條 + 湯底 + each topping separately\n' +
          '火鍋 → each ingredient separately (肉/菜/豆腐/貢丸/麵)\n' +
          '壽司 → each roll type/nigiri separately\n' +
          '漢堡套餐 → 漢堡 + 薯條 + 飲料 (3 entries)\n' +
          '炒飯/炒麵 → ONE entry only if fully mixed and inseparable\n\n' +

          '━━ STEP 3: BEVERAGE LABEL READING (PRIORITY) ━━\n' +
          'If a DRINK CUP is in the image, look for:\n\n' +
          '[Sugar level sticker — calorie multiplier]\n' +
          '  全糖(100%) → use 100% of base calories\n' +
          '  少糖(70%) / 七分糖 → ×0.82 (sugar -30%, but base syrup system varies)\n' +
          '  半糖(50%) → ×0.70\n' +
          '  微糖(25%) / 三分糖 → ×0.55\n' +
          '  無糖(0%) / 去糖 → ×0.35 (milk/cream still has calories)\n\n' +
          '[Size sticker]\n' +
          '  大杯(L/XL): 700ml | 中杯(M): 500ml | 小杯(S): 350ml\n\n' +
          '[Brand recognition — Taiwan bubble tea chains]\n' +
          '  五十嵐(50嵐): 招牌珍珠奶茶大全糖≈580kcal | 四季春茶大全糖≈220kcal\n' +
          '  清心福全: 珍珠奶茶大全糖≈530kcal | 冬瓜珍珠大全糖≈480kcal\n' +
          '  CoCo都可: 珍珠奶茶大全糖≈580kcal | 芋頭奶茶大全糖≈600kcal\n' +
          '  茶湯會: 珍珠鮮奶茶大全糖≈620kcal | 烏龍鮮奶大全糖≈420kcal\n' +
          '  一芳水果茶: 台灣水果茶大全糖≈320kcal | 波霸鮮奶大全糖≈540kcal\n' +
          '  春水堂: 珍珠奶茶大全糖≈650kcal | 四季春大全糖≈240kcal\n' +
          '  迷客夏: 嚴選鮮乳茶大全糖≈420kcal | 百香果綠茶大全糖≈340kcal\n' +
          '  珍煮丹: 黑糖珍珠鮮奶大≈580kcal\n' +
          '  老虎堂: 黑糖虎紋鮮奶茶大≈600kcal\n' +
          '  COMEBUY: 珍珠奶茶大全糖≈560kcal\n' +
          '  貢茶(Gong cha): 珍珠奶蓋茶大全糖≈550kcal\n' +
          '  鶴茶樓: 波霸奶茶大全糖≈520kcal\n' +
          '  茶之魔手: 珍珠奶茶大全糖≈500kcal\n' +
          '  大苑子: 仙草奶凍大全糖≈480kcal\n' +
          '  翰林茶館: 泡泡奶茶大全糖≈540kcal\n' +
          '  快可立: 珍珠奶茶大全糖≈480kcal\n' +
          '  共茶: 烏龍珍珠大全糖≈480kcal\n\n' +
          '[Common drink calorie anchors — large cup 700ml, full sugar]\n' +
          '  純珍珠奶茶(紅茶底): 480kcal, p5, c90, f10\n' +
          '  純珍珠鮮奶茶: 580kcal, p10, c95, f13\n' +
          '  黑糖珍珠鮮奶: 590kcal, p10, c98, f13\n' +
          '  芋頭珍珠鮮奶: 610kcal, p10, c102, f14\n' +
          '  烏龍奶茶(無珍珠): 360kcal, p5, c65, f8\n' +
          '  綠茶(全糖無珍珠): 220kcal, p0, c55, f0\n' +
          '  四季春(全糖無珍珠): 220kcal, p0, c55, f0\n' +
          '  愛玉檸檬(全糖): 280kcal, p1, c70, f0\n' +
          '  冬瓜茶(全糖700ml): 245kcal, p0, c61, f0\n' +
          '  水果茶(全糖700ml): 280kcal, p1, c69, f0\n' +
          '  木瓜牛奶(700ml): 420kcal, p12, c72, f9\n\n' +

          '━━ STEP 4: PRECISE FOOD IDENTIFICATION ━━\n' +
          'BAD: 肉/蔬菜/飯/麵/雞/魚  GOOD: 三層肉(紅燒)/炒高麗菜/白飯/陽春麵/雞腿排(炸)\n\n' +

          '[COOKING METHODS]\n' +
          '  炸/酥炸/天婦羅: +50–70% kcal | 氣炸: +15–25% | 炒: +20–30%\n' +
          '  煎/香煎: +25–35% | 燒烤/炭烤: +5–10% | 乾煎: +15–20%\n' +
          '  滷/紅燒: +10–20% | 蜜汁/糖醋: +20–30% | 蒸: +0–5%\n' +
          '  燙/水煮: base | 涼拌: +5–15% | 醃漬: base\n\n' +

          '[台灣料理 Taiwanese]\n' +
          '主食: 白飯/糙米飯/五穀飯/紫米飯/油飯/筒仔米糕/碗粿/米糕/粥(稀飯)\n' +
          '      蚵仔麵線/米粉湯/冬粉/肉焿麵/陽春麵/板條/粄條/意麵/油麵\n' +
          '      烏龍麵/細麵/拉麵/米粉(炒/湯)/冬粉(炒/湯)\n' +
          '      水餃/鍋貼/蒸餃/湯包/小籠包/鮮肉湯圓\n' +
          '便當主菜: 雞腿排(炸/烤)/雞胸排/排骨(炸/糖醋)/豬排/魚排\n' +
          '          三層肉(滷/紅燒)/控肉/焢肉/東坡肉/虱目魚/鮭魚/鯖魚\n' +
          '          煎魚/清蒸魚/蒸蛋/荷包蛋/滷豆腐/炸豆腐\n' +
          '便當配菜: 炒高麗菜/炒青江菜/炒空心菜/燙青花菜/炒豆芽菜\n' +
          '          炒絲瓜/炒茄子/炒四季豆/炒地瓜葉/炒韭菜/炒韭黃\n' +
          '          炒蒜苗/炒甜椒/炒洋蔥/炒蘑菇/炒杏鮑菇\n' +
          '          玉米段/燙菠菜/燙秋葵/醃蘿蔔/梅子/酸菜/豆干(滷)\n' +
          '蛋豆腐: 荷包蛋/滷蛋/溏心蛋/茶葉蛋/炒蛋/蒸蛋/皮蛋/鹹蛋/玉子燒\n' +
          '        嫩豆腐/板豆腐/百頁豆腐/臭豆腐/炸豆腐/凍豆腐/豆皮\n' +
          '加工品: 貢丸/魚丸/燕餃/豬血糕/米腸/香腸/黑輪/甜不辣/魚板/蟹肉棒\n' +
          '        竹輪/炸竹輪/銀魚/炸銀魚/小銀魚/旗魚丸/花枝丸/蟹味棒/蝦餃/魚餃/燕餃\n' +
          '早餐店: 蛋餅(原味/起司/鮪魚/培根/玉米/總匯)\n' +
          '        蘿蔔糕(煎)/芋頭糕(煎)/燒餅/油條/燒餅油條/蔥花卷\n' +
          '        厚片吐司/薄片土司/法式厚片/奶油厚片/花生厚片/草莓厚片\n' +
          '        鮪魚三明治/火腿三明治/BLT三明治/總匯三明治/蛋沙拉三明治\n' +
          '        饅頭/饅頭夾蛋/肉包/菜包/奶黃包/紅豆包\n' +
          '        漢堡(早餐型)/吐司夾蛋/蔥抓餅(加蛋)\n' +
          '夜市小吃: 鹽酥雞/雞排/炸雞腿/炸雞翅/炸蝦/炸花枝\n' +
          '          雞蛋糕/章魚燒/蚵仔煎/蔥油餅(加蛋)/肉圓/碗粿\n' +
          '          大腸包小腸/甜甜圈/臭豆腐(清蒸/油炸)/滷味拼盤\n' +
          '          糖葫蘆/花生捲冰淇淋/雪花冰/刨冰/愛玉冰/仙草凍\n' +
          '          滷豬腳/滷大腸/滷豆干/滷海帶/滷蛋/滷鴨翅\n' +
          '          燒烤串(雞心/雞皮/豬舌/豬排/蝦子/玉米)\n' +
          '小吃湯品: 貢丸湯/魚丸湯/餛飩湯/酸辣湯/蛤蜊湯/蚵仔湯\n' +
          '          土魠魚羹飯/土魠魚羹/魚羹飯/魚羹湯\n' +
          '          薑母鴨/羊肉爐/麻油雞/當歸鴨/薑黃雞湯\n' +
          '          苦瓜排骨湯/玉米排骨湯/蘿蔔排骨湯/四神湯\n' +
          '台式甜湯: 紅豆湯/綠豆湯/花生湯/芋泥湯/湯圓(甜/鹹)\n' +
          '          紅豆紫米粥/蓮子湯/桂圓紅棗湯/燒仙草\n' +
          '海鮮: 清蒸蛤蜊/蒜蒸蛤蜊/炒蛤蜊/烤蛤蜊\n' +
          '      白灼蝦/蒜泥白蝦/炒蝦仁/炸蝦\n' +
          '      清蒸魚/紅燒魚/煎魚/烤魚/魚羹\n' +
          '      花枝/透抽/小卷/烤花枝/炒花枝\n' +
          '      螃蟹(清蒸/薑蔥炒)/龍蝦\n\n' +

          '[日式料理 Japanese]\n' +
          '丼飯: 牛丼/親子丼/豬排丼/鰻魚丼/海鮮丼/天丼/鮭魚丼/鮪魚丼/納豆丼\n' +
          '定食: 炸豬排定食/烤魚定食/唐揚炸雞定食/生魚片定食/燒肉定食\n' +
          '拉麵: 豚骨拉麵/醬油拉麵/鹽味拉麵/味噌拉麵/沾麵/擔擔麵\n' +
          '烏龍: 釜玉烏龍/力丸烏龍/咖哩烏龍/炸物烏龍/冷烏龍\n' +
          '壽司: 鮭魚握/鮪魚握/鰻魚握/玉子燒握/干貝握/海膽軍艦/鮭魚卵軍艦\n' +
          '      鮪魚細卷/小黃瓜卷/納豆卷/花壽司/裏卷(加州卷)/手捲\n' +
          '燒肉: 牛五花(燒肉)/牛舌/豬五花(燒肉)/雞腿肉(燒肉)/蔥鹽雞皮\n' +
          '居酒屋: 唐揚炸雞/枝豆/冷豆腐/炸薯條/串燒(雞腿/雞皮/雞心)\n' +
          '        玉子燒/茶碗蒸/章魚燒/天婦羅/炸雞翅/烤飯糰\n' +
          '其他: 味噌湯/海帶芽味噌湯/豚汁/茶碗蒸/和風沙拉/芝麻菠菜\n' +
          '      日式炸豬排/炸蝦/炸牡蠣/炸帆立貝/日式咖哩飯\n\n' +

          '[韓式料理 Korean]\n' +
          '主食: 白飯/石鍋拌飯/泡菜炒飯/紫菜包飯/韓式冷麵/炒年糕/炸醬麵\n' +
          '      鍋巴湯飯/石鍋紫菜湯飯\n' +
          '鍋類: 泡菜鍋/部隊鍋/嫩豆腐鍋/大醬湯/海帶湯/豆芽湯/辣魚湯(海鮮辣鍋)\n' +
          '烤肉: 烤五花肉(三겹살)/烤牛肉(불고기)/烤牛小排/烤雞腿肉/烤豬頸肉\n' +
          '炸雞: 韓式炸雞(原味/甜辣醬/蒜奶油/帕馬森)/炸雞翅/炸雞塊\n' +
          '小菜(반찬): 泡菜/涼拌黃豆芽/涼拌菠菜/涼拌蘿蔔絲/韓式煎蛋\n' +
          '            煎泡菜餅(김치전)/煎蔥餅/烤海苔/糖醋豬肉(탕수육)\n\n' +

          '[中式料理 Chinese]\n' +
          '北方: 北京烤鴨/餃子/鍋貼/小籠包/包子/饅頭/刀削麵/炸醬麵/羊肉泡饃/蔥油餅\n' +
          '川菜: 麻婆豆腐/宮保雞丁/魚香肉絲/回鍋肉/水煮魚/水煮牛肉\n' +
          '      夫妻肺片/紅油抄手/辣子雞/口水雞/剁椒魚頭\n' +
          '粵菜: 白切雞/鹽焗雞/燒鵝/燒鴨/叉燒/蜜汁叉燒/脆皮燒肉\n' +
          '      清蒸魚/蒸排骨/薑蔥炒蟹/避風塘炒蟹\n' +
          '港式點心: 蝦餃/燒賣(豬肉/蟹肉)/叉燒包(烤/蒸)/流沙包\n' +
          '          蛋撻(港式/葡式)/腸粉/蘿蔔糕/芋頭糕/馬蹄糕\n' +
          '          糯米雞/春卷/咸水角/炸芋頭/馬拉糕/椰汁糕/砵仔糕\n' +
          '家常菜: 番茄炒蛋/青椒肉絲/糖醋排骨/糖醋裡脊/紅燒獅子頭\n' +
          '        梅菜扣肉/東坡肉/蒜泥白肉/蔥爆牛肉/乾煸四季豆\n' +
          '        地三鮮/酸辣湯/西湖牛肉羹/冬瓜排骨湯\n' +
          '        木須肉/魚香茄子/乾燒蝦仁/蠔油牛肉/薑絲炒大腸\n\n' +

          '[東南亞 Southeast Asian]\n' +
          '泰式: 泰式打拋豬飯/泰式綠咖喱飯/泰式紅咖喱飯/冬蔭功湯\n' +
          '      泰式炒河粉(Pad Thai)/芒果糯米飯/泰式奶茶/涼拌青木瓜\n' +
          '      月亮蝦餅/炸春卷/豬頸肉沙拉\n' +
          '越式: 越南河粉(牛肉/雞肉)/越式春卷(鮮/炸)/越南法式麵包\n' +
          '      越式牛肉丸/越南咖啡(滴漏)\n' +
          '其他: 印度香料飯(Biryani)/印度烤雞(Tandoori)/咖喱角\n' +
          '      馬來叻沙/印尼炒飯(Nasi Goreng)/海南雞飯/沙嗲串燒\n' +
          '      泰式煎雞蛋/菠蘿炒飯\n\n' +

          '[西式料理 Western]\n' +
          '速食麥當勞: 大麥克/雙層牛肉堡/麥辣雞腿堡/麥香雞/麥脆雞/麥克雞塊(6/9/20塊)\n' +
          '           薯條(小/中/大)/薯餅/麥當勞冰炫風/麥當勞聖代\n' +
          '速食肯德基: 原味炸雞腿/辣味炸雞腿/脆皮炸雞/香辣雞腿堡\n' +
          '           爆漿雞腿堡/勁辣雞腿堡/玉米/薯條/蛋塔\n' +
          '速食其他: 漢堡王皇堡/Subway潛艇堡(6吋/12吋)\n' +
          '          必勝客披薩(一片)/達美樂披薩(一片)/拿坡里披薩\n' +
          '          摩斯漢堡/丹丹漢堡/Shake Shack\n' +
          '餐廳: 菲力牛排/沙朗牛排/肋眼牛排/T骨牛排/牛小排\n' +
          '      德國豬腳/羊排/烤雞腿/雞翅/培根\n' +
          '      奶油白醬義大利麵/番茄肉醬義大利麵/青醬義大利麵\n' +
          '      海鮮義大利麵/燉飯/焗烤\n' +
          '      凱薩沙拉/尼斯沙拉/科布沙拉/希臘沙拉/尼斯沙拉\n' +
          '烘焙麵包: 可頌/牛角麵包/貝果/恰巴達/佛卡夏/法國麵包\n' +
          '          菠蘿麵包/紅豆麵包/奶油麵包/克林姆麵包/肉鬆麵包\n' +
          '          巧克力麵包/起司麵包/全麥吐司/白吐司(一片)\n' +
          '甜點: 可頌/瑪德蓮/費南雪/磅蛋糕/戚風蛋糕/海綿蛋糕\n' +
          '      布朗尼/馬芬/司康/起司蛋糕/提拉米蘇/巧克力熔岩蛋糕\n' +
          '      泡芙/閃電泡芙/馬卡龍/達克瓦茲/法式可麗餅\n\n' +

          '[超商食品 Convenience Store]\n' +
          '7-11/全家/萊爾富/OK:\n' +
          '  三角飯糰: 鮭魚/鮪魚/梅子/雞肉/豬肉/海苔/明太子/起司\n' +
          '  御飯糰(圓): 一般圓型飯糰各種口味\n' +
          '  關東煮: 黑輪/貢丸/甜不辣/蛋/板豆腐/嫩豆腐/蘿蔔/玉米/海帶/豬血糕/龍蝦丸\n' +
          '  加熱食品: 茶葉蛋/燒烤雞翅/炸雞塊/雞排/熱狗/玉米熱狗\n' +
          '  鮮食: 超商便當/沙拉/三明治/涼麵/飯糰/炒麵\n' +
          '  泡麵: 統一滿漢大餐/泡麵王/維力炸醬麵/味王原汁牛肉麵\n' +
          '        日清杯麵/維他麵/出前一丁/農心辛拉麵\n' +
          '  零食餅乾: 波卡洋芋片/卡迪那/品客/樂事/多力多滋/Oreo\n' +
          '            乖乖/科學麵/王子麵/奶油獅/牛奶糖/小熊餅乾\n' +
          '  乳製品: 光泉鮮乳/統一鮮乳/LP33優酪乳/野餐優格/布丁/奶酪\n' +
          '  瓶裝飲料: 茶裏王/御茶園/黑松沙士/可口可樂/百事可樂\n' +
          '            FIN/舒跑/寶礦力/寶特瓶水\n\n' +

          '[甜點冰品 Desserts & Ice]\n' +
          '台式甜點: 麻糬/草仔粿/芋圓/湯圓(甜/鹹)/仙草凍/燒仙草\n' +
          '          粉圓/珍珠/芋頭西米露/紅豆牛奶\n' +
          '冰品: 芒果冰/草莓聖代/雪花冰(芒果/草莓/抹茶)/刨冰\n' +
          '      愛玉冰/粉條冰/豆花/杏仁豆腐/綠豆蒜\n' +
          '      霜淇淋/義式冰淇淋/冰棒/雪糕(巧克力/草莓)\n' +
          '      可愛多/夢時代/脆皮冰淇淋\n' +
          '西式甜點: 提拉米蘇/起司蛋糕/布丁/奶酪/芋泥球/泡芙\n' +
          '          巧克力熔岩蛋糕/可麗露/費南雪/瑪德蓮\n' +
          '巧克力/糖果: 巧克力棒(KitKat/Snickers/Twix)/軟糖/硬糖\n\n' +

          '[水果 Fruits]\n' +
          '台灣水果: 西瓜(1片)/芒果(1顆)/愛文芒果/土芒果/金煌芒果\n' +
          '          鳳梨(1片)/木瓜(半顆)/香蕉(1根)/蓮霧/楊桃/釋迦/百香果\n' +
          '          葡萄柚/文旦柚/茂谷柑/橘子/椪柑/桶柑/荔枝/龍眼/蓮霧\n' +
          '          芭樂(土芭樂/珍珠芭樂)/棗子/桃子/李子/梨子/枇杷\n' +
          '進口水果: 蘋果(富士/青蘋果)/橙子/葡萄(巨峰/麝香)/草莓\n' +
          '          藍莓/覆盆子/奇異果/榴槤/山竹/紅毛丹/火龍果\n' +
          '          哈密瓜/水蜜桃/車厘子(櫻桃)/葡萄乾/蔓越莓乾\n\n' +

          '[堅果種子 Nuts & Seeds]\n' +
          '  杏仁/腰果/核桃/花生/開心果/夏威夷豆/松子/榛果\n' +
          '  南瓜子/葵花子/芝麻/奇亞籽/亞麻籽/堅果棒/混合堅果\n\n' +

          '[乳製品 Dairy]\n' +
          '  鮮奶/低脂牛奶/脫脂牛奶/豆漿/米漿/燕麥奶/杏仁奶\n' +
          '  希臘優格/無糖優格/含糖優格/起司片/cream cheese/茅屋起司\n' +
          '  鮮奶油/奶油/無鹽奶油\n\n' +

          '[健身飲食 Health & Fitness]\n' +
          '  水煮雞胸/舒肥雞胸/烤鮭魚/水煮蛋/白煮蛋\n' +
          '  希臘優格/無糖燕麥/燕麥粥/全麥吐司/地瓜(蒸)/南瓜(蒸)\n' +
          '  藜麥飯/花椰菜飯/酪梨/奇亞籽布丁\n' +
          '  乳清蛋白粉/蛋白棒(Quest/One Bar)/能量棒(KIND)\n' +
          '  無糖豆漿/無糖燕麥奶/蛋白質飲料/BCAA飲料\n\n' +

          '[酒精飲料 Alcohol]\n' +
          '  台灣啤酒(罐)/金牌啤酒/海尼根/科羅娜/麒麟一番搾\n' +
          '  紅酒(杯)/白酒(杯)/香檳(杯)/威士忌(shot)/高梁酒\n' +
          '  調酒: 長島冰茶/螺絲起子/血腥瑪麗/莫希托\n\n' +

          '━━ STEP 5: PORTION ESTIMATION REFERENCE ━━\n' +
          '[容器 Container sizes]\n' +
          '  標準便當盒: 白飯區160g | 主菜格100–130g | 副菜格50–70g each\n' +
          '  大型便當盒: 白飯200–250g | 主菜150g | 副菜各70g\n' +
          '  一般碗公: 飯250g / 湯麵含麵180g + 湯400ml\n' +
          '  小碗: 飯120g / 湯200ml\n' +
          '  標準盤子28cm: 主菜200g | 大餐廳盤: 300g\n' +
          '  免洗餐盒: 炒飯/炒麵400g\n' +
          '  超商三角飯糰: 100g | 超商便當: 白飯160g+配菜\n\n' +
          '[肉類 Proteins]\n' +
          '  便當雞腿排: 120g | 餐廳雞腿排: 200g\n' +
          '  排骨2塊: 100g | 魚排: 110g | 虱目魚一條: 200g\n' +
          '  三層肉(便當): 100g | 控肉: 150g | 叉燒3片: 60g\n' +
          '  豬排(餐廳): 200g | 牛排: 200g/300g/500g\n' +
          '  炸雞排: 160g | 鹽酥雞一份: 150g | 麥脆雞腿: 130g\n' +
          '  漢堡排: 100g | 熱狗: 50g | 香腸: 40g | 貢丸6顆: 90g\n' +
          '  蝦仁(便當): 60g | 花枝(便當): 80g | 透抽整隻: 150g\n' +
          '  蛤蜊一碗: 200g(殼重) / 80g肉\n\n' +
          '[主食 Starches]\n' +
          '  便當白飯: 160g | 碗公白飯: 250g | 小碗: 120g\n' +
          '  拉麵麵條: 180g | 烏龍麵: 200g | 蕎麥麵: 160g\n' +
          '  義大利麵(熟): 200g | 炒飯一盤: 400g\n' +
          '  水餃10顆: 200g | 蒸餃8顆: 160g | 小籠包6顆: 120g\n' +
          '  蛋餅: 120g | 燒餅: 80g | 油條: 60g | 厚片吐司: 60g\n' +
          '  饅頭: 100g | 肉包: 90g | 地瓜中型: 130g\n' +
          '  飯糰(超商三角): 100g | 海苔飯捲(一條): 200g\n\n' +
          '[蔬菜 Vegetables]\n' +
          '  炒青菜(便當格): 60g | 燙青菜(碗): 100g\n' +
          '  玉米半根: 80g | 玉米整根: 160g | 花椰菜(便當): 70g\n' +
          '  生菜沙拉一盤: 150g | 泡菜: 50g | 醃蘿蔔: 20g\n' +
          '  烤蔬菜一份: 120g | 番茄1顆: 120g | 小番茄10顆: 100g\n\n' +
          '[蛋 Eggs]\n' +
          '  荷包蛋1顆: 50g | 炒蛋2顆: 100g | 滷蛋: 60g\n' +
          '  溏心蛋: 60g | 茶葉蛋: 65g | 皮蛋: 65g\n\n' +
          '[飲料 Beverages]\n' +
          '  手搖飲大杯: 700ml | 中杯: 500ml | 小杯: 350ml\n' +
          '  美式咖啡大: 480ml | 拿鐵中: 480ml | 濃縮: 30ml\n' +
          '  豆漿袋裝: 350ml | 罐裝飲料: 330ml | 寶特瓶: 600ml\n' +
          '  啤酒罐: 330ml | 紅酒杯: 150ml | 白酒杯: 150ml\n' +
          '  鮮奶一盒: 240ml | 優酪乳: 230ml\n\n' +
          '[水果 Fruit portions]\n' +
          '  西瓜1片(三角): 300g(含皮) / 淨重200g | 芒果半顆: 150g\n' +
          '  香蕉1根: 120g | 蘋果中型: 180g | 橘子1顆: 130g\n' +
          '  葡萄10顆: 80g | 草莓10顆: 100g | 藍莓1杯: 140g\n\n' +

          '━━ STEP 6: NUTRITION CALIBRATION ANCHORS ━━\n' +
          '[主食]\n' +
          '  白飯160g: 262kcal, p5, c57, f0.4\n' +
          '  糙米飯160g: 248kcal, p5.5, c52, f1.6\n' +
          '  五穀飯160g: 242kcal, p6, c50, f2\n' +
          '  稀飯(粥)250g: 145kcal, p3, c32, f0.3\n' +
          '  拉麵麵條180g: 285kcal, p10, c55, f3\n' +
          '  烏龍麵200g: 210kcal, p7, c43, f1\n' +
          '  炒飯400g: 620kcal, p18, c88, f22\n' +
          '  水餃10顆200g: 380kcal, p16, c52, f12\n' +
          '  小籠包6顆120g: 310kcal, p14, c38, f10\n' +
          '  蛋餅120g: 255kcal, p10, c30, f10\n' +
          '  油條60g: 222kcal, p4, c28, f11\n' +
          '  燒餅80g: 230kcal, p7, c40, f5\n' +
          '  饅頭100g: 221kcal, p7, c46, f1\n' +
          '  地瓜130g: 117kcal, p2, c27, f0.1\n' +
          '  海苔飯捲200g: 340kcal, p8, c68, f4\n\n' +
          '[肉類]\n' +
          '  三層肉(滷)100g: 295kcal, p15, c4, f24\n' +
          '  控肉150g: 480kcal, p22, c8, f40\n' +
          '  脆皮燒肉100g: 380kcal, p18, c2, f33\n' +
          '  蜜汁叉燒100g: 268kcal, p21, c15, f12\n' +
          '  雞腿排(炸)120g: 310kcal, p26, c8, f20\n' +
          '  雞腿排(烤)120g: 222kcal, p28, c0, f11\n' +
          '  雞胸肉(水煮)150g: 165kcal, p35, c0, f2\n' +
          '  舒肥雞胸150g: 158kcal, p34, c0, f2\n' +
          '  雞排(炸)160g: 400kcal, p28, c18, f24\n' +
          '  唐揚炸雞100g: 270kcal, p20, c12, f16\n' +
          '  排骨(炸)100g: 285kcal, p18, c10, f18\n' +
          '  豬排(炸)200g: 480kcal, p36, c20, f28\n' +
          '  鮭魚(煎)150g: 280kcal, p30, c0, f17\n' +
          '  虱目魚肚(煎)150g: 240kcal, p24, c1, f15\n' +
          '  鯖魚(鹽烤)140g: 298kcal, p26, c0, f21\n' +
          '  牛五花(烤)100g: 348kcal, p17, c0, f31\n' +
          '  牛沙朗(煎)200g: 540kcal, p46, c0, f38\n' +
          '  德國豬腳200g: 490kcal, p38, c4, f35\n\n' +
          '[蛋豆]\n' +
          '  荷包蛋50g: 78kcal, p6, c0, f6\n' +
          '  炒蛋2顆100g: 154kcal, p12, c1, f12\n' +
          '  滷蛋60g: 85kcal, p8, c2, f5\n' +
          '  茶葉蛋65g: 90kcal, p8, c2, f5\n' +
          '  皮蛋65g: 100kcal, p9, c2, f6\n' +
          '  板豆腐100g: 76kcal, p8, c2, f4\n' +
          '  嫩豆腐100g: 55kcal, p5, c2, f3\n' +
          '  百頁豆腐100g: 215kcal, p13, c4, f16\n\n' +
          '[蔬菜]\n' +
          '  炒高麗菜60g: 48kcal, p1.5, c4, f3\n' +
          '  燙青花菜80g: 28kcal, p3, c4, f0.3\n' +
          '  炒青江菜60g: 42kcal, p1.5, c3, f2.5\n' +
          '  炒空心菜60g: 45kcal, p1.5, c3, f2.8\n' +
          '  玉米段80g: 74kcal, p2.5, c16, f0.8\n' +
          '  番茄1顆120g: 22kcal, p1, c5, f0.2\n' +
          '  生菜沙拉150g(無醬): 30kcal, p2, c5, f0.3\n\n' +
          '[早餐]\n' +
          '  蛋餅(原味)120g: 255kcal, p10, c30, f10\n' +
          '  蛋餅(起司)135g: 310kcal, p13, c31, f14\n' +
          '  蘿蔔糕(煎)100g: 160kcal, p3, c28, f4\n' +
          '  厚片吐司60g: 168kcal, p5, c32, f2\n' +
          '  奶油厚片60g: 242kcal, p5, c32, f10\n' +
          '  花生厚片60g: 255kcal, p7, c33, f10\n' +
          '  肉包90g: 210kcal, p9, c32, f5\n' +
          '  菠蘿麵包70g: 240kcal, p5, c38, f8\n\n' +
          '[速食]\n' +
          '  大麥克: 550kcal, p25, c46, f30\n' +
          '  麥辣雞腿堡: 530kcal, p28, c44, f27\n' +
          '  麥脆雞(腿): 430kcal, p28, c24, f24\n' +
          '  麥當勞薯條大: 490kcal, p7, c65, f23\n' +
          '  麥克雞塊6塊: 280kcal, p18, c17, f16\n' +
          '  肯德基炸雞腿: 340kcal, p26, c12, f21\n' +
          '  拿坡里披薩(一片): 220kcal, p10, c28, f7\n\n' +
          '[飲料]\n' +
          '  珍珠奶茶700ml全糖: 480kcal, p5, c90, f10\n' +
          '  珍珠鮮奶茶700ml全糖: 590kcal, p10, c96, f13\n' +
          '  黑糖珍珠鮮奶700ml: 590kcal, p10, c98, f13\n' +
          '  芋頭奶茶700ml全糖: 560kcal, p8, c92, f14\n' +
          '  四季春茶700ml全糖: 220kcal, p0, c55, f0\n' +
          '  鮮奶茶500ml全糖: 280kcal, p6, c48, f7\n' +
          '  美式咖啡無糖480ml: 10kcal, p0.5, c2, f0\n' +
          '  拿鐵480ml全脂: 200kcal, p10, c20, f8\n' +
          '  無糖豆漿350ml: 100kcal, p8, c7, f4\n' +
          '  全糖豆漿350ml: 195kcal, p8, c32, f4\n' +
          '  可口可樂330ml: 139kcal, p0, c35, f0\n' +
          '  零卡可樂/Coke Zero/Diet Coke 330ml: 0kcal, p0, c0, f0\n' +
          '  啤酒330ml: 145kcal, p1, c12, f0\n' +
          '  紅酒150ml: 120kcal, p0.3, c4, f0\n\n' +
          '[甜點]\n' +
          '  芋圓一份8顆: 180kcal, p2, c42, f1\n' +
          '  仙草凍200g: 30kcal, p1, c7, f0\n' +
          '  豆花250g: 110kcal, p6, c18, f1\n' +
          '  紅豆湯250ml: 180kcal, p5, c38, f0.5\n' +
          '  草莓聖代: 320kcal, p5, c52, f10\n' +
          '  霜淇淋(小): 160kcal, p3, c25, f5\n' +
          '  布丁大: 150kcal, p5, c24, f4\n' +
          '  提拉米蘇一份: 380kcal, p6, c38, f22\n' +
          '  起司蛋糕一片: 320kcal, p6, c30, f20\n' +
          '  馬卡龍1顆: 70kcal, p1, c10, f3\n\n' +
          '[水果]\n' +
          '  西瓜淨重200g: 60kcal, p1, c15, f0.2\n' +
          '  芒果150g: 100kcal, p1, c25, f0.3\n' +
          '  香蕉1根120g: 107kcal, p1.3, c27, f0.4\n' +
          '  蘋果中180g: 93kcal, p0.5, c25, f0.3\n' +
          '  葡萄80g: 55kcal, p0.5, c14, f0.1\n' +
          '  草莓100g: 33kcal, p0.7, c8, f0.3\n' +
          '  藍莓140g: 80kcal, p1, c20, f0.5\n\n' +
          '[堅果]\n' +
          '  杏仁30g: 173kcal, p6, c6, f15\n' +
          '  腰果30g: 163kcal, p4, c9, f13\n' +
          '  核桃30g: 196kcal, p5, c4, f19\n' +
          '  花生30g: 170kcal, p8, c5, f14\n\n' +

          '━━ STEP 7: EDGE CASES ━━\n' +
          '• Partially eaten: estimate ORIGINAL full portion\n' +
          '• Packaged food with readable label: use label nutrition data directly\n' +
          '• 手搖飲 with label: READ brand+drink+sugar sticker → apply sugar multiplier from Step 3\n' +
          '• Beverages with visible ice: reduce liquid volume by 25%\n' +
          '• Hot pot broth: 清湯250ml=15kcal | 麻辣湯250ml=80kcal | 日式昆布250ml=10kcal\n' +
          '• Dipping sauces small cup: 醬油15ml=10kcal | 沙茶醬15ml=45kcal | 甜辣醬15ml=25kcal\n' +
          '• Salad dressing: 凱薩醬30ml=140kcal | 和風醬30ml=60kcal | 千島醬30ml=135kcal\n' +
          '• Family-style dishes: estimate total dish amount\n' +
          '• If truly unidentifiable: use "不明食物" with conservative estimate\n\n' +

          '━━ OUTPUT FORMAT ━━\n' +
          'Respond with ONLY this JSON — no markdown, no explanation, no text outside the JSON:\n' +
          '{"foods":[{"name":"食物名稱(繁體中文)","amount":160,"unit":"g","calories":262,"protein":5.0,"carbs":57.0,"fat":0.4}]}\n\n' +
          'RULES:\n' +
          '• Names in Traditional Chinese (繁體中文), include cooking method: 雞腿排(炸)/鮭魚(煎)/高麗菜(炒)\n' +
          '• unit: "g" for solids, "ml" for beverages\n' +
          '• calories/protein/carbs/fat = totals for estimated portion (NOT per 100g)\n' +
          '• Calories: round to integer; macros: 1 decimal place\n' +
          '• Unidentifiable item: "不明食物" with conservative estimate'
  );
  const _promptToUse = userHint
    ? `[USER HINT: The user says this food is "${userHint}". Use this to confirm/refine your identification, cooking method, and portion estimates.]\n\n` + _geminiUserText
    : _geminiUserText;
  const geminiBodyBeta = _buildBody(true,  _promptToUse);
  const geminiBodyV1   = _buildBody(false, _promptToUse);

  let resp, lastErr;
  outer: for (const model of GEMINI_MODELS) {
    for (const ver of ['v1beta', 'v1']) {
      resp = await fetch(
        `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: ver === 'v1beta' ? geminiBodyBeta : geminiBodyV1 }
      );
      if (resp.ok) break outer;
      const e = await resp.json().catch(() => ({}));
      lastErr = e.error?.message || `API 錯誤 ${resp.status}`;
      if (resp.status === 400 && lastErr.includes('system_instruction')) continue; // skip v1 sys_instr error
      if (resp.status === 401 || resp.status === 403) break outer;
    }
  }

  try {
    if (!resp.ok) throw new Error(lastErr || `API 錯誤 ${resp.status}`);

    const data    = await resp.json();
    const text    = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = extractJSON(text);
    if (!jsonStr) throw new Error('無法解析 AI 回應，請重試');
    let parsed;
    try { parsed = JSON.parse(jsonStr); }
    catch {
      const cleaned = jsonStr.replace(/,\s*([}\]])/g, '$1');
      try { parsed = JSON.parse(cleaned); }
      catch { throw new Error('AI 回應格式錯誤，請重試'); }
    }
    scanResults   = (parsed.foods || []).filter(f => f.name && f.calories > 0);
    if (!scanResults.length) throw new Error('辨識');
    // If every item is unknown and user hasn't hinted yet, ask for help
    if (!userHint && scanResults.every(f => f.name === '不明食物')) throw new Error('辨識');
    scanOriginals = scanResults.map(f => ({ ...f }));
    renderScanResults();
  } catch (err) {
    const isApiErr = /API 錯誤|金鑰|網路/.test(err.message);
    if (!isApiErr) {
      _showAskUserHint();
    } else {
      document.getElementById('scanResultsContent').innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--red)">
          <i class="bi bi-exclamation-circle" style="font-size:2rem;display:block;margin-bottom:8px"></i>
          <div style="font-size:0.84rem">${esc(String(err.message))}</div>
        </div>`;
    }
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i class="bi bi-stars"></i> 重新分析';
  }
}

function renderScanResults() {
  const mealLabel = MEAL_META.find(m => m.id === scanMealType)?.label || '';
  document.getElementById('scanResultsContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div class="ai-badge"><i class="bi bi-stars"></i> AI 辨識結果</div>
      <div style="font-size:0.72rem;color:var(--muted)">可點擊名稱或份量修改</div>
    </div>
    ${scanResults.map((f, i) => `
      <div class="scan-food-card" id="sfc-card-${i}">
        <input type="checkbox" id="sfc-${i}" checked
          style="width:17px;height:17px;accent-color:var(--green);cursor:pointer;flex-shrink:0;margin-top:3px"
          onchange="updateScanTotal()">
        <div style="flex:1;min-width:0">
          <input class="scan-name-input" value="${esc(f.name)}"
            oninput="scanResults[${i}].name=this.value">
          <div class="scan-amt-row">
            <input class="scan-amt-input" type="number" min="1" value="${Math.round(f.amount||100)}"
              oninput="updateScanAmount(${i},this.value)">
            <span style="font-size:0.72rem;color:var(--muted)">${f.unit||'g'}</span>
            <span class="scan-food-macros" id="sfc-macros-${i}">蛋白 ${(+f.protein||0).toFixed(1)}g · 碳 ${(+f.carbs||0).toFixed(1)}g · 脂 ${(+f.fat||0).toFixed(1)}g</span>
          </div>
        </div>
        <div class="scan-food-cal" id="sfc-cal-${i}">${Math.round(f.calories)}<br><span style="font-size:0.68rem;font-weight:500">kcal</span></div>
      </div>`).join('')}
    <div class="scan-total-row">
      <div>
        <div style="font-size:0.68rem;color:var(--muted);margin-bottom:2px">已勾選合計</div>
        <div style="font-size:0.75rem;color:var(--muted)">
          蛋白 <strong id="st-p">-</strong>g ·
          碳水 <strong id="st-c">-</strong>g ·
          脂肪 <strong id="st-f">-</strong>g
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:0.68rem;color:var(--muted)">總熱量</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--orange);line-height:1.2">
          <span id="st-cal">-</span>
          <span style="font-size:0.7rem;font-weight:500"> kcal</span>
        </div>
      </div>
    </div>
    <button class="btn-primary" style="width:100%;justify-content:center;margin-top:10px" onclick="addScanResults()">
      <i class="bi bi-plus-circle"></i> 加入${mealLabel}紀錄
    </button>
    <div style="margin-top:14px;padding:12px 14px;background:var(--surface2,rgba(0,0,0,0.04));border-radius:12px">
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:5px">
        <i class="bi bi-pencil-square" style="font-size:0.8rem"></i> 覺得辨識不準？告訴 AI 是什麼，重新分析
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="text" id="scanCorrectHint" class="form-input"
          placeholder="例：炸雞腿、牛肉麵、水果沙拉…"
          style="flex:1;padding:8px 10px;font-size:0.82rem;border-radius:8px"
          onkeydown="if(event.key==='Enter'){const v=this.value.trim();if(v)analyzePhoto(v);}">
        <button onclick="const v=document.getElementById('scanCorrectHint').value.trim();if(v)analyzePhoto(v);else document.getElementById('scanCorrectHint').focus();"
          style="white-space:nowrap;padding:8px 12px;border-radius:8px;border:none;background:var(--green);color:#fff;font-size:0.8rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;flex-shrink:0">
          <i class="bi bi-stars"></i> 重新分析
        </button>
      </div>
    </div>`;
  updateScanTotal();
}

function updateScanAmount(i, val) {
  const amt  = Math.max(1, parseFloat(val) || 1);
  const orig = scanOriginals[i];
  if (!orig) return;
  const ratio = amt / (orig.amount || 100);
  scanResults[i].amount   = amt;
  scanResults[i].calories = orig.calories * ratio;
  scanResults[i].protein  = orig.protein  * ratio;
  scanResults[i].carbs    = orig.carbs    * ratio;
  scanResults[i].fat      = orig.fat      * ratio;
  const calEl    = document.getElementById(`sfc-cal-${i}`);
  const macroEl  = document.getElementById(`sfc-macros-${i}`);
  if (calEl) calEl.innerHTML = `${Math.round(scanResults[i].calories)}<br><span style="font-size:0.68rem;font-weight:500">kcal</span>`;
  if (macroEl) macroEl.textContent =
    `蛋白 ${scanResults[i].protein.toFixed(1)}g · 碳 ${scanResults[i].carbs.toFixed(1)}g · 脂 ${scanResults[i].fat.toFixed(1)}g`;
  updateScanTotal();
}

function updateScanTotal() {
  let cal = 0, p = 0, c = 0, f = 0;
  scanResults.forEach((food, i) => {
    const chk = document.getElementById(`sfc-${i}`);
    if (chk && chk.checked) {
      cal += food.calories || 0;
      p   += food.protein  || 0;
      c   += food.carbs    || 0;
      f   += food.fat      || 0;
    }
  });
  const el = id => document.getElementById(id);
  if (el('st-cal')) el('st-cal').textContent = Math.round(cal);
  if (el('st-p'))   el('st-p').textContent   = p.toFixed(1);
  if (el('st-c'))   el('st-c').textContent   = c.toFixed(1);
  if (el('st-f'))   el('st-f').textContent   = f.toFixed(1);
}

function addScanResults() {
  let added = 0;
  scanResults.forEach((f, i) => {
    const chk = document.getElementById(`sfc-${i}`);
    if (chk && chk.checked && f.name) {
      DB.addFood({
        date: currentFoodDate, meal_type: scanMealType,
        food_name: f.name,
        amount: Math.round(f.amount || 100), unit: f.unit || 'g',
        calories: Math.round(+f.calories || 0),
        protein:  parseFloat((+f.protein  || 0).toFixed(1)),
        carbs:    parseFloat((+f.carbs    || 0).toFixed(1)),
        fat:      parseFloat((+f.fat      || 0).toFixed(1)),
      });
      added++;
    }
  });
  if (added === 0) { showToast('請至少勾選一項食物'); return; }
  closePhotoScan();
  showToast(`✅ 已加入 ${added} 項食物到${MEAL_META.find(m => m.id === scanMealType)?.label || ''}！`);
  renderFoodLog();
  if (document.getElementById('page-dashboard').classList.contains('active')) renderDashboard();
}

function submitManualFood() {
  const name = document.getElementById('mName').value.trim();
  const cal  = parseFloat(document.getElementById('mCal').value);
  if (!name || isNaN(cal)) { showToast('請填寫食物名稱和卡路里'); return; }
  DB.addFood({
    date: currentFoodDate, meal_type: activeMeal, food_name: name,
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
  const celebBanner = total >= goal
    ? `<div style="text-align:center;padding:12px 0 8px;background:linear-gradient(135deg,#EFF6FF,#F0FDF4);border-radius:10px;margin-bottom:10px">
        <div style="font-size:1.5rem;margin-bottom:4px">🎉</div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--green)">今日飲水目標達成！</div>
        <div style="font-size:0.72rem;color:var(--muted)">已喝 ${Math.round(total)} ml，超棒！</div>
       </div>` : '';
  listEl.innerHTML = celebBanner + [...logs].reverse().map(w => `
    <div class="water-log-item" id="wl-${esc(w.id)}">
      <i class="bi bi-droplet-fill" style="color:#3B82F6;font-size:1.1rem"></i>
      <div class="water-log-ml">${w.amount} ml</div>
      <div style="margin-left:auto;font-size:0.75rem;color:var(--muted)">${w.time || ''}</div>
      <button class="del-btn" onclick="deleteWaterItem('${esc(w.id)}')"><i class="bi bi-trash3"></i></button>
    </div>`).join('');
}

function addWater(ml) {
  if (!ml || ml <= 0) { showToast('請輸入有效水量'); return; }
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  DB.addWater({ date: todayStr(), amount: ml, time: timeStr });
  showToast(`💧 +${ml}ml 已記錄`);
  renderWater();
}

function addCustomWater() {
  const ml = parseInt(document.getElementById('customWaterAmt').value);
  if (!ml || ml <= 0 || isNaN(ml)) { showToast('請輸入有效水量'); return; }
  addWater(ml);
  document.getElementById('customWaterAmt').value = '';
}

function deleteWaterItem(id) {
  DB.deleteWater(id);
  showToast('已刪除');
  renderWater();
}

// ── Exercise ───────────────────────────────────────────────────────────────────

let selectedExercise   = null;
let exSearchCache      = [];
let currentExerciseDate = todayStr();

function exDateLabel(d) {
  const today = todayStr();
  if (d === today) return '今天';
  const yest = new Date(today + 'T00:00:00');
  yest.setDate(yest.getDate() - 1);
  const yesterdayStr = yest.toISOString().slice(0, 10);
  if (d === yesterdayStr) return '昨天';
  const dt = new Date(d + 'T00:00:00');
  const days = ['日','一','二','三','四','五','六'];
  return `${dt.getMonth()+1}/${dt.getDate()} 週${days[dt.getDay()]}`;
}

function prevExerciseDay() {
  const d = new Date(currentExerciseDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  currentExerciseDate = d.toISOString().slice(0, 10);
  renderExercise();
}

function nextExerciseDay() {
  const today = todayStr();
  const d = new Date(currentExerciseDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const next = d.toISOString().slice(0, 10);
  if (next > today) return;
  currentExerciseDate = next;
  renderExercise();
}

function openExerciseDatePicker() {
  const inp = document.getElementById('ex-date-input');
  if (!inp) return;
  inp.max   = todayStr();
  inp.value = currentExerciseDate;
  try { inp.showPicker(); } catch { inp.click(); }
}

function pickExerciseDate(val) {
  if (!val || val > todayStr()) return;
  currentExerciseDate = val;
  renderExercise();
}

function jumpToExerciseDate(date) {
  currentExerciseDate = date;
  renderExercise();
  // scroll to the add-exercise card (has card-title "新增運動")
  const cards = document.querySelectorAll('#page-exercise .card');
  for (const c of cards) {
    if (c.textContent.includes('新增運動')) {
      setTimeout(() => c.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      break;
    }
  }
}

function getExerciseWeight() {
  const s = DB.getSettings();
  const w = DB.getWeights();
  return (w.length > 0 ? w[0].weight : null) || s.weight || 65;
}

function calcExerciseCal(met, durationMin) {
  return Math.round(met * getExerciseWeight() * (durationMin / 60));
}

function renderExercise() {
  const today  = todayStr();
  const date   = currentExerciseDate;
  const isToday = date === today;

  // Date label
  const labelEl = document.getElementById('ex-date-label');
  if (labelEl) labelEl.textContent = exDateLabel(date);

  // Date input sync
  const inp = document.getElementById('ex-date-input');
  if (inp) { inp.max = today; inp.value = date; }

  // Summary label
  const summaryLbl = document.getElementById('ex-summary-label');
  if (summaryLbl) summaryLbl.textContent = isToday ? '今日運動消耗' : `${exDateLabel(date)} 運動消耗`;

  // Badge on add card
  const badge = document.getElementById('ex-add-date-badge');
  if (badge) badge.textContent = isToday ? '今天' : `補登：${exDateLabel(date)}`;

  const exes     = DB.getExercises().filter(e => e.date === date);
  const totalCal = exes.reduce((s, e) => s + e.calories_burned, 0);
  const totalMin = exes.reduce((s, e) => s + e.duration, 0);

  const calEl  = document.getElementById('ex-total-cal');
  const timeEl = document.getElementById('ex-total-time');
  if (calEl)  calEl.textContent  = Math.round(totalCal);
  if (timeEl) timeEl.textContent = totalMin > 0 ? `共 ${totalMin} 分鐘` : '尚未記錄';

  renderExerciseQuick();
  renderExerciseList();
  renderExerciseWeeklySummary();
  updateExCalPreview();
}

function renderExerciseWeeklySummary() {
  const el = document.getElementById('ex-weekly-summary');
  if (!el) return;
  const weekDates  = getWeekDates();
  const today      = todayStr();
  const pastDates  = weekDates.filter(d => d <= today);
  const allExes    = DB.getExercises().filter(e => pastDates.includes(e.date) && !e.is_rest_day);
  const restDays   = DB.getExercises().filter(e => pastDates.includes(e.date) && e.is_rest_day);
  const totalCal   = allExes.reduce((s, e) => s + e.calories_burned, 0);
  const totalMin   = allExes.reduce((s, e) => s + e.duration, 0);
  const activeDays = new Set(allExes.map(e => e.date)).size;
  const WHO_TARGET = 150;
  const whoPct     = Math.min((totalMin / WHO_TARGET) * 100, 100);
  el.innerHTML = `
    <div style="font-size:0.8rem;font-weight:700;color:var(--text);margin-bottom:8px">📅 本週運動總覽</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
      <div style="text-align:center;background:var(--orange-light);border-radius:10px;padding:10px">
        <div style="font-size:1.2rem;font-weight:800;color:var(--orange)">${Math.round(totalCal)}</div>
        <div style="font-size:0.65rem;color:var(--muted)">消耗 kcal</div>
      </div>
      <div style="text-align:center;background:#FFF7ED;border-radius:10px;padding:10px">
        <div style="font-size:1.2rem;font-weight:800;color:var(--orange)">${totalMin}</div>
        <div style="font-size:0.65rem;color:var(--muted)">總分鐘</div>
      </div>
      <div style="text-align:center;background:${activeDays >= 3 ? 'var(--green-light)' : '#FFF7ED'};border-radius:10px;padding:10px">
        <div style="font-size:1.2rem;font-weight:800;color:${activeDays >= 3 ? 'var(--green)' : 'var(--orange)'}">${activeDays}</div>
        <div style="font-size:0.65rem;color:var(--muted)">運動天${restDays.length ? ` (+${restDays.length}休)` : ''}</div>
      </div>
    </div>
    <div style="margin-bottom:4px">
      <div style="display:flex;justify-content:space-between;font-size:0.72rem;margin-bottom:4px">
        <span style="color:var(--muted)">WHO 建議每週 150 分鐘</span>
        <span style="font-weight:700;color:${whoPct >= 100 ? 'var(--green)' : 'var(--orange)'}">${totalMin} / 150 分</span>
      </div>
      <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
        <div style="height:100%;background:${whoPct >= 100 ? 'var(--green)' : 'var(--orange)'};border-radius:4px;width:${whoPct}%;transition:width 0.5s"></div>
      </div>
      ${whoPct >= 100 ? '<div style="font-size:0.72rem;color:var(--green);margin-top:4px;text-align:center">🎉 本週已達成 WHO 建議標準！</div>' : ''}
    </div>`;
}

function renderExerciseQuick() {
  const wrap = document.getElementById('exQuickGrid');
  if (!wrap) return;
  wrap.innerHTML = EXERCISE_QUICK.map(name => {
    const ex = EXERCISE_DB[name];
    if (!ex) return '';
    const active = selectedExercise?.name === name ? 'active' : '';
    return `
      <button class="ex-quick-btn ${active}" onclick="selectExercise('${esc(name)}')">
        <div style="font-size:1.4rem;line-height:1.2">${ex.icon}</div>
        <div style="font-size:0.66rem;line-height:1.3;margin-top:3px;color:inherit">${name}</div>
      </button>`;
  }).join('');
}

function selectExercise(name) {
  const ex = EXERCISE_DB[name];
  if (!ex) return;
  selectedExercise = { name, ...ex };

  renderExerciseQuick();

  const selWrap = document.getElementById('exSelectedWrap');
  const selName = document.getElementById('exSelectedName');
  const selInfo = document.getElementById('exSelectedInfo');
  if (selWrap) selWrap.style.display = 'block';
  if (selName) selName.textContent   = `${ex.icon} ${name}`;
  if (selInfo) {
    const kg = getExerciseWeight();
    selInfo.textContent = `MET ${ex.met} · ${ex.cat} · 體重 ${kg}kg · 約 ${calcExerciseCal(ex.met, 30)} kcal / 30分`;
  }

  document.getElementById('exSearchResults')?.classList.remove('show');
  const exSrch = document.getElementById('exSearch');
  if (exSrch) exSrch.value = '';

  updateExCalPreview();
}

function doExSearch(q) {
  q = q.trim();
  const box = document.getElementById('exSearchResults');
  const inp = document.getElementById('exSearch');
  if (!q || !box || !inp) { box?.classList.remove('show'); return; }

  exSearchCache = Object.entries(EXERCISE_DB)
    .filter(([name]) => name.includes(q) || q.split('').every(ch => name.includes(ch)))
    .sort((a, b) => a[0].length - b[0].length)
    .map(([name, info]) => ({ name, ...info }))
    .slice(0, 10);

  if (!exSearchCache.length) { box.classList.remove('show'); return; }

  const rect = inp.getBoundingClientRect();
  box.style.top   = (rect.bottom + 6) + 'px';
  box.style.left  = rect.left + 'px';
  box.style.width = rect.width + 'px';

  box.innerHTML = exSearchCache.map(ex => `
    <div class="result-item" onclick="selectExercise('${esc(ex.name)}')">
      <div>
        <div class="result-name">${ex.icon} ${esc(ex.name)}</div>
        <div class="result-info">MET ${ex.met} · ${ex.cat}</div>
      </div>
      <div class="result-cal">~${calcExerciseCal(ex.met, 30)} kcal/30分</div>
    </div>`).join('');
  box.classList.add('show');
}

function setExDuration(min) {
  const inp = document.getElementById('exDuration');
  if (inp) inp.value = min;
  document.querySelectorAll('.ex-dur-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.min) === min));
  updateExCalPreview();
}

function updateExCalPreview() {
  const preEl = document.getElementById('exCalPreview');
  if (!preEl || !selectedExercise) { if (preEl) preEl.style.display = 'none'; return; }
  const dur = parseInt(document.getElementById('exDuration')?.value) || 30;
  const cal = calcExerciseCal(selectedExercise.met, dur);
  const kg  = getExerciseWeight();
  preEl.style.display = 'block';
  preEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:0.78rem;color:var(--text-2);font-weight:600">預估消耗熱量</div>
        <div style="font-size:0.7rem;color:var(--muted);margin-top:2px">${kg}kg × MET ${selectedExercise.met} × ${dur}分 ÷ 60</div>
      </div>
      <div style="font-size:2rem;font-weight:800;color:var(--orange)">${cal} <span style="font-size:0.72rem">kcal</span></div>
    </div>`;
}

function logExercise() {
  if (!selectedExercise) { showToast('請先選擇運動類型'); return; }
  const dur = parseInt(document.getElementById('exDuration')?.value) || 30;
  if (dur <= 0 || dur > 600) { showToast('請輸入有效時長（1–600 分鐘）'); return; }
  const cal = calcExerciseCal(selectedExercise.met, dur);
  const date = currentExerciseDate;

  DB.addExercise({
    date,
    exercise_name: selectedExercise.name,
    icon: selectedExercise.icon,
    met: selectedExercise.met,
    cat: selectedExercise.cat,
    duration: dur,
    calories_burned: cal,
  });

  const dateHint = date !== todayStr() ? ` (${exDateLabel(date)})` : '';
  showToast(`✅ ${selectedExercise.icon} ${selectedExercise.name} ${dur}分 · 消耗 ${cal} kcal${dateHint}`);
  selectedExercise = null;
  renderExercise();
  if (document.getElementById('page-dashboard')?.classList.contains('active')) renderDashboard();
}

function deleteExerciseItem(id) {
  DB.deleteExercise(id);
  showToast('已刪除');
  renderExercise();
  if (document.getElementById('page-dashboard')?.classList.contains('active')) renderDashboard();
}

function renderExerciseList() {
  const listEl = document.getElementById('ex-list');
  if (!listEl) return;
  const DAY_NAMES = ['週日','週一','週二','週三','週四','週五','週六'];
  const today     = todayStr();
  const weekDates = getWeekDates(); // Mon–Sun
  const allExes   = DB.getExercises();

  listEl.innerHTML = weekDates.map(date => {
    const exes     = allExes.filter(e => e.date === date);
    const isToday  = date === today;
    const isFuture = date > today;
    const dayLabel = DAY_NAMES[new Date(date + 'T00:00:00').getDay()];
    const mmdd     = date.slice(5).replace('-', '/');
    const totalCal = exes.filter(e => !e.is_rest_day).reduce((s, e) => s + e.calories_burned, 0);
    const totalMin = exes.filter(e => !e.is_rest_day).reduce((s, e) => s + e.duration, 0);
    const restDay  = exes.find(e => e.is_rest_day);

    const headerBg = isToday
      ? 'background:#FFF7ED;border-left:3px solid var(--orange)'
      : 'border-left:3px solid transparent';

    let bodyHtml = '';
    if (isFuture) {
      bodyHtml = `<div style="font-size:0.78rem;color:var(--muted);padding:6px 0">尚未記錄</div>`;
    } else if (restDay) {
      bodyHtml = `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
          <span style="font-size:1.3rem">😴</span>
          <div>
            <div style="font-size:0.82rem;font-weight:600;color:var(--muted)">休息日</div>
            <div style="font-size:0.7rem;color:var(--muted)">主動恢復 · 肌肉修復</div>
          </div>
          <button class="del-btn" style="margin-left:auto" onclick="deleteExerciseItem('${esc(restDay.id)}')"><i class="bi bi-trash3"></i></button>
        </div>`;
    } else if (!exes.length) {
      bodyHtml = `<div style="font-size:0.78rem;color:var(--muted);padding:6px 0">無記錄</div>`;
    } else {
      const rows = exes.map(e => {
        const metLine = e.is_manual
          ? `${e.duration} 分 · 自訂`
          : `${e.duration} 分 · ${e.cat || ''}`;
        return `
          <div class="exercise-item" id="ei-${esc(e.id)}" style="padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:1.3rem;flex-shrink:0">${e.icon || '💪'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:0.85rem">${esc(e.exercise_name)}</div>
              <div style="font-size:0.7rem;color:var(--muted)">${metLine}</div>
            </div>
            <div style="font-weight:800;color:var(--orange);font-size:0.88rem;flex-shrink:0">-${Math.round(e.calories_burned)} kcal</div>
            <button class="del-btn" onclick="deleteExerciseItem('${esc(e.id)}')"><i class="bi bi-trash3"></i></button>
          </div>`;
      }).join('');
      const summary = `<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--muted);padding-top:6px">
        <span>${totalMin} 分鐘</span><span style="color:var(--orange);font-weight:700">-${Math.round(totalCal)} kcal</span>
      </div>`;
      bodyHtml = rows + summary;
    }

    const isActive = date === currentExerciseDate;
    const activeBorder = isActive ? ';box-shadow:0 0 0 2px var(--orange)' : '';

    return `
      <div style="margin-bottom:10px;border-radius:12px;overflow:hidden;border:1px solid var(--border)${activeBorder}">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;${headerBg}">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:700;font-size:0.88rem;color:${isToday ? 'var(--orange)' : 'var(--text)'}">${dayLabel}</span>
            <span style="font-size:0.75rem;color:var(--muted)">${mmdd}</span>
            ${isToday ? '<span style="font-size:0.65rem;background:var(--orange);color:white;border-radius:8px;padding:1px 7px;font-weight:700">今天</span>' : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            ${!isFuture && !restDay && exes.length ? `<span style="font-size:0.75rem;color:var(--orange);font-weight:700">${exes.length} 項</span>` : ''}
            ${!isFuture ? `<button onclick="jumpToExerciseDate('${date}')" style="font-size:0.72rem;background:${isActive ? 'var(--orange)' : 'var(--orange-light)'};color:${isActive ? 'white' : 'var(--orange)'};border:none;border-radius:8px;padding:2px 9px;cursor:pointer;font-weight:700">${isActive ? '選中' : '+ 新增'}</button>` : ''}
          </div>
        </div>
        <div style="padding:0 12px 8px">${bodyHtml}</div>
      </div>`;
  }).join('');
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
      const list30 = weights.slice(0, 30);
      listEl.innerHTML = list30.map((w, i) => {
        const prev  = list30[i + 1];
        const diff  = prev ? +(w.weight - prev.weight).toFixed(1) : null;
        const deltaHtml = diff !== null
          ? `<span style="font-size:0.7rem;font-weight:700;margin-left:4px;color:${diff < 0 ? 'var(--green)' : diff > 0 ? '#EF4444' : 'var(--muted)'}">${diff < 0 ? '↓' : diff > 0 ? '↑' : '→'} ${Math.abs(diff).toFixed(1)}</span>`
          : '';
        return `
        <div class="weight-item" id="wt-${esc(w.id)}">
          <i class="bi bi-calendar3" style="color:var(--muted);font-size:0.9rem"></i>
          <div>
            <div style="font-size:0.8rem;font-weight:600">${w.date}</div>
            ${w.notes ? `<div style="font-size:0.72rem;color:var(--muted)">${esc(w.notes)}</div>` : ''}
          </div>
          <div class="weight-item-val">${w.weight} kg${deltaHtml}</div>
          <button class="del-btn" onclick="deleteWeightItem('${esc(w.id)}')"><i class="bi bi-trash3"></i></button>
        </div>`;
      }).join('');
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
  const prev  = DB.getWeights().find(p => p.date < todayStr());
  DB.upsertWeight(todayStr(), w, notes);
  if (prev) {
    const diff = +(w - prev.weight).toFixed(1);
    if (diff === 0)       showToast(`✅ 體重已記錄（與上次相同 ${w} kg）`);
    else if (diff < 0)    showToast(`✅ 體重已記錄 ↓ ${Math.abs(diff)} kg`);
    else                  showToast(`✅ 體重已記錄 ↑ ${diff} kg`);
  } else {
    showToast('✅ 體重已記錄');
  }
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

// ── Weekly Analysis ───────────────────────────────────────────────────────────

function getWeekDates() {
  const today = new Date();
  const dow   = today.getUTCDay(); // 0=Sun … 6=Sat
  const diff  = (dow === 0) ? 6 : dow - 1; // days since Monday
  const mon   = new Date(today);
  mon.setUTCDate(today.getUTCDate() - diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function renderWeeklyAnalysis() {
  const container = document.getElementById('weeklyStatsContent');
  if (!container) return;

  const weekDates = getWeekDates();
  const today     = todayStr();
  const sums      = weekDates.map(d => ({ date: d, ...getSummary(d) }));

  // TDEE: Mifflin-St Jeor if full profile, else calorie_goal
  const s = DB.getSettings();
  let tdee = s.calorie_goal || 2000;
  const w  = DB.getWeights().sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = w.length ? w[0].weight : s.weight;
  if (s.age && s.height && latestWeight) {
    const bmr = calcBMR(s.gender || 'male', s.age, s.height, latestWeight);
    tdee = calcTDEE(bmr, s.activity_level || 1.55);
  }

  // Per-day net calories (food - exercise_burned) for days up to today
  const pastDays = sums.filter(d => d.date <= today);
  const daysWithData = pastDays.filter(d => d.calories > 0 || d.exercise_burned > 0);

  let totalFoodCal   = 0;
  let totalBurnedCal = 0;
  let totalDeficit   = 0;

  daysWithData.forEach(d => {
    const netCal = d.calories - (d.exercise_burned || 0);
    totalFoodCal   += d.calories;
    totalBurnedCal += d.exercise_burned || 0;
    totalDeficit   += (tdee - netCal);
  });

  const recordedDays   = daysWithData.length;
  const remainingDays  = weekDates.filter(d => d > today).length;
  // fat change so far (positive = loss, negative = gain)
  const fatChangeSoFar = totalDeficit / 7700;
  const avgNetCal      = recordedDays > 0 ? (totalFoodCal - totalBurnedCal) / recordedDays : tdee;
  // project remaining days at current average rate
  const projectedAdditionalDeficit = (tdee - avgNetCal) * remainingDays;
  const projectedWeeklyFatChange   = (totalDeficit + projectedAdditionalDeficit) / 7700;

  // Build chart
  if (charts.tWeeklyChart) { charts.tWeeklyChart.destroy(); delete charts.tWeeklyChart; }
  const c = mkWeeklyChart(weekDates, sums, tdee, today);
  if (c) charts.tWeeklyChart = c;

  const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];
  // find best day: highest positive deficit among recorded days
  let bestDeficit = -Infinity, bestDayIdx = -1;
  sums.forEach((sum, i) => {
    if (weekDates[i] > today) return;
    const hasData = sum.calories > 0 || (sum.exercise_burned || 0) > 0;
    if (!hasData) return;
    const netCal = sum.calories - (sum.exercise_burned || 0);
    const deficit = tdee - netCal;
    if (deficit > bestDeficit) { bestDeficit = deficit; bestDayIdx = i; }
  });

  const rowsHtml = weekDates.map((d, i) => {
    const sum    = sums[i];
    const netCal = sum.calories - (sum.exercise_burned || 0);
    const isToday  = d === today;
    const isFuture = d > today;
    const hasData  = sum.calories > 0 || (sum.exercise_burned || 0) > 0;
    const deficit  = hasData ? (tdee - netCal) : null;
    const isBest   = i === bestDayIdx && bestDeficit > 0;

    let defLabel = '—';
    let defColor = 'var(--muted)';
    if (deficit !== null) {
      if (deficit > 0) { defLabel = `−${Math.round(deficit)}`; defColor = 'var(--green)'; }
      else             { defLabel = `+${Math.round(-deficit)}`; defColor = '#EF4444'; }
    }
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);${isToday ? 'font-weight:700' : ''}">
      <span style="width:20px;text-align:center;font-size:0.8rem;color:${isToday ? 'var(--primary)' : 'var(--muted)'}">${DAY_NAMES[i]}</span>
      <span style="flex:1;font-size:0.82rem;color:${isFuture ? 'var(--muted)' : 'var(--text)'}">${isFuture ? '尚未記錄' : (hasData ? `攝取 ${Math.round(sum.calories)} kcal${(sum.exercise_burned||0)>0?' · 運動 −'+Math.round(sum.exercise_burned)+' kcal':''}` : '無紀錄')}</span>
      ${isBest ? '<span style="font-size:0.62rem;background:var(--green);color:white;border-radius:6px;padding:1px 5px;flex-shrink:0">🏅最佳</span>' : ''}
      <span style="font-size:0.82rem;font-weight:600;color:${defColor}">${defLabel} kcal</span>
    </div>`;
  }).join('');

  const changeSign  = projectedWeeklyFatChange >= 0 ? '−' : '+';
  const changeColor = projectedWeeklyFatChange >= 0 ? 'var(--green)' : '#EF4444';
  const changeAbs   = Math.abs(projectedWeeklyFatChange);
  const changeLabel = projectedWeeklyFatChange >= 0 ? '預估減重' : '預估增重';

  const tdeeSource = (s.age && s.height && latestWeight)
    ? `Mifflin-St Jeor BMR × 活動係數 ${s.activity_level || 1.55}`
    : `目標攝取設定值`;

  container.innerHTML = `
    <div style="margin-bottom:4px">${rowsHtml}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
      <div style="background:var(--green-light);border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">本週累計熱量差</div>
        <div style="font-size:1.6rem;font-weight:800;color:${totalDeficit>=0?'var(--green)':'#EF4444'}">${totalDeficit>=0?'−':'+'}${Math.round(Math.abs(totalDeficit))}</div>
        <div style="font-size:0.7rem;color:var(--muted)">kcal（${recordedDays} 天實際）</div>
      </div>
      <div style="background:#FEF3C7;border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">${changeLabel}（本週預估）</div>
        <div style="font-size:1.6rem;font-weight:800;color:${changeColor}">${changeSign}${changeAbs.toFixed(2)} kg</div>
        <div style="font-size:0.7rem;color:var(--muted)">7,700 kcal = 1 kg 體脂</div>
      </div>
    </div>
    <div style="margin-top:10px;font-size:0.72rem;color:var(--muted);background:#F9FAFB;border-radius:8px;padding:8px;line-height:1.7">
      📐 公式依據：Mifflin-St Jeor (1990) 基礎代謝 × 活動係數 = TDEE；每日赤字 = TDEE − 淨攝取（食物 − 運動消耗）；體重變化 = 每週赤字 ÷ 7,700 kcal/kg（Hall et al., The Lancet 2012）<br>
      TDEE 來源：${tdeeSource}＝<strong>${tdee} kcal/天</strong>
    </div>`;
}

function mkWeeklyChart(weekDates, sums, tdee, today) {
  const ctx = document.getElementById('tWeeklyChart')?.getContext('2d');
  if (!ctx) return null;

  const DAY_LABELS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  const netCals = sums.map((s, i) => {
    if (weekDates[i] > today && s.calories === 0) return null;
    if (s.calories === 0 && (s.exercise_burned || 0) === 0) return null;
    return Math.round(s.calories - (s.exercise_burned || 0));
  });

  const barColors = netCals.map(v => {
    if (v === null) return '#E5E7EB';
    if (v <= tdee * 0.85)    return '#22C55E';
    if (v <= tdee)            return '#F97316';
    return '#EF4444';
  });

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DAY_LABELS,
      datasets: [
        {
          label: '淨攝取 (kcal)',
          data: netCals,
          backgroundColor: barColors,
          borderRadius: 6,
          order: 2,
        },
        {
          label: `TDEE ${tdee} kcal`,
          data: Array(7).fill(tdee),
          type: 'line',
          borderColor: '#3B82F6',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          order: 1,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, boxWidth: 12, padding: 14 },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              if (ctx.datasetIndex === 1) return `TDEE: ${tdee} kcal`;
              const v = ctx.parsed.y;
              if (v === null) return '無記錄';
              const diff = tdee - v;
              const sign = diff > 0 ? '赤字' : '盈餘';
              return [`淨攝取: ${v} kcal`, `${sign}: ${Math.abs(Math.round(diff))} kcal`];
            }
          }
        }
      },
      layout: { padding: { bottom: 4 } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          grid: { color: '#F3F4F6' },
          ticks: { font: { size: 11 } },
          min: 0,
        }
      }
    }
  });
}

// ── Trends ─────────────────────────────────────────────────────────────────────

function renderTrends(days) {
  renderWeeklyAnalysis();
  document.querySelectorAll('.period-tab').forEach(t =>
    t.classList.toggle('active', parseInt(t.dataset.days) === days));

  const dates  = dateRange(days);
  const labels = dates.map(d => d.slice(5));
  const sums   = dates.map(d => getSummary(d));

  const wLogs = DB.getWeights()
    .filter(w => w.date >= dates[0])
    .sort((a, b) => a.date.localeCompare(b.date));

  const pairs = [
    ['tCalChart',    () => mkCalExChart(labels, sums)],
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

function mkCalExChart(labels, sums) {
  const ctx = document.getElementById('tCalChart')?.getContext('2d');
  if (!ctx) return null;
  const hasBurn = sums.some(s => (s.exercise_burned || 0) > 0);
  if (!hasBurn) return mkLineChart(ctx, labels, sums.map(s => Math.round(s.calories)), '#F97316');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '攝取', data: sums.map(s => Math.round(s.calories)),        backgroundColor: '#F9731633', borderColor: '#F97316', borderWidth: 2, borderRadius: 4, stack: 'a' },
        { label: '運動消耗', data: sums.map(s => -Math.round(s.exercise_burned || 0)), backgroundColor: '#22C55E33', borderColor: '#22C55E', borderWidth: 2, borderRadius: 4, stack: 'a' },
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
  if (apiEl && s.gemini_api_key) apiEl.value = s.gemini_api_key;

  _renderApiKeyStatus();
  liveCalcTDEE();
  _renderSnapList();
  _renderNotifSettings();
}

// ── Notification helpers ──────────────────────────────────────────────────────

function _notifCfgKey() { return 'nm_notif_cfg'; }

function _loadNotifCfg() {
  try { return JSON.parse(localStorage.getItem(_notifCfgKey()) || '{}'); } catch { return {}; }
}

function _saveNotifCfg(cfg) {
  localStorage.setItem(_notifCfgKey(), JSON.stringify(cfg));
  // Send to SW so it can notify even when page is in background
  navigator.serviceWorker?.ready.then(reg => {
    reg.active?.postMessage({ type: 'SAVE_NOTIF', cfg });
  });
}

function _renderNotifSettings() {
  const perm    = Notification.permission;   // 'granted' | 'denied' | 'default'
  const cfg     = _loadNotifCfg();
  const permRow = document.getElementById('notifPermRow');
  if (!permRow) return;

  if (!('Notification' in window)) {
    permRow.innerHTML = '<div style="font-size:0.78rem;color:var(--muted)">此瀏覽器不支援通知功能</div>';
    return;
  }

  if (perm === 'granted') {
    permRow.innerHTML = '<div style="font-size:0.78rem;color:var(--green);display:flex;align-items:center;gap:6px"><i class="bi bi-check-circle-fill"></i> 通知權限已開啟</div>';
  } else if (perm === 'denied') {
    permRow.innerHTML = '<div style="font-size:0.78rem;color:var(--red)">通知已被封鎖，請至手機設定 → Safari/Chrome → 通知，手動允許</div>';
  } else {
    permRow.innerHTML = `<button class="btn-primary" style="width:100%;justify-content:center;font-size:0.84rem;padding:10px" onclick="requestNotifPermission()">
      <i class="bi bi-bell-fill"></i> 開啟通知權限
    </button>`;
  }

  // Restore checkbox state
  const mealsCb = document.getElementById('notifMeals');
  const waterCb = document.getElementById('notifWater');
  if (mealsCb) { mealsCb.checked = cfg.meals !== false && perm === 'granted'; }
  if (waterCb) { waterCb.checked = cfg.water !== false && perm === 'granted'; }

  if (cfg.breakfast)      document.getElementById('notifBreakfast')?.setAttribute('value', cfg.breakfast);
  if (cfg.lunch)          document.getElementById('notifLunch')?.setAttribute('value', cfg.lunch);
  if (cfg.dinner)         document.getElementById('notifDinner')?.setAttribute('value', cfg.dinner);
  if (cfg.water_start)    document.getElementById('notifWaterStart')?.setAttribute('value', cfg.water_start);
  if (cfg.water_end)      document.getElementById('notifWaterEnd')?.setAttribute('value', cfg.water_end);
  if (cfg.water_interval) {
    const sel = document.getElementById('notifWaterInterval');
    if (sel) sel.value = String(cfg.water_interval);
  }

  _syncNotifAreas();
}

function _syncNotifAreas() {
  const meals = document.getElementById('notifMeals')?.checked;
  const water = document.getElementById('notifWater')?.checked;
  const mealArea  = document.getElementById('mealTimesArea');
  const waterArea = document.getElementById('waterNotifArea');
  if (mealArea)  mealArea.style.display  = meals ? 'block' : 'none';
  if (waterArea) waterArea.style.display = water ? 'block' : 'none';
}

async function requestNotifPermission() {
  if (!('Notification' in window)) { showToast('此瀏覽器不支援通知'); return; }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    showToast('✅ 通知權限已開啟！三餐與喝水提醒已自動啟用');
    // Auto-enable both toggles on first permission grant
    const mealsCb = document.getElementById('notifMeals');
    const waterCb = document.getElementById('notifWater');
    if (mealsCb) mealsCb.checked = true;
    if (waterCb) waterCb.checked = true;
    _syncNotifAreas();
    saveNotifSettings();
  } else {
    showToast('❌ 通知權限被拒絕，請至系統設定手動開啟');
  }
  _renderNotifSettings();
}

function saveNotifSettings() {
  _syncNotifAreas();
  const cfg = {
    enabled:        Notification.permission === 'granted',
    meals:          document.getElementById('notifMeals')?.checked  ?? false,
    water:          document.getElementById('notifWater')?.checked  ?? false,
    breakfast:      document.getElementById('notifBreakfast')?.value  || '08:00',
    lunch:          document.getElementById('notifLunch')?.value      || '12:00',
    dinner:         document.getElementById('notifDinner')?.value     || '18:00',
    water_start:    document.getElementById('notifWaterStart')?.value || '08:00',
    water_end:      document.getElementById('notifWaterEnd')?.value   || '22:00',
    water_interval: Number(document.getElementById('notifWaterInterval')?.value) || 90,
  };
  _saveNotifCfg(cfg);
  showToast('🔔 通知設定已儲存');
  scheduleNotifications();
  _registerWebPush();
}

// ── Notification scheduler (main-thread setTimeout — more reliable than SW setInterval) ──

const _notifTimers = [];

function _clearNotifTimers() {
  _notifTimers.forEach(t => clearTimeout(t));
  _notifTimers.length = 0;
}

function _fireNotif(title, body, tag) {
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker?.ready.then(reg => {
    reg.showNotification(title, { body, tag, renotify: false });
  }).catch(() => {
    try { new Notification(title, { body, tag }); } catch (_) {}
  });
}

async function _registerWebPush() {
  if (!PUSH_WORKER_URL) return;
  if (Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const keyResp = await fetch(`${PUSH_WORKER_URL}/vapid-public-key`);
    const { key } = await keyResp.json();

    // Convert base64url public key to Uint8Array for applicationServerKey
    const rawKey = Uint8Array.from(
      atob(key.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: rawKey });
    }

    const cfg       = _loadNotifCfg();
    const tzOffset  = -new Date().getTimezoneOffset(); // positive = UTC+ timezone
    await fetch(`${PUSH_WORKER_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), schedule: cfg, tzOffset }),
    });
  } catch (e) {
    console.warn('Web Push registration failed:', e);
  }
}

function _msUntilHHMM(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (t - now <= 0) t.setDate(t.getDate() + 1);
  return t - now;
}

function scheduleNotifications() {
  _clearNotifTimers();
  if (Notification.permission !== 'granted') return;
  const cfg = _loadNotifCfg();

  function schedMeal(key, emoji, label, hhmm) {
    if (cfg.meals === false) return;
    const ms = _msUntilHHMM(hhmm);
    const id = setTimeout(() => {
      _fireNotif(`${emoji} 記錄${label}`, `現在 ${hhmm}，記得記錄今天的${label}！`, `meal-${key}`);
      _notifTimers.splice(_notifTimers.indexOf(id), 1);
      schedMeal(key, emoji, label, hhmm);
    }, ms);
    _notifTimers.push(id);
  }

  function schedWater() {
    if (cfg.water === false) return;
    const [sh, sm] = (cfg.water_start || '08:00').split(':').map(Number);
    const [eh, em] = (cfg.water_end   || '22:00').split(':').map(Number);
    const interval  = Number(cfg.water_interval) || 90;
    const now       = new Date();
    const nowMins   = now.getHours() * 60 + now.getMinutes();
    const startMins = sh * 60 + sm;
    const endMins   = eh * 60 + em;

    let nextMins;
    if (nowMins < startMins) {
      nextMins = startMins;
    } else if (nowMins >= endMins) {
      nextMins = startMins + 24 * 60;           // tomorrow's first reminder
    } else {
      const slots = Math.ceil((nowMins - startMins + 1) / interval);
      nextMins = startMins + slots * interval;
      if (nextMins >= endMins) nextMins = startMins + 24 * 60;
    }

    const isTomorrow = nextMins >= 24 * 60;
    const absH = Math.floor((nextMins % (24 * 60)) / 60);
    const absM = nextMins % 60;
    const fire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), absH, absM, 0, 0);
    if (isTomorrow) fire.setDate(fire.getDate() + 1);
    const ms = Math.max(0, fire - now);
    const hhmm = `${String(absH).padStart(2,'0')}:${String(absM).padStart(2,'0')}`;

    const id = setTimeout(() => {
      _fireNotif('💧 喝水提醒', '記得補充水分，保持健康！', `water-${hhmm}`);
      _notifTimers.splice(_notifTimers.indexOf(id), 1);
      schedWater();
    }, ms);
    _notifTimers.push(id);
  }

  if (cfg.meals !== false) {
    schedMeal('breakfast', '🌅', '早餐', cfg.breakfast || '08:00');
    schedMeal('lunch',     '☀️',  '午餐', cfg.lunch     || '12:00');
    schedMeal('dinner',    '🌙',  '晚餐', cfg.dinner    || '18:00');
  }
  schedWater();
}

function testNotification() {
  if (Notification.permission !== 'granted') { showToast('請先開啟通知權限'); return; }
  _fireNotif('🔔 NutriMate 通知測試', '通知功能正常！設定成功 ✅', 'notif-test');
  showToast('已送出測試通知，請查看是否收到');
}

function _renderSnapList() {
  const el = document.getElementById('snap-list');
  if (!el) return;
  const snaps = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('nm_snap_')) {
      const date = k.replace('nm_snap_', '');
      try {
        const foods = JSON.parse(localStorage.getItem(k) || '[]');
        snaps.push({ date, count: foods.length });
      } catch { /* skip corrupt */ }
    }
  }
  if (!snaps.length) {
    el.textContent = '尚無自動備份（每天午夜自動建立）';
    return;
  }
  snaps.sort((a, b) => b.date.localeCompare(a.date));
  el.innerHTML = snaps.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F3F4F6">
      <span>${s.date} <span style="color:var(--muted)">(${s.count} 筆)</span></span>
      <button onclick="downloadSnap('${s.date}')"
        style="font-size:0.72rem;background:var(--green-light);color:var(--green-dark);border:none;border-radius:8px;padding:4px 10px;cursor:pointer;font-family:inherit">
        下載
      </button>
    </div>`).join('');
}

function downloadSnap(date) {
  const raw = localStorage.getItem(`nm_snap_${date}`);
  if (!raw) { showToast('找不到備份'); return; }
  const blob = new Blob([raw], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `飲食備份_${date}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function _renderApiKeyStatus() {
  const el  = document.getElementById('apiKeyStatus');
  if (!el) return;
  const key = DB.getSettings().gemini_api_key;
  if (key && key.length >= 20) {
    el.innerHTML = '<span style="font-size:0.72rem;background:#DCFCE7;color:#15803D;border-radius:20px;padding:3px 10px;font-weight:700">✅ 金鑰已儲存</span>';
  } else {
    el.innerHTML = '<span style="font-size:0.72rem;background:#FEF2F2;color:#EF4444;border-radius:20px;padding:3px 10px;font-weight:700">⚠️ 尚未設定</span>';
  }
}

function saveApiKey() {
  const key = document.getElementById('sApiKey').value.trim();
  if (!key || key.length < 20) { showToast('請先輸入有效的 API 金鑰'); return; }
  const s = DB.getSettings();
  DB.saveSettings({ ...s, gemini_api_key: key });
  _renderApiKeyStatus();
  showToast('✅ API 金鑰已儲存！');
}

async function testApiKey() {
  const key = document.getElementById('sApiKey').value.trim() || DB.getSettings().gemini_api_key;
  if (!key || key.length < 20) { showToast('請先輸入並儲存金鑰'); return; }
  showToast('🔄 測試中…');
  const TEST_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-002', 'gemini-1.5-pro-latest'];
  const testBody = JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 5 } });
  try {
    let ok = false, lastMsg = '';
    outer: for (const model of TEST_MODELS) {
      for (const ver of ['v1beta', 'v1']) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${key}`,
          { method: 'POST', headers: { 'content-type': 'application/json' }, body: testBody }
        );
        if (res.ok) { ok = true; break outer; }
        const err = await res.json().catch(() => ({}));
        lastMsg = err.error?.message || `錯誤 ${res.status}`;
        if (res.status === 401 || res.status === 403) break outer;
      }
    }
    if (ok) {
      showToast('✅ 金鑰有效！AI 辨識功能可以使用了', 3000);
    } else {
      showToast(`❌ ${lastMsg || '金鑰無效'}`, 4000);
    }
  } catch {
    showToast('❌ 網路錯誤，請確認網路連線', 3000);
  }
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
    gemini_api_key: apiKey,
  });
  _renderApiKeyStatus();
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

// ── Manual Exercise Entry ─────────────────────────────────────────────────────

function openManualExercise() {
  document.getElementById('meExName').value     = '';
  document.getElementById('meExDuration').value = '';
  document.getElementById('meExCal').value      = '';
  document.getElementById('manualExModal').classList.remove('hidden');
  document.getElementById('meExName').focus();
}

function closeManualExercise() {
  document.getElementById('manualExModal').classList.add('hidden');
}

function submitManualExercise() {
  const name = document.getElementById('meExName').value.trim();
  const dur  = parseInt(document.getElementById('meExDuration').value);
  const cal  = parseFloat(document.getElementById('meExCal').value);
  if (!name)           { showToast('請輸入運動名稱'); return; }
  if (!dur || dur <= 0){ showToast('請輸入有效時長'); return; }
  if (!cal || cal <= 0){ showToast('請輸入有效消耗熱量'); return; }

  const date = currentExerciseDate;
  DB.addExercise({
    date,
    exercise_name:   name,
    icon:            '✏️',
    met:             null,
    cat:             '自訂',
    duration:        dur,
    calories_burned: cal,
    is_manual:       true,
  });

  closeManualExercise();
  const dateHint = date !== todayStr() ? ` (${exDateLabel(date)})` : '';
  showToast(`✅ ${name} ${dur}分 · 消耗 ${Math.round(cal)} kcal${dateHint}`);
  renderExercise();
  if (document.getElementById('page-dashboard')?.classList.contains('active')) renderDashboard();
}

// ── Food: Copy Yesterday ──────────────────────────────────────────────────────

function copyYesterdayMeals() {
  const today  = todayStr();
  const yDate  = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yest   = yDate.toISOString().split('T')[0];
  const yFoods = DB.getFoods().filter(f => f.date === yest);
  if (!yFoods.length) { showToast('昨天沒有飲食記錄'); return; }
  const tFoods = DB.getFoods().filter(f => f.date === today);
  if (tFoods.length && !confirm(`今天已有 ${tFoods.length} 筆記錄，確定要複製昨天的 ${yFoods.length} 項餐點？`)) return;
  yFoods.forEach(f => {
    const { id: _id, ...rest } = f;
    DB.addFood({ ...rest, date: today });
  });
  showToast(`✅ 已複製昨天 ${yFoods.length} 項餐點`);
  renderFoodLog();
  if (document.getElementById('page-dashboard')?.classList.contains('active')) renderDashboard();
}

// ── Exercise: Rest Day ────────────────────────────────────────────────────────

function markRestDay() {
  const date = currentExerciseDate;
  if (DB.getExercises().some(e => e.date === date && e.is_rest_day)) {
    showToast('該天已標記為休息日');
    return;
  }
  DB.addExercise({ date, exercise_name: '休息日', icon: '😴', met: 0, cat: '休息', duration: 0, calories_burned: 0, is_rest_day: true });
  const hint = date !== todayStr() ? ` (${exDateLabel(date)})` : '';
  showToast(`😴 已標記為休息日${hint}`);
  renderExercise();
}

// ── Data Export / Import ──────────────────────────────────────────────────────

function exportData() {
  const data = {
    version: '2.0',
    exported: new Date().toISOString(),
    settings:  DB.getSettings(),
    goals:     DB.getGoals(),
    foods:     DB.getFoods(),
    water:     DB.getWater(),
    weights:   DB.getWeights(),
    exercises: DB.getExercises(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `nutrimate-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ 資料已匯出');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.settings && !data.foods) throw new Error('格式不符');
      const exported = data.exported ? new Date(data.exported).toLocaleString('zh-TW') : '未知時間';
      if (!confirm(`匯入將覆蓋現有資料。\n備份時間：${exported}\n確定繼續？`)) return;
      if (data.settings)  DB.saveSettings(data.settings);
      if (data.goals)     DB.saveGoals(data.goals);
      if (data.foods)     localStorage.setItem('nm_foods',     JSON.stringify(data.foods));
      if (data.water)     localStorage.setItem('nm_water',     JSON.stringify(data.water));
      if (data.weights)   localStorage.setItem('nm_weights',   JSON.stringify(data.weights));
      if (data.exercises) localStorage.setItem('nm_exercises', JSON.stringify(data.exercises));
      showToast('✅ 匯入成功！正在重新整理…');
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      showToast('❌ 匯入失敗：' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ── Settings: Auto Water Goal ─────────────────────────────────────────────────

function autoCalcWater() {
  const w = parseFloat(document.getElementById('sWeight').value);
  if (!w || w < 20) { showToast('請先輸入體重'); return; }
  const goal = Math.round(w * 35 / 100) * 100;
  document.getElementById('sWater').value = goal;
  showToast(`💧 飲水目標設為 ${goal} ml（${w}kg × 35ml）`);
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

  // Drag & drop for photo scan
  const scanDropEl = document.getElementById('scanDrop');
  if (scanDropEl) {
    scanDropEl.addEventListener('dragover', e => {
      e.preventDefault();
      scanDropEl.classList.add('drag-over');
    });
    scanDropEl.addEventListener('dragleave', e => {
      if (!scanDropEl.contains(e.relatedTarget)) scanDropEl.classList.remove('drag-over');
    });
    scanDropEl.addEventListener('drop', e => {
      e.preventDefault();
      scanDropEl.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handlePhotoSelect({ target: { files: [file] } });
      }
    });
  }

  ['foodModal','manualModal','photoModal','manualExModal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) {
      if (e.target === this) {
        if (id === 'foodModal')      closeModal();
        else if (id === 'manualModal')   closeManualModal();
        else if (id === 'manualExModal') closeManualExercise();
        else closePhotoScan();
      }
    });
  });

  // ── Service Worker & Notifications ──────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'OPEN_TAB') navigate(e.data.tab || 'dashboard');
    });
    // Auto-reload when a new SW version takes over (delivers latest app.js/CSS)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
  scheduleNotifications();
  _registerWebPush();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleNotifications();
  });

  // Auto-backup + advance to next day at midnight
  (function scheduleMidnight() {
    const now = new Date();
    const msUntilMidnight = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + 1
    ) - now;
    setTimeout(() => {
      const backupDate = currentFoodDate;
      // Save daily snapshot before switching
      const dayFoods = DB.getFoods().filter(f => f.date === backupDate);
      if (dayFoods.length > 0) {
        localStorage.setItem(`nm_snap_${backupDate}`, JSON.stringify(dayFoods));
        showToast(`💾 ${foodDateLabel(backupDate)} 飲食已自動備份（${dayFoods.length} 筆）`);
      }
      currentFoodDate = todayStr();
      if (document.getElementById('page-food-log')?.classList.contains('active')) {
        renderFoodLog();
      }
      scheduleMidnight();
    }, msUntilMidnight);
  })();
});
