import React, { createContext, useState, useEffect, useContext } from "react";
import {
  supabase,
  getUserProfile,
  signUp,
  signIn,
  signOut,
} from "../services/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // This will be the Supabase auth user
  const [profile, setProfile] = useState(null); // This will be the user profile from 'User' table (includes role)
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // For initial session check

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session on load:", error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            const userProfile = await getUserProfile(currentSession.user.id);
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
        }
      } catch (e) {
        console.error("Exception fetching session on load:", e.message);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setLoading(true);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const userProfile = await getUserProfile(newSession.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null); // Clear profile on logout
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  // Auth functions
  const handleSignUp = async (userData) => {
    setLoading(true);
    try {
      const result = await signUp(userData);
      if (result.data && !result.error) {
        // The auth state change listener will handle updating the state
        // But we can also refresh the profile after a short delay
        setTimeout(async () => {
          if (result.data.user) {
            const userProfile = await getUserProfile(result.data.user.id);
            setProfile(userProfile);
          }
        }, 2000); // Give the trigger time to complete
      }
      return result;
    } catch (error) {
      console.error("SignUp error in context:", error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (phone, password) => {
    setLoading(true);
    try {
      const result = await signIn(phone, password);
      // The auth state change listener will handle updating the state
      return result;
    } catch (error) {
      console.error("SignIn error in context:", error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const result = await signOut();
      // The auth state change listener will handle clearing the state
      return result;
    } catch (error) {
      console.error("SignOut error in context:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
    }
  };

  const value = {
    session,
    user,
    profile, // Expose profile (which contains the role)
    loading,
    initialLoading,
    setProfile, // Allow manual setting of profile if needed
    refreshProfile, // Allow manual refresh of profile
    // Auth functions
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    // Utility functions
    isAuthenticated: !!user,
    isPhoneConfirmed: user?.phone_confirmed_at != null,
    userRole: profile?.role || null,
    isSeller: profile?.role === "seller",
    isBuyer: profile?.role === "buyer",
    userPhone: profile?.phone || user?.phone || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!initialLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Add default export to fix the warning
export default AuthProvider;
