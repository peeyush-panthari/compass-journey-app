import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { getOAuthRedirectTo } from "../lib/authRedirect";

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
  signInWithGoogle: (next?: string) => Promise<{ success: boolean; error?: string }>;
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
      logout: async () => { },
      signInWithGoogle: async () => ({ success: false, error: "Not ready" }),
      signInWithPhone: async () => ({ success: false, error: "Not ready" }),
      verifyOtp: async () => ({ success: false, error: "Not ready" }),
    } as AuthContextType;
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Unified Auth Initialization (NO race conditions)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 1. Get session (handles PKCE exchange)
      const { data: { session: initialSession } } = await supabase.auth.getSession();

      if (!mounted) return;

      // 2. Set session first
      setSession(initialSession);

      // 3. Clean URL AFTER session is established
      const url = new URL(window.location.href);

      const hasAuthParams =
        url.searchParams.get("code") ||
        url.searchParams.get("access_token") ||
        url.searchParams.get("refresh_token") ||
        url.hash.includes("access_token=");

      if (initialSession && hasAuthParams) {
        console.log("[Auth] Cleaning sensitive tokens from URL...");
        window.history.replaceState(
          {},
          document.title,
          url.pathname + url.hash
        );
      }

      // 4. Now mark loading false (after everything is stable)
      setLoading(false);
    };

    initAuth();

    // 5. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 6. Profile Sync
  useEffect(() => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    const syncProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: profile?.full_name || "User",
          phone: profile?.phone,
          age: profile?.age,
          gender: profile?.gender,
        });
      } catch {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: "User",
        });
      }
    };

    syncProfile();
  }, [session?.user?.id]);

  const login = async (email: string, password?: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || "testPassword123",
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
        options: { data: { full_name: fullName } },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signInWithGoogle = async (next?: string) => {
    try {
      const redirectTo = getOAuthRedirectTo(next);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { success: false, error: "No user logged in." };
    try {
      const payload: any = {};
      if (data.fullName !== undefined) payload.full_name = data.fullName;
      if (data.phone !== undefined) payload.phone = data.phone;
      if (data.age !== undefined) payload.age = data.age;
      if (data.gender !== undefined) payload.gender = data.gender;

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
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
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: "sms",
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      const error = err as Error;
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, updateProfile, logout, signInWithGoogle, signInWithPhone, verifyOtp }}
    >
      {children}
    </AuthContext.Provider>
  );
};
