/**
 * WalkGame 应用配置
 */

// API 基础地址
// Android 模拟器使用 10.0.2.2 访问本机
// 真机调试时请改为电脑的局域网 IP（如 192.168.1.100）
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// 高德地图 Key
export const AMAP_ANDROID_KEY = '446dbe632e92bae038c8b07d516873dd';
export const AMAP_WEB_KEY = '963ced950d9c367066c012f46ccdf6e2';

// 默认搜索半径（米）
export const DEFAULT_SEARCH_RADIUS = 2000;

// 打卡距离阈值（米）- 超过此距离无法打卡
export const CHECK_IN_DISTANCE_THRESHOLD = 100;

// 稀有度配置
export const RARITY_CONFIG = {
  common: {
    label: '普通',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    borderColor: '#66BB6A',
  },
  rare: {
    label: '稀有',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    borderColor: '#AB47BC',
  },
  legendary: {
    label: '传说',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    borderColor: '#FFA726',
  },
} as const;

// 打卡点分类配置
export const CATEGORY_CONFIG = {
  park: { label: '公园绿地', icon: '🌳' },
  culture: { label: '历史文化', icon: '🏛️' },
  landmark: { label: '现代地标', icon: '🏙️' },
  hutong: { label: '胡同文化', icon: '🏘️' },
  nature: { label: '自然景观', icon: '🌿' },
  commercial: { label: '商业区', icon: '🛍️' },
} as const;

// 等级经验值表（每级所需累计经验）
export const LEVEL_EXPERIENCE = [
  0,      // Lv.1
  100,    // Lv.2
  250,    // Lv.3
  500,    // Lv.4
  1000,   // Lv.5
  1800,   // Lv.6
  3000,   // Lv.7
  5000,   // Lv.8
  8000,   // Lv.9
  12000,  // Lv.10
  18000,  // Lv.11
  25000,  // Lv.12
  35000,  // Lv.13
  50000,  // Lv.14
  70000,  // Lv.15
];

// 地图默认设置
export const MAP_CONFIG = {
  defaultLatitude: 39.9042,   // 北京天安门
  defaultLongitude: 116.4074,
  defaultZoom: 14,
  minZoom: 3,
  maxZoom: 20,
};
