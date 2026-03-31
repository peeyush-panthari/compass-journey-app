import { Link, useLocation } from "react-router-dom";
import { Home, Map, MessageSquare, Globe, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Hide on chat page (has its own input bar) and auth pages
  const hiddenPaths = ["/chat", "/login", "/signup"];
  if (hiddenPaths.includes(location.pathname)) return null;
  if (!user && location.pathname === "/") return null;

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/plan", icon: Globe, label: "Plan" },
    { to: "/chat", icon: MessageSquare, label: "Chat" },
    { to: "/trip", icon: Map, label: "Trip" },
    { to: user ? "/account" : "/login", icon: User, label: user ? "Account" : "Login" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors compact-touch ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
