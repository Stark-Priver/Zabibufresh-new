import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native';
import { router } from 'expo-router'; // For navigation

export default function TabLayout() {
  const { profile } = useAuth(); // No need for session/loading here, parent layout handles it

  if (!profile) {
    // This should ideally be caught by the parent (app)/_layout.js
    // But as a safeguard:
    return <Redirect href="/(auth)/login" />;
  }

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
          title: profile.role === 'seller' ? 'Dashboard' : 'Browse Grapes',
          headerTitle: profile.role === 'seller' ? 'Seller Dashboard' : 'Browse Grapes',
          headerRight: () => (
            profile.role === 'seller' && Platform.OS !== 'web' ? ( // Example: Add button for sellers
              <Button onPress={() => router.push('/(app)/add-product')} title="Add New" color="#007bff" />
            ) : null
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: profile.role === 'seller' ? 'My Listings' : 'Catalog',
          headerTitle: profile.role === 'seller' ? 'My Listings' : 'Product Catalog',
          headerRight: () => (
            profile.role === 'seller' && Platform.OS !== 'web' ? (
              <Button onPress={() => router.push('/(app)/add-product')} title="Add New" color="#007bff" />
            ) : null
          ),
        }}
      />
      <Tabs.Screen name="chat" options={{ title: 'Messages' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
