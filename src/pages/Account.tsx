import { Link, useNavigate } from "react-router-dom";
import { Globe, MapPin, Plus, LogOut, User, Calendar, Clock, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const savedTrips = [
  { id: "1", destination: "Rome, Italy", dates: "Mar 15–17, 2026", days: 3, status: "Generated", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=250&fit=crop" },
  { id: "2", destination: "Tokyo, Japan", dates: "Apr 10–16, 2026", days: 7, status: "Draft", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop" },
];

const sharedTrips = [
  { id: "s1", destination: "Paris, France", dates: "May 5–10, 2026", days: 6, sharedBy: "Ankit Sharma", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=250&fit=crop" },
];

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-5xl safe-top safe-bottom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold text-foreground">Your Itineraries</h2>
          <Link to="/plan"><Button className="bg-ocean-gradient text-primary-foreground font-semibold rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-1" /> New Trip</Button></Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {savedTrips.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to="/itinerary" className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group">
                <div className="h-36 sm:h-40 overflow-hidden"><img src={trip.image} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-foreground">{trip.destination}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full compact-touch ${trip.status === "Generated" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{trip.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 compact-touch"><Calendar className="w-3 h-3" /> {trip.dates}</span>
                    <span className="flex items-center gap-1 compact-touch"><Clock className="w-3 h-3" /> {trip.days} days</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          <Link to="/plan" className="flex flex-col items-center justify-center bg-card rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors min-h-[240px] text-muted-foreground hover:text-foreground">
            <Plus className="w-8 h-8 mb-2" /><span className="text-sm font-medium">Plan a New Trip</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 mt-12 mb-6">
          <Share2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-display font-bold text-foreground">Shared With You</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {sharedTrips.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to="/itinerary" className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group">
                <div className="h-36 sm:h-40 overflow-hidden relative">
                  <img src={trip.image} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 text-muted-foreground compact-touch"><Users className="w-3 h-3" /> Shared</div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-foreground mb-1">{trip.destination}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1 compact-touch"><Calendar className="w-3 h-3" /> {trip.dates}</span>
                    <span className="flex items-center gap-1 compact-touch"><Clock className="w-3 h-3" /> {trip.days} days</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shared by <span className="font-medium text-foreground">{trip.sharedBy}</span></p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Account;
