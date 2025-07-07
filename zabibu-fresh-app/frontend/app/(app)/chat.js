import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { GiftedChat, InputToolbar, Send, Bubble, SystemMessage } from 'react-native-gifted-chat';
import { useAuth } from '../contexts/AuthContext';
import { getMessagesForConversation, sendMessage } from '../services/messageService';
import { supabase } from '../services/supabase'; // For realtime subscription

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const { user: currentUser, profile: currentUserProfile } = useAuth();

  const {
    receiverId,
    receiverName,
    productId,
    productTitle,
    // productImage // Optional, can be used in a custom header or system message
  } = params;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const mapMessageToGiftedChatMessage = (message, currentUserName) => {
    if (!message || !message.senderId || !message.timestamp) { // sender object might not always be there initially for new messages from subscription
      console.warn("Skipping malformed message object:", message);
      return null;
    }
    return {
      _id: message.id || Math.round(Math.random() * 1000000), // Ensure an ID exists
      text: message.content,
      createdAt: new Date(message.timestamp),
      user: {
        _id: message.senderId,
        name: message.sender?.fullName || (message.senderId === currentUser?.id ? currentUserName : receiverName || 'Other User'),
        // avatar: message.sender?.avatarUrl // if available
      },
    };
  };

  useEffect(() => {
    if (!currentUser || !currentUser.id || !receiverId || !productId) {
      setError("Missing critical information to load chat.");
      setLoading(false);
      if(router.canGoBack()) router.back(); else router.replace("/(app)/messages");
      return;
    }

    const currentUserName = currentUserProfile?.fullName || currentUser?.email;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedMessages = await getMessagesForConversation(currentUser.id, receiverId, productId);
        const formattedMessages = fetchedMessages
            .map(msg => mapMessageToGiftedChatMessage(msg, currentUserName))
            .filter(m => m !== null)
            .sort((a, b) => b.createdAt - a.createdAt); // GiftedChat expects reverse chronological
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError(err.message || "Could not load messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${productId}-${Math.random().toString(36).substring(7)}`) // Ensure unique channel name
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `productId=eq.${productId}`,
        },
        (payload) => {
          const newMessage = payload.new;
          const isRelevant =
            (newMessage.senderId === currentUser.id && newMessage.receiverId === receiverId) ||
            (newMessage.senderId === receiverId && newMessage.receiverId === currentUser.id);

          if (isRelevant && newMessage.senderId !== currentUser.id) {
            const formattedNewMessage = mapMessageToGiftedChatMessage({
                ...newMessage,
                // sender might not be populated by default from trigger, map manually
                sender: { _id: newMessage.senderId, fullName: receiverName || 'Other User' }
            }, currentUserName);

            if (formattedNewMessage) {
                setMessages((previousMessages) =>
                    GiftedChat.append(previousMessages, [formattedNewMessage])
                );
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to chat channel for product:', productId);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime subscription error:', status, err);
          //setError('Realtime connection error. Please refresh.'); // Avoid aggressive error display for transient issues
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };

  }, [currentUser, currentUserProfile, receiverId, productId, receiverName]);


  const onSend = useCallback(async (newMessages = []) => {
    if (!currentUser || !currentUser.id) {
      Alert.alert("Error", "You must be logged in to send messages.");
      return;
    }
    setSending(true);
    const messageContent = newMessages[0].text;
    try {
      const sentMessageData = await sendMessage(currentUser.id, receiverId, productId, messageContent);
      // The `sentMessageData` from `sendMessage` should include the sender details already.
      // We append it directly for immediate feedback for the sender.
      // The realtime subscription should ideally not re-add this for the sender.
      const formattedSentMessage = mapMessageToGiftedChatMessage(sentMessageData, currentUserProfile?.fullName || currentUser?.email);
       if (formattedSentMessage) {
            setMessages((previousMessages) => GiftedChat.append(previousMessages, [formattedSentMessage]));
       }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", `Could not send message: ${error.message}`);
    } finally {
        setSending(false);
    }
  }, [currentUser, currentUserProfile, receiverId, productId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Loading chat...</Text></View>;
  }

  if (error && messages.length === 0) { // Only show blocking error if no messages loaded
    return <View style={styles.centered}><Text style={styles.errorText}>Error: {error}</Text></View>;
  }

  const screenTitle = receiverName ? `Chat with ${receiverName}` : 'Chat';
  const currentUserName = currentUserProfile?.fullName || currentUser?.email;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: screenTitle }} />
      {productTitle && (
        <SystemMessage
            currentMessage={{
                _id: Math.round(Math.random() * 1000000),
                text: `This chat is regarding the product: ${productTitle}`,
                createdAt: new Date(),
                system: true,
            }}
            containerStyle={{ marginBottom: 10, marginTop: 5 }}
            textStyle={{ fontSize: 12, color: 'grey', textAlign: 'center' }}
        />
      )}
       {error && <Text style={styles.errorBanner}>Error: {error}</Text>}
      <GiftedChat
        messages={messages}
        onSend={(newMsgs) => onSend(newMsgs)}
        user={{
          _id: currentUser?.id,
          name: currentUserName
        }}
        placeholder="Type your message here..."
        alwaysShowSend
        scrollToBottom
        isLoadingEarlier={loading} // Can be used if implementing load earlier messages
        renderLoading={() => <ActivityIndicator size="small" color="#007bff" />}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={styles.inputToolbar}
            primaryStyle={{ alignItems: 'center' }}
          />
        )}
        renderSend={(props) => (
          <Send {...props} disabled={sending || !props.text?.trim()} containerStyle={styles.sendContainer}>
            <Text style={[styles.sendText, (!props.text?.trim() || sending) && styles.sendTextDisabled]}>Send</Text>
          </Send>
        )}
        renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: { backgroundColor: '#007bff' },
                left: { backgroundColor: '#f0f0f0' },
              }}
              textStyle={{
                right: { color: '#fff' },
                left: { color: '#000' },
              }}
            />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    padding: 10,
    textAlign: 'center',
  },
  errorBanner: {
    color: 'red',
    backgroundColor: '#ffe0e0',
    padding: 5,
    textAlign: 'center',
    fontSize: 12,
  },
  inputToolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingVertical: Platform.OS === 'ios' ? 6 : 0,
    paddingHorizontal: 6,
  },
  sendContainer: {
    height: 44, // Standard touch target height
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10, // Give some space
  },
  sendText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 17,
  },
  sendTextDisabled: {
    color: '#a0a0a0',
  }
});

export default ChatScreen;
