/**
 * WalkGame API 服务
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// AsyncStorage 存储键
const STORAGE_KEY_SERVER_URL = '@walkgame_server_url';

// ============ 类型定义 ============

// 打卡点分类
export type CheckpointCategory =
  | 'park'
  | 'culture'
  | 'landmark'
  | 'hutong'
  | 'nature'
  | 'commercial';

// 稀有度
export type Rarity = 'common' | 'rare' | 'legendary';

// 奖励
export interface Reward {
  experience: number;
  coins: number;
  items?: Item[];
}

// 物品
export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'pet' | 'badge' | 'consumable' | 'equipment';
  rarity: Rarity;
  imageUrl?: string;
}

// 打卡点
export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: CheckpointCategory;
  rarity: Rarity;
  reward: Reward;
  imageUrl?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// 用户
export interface User {
  id: string;
  username: string;
  avatar?: string;
  level: number;
  experience: number;
  coins: number;
  totalCheckIns: number;
  totalDistance: number;
  createdAt: string;
  updatedAt: string;
}

// 打卡记录
export interface CheckInRecord {
  id: string;
  userId: string;
  checkpointId: string;
  checkpoint?: Checkpoint;
  latitude: number;
  longitude: number;
  distance: number;
  reward: Reward;
  createdAt: string;
}

// 用户统计
export interface UserStats {
  totalCheckIns: number;
  totalDistance: number;
  totalExperience: number;
  checkInsByCategory: Record<CheckpointCategory, number>;
  checkInsByRarity: Record<Rarity, number>;
  recentCheckIns: CheckInRecord[];
}

// 导航路线
export interface NavigationRoute {
  distance: number;
  duration: number;
  polyline: { latitude: number; longitude: number }[];
}

// API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 打卡点列表响应
export interface CheckpointListResponse {
  checkpoints: Checkpoint[];
  pagination: Pagination;
}

// 打卡结果
export interface CheckInResult {
  success: boolean;
  record: CheckInRecord;
  levelUp?: boolean;
  newLevel?: number;
  rewards: Reward;
}

// ============ API 客户端 ============

/**
 * 初始化 API 客户端，支持从 AsyncStorage 读取自定义服务器地址
 */
async function getBaseUrl(): Promise<string> {
  try {
    const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (savedUrl) {
      return savedUrl;
    }
  } catch (error) {
    console.error('读取自定义服务器地址失败:', error);
  }
  return API_BASE_URL;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 更新 API 客户端的 baseURL
 */
export async function updateApiBaseUrl(): Promise<void> {
  const baseUrl = await getBaseUrl();
  apiClient.defaults.baseURL = baseUrl;
  console.log('[API] baseURL 已更新为:', baseUrl);
}

// 应用启动时更新 baseURL
updateApiBaseUrl();

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] 请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('[API] 响应错误:', error.message);
    if (error.response) {
      console.error('[API] 状态码:', error.response.status);
      console.error('[API] 响应数据:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// ============ API 方法 ============

/**
 * 获取附近打卡点
 */
export async function getCheckpoints(
  latitude: number,
  longitude: number,
  radius: number = 2000
): Promise<Checkpoint[]> {
  try {
    const response = await apiClient.get<ApiResponse<CheckpointListResponse>>(
      '/checkpoints',
      {
        params: { latitude, longitude, radius },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data.checkpoints;
    }
    return [];
  } catch (error) {
    console.error('获取打卡点失败:', error);
    return [];
  }
}

/**
 * 打卡
 */
export async function checkIn(
  checkpointId: string,
  latitude: number,
  longitude: number
): Promise<CheckInResult | null> {
  try {
    const response = await apiClient.post<ApiResponse<CheckInResult>>(
      '/checkins',
      {
        checkpointId,
        latitude,
        longitude,
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error: any) {
    console.error('打卡失败:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('打卡失败，请稍后重试');
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfo(): Promise<User | null> {
  try {
    const response = await apiClient.get<ApiResponse<User>>('/users/profile');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 获取打卡记录
 */
export async function getCheckInRecords(
  page: number = 1,
  limit: number = 20
): Promise<{ records: CheckInRecord[]; pagination: Pagination }> {
  try {
    const response = await apiClient.get<ApiResponse<{
      records: CheckInRecord[];
      pagination: Pagination;
    }>>('/checkins/records', {
      params: { page, limit },
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return { records: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  } catch (error) {
    console.error('获取打卡记录失败:', error);
    return { records: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }
}

/**
 * 获取步行路线
 */
export async function getWalkingRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<NavigationRoute | null> {
  try {
    const response = await apiClient.post<ApiResponse<NavigationRoute>>(
      '/routes/walking',
      {
        origin,
        destination,
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('获取路线失败:', error);
    return null;
  }
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(): Promise<UserStats | null> {
  try {
    const response = await apiClient.get<ApiResponse<UserStats>>(
      '/users/stats'
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return null;
  }
}

/**
 * 测试服务器连接
 * @param customUrl 可选的自定义服务器地址，如果不传则使用当前配置
 */
export async function testConnection(
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = customUrl || apiClient.defaults.baseURL || API_BASE_URL;
    const startTime = Date.now();

    const response = await axios.get(`${url}/health`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const elapsed = Date.now() - startTime;

    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: `连接成功 (${elapsed}ms)`,
      };
    }

    return {
      success: false,
      message: `服务器返回异常状态码: ${response.status}`,
    };
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        success: false,
        message: '连接超时，请检查服务器地址是否正确',
      };
    }
    if (error.code === 'ENOTFOUND' || error.code === 'EHOSTUNREACH') {
      return {
        success: false,
        message: '无法连接到服务器，请检查地址和网络',
      };
    }
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: '服务器拒绝连接，请确认服务已启动',
      };
    }
    return {
      success: false,
      message: `连接失败: ${error.message || '未知错误'}`,
    };
  }
}

export default apiClient;
