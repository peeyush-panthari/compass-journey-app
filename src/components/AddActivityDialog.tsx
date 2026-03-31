import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Star, Clock, Ticket, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  rating: number;
  openTime: string;
  closeTime: string;
  duration: string;
  ticketPrice: string;
  description: string;
  photoUrl: string;
  timeOfDay: "morning" | "afternoon" | "evening";
}

// Mock places database for search
const mockPlaces: PlaceResult[] = [
  { id: "p1", name: "Colosseum", address: "Piazza del Colosseo, 1, 00184 Roma", rating: 4.7, openTime: "09:00", closeTime: "19:00", duration: "2.5 hours", ticketPrice: "€16", description: "The iconic ancient Roman amphitheater.", photoUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop", timeOfDay: "morning" },
  { id: "p2", name: "Roman Forum", address: "Via della Salara Vecchia, 5/6, Roma", rating: 4.6, openTime: "09:00", closeTime: "19:00", duration: "1.5 hours", ticketPrice: "Included", description: "The heart of ancient Rome with ruins.", photoUrl: "https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=600&h=400&fit=crop", timeOfDay: "morning" },
  { id: "p3", name: "Trevi Fountain", address: "Piazza di Trevi, 00187 Roma", rating: 4.8, openTime: "Always", closeTime: "Open", duration: "30 min", ticketPrice: "Free", description: "The largest Baroque fountain in Rome.", photoUrl: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=600&h=400&fit=crop", timeOfDay: "afternoon" },
  { id: "p4", name: "Vatican Museums", address: "Viale Vaticano, 00165 Roma", rating: 4.6, openTime: "09:00", closeTime: "18:00", duration: "3 hours", ticketPrice: "€17", description: "Home to the Sistine Chapel and world-class art.", photoUrl: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&h=400&fit=crop", timeOfDay: "morning" },
  { id: "p5", name: "Pantheon", address: "Piazza della Rotonda, 00186 Roma", rating: 4.8, openTime: "09:00", closeTime: "19:00", duration: "1 hour", ticketPrice: "€5", description: "Ancient temple with the world's largest unreinforced concrete dome.", photoUrl: "https://images.unsplash.com/photo-1583265627959-fb7042f5133b?w=600&h=400&fit=crop", timeOfDay: "morning" },
  { id: "p6", name: "Spanish Steps", address: "Piazza di Spagna, 00187 Roma", rating: 4.5, openTime: "Always", closeTime: "Open", duration: "30 min", ticketPrice: "Free", description: "Monumental stairway of 135 steps connecting two famous piazzas.", photoUrl: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600&h=400&fit=crop", timeOfDay: "afternoon" },
  { id: "p7", name: "Trastevere Food Tour", address: "Trastevere, Roma", rating: 4.7, openTime: "18:00", closeTime: "22:00", duration: "3 hours", ticketPrice: "€65", description: "Guided walking food tour through Trastevere's best eateries.", photoUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop", timeOfDay: "evening" },
  { id: "p8", name: "Borghese Gallery", address: "Piazzale Scipione Borghese, 5, Roma", rating: 4.7, openTime: "09:00", closeTime: "19:00", duration: "2 hours", ticketPrice: "€15", description: "A world-class art gallery housing Bernini and Caravaggio masterpieces.", photoUrl: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?w=600&h=400&fit=crop", timeOfDay: "morning" },
  { id: "p9", name: "Piazza Navona", address: "Piazza Navona, 00186 Roma", rating: 4.6, openTime: "Always", closeTime: "Open", duration: "45 min", ticketPrice: "Free", description: "Beautiful square with stunning Baroque fountains.", photoUrl: "https://images.unsplash.com/photo-1596377042246-d22b4fc66c7c?w=600&h=400&fit=crop", timeOfDay: "afternoon" },
  { id: "p10", name: "Castel Sant'Angelo", address: "Lungotevere Castello, 50, Roma", rating: 4.5, openTime: "09:00", closeTime: "19:30", duration: "1.5 hours", ticketPrice: "€15", description: "Towering cylindrical building originally built as a mausoleum.", photoUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&h=400&fit=crop", timeOfDay: "afternoon" },
  { id: "p11", name: "St. Peter's Basilica", address: "Piazza San Pietro, Città del Vaticano", rating: 4.8, openTime: "07:00", closeTime: "18:30", duration: "1.5 hours", ticketPrice: "Free", description: "The largest church in the world, Renaissance masterpiece.", photoUrl: "https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?w=600&h=400&fit=crop", timeOfDay: "morning" },
  { id: "p12", name: "Gelato Tasting Experience", address: "Via del Corso, Roma", rating: 4.9, openTime: "10:00", closeTime: "23:00", duration: "1 hour", ticketPrice: "€25", description: "Sample artisanal gelato from Rome's finest gelaterias.", photoUrl: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&h=400&fit=crop", timeOfDay: "afternoon" },
];

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (place: PlaceResult) => void;
}

const AddActivityDialog = ({ open, onOpenChange, onSelect }: AddActivityDialogProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setHighlightIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHighlightIndex(0);
      return;
    }

    setSearching(true);
    // Simulate API delay
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const matched = mockPlaces.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
      setResults(matched);
      setHighlightIndex(0);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      onSelect(results[highlightIndex]);
      onOpenChange(false);
    }
  };

  const handleSelect = (place: PlaceResult) => {
    onSelect(place);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 gap-0 w-[calc(100%-2rem)] mx-auto overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display">Add Activity</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a place, restaurant, attraction..."
              className="pl-10 h-11 rounded-xl focus-visible:ring-primary/20"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {query.trim() && (
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">
              {searching
                ? "Searching..."
                : results.length === 0
                ? "No results found"
                : `${results.length} result${results.length !== 1 ? "s" : ""} found`}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-4 pb-4 max-h-[400px] scrollbar-hide">
          {results.map((place, i) => (
            <motion.button
              key={place.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelect(place)}
              className={`w-full text-left flex gap-3 p-3 rounded-xl transition-all mb-1 group ${
                i === highlightIndex
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted border border-transparent shadow-sm hover:shadow-md"
              }`}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                <img 
                  src={place.photoUrl} 
                  alt={place.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1070&auto=format&fit=crop";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm leading-tight truncate">{place.name}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-gold fill-gold" /> {place.rating}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {place.duration}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Ticket className="w-3 h-3" /> {place.ticketPrice}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 truncate font-medium">
                  <MapPin className="w-3 h-3 shrink-0 text-primary" /> {place.address}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddActivityDialog;
