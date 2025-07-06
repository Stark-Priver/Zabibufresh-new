import React, { useEffect } from 'react';
import { Slot, SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { session, loading, initialLoading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initialLoading) return; // Don't hide splash until initial auth check is done

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (session && profile) { // User is authenticated and has a profile
      if (inAuthGroup || segments.length === 0 || (segments.length > 0 && segments[0] === 'index')) {
        // If in auth routes, or at root, or at an unprotected index, redirect to app home
        router.replace('/(app)/home');
      }
      SplashScreen.hideAsync();
    } else if (!session) { // User is not authenticated
      if (inAppGroup) {
        // If in app routes, redirect to login
        router.replace('/(auth)/login');
      }
      SplashScreen.hideAsync();
    } else if (session && !profile && !loading) {
      // User is authed but profile is still loading or missing
      // This could be a brief moment or indicate an issue (e.g. profile creation failed post-signup)
      // For now, we assume AuthContext handles fetching profile. If it's missing for a logged-in user,
      // they might be stuck on auth pages or need a dedicated "complete profile" page.
      // If they are on an app page, they might get redirected to login if we are too strict.
      // Let's keep them on auth pages if profile is missing.
      if (inAppGroup) {
        router.replace('/(auth)/login'); // Or a dedicated "profile_pending" screen
      }
      SplashScreen.hideAsync();
    } else if (!initialLoading && !loading) {
      // Fallback to hide splash screen if no other condition met it
      SplashScreen.hideAsync();
    }

  }, [session, profile, initialLoading, loading, segments, router]);


  if (initialLoading) {
    // You can render a loading indicator here if needed, but SplashScreen is active
    return null;
  }

  // Slot will render the current child route.
  // Stack can be used here if you want a global header/navigation options for all routes.
  // return <Slot />;

  // Using Stack navigator to provide a consistent structure.
  // You might have different stacks for auth and app routes.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="index" redirect={!session} />
    </Stack>
  );

};

const RootLayout = () => {
  // Required for gesture handling with React Navigation
  // Also, ensure `expo-router` is configured in babel.config.js if not already.
  // `plugins: ["expo-router/babel"]`
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
