import { COLORS_LIGHT } from '@/theme/colors';
import { Tabs } from 'expo-router';
import { History, Home, User } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS_LIGHT.primary,
        tabBarInactiveTintColor: COLORS_LIGHT.textMuted,
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          borderTopWidth: 1,
          borderTopColor: COLORS_LIGHT.border,
          backgroundColor: COLORS_LIGHT.surface,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 1,
          marginBottom: 2,
        },
        // tabBarItemStyle: {
        //   paddingTop: 1,
        // },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", position: "relative" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -8,
                    height: 3,
                    width: 60,
                    backgroundColor: COLORS_LIGHT.primary,
                    borderRadius: 3,
                  }}
                />
              )}
              <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", position: "relative" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -8,
                    height: 3,
                    width: 60,
                    backgroundColor: COLORS_LIGHT.primary,
                    borderRadius: 3,
                  }}
                />
              )}
              <History
                size={24}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", position: "relative" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -8,
                    height: 3,
                    width: 60,
                    backgroundColor: COLORS_LIGHT.primary,
                    borderRadius: 3,
                  }}
                />
              )}
              <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}



