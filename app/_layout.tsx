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
import PaymentProvider from '@/contexts/PaymentProvider';



export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [appIsReady, setAppIsReady] = useState(false);



  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {

    async function prepare() {
      try {

        await new Promise(resolve => setTimeout(resolve, 1500));
        if (loaded) {
          SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [loaded]);

  if (!appIsReady || !loaded) {
    return <Splash />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PaperProvider>
        <PaymentProvider>

          <Stack screenOptions={{

            headerShown: false
          }}>
            <Stack.Screen name="(tabs)" options={{}} />
          </Stack>
        </PaymentProvider>
      </PaperProvider>
      <StatusBar style="auto" />
    </ThemeProvider >
  );
}
