import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function AppLayout() {
  const { session, profile, loading, initialLoading } = useAuth();

  if (initialLoading || loading) {
    return null;
  }

  if (!session || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-product"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat/[chatId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}