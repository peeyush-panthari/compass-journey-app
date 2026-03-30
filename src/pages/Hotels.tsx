import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star, MapPin, Wifi, Coffee, Car, Waves, ChevronDown, SlidersHorizontal, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { hotels } from "@/data/hotels";

const AMENITY_OPTIONS = ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym", "Parking", "Breakfast", "Bar"];

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const queryDest = searchParams.get("destination") || "";
  const queryRooms = searchParams.get("rooms") || "1";
  const queryGuests = searchParams.get("guests") || "2";
  const queryCheckIn = searchParams.get("checkIn") || "";
  const queryCheckOut = searchParams.get("checkOut") || "";

  const [priceRange, setPriceRange] = useState([0, 600]);
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [starFilter, setStarFilter] = useState<number[]>([]);
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating">("rating");

  const toggleAmenity = (a: string) => setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  const toggleStar = (s: number) => setStarFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const filtered = useMemo(() => {
    let result = hotels.filter((h) => {
      if (queryDest && !h.city.toLowerCase().includes(queryDest.toLowerCase()) && !h.location.toLowerCase().includes(queryDest.toLowerCase()) && !h.name.toLowerCase().includes(queryDest.toLowerCase())) return false;
      if (h.pricePerNight < priceRange[0] || h.pricePerNight > priceRange[1]) return false;
      if (h.rating < minRating) return false;
      if (starFilter.length > 0 && !starFilter.includes(h.stars)) return false;
      if (freeCancellation && !h.freeCancellation) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every((a) => h.amenities.some((ha) => ha.toLowerCase().includes(a.toLowerCase())))) return false;
      return true;
    });
    if (sortBy === "price-asc") result.sort((a, b) => a.pricePerNight - b.pricePerNight);
    else if (sortBy === "price-desc") result.sort((a, b) => b.pricePerNight - a.pricePerNight);
    else result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [queryDest, priceRange, minRating, starFilter, freeCancellation, selectedAmenities, sortBy]);

  const activeFilterCount = (starFilter.length > 0 ? 1 : 0) + (freeCancellation ? 1 : 0) + (selectedAmenities.length > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 600 ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const clearFilters = () => {
    setPriceRange([0, 600]);
    setMinRating(0);
    setSelectedAmenities([]);
    setStarFilter([]);
    setFreeCancellation(false);
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Price per night</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={600} step={10} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${priceRange[0]}</span><span>${priceRange[1]}+</span>
        </div>
      </div>
      {/* Stars */}
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
      {/* Rating */}
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
      {/* Free cancellation */}
      <div className="flex items-center gap-2">
        <Checkbox checked={freeCancellation} onCheckedChange={(v) => setFreeCancellation(!!v)} id="cancel" />
        <label htmlFor="cancel" className="text-sm text-foreground cursor-pointer">Free cancellation</label>
      </div>
      {/* Amenities */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button key={a} onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selectedAmenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:bg-muted"}`}>
              {a}
            </button>
          ))}
        </div>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {queryDest ? `Hotels in ${queryDest}` : "All Hotels"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} {filtered.length === 1 ? "property" : "properties"} found
              {queryCheckIn && queryCheckOut && ` · ${queryCheckIn} – ${queryCheckOut}`}
              {queryRooms && ` · ${queryRooms} room${queryRooms !== "1" ? "s" : ""}`}
              {queryGuests && ` · ${queryGuests} guest${queryGuests !== "1" ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-xs border border-border rounded-lg px-3 py-2 bg-card text-foreground">
              <option value="rating">Top Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            {/* Mobile filter button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden rounded-lg">
                  <SlidersHorizontal className="w-4 h-4 mr-1" /> Filters {activeFilterCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-4"><FiltersContent /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden sm:block w-[240px] shrink-0">
            <div className="bg-card rounded-xl border border-border p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">Filters</h2>
                {activeFilterCount > 0 && <Badge variant="secondary" className="text-[10px]">{activeFilterCount}</Badge>}
              </div>
              <FiltersContent />
            </div>
          </aside>

          {/* Hotel Cards */}
          <div className="flex-1 space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No hotels match your filters.</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
              </div>
            )}
            {filtered.map((hotel, i) => (
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
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{hotel.location}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg">{hotel.rating}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{hotel.reviewCount} reviews</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {hotel.amenities.slice(0, 4).map((a) => (
                            <span key={a} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                          {hotel.amenities.length > 4 && <span className="text-[10px] text-muted-foreground">+{hotel.amenities.length - 4} more</span>}
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex gap-2">
                          {hotel.freeCancellation && <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><Check className="w-3 h-3" />Free cancellation</span>}
                          {hotel.breakfastIncluded && <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><Coffee className="w-3 h-3" />Breakfast included</span>}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hotels;
