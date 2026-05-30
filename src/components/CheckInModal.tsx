/**
 * 打卡弹窗组件
 * 显示打卡点详情和打卡操作
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Checkpoint, CheckInResult } from '../services/api';
import { RARITY_CONFIG, CATEGORY_CONFIG, CHECK_IN_DISTANCE_THRESHOLD } from '../config';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.55;

interface CheckInModalProps {
  visible: boolean;
  checkpoint: Checkpoint | null;
  distance: number;
  onClose: () => void;
  onCheckIn: (checkpointId: string) => Promise<CheckInResult | null>;
}

const CheckInModal: React.FC<CheckInModalProps> = ({
  visible,
  checkpoint,
  distance,
  onClose,
  onCheckIn,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const slideAnim = React.useRef(new Animated.Value(MODAL_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      setResult(null);
      setError(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleCheckIn = async () => {
    if (!checkpoint) return;

    setLoading(true);
    setError(null);

    try {
      const checkInResult = await onCheckIn(checkpoint.id);
      if (checkInResult) {
        setResult(checkInResult);
      } else {
        setError('打卡失败，请稍后重试');
      }
    } catch (err: any) {
      setError(err.message || '打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    slideAnim.setValue(MODAL_HEIGHT);
    onClose();
  };

  if (!checkpoint) return null;

  const rarityConfig = RARITY_CONFIG[checkpoint.rarity];
  const categoryConfig = CATEGORY_CONFIG[checkpoint.category];
  const canCheckIn = distance <= CHECK_IN_DISTANCE_THRESHOLD;
  const distanceText =
    distance >= 1000
      ? `${(distance / 1000).toFixed(1)}公里`
      : `${Math.round(distance)}米`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* 顶部稀有度色条 */}
          <View
            style={[
              styles.rarityBar,
              { backgroundColor: rarityConfig.color },
            ]}
          />

          {/* 关闭按钮 */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          {/* 打卡点信息 */}
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.categoryIcon}>
                {categoryConfig.icon}
              </Text>
              <View style={styles.headerTextContainer}>
                <Text style={styles.checkpointName}>
                  {checkpoint.name}
                </Text>
                <View
                  style={[
                    styles.rarityBadge,
                    { backgroundColor: rarityConfig.bgColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.rarityText,
                      { color: rarityConfig.color },
                    ]}
                  >
                    {rarityConfig.label}
                  </Text>
                </View>
              </View>
            </View>

            {checkpoint.address && (
              <Text style={styles.address}>{checkpoint.address}</Text>
            )}

            <Text style={styles.description}>{checkpoint.description}</Text>

            {/* 距离信息 */}
            <View
              style={[
                styles.distanceContainer,
                {
                  backgroundColor: canCheckIn
                    ? '#E8F5E9'
                    : '#FFF3E0',
                  borderColor: canCheckIn ? '#4CAF50' : '#FF9800',
                },
              ]}
            >
              <Text
                style={[
                  styles.distanceText,
                  { color: canCheckIn ? '#4CAF50' : '#FF9800' },
                ]}
              >
                {canCheckIn ? '📍' : '🚶'} 距离打卡点 {distanceText}
              </Text>
              <Text
                style={[
                  styles.distanceHint,
                  { color: canCheckIn ? '#66BB6A' : '#FFA726' },
                ]}
              >
                {canCheckIn
                  ? '已到达打卡范围，可以打卡！'
                  : `需靠近至${CHECK_IN_DISTANCE_THRESHOLD}米内才能打卡`}
              </Text>
            </View>

            {/* 奖励预览 */}
            <View style={styles.rewardPreview}>
              <Text style={styles.rewardTitle}>打卡奖励</Text>
              <View style={styles.rewardItems}>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>⭐</Text>
                  <Text style={styles.rewardValue}>
                    +{checkpoint.reward.experience} 经验
                  </Text>
                </View>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardIcon}>🪙</Text>
                  <Text style={styles.rewardValue}>
                    +{checkpoint.reward.coins} 金币
                  </Text>
                </View>
              </View>
            </View>

            {/* 错误提示 */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 打卡结果 */}
            {result && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>打卡成功！</Text>
                <View style={styles.resultRewards}>
                  <Text style={styles.resultReward}>
                    ⭐ +{result.rewards.experience} 经验
                  </Text>
                  <Text style={styles.resultReward}>
                    🪙 +{result.rewards.coins} 金币
                  </Text>
                </View>
                {result.levelUp && (
                  <View style={styles.levelUpContainer}>
                    <Text style={styles.levelUpText}>
                      🎉 恭喜升级！当前等级：Lv.{result.newLevel}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 打卡按钮 */}
            {!result && (
              <TouchableOpacity
                style={[
                  styles.checkInButton,
                  {
                    backgroundColor: canCheckIn
                      ? rarityConfig.color
                      : '#BDBDBD',
                  },
                ]}
                onPress={handleCheckIn}
                disabled={!canCheckIn || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.checkInButtonText}>
                    {canCheckIn ? '立即打卡' : `靠近后打卡`}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {result && (
              <TouchableOpacity
                style={[styles.checkInButton, { backgroundColor: '#4CAF50' }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.checkInButtonText}>完成</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: MODAL_HEIGHT,
    overflow: 'hidden',
  },
  rarityBar: {
    height: 4,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  infoContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  checkpointName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 16,
  },
  distanceContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  distanceHint: {
    fontSize: 12,
  },
  rewardPreview: {
    backgroundColor: '#FFFDE7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 8,
  },
  rewardItems: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  rewardValue: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  resultRewards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  resultReward: {
    fontSize: 15,
    color: '#388E3C',
    fontWeight: '500',
  },
  levelUpContainer: {
    marginTop: 8,
  },
  levelUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6F00',
  },
  checkInButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default CheckInModal;
