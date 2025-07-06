import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Button, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import { supabase } from '../../services/supabase'; // Adjusted path
import { router, useFocusEffect } from 'expo-router'; // useFocusEffect to refresh data

const ProductsScreen = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase.from('Product').select('*');
      if (profile.role === 'seller') {
        query = query.eq('sellerId', profile.id);
      }
      query = query.order('createdAt', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      Alert.alert('Error fetching products', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when the screen comes into focus or on initial load
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [profile])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleDeleteProduct = async (productId, imageUrl) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              // 1. Delete from Product table
              const { error: dbError } = await supabase
                .from('Product')
                .delete()
                .eq('id', productId);
              if (dbError) throw dbError;

              // 2. Delete image from Supabase Storage
              // Extract the path from the public URL. This is a bit naive and depends on URL structure.
              // Example URL: https://<project-ref>.supabase.co/storage/v1/object/public/product-images/<sellerId>/<filename.ext>
              // Path to remove: <sellerId>/<filename.ext>
              if (imageUrl) {
                const urlParts = imageUrl.split('/');
                const imagePath = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');
                if (imagePath) {
                    const { error: storageError } = await supabase.storage
                    .from('product-images')
                    .remove([imagePath]);
                  if (storageError) {
                    console.warn("Error deleting image from storage, but product deleted from DB:", storageError.message);
                    Alert.alert("Product Deleted", "Product data was deleted, but there was an issue removing the image from storage. Please check storage manually if needed.");
                  }
                }
              }

              Alert.alert('Success', 'Product deleted successfully.');
              fetchProducts(); // Refresh the list
            } catch (error) {
              Alert.alert('Error deleting product', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };


  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150?text=No+Image' }} style={styles.productImage} />
      <View style={styles.productDetails}>
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.productPrice}>TZS {item.price.toLocaleString()}</Text>
        <Text style={styles.productInfo}>Quantity: {item.quantity}</Text>
        <Text style={styles.productInfo}>Location: {item.location}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
      </View>
      {profile?.role === 'seller' && (
        <View style={styles.sellerActions}>
          {/* <Button title="Edit" onPress={() => router.push(`/(app)/edit-product/${item.id}`)} /> */}
          {/* Edit functionality to be added later */}
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(item.id, item.imageUrl)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {profile?.role === 'buyer' && (
         <Button title="Contact Seller" onPress={() => router.push(`/(app)/chat?productId=${item.id}&sellerId=${item.sellerId}`)} />
      )}
    </View>
  );

  if (loading && !products.length) {
    return <ActivityIndicator size="large" color="#6200ee" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      {profile?.role === 'seller' && (
        <View style={styles.sellerHeader}>
          <Text style={styles.headerTitle}>My Product Listings</Text>
          <Button title="Add New Product" onPress={() => router.push('/(app)/add-product')} />
        </View>
      )}
      {profile?.role === 'buyer' && (
         <Text style={styles.headerTitle}>Discover Fresh Grapes</Text>
        // TODO: Add search and filter options for buyers
      )}

      {products.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {profile?.role === 'seller' ? "You haven't added any products yet." : "No products available at the moment. Check back soon!"}
            </Text>
            {profile?.role === 'seller' && <Button title="Add Your First Product" onPress={() => router.push('/(app)/add-product')} />}
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  sellerHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  productItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: 'row', // For image and details side by side
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 15,
  },
  productDetails: {
    flex: 1, // Take remaining space
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: 'green',
    marginBottom: 4,
  },
  productInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  emptyContainer: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  sellerActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right if in a column
    alignItems: 'center', // For side-by-side buttons
  },
  deleteButton: {
    marginLeft: 10, // Space from edit button if it exists
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#dc3545', // Red color for delete
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default ProductsScreen;
