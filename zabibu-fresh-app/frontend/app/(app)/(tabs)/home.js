import React from 'react';
import { View, Text, StyleSheet, Button, Platform } from 'react-native'; // Added Platform
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import { supabase } from '../../services/supabase'; // Adjusted path
import { router } from 'expo-router';

const HomeScreen = () => {
  const { user, profile } = useAuth();

  // Logout is typically handled in a settings page or a dedicated button in a header/drawer
  // For this example, let's assume logout is primarily on the Settings tab.

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
        <View style={styles.contentBox}>
          <Text style={styles.sectionTitle}>Seller Dashboard</Text>
          <Text style={styles.contentText}>- Manage your product listings.</Text>
          <Text style={styles.contentText}>- View incoming messages from buyers.</Text>
          <View style={styles.buttonContainer}>
            <Button title="Add New Product" onPress={() => router.push('/(app)/add-product')} color="#007bff"/>
            <View style={{marginVertical: 5}} />
            <Button title="View My Listings" onPress={() => router.push('/(app)/(tabs)/products')} color="#6200ee"/>
          </View>
        </View>
      ) : (
        <View style={styles.contentBox}>
          <Text style={styles.sectionTitle}>Buyer Dashboard</Text>
          <Text style={styles.contentText}>- Discover fresh grapes from local farmers.</Text>
          <Text style={styles.contentText}>- Connect directly with sellers.</Text>
           <View style={styles.buttonContainer}>
            <Button title="Browse Product Catalog" onPress={() => router.push('/(app)/(tabs)/products')} color="#6200ee"/>
          </View>
        </View>
      )}
      {/* Removed direct logout button from here, assuming it's in settings or main header */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa', // Light gray background
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40', // Darker text
  },
  roleText: {
    fontSize: 18,
    color: '#6c757d', // Muted color
    marginBottom: 25,
  },
  contentBox: {
    width: '100%',
    padding: 20,
    backgroundColor: '#ffffff', // White content box
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 15,
  },
  contentText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#495057',
    lineHeight: 22,
  },
  buttonContainer: {
      marginTop: 20,
      width: '80%',
  }
});

export default HomeScreen;
