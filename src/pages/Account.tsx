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
import { tripCardCoverUrl } from "@/lib/tripCover";
import { Loader2 } from "lucide-react";
import { fetchPublishedBlogs, getBlogImageCandidates, type BlogSummary } from "@/lib/blogs";

const ExploreCard = ({ blog, index }: { blog: BlogSummary; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="group relative block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer"
  >
    {/* Entire Card Link */}
    <Link 
      to={`/explore/${blog.slug || blog.id}`} 
      className="absolute inset-0 z-10"
      aria-label={`Read ${blog.title}`}
    />

    <div className="relative h-44 overflow-hidden bg-muted">
      {(blog.image || (blog.images && blog.images[0])) ? (
        <img
          src={getBlogImageCandidates(blog)[0]}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          data-fallbacks={JSON.stringify(getBlogImageCandidates(blog))}
          data-fallback-index="0"
          onError={(event) => {
            const img = event.currentTarget;
            const fallbacks = JSON.parse(img.dataset.fallbacks || "[]") as string[];
            const currentIndex = Number(img.dataset.fallbackIndex || "0");
            const nextSrc = fallbacks[currentIndex + 1];
            if (nextSrc) {
              img.dataset.fallbackIndex = String(currentIndex + 1);
              img.src = nextSrc;
            } else {
              img.removeAttribute("src");
              img.classList.add("bg-muted");
            }
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Cover image coming soon
        </div>
      )}
      {blog.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-foreground ml-1" />
          </div>
        </div>
      )}
      <div className="absolute top-2 right-2 z-20 flex gap-1.5">
        <button className="bg-card/80 backdrop-blur text-foreground text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 hover:bg-card transition-colors shadow-sm">
          <Share className="w-3 h-3" /> Share
        </button>
      </div>
    </div>
    <div className="p-4">
      <h4 className="font-display font-bold text-foreground text-sm leading-tight mb-1.5 line-clamp-2 transition-colors group-hover:text-primary">
        {blog.title}
      </h4>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {blog.excerpt || "Open the article to read the full story."}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground text-[10px] font-bold">
            {(blog.author_avatar || blog.author || "G").slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-foreground">{blog.author || "GlobeGenie Team"}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {blog.likes}</span>
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {blog.views}</span>
        </div>
      </div>
    </div>
  </motion.div>
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
  // FIXED: Also pull `session` from context so we can use session.user.id
  // as a fallback when the profile hasn't synced yet. This is the root cause
  // of trips not showing after Google OAuth login — `user` is null for a brief
  // window while syncProfile() is running, but session.user.id is available
  // immediately after the OAuth redirect completes.
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [sharedTrips, setSharedTrips] = useState<any[]>([]);
  const [fetchingTrips, setFetchingTrips] = useState(false);
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 14));
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 15));
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);

  // FIXED: Use the resolved user ID — prefer user.id (fully synced profile),
  // but fall back to session?.user?.id so trips load the moment auth is ready
  // even if the profiles table query is still in-flight.
  const resolvedUserId = user?.id ?? session?.user?.id ?? null;

  useEffect(() => {
    // Don't attempt to fetch if auth is still initialising
    if (loading) return;
    // No session at all → nothing to fetch
    if (!resolvedUserId) return;

    const fetchTrips = async () => {
      setFetchingTrips(true);

      // ── Owned trips ──────────────────────────────────────────────────────────
      try {
        const { data: ownedTrips, error: ownedError } = await supabase
          .from("trips")
          .select("*")
          .eq("user_id", resolvedUserId)
          .order("created_at", { ascending: false });

        if (ownedError) throw ownedError;
        setTrips(ownedTrips || []);
      } catch (err: any) {
        console.error("[Account] Error fetching owned trips:", err.message);
        setTrips([]);
      }

      // ── Shared / collaborated trips ──────────────────────────────────────────
      try {
        console.log("[Account] Fetching shared trips for user:", resolvedUserId);
        const { data: collaboratorRows, error: collaboratorsError } = await supabase
          .from("trip_collaborators")
          .select("trip_id")
          .eq("user_id", resolvedUserId)
          .eq("accepted", true);

        if (collaboratorsError) throw collaboratorsError;
        
        console.log("[Account] Collaborator rows:", collaboratorRows);

        const sharedTripIds = Array.from(
          new Set((collaboratorRows || []).map((row) => row.trip_id).filter(Boolean))
        );
        
        console.log("[Account] Shared trip IDs:", sharedTripIds);

        if (sharedTripIds.length === 0) {
          console.log("[Account] No shared trip IDs found.");
          setSharedTrips([]);
        } else {
          console.log("[Account] Fetching trip details for shared IDs...");
          const { data: sharedVisibleTrips, error: sharedTripsError } = await supabase
            .from("trips")
            .select("*")
            .in("id", sharedTripIds)
            .neq("user_id", resolvedUserId)
            .order("created_at", { ascending: false });

          if (sharedTripsError) throw sharedTripsError;
          console.log("[Account] Shared visible trips fetched:", sharedVisibleTrips);
          setSharedTrips(sharedVisibleTrips || []);
        }
      } catch (err: any) {
        console.error("[Account] Error fetching shared trips:", err.message);
        setSharedTrips([]);
      } finally {
        setFetchingTrips(false);
      }
    };

    fetchTrips();
  }, [resolvedUserId, loading]); // Re-run only when the stable ID or loading state changes

  useEffect(() => {
    const loadBlogs = async () => {
      setLoadingBlogs(true);
      try {
        const data = await fetchPublishedBlogs();
        setBlogs(data);
      } catch (err: any) {
        console.error("[Account] Error fetching blogs:", err.message);
      } finally {
        setLoadingBlogs(false);
      }
    };
    loadBlogs();
  }, []);

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripId)
        .eq("user_id", resolvedUserId);

      if (error) throw error;
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err: any) {
      console.error("[Account] Error deleting trip:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 sm:pt-24 pb-24 md:pb-16 max-w-6xl safe-top safe-bottom">

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
                <Link to={`/trip/${trip.id}`} className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group h-full">
                  <div className="h-36 overflow-hidden bg-muted relative">
                    <img
                      src={tripCardCoverUrl(trip.cover_image, i)}
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
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">{trip.status}</span>
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
          {sharedTrips.length > 0 ? sharedTrips.map((trip, i) => (
            <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="min-w-[260px] max-w-[280px] flex-shrink-0">
              <Link to={`/trip/${trip.id}`} className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group h-full">
                <div className="h-36 overflow-hidden relative">
                  <img src={tripCardCoverUrl(trip.cover_image, i)} alt={trip.title || trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 text-muted-foreground"><Users className="w-3 h-3" /> Shared</div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-foreground text-sm mb-1">{trip.title || trip.destination}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.start_date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {trip.num_days}d</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shared trip with edit access</p>
                </div>
              </Link>
            </motion.div>
          )) : (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border min-w-[260px]">
              <p className="text-sm text-muted-foreground mb-1">No shared trips yet</p>
              <p className="text-xs text-muted-foreground">Trips shared with you will appear here.</p>
            </div>
          )}
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
          {loadingBlogs ? (
            <div className="flex items-center justify-center p-8 min-w-[300px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : blogs.length > 0 ? (
            blogs.map((blog, i) => (
              <div key={blog.id} className="min-w-[260px] max-w-[280px] flex-shrink-0">
                <ExploreCard blog={blog} index={i} />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border-2 border-dashed border-border min-w-[260px]">
              <p className="text-sm text-muted-foreground">No recommendations yet</p>
            </div>
          )}
        </HorizontalScroller>

      </div>
    </div>
  );
};

export default Account;
