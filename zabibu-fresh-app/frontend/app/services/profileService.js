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
 * Updates the current user's profile information in the 'User' table (public schema).
 * Assumes RLS is set up to allow users to update their own row in the 'User' table.
 *
 * @param {string} userId - The ID of the user to update.
 * @param {object} profileData - An object containing fields to update (e.g., { fullName, phone }).
 *                               Password should be updated via Supabase Auth methods, not here.
 *                               Email should also be updated via Supabase Auth methods.
 */
export const updateUserProfile = async (userId, profileData) => {
  if (!userId) {
    throw new Error("User ID is required to update profile.");
  }
  if (!profileData || Object.keys(profileData).length === 0) {
    return null; // Nothing to update
  }

  // Ensure sensitive fields like 'email' or 'role' are not updated here directly
  // if they are managed by Supabase Auth or have special protections.
  // For this example, we only allow 'fullName' and 'phone'.
  const allowedUpdates = {};
  if (profileData.hasOwnProperty('fullName')) {
    allowedUpdates.fullName = profileData.fullName;
  }
  if (profileData.hasOwnProperty('phone')) {
    // Basic phone validation could be added here or server-side
    allowedUpdates.phone = profileData.phone;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    console.warn("No allowed fields provided for profile update.");
    return null;
  }

  const { data, error } = await supabase
    .from('User') // Assuming your public User table is named 'User'
    .update(allowedUpdates)
    .eq('id', userId)
    .select() // Select the updated row
    .single(); // Expecting one row to be updated and returned

  if (error) {
    console.error('Error updating user profile:', error.message);
    throw error;
  }

  return data;
};

// Placeholder for changing password - this should use Supabase Auth
export const changePassword = async (newPassword) => {
  // This would typically involve `supabase.auth.updateUser({ password: newPassword })`
  // It requires the user to be logged in.
  // Additional security like requiring the old password might be implemented in a custom flow or Edge Function.
  console.warn("changePassword service function is a placeholder. Implement using supabase.auth.updateUser.");
  // Example:
  // const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  // if (error) throw error;
  // return data;
  return { message: "Password change functionality not fully implemented in service." };
};

// Placeholder for changing email - this should use Supabase Auth
export const changeEmail = async (newEmail) => {
  // This would typically involve `supabase.auth.updateUser({ email: newEmail })`
  // Supabase handles email confirmation flows.
  console.warn("changeEmail service function is a placeholder. Implement using supabase.auth.updateUser.");
  // Example:
  // const { data, error } = await supabase.auth.updateUser({ email: newEmail });
  // if (error) throw error;
  // return data;
  return { message: "Email change functionality not fully implemented in service." };
};
