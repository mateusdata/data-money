import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { colorBlack, colorPrymary } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Splash from '@/components/SplashScreen';
import { PaperProvider } from 'react-native-paper';
import { AdsProvider } from '@/contexts/ads-provider';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PaperProvider>
        <AdsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{}} />
            <Stack.Screen name="subscription" options={{ headerShown: false }} />
          </Stack>
        </AdsProvider>
      </PaperProvider>
      <StatusBar style="auto" />
    </ThemeProvider >
  );
}
