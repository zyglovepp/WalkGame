/**
 * 地图屏幕
 * 显示高德地图、打卡点标记、用户位置，支持打卡操作
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import MapView, { Region, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import CheckpointMarker from '../components/CheckpointMarker';
import CheckInModal from '../components/CheckInModal';
import { Checkpoint, CheckInResult } from '../services/api';
import {
  getCheckpoints,
  checkIn,
} from '../services/api';
import {
  MAP_CONFIG,
  DEFAULT_SEARCH_RADIUS,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
} from '../config';

interface MapScreenProps {
  onCheckInSuccess?: () => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onCheckInSuccess }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: MAP_CONFIG.defaultLatitude,
    longitude: MAP_CONFIG.defaultLongitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [distance, setDistance] = useState(0);
  const mapRef = useRef<MapView>(null);

  // 请求位置权限
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setLocationError('需要位置权限才能使用地图功能');
        return false;
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('需要位置权限才能使用地图功能');
      return false;
    }
    return true;
  };

  // 获取当前位置
  const getCurrentLocation = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(loc);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLocationError(null);
    } catch (err) {
      console.error('获取位置失败:', err);
      setLocationError('获取位置失败，请检查定位服务');
    }
  }, []);

  // 加载附近打卡点
  const loadCheckpoints = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const result = await getCheckpoints(lat, lng, DEFAULT_SEARCH_RADIUS);
      setCheckpoints(result);
    } catch (err) {
      console.error('加载打卡点失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // 位置变化时加载打卡点
  useEffect(() => {
    if (location) {
      loadCheckpoints(location.coords.latitude, location.coords.longitude);
    }
  }, [location, loadCheckpoints]);

  // 计算两点距离（Haversine公式）
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // 地球半径（米）
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 处理标记点击
  const handleMarkerPress = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);

    if (location) {
      const dist = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        checkpoint.latitude,
        checkpoint.longitude
      );
      setDistance(dist);
    } else {
      setDistance(9999);
    }

    setModalVisible(true);
  };

  // 处理打卡
  const handleCheckIn = async (
    checkpointId: string
  ): Promise<CheckInResult | null> => {
    if (!location) {
      Alert.alert('提示', '无法获取当前位置，请稍后重试');
      return null;
    }

    const result = await checkIn(
      checkpointId,
      location.coords.latitude,
      location.coords.longitude
    );

    if (result) {
      // 打卡成功后刷新打卡点列表
      loadCheckpoints(location.coords.latitude, location.coords.longitude);
      onCheckInSuccess?.();
    }

    return result;
  };

  // 回到当前位置
  const handleGoToMyLocation = () => {
    if (location) {
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    } else {
      getCurrentLocation();
    }
  };

  // 地图区域变化时重新加载打卡点
  const handleRegionChangeComplete = async (newRegion: Region) => {
    setRegion(newRegion);
    if (location) {
      // 只在移动距离较大时重新加载
      const dist = calculateDistance(
        region.latitude,
        region.longitude,
        newRegion.latitude,
        newRegion.longitude
      );
      if (dist > 500) {
        loadCheckpoints(newRegion.latitude, newRegion.longitude);
      }
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 地图 */}
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          rotateEnabled={false}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {/* 打卡点标记 */}
          {checkpoints.map((checkpoint) => (
            <CheckpointMarker
              key={checkpoint.id}
              checkpoint={checkpoint}
              onPress={handleMarkerPress}
              isSelected={selectedCheckpoint?.id === checkpoint.id}
            />
          ))}
        </MapView>

        {/* 位置错误提示 */}
        {locationError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{locationError}</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 顶部搜索提示 */}
        <View style={styles.topBar}>
          <View style={styles.searchHint}>
            <Text style={styles.searchHintText}>
              附近发现 {checkpoints.length} 个打卡点
            </Text>
          </View>
        </View>

        {/* 加载指示器 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4A90D9" />
          </View>
        )}

        {/* 定位按钮 */}
        <TouchableOpacity
          style={styles.locateButton}
          onPress={handleGoToMyLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.locateIcon}>📍</Text>
        </TouchableOpacity>

        {/* 图例 */}
        <View style={styles.legend}>
          {Object.entries(RARITY_CONFIG).map(([key, config]) => (
            <View key={key} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: config.color },
                ]}
              />
              <Text style={styles.legendText}>{config.label}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>

      {/* 打卡弹窗 */}
      <CheckInModal
        visible={modalVisible}
        checkpoint={selectedCheckpoint}
        distance={distance}
        onClose={() => {
          setModalVisible(false);
          setSelectedCheckpoint(null);
        }}
        onCheckIn={handleCheckIn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorBannerText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
  },
  retryText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  searchHint: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchHintText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 110,
    left: '50%',
    marginLeft: -16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locateButton: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  locateIcon: {
    fontSize: 22,
  },
  legend: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#555',
  },
});

export default MapScreen;
