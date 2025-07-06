import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const ProductsScreen = () => {
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      {profile?.role === 'seller' ? (
        <Text style={styles.title}>My Product Listings</Text>
        // TODO: Implement seller's view: list their products, add new product button
      ) : (
        <Text style={styles.title}>Product Catalog</Text>
        // TODO: Implement buyer's view: search, filter, browse products
      )}
      <Text>Product management and browsing will be implemented here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default ProductsScreen;
