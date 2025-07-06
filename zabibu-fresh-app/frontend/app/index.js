import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from './contexts/AuthContext';

export default function StartPage() {
  const { session, initialLoading, profile } = useAuth();

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // If session exists, but profile might still be loading or is confirmed loaded
  // The main redirection logic is in app/_layout.js based on session and profile
  // This page might briefly show if app/_layout.js hasn't redirected yet.
  // Or, if session exists and profile exists, it should redirect to (app)/home.
  if (session && profile) {
     return <Redirect href="/(app)/home" />;
  }

  // If session exists but no profile (e.g. still loading, or creation failed),
  // user might be stuck in a loop if not handled carefully in _layout.js
  // For now, _layout.js should handle redirecting to (auth)/login if profile is missing.
  // So, this state might not be hit if _layout.js logic is robust.
  // If it is hit, showing a loader while _layout figures things out is safe.
   return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
