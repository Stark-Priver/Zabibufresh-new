import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext'; // Adjusted path
import { supabase } from '../../services/supabase'; // Adjusted path
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

const ChatScreen = () => {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams(); // To catch potential productId & sellerId for starting a new chat

  const fetchConversations = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // This is a simplified way to get conversations.
      // A more robust approach would involve a 'conversations' table or more complex queries
      // to group messages by sender/receiver pairs and product.
      // Here, we fetch distinct users the current user has messaged or received messages from.

      // Fetch users who sent messages to the current user
      const { data: receivedMessagesUsers, error: receivedError } = await supabase
        .from('Message')
        .select('senderId, sender:User!Message_senderId_fkey(id, fullName), Product(id, title)')
        .eq('receiverId', profile.id);
      if (receivedError) throw receivedError;

      // Fetch users to whom the current user sent messages
      const { data: sentMessagesUsers, error: sentError } = await supabase
        .from('Message')
        .select('receiverId, receiver:User!Message_receiverId_fkey(id, fullName), Product(id, title)')
        .eq('senderId', profile.id);
      if (sentError) throw sentError;

      // Combine and create a unique list of conversation partners
      const userMap = new Map();

      receivedMessagesUsers.forEach(msg => {
        if (msg.sender && msg.Product) { // Ensure sender and product are not null
          const key = `${msg.sender.id}-${msg.Product.id}`;
          if (!userMap.has(key)) {
            userMap.set(key, {
              partner: msg.sender,
              product: msg.Product,
              // lastMessage: msg.content, // Simplification, real last message needs ordering
              // timestamp: msg.timestamp
            });
          }
        }
      });

      sentMessagesUsers.forEach(msg => {
         if (msg.receiver && msg.Product) { // Ensure receiver and product are not null
            const key = `${msg.receiver.id}-${msg.Product.id}`;
            if (!userMap.has(key)) {
                userMap.set(key, {
                partner: msg.receiver,
                product: msg.Product,
                // lastMessage: msg.content,
                // timestamp: msg.timestamp
                });
            }
        }
      });

      // For a real app, you'd fetch the actual last message and timestamp for each conversation.
      // This is a placeholder to show the structure.
      const uniqueConversations = Array.from(userMap.values());
      // Sort by a placeholder or implement fetching last message timestamp
      // uniqueConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


      setConversations(uniqueConversations);
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
    // If navigated with productId and sellerId, try to open that chat directly
    // This is a basic way to handle it. A more robust solution might involve checking if a conversation already exists.
    const { productId, sellerId, productTitle, receiverName } = params;
    if (productId && sellerId && profile && sellerId !== profile.id) {
      // Prevent navigating to chat with oneself if sellerId is current user
      router.push({
        pathname: `/(app)/chat/[chatId]`, // Assuming a dynamic route for individual chats
        params: {
            chatId: `${sellerId}_${productId}`, // Synthetic ID for the chat room
            receiverId: sellerId,
            productId: productId,
            productTitle: productTitle || 'Product',
            receiverName: receiverName || 'Seller'
        }
      });
    }
  }, [params, profile]);


  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push({
        pathname: `/(app)/chat/[chatId]`,
        params: {
            chatId: `${item.partner.id}_${item.product.id}`,
            receiverId: item.partner.id,
            receiverName: item.partner.fullName,
            productId: item.product.id,
            productTitle: item.product.title
        }
      })}
    >
      <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{item.partner.fullName?.charAt(0).toUpperCase()}</Text></View>
      <View style={styles.conversationDetails}>
        <Text style={styles.partnerName}>{item.partner.fullName}</Text>
        <Text style={styles.productTitleText}>Product: {item.product.title}</Text>
        {/* <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || "Tap to chat"}</Text> */}
        <Text style={styles.lastMessage} numberOfLines={1}>{"Tap to chat about " + item.product.title}</Text>
      </View>
      {/* <Text style={styles.timestamp}>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}</Text> */}
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />;
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You have no active conversations.</Text>
        {profile?.role === 'buyer' &&
            <Button title="Browse Products to Start Chatting" onPress={() => router.push('/(app)/(tabs)/products')} />
        }
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversationItem}
      keyExtractor={(item, index) => `${item.partner.id}-${item.product.id}-${index}`} // Ensure unique key
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    backgroundColor: '#fff',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatarPlaceholder: {
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
  partnerName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  productTitleText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  lastMessage: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
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
});

export default ChatScreen;
