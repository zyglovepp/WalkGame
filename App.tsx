/**
 * WalkGame 主应用入口
 * 底部Tab导航：地图、记录、我的、设置
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapScreen from './src/screens/MapScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Tab 导航类型定义
type TabParamList = {
  Map: undefined;
  Records: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, size }) => {
              let icon = '📍';
              switch (route.name) {
                case 'Map':
                  icon = '🗺️';
                  break;
                case 'Records':
                  icon = '📋';
                  break;
                case 'Profile':
                  icon = '👤';
                  break;
                case 'Settings':
                  icon = '⚙️';
                  break;
              }
              return (
                <Text
                  style={{
                    fontSize: focused ? size + 2 : size,
                    opacity: focused ? 1 : 0.6,
                  }}
                >
                  {icon}
                </Text>
              );
            },
            tabBarActiveTintColor: '#4A90D9',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              height: 60,
              paddingBottom: 8,
              paddingTop: 4,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#f0f0f0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: '#fff',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '700',
              color: '#1a1a2e',
            },
          })}
        >
          <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{
              title: '探索地图',
              headerShown: false,
            }}
          />
          <Tab.Screen
            name="Records"
            component={RecordsScreen}
            options={{
              title: '打卡记录',
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: '我的',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: '设置',
            }}
          />
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
