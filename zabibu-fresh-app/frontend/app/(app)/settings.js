import React from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
// import { router } from 'expo-router'; // Not strictly needed if logout is handled by AuthContext

const SettingsScreen = () => {
  const { profile, setProfile } = useAuth(); // setProfile from AuthContext will be cleared by listener

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout Error", error.message);
    }
    // The AuthContext onAuthStateChange listener will handle:
    // 1. Setting session and user to null.
    // 2. Setting profile to null.
    // The RootLayout (app/_layout.js) useEffect will then detect no session
    // and redirect to '/(auth)/login'.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {profile && (
        <View style={styles.profileInfo}>
          <Text style={styles.label}>Full Name:</Text>
          <Text style={styles.info}>{profile.fullName}</Text>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.info}>{profile.phone || "Not set"}</Text>
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.info}>{profile.role}</Text>
        </View>
      )}
      {/* TODO: Implement profile update form */}
      {/* TODO: Implement light/dark mode toggle */}
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center', // Align items to top for settings
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
  },
  profileInfo: {
    width: "100%",
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 20,
    width: "80%",
  },
});

export default SettingsScreen;
