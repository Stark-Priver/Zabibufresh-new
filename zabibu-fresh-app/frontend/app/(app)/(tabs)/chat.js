import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations } from '../../services/supabase';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

const ChatScreen = () => {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();

  const fetchConversations = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: messages, error } = await getConversations(profile.id);

      if (error) throw error;

      // Group messages by conversation (unique combination of users and product)
      const conversationMap = new Map();
      
      for (const message of messages || []) {
        if (!message.products) continue;
        
        const otherUserId = message.sender_id === profile.id ? message.receiver_id : message.sender_id;
        const conversationKey = `${otherUserId}_${message.product_id}`;
        
        if (!conversationMap.has(conversationKey)) {
          const otherUser = message.sender_id === profile.id ? message.receiver : message.sender;
          
          conversationMap.set(conversationKey, {
            id: conversationKey,
            otherUser: {
              id: otherUser.id,
              fullName: otherUser.full_name,
              phone: otherUser.phone
            },
            product: {
              id: message.products.id,
              title: message.products.title,
              sellerId: message.products.seller_id
            },
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: 0,
          });
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      Alert.alert('Error', 'Could not fetch conversations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchConversations();
      }
    }, [profile?.id])
  );

  useEffect(() => {
    // Handle navigation from product screen to start new chat
    const { productId, sellerId, productTitle, receiverName } = params;
    if (productId && sellerId && profile && sellerId !== profile.id) {
      router.push({
        pathname: `/(app)/chat/[chatId]`,
        params: {
          chatId: `${sellerId}_${productId}`,
          receiverId: sellerId,
          productId: productId,
          productTitle: productTitle || 'Product',
          receiverName: receiverName || 'Seller'
        }
      });
    }
  }, [params, profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push({
        pathname: `/(app)/chat/[chatId]`,
        params: {
          chatId: item.id,
          receiverId: item.otherUser.id,
          receiverName: item.otherUser.fullName,
          productId: item.product.id,
          productTitle: item.product.title
        }
      })}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.otherUser.fullName?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
      
      <View style={styles.conversationDetails}>
        <View style={styles.conversationHeader}>
          <Text style={styles.partnerName}>{item.otherUser.fullName}</Text>
          <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <Text style={styles.productTitle} numberOfLines={1}>
          📦 {item.product.title}
        </Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptyText}>
        {profile?.role === 'buyer' 
          ? "Start browsing products and contact sellers to begin conversations."
          : "Buyers will contact you about your products. Your conversations will appear here."
        }
      </Text>
      {profile?.role === 'buyer' && (
        <TouchableOpacity 
          style={styles.browseButton} 
          onPress={() => router.push('/(app)/(tabs)/products')}
        >
          <Ionicons name="search" size={16} color="#fff" />
          <Text style={styles.browseButtonText}>Browse Products</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={conversations.length === 0 ? styles.emptyListContainer : null}
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationDetails: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  productTitle: {
    fontSize: 13,
    color: '#6200ee',
    marginBottom: 2,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  },
  browseButton: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ChatScreen;