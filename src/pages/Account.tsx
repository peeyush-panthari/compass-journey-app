import { Link, useNavigate } from "react-router-dom";
import { Plus, Calendar, Clock, Users, Share2, Search, ChevronLeft, ChevronRight, BedDouble, UserRound, Minus, Heart, Eye, Share, MoreHorizontal, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

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

interface ExploreBlog {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  authorAvatar: string;
  likes: number;
  views: number;
  url: string;
  category: "destination" | "food" | "video";
  type: "blog" | "video";
}

const exploreBlogs: ExploreBlog[] = [
  { id: "e1", title: "Labuan Bajo 3-Day Itinerary: See Komodo Dragons & Pink Beach", excerpt: "Visited Labuan Bajo multiple times and sailed through Komodo National Park. Sharing the best 3-day itinerary covering all the must-see spots.", image: "https://images.unsplash.com/photo-1570789210967-2cac24ba4d28?w=500&h=350&fit=crop", author: "Mikorev", authorAvatar: "M", likes: 12, views: 96, url: "#", category: "destination", type: "blog" },
  { id: "e2", title: "Hidden Gems of Ubud: Beyond the Rice Terraces", excerpt: "Bali's Ubud has so much more than Tegallalang. Discover secret waterfalls, local art villages, and sunrise treks that most tourists miss.", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&h=350&fit=crop", author: "Bali Expat", authorAvatar: "B", likes: 8, views: 81, url: "#", category: "destination", type: "blog" },
  { id: "e3", title: "Pasig City Walking Guide: History & Culture", excerpt: "It's a series of stops that will make you experience Pasig at its core. You'll find the simplicity of life and rich heritage.", image: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=500&h=350&fit=crop", author: "Ken @ Medium", authorAvatar: "K", likes: 5, views: 76, url: "#", category: "destination", type: "blog" },
  { id: "e4", title: "Best Street Food in Bangkok: A Local's Guide", excerpt: "From Pad Thai at Thip Samai to mango sticky rice at Mae Varee — a curated list of Bangkok's legendary street food vendors.", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=350&fit=crop", author: "Thai Foodie", authorAvatar: "T", likes: 24, views: 312, url: "#", category: "food", type: "blog" },
  { id: "e5", title: "Rome's Hidden Trattorias: Where Locals Actually Eat", excerpt: "Skip the tourist traps near the Colosseum. These family-run trattorias serve the best cacio e pepe and carbonara in the city.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=350&fit=crop", author: "Roma Eats", authorAvatar: "R", likes: 18, views: 204, url: "#", category: "food", type: "blog" },
  { id: "e6", title: "Tokyo Ramen Map: 10 Shops You Can't Miss", excerpt: "From rich tonkotsu in Shinjuku to light shoyu in Asakusa — the definitive ramen guide for your Tokyo trip.", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=350&fit=crop", author: "Noodle Hunter", authorAvatar: "N", likes: 31, views: 428, url: "#", category: "food", type: "blog" },
  { id: "e7", title: "Santorini Sunset: 4K Travel Cinematic", excerpt: "Experience the magic of Santorini's iconic sunsets, blue domes, and winding streets in stunning 4K cinematic footage.", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500&h=350&fit=crop", author: "Travel Films", authorAvatar: "T", likes: 45, views: 1200, url: "#", category: "video", type: "video" },
  { id: "e8", title: "48 Hours in Paris: A Visual Journey", excerpt: "From the Eiffel Tower at dawn to Montmartre at midnight — two days exploring the City of Light.", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&h=350&fit=crop", author: "Wanderlust TV", authorAvatar: "W", likes: 38, views: 890, url: "#", category: "video", type: "video" },
  { id: "e9", title: "Japanese Countryside by Train: Full Documentary", excerpt: "Take a scenic rail journey through Japan's countryside — from cherry blossom valleys to snow-capped mountains.", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&h=350&fit=crop", author: "Rail Adventures", authorAvatar: "R", likes: 52, views: 1540, url: "#", category: "video", type: "video" },
];

const ExploreCard = ({ blog, index }: { blog: ExploreBlog; index: number }) => (
  <motion.a
    href={blog.url}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group cursor-pointer"
  >
    <div className="relative h-44 overflow-hidden">
      <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      {blog.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-foreground ml-1" />
          </div>
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1.5">
        <button className="bg-card/80 backdrop-blur text-foreground text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 hover:bg-card transition-colors shadow-sm">
          <Share className="w-3 h-3" /> Share
        </button>
        <button className="bg-card/80 backdrop-blur text-foreground w-7 h-7 rounded-full flex items-center justify-center hover:bg-card transition-colors shadow-sm">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <div className="p-4">
      <h4 className="font-display font-bold text-foreground text-sm leading-tight mb-1.5 line-clamp-2">{blog.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{blog.excerpt}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground text-[10px] font-bold">{blog.authorAvatar}</div>
          <span className="text-xs font-medium text-foreground">{blog.author}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {blog.likes}</span>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {blog.views}</span>
        </div>
      </div>
    </div>
  </motion.a>
);

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
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [fetchingTrips, setFetchingTrips] = useState(true);
  
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 14));
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 15));
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);

  useEffect(() => { 
    const isCallback = window.location.hash.includes('access_token=') || window.location.search.includes('code=');
    if (!loading && !user && !isCallback) navigate("/login"); 
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const fetchTrips = async () => {
        setFetchingTrips(true);
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setTrips(data);
        }
        setFetchingTrips(false);
      };
      fetchTrips();
    }
  }, [user]);

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', user?.id); // Extra safety check

      if (error) throw error;

      setTrips(prev => prev.filter(t => t.id !== tripId));
      // toast({ title: "Trip deleted successfully" });
    } catch (err: any) {
      console.error("Error deleting trip:", err);
      // toast({ title: "Failed to delete trip", variant: "destructive" });
    }
  };

  if (loading || (!user && (window.location.hash.includes('access_token=') || window.location.search.includes('code=')))) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-6xl safe-top safe-bottom">

        {/* Need a place to stay */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border shadow-card px-5 py-4 sm:px-6 sm:py-4 mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
            <h2 className="text-base font-display font-bold text-foreground sm:mr-5 shrink-0">Need a place to stay?</h2>
            <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-0 border border-border rounded-lg overflow-hidden">
              <div className="flex-1 px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-border">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Where</label>
                <Input type="text" placeholder="Search destinations" value={destination} onChange={(e) => setDestination(e.target.value)} className="border-0 shadow-none h-5 text-xs bg-transparent focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60" />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-border text-left hover:bg-muted/40 transition-colors">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">When</label>
                    <div className="flex items-center gap-1 text-xs text-foreground whitespace-nowrap">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {checkIn ? format(checkIn, "M/d") : "In"} – {checkOut ? format(checkOut, "M/d") : "Out"}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex flex-col sm:flex-row">
                    <div className="p-3 border-b sm:border-b-0 sm:border-r border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Check in</p>
                      <CalendarComponent mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(d) => d < new Date()} className={cn("pointer-events-auto")} />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Check out</p>
                      <CalendarComponent mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(d) => d < (checkIn || new Date())} className={cn("pointer-events-auto")} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-border text-left hover:bg-muted/40 transition-colors">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Travelers</label>
                    <div className="flex items-center gap-1.5 text-xs text-foreground whitespace-nowrap">
                      <BedDouble className="w-3 h-3 text-muted-foreground" />{rooms}
                      <UserRound className="w-3 h-3 text-muted-foreground" />{guests}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-3" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground">Rooms</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setRooms(Math.max(1, rooms - 1))} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"><Minus className="w-2.5 h-2.5" /></button>
                        <span className="text-xs font-medium w-3 text-center">{rooms}</span>
                        <button onClick={() => setRooms(rooms + 1)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"><Plus className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground">Guests</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"><Minus className="w-2.5 h-2.5" /></button>
                        <span className="text-xs font-medium w-3 text-center">{guests}</span>
                        <button onClick={() => setGuests(guests + 1)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"><Plus className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="p-1.5 flex items-center">
                <Button
                  className="h-full w-full sm:w-auto px-5 rounded-md bg-foreground text-background font-semibold text-xs hover:bg-foreground/90 min-h-[32px]"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (destination) params.set("destination", destination);
                    if (checkIn) params.set("checkIn", format(checkIn, "M/d"));
                    if (checkOut) params.set("checkOut", format(checkOut, "M/d"));
                    params.set("rooms", String(rooms));
                    params.set("guests", String(guests));
                    navigate(`/hotels?${params.toString()}`);
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Your Trips */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Your Trips</h2>
          <Link to="/plan"><Button className="bg-ocean-gradient text-primary-foreground font-semibold rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-1" /> New Trip</Button></Link>
        </div>

        <HorizontalScroller>
          {fetchingTrips ? (
            <div className="flex items-center justify-center p-12 min-w-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : trips.length > 0 ? (
            trips.map((trip, i) => (
              <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="min-w-[260px] max-w-[280px] flex-shrink-0 relative group/card">
                <Link to={`/trip?id=${trip.id}`} className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group h-full">
                  <div className="h-36 overflow-hidden bg-muted relative">
                    <img 
                      src={`https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop`} 
                      alt={trip.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDeleteTrip(e, trip.id)}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display font-bold text-foreground text-sm truncate pr-2">{trip.title || trip.destination}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase`}>{trip.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.start_date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {trip.num_days}d</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border min-w-[260px]">
               <p className="text-sm text-muted-foreground mb-1">No trips yet</p>
               <Link to="/plan" className="text-primary text-xs font-bold hover:underline">Start Planning</Link>
            </div>
          )}
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
              <Link to="/trip" className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group h-full">
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

        {/* Explore */}
        <div className="flex items-center justify-between mt-12 mb-5">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Explore</h2>
          </div>
          <Link to="/explore"><Button variant="ghost" className="text-sm text-primary font-medium">See All</Button></Link>
        </div>

        <HorizontalScroller>
          {exploreBlogs.map((blog, i) => (
            <div key={blog.id} className="min-w-[260px] max-w-[280px] flex-shrink-0"><ExploreCard blog={blog} index={i} /></div>
          ))}
        </HorizontalScroller>

      </div>
    </div>
  );
};

export default Account;
