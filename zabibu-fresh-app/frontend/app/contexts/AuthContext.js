import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, getUserProfile } from '../services/supabase'; // Ensure getUserProfile is exported from supabase.js

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
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
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
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile, // Expose profile (which contains the role)
    loading,
    initialLoading,
    setProfile, // Allow manual setting of profile if needed (e.g., after signup profile creation)
    // Add login, signup, logout functions here that interact with Supabase
    // and then update profile state
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
