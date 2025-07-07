import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Button, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { getProductsBySeller } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';

const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/100?text=No+Image';

const MyProductCard = ({ product }) => {
  const imageUrl = product.image
    ? (product.image.startsWith('http') || product.image.startsWith('data:image'))
      ? product.image
      : `data:image/jpeg;base64,${product.image}`
    : PLACEHOLDER_IMAGE_URL;

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.productImage} onError={(e) => console.log("Image load error for:", product.title, e.nativeEvent.error)} />
      <View style={styles.cardContent}>
        <Text style={styles.productTitle}>{product.title}</Text>
        <Text style={styles.productPrice}>Price: ${product.price ? product.price.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.productStatus}>Status: Active (Placeholder)</Text>
        {/* Placeholder for product status, e.g., active, pending, sold out */}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => router.push(`/(app)/productDetail/${product.id}`)}
        >
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/(app)/editProduct/${product.id}`)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const MyProductsScreen = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSellerProducts = useCallback(async () => {
    if (!profile || profile.role !== 'seller') {
      Alert.alert("Unauthorized", "You must be a seller to view this page.");
      if(router.canGoBack()) router.back(); else router.replace("/(app)/home");
      setLoading(false);
      return;
    }
    if (!profile.id) {
        Alert.alert("Error", "User ID not found. Cannot fetch products.");
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getProductsBySeller(profile.id);
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load seller products:', err);
      setError(err.message || 'Failed to fetch your products.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadSellerProducts();
  }, [loadSellerProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSellerProducts();
    setRefreshing(false);
  };

  if (!profile || profile.role !== 'seller') {
    // This case should ideally be handled by the redirect in loadSellerProducts,
    // but as a fallback or if loadSellerProducts hasn't run yet.
    return (
        <View style={styles.centered}>
            <Text>Access Denied. Only sellers can view this page.</Text>
            <Button title="Go Home" onPress={() => router.replace("/(app)/home")} />
        </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading your products...</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Retry" onPress={loadSellerProducts} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Products' }} />
      {error && <Text style={styles.errorBanner}>Error: {error} (Displaying cached/previous data)</Text>}

      {products.length === 0 && !loading && (
         <View style={styles.centered}>
            <Text style={styles.noProductsText}>You haven't listed any products yet.</Text>
            <Button title="List Your First Product" onPress={() => router.push('/(app)/addProduct')} />
        </View>
      )}

      {products.length > 0 && (
        <FlatList
            data={products}
            renderItem={({ item }) => <MyProductCard product={item} />}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContentContainer}
            refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]}/>
            }
        />
      )}
       {/* Floating Action Button or similar could be added here for "Add Product" */}
       <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/addProduct')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
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
    backgroundColor: '#f8f9fa',
  },
  listContentContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  cardContent: {
    marginBottom:10,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 5,
  },
  productStatus: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6c757d',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute buttons evenly
    marginTop: 5,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1, // Make buttons take equal width
    marginHorizontal:5, // Add some space between buttons
    alignItems:'center',
  },
  viewButton: {
    backgroundColor: '#17a2b8',
  },
  editButton: {
    backgroundColor: '#ffc107',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorBanner: {
    color: 'red',
    backgroundColor: '#ffe0e0',
    padding: 10,
    textAlign: 'center',
  },
  noProductsText: {
      fontSize: 18,
      color: '#6c757d',
      textAlign: 'center',
      marginBottom: 20,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
  },
});

export default MyProductsScreen;
