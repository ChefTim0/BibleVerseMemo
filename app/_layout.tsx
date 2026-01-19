// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "../contexts/AppContext";
import { AuthProvider } from "../contexts/AuthContext";
import { trpc, trpcClient } from "../lib/trpc";
import { USE_SUPABASE } from "../constants/features";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {USE_SUPABASE && (
        <>
          <Stack.Screen name="auth/login" options={{ headerShown: true }} />
          <Stack.Screen name="auth/register" options={{ headerShown: true }} />
          <Stack.Screen name="friends" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <GestureHandlerRootView>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
