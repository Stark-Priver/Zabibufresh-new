import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getConversations } from '../services/messageService'; // Assuming this service is created

// Placeholder for product image if not available in conversation summary
const PLACEHOLDER_PRODUCT_IMAGE = 'https://via.placeholder.com/50?text=P';

const ConversationItem = ({ item, currentUserId }) => {
  // Determine the other user's name and if the last message was sent by the current user
  // This logic depends on the structure returned by getConversations (especially if using the RPC)
  // Assuming item has: other_user_name, product_title, last_message_content, last_message_timestamp, product_image
  // And senderId of the last message if needed to show "You: ..."

  const otherUserName = item.other_user_name || 'Unknown User';
  const productTitle = item.product_title || 'Unknown Product';
  let lastMessage = item.last_message_content || 'No messages yet.';
  if (lastMessage.length > 40) {
    lastMessage = lastMessage.substring(0, 37) + '...';
  }

  // If the RPC returns sender_id for the last message, we can use it.
  // For simplicity, let's assume the RPC might provide a flag or we infer from sender_name if it matches current user.
  // This part might need adjustment based on actual `getConversations` output.
  // const lastMessageSenderIsCurrentUser = item.last_message_sender_id === currentUserId;
  // if (lastMessageSenderIsCurrentUser) {
  //   lastMessage = `You: ${lastMessage}`;
  // }


  const productImageUri = item.product_image
    ? (item.product_image.startsWith('http') || item.product_image.startsWith('data:image'))
      ? item.product_image
      : `data:image/jpeg;base64,${item.product_image}`
    : PLACEHOLDER_PRODUCT_IMAGE;

  const handlePress = () => {
    // Navigate to chat screen with necessary parameters
    // Parameters will depend on how ChatScreen identifies a conversation
    // e.g., otherUserId and productId
    if (!item.other_user_id || !item.productId) {
        Alert.alert("Error", "Cannot open conversation, missing required IDs.");
        return;
    }
    router.push({
      pathname: '/(app)/chat',
      params: {
        receiverId: item.other_user_id,
        receiverName: otherUserName,
        productId: item.productId,
        productTitle: productTitle,
        // Pass product image if available and needed by chat screen
        productImage: item.product_image
      },
    });
  };

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={handlePress}>
      <Image source={{ uri: productImageUri }} style={styles.productImage} />
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{otherUserName} - {productTitle}</Text>
        <Text style={styles.lastMessage}>{lastMessage}</Text>
      </View>
      <Text style={styles.timestamp}>
        {item.last_message_timestamp ? new Date(item.last_message_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
      </Text>
    </TouchableOpacity>
  );
};

const MessagesScreen = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user || !user.id) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // `getConversations` is expected to return an array of conversation summaries
      // Each summary should ideally include: other_user_id, other_user_name, product_id, product_title,
      // product_image, last_message_content, last_message_timestamp
      const data = await getConversations(user.id);
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        // This might happen if the RPC fallback occurs and returns raw messages
        console.warn("getConversations did not return an array. Data:", data);
        setError("Could not process conversation data. The RPC function 'get_user_conversations' might need to be set up in your Supabase backend for optimal results.");
        setConversations([]); // Or attempt client-side grouping if necessary
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError(err.message || 'Could not load conversations.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading conversations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Retry" onPress={fetchConversations} />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No conversations yet.</Text>
        <Text style={{textAlign: 'center', marginVertical: 10, color: 'gray'}}>Start a conversation by contacting a seller from a product page.</Text>
         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Messages' }} />
      <FlatList
        data={conversations}
        renderItem={({ item }) => <ConversationItem item={item} currentUserId={user.id} />}
        keyExtractor={(item) => `${item.other_user_id}-${item.productId}-${item.message_id}`} // Ensure unique key
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
    backgroundColor: '#fff',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: 'gray',
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default MessagesScreen;
