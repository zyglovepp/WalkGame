/**
 * 记录屏幕
 * 显示打卡历史列表，支持下拉刷新和分页加载
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  CheckInRecord,
  Checkpoint,
  getCheckInRecords,
} from '../services/api';
import { RARITY_CONFIG, CATEGORY_CONFIG } from '../config';

interface RecordsScreenProps {
  onRefresh?: () => void;
}

const RecordsScreen: React.FC<RecordsScreenProps> = ({ onRefresh }) => {
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // 加载打卡记录
  const loadRecords = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await getCheckInRecords(pageNum, 20);

        if (isRefresh) {
          setRecords(result.records);
        } else {
          setRecords((prev) => [...prev, ...result.records]);
        }

        setTotal(result.pagination.total);
        setHasMore(pageNum < result.pagination.totalPages);
        setPage(pageNum);
      } catch (err) {
        console.error('加载记录失败:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // 初始加载
  useEffect(() => {
    loadRecords(1, true);
  }, []);

  // 下拉刷新
  const handleRefresh = () => {
    loadRecords(1, true);
    onRefresh?.();
  };

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadRecords(page + 1);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  // 格式化距离
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  // 渲染单条记录
  const renderRecord = ({ item }: { item: CheckInRecord }) => {
    const checkpoint = item.checkpoint;
    const rarityConfig = checkpoint
      ? RARITY_CONFIG[checkpoint.rarity]
      : null;
    const categoryConfig = checkpoint
      ? CATEGORY_CONFIG[checkpoint.category]
      : null;

    return (
      <View style={styles.recordCard}>
        {/* 左侧图标 */}
        <View
          style={[
            styles.recordIcon,
            {
              backgroundColor: rarityConfig
                ? rarityConfig.bgColor
                : '#f0f0f0',
            },
          ]}
        >
          <Text style={{ fontSize: 24 }}>
            {categoryConfig ? categoryConfig.icon : '📍'}
          </Text>
        </View>

        {/* 中间内容 */}
        <View style={styles.recordContent}>
          <Text style={styles.recordName} numberOfLines={1}>
            {checkpoint?.name || '未知打卡点'}
          </Text>
          <View style={styles.recordMeta}>
            <Text style={styles.recordTime}>
              {formatDate(item.createdAt)}
            </Text>
            {rarityConfig && (
              <View
                style={[
                  styles.rarityTag,
                  { backgroundColor: rarityConfig.bgColor },
                ]}
              >
                <Text
                  style={[
                    styles.rarityTagText,
                    { color: rarityConfig.color },
                  ]}
                >
                  {rarityConfig.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 右侧奖励 */}
        <View style={styles.recordReward}>
          <Text style={styles.rewardExp}>
            ⭐+{item.reward.experience}
          </Text>
          <Text style={styles.rewardCoins}>
            🪙+{item.reward.coins}
          </Text>
        </View>
      </View>
    );
  };

  // 渲染空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🗺️</Text>
      <Text style={styles.emptyTitle}>还没有打卡记录</Text>
      <Text style={styles.emptySubtitle}>
        去地图上探索附近的打卡点吧！
      </Text>
    </View>
  );

  // 渲染底部
  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4A90D9" />
        <Text style={styles.footerText}>加载更多...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>打卡记录</Text>
        <Text style={styles.headerSubtitle}>
          共 {total} 次打卡
        </Text>
      </View>

      {/* 记录列表 */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A90D9']}
            tintColor="#4A90D9"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          records.length === 0 ? styles.emptyList : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordTime: {
    fontSize: 12,
    color: '#999',
  },
  rarityTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  rarityTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recordReward: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  rewardExp: {
    fontSize: 13,
    color: '#F57F17',
    fontWeight: '500',
    marginBottom: 2,
  },
  rewardCoins: {
    fontSize: 13,
    color: '#FF8F00',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default RecordsScreen;
