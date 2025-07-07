import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

const AddProductScreen = () => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState(''); // e.g., "Dodoma City Center"
  const [image, setImage] = useState(null); // Stores the selected image URI
  const [imageFile, setImageFile] = useState(null); // Stores the actual image file/blob for upload
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Compress image a bit
      base64: true, // Request base64 data for direct DB storage
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage(asset.uri); // For preview
      // Convert base64 to a format suitable for Prisma Bytes (e.g., Buffer or Uint8Array)
      // For simplicity, we'll store the base64 string directly if the backend handles conversion,
      // or handle conversion here if needed. Prisma typically expects a Buffer.
      // The `base64-arraybuffer` library was removed, so we'll send base64 string.
      // The backend will need to handle this.
      setImageFile(asset.base64); // Store base64 string
    }
  };

  const handleAddProduct = async () => {
    if (!title || !description || !price || !quantity || !location || !imageFile) {
      Alert.alert('Missing Information', 'Please fill all fields and select an image.');
      return;
    }
    if (!profile || profile.role !== 'seller') {
      Alert.alert('Unauthorized', 'Only sellers can add products.');
      return;
    }

    setLoading(true);

    try {
      // Add Product to Database with image data
      const productData = {
        title,
        description,
        image: imageFile, // Send base64 string
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        location,
        sellerId: user.id,
      };

      // Assuming your Supabase client is set up to call a custom function
      // or your backend API handles the Prisma insert.
      // For this example, let's assume an RPC call to a Supabase function
      // that internally uses Prisma.
      // If you have a direct API endpoint (e.g., Next.js API route), adjust accordingly.

      // const { data, error } = await supabase.rpc('create_product_with_image', productData);

      // OR, if using a direct table insert and Prisma backend handles base64 conversion:
      const { error } = await supabase.from('Product').insert([productData]);


      if (error) throw error;

      Alert.alert('Success', 'Product added successfully!');
      // Clear form
      setTitle('');
      setDescription('');
      setPrice('');
      setQuantity('');
      setLocation('');
      setImage(null);
      setImageFile(null);
      router.back(); // Or navigate to product list

    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', `Failed to add product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'seller') {
    return (
        <View style={styles.container}>
            <Text>This page is for sellers only.</Text>
            <Button title="Go Home" onPress={() => router.replace('/(app)/home')}/>
        </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Add New Grape Product</Text>

        <TextInput style={styles.input} placeholder="Product Title (e.g., Red Globe Grapes)" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Description (e.g., Fresh, sweet, seedless)" value={description} onChangeText={setDescription} multiline />
        <TextInput style={styles.input} placeholder="Price (TZS per Kg/Unit)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Quantity Available (e.g., 100 Kg)" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Location (e.g., Farm in Chamwino, Dodoma)" value={location} onChangeText={setLocation} />

        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Text style={styles.imagePickerButtonText}>Pick an Image</Text>
        </TouchableOpacity>

        {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

        {loading ? (
          <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 20 }} />
        ) : (
          <Button title="Add Product" onPress={handleAddProduct} color="#6200ee" />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
  imagePickerButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default AddProductScreen;
