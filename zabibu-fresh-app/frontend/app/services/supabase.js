import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Store these in a .env file and use react-native-dotenv
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL; // Replace with your Supabase URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Replace with your Supabase anon key

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Please check your environment variables.");
  // Potentially throw an error or handle this case more gracefully in a real app
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper function to get the current user's session.
 * @returns {Promise<import('@supabase/supabase-js').Session | null>} The user session or null.
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }
  return session;
};

/**
 * Helper function to get the current authenticated user.
 * @returns {Promise<import('@supabase/supabase-js').User | null>} The user object or null.
 */
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }
  return user;
};

// It's good practice to also fetch the user's profile from your public.User table
// after they log in, as this table contains the 'role' and other app-specific details.

/**
 * Fetches the user profile from the 'User' table based on the authenticated user's ID.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<object | null>} The user profile object or null if not found or error.
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null;
  try {
    const { data, error, status } = await supabase
      .from('User') // Ensure this matches your Prisma model name
      .select(`fullName, email, phone, role, createdAt`)
      .eq('id', userId)
      .single();

    if (error && status !== 406) { // 406 means no rows found, which is a valid case for a new user
      console.error('Error fetching user profile:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Catch block error fetching user profile:', error.message);
    return null;
  }
};

/**
 * Creates a user profile in the 'User' table.
 * This should be called after successful signup.
 * @param {object} profileData - The profile data to insert.
 * @param {string} profileData.id - The user's auth ID.
 * @param {string} profileData.fullName - User's full name.
 * @param {string} profileData.email - User's email.
 * @param {string} profileData.phone - User's phone number.
 * @param {('seller'|'buyer')} profileData.role - User's role.
 * @returns {Promise<object | null>} The created user profile object or null on error.
 */
export const createUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('User') // Ensure this matches your Prisma model name
      .insert([profileData])
      .select()
      .single(); // Assuming you want the inserted row back

    if (error) {
      console.error('Error creating user profile:', error.message);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Catch block error creating user profile:', error.message);
    return null;
  }
};
