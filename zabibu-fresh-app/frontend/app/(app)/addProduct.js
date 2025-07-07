import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addProduct } from '../services/productService'; // We'll use the placeholder for now
import { useAuth } from '../contexts/AuthContext'; // To ensure only sellers can add

// Placeholder image for when no image is selected
const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/200x200.png?text=Select+Image';

const AddProductScreen = () => {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState(profile?.location || ''); // Pre-fill if seller has a location
  const [image, setImage] = useState(null); // Stores the selected image URI
  const [imageBase64, setImageBase64] = useState(null); // Stores the base64 string of the image
  const [loading, setLoading] = useState(false);

  // Ensure only sellers can access this page (though navigation should also prevent this)
  if (profile?.role !== 'seller') {
    // Redirect or show an error if a non-seller somehow lands here.
    // For robust protection, server-side checks are also essential.
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
    return (
        <View style={styles.centered}>
            <Text>You are not authorized to add products.</Text>
        </View>
    );
  }

  const pickImage = async () => {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Lower quality for smaller base64 string
      base64: true, // Request base64 encoding
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !price || !quantity || !location) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (!image) {
      Alert.alert('Missing Image', 'Please select an image for the product.');
      return;
    }

    const productData = {
      title,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      location,
      // sellerId will be handled by the backend/Supabase Edge Function using the authenticated user
    };

    setLoading(true);
    try {
      // The addProduct service function expects productData and the base64 image string.
      // The actual backend (Supabase Edge Function) will handle creating the 'Bytes' for Prisma.
      const newProduct = await addProduct(productData, imageBase64);

      Alert.alert('Success', `Product "${newProduct.title}" added successfully!`);
      // Navigate to the seller's product list or the new product's detail page
      // For now, let's go back to home or a potential 'myProducts' screen
      router.replace('/(app)/home'); // Or '/(app)/myProducts' once it exists
    } catch (error) {
      console.error('Failed to add product:', error);
      Alert.alert('Error', `Failed to add product: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Add New Product' }} />
      <Text style={styles.header}>List a New Product</Text>

      <View style={styles.imagePickerContainer}>
        <Image source={{ uri: image || PLACEHOLDER_IMAGE_URI }} style={styles.imagePreview} />
        <Button title="Pick an Image" onPress={pickImage} />
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g., Fresh Mangoes" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="e.g., Sweet and juicy, direct from farm" multiline numberOfLines={4} />

      <Text style={styles.label}>Price ($)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="e.g., 5.99" keyboardType="numeric" />

      <Text style={styles.label}>Quantity</Text>
      <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="e.g., 20 (units, kg, etc.)" keyboardType="numeric" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g., Farm Name, City" />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
      ) : (
        <View style={styles.buttonWrapper}>
            <Button title="Add Product" onPress={handleSubmit} color="#28a745" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    marginBottom: 15,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#f0f0f0', // Background for placeholder or before image loads
  },
  buttonWrapper: {
    marginTop: 10,
    marginBottom: 30, // Ensure space at the bottom if scrolling
  },
  spinner: {
    marginTop: 20,
  }
});

export default AddProductScreen;
