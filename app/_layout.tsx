import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../store/themeStore';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function RootLayout() {
  const { user, loading, initialize } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const unauthScreens = ['index', 'onboarding', 'auth'];
  const authScreens = ['(tabs)', 'auth'];

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        {(user ? authScreens : unauthScreens).map((name) => (
          <Stack.Screen name={name} key={name} />
        ))}
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
