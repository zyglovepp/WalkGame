/**
 * 个人中心屏幕
 * 显示用户等级、金币、经验值、打卡统计
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { User, UserStats, getUserInfo, getUserStats } from '../services/api';
import { LEVEL_EXPERIENCE, RARITY_CONFIG, CATEGORY_CONFIG } from '../config';

interface ProfileScreenProps {
  onRefresh?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onRefresh }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载用户数据
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const [userInfo, userStats] = await Promise.all([
        getUserInfo(),
        getUserStats(),
      ]);
      if (userInfo) setUser(userInfo);
      if (userStats) setStats(userStats);
    } catch (err) {
      console.error('加载用户数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // 获取当前等级进度
  const getLevelProgress = (): { current: number; total: number; percent: number } => {
    if (!user) return { current: 0, total: 100, percent: 0 };

    const level = user.level;
    const currentExp = user.experience;
    const currentLevelExp =
      level - 1 < LEVEL_EXPERIENCE.length
        ? LEVEL_EXPERIENCE[level - 1]
        : LEVEL_EXPERIENCE[LEVEL_EXPERIENCE.length - 1];
    const nextLevelExp =
      level < LEVEL_EXPERIENCE.length
        ? LEVEL_EXPERIENCE[level]
        : LEVEL_EXPERIENCE[LEVEL_EXPERIENCE.length - 1] * 1.5;

    const expInLevel = currentExp - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    const percent = Math.min(
      Math.max((expInLevel / expNeeded) * 100, 0),
      100
    );

    return {
      current: Math.round(expInLevel),
      total: Math.round(expNeeded),
      percent,
    };
  };

  // 格式化距离
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const levelProgress = getLevelProgress();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          // 这里简单使用 TouchableOpacity 刷新
          undefined
        }
      >
        {/* 用户信息卡片 */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🚶</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                Lv.{user?.level || 1}
              </Text>
            </View>
          </View>

          <Text style={styles.username}>
            {user?.username || '探索者'}
          </Text>

          {/* 经验值进度条 */}
          <View style={styles.expContainer}>
            <View style={styles.expHeader}>
              <Text style={styles.expLabel}>经验值</Text>
              <Text style={styles.expValue}>
                {levelProgress.current} / {levelProgress.total}
              </Text>
            </View>
            <View style={styles.expBarBg}>
              <View
                style={[
                  styles.expBarFill,
                  { width: `${levelProgress.percent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 数据统计 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statValue}>
              {user?.coins || 0}
            </Text>
            <Text style={styles.statLabel}>金币</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statValue}>
              {user?.totalCheckIns || 0}
            </Text>
            <Text style={styles.statLabel}>打卡次数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚶</Text>
            <Text style={styles.statValue}>
              {formatDistance(user?.totalDistance || 0)}
            </Text>
            <Text style={styles.statLabel}>总里程</Text>
          </View>
        </View>

        {/* 稀有度统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>稀有度统计</Text>
          <View style={styles.rarityStats}>
            {Object.entries(RARITY_CONFIG).map(([key, config]) => {
              const count = stats?.checkInsByRarity
                ? (stats.checkInsByRarity as Record<string, number>)[key] || 0
                : 0;
              return (
                <View key={key} style={styles.rarityStatItem}>
                  <View
                    style={[
                      styles.rarityStatDot,
                      { backgroundColor: config.color },
                    ]}
                  />
                  <Text style={styles.rarityStatLabel}>
                    {config.label}
                  </Text>
                  <Text style={styles.rarityStatValue}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 分类统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分类统计</Text>
          <View style={styles.categoryStats}>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const count = stats?.checkInsByCategory
                ? (stats.checkInsByCategory as Record<string, number>)[key] || 0
                : 0;
              return (
                <View key={key} style={styles.categoryStatItem}>
                  <Text style={styles.categoryStatIcon}>
                    {config.icon}
                  </Text>
                  <Text style={styles.categoryStatLabel}>
                    {config.label}
                  </Text>
                  <Text style={styles.categoryStatValue}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 最近打卡 */}
        {stats?.recentCheckIns && stats.recentCheckIns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近打卡</Text>
            {stats.recentCheckIns.slice(0, 5).map((record) => {
              const checkpoint = record.checkpoint;
              const rarityConfig = checkpoint
                ? RARITY_CONFIG[checkpoint.rarity]
                : null;
              const categoryConfig = checkpoint
                ? CATEGORY_CONFIG[checkpoint.category]
                : null;

              return (
                <View key={record.id} style={styles.recentItem}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>
                    {categoryConfig ? categoryConfig.icon : '📍'}
                  </Text>
                  <View style={styles.recentItemContent}>
                    <Text style={styles.recentItemName}>
                      {checkpoint?.name || '未知打卡点'}
                    </Text>
                    <Text style={styles.recentItemReward}>
                      ⭐+{record.reward.experience} 🪙+{record.reward.coins}
                    </Text>
                  </View>
                  {rarityConfig && (
                    <View
                      style={[
                        styles.recentItemRarity,
                        { backgroundColor: rarityConfig.bgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.recentItemRarityText,
                          { color: rarityConfig.color },
                        ]}
                      >
                        {rarityConfig.label}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 底部间距 */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* 刷新按钮 */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => {
          loadUserData();
          onRefresh?.();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.refreshButtonText}>刷新数据</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#4A90D9',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  expContainer: {
    width: '100%',
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  expValue: {
    fontSize: 13,
    color: '#999',
  },
  expBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: '#4A90D9',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  rarityStats: {
    gap: 10,
  },
  rarityStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rarityStatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  rarityStatLabel: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  rarityStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  categoryStats: {
    gap: 8,
  },
  categoryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  categoryStatIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryStatLabel: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  categoryStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  recentItemReward: {
    fontSize: 12,
    color: '#999',
  },
  recentItemRarity: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recentItemRarityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4A90D9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen;
