import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function StackCalculator() {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="role" />
    </Stack>
  );
}
