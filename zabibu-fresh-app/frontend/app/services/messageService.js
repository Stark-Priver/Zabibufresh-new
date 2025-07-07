import { supabase } from './supabase';

// Helper function to handle Supabase responses
const handleSupabaseResponse = (response, context = '') => {
  if (response.error) {
    console.error(`Supabase error${context ? ' in ' + context : ''}:`, response.error.message);
    throw response.error;
  }
  return response.data;
};

/**
 * Fetches a list of conversations for the given user.
 * A conversation is grouped by (other user, product).
 * It retrieves the latest message for each conversation to display as a snippet.
 *
 * @param {string} userId - The ID of the current user.
 */
export const getConversations = async (userId) => {
  if (!userId) {
    console.error('User ID is required to fetch conversations.');
    return [];
  }

  // This is a complex query to simulate fetching "conversations"
  // It aims to get unique pairs of (other user, product) and the latest message.
  // Supabase doesn't directly support window functions like ROW_NUMBER() in client-side JS SDK queries easily
  // for this kind of grouping.
  // A PostgREST function (Supabase Edge Function or DB function) would be much more efficient and cleaner.

  // Approach: Fetch all messages involving the user, then process client-side or use an Edge Function.
  // For simplicity here, we'll fetch messages and then could process them,
  // OR we'll assume an RPC call to a database function.

  // Let's assume an RPC call to a function `get_user_conversations` that handles the logic.
  // This function would need to be created in your Supabase SQL editor.
  /*
    Example SQL for `get_user_conversations(p_user_id TEXT)`:
    ```sql
    WITH UserMessages AS (
        SELECT
            m.id AS message_id,
            m."productId",
            p.title AS product_title,
            p.image AS product_image, -- Assuming image is a URL or base64
            m."senderId",
            s.fullName AS sender_name,
            m."receiverId",
            r.fullName AS receiver_name,
            m.content,
            m.timestamp,
            CASE
                WHEN m."senderId" = p_user_id THEN m."receiverId"
                ELSE m."senderId"
            END AS other_user_id,
            CASE
                WHEN m."senderId" = p_user_id THEN r.fullName
                ELSE s.fullName
            END AS other_user_name,
            ROW_NUMBER() OVER (PARTITION BY m."productId",
                                CASE WHEN m."senderId" = p_user_id THEN m."receiverId" ELSE m."senderId" END
                                ORDER BY m.timestamp DESC) as rn
        FROM "Message" m
        JOIN "Product" p ON m."productId" = p.id
        JOIN "User" s ON m."senderId" = s.id
        JOIN "User" r ON m."receiverId" = r.id
        WHERE m."senderId" = p_user_id OR m."receiverId" = p_user_id
    )
    SELECT
        message_id,
        "productId",
        product_title,
        product_image,
        "senderId",
        sender_name,
        "receiverId",
        receiver_name,
        content AS last_message_content,
        timestamp AS last_message_timestamp,
        other_user_id,
        other_user_name
    FROM UserMessages
    WHERE rn = 1
    ORDER BY last_message_timestamp DESC;
    ```
  */

  const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: userId });

  if (error) {
    console.error('Error fetching conversations via RPC:', error.message);
    // Fallback or simpler query if RPC is not set up (less ideal)
    // This simpler query just gets all messages and you'd have to group client-side
    const fallbackResponse = await supabase
      .from('Message')
      .select(`
        *,
        product:Product(title, image),
        sender:User(fullName),
        receiver:User(fullName)
      `)
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
      .order('timestamp', { ascending: false });

    const fallbackData = handleSupabaseResponse(fallbackResponse, 'getConversations fallback');
    // Client-side grouping would be needed here, which is complex and inefficient for many messages.
    // For now, returning raw messages if RPC fails. UI will need to handle this.
    console.warn("RPC 'get_user_conversations' failed or not available. Consider implementing client-side grouping or ensure the RPC function exists.");
    return fallbackData || []; // This is not ideal, as it's not "conversations"
  }

  return data || []; // Data from RPC should be the list of conversations
};


/**
 * Fetches all messages for a specific conversation, defined by the current user,
 * the other user, and the product.
 *
 * @param {string} currentUserId
 * @param {string} otherUserId
 * @param {string} productId
 */
export const getMessagesForConversation = async (currentUserId, otherUserId, productId) => {
  if (!currentUserId || !otherUserId || !productId) {
    console.error('User IDs and Product ID are required to fetch messages.');
    return [];
  }

  const response = await supabase
    .from('Message')
    .select(`
      id,
      senderId,
      receiverId,
      productId,
      content,
      timestamp,
      sender:User!inner(id, fullName),
      receiver:User!inner(id, fullName)
    `)
    .eq('productId', productId)
    .or(`and(senderId.eq.${currentUserId},receiverId.eq.${otherUserId}),and(senderId.eq.${otherUserId},receiverId.eq.${currentUserId})`)
    .order('timestamp', { ascending: true }); // Messages in chronological order

  return handleSupabaseResponse(response, 'getMessagesForConversation');
};

/**
 * Sends a new message.
 *
 * @param {string} senderId
 * @param {string} receiverId
 * @param {string} productId
 * @param {string} content
 */
export const sendMessage = async (senderId, receiverId, productId, content) => {
  if (!senderId || !receiverId || !productId || !content) {
    console.error('All fields (senderId, receiverId, productId, content) are required to send a message.');
    throw new Error('Missing required message fields.');
  }

  const messageData = {
    senderId,
    receiverId,
    productId,
    content,
  };

  const response = await supabase
    .from('Message')
    .insert(messageData)
    .select(`
        *,
        sender:User(fullName),
        receiver:User(fullName)
    `)
    .single(); // Assuming you want the newly created message back

  return handleSupabaseResponse(response, 'sendMessage');
};


// Note on Realtime:
// For a chat application, you would typically subscribe to changes on the 'Message' table
// using Supabase Realtime in your UI components to get live updates.
// For example:
//
// const subscription = supabase
//   .channel('public:Message')
//   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message', filter: `productId=eq.${productId}` }, payload => {
//     console.log('New message received!', payload.new);
//     // Add payload.new to your local messages state
//   })
//   .subscribe();
//
// And unsubscribe when the component unmounts:
// supabase.removeChannel(subscription);
//
// The service functions above are primarily for initial data loads and sending messages.
