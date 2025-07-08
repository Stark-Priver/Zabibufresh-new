import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Image,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createProduct } from '../services/supabase';
import { uploadImage, generateImageFileName } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

const AddProductScreen = () => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage(asset.uri);
      setImageFile(asset.base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage(asset.uri);
      setImageFile(asset.base64);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Select Image",
      "Choose how you want to add a photo",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Gallery", onPress: pickImage },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleAddProduct = async () => {
    if (!title || !description || !price || !quantity || !location || !imageFile) {
      Alert.alert('Missing Information', 'Please fill all required fields.');
      return;
    }
    if (!profile || profile.role !== 'seller') {
      Alert.alert('Unauthorized', 'Only sellers can add products.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const fileName = generateImageFileName(user.id, 'product_image.jpg');
        const uploadResult = await uploadImage(image, fileName);
        
        if (uploadResult.success) {
          imageUrl = uploadResult.data.publicUrl;
        } else {
          Alert.alert('Upload Error', 'Failed to upload image. Product will be created without image.');
        }
      }

      const productData = {
        title,
        description,
        imageUrl,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        location,
        sellerId: user.id
      };

      const { data, error } = await createProduct(productData);

      if (error) throw error;

      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
      // Clear form
      setTitle('');
      setDescription('');
      setPrice('');
      setQuantity('');
      setLocation('');
      setImage(null);
      setImageFile(null);

    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', `Failed to add product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'seller') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="warning-outline" size={60} color="#ff6b6b" />
        <Text style={styles.unauthorizedTitle}>Access Restricted</Text>
        <Text style={styles.unauthorizedText}>This page is for sellers only.</Text>
        <TouchableOpacity style={styles.goHomeButton} onPress={() => router.replace('/(app)/home')}>
          <Text style={styles.goHomeButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Product</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product Title</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g., Fresh Red Globe Grapes" 
              value={title} 
              onChangeText={setTitle} 
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Describe your grapes (quality, taste, etc.)" 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Price (TZS per Kg)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., 5000" 
                value={price} 
                onChangeText={setPrice} 
                keyboardType="numeric" 
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Quantity (Kg)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., 100" 
                value={quantity} 
                onChangeText={setQuantity} 
                keyboardType="numeric" 
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g., Chamwino, Dodoma" 
              value={location} 
              onChangeText={setLocation} 
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product Image</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={showImagePicker}>
              <Ionicons name="camera-outline" size={24} color="#6200ee" />
              <Text style={styles.imagePickerButtonText}>
              {image ? 'Change Image' : 'Add Image (Optional)'}
              </Text>
            </TouchableOpacity>
            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => {
                    setImage(null);
                    setImageFile(null);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddProduct}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: '#6200ee',
    borderStyle: 'dashed',
  },
  imagePickerButtonText: {
    color: '#6200ee',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addButton: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  goHomeButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goHomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddProductScreen;