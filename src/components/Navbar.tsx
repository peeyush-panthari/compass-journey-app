import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ArrowRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/globegenie-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled || !isLanding
        ? "bg-card/90 backdrop-blur-xl border-b border-border shadow-soft"
        : "bg-transparent"
    }`}>
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="GlobeGenie" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
          <span className="text-lg sm:text-xl font-display font-bold tracking-tight text-foreground">
            GlobeGenie
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {isLanding && (
            <>
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 compact-touch">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 compact-touch">How It Works</a>
            </>
          )}
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground gap-2">
                  <div className="w-7 h-7 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground font-display font-bold text-xs">{user.fullName.charAt(0).toUpperCase()}</div>
                  My Account
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0 rounded-xl border-border/60">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground font-display font-bold text-base shadow-md">{user.fullName.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm text-foreground truncate">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <button onClick={() => navigate("/account")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"><User className="w-4 h-4 text-muted-foreground" /> View Account</button>
                  <button onClick={() => navigate("/edit-profile")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /> Edit Profile</button>
                  <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">Log In</Button>
              </Link>
              <Button className="bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-90 transition-opacity rounded-xl" onClick={() => setAuthOpen(true)}>
                Start Planning <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border p-4 flex flex-col gap-3"
          >
            {isLanding && (
              <>
                <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-foreground py-2">Features</a>
                <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-foreground py-2">How It Works</a>
              </>
            )}
            {user ? (
              <>
                <Link to="/account" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start"><User className="w-4 h-4 mr-2" /> My Account</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { logout(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Log In</Button>
                </Link>
                <Button className="w-full bg-gold-gradient text-primary-foreground font-semibold" onClick={() => { setAuthOpen(true); setMobileOpen(false); }}>
                  Start Planning <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </nav>
  );
};

export default Navbar;
