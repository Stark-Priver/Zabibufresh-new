import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { supabase, createUserProfile } from '../services/supabase';
import { Picker } from '@react-native-picker/picker'; // Using this for role selection
import { Link, router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Keep phone separate for clarity
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('buyer'); // Default role
  const [loading, setLoading] = useState(false);
  const { setProfile } = useAuth();

  // Basic email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // Basic phone validation (simple check, can be enhanced)
  const isValidPhone = (phone) => /^\+?[0-9\s-()]{7,15}$/.test(phone);


  const handleSignup = async () => {
    if (!fullName || !password || !role) {
      Alert.alert('Error', 'Please fill in all fields: Full Name, Password, and Role.');
      setLoading(false);
      return;
    }

    if (!email && !phone) {
        Alert.alert('Error', 'Please provide either an Email or a Phone Number.');
        setLoading(false);
        return;
    }
    if (email && !isValidEmail(email)) {
        Alert.alert('Error', 'Please enter a valid email address.');
        setLoading(false);
        return;
    }
    if (phone && !isValidPhone(phone)) {
        Alert.alert('Error', 'Please enter a valid phone number (e.g., +255xxxxxxxxx).');
        setLoading(false);
        return;
    }
     if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    setLoading(true);

    const signupCredentials = { password };
    if (email) signupCredentials.email = email;
    if (phone) signupCredentials.phone = phone; // Ensure phone is in a format Supabase expects (e.g., E.164)

    const { data: authData, error: authError } = await supabase.auth.signUp(signupCredentials);

    if (authError) {
      Alert.alert('Signup Failed', authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // User signed up successfully, now create their profile in the 'User' table
      const profileData = {
        id: authData.user.id,
        fullName,
        email: authData.user.email, // Use email from auth user if available
        phone: authData.user.phone, // Use phone from auth user if available
        role,
      };

      const newProfile = await createUserProfile(profileData);

      if (newProfile) {
        setProfile(newProfile); // Update AuthContext
        Alert.alert(
          'Signup Successful!',
          'Please check your email or phone for a confirmation message if enabled in Supabase settings.',
          [{ text: 'OK', onPress: () => {} /* Navigation handled by AuthProvider */ }]
        );
        // Navigation will be handled by AuthProvider detecting the new user session
        // and profile. Typically, it would redirect to an (app) route.
      } else {
        // This is a critical error, user is authed but profile creation failed
        // Might want to guide user or attempt cleanup
        Alert.alert('Signup Succeeded but Profile Creation Failed', 'Please contact support.');
        // Optionally sign out the user if profile is critical for app operation
        // await supabase.auth.signOut();
      }
    } else {
      // Handle cases where user is null but no error (e.g. email confirmation required)
      Alert.alert(
        'Signup Initiated',
        'Please check your email or phone for a confirmation message to complete your registration.'
      );
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email (Optional)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g., +2557XXXXXXXX)"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Text style={styles.label}>I am a:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          onValueChange={(itemValue) => setRole(itemValue)}
          style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
          itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : {}}
        >
          <Picker.Item label="Buyer" value="buyer" />
          <Picker.Item label="Seller" value="seller" />
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={{marginTop: 20}}/>
      ) : (
        <Button title="Sign Up" onPress={handleSignup} color="#6200ee" />
      )}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
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
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    marginTop: 5,
  },
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    height: Platform.OS === 'ios' ? 120 : 50, // iOS picker needs more height
    justifyContent: 'center',
  },
  pickerAndroid: {
    height: 50,
    width: '100%',
  },
  pickerIOS: {
    height: 120, // Container height controls visible area
    width: '100%',
  },
  pickerItemIOS: {
    height: 120, // Height of individual items
  },
  linkText: {
    marginTop: 20,
    color: '#6200ee',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default SignupScreen;
