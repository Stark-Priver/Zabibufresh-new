import React from 'react';
import { Stack, Redirect, Tabs } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native'; // For a potential Add Product button in header

// This component will be the main tab navigator
const AppTabs = () => {
  const { profile } = useAuth();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'products') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: profile?.role === 'seller' ? 'Seller Dashboard' : 'Browse Grapes',
          headerTitle: profile?.role === 'seller' ? 'Seller Dashboard' : 'Browse Grapes',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: profile?.role === 'seller' ? 'My Listings' : 'Catalog',
          headerTitle: profile?.role === 'seller' ? 'My Listings' : 'Product Catalog',
        }}
      />
      <Tabs.Screen name="chat" options={{ title: 'Messages' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* The "add-product" screen is part of the Stack, not Tabs directly */}
    </Tabs>
  );
};


export default function AppLayout() {
  const { session, profile, loading, initialLoading } = useAuth();

  if (initialLoading || loading) {
    return null; // Or a loading indicator
  }

  if (!session || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  // The main layout for the (app) group will be a Stack navigator.
  // The Tabs navigator will be one of the screens in this Stack.
  return (
    <Stack>
      <Stack.Screen
        name="tabs" // This will render the AppTabs component
        options={{ headerShown: false }} // Hide header for the tab container itself
      />
      <Stack.Screen
        name="add-product"
        options={{
          title: 'Add New Product',
          headerBackTitle: 'Back', // Or use a custom back button
          presentation: 'modal', // Optional: display as a modal
        }}
      />
      {/* Add other Stack screens here, e.g., ProductDetailScreen */}
    </Stack>
  );
}
