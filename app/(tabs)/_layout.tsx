import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/components/useColorScheme.web';
import { HapticTab } from '@/components/HapticTab';
import { usePayment } from '@/contexts/PaymentProvider';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme() as 'light' | 'dark';
  const { hasPlan } = usePayment();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].primary,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="role"
        options={{
          title: 'Calculadora',
          tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="premium"
        redirect={hasPlan}
        options={{
          title: 'Crédito',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="credit-card-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="pay"
        options={{
          title: 'Assinatura',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet-membership" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
