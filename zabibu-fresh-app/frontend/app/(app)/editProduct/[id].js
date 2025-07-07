import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getProductById, updateProduct } from '../../services/productService'; // Using placeholder updateProduct
import { useAuth } from '../../contexts/AuthContext';

const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/200x200.png?text=Select+Image';

const EditProductScreen = () => {
  const { id: productId } = useLocalSearchParams(); // Get product ID from route
  const { profile } = useAuth();

  const [product, setProduct] = useState(null); // Stores the original product data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [currentImageUri, setCurrentImageUri] = useState(null); // Displays current or new image URI
  const [newImageBase64, setNewImageBase64] = useState(null); // Stores base64 of a new image, if selected

  const [loading, setLoading] = useState(true); // Initial loading of product
  const [submitting, setSubmitting] = useState(false); // For update submission
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!productId) {
      Alert.alert("Error", "No product ID provided.");
      router.replace('/(app)/home');
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(productId);
        if (data) {
          setProduct(data);
          setTitle(data.title || '');
          setDescription(data.description || '');
          setPrice(data.price ? data.price.toString() : '');
          setQuantity(data.quantity ? data.quantity.toString() : '');
          setLocation(data.location || '');

          // Handle existing image display
          if (data.image) {
            // Assuming data.image is base64 or a full URI
            const imageUri = (data.image.startsWith('http') || data.image.startsWith('data:image'))
              ? data.image
              : `data:image/jpeg;base64,${data.image}`;
            setCurrentImageUri(imageUri);
          } else {
            setCurrentImageUri(PLACEHOLDER_IMAGE_URI);
          }

          // Authorization: Check if current user is the seller
          if (profile?.id !== data.sellerId && profile?.id !== data.seller?.id) {
             Alert.alert("Unauthorized", "You are not authorized to edit this product.");
             router.replace('/(app)/home');
             return;
          }

        } else {
          setError('Product not found.');
          Alert.alert("Error", "Product not found.");
          router.replace('/(app)/home');
        }
      } catch (err) {
        console.error('Failed to load product for editing:', err);
        setError(err.message || 'Failed to fetch product details.');
        Alert.alert("Error", "Could not load product details.");
        router.replace('/(app)/home');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, profile]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCurrentImageUri(result.assets[0].uri); // Update preview
      setNewImageBase64(result.assets[0].base64); // Store new base64
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !price || !quantity || !location) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const updatedProductData = {
      title,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      location,
    };

    setSubmitting(true);
    try {
      // updateProduct service expects productId, data, and optionally newImageBase64
      // The backend (Supabase Edge Function) will handle updating Bytes if newImageBase64 is provided.
      await updateProduct(productId, updatedProductData, newImageBase64);

      Alert.alert('Success', `Product "${title}" updated successfully!`);
      router.replace(`/(app)/productDetail/${productId}`); // Go to product detail page
    } catch (error) {
      console.error('Failed to update product:', error);
      Alert.alert('Error', `Failed to update product: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading product for editing...</Text>
      </View>
    );
  }

  if (error && !product) { // Show error only if product couldn't be loaded at all
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Go Back" onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/home')} />
      </View>
    );
  }

  // If product is null after loading and no error (e.g. navigated away due to auth), don't render form
  if (!product) {
      return (
          <View style={styles.centered}>
              <Text>Product data is unavailable.</Text>
          </View>
      )
  }


  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Edit: ${product?.title || 'Product'}` }} />
      <Text style={styles.header}>Edit Product Details</Text>

      <View style={styles.imagePickerContainer}>
        <Image source={{ uri: currentImageUri || PLACEHOLDER_IMAGE_URI }} style={styles.imagePreview} />
        <Button title="Change Image" onPress={pickImage} />
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

      {submitting ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
      ) : (
        <View style={styles.buttonWrapper}>
            <Button title="Update Product" onPress={handleSubmit} color="#007bff" />
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
  errorText: {
    color: 'red',
    marginBottom: 10,
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
    backgroundColor: '#f0f0f0',
  },
  buttonWrapper: {
    marginTop: 10,
    marginBottom: 30,
  },
  spinner: {
    marginTop: 20,
  }
});

export default EditProductScreen;
