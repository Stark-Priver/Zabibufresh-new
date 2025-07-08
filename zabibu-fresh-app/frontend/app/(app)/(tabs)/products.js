import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Image,
  TextInput,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getProducts, deleteProduct } from '../../services/supabase';
import { router, useFocusEffect } from 'expo-router';

const ProductsScreen = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let sellerId = null;
      if (profile.role === 'seller') {
        sellerId = profile.id;
      }

      const { data, error } = await getProducts(sellerId);
      if (error) throw error;
      
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      Alert.alert('Error fetching products', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [profile])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleDeleteProduct = async (productId) => {
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
              const { error } = await deleteProduct(productId);
              if (error) throw error;

              Alert.alert('Success', 'Product deleted successfully.');
              fetchProducts();
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

  const handleContactSeller = (product) => {
    router.push({
      pathname: '/(app)/chat',
      params: {
        productId: product.id,
        sellerId: product.sellerId,
        productTitle: product.title,
        receiverName: 'Seller'
      }
    });
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image
        source={
          item.image_url 
            ? { uri: item.image_url } 
            : { uri: 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?auto=compress&cs=tinysrgb&w=400' }
        }
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.productPrice}>TZS {item.price.toLocaleString()}/kg</Text>
        <View style={styles.productDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.quantity} kg available</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        </View>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.actionButtons}>
          {profile?.role === 'seller' ? (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteProduct(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.contactButton} 
              onPress={() => handleContactSeller(item)}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#fff" />
              <Text style={styles.contactButtonText}>Contact Seller</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={profile?.role === 'seller' ? "add-circle-outline" : "search-outline"} 
        size={80} 
        color="#ccc" 
      />
      <Text style={styles.emptyTitle}>
        {profile?.role === 'seller' ? "No Products Yet" : "No Products Found"}
      </Text>
      <Text style={styles.emptyText}>
        {profile?.role === 'seller' 
          ? "Start by adding your first grape product to connect with buyers."
          : searchQuery 
            ? "Try adjusting your search terms."
            : "No grape products available at the moment. Check back soon!"
        }
      </Text>
      {profile?.role === 'seller' && (
        <TouchableOpacity 
          style={styles.addFirstProductButton} 
          onPress={() => router.push('/(app)/add-product')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addFirstProductButtonText}>Add Your First Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !products.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {profile?.role === 'seller' ? 'My Products' : 'Fresh Grapes'}
        </Text>
        {profile?.role === 'seller' && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => router.push('/(app)/add-product')}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar for Buyers */}
      {profile?.role === 'buyer' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search grapes, location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6200ee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    padding: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productInfo: {
    padding: 15,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 10,
  },
  productDetails: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  addFirstProductButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstProductButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProductsScreen;