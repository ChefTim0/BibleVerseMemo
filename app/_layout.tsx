// template
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "../contexts/AppContext";
import { initNotifications } from "../utils/notifications";
import { Platform } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Initialize notifications system
    if (Platform.OS !== 'web') {
      initNotifications().catch(console.error);
    }
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppProvider>
      <GestureHandlerRootView>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </AppProvider>
  );
}
