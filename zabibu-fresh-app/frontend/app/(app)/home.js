import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { router } from 'expo-router';

const HomeScreen = () => {
  const { user, profile, setProfile } = useAuth(); // Assuming setProfile clears on logout via AuthContext

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      // AuthContext listener should handle clearing session and profile
      // Router in _layout.js should redirect to login
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {profile.fullName || user?.email}!</Text>
      <Text style={styles.roleText}>You are logged in as a: {profile.role}</Text>

      {profile.role === 'seller' ? (
        <View>
          <Text style={styles.contentText}>Seller Dashboard:</Text>
          <Text style={styles.contentText}>- View your product listings</Text>
          <Text style={styles.contentText}>- See incoming messages</Text>
          {/* Add navigation to seller specific views */}
        </View>
      ) : (
        <View>
          <Text style={styles.contentText}>Buyer Dashboard:</Text>
          <Text style={styles.contentText}>- Browse product catalog</Text>
          <Text style={styles.contentText}>- View your ongoing chats</Text>
          {/* Add navigation to buyer specific views */}
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Go to Settings (to Logout)" onPress={() => router.push('/(app)/settings')} color="#6200ee"/>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 20,
  },
  contentText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center'
  },
  buttonContainer: {
      marginTop: 30,
  }
});

export default HomeScreen;
