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
            <>
              <Link to="/account">
                <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                  <User className="w-4 h-4 mr-1" /> My Account
                </Button>
              </Link>
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-destructive" onClick={logout}>
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </>
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
