/**
 * WalkGame 设置页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { testConnection } from '../services/api';

const STORAGE_KEY_SERVER_URL = '@walkgame_server_url';

export default function SettingsScreen() {
  const [serverUrl, setServerUrl] = useState(API_BASE_URL);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadServerUrl();
  }, []);

  const loadServerUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
      if (savedUrl) {
        setServerUrl(savedUrl);
      }
    } catch (error) {
      console.error('读取服务器地址失败:', error);
    }
  };

  const handleSave = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('提示', '服务器地址不能为空');
      return;
    }

    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, serverUrl.trim());
      Alert.alert('成功', '服务器地址已保存，重启应用后生效');
    } catch (error) {
      console.error('保存服务器地址失败:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('提示', '请先输入服务器地址');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection(serverUrl.trim());
      setTestResult(result);
      if (result.success) {
        Alert.alert('连接成功', result.message);
      } else {
        Alert.alert('连接失败', result.message);
      }
    } catch (error: any) {
      const message = error.message || '连接测试失败';
      setTestResult({ success: false, message });
      Alert.alert('连接失败', message);
    } finally {
      setTesting(false);
    }
  };

  const handleResetToDefault = () => {
    Alert.alert('恢复默认', '确定要恢复为默认服务器地址吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          setServerUrl(API_BASE_URL);
          try {
            await AsyncStorage.removeItem(STORAGE_KEY_SERVER_URL);
            Alert.alert('成功', '已恢复为默认服务器地址');
          } catch (error) {
            console.error('恢复默认地址失败:', error);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 服务器设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>服务器设置</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>服务器地址</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://172.27.183.76:3000/api"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            默认地址：{API_BASE_URL}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>保存</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#4A90D9" size="small" />
            ) : (
              <Text style={[styles.buttonText, { color: '#4A90D9' }]}>
                连接测试
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {testResult && (
          <View
            style={[
              styles.resultBox,
              testResult.success ? styles.resultSuccess : styles.resultFail,
            ]}
          >
            <Text
              style={[
                styles.resultText,
                testResult.success ? styles.resultSuccessText : styles.resultFailText,
              ]}
            >
              {testResult.success ? '✓ ' : '✗ '}
              {testResult.message}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={handleResetToDefault}>
          <Text style={styles.resetButtonText}>恢复默认地址</Text>
        </TouchableOpacity>
      </View>

      {/* 关于 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>

        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>应用名称</Text>
          <Text style={styles.aboutValue}>WalkGame</Text>
        </View>

        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>版本号</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>

        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>应用类型</Text>
          <Text style={styles.aboutValue}>Expo React Native</Text>
        </View>

        <View style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>描述</Text>
          <Text style={styles.aboutValue}>
            WalkGame 是一款基于地理位置的探索打卡应用，通过步行探索城市中的各个打卡点，收集奖励并提升等级。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4A90D9',
  },
  testButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4A90D9',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  resultBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  resultSuccess: {
    backgroundColor: '#E8F5E9',
  },
  resultFail: {
    backgroundColor: '#FFEBEE',
  },
  resultText: {
    fontSize: 13,
  },
  resultSuccessText: {
    color: '#2E7D32',
  },
  resultFailText: {
    color: '#C62828',
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#999',
  },
  aboutItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  aboutLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});
