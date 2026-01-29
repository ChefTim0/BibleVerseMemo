import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { getColors } from '@/constants/colors';

// NOTE: When running locally with development build, install react-native-google-mobile-ads
// and uncomment the real implementation below.
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export function AdBanner() {
  const { theme } = useApp();
  const colors = getColors(theme);
  
  const adUnitId = Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_IOS,
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID,
  });

  if (!adUnitId) {
    return null;
  }

  // Placeholder for Expo Go / Web where native AdMob is not supported
  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>AdMob Banner</Text>
      <Text style={[styles.debugText, { color: colors.textSecondary }]}>{adUnitId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    minHeight: 60,
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    opacity: 0.7,
  }
});
