import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase, getUserProfile } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext'; // Assuming useAuth provides setProfile
import { Link, router } from 'expo-router';

const LoginScreen = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setProfile } = useAuth(); // To update profile in context after login

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert('Error', 'Please enter email/phone and password.');
      return;
    }
    setLoading(true);

    const isEmail = emailOrPhone.includes('@');
    let authResponse;

    if (isEmail) {
      authResponse = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password: password,
      });
    } else {
      // Assuming phone numbers are stored with a country code if needed by Supabase
      // Or that Supabase is configured to handle local formats
      authResponse = await supabase.auth.signInWithPassword({
        phone: emailOrPhone, // Ensure this matches Supabase's expected format
        password: password,
      });
    }

    const { data: authData, error: authError } = authResponse;

    if (authError) {
      Alert.alert('Login Failed', authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Fetch user profile to get the role
      const profile = await getUserProfile(authData.user.id);
      if (profile) {
        setProfile(profile); // Update AuthContext
        // Navigate to home or dashboard based on role if needed, or let AuthProvider handle it
        // router.replace('/(app)'); // Or a role-specific route
      } else {
        // This case should ideally not happen if profile is created on signup
        Alert.alert('Login Successful, but profile not found.', 'Please complete your profile or contact support.');
        // Potentially log them out or redirect to a profile creation screen
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
    // Navigation to the main app stack will be handled by the AuthProvider/Router listening to auth state changes
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zabibu Fresh</Text>
      <Text style={styles.subtitle}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email or Phone"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        autoCapitalize="none"
        keyboardType={emailOrPhone.includes('@') ? 'email-address' : 'phone-pad'}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" />
      ) : (
        <Button title="Login" onPress={handleLogin} color="#6200ee" />
      )}
      <TouchableOpacity onPress={() => router.push('/signup')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
       <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  linkText: {
    marginTop: 20,
    color: '#6200ee',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default LoginScreen;
