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
      verifyOtp: async () => ({ success: false, error: "Not ready" }),
    } as AuthContextType;
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ROOT CAUSE OF BUG 3 (Refresh = Logout):
    // The old code used onAuthStateChange's INITIAL_SESSION event to decide if the user
    // is logged in. But on a hard page refresh, INITIAL_SESSION fires with session=null
    // for a brief moment BEFORE Supabase has finished reading the token from localStorage.
    // The old code saw session=null + INITIAL_SESSION and immediately set user=null +
    // loading=false, which caused Account.tsx to redirect to /login.
    //
    // THE FIX: Use getSession() as the single source of truth for the initial load.
    // getSession() reads directly from localStorage and reliably returns the stored
    // session. onAuthStateChange then handles all subsequent events (login, logout,
    // token refresh) but we skip INITIAL_SESSION entirely to avoid the false null.

    let initialized = false;

    // Step 1: Read session from localStorage immediately on mount.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await syncUser(session);
      } else {
        setUser(null);
      }
      setLoading(false);
      initialized = true;
    });

    // Step 2: React to auth changes going forward (login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] Event:", event, session ? "has session" : "no session");

      // SKIP INITIAL_SESSION — handled by getSession() above.
      // This is the critical fix: INITIAL_SESSION fires before localStorage is fully
      // read on a hard refresh and gives a false null, so we ignore it entirely.
      if (event === "INITIAL_SESSION") return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session) {
          await syncUser(session);
          setLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      }
    });

    // Safety net: unblock the UI if getSession() never resolves (rare network error)
    const safetyTimeout = setTimeout(() => {
      if (!initialized) {
        console.warn("[Auth] Timeout — forcing load complete.");
        setLoading(false);
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
      // Profile row may not exist yet — still set user with basic session info
      setUser({ id: session.user.id, email: session.user.email || "", fullName: "User" });
    }
  };

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

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/account" },
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
