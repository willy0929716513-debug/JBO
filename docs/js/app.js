'use strict';

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
    case 'exercise':  renderExercise();  break;
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

  if (nutFilter) {
    searchCache = entries
      .filter(([, info]) => nutFilter(info))
      .sort((a, b) => a[1].calories - b[1].calories)
      .map(([name, info]) => ({ name, ...info }))
      .slice(0, 15);
  } else {
    searchCache = entries
      .map(([name, info]) => ({ name, score: foodScore(name, q), ...info }))
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

  box.innerHTML = searchCache.map((f, i) => `
    <div class="result-item" onclick="selectFoodByIdx(${i})">
      <div>
        <div class="result-name">${boldMatch(f.name, q)}</div>
        <div class="result-info">蛋白 ${f.protein}g · 碳水 ${f.carbs}g · 脂肪 ${f.fat}g <span style="font-size:0.7rem">/100g</span></div>
      </div>
      <div class="result-cal">${f.calories} kcal</div>
    </div>`).join('');
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
      p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] > 0
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

async function analyzePhoto() {
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

  const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const geminiBody = JSON.stringify({
    system_instruction: {
      parts: [{ text:
        'You are an expert nutritionist and food analyst specializing in Asian cuisines — especially Taiwanese, Japanese, Korean, and Chinese food — with comprehensive knowledge of the USDA food database, Taiwan TFDA food composition tables, and Japan MEXT nutrient database. ' +
        'Your job is to look at food photos and return precise nutritional estimates as structured JSON. ' +
        'You NEVER refuse or say you cannot identify food. You always make your best estimate based on visual appearance, context, and culinary knowledge.'
      }]
    },
    contents: [{
      parts: [
        { inline_data: { mime_type: scanMediaType, data: scanImageBase64 } },
        { text:
          'Analyze this food photo using the following steps:\n\n' +

          '━━ STEP 1: SCAN ━━\n' +
          'Look at the entire image. Note the container type (便當盒/碗/盤/袋), number of compartments, and every visible food item including small sides and garnishes.\n\n' +

          '━━ STEP 2: DECOMPOSE (most important step) ━━\n' +
          'Break EVERY complex meal into individual components. NEVER group different foods together.\n' +
          '• 便當/Bento box → white rice + each protein + each vegetable side + sauce (3–6 entries typical)\n' +
          '• 自助餐/Buffet plate → each dish is its own entry\n' +
          '• 早餐組合 → each item separate: 蛋餅, 土司, 荷包蛋, 豆漿 are all separate\n' +
          '• 湯麵/Noodle soup → noodles + broth + each topping (叉燒/溏心蛋/蔥/筍) separately\n' +
          '• 炒飯/炒麵 → list as ONE item only if ingredients are fully mixed and indistinguishable\n' +
          '• 火鍋 → each ingredient separately\n\n' +

          '━━ STEP 3: IDENTIFY WITH PRECISION ━━\n' +
          'Use specific names, not generic ones:\n' +
          '  ✗ Wrong: "肉", "蔬菜", "飯", "麵"\n' +
          '  ✓ Right: "三層肉(滷)", "炒高麗菜", "白飯", "陽春麵"\n\n' +
          'Cooking method affects calories significantly — include it in the name:\n' +
          '  炸/酥炸 → +40–60% fat vs steamed | 滷 → moderate fat | 蒸/燙 → lowest fat | 炒 → medium fat\n\n' +
          'Common Taiwanese foods reference:\n' +
          '  主食: 白飯/糙米飯/油飯/炒飯/米粉/冬粉/拉麵/烏龍麵/水餃/鍋貼/蚵仔麵線\n' +
          '  肉類: 三層肉(五花)/雞腿排/雞胸肉/排骨/豬排/魚排/虱目魚/鮭魚/蝦仁/花枝\n' +
          '  加工: 貢丸/魚丸/豬血糕/米腸/黑輪\n' +
          '  蛋豆: 荷包蛋/滷蛋/溏心蛋/炒蛋/嫩豆腐/板豆腐/百頁豆腐\n' +
          '  蔬菜: 炒高麗菜/炒青江菜/燙菠菜/燙青花菜/玉米/醃蘿蔔/泡菜/炒豆芽/炒茄子\n' +
          '  早餐: 蛋餅/蘿蔔糕/燒餅油條/厚片吐司/法式吐司/鮪魚三明治/饅頭夾蛋\n' +
          '  飲料: 珍珠奶茶/鮮奶茶/豆漿/米漿/冬瓜茶/青草茶/美式咖啡/拿鐵\n' +
          '  小吃: 臭豆腐/蚵仔煎/鹽酥雞/雞排/蔥油餅/肉圓/碗粿\n' +
          '  日式: 壽司/天婦羅/唐揚炸雞/味噌湯/茶碗蒸/親子丼/拉麵\n' +
          '  韓式: 石鍋拌飯/韓式炸雞/泡菜鍋/部隊鍋/海苔飯捲\n' +
          '  西式: 漢堡/薯條/披薩/沙拉/義大利麵/墨西哥捲餅\n\n' +

          '━━ STEP 4: ESTIMATE PORTIONS ━━\n' +
          '  便當白飯: 160g | 大碗白飯: 250g | 小碗: 120g | 一碗拉麵麵條: 180g\n' +
          '  雞腿排(便當): 120g | 排骨: 100g | 魚排: 110g | 三層肉(便當): 100g\n' +
          '  炒青菜(便當): 60g | 燙青菜: 80g | 玉米半根: 80g | 滷蛋: 60g\n' +
          '  蛋餅: 120g | 厚片吐司: 60g | 漢堡: 200g | 雞排: 160g\n' +
          '  珍珠奶茶(大): 700ml | 豆漿: 250ml | 美式咖啡: 350ml\n' +
          '  Consider plate/container size relative to food volume.\n\n' +

          '━━ STEP 5: NUTRITION ANCHORS ━━\n' +
          'Use these as calibration references:\n' +
          '  白飯160g: 262kcal, p5g, c57g, f0.4g\n' +
          '  三層肉(滷)100g: 295kcal, p15g, c4g, f24g\n' +
          '  雞腿排(炸)120g: 310kcal, p26g, c8g, f20g\n' +
          '  雞腿排(烤)120g: 220kcal, p28g, c0g, f11g\n' +
          '  排骨(炸)100g: 280kcal, p18g, c10g, f18g\n' +
          '  炒高麗菜60g: 48kcal, p1.5g, c4g, f3g\n' +
          '  荷包蛋50g: 78kcal, p6g, c0g, f6g | 滷蛋60g: 85kcal, p8g, c2g, f5g\n' +
          '  蛋餅120g: 255kcal, p10g, c30g, f10g\n' +
          '  珍珠奶茶700ml: 480kcal, p5g, c88g, f10g\n\n' +

          '━━ OUTPUT ━━\n' +
          'Respond with ONLY this JSON — no markdown, no explanation, no extra text before or after:\n' +
          '{"foods":[{"name":"食物名稱(繁體中文)","amount":160,"unit":"g","calories":262,"protein":5.0,"carbs":57.0,"fat":0.4}]}\n\n' +
          'Rules: All names in Traditional Chinese (繁體中文). Include cooking method in name when relevant. Amount must match the estimated actual portion.'
        }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
  });

  let resp, lastErr;
  for (const model of GEMINI_MODELS) {
    resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: geminiBody }
    );
    if (resp.ok) break;
    const e = await resp.json().catch(() => ({}));
    lastErr = e.error?.message || `API 錯誤 ${resp.status}`;
    if (resp.status === 401 || resp.status === 403) break;
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
    if (!scanResults.length) throw new Error('未偵測到食物，請換張照片');
    scanOriginals = scanResults.map(f => ({ ...f }));
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
    </button>`;
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
  if (!name || !cal) { showToast('請填寫食物名稱和卡路里'); return; }
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

let selectedExercise = null;
let exSearchCache    = [];

function getExerciseWeight() {
  const s = DB.getSettings();
  const w = DB.getWeights();
  return (w.length > 0 ? w[0].weight : null) || s.weight || 65;
}

function calcExerciseCal(met, durationMin) {
  return Math.round(met * getExerciseWeight() * (durationMin / 60));
}

function renderExercise() {
  const today = todayStr();
  const dateEl = document.getElementById('ex-date');
  if (dateEl) dateEl.textContent = today;

  const exes     = DB.getExercises().filter(e => e.date === today);
  const totalCal = exes.reduce((s, e) => s + e.calories_burned, 0);
  const totalMin = exes.reduce((s, e) => s + e.duration, 0);

  const calEl  = document.getElementById('ex-total-cal');
  const timeEl = document.getElementById('ex-total-time');
  if (calEl)  calEl.textContent  = Math.round(totalCal);
  if (timeEl) timeEl.textContent = totalMin > 0 ? `共 ${totalMin} 分鐘` : '今日尚未記錄';

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

  DB.addExercise({
    date: todayStr(),
    exercise_name: selectedExercise.name,
    icon: selectedExercise.icon,
    met: selectedExercise.met,
    cat: selectedExercise.cat,
    duration: dur,
    calories_burned: cal,
  });

  showToast(`✅ ${selectedExercise.icon} ${selectedExercise.name} ${dur}分 · 消耗 ${cal} kcal`);
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

    return `
      <div style="margin-bottom:10px;border-radius:12px;overflow:hidden;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;${headerBg}">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:700;font-size:0.88rem;color:${isToday ? 'var(--orange)' : 'var(--text)'}">${dayLabel}</span>
            <span style="font-size:0.75rem;color:var(--muted)">${mmdd}</span>
            ${isToday ? '<span style="font-size:0.65rem;background:var(--orange);color:white;border-radius:8px;padding:1px 7px;font-weight:700">今天</span>' : ''}
          </div>
          ${!isFuture && !restDay && exes.length ? `<span style="font-size:0.75rem;color:var(--orange);font-weight:700">${exes.length} 項</span>` : ''}
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
  const TEST_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const testBody = JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 5 } });
  try {
    let ok = false, lastMsg = '';
    for (const model of TEST_MODELS) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: testBody }
      );
      if (res.ok) { ok = true; break; }
      const err = await res.json().catch(() => ({}));
      lastMsg = err.error?.message || `錯誤 ${res.status}`;
      if (res.status === 401 || res.status === 403) break;
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

  DB.addExercise({
    date:            todayStr(),
    exercise_name:   name,
    icon:            '✏️',
    met:             null,
    cat:             '自訂',
    duration:        dur,
    calories_burned: cal,
    is_manual:       true,
  });

  closeManualExercise();
  showToast(`✅ ${name} ${dur}分 · 消耗 ${Math.round(cal)} kcal`);
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
  const today = todayStr();
  if (DB.getExercises().some(e => e.date === today && e.is_rest_day)) {
    showToast('今天已標記為休息日');
    return;
  }
  DB.addExercise({ date: today, exercise_name: '休息日', icon: '😴', met: 0, cat: '休息', duration: 0, calories_burned: 0, is_rest_day: true });
  showToast('😴 已標記為休息日');
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
