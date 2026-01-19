import { Tabs } from "expo-router";
import { BookOpen, TrendingUp, Settings, Heart } from "lucide-react-native";
import React from "react";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../constants/translations";

export default function TabLayout() {
  const { language, theme } = useApp();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4F46E5",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
          borderTopColor: theme === 'dark' ? '#333333' : '#e5e5e5',
        },
        tabBarInactiveTintColor: theme === 'dark' ? '#888888' : '#666666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(language, 'books'),
          tabBarIcon: ({ color }) => <BookOpen color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t(language, 'progress'),
          tabBarIcon: ({ color }) => <TrendingUp color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="memorized"
        options={{
          title: t(language, 'memorized'),
          tabBarIcon: ({ color }) => <Heart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t(language, 'settings'),
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
