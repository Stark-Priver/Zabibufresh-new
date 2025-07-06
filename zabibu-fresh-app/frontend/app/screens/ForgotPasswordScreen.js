import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';
import { Link, router } from 'expo-router';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    setMessage('');

    // const redirectUrl = Platform.OS === 'web' ? window.location.origin + '/reset-password' : 'yourappscheme://reset-password';
    // For Expo Go or development builds, deep linking might be complex.
    // For standalone apps, you'd configure a deep link.
    // Supabase default email template links to your Supabase project's password reset page.
    // You can customize this email template in Supabase settings.

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // redirectTo: redirectUrl, // Optional: specify where user is redirected after clicking the link
    });

    if (error) {
      Alert.alert('Error Sending Reset Email', error.message);
      setMessage(`Error: ${error.message}`);
    } else {
      Alert.alert('Password Reset Email Sent', 'Please check your email for a link to reset your password.');
      setMessage('If an account exists for this email, a password reset link has been sent.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.instructions}>
        Enter your email address below and we'll send you a link to reset your password.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Your Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" />
      ) : (
        <Button title="Send Reset Link" onPress={handlePasswordReset} color="#6200ee" />
      )}
      {message ? <Text style={styles.messageText}>{message}</Text> : null}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Back to Login</Text>
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
    marginBottom: 20,
    color: '#333',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 20,
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
  messageText: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 14,
    color: 'green', // Or 'red' for errors if not using Alert
  },
});

export default ForgotPasswordScreen;
