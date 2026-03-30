import { Link, useNavigate } from "react-router-dom";
import { Plus, Calendar, Clock, Users, Share2, Search, ChevronLeft, ChevronRight, BedDouble, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";

const savedTrips = [
  { id: "1", destination: "Rome, Italy", dates: "Mar 15–17, 2026", days: 3, status: "Generated", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=250&fit=crop" },
  { id: "2", destination: "Tokyo, Japan", dates: "Apr 10–16, 2026", days: 7, status: "Draft", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop" },
  { id: "3", destination: "Bali, Indonesia", dates: "Jun 1–8, 2026", days: 8, status: "Generated", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=250&fit=crop" },
  { id: "4", destination: "London, UK", dates: "Jul 20–25, 2026", days: 6, status: "Draft", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=250&fit=crop" },
];

const sharedTrips = [
  { id: "s1", destination: "Paris, France", dates: "May 5–10, 2026", days: 6, sharedBy: "Ankit Sharma", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=250&fit=crop" },
  { id: "s2", destination: "Dubai, UAE", dates: "Aug 12–16, 2026", days: 5, sharedBy: "Priya Mehta", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=250&fit=crop" },
];

const HorizontalScroller = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => { el?.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, []);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card/90 backdrop-blur border border-border shadow-md flex items-center justify-center text-foreground hover:bg-card transition-colors -ml-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mb-2">
        {children}
      </div>
      {canScrollRight && (
        <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card/90 backdrop-blur border border-border shadow-md flex items-center justify-center text-foreground hover:bg-card transition-colors -mr-2">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");

  useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-6xl safe-top safe-bottom">

        {/* Need a place to stay */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-muted/50 rounded-2xl p-5 sm:p-8 mb-10">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-5">Need a place to stay?</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-card rounded-xl border border-border p-3">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Where</label>
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search destinations"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="border-0 shadow-none pl-6 h-8 text-sm bg-transparent focus-visible:ring-0 p-0"
                />
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 min-w-[150px]">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">When</label>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>4/13 – 4/14</span>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 min-w-[130px]">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Travelers</label>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <BedDouble className="w-4 h-4 text-muted-foreground" />
                <span>1</span>
                <UserRound className="w-4 h-4 text-muted-foreground ml-1" />
                <span>2</span>
              </div>
            </div>
            <Button className="h-auto sm:h-full px-8 rounded-xl bg-foreground text-background font-semibold text-base hover:bg-foreground/90 self-stretch sm:self-auto min-h-[48px]">
              Search
            </Button>
          </div>
        </motion.div>

        {/* Your Trips */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Your Trips</h2>
          <Link to="/plan"><Button className="bg-ocean-gradient text-primary-foreground font-semibold rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-1" /> New Trip</Button></Link>
        </div>

        <HorizontalScroller>
          {savedTrips.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="min-w-[260px] max-w-[280px] flex-shrink-0">
              <Link to="/itinerary" className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group h-full">
                <div className="h-36 overflow-hidden"><img src={trip.image} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-foreground text-sm">{trip.destination}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trip.status === "Generated" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{trip.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.dates}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {trip.days}d</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          <Link to="/plan" className="flex flex-col items-center justify-center bg-card rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors min-w-[200px] flex-shrink-0 text-muted-foreground hover:text-foreground">
            <Plus className="w-8 h-8 mb-2" /><span className="text-sm font-medium">Plan a New Trip</span>
          </Link>
        </HorizontalScroller>

        {/* Trips Shared with You */}
        <div className="flex items-center gap-2 mt-12 mb-5">
          <Share2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Trips Shared with You</h2>
        </div>

        <HorizontalScroller>
          {sharedTrips.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="min-w-[260px] max-w-[280px] flex-shrink-0">
              <Link to="/itinerary" className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group h-full">
                <div className="h-36 overflow-hidden relative">
                  <img src={trip.image} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 text-muted-foreground"><Users className="w-3 h-3" /> Shared</div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-foreground text-sm mb-1">{trip.destination}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.dates}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {trip.days}d</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shared by <span className="font-medium text-foreground">{trip.sharedBy}</span></p>
                </div>
              </Link>
            </motion.div>
          ))}
        </HorizontalScroller>

      </div>
    </div>
  );
};

export default Account;
