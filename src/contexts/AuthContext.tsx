import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (email: string, fullName: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const DEMO_ACCOUNT = { email: "123456789@phone.user", password: "otp-verified", fullName: "Demo User" };

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { user: null, login: () => ({ success: false, error: "Not ready" }), signup: () => ({ success: false, error: "Not ready" }), logout: () => {} } as AuthContextType;
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("globegenie_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, password: string) => {
    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      const u = { email: DEMO_ACCOUNT.email, fullName: DEMO_ACCOUNT.fullName };
      setUser(u);
      localStorage.setItem("globegenie_user", JSON.stringify(u));
      return { success: true };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const signup = (email: string, fullName: string, _password: string) => {
    const u = { email, fullName };
    setUser(u);
    localStorage.setItem("globegenie_user", JSON.stringify(u));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("globegenie_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
