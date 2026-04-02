import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star, MapPin, Wifi, Coffee, Car, Waves, ChevronDown, SlidersHorizontal, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

const AMENITY_OPTIONS = ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym", "Parking", "Breakfast", "Bar"];

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const queryDest = searchParams.get("destination") || "Paris";
  const queryRooms = searchParams.get("rooms") || "1";
  const queryGuests = searchParams.get("guests") || "2";
  const queryCheckIn = searchParams.get("checkIn") || "";
  const queryCheckOut = searchParams.get("checkOut") || "";

  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [starFilter, setStarFilter] = useState<number[]>([]);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating">("rating");
  const [dynamicHotels, setDynamicHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('search-hotels', {
          body: { destination: queryDest }
        });
        if (error) throw error;
        
        const mapped = (data.results || []).map((h: any) => ({
          id: h.place_id,
          name: h.name,
          location: h.formatted_address || queryDest,
          city: queryDest,
          rating: h.rating || 4.2,
          stars: Math.floor(h.rating || 4),
          reviewCount: h.user_ratings_total || 45,
          pricePerNight: Math.floor(Math.random() * 300) + 120,
          currency: "$",
          image: h.photos?.[0] 
            ? `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`
            : `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`,
          amenities: ["Free WiFi", "Breakfast", "Pool"],
          freeCancellation: true,
          breakfastIncluded: true
        }));
        setDynamicHotels(mapped);
      } catch (err) {
        console.error("Hotel discovery failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHotels();
  }, [queryDest]);

  const toggleAmenity = (a: string) => setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  const toggleStar = (s: number) => setStarFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const filtered = useMemo(() => {
    let result = [...dynamicHotels];
    if (priceRange[0] > 0 || priceRange[1] < 1000) {
       result = result.filter(h => h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1]);
    }
    if (minRating > 0) result = result.filter(h => h.rating >= minRating);
    if (starFilter.length > 0) result = result.filter(h => starFilter.includes(h.stars));
    
    if (sortBy === "price-asc") result.sort((a, b) => a.pricePerNight - b.pricePerNight);
    else if (sortBy === "price-desc") result.sort((a, b) => b.pricePerNight - a.pricePerNight);
    else result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [dynamicHotels, priceRange, minRating, starFilter, sortBy]);

  const activeFilterCount = (starFilter.length > 0 ? 1 : 0) + (freeCancellation ? 1 : 0) + (selectedAmenities.length > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setMinRating(0);
    setSelectedAmenities([]);
    setStarFilter([]);
    setFreeCancellation(false);
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Price per night</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={1000} step={10} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${priceRange[0]}</span><span>${priceRange[1]}+</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Hotel class</h3>
        <div className="flex gap-2">
          {[3, 4, 5].map((s) => (
            <button key={s} onClick={() => toggleStar(s)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${starFilter.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:bg-muted"}`}>
              {s}★
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Guest rating</h3>
        <div className="flex gap-2">
          {[3.5, 4.0, 4.5].map((r) => (
            <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${minRating === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:bg-muted"}`}>
              {r}+
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={freeCancellation} onCheckedChange={(v) => setFreeCancellation(!!v)} id="cancel" />
        <label htmlFor="cancel" className="text-sm text-foreground cursor-pointer">Free cancellation</label>
      </div>
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
          <X className="w-3 h-3 mr-1" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-6xl safe-top safe-bottom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {queryDest ? `Hotels in ${queryDest}` : "All Hotels"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} properties found
              {queryCheckIn && ` · ${queryCheckIn}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-xs border border-border rounded-lg px-3 py-2 bg-card text-foreground">
              <option value="rating">Top Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden sm:block w-[240px] shrink-0">
            <div className="bg-card rounded-xl border border-border p-4 sticky top-20">
              <h2 className="text-sm font-bold text-foreground mb-4">Filters</h2>
              <FiltersContent />
            </div>
          </aside>

          <div className="flex-1 space-y-4">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-24 space-y-4">
                 <Loader2 className="w-10 h-10 text-primary animate-spin" />
                 <p className="text-sm text-muted-foreground font-medium animate-pulse">Curating best boutique hotels for your journey...</p>
               </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No hotels match your filters.</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
              </div>
            ) : (
              filtered.map((hotel, i) => (
                <motion.div key={hotel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/hotels/${hotel.id}`} className="block bg-card rounded-xl border border-border shadow-card overflow-hidden hover:shadow-elevated transition-shadow group">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-[240px] h-48 sm:h-auto overflow-hidden shrink-0">
                        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                {Array.from({ length: hotel.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                              </div>
                              <h3 className="font-display font-bold text-foreground text-base">{hotel.name}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{hotel.city}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg">{hotel.rating}</div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{hotel.reviewCount} reviews</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-3 pt-3 border-t border-border">
                          <div className="flex gap-2">
                             <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><Check className="w-3 h-3" />Instant Confirmation</span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-display font-bold text-foreground">{hotel.currency}{hotel.pricePerNight}</p>
                            <p className="text-[10px] text-muted-foreground">per night</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hotels;
