import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Clock, Trash2, Share, MoreHorizontal, ChevronLeft, ChevronRight, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { tripCardCoverUrl } from "@/lib/tripCover";

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

  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button onClick={() => scroll(-1)} className="absolute left-0 top-[45%] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card/90 backdrop-blur border border-border shadow-md flex items-center justify-center text-foreground hover:bg-card transition-colors -ml-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div ref={scrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mb-2">
        {children}
      </div>
      {canScrollRight && (
        <button onClick={() => scroll(1)} className="absolute right-0 top-[45%] -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card/90 backdrop-blur border border-border shadow-md flex items-center justify-center text-foreground hover:bg-card transition-colors -mr-2">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

interface Trip {
  id: string;
  title: string;
  countries: string[];
  start_date: string;
  num_days: number;
  status: string;
  created_at: string;
  cover_image?: string | null;
}

interface RecentTripsSectionProps {
  /** Called when trips finish loading — parent can decide to show fallback if tripsCount === 0 */
  onTripsLoaded: (tripsCount: number) => void;
}

const RecentTripsSection = ({ onTripsLoaded }: RecentTripsSectionProps) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchTrips = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("id, title, countries, start_date, num_days, status, created_at, cover_image")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;
        const result = data || [];
        setTrips(result);
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          onTripsLoaded(result.length);
        }
      } catch {
        setTrips([]);
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          onTripsLoaded(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [user?.id]); // eslint-disable-line

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    const { error } = await supabase.from("trips").delete().eq("id", tripId).eq("user_id", user?.id);
    if (!error) setTrips(prev => prev.filter(t => t.id !== tripId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (trips.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Recent Trips
          </h2>
        </div>
        <Link to="/plan">
          <Button className="bg-gold-gradient text-primary-foreground font-semibold rounded-xl px-5 shadow-gold hover:opacity-90 transition-opacity shrink-0">
            <Plus className="w-4 h-4 mr-1" /> Plan new trip
          </Button>
        </Link>
      </div>

      {/* Trip Cards */}
      <HorizontalScroller>
        {trips.map((trip, i) => {
          const coverImg = tripCardCoverUrl(trip.cover_image, i);
          const destination = trip.countries?.join(", ") || trip.title;

          const formattedDate = (() => {
            try {
              return format(new Date(trip.start_date), "MMM d");
            } catch {
              return trip.start_date;
            }
          })();

          const endDate = (() => {
            try {
              const start = new Date(trip.start_date);
              start.setDate(start.getDate() + (trip.num_days || 0));
              return format(start, "MMM d");
            } catch {
              return "";
            }
          })();

          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="min-w-[240px] sm:min-w-[260px] max-w-[260px] flex-shrink-0 group/card"
            >
              <Link to={`/trip/${trip.id}`} className="block">
                {/* Cover image */}
                <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                  <img
                    src={coverImg}
                    alt={destination}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay actions */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-white transition-colors"
                    >
                      <Share className="w-3 h-3" /> Share
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, trip.id)}
                      className="bg-white/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>

                {/* Trip info */}
                <h3 className="font-display font-bold text-foreground text-sm mb-1.5 truncate">
                  {trip.title || `Trip to ${destination}`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground font-bold text-[9px] shrink-0">
                    {user?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}{endDate ? ` – ${endDate}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {trip.num_days} {trip.num_days === 1 ? "day" : "days"}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </HorizontalScroller>
    </motion.section>
  );
};

export default RecentTripsSection;
