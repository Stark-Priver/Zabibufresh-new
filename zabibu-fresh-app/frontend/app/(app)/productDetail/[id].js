import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Button, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { getProductById } from '../../services/productService';
import { useAuth } from '../../contexts/AuthContext'; // To check if current user is the seller

// Placeholder image
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/300?text=No+Image';

const ProductDetailScreen = () => {
  const { id: productId } = useLocalSearchParams(); // Get the product ID from the route
  const { user, profile: currentUserProfile } = useAuth(); // Get current user profile

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await getProductById(productId);
          if (data) {
            setProduct(data);
          } else {
            setError('Product not found.');
          }
        } catch (err) {
          console.error('Failed to load product details:', err);
          setError(err.message || 'Failed to fetch product details.');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    } else {
      setError('Product ID not provided.');
      setLoading(false);
    }
  }, [productId]);

  const handleContactSeller = () => {
    if (!product || !product.seller || !product.seller.id) {
      Alert.alert("Error", "Seller information is not available to start a chat.");
      return;
    }
    if (!currentUserProfile || !currentUserProfile.id) {
      Alert.alert("Error", "Your user profile is not loaded. Cannot initiate chat.");
      return;
    }
    if (currentUserProfile.id === product.seller.id) {
      Alert.alert("Info", "You cannot start a chat about your own product listing.");
      return;
    }

    router.push({
      pathname: '/(app)/chat',
      params: {
        receiverId: product.seller.id,
        receiverName: product.seller.fullName || 'Seller',
        productId: product.id,
        productTitle: product.title || 'Product',
        productImage: product.image // Pass product image if available
      },
    });
  };

  const handleEditProduct = () => {
    router.push(`/(app)/editProduct/${product.id}`);
  };


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading product details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Go Back to Catalog" onPress={() => router.replace('/(app)/catalog')} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found.</Text>
        <Button title="Go Back to Catalog" onPress={() => router.replace('/(app)/catalog')} />
      </View>
    );
  }

  const imageUrl = product.image
    ? (product.image.startsWith('http') || product.image.startsWith('data:image'))
      ? product.image
      : `data:image/jpeg;base64,${product.image}`
    : PLACEHOLDER_IMAGE_URL;

  const isCurrentUserTheSeller = currentUserProfile && product.seller && currentUserProfile.id === product.seller.id;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: product.title || 'Product Details' }} />
      <Image source={{ uri: imageUrl }} style={styles.productImage} onError={(e) => console.log("Image load error for:", product.title, e.nativeEvent.error)} />

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>Price: ${product.price ? product.price.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.quantity}>Available Quantity: {product.quantity ?? 'N/A'}</Text>
        <Text style={styles.location}>Location: {product.location || 'N/A'}</Text>

        <Text style={styles.descriptionTitle}>Description:</Text>
        <Text style={styles.description}>{product.description || 'No description provided.'}</Text>

        {product.seller && (
          <View style={styles.sellerInfoBox}>
            <Text style={styles.sellerTitle}>Seller Information</Text>
            <Text style={styles.sellerText}>Name: {product.seller.fullName || 'N/A'}</Text>
            <Text style={styles.sellerText}>Email: {product.seller.email || 'N/A'}</Text>
            <Text style={styles.sellerText}>Phone: {product.seller.phone || 'N/A'}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {isCurrentUserTheSeller ? (
            <Button title="Edit Product" onPress={handleEditProduct} color="#ffc107" />
          ) : (
            <Button title="Contact Seller" onPress={handleContactSeller} color="#007bff" />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: '#007bff',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  sellerInfoBox: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
    borderColor: '#e9ecef',
    borderWidth: 1,
  },
  sellerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sellerText: {
    fontSize: 15,
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default ProductDetailScreen;
