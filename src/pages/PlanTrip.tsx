import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Users, Globe, Sparkles, ArrowRight, ArrowLeft, Minus, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { countryCityData } from "@/data/destinations";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import GeneratingItinerary from "@/components/GeneratingItinerary";

const TOTAL_STEPS = 6;

const companionOptions = [
  { id: "solo", label: "Solo", emoji: "🧑" },
  { id: "partner", label: "Partner", emoji: "💑" },
  { id: "friends", label: "Friends", emoji: "👯" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: "kids", label: "With Kids", emoji: "👶" },
  { id: "seniors", label: "Seniors", emoji: "👴" },
];

const purposeOptions = [
  { id: "leisure", label: "Leisure", emoji: "🏖️" },
  { id: "honeymoon", label: "Honeymoon", emoji: "💕" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "business-leisure", label: "Business + Leisure", emoji: "💼" },
  { id: "cultural", label: "Cultural", emoji: "🏛️" },
  { id: "food", label: "Food Exploration", emoji: "🍽️" },
  { id: "relaxation", label: "Relaxation", emoji: "🧘" },
];

const experienceOptions = [
  { id: "historical", label: "Historical & Museums", emoji: "🏛️" },
  { id: "food", label: "Food & Local Cuisine", emoji: "🍜" },
  { id: "nature", label: "Nature & Scenic", emoji: "🌿" },
  { id: "adventure", label: "Adventure & Outdoor", emoji: "🧗" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "hidden-gems", label: "Hidden Gems", emoji: "💎" },
  { id: "luxury", label: "Luxury", emoji: "✨" },
  { id: "budget-friendly", label: "Budget-Friendly", emoji: "💰" },
];

const paceOptions = [
  { id: "relaxed", label: "Relaxed", description: "2–3 activities/day", emoji: "🐢" },
  { id: "moderate", label: "Moderate", description: "3–4 activities/day", emoji: "🚶" },
  { id: "packed", label: "Packed", description: "4–6 activities/day", emoji: "🏃" },
];

const budgetOptions = [
  { id: "budget", label: "Budget", emoji: "💵" },
  { id: "mid-range", label: "Mid-range", emoji: "💳" },
  { id: "luxury", label: "Luxury", emoji: "💎" },
];

const PlanTrip = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [startDate, setStartDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [numDays, setNumDays] = useState<number>(7);
  const [companion, setCompanion] = useState("");
  const [purpose, setPurpose] = useState("");
  const [experiences, setExperiences] = useState<string[]>([]);
  const [pace, setPace] = useState("");
  const [budget, setBudget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const availableCities = useMemo(() => {
    if (selectedCountries.length === 0) return [];
    return selectedCountries.flatMap(country => countryCityData[country] || []);
  }, [selectedCountries]);

  useEffect(() => {
    const isCallback =
      window.location.hash.includes("access_token=") ||
      window.location.search.includes("code=");
    if (!loading && !user && !isCallback) navigate("/login");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-hero-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isCallback =
    window.location.hash.includes("access_token=") ||
    window.location.search.includes("code=");
  if (!user && isCallback) return null;
  if (!user) return null;

  const allCountries = Object.keys(countryCityData);
  const filteredCountries = allCountries.filter(
    c =>
      c.toLowerCase().includes(countrySearch.toLowerCase()) &&
      !selectedCountries.includes(c)
  );
  const filteredCities = availableCities.filter(
    c =>
      c.toLowerCase().includes(citySearch.toLowerCase()) &&
      !selectedCities.includes(c)
  );

  const toggleExperience = (id: string) => {
    setExperiences(prev =>
      prev.includes(id)
        ? prev.filter(e => e !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => {
      const next = prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country];
      if (!next.includes(country)) {
        const citiesOfRemoved = countryCityData[country] || [];
        setSelectedCities(prevCities =>
          prevCities.filter(c => !citiesOfRemoved.includes(c))
        );
      }
      return next;
    });
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedCountries.length > 0 || selectedCities.length > 0;
      case 2: return !!startDate && numDays > 0;
      case 3: return companion !== "";
      case 4: return purpose !== "";
      case 5: return experiences.length >= 1;
      case 6: return pace !== "" && budget !== "";
      default: return false;
    }
  };

  const handleFinish = async () => {
    setIsGenerating(true);

    const emergencyReset = setTimeout(() => {
      setIsGenerating(false);
      console.warn("[PlanTrip] Emergency loading reset triggered.");
    }, 120000);

    if (!user?.id) {
      toast({ title: "Authentication Required", description: "You must be logged in to generate a trip.", variant: "destructive" });
      setIsGenerating(false);
      return;
    }

    const destination = selectedCities.length > 0 ? selectedCities : selectedCountries;
    const destinationStr = Array.isArray(destination)
      ? destination.join(", ")
      : destination;

    try {
      console.log("[PlanTrip] Attempting Local Backend generation...");

      const response = await fetch("http://localhost:3000/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destinationStr,
          dates: `${format(startDate, "MMM d")} - ${format(
            new Date(startDate.getTime() + (numDays - 1) * 86400000),
            "MMM d, yyyy"
          )} (${numDays} days)`,
          startDate: startDate.toISOString(),
          companion,
          purpose,
          experiences,
          pace,
          budget,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Backend failed with status ${response.status}`);
      }

      const itineraryData = await response.json();

      if (itineraryData.tripId) {
        console.log("[PlanTrip] Local Backend success!");
        toast({
          title: "✨ Trip Created!",
          description: `Your ${destinationStr} itinerary is ready.`,
          variant: "default",
        });
        navigate(`/trip?id=${itineraryData.tripId}`);
        return;
      }
    } catch (err: any) {
      console.error("[PlanTrip] Generation Error:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate your trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      clearTimeout(emergencyReset);
    }
  };

  return (
    <div className="min-h-[100svh] bg-hero-gradient">
      <Navbar />
      <div className="pt-18 sm:pt-24 pb-24 md:pb-12 px-4 safe-top safe-bottom">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-1.5 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-500",
                  i < step ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-2 font-medium compact-touch">
            Step {step} of {TOTAL_STEPS}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {/* ── STEP 1: Destination ── */}
              {step === 1 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    Where are you traveling?
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    Select countries and cities
                  </p>
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Countries
                    </label>
                    {selectedCountries.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedCountries.map(country => (
                          <span
                            key={country}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium compact-touch"
                          >
                            {country}
                            <button
                              onClick={() => toggleCountry(country)}
                              className="hover:text-destructive transition-colors compact-touch"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        placeholder="Search countries..."
                        className="pl-11 h-12 rounded-xl bg-card border-border shadow-card"
                        autoFocus
                      />
                    </div>
                    {countrySearch && filteredCountries.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border bg-card shadow-card">
                        {filteredCountries.slice(0, 8).map(country => (
                          <button
                            key={country}
                            onClick={() => {
                              toggleCountry(country);
                              setCountrySearch("");
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-foreground"
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedCountries.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Cities
                      </label>
                      {selectedCities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedCities.map(city => (
                            <span
                              key={city}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm font-medium compact-touch"
                            >
                              {city}
                              <button
                                onClick={() => toggleCity(city)}
                                className="hover:text-destructive compact-touch"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={citySearch}
                          onChange={e => setCitySearch(e.target.value)}
                          placeholder="Search cities..."
                          className="pl-11 h-12 rounded-xl bg-card border-border shadow-card"
                        />
                      </div>
                      {filteredCities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {filteredCities.slice(0, 12).map(city => (
                            <button
                              key={city}
                              onClick={() => toggleCity(city)}
                              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 text-sm text-foreground transition-colors compact-touch"
                            >
                              + {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Dates ── */}
              {step === 2 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    When and for how long?
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    Pick your start date and duration
                  </p>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Start Date
                      </label>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-14 justify-start text-left text-lg rounded-xl bg-card shadow-card",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-5 w-5" />
                            {startDate ? format(startDate, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={date => {
                              setStartDate(date || new Date());
                              setCalendarOpen(false);
                            }}
                            disabled={date => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Number of Days
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setNumDays(d => Math.max(1, d - 1))}
                          className="w-12 h-12 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <Input
                          type="number"
                          min={1}
                          max={90}
                          value={numDays}
                          onChange={e => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v) && v >= 1 && v <= 90) setNumDays(v);
                          }}
                          className="w-24 h-12 text-center text-lg font-semibold rounded-xl bg-card border-border shadow-card [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => setNumDays(d => Math.min(90, d + 1))}
                          className="w-12 h-12 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-foreground"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-muted-foreground ml-1">
                          days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Companion ── */}
              {step === 3 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    Who are you traveling with?
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    This helps us tailor activities
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {companionOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setCompanion(opt.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-5 rounded-xl border transition-all text-center",
                          companion === opt.id
                            ? "bg-primary/10 border-primary shadow-md ring-2 ring-primary/20"
                            : "bg-card border-border hover:border-primary/40"
                        )}
                      >
                        <span className="text-3xl">{opt.emoji}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 4: Purpose ── */}
              {step === 4 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    What is the purpose?
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    Choose the main theme
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {purposeOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setPurpose(opt.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-5 rounded-xl border transition-all text-center",
                          purpose === opt.id
                            ? "bg-primary/10 border-primary shadow-md ring-2 ring-primary/20"
                            : "bg-card border-border hover:border-primary/40"
                        )}
                      >
                        <span className="text-3xl">{opt.emoji}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 5: Experiences ── */}
              {step === 5 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    What experiences excite you?
                  </h1>
                  <p className="text-muted-foreground mb-8">Pick up to 5</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {experienceOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleExperience(opt.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                          experiences.includes(opt.id)
                            ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                            : "bg-card border-border hover:border-primary/40"
                        )}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-xs font-semibold text-foreground">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 6: Pace & Budget ── */}
              {step === 6 && (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                    Almost done!
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    Pick your pace and budget
                  </p>
                  <div className="space-y-8">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Travel Pace
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {paceOptions.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setPace(opt.id)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all text-center",
                              pace === opt.id
                                ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                                : "bg-card border-border hover:border-primary/40"
                            )}
                          >
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className="text-xs font-semibold text-foreground">
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground compact-touch">
                              {opt.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Budget
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {budgetOptions.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setBudget(opt.id)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all text-center",
                              budget === opt.id
                                ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                                : "bg-card border-border hover:border-primary/40"
                            )}
                          >
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className="text-xs font-semibold text-foreground">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-10">
            {step > 1 && (
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => setStep(s => s - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button
              size="lg"
              className="flex-1 bg-ocean-gradient text-primary-foreground font-semibold rounded-xl h-12 text-base"
              disabled={!canProceed()}
              onClick={() =>
                step < TOTAL_STEPS ? setStep(s => s + 1) : handleFinish()
              }
            >
              {step < TOTAL_STEPS ? (
                <>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate Trip
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <GeneratingItinerary isOpen={isGenerating} />
    </div>
  );
};

export default PlanTrip;