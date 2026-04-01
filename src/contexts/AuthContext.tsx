import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  age?: number;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, fullName: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { 
      user: null, 
      loading: false,
      login: async () => ({ success: false, error: "Not ready" }), 
      signup: async () => ({ success: false, error: "Not ready" }), 
      updateProfile: async () => ({ success: false, error: "Not ready" }), 
      logout: async () => {},
      signInWithGoogle: async () => ({ success: false, error: "Not ready" }),
      signInWithPhone: async () => ({ success: false, error: "Not ready" }),
      verifyOtp: async () => ({ success: false, error: "Not ready" })
    } as AuthContextType;
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the middle of a redirect flow.
    const isAuthCallback = window.location.hash.includes('access_token=') || 
                          window.location.search.includes('code=');
    
    // Track if we've already initialized the first session
    let isInitialized = false;

    // 1. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] Auth Event Received:", event, session ? "Session Found" : "No Session");
      
      if (session) {
        await syncUser(session);
        // Only set loading false if we haven't already initialized
        if (!isInitialized) {
          setLoading(false);
          isInitialized = true;
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        isInitialized = true;
      } else if (event === 'INITIAL_SESSION' && !session) {
        // If INITIAL_SESSION fires with no session, and we aren't waiting for a callback
        if (!isAuthCallback && !isInitialized) {
          console.log("[Auth] No initial session found via event listener.");
          setUser(null);
          setLoading(false);
          isInitialized = true;
        }
      }
    });

    // 2. Explicitly fetch current session on mount (Standard Supabase v2 pattern)
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("[Auth] getSession found session. Syncing...");
          await syncUser(session);
        } else if (!isAuthCallback) {
          console.log("[Auth] getSession returned null.");
          setUser(null);
        }
      } catch (err) {
        console.error("[Auth] Error during initSession:", err);
      } finally {
        // Only set loading to false here if we aren't in a callback flow
        // and onAuthStateChange hasn't already handled it.
        if (!isInitialized && !isAuthCallback) {
          setLoading(false);
          isInitialized = true;
        }
      }
    };

    initSession();

    // 3. Safety Timeout: Force loading to end after 3s if nothing else happens
    const safetyTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn("[Auth] Auth handshake timeout. Forcing app initialization.");
        setLoading(false);
        isInitialized = true;
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const syncUser = async (session: any) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) {
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        fullName: profile.full_name || "User",
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender
      });
    } else {
      setUser({ id: session.user.id, email: session.user.email || "", fullName: "User" });
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || "testPassword123"
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signup = async (email: string, fullName: string, password?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: password || "testPassword123",
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + "/account"
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { success: false, error: "No user logged in." };
    try {
      const payload: any = {};
      if (data.fullName !== undefined) payload.full_name = data.fullName;
      if (data.phone !== undefined) payload.phone = data.phone;
      if (data.age !== undefined) payload.age = data.age;
      if (data.gender !== undefined) payload.gender = data.gender;
      
      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
      if (error) throw error;
      
      setUser({ ...user, ...data });
      return { success: true };
    } catch (err) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      // Ensure phone is in E.164 format (+CountryCodeNumber)
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  }

  const verifyOtp = async (phone: string, token: string) => {
    try {
      // Ensure phone is in E.164 format (+CountryCodeNumber)
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms'
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  }

  const logout = async () => {
    setUser(null); // Clear immediately so UI updates at once
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, updateProfile, logout, signInWithGoogle, signInWithPhone, verifyOtp }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
