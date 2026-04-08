import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <NativeTabs
      backgroundColor={scheme === 'dark' ? '#1c1c1c' : '#ffffff'}
      indicatorColor={theme.primary}
      labelStyle={{ selected: { color: theme.primary } }}>
      
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calculator">
        <NativeTabs.Trigger.Label>Calculadora</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="function" md="calculate" />
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}
