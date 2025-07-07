import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Button, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { getProducts } from '../services/productService';
import { router, Link } from 'expo-router';

// Placeholder image (e.g., a local asset or a URL)
const PLACEHOLDER_IMAGE_URL = 'https://via.placeholder.com/150?text=No+Image';

const ProductCard = ({ product }) => {
  const imageUrl = product.image
    ? (product.image.startsWith('http') || product.image.startsWith('data:image'))
      ? product.image // Assumes it's a URL or base64 string
      : `data:image/jpeg;base64,${product.image}` // Fallback if it's just raw base64 data
    : PLACEHOLDER_IMAGE_URL;

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.productImage} onError={(e) => console.log("Image load error for:", product.title, e.nativeEvent.error)}/>
      <View style={styles.cardContent}>
        <Text style={styles.productTitle}>{product.title}</Text>
        <Text style={styles.productPrice}>Price: ${product.price ? product.price.toFixed(2) : 'N/A'}</Text>
        <Text style={styles.productLocation}>Location: {product.location || 'N/A'}</Text>
        {product.seller && (
          <Text style={styles.sellerName}>Seller: {product.seller.fullName || 'Unknown'}</Text>
        )}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => router.push(`/(app)/productDetail/${product.id}`)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CatalogScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data || []); // Ensure data is an array
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to refresh products:', err);
      setError(err.message || 'Failed to refresh products.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading products...</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Retry" onPress={loadProducts} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No products found.</Text>
        <Button title="Refresh" onPress={loadProducts} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
       {error && <Text style={styles.errorBanner}>Error: {error} (Displaying cached/previous data)</Text>}
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard product={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContentContainer}
        numColumns={2} // Display products in two columns
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007bff"]}/>
        }
      />
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
    backgroundColor: '#f4f4f4',
  },
  listContentContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  card: {
    flex: 1,
    margin: 5, // Adjust for spacing between cards
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    overflow: 'hidden', // Ensures image corners are also rounded if image is first element
  },
  productImage: {
    width: '100%',
    height: 150, // Fixed height for images
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 10,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 4,
  },
  productLocation: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 12,
    color: 'gray',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  detailsButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  detailsButtonText: {
    color: 'white',
    fontWeight: '500',
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
  }
});

export default CatalogScreen;
