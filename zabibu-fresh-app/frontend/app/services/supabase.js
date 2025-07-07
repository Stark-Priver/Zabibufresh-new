import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Store these in a .env file and use react-native-dotenv
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL; // Replace with your Supabase URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; // Replace with your Supabase anon key

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing. Please check your environment variables."
  );
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
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }
  return user;
};

/**
 * Fetches the user profile from the 'User' table based on the authenticated user's ID.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<object | null>} The user profile object or null if not found or error.
 */
export const getUserProfile = async (userId) => {
  if (!userId) return null;
  try {
    const { data, error, status } = await supabase
      .from("User") // Ensure this matches your Prisma model name
      .select(`fullName, phone, role, createdAt`)
      .eq("id", userId)
      .single();

    if (error && status !== 406) {
      // 406 means no rows found, which is a valid case for a new user
      console.error("Error fetching user profile:", error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Catch block error fetching user profile:", error.message);
    return null;
  }
};

/**
 * Creates a user profile in the 'User' table.
 * This should be called after successful signup.
 * @param {object} profileData - The profile data to insert.
 * @param {string} profileData.id - The user's auth ID.
 * @param {string} profileData.fullName - User's full name.
 * @param {string} profileData.phone - User's phone number.
 * @param {('seller'|'buyer')} profileData.role - User's role.
 * @returns {Promise<object | null>} The created user profile object or null on error.
 */
export const createUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from("User") // Ensure this matches your Prisma model name
      .insert([profileData])
      .select()
      .single(); // Assuming you want the inserted row back

    if (error) {
      console.error("Error creating user profile:", error.message);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Catch block error creating user profile:", error.message);
    return null;
  }
};

/**
 * Sign up a new user with phone and password
 * @param {object} userData - User data for signup
 * @param {string} userData.phone - User's phone number
 * @param {string} userData.password - User's password
 * @param {string} userData.fullName - User's full name
 * @param {('seller'|'buyer')} userData.role - User's role
 * @returns {Promise<{data: object, error: object}>} Signup result
 */
export const signUp = async (userData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      phone: userData.phone,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error.message);
      return { data: null, error };
    }

    // The database trigger should handle creating the user profile
    // But if it fails, we can create it manually as a fallback
    if (data.user && !data.user.phone_confirmed_at) {
      // Wait a bit for the trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if profile was created by trigger
      const profile = await getUserProfile(data.user.id);
      if (!profile) {
        console.log("Trigger failed, creating profile manually...");
        const profileData = {
          id: data.user.id,
          fullName: userData.fullName,
          phone: userData.phone,
          role: userData.role,
        };
        await createUserProfile(profileData);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error("Signup exception:", error.message);
    return { data: null, error };
  }
};

/**
 * Sign in a user with phone and password
 * @param {string} phone - User's phone number
 * @param {string} password - User's password
 * @returns {Promise<{data: object, error: object}>} Signin result
 */
export const signIn = async (phone, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });

    if (error) {
      console.error("Signin error:", error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Signin exception:", error.message);
    return { data: null, error };
  }
};

/**
 * Sign in with phone using OTP (One-Time Password)
 * @param {string} phone - User's phone number
 * @returns {Promise<{data: object, error: object}>} OTP send result
 */
export const signInWithOTP = async (phone) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      console.error("OTP signin error:", error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("OTP signin exception:", error.message);
    return { data: null, error };
  }
};

/**
 * Verify OTP for phone authentication
 * @param {string} phone - User's phone number
 * @param {string} token - OTP token
 * @returns {Promise<{data: object, error: object}>} Verification result
 */
export const verifyOTP = async (phone, token) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      console.error("OTP verification error:", error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("OTP verification exception:", error.message);
    return { data: null, error };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<{error: object}>} Signout result
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Signout error:", error.message);
    }
    return { error };
  } catch (error) {
    console.error("Signout exception:", error.message);
    return { error };
  }
};

// Add default export to fix the warning
export default supabase;
