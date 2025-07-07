import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/profileService'; // Using the new service

const SettingsScreen = () => {
  const { user, profile, signOut: contextSignOut, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For general loading like logout
  const [isProfileSaving, setIsProfileSaving] = useState(false); // Specifically for profile update

  useEffect(() => {
    // Initialize form fields when profile is loaded or changes
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await contextSignOut();
      // AuthProvider and _layout.js should handle redirecting to login
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Logout Error', error.message || 'Failed to log out.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !user.id) {
      Alert.alert("Error", "User not found. Cannot update profile.");
      return;
    }
    if (fullName.trim() === '' || phone.trim() === '') {
        Alert.alert("Validation Error", "Full name and phone cannot be empty.");
        return;
    }

    setIsProfileSaving(true);
    try {
      const updatedData = { fullName: fullName.trim(), phone: phone.trim() };
      const updatedProfileResult = await updateUserProfile(user.id, updatedData);

      if (updatedProfileResult) { // Check if data was returned
        await refreshProfile(); // Refresh AuthContext's profile with latest from DB
        Alert.alert("Success", "Profile updated successfully!");
        setIsEditingProfile(false);
      } else {
        // This case might occur if the update function returns null on no change or error without throwing
        Alert.alert("Notice", "Profile may not have been updated or no changes were made.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Profile Update Error", error.message || "Could not update profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  // This handles the case where the component mounts but profile is not yet available from context
  if (!profile && !user) { // If both are null, auth is likely still loading initially or failed
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading settings...</Text>
      </View>
    );
  }
  // If user exists but profile is somehow null (should be rare if AuthContext is robust)
  if (user && !profile) {
     return (
      <View style={styles.centered}>
        <Text>Loading profile information...</Text>
        <Button title="Retry" onPress={refreshProfile} />
      </View>
    );
  }


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>
        </View>

        {!isEditingProfile ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Full Name:</Text>
              <Text style={styles.value}>{profile?.fullName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{profile?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Role:</Text>
              <Text style={styles.value}>{profile?.role || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setIsEditingProfile(true)}>
                <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>Full Name:</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
            <Text style={styles.inputLabel}>Phone:</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
            {isProfileSaving ? (
                <ActivityIndicator style={{marginVertical: 10}} size="small" color="#007bff"/>
            ) : (
                <View style={styles.editActions}>
                    <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleProfileUpdate}>
                        <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => {
                        setIsEditingProfile(false);
                        setFullName(profile?.fullName || ''); // Reset changes
                        setPhone(profile?.phone || '');
                    }}>
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity
            style={[styles.button, styles.securityButton]}
            onPress={() => Alert.alert("Change Password", "This feature would typically redirect to a dedicated password change flow managed by your authentication provider (e.g., Supabase).")}
        >
            <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <TouchableOpacity
            style={[styles.button, styles.appInfoButton]}
            onPress={() => Alert.alert("About Zabibu Fresh", "Version 1.0.0 (Simulated)\nZabibu Fresh - Connecting you with local produce.")}
        >
            <Text style={styles.buttonText}>About App</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, styles.logoutSection]}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#dc3545" />
        ) : (
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Light gray background for the whole screen
  },
  scrollContentContainer:{
    paddingBottom: 20, // Ensure space at the bottom
  },
  section: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dcdcdc',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dcdcdc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8, // Add some padding to info rows
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#555', // Darker gray
  },
  value: {
    fontSize: 16,
    color: '#333', // Darker text for values
    textAlign: 'right',
    flexShrink: 1,
  },
  inputLabel: { // Style for labels above inputs
    fontSize: 15,
    color: '#444',
    marginBottom: 5,
    marginTop: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    borderRadius: 6,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6, // Slightly more rounded
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44, // Good touch target size
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  saveButton: {
    backgroundColor: '#28a745',
    marginBottom:10,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  editActions: {
    marginTop: 10,
  },
  securityButton: {
    backgroundColor: '#17a2b8', // Changed from yellow for better contrast potentially
  },
  appInfoButton: {
      backgroundColor: '#5a6268', // Darker gray for app info
  },
  logoutSection: {
    marginTop: 20, // More space before logout
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dcdcdc',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
});

export default SettingsScreen;
