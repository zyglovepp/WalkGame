/**
 * 打卡点标记组件
 * 根据稀有度显示不同颜色的标记
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Checkpoint, Rarity } from '../services/api';
import { RARITY_CONFIG, CATEGORY_CONFIG } from '../config';

interface CheckpointMarkerProps {
  checkpoint: Checkpoint;
  onPress: (checkpoint: Checkpoint) => void;
  isSelected?: boolean;
}

const CheckpointMarker: React.FC<CheckpointMarkerProps> = ({
  checkpoint,
  onPress,
  isSelected = false,
}) => {
  const rarityConfig = RARITY_CONFIG[checkpoint.rarity];
  const categoryConfig = CATEGORY_CONFIG[checkpoint.category];
  const markerSize = isSelected ? 44 : 36;

  return (
    <Marker
      coordinate={{
        latitude: checkpoint.latitude,
        longitude: checkpoint.longitude,
      }}
      onPress={() => onPress(checkpoint)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={[
          styles.markerContainer,
          {
            width: markerSize,
            height: markerSize,
            borderRadius: markerSize / 2,
            backgroundColor: rarityConfig.bgColor,
            borderColor: isSelected ? rarityConfig.color : rarityConfig.borderColor,
            borderWidth: isSelected ? 3 : 2,
            elevation: isSelected ? 6 : 3,
            shadowColor: rarityConfig.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isSelected ? 0.5 : 0.3,
            shadowRadius: isSelected ? 4 : 2,
          },
        ]}
      >
        <Text style={{ fontSize: markerSize * 0.45 }}>
          {categoryConfig.icon}
        </Text>
      </View>
      {/* 传说级标记添加光晕效果 */}
      {checkpoint.rarity === 'legendary' && (
        <View
          style={[
            styles.legendaryGlow,
            {
              width: markerSize + 16,
              height: markerSize + 16,
              borderRadius: (markerSize + 16) / 2,
              borderColor: rarityConfig.color,
            },
          ]}
        />
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendaryGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    borderWidth: 1.5,
    opacity: 0.4,
  },
});

export default CheckpointMarker;
