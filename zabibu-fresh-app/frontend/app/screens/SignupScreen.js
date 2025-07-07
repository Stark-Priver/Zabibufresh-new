import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // Using this for role selection
import { Link, router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

const SignupScreen = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("buyer"); // Default role
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  // Basic phone validation (simple check, can be enhanced)
  const isValidPhone = (phone) => /^\+?[0-9\s-()]{7,15}$/.test(phone);

  const handleSignup = async () => {
    if (!fullName || !phone || !password || !role) {
      Alert.alert(
        "Error",
        "Please fill in all fields: Full Name, Phone Number, Password, and Role."
      );
      return;
    }

    if (!isValidPhone(phone)) {
      Alert.alert(
        "Error",
        "Please enter a valid phone number (e.g., +255xxxxxxxxx)."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    const userData = {
      phone,
      password,
      fullName,
      role,
    };

    const { data, error } = await signUp(userData);

    if (error) {
      Alert.alert("Signup Failed", error.message);
    } else if (data?.user) {
      Alert.alert(
        "Signup Successful!",
        "Please check your phone for a confirmation message if enabled in Supabase settings.",
        [
          {
            text: "OK",
            onPress: () => {} /* Navigation handled by AuthProvider */,
          },
        ]
      );
      // Navigation will be handled by AuthProvider detecting the new user session
      // and profile. Typically, it would redirect to an (app) route.
    } else {
      // Handle cases where user is null but no error (e.g. phone confirmation required)
      Alert.alert(
        "Signup Initiated",
        "Please check your phone for a confirmation message to complete your registration."
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
          style={
            Platform.OS === "ios" ? styles.pickerIOS : styles.pickerAndroid
          }
          itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : {}}
        >
          <Picker.Item label="Buyer" value="buyer" />
          <Picker.Item label="Seller" value="seller" />
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#6200ee"
          style={{ marginTop: 20 }}
        />
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
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#333",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
    marginTop: 5,
  },
  pickerContainer: {
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#fff",
    height: Platform.OS === "ios" ? 120 : 50, // iOS picker needs more height
    justifyContent: "center",
  },
  pickerAndroid: {
    height: 50,
    width: "100%",
  },
  pickerIOS: {
    height: 120, // Container height controls visible area
    width: "100%",
  },
  pickerItemIOS: {
    height: 120, // Height of individual items
  },
  linkText: {
    marginTop: 20,
    color: "#6200ee",
    textAlign: "center",
    fontSize: 16,
  },
});

export default SignupScreen;
