import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router'; // Supabase direct import not needed here for logout

const HomeScreen = () => {
  const { user, profile } = useAuth(); // setProfile and supabase not directly used in this component anymore

  // Logout is handled by a button that navigates to settings,
  // and settings screen will have the actual logout button calling useAuth().signOut()
  // const handleLogout = async () => { ... }; // Kept for reference, but not used now

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome, {profile.fullName || user?.email}!</Text>
      <Text style={styles.roleText}>You are logged in as a: {profile.role}</Text>

      {profile.role === 'seller' ? (
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Seller Dashboard</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Products</Text>
            <Text style={styles.cardContent}>View and manage your product listings.</Text>
            <Text style={styles.placeholderText}>Summary: (e.g., 3 active listings)</Text>
            <View style={styles.buttonSpacing}>
              <Button title="Manage My Products" onPress={() => router.push('/(app)/myProducts')} color="#007bff" />
            </View>
            <View style={styles.buttonSpacing}>
              <Button title="Add New Product" onPress={() => router.push('/(app)/addProduct')} color="#28a745" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Messages</Text>
            <Text style={styles.cardContent}>See inquiries from potential buyers.</Text>
            <Text style={styles.placeholderText}>Recent: (e.g., 2 new messages)</Text>
            <View style={styles.buttonSpacing}>
             <Button title="View Messages" onPress={() => router.push('/(app)/messages')} color="#17a2b8" />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.dashboardSection}>
          <Text style={styles.sectionTitle}>Buyer Dashboard</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Discover Products</Text>
            <Text style={styles.cardContent}>Find fresh produce from local sellers.</Text>
            <Text style={styles.placeholderText}>Explore: Browse categories or featured items.</Text>
            <View style={styles.buttonSpacing}>
              <Button title="Browse Catalog" onPress={() => router.push('/(app)/catalog')} color="#007bff" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Conversations</Text>
            <Text style={styles.cardContent}>Continue chats with sellers.</Text>
            <Text style={styles.placeholderText}>Recent: (e.g., 1 new message)</Text>
            <View style={styles.buttonSpacing}>
              <Button title="View Messages" onPress={() => router.push('/(app)/messages')} color="#17a2b8" />
            </View>
          </View>
        </View>
      )}
      <View style={styles.footerButtonContainer}>
        <Button title="Go to Settings" onPress={() => router.push('/(app)/settings')} color="#6c757d"/>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40',
  },
  roleText: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 25,
  },
  dashboardSection: {
    width: '100%',
    alignItems: 'center', // Center cards within the section
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    width: '95%', // Cards take most of the width
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007bff',
  },
  cardContent: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6c757d',
    marginBottom: 10,
  },
  buttonSpacing: {
    marginTop: 10, // Adds space above each button in a card
  },
  footerButtonContainer: {
    marginTop: 20,
    width: '90%',
  }
});

export default HomeScreen;
