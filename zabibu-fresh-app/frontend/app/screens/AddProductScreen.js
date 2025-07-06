import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; // For handling base64 image data
import { router } from 'expo-router';

// Function to generate a unique filename
const generateFileName = (uri) => {
  const fileExtension = uri.split('.').pop();
  return `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
};

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
      base64: Platform.OS === 'web' ? false : true, // For mobile, get base64 to upload directly
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageFile(result.assets[0]); // Store the asset object
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
    let imageUrl = '';
    let publicUrl = '';

    try {
      // 1. Upload Image to Supabase Storage
      const fileName = generateFileName(imageFile.uri);
      const filePath = `${user.id}/${fileName}`; // Organize images by seller ID

      let uploadError;
      let uploadData;

      if (Platform.OS === 'web') {
        // For web, imageFile.uri is a blob URI, fetch it then upload
        const response = await fetch(imageFile.uri);
        const blob = await response.blob();
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, blob, {
            contentType: imageFile.mimeType || 'image/jpeg', // Ensure MIME type is correct
            upsert: false,
          });
        uploadData = data;
        uploadError = error;

      } else {
         // For mobile, use base64 string
        if (!imageFile.base64) {
          Alert.alert("Upload Error", "Could not read image data for upload.");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, decode(imageFile.base64), { // decode base64 to ArrayBuffer
            contentType: imageFile.mimeType || 'image/jpeg', // Ensure MIME type is correct
            upsert: false,
          });
        uploadData = data;
        uploadError = error;
      }


      if (uploadError) throw uploadError;

      imageUrl = uploadData.path; // This is the path within the bucket

      // Get public URL for the image
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(imageUrl);
      if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error("Could not get public URL for the image.");
      }
      publicUrl = publicUrlData.publicUrl;


      // 2. Add Product to Database
      const productData = {
        title,
        description,
        imageUrl: publicUrl, // Store the public URL
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        location,
        sellerId: user.id, // From authenticated user
      };

      const { error: dbError } = await supabase.from('Product').insert([productData]);
      if (dbError) throw dbError;

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
      // Optional: If DB insert fails after image upload, consider deleting the uploaded image
      if (imageUrl && error.message.includes('Failed to add product')) { // Be more specific if possible
        await supabase.storage.from('product-images').remove([imageUrl]);
        console.log("Attempted to remove uploaded image due to DB error:", imageUrl);
      }
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
