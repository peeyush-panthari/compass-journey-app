import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Star, Clock, MapPin, Ticket, GripVertical, Plus, Trash2, Share2, Copy, Check, Plane,
  ChevronDown, ChevronRight, MoreHorizontal, StickyNote, MapPinned, Compass, FileText,
  Hotel, Car, UtensilsCrossed, Paperclip, DollarSign, Navigation, ThumbsUp, ThumbsDown,
  Heart, Smile, PanelLeftClose, PanelLeft, Search, X, UserPlus, Calendar, Pencil, List,
  Settings, Users, BarChart3, TrainFront, Bus, Ship, Anchor, Globe, Wallet, Info, Map as MapIcon,
  ReceiptText, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import AddActivityDialog, { type PlaceResult } from "@/components/AddActivityDialog";
import ActivityDetailDialog, { type ActivityDetail } from "@/components/ActivityDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

type Activity = ActivityDetail;
interface Day { 
  id?: string;
  dayNumber: number; 
  date: string; 
  fullDate: string; 
  city: string; 
  country: string; 
  activities: Activity[]; 
}

const CITY_PALETTE = [
  { bg: "bg-primary/8", border: "border-primary/25", text: "text-primary", dot: "bg-primary" },
  { bg: "bg-accent/8", border: "border-accent/25", text: "text-accent-foreground", dot: "bg-accent" },
  { bg: "bg-sea-foam/8", border: "border-sea-foam/25", text: "text-foreground", dot: "bg-sea-foam" },
  { bg: "bg-coral/8", border: "border-coral/25", text: "text-foreground", dot: "bg-coral" },
  { bg: "bg-gold/8", border: "border-gold/25", text: "text-foreground", dot: "bg-gold" },
];

const cityColorMap: Record<string, typeof CITY_PALETTE[0]> = {};
let colorIndex = 0;
const getCityColor = (city: string) => {
  if (!cityColorMap[city]) {
    cityColorMap[city] = CITY_PALETTE[colorIndex % CITY_PALETTE.length];
    colorIndex++;
  }
  return cityColorMap[city];
};

const TIME_LABELS = {
  morning: { label: "Morning", color: "bg-gold-light/20 text-gold-dark", border: "border-gold/20" },
  afternoon: { label: "Afternoon", color: "bg-primary/10 text-primary", border: "border-primary/20" },
  evening: { label: "Evening", color: "bg-coral/10 text-coral", border: "border-coral/20" },
};

const tripPlaces = [
  { name: "Paris", exploreLink: "/explore" },
  { name: "London", exploreLink: "/explore" },
];

const exploreCards = [
  { title: "Best of Local Curation", description: "Local specialties, guides, attractions, and more", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop", source: "GlobeGenie" },
  { title: "Seamless Connections", description: "The best things to see and do along the way", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop", source: "GlobeGenie" },
  { title: "Curated Lodging", description: "Transparent pricing with no sorting bias", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop", source: "GlobeGenie" },
];

const recommendedPlaces = [
  { name: "Van Gogh Museum", image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop" },
  { name: "Anne Frank House", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop" },
  { name: "Rijksmuseum", image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=200&h=200&fit=crop" },
];

interface Reservation {
  id: string;
  type: "Flight" | "Lodging" | "Rental car" | "Restaurant" | "Train" | "Bus" | "Ferry" | "Cruise" | "Other";
  title: string;
  details: string;
  date: string;
  confirmationNumber?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  addedAt: string;
}

interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: string;
  split: string;
  date: string;
}

const CURRENCIES = ["$", "€", "£", "₹", "¥"];
const EXPENSE_CATEGORIES = ["Flight", "Lodging", "Food", "Transport", "Activities", "Shopping", "Other"];

const TripPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Data States
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);

  // UI States (From Original Design)
  const [shareEmail, setShareEmail] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [addActivityDayIndex, setAddActivityDayIndex] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState("");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [activeSection, setActiveSection] = useState("overview");
  const [showHotelBanner, setShowHotelBanner] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [budget, setBudget] = useState<number | null>(null);
  const [setBudgetOpen, setSetBudgetOpen] = useState(false);
  const [expenseSortBy, setExpenseSortBy] = useState<"newest" | "oldest">("newest");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [reservationDialogOpen, setReservationDialogOpen] = useState<Reservation["type"] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [otherPopoverOpen, setOtherPopoverOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"overview" | "itinerary" | "explore" | "budget" | "journal">("overview");
  const [mobileSelectedDay, setMobileSelectedDay] = useState(0);
  const isMobile = useIsMobile();

  // Group Itinerary by City
  const cityGroups = useMemo(() => {
    if (!itinerary.length) return [];
    const groups: any[] = [];
    let currentGroup: any = null;

    itinerary.forEach((day) => {
      if (!currentGroup || currentGroup.city !== day.city) {
        currentGroup = {
          city: day.city,
          country: day.country,
          days: [],
          totalDays: 0
        };
        groups.push(currentGroup);
      }
      currentGroup.days.push(day);
      currentGroup.totalDays++;
    });

    return groups;
  }, [itinerary]);

  // Fetch Live Data
  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data: tripData, error: tripErr } = await supabase.from("trips").select("*").eq("id", id).single();
        if (tripErr) throw tripErr;
        setTrip(tripData);

        const { data: daysData, error: daysErr } = await supabase.from("itinerary_days").select("*, activities(*)").eq("trip_id", id).order("day_number", { ascending: true });
        if (daysErr) throw daysErr;

        const transformedDays = daysData.map((day: any) => ({
          id: day.id,
          dayNumber: day.day_number,
          date: day.date ? format(new Date(day.date), "EEE MM/dd") : `Day ${day.day_number}`,
          fullDate: day.date ? format(new Date(day.date), "EEEE, MMMM do") : `Day ${day.day_number}`,
          city: day.city || "City",
          country: day.country || "Country",
          activities: (day.activities || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((act: any) => ({
              ...act,
              timeOfDay: act.time_of_day || "morning",
              photoUrl: act.photo_url || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1070&auto=format&fit=crop",
              youtubeVideos: act.youtube_videos || []
            }))
        }));

        setItinerary(transformedDays);

        // --- STEP: Trigger Background Enrichment (Mainstream Logic) ---
        const needsEnrichment = transformedDays.some(day => 
          day.activities.some((act: any) => !act.youtubeVideos || act.youtubeVideos.length === 0)
        );
        if (needsEnrichment) {
          console.log("[TripPage] 🚀 Starting Background Immersive Media Worker...");
          supabase.functions.invoke("enrich-trip", { body: { tripId: id } });
        }
      } catch (err: any) {
        console.error("Failed to fetch trip", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrip();
  }, [id, user]);

  const toggleDay = (idx: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const deleteActivity = (dayIndex: number, activityId: string) => {
    setItinerary(prev => prev.map((day, i) => i === dayIndex ? { ...day, activities: day.activities.filter(a => a.id !== activityId) } : day));
    toast({ title: "Activity removed" });
  };

  const addActivityFromSearch = (place: PlaceResult) => {
    if (addActivityDayIndex === null) return;
    const a: Activity = { 
      id: String(Date.now()), 
      name: place.name, 
      address: place.address, 
      rating: place.rating, 
      openTime: place.openTime, 
      closeTime: place.closeTime, 
      duration: place.duration, 
      ticketPrice: place.ticketPrice, 
      description: place.description, 
      photoUrl: place.photoUrl, 
      timeOfDay: place.timeOfDay || "morning",
      sortOrder: 0
    };
    setItinerary(prev => prev.map((day, i) => i === addActivityDayIndex ? { ...day, activities: [...day.activities, a] } : day));
    toast({ title: "Activity added", description: place.name });
  };

  const addDay = () => {
    const n = itinerary.length + 1;
    const last = itinerary[itinerary.length - 1];
    setItinerary(prev => [...prev, { dayNumber: n, date: `Day ${n}`, fullDate: `Day ${n}`, city: last?.city || "New City", country: last?.country || "Country", activities: [] }]);
    toast({ title: `Day ${n} added` });
  };

  const handleShare = () => {
    if (shareEmail.trim()) { toast({ title: "Shared!", description: `Sent to ${shareEmail}` }); setShareEmail(""); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const srcDay = parseInt(result.source.droppableId);
    const dstDay = parseInt(result.destination.droppableId);
    setItinerary(prev => {
      const next = prev.map(d => ({ ...d, activities: [...d.activities] }));
      const [moved] = next[srcDay].activities.splice(result.source.index, 1);
      if (!moved) return prev;
      next[dstDay].activities.splice(result.destination!.index, 0, moved);
      return next;
    });
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const el = document.getElementById(`section-${section}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse font-display">Opening your travel journal...</p>
      </div>
    );
  }

  const cities = [...new Set(itinerary.map(d => d.city))];
  const tripTitle = cities.join(" and ") || "Your Adventure";
  const dateRange = itinerary.length > 0 ? `${itinerary[0].date} - ${itinerary[itinerary.length-1].date}` : "Curation in progress";

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      
      {/* MOBILE TAB BAR (< md) */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="relative h-48 overflow-hidden bg-muted pt-14">
          {itinerary[0]?.activities[0]?.photoUrl ? (
            <img src={itinerary[0].activities[0].photoUrl} alt="Trip" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center opacity-20"><Globe className="w-20 h-20" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="px-4 -mt-20 relative z-10">
          <div className="bg-card rounded-xl border border-border shadow-card p-4 mb-0">
            <h1 className="text-xl font-display font-bold text-foreground">Trip to {tripTitle}</h1>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{dateRange}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="default" className="rounded-full text-xs h-8 px-4 font-semibold" onClick={copyLink}>Share</Button>
                <button className="text-muted-foreground"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-14 z-30 bg-background border-b border-border">
          <div className="flex overflow-x-auto scrollbar-hide px-4">
            {([
              { key: "overview" as const, label: "Overview" },
              { key: "itinerary" as const, label: "Itinerary" },
              { key: "explore" as const, label: "Explore" },
              { key: "budget" as const, label: "$" },
              { key: "journal" as const, label: "Journal" },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  mobileTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-24 pt-4">
          {mobileTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">Reservations and attachments</h3>
                <div className="flex items-center gap-6">
                  {([
                    { icon: Plane, label: "Flight" },
                    { icon: Hotel, label: "Lodging" },
                    { icon: Car, label: "Rental car" },
                    { icon: Paperclip, label: "Attachment" },
                  ] as const).map(({ icon: Icon, label }) => (
                    <button key={label} onClick={() => label === "Attachment" ? fileInputRef.current?.click() : setReservationDialogOpen(label as any)} className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors relative">
                      <Icon className="w-6 h-6" />
                      <span className="text-[10px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 mb-2">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-xl font-display font-bold text-foreground">Notes</h2>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Textarea placeholder="General notes, tips, reminders" value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[80px] rounded-xl border-border/60 resize-none text-sm" />
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {mobileTab === "itinerary" && (
            <div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
                {itinerary.map((day, i) => (
                  <button key={i} onClick={() => setMobileSelectedDay(i)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${mobileSelectedDay === i ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                    {day.date}
                  </button>
                ))}
              </div>
              {itinerary[mobileSelectedDay] && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-4">{itinerary[mobileSelectedDay].date}</h2>
                  <div className="space-y-1">
                    {itinerary[mobileSelectedDay].activities.map((activity, actIdx) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-card border border-border/60 rounded-xl mb-1" onClick={() => setSelectedActivity(activity)}>
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 mt-0.5">{actIdx+1}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-sm">{activity.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.description}</p>
                        </div>
                        {activity.photoUrl && <img src={activity.photoUrl} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed text-muted-foreground mt-4" onClick={() => setAddActivityDayIndex(mobileSelectedDay)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Activity
                  </Button>
                </div>
              )}
            </div>
          )}
          {mobileTab === "budget" && (
            <div className="space-y-6">
              <div className="bg-primary/5 rounded-2xl p-6 flex flex-col items-center text-center">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Total Budget Spending</p>
                <h4 className="text-3xl font-display font-bold text-foreground">$0.00 <span className="text-sm text-muted-foreground font-normal">/ ${budget || 0}</span></h4>
                <Button onClick={() => setSetBudgetOpen(true)} variant="outline" size="sm" className="mt-4 rounded-xl border-primary/20">Set Budget</Button>
              </div>
              <div className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h4 className="font-display font-bold mb-1">No expenses yet</h4>
                <p className="text-muted-foreground text-xs max-w-[200px] mb-6">Track your travel costs and split bills with friends.</p>
                <Button size="sm" className="rounded-xl px-6"><Plus className="w-4 h-4 mr-1" /> Add Expense</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP LAYOUT (md+) */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-[240px] shrink-0 border-r border-border bg-card overflow-y-auto h-full">
            <div className="p-4">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="group flex items-center gap-1.5 w-full text-left mb-1 px-2 py-2 rounded-lg data-[state=open]:bg-[#1D212B] data-[state=open]:text-white transition-colors">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-data-[state=open]:text-white/70" />
                  <span className="text-sm font-bold text-foreground group-data-[state=open]:text-white">Overview</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-0.5 mt-2">
                    {["Explore", "Notes", "Flights", "Places to visit", "Untitled"].map((item) => (
                      <button key={item} onClick={() => scrollToSection(item.toLowerCase().replace(/ /g, "-"))} className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors ${activeSection === item.toLowerCase().replace(/ /g, "-") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        {item}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen className="mt-2">
                <CollapsibleTrigger className="group flex items-center gap-1.5 w-full text-left mb-1 px-2 py-2 rounded-lg data-[state=open]:bg-[#1D212B] data-[state=open]:text-white transition-colors">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-data-[state=open]:text-white/70" />
                  <span className="text-sm font-bold text-foreground group-data-[state=open]:text-white">Itinerary</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-1 mt-2">
                    {itinerary.map((day, i) => (
                      <button key={i} onClick={() => { scrollToSection(`day-${i}`); setExpandedDays(prev => new Set(prev).add(i)); }} className={`block w-full text-left py-1.5 px-2 rounded-md transition-colors ${activeSection === `day-${i}` ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        <span className="text-xs font-medium">{day.date}</span>
                        <p className="text-[10px] truncate">{day.activities.map(a => a.name).join(" • ")}</p>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen className="mt-2">
                <CollapsibleTrigger className="group flex items-center gap-1.5 w-full text-left mb-1 px-2 py-2 rounded-lg data-[state=open]:bg-[#1D212B] data-[state=open]:text-white transition-colors">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-data-[state=open]:text-white/70" />
                  <span className="text-sm font-bold text-foreground group-data-[state=open]:text-white">Budget</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-0.5 mt-2">
                    <button onClick={() => scrollToSection("budget")} className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors ${activeSection === "budget" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                      View
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <button onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full py-1.5 px-2 rounded-md hover:bg-muted/50 mt-6">
                <PanelLeftClose className="w-3.5 h-3.5" /> Hide sidebar
              </button>
            </div>
          </aside>
        )}

        <main ref={mainRef} className="flex-1 overflow-y-auto pb-24 h-full scroll-smooth pt-14 sm:pt-16">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="fixed left-2 top-20 z-40 flex items-center gap-1 text-xs bg-card border border-border rounded-lg px-2 py-1.5 text-muted-foreground hover:text-foreground shadow-sm">
              <PanelLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="relative h-56 overflow-hidden bg-muted">
            {itinerary[0]?.activities[0]?.photoUrl && <img src={itinerary[0].activities[0].photoUrl} className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
            <div className="bg-card rounded-xl border border-border shadow-card p-5 sm:p-6 mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground">Trip to {tripTitle}</h1>
              <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" /> <span>{dateRange}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="default" className="rounded-xl shadow-sm" onClick={copyLink}><Share2 className="w-4 h-4 mr-1" /> Share</Button>
                </div>
              </div>
            </div>

            {/* Sections mapped from your design... */}
            <section id="section-explore" className="mb-8 scroll-mt-20">
               <h2 className="text-xl font-display font-bold mb-4">Explore</h2>
               <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {exploreCards.map((card, i) => (
                    <div key={i} className="min-w-[220px] bg-card rounded-xl border p-3">
                      <img src={card.image} className="h-32 w-full object-cover rounded-lg mb-2" />
                      <h4 className="text-sm font-bold truncate">{card.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                    </div>
                  ))}
               </div>
            </section>

            <section id="section-notes" className="mb-8 scroll-mt-20">
               <h2 className="text-xl font-display font-bold mb-3">Notes</h2>
               <Textarea placeholder="Share details or tips..." value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[80px] rounded-xl" />
            </section>



            <div className="border-t border-border my-8" />

            <DragDropContext onDragEnd={onDragEnd}>
               <div className="space-y-2">
                 {cityGroups.map((group, groupIdx) => {
                   const cityColor = getCityColor(group.city);
                   return (
                     <div key={groupIdx}>
                       {/* City Header Card */}
                       <div className={cn("rounded-2xl border p-6 mb-6 mt-10 transition-all", cityColor.bg, cityColor.border)}>
                         <div className="flex items-center gap-3">
                           <div className={cn("w-3 h-3 rounded-full shrink-0", cityColor.dot)} />
                           <div>
                             <h2 className="text-2xl font-display font-bold text-foreground">{group.city}, {group.country}</h2>
                             <p className="text-xs text-muted-foreground">{group.totalDays} {group.totalDays === 1 ? 'Day' : 'Days'}</p>
                           </div>
                         </div>
                       </div>

                       <div className={cn("ml-4 border-l-2 pl-8 space-y-12", cityColor.border)}>
                         {group.days.map((day : any) => {
                           const dayIdx = itinerary.findIndex(d => d.id === day.id);
                           return (
                             <div key={day.id} id={`section-day-${dayIdx}`} className="scroll-mt-24 relative pb-2 last:pb-0">
                               {/* Day Dot */}
                               <div className={cn("absolute top-2 -left-[41px] w-4 h-4 rounded-full bg-background border-2 z-10", cityColor.border)} />
                               
                               {/* Sticky Day Header */}
                               <div className="flex items-center justify-between mb-8 sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border/50 rounded-b-xl">
                                 <h3 className="text-xl font-display font-bold text-foreground">
                                   Day {day.dayNumber} <span className="text-muted-foreground font-normal text-sm ml-2">— {day.date}</span>
                                 </h3>
                                 <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium">
                                   <Trash2 className="w-3.5 h-3.5" /> Remove
                                 </button>
                               </div>

                               <Droppable droppableId={String(dayIdx)}>
                                 {(provided, snapshot) => (
                                   <div 
                                     ref={provided.innerRef} 
                                     {...provided.droppableProps} 
                                     className={cn(
                                       "space-y-8 rounded-2xl transition-colors p-2 -m-2",
                                       snapshot.isDraggingOver ? "bg-muted/30" : ""
                                     )}
                                   >
                                     {["morning", "afternoon", "evening"].map((time) => {
                                       const timeActivities = day.activities.filter((a: any) => a.timeOfDay === time);
                                       const label = TIME_LABELS[time as keyof typeof TIME_LABELS];

                                       return (
                                         <div key={time} className="space-y-4">
                                           <div className="flex items-center gap-3">
                                             <span className={cn(
                                               "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                               label.color,
                                               label.border
                                             )}>
                                               {label.label}
                                             </span>
                                             {timeActivities.length === 0 && (
                                               <span className="text-[10px] text-muted-foreground italic opacity-60">Drop activities here</span>
                                             )}
                                           </div>
                                           
                                           <div className="space-y-4">
                                             {timeActivities.map((activity: any, actInTimeIdx: number) => {
                                               const actIdx = day.activities.findIndex((a: any) => a.id === activity.id);
                                               return (
                                                 <div key={activity.id}>
                                                   <Draggable draggableId={activity.id} index={actIdx}>
                                                     {(prov, snap) => (
                                                       <div 
                                                         ref={prov.innerRef} 
                                                         {...prov.draggableProps} 
                                                         className={cn(
                                                           "group relative flex items-center gap-4 p-3 bg-card border border-border/60 rounded-2xl transition-all",
                                                           snap.isDragging ? "shadow-elevated ring-2 ring-primary/20 z-50 scale-[1.02]" : "shadow-card hover:shadow-md"
                                                         )}
                                                       >
                                                         {/* Drag handle */}
                                                         <div {...prov.dragHandleProps} className="shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-100 transition-opacity p-1">
                                                           <GripVertical className="w-4 h-4" />
                                                         </div>

                                                         {/* Photo */}
                                                         <div className="w-16 h-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/10">
                                                           <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" />
                                                         </div>

                                                         {/* Content */}
                                                         <div className="flex-1 min-w-0 cursor-pointer py-1" onClick={() => setSelectedActivity(activity)}>
                                                           <h4 className="font-bold text-foreground text-sm mb-1 truncate group-hover:text-primary transition-colors">{activity.name}</h4>
                                                           <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                                                             <div className="flex items-center gap-1">
                                                               <Star className="w-3 h-3 text-gold fill-gold" />
                                                               <span>{activity.rating || "4.8"}</span>
                                                             </div>
                                                             <div className="flex items-center gap-1">
                                                               <Clock className="w-3 h-3" />
                                                               <span>{activity.duration || "2h"}</span>
                                                             </div>
                                                             <div className="flex items-center gap-1">
                                                               <Ticket className="w-3 h-3" />
                                                               <span>{activity.ticketPrice || "Free"}</span>
                                                             </div>
                                                             <MapPin className="w-3 h-3 opacity-60 hidden sm:block" />
                                                           </div>
                                                         </div>

                                                         {/* Actions */}
                                                         <button className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-2 transition-all hover:bg-destructive/10 hover:text-destructive rounded-lg" onClick={(e) => { e.stopPropagation(); deleteActivity(dayIdx, activity.id); }}>
                                                           <Trash2 className="w-4 h-4" />
                                                         </button>
                                                       </div>
                                                     )}
                                                   </Draggable>

                                                   {/* Transport Divider */}
                                                   {actInTimeIdx < timeActivities.length - 1 && (
                                                     <div className="flex items-center gap-3 px-10 py-3">
                                                       <div className="flex items-center gap-2 text-muted-foreground/60 transition-colors hover:text-muted-foreground">
                                                         <Car className="w-4 h-4" />
                                                         <span className="text-[11px] font-medium">8 min · 2.3 mi</span>
                                                       </div>
                                                       <div className="h-px flex-1 bg-border/40" />
                                                       <button className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground/40 hover:text-primary transition-colors ml-1">
                                                         <Navigation className="w-3.5 h-3.5" />
                                                         Directions
                                                       </button>
                                                     </div>
                                                   )}
                                                 </div>
                                               );
                                             })}
                                           </div>
                                         </div>
                                       );
                                     })}
                                     {provided.placeholder}
                                     
                                     {/* Add Activity Button */}
                                     <button
                                       onClick={() => setAddActivityDayIndex(dayIdx)}
                                       className="w-full py-4 border-2 border-dashed border-border/40 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all group"
                                     >
                                       <Plus className="w-4 h-4 group-hover:scale-120 transition-transform" strokeWidth={3} /> Add Activity
                                     </button>
                                   </div>
                                 )}
                               </Droppable>
                             </div>
                           );
                         })}
                       </div>

                       {/* Inter-city Travel Divider */}
                       {groupIdx < cityGroups.length - 1 && (
                         <div className="flex items-center gap-4 py-8 justify-center max-w-lg mx-auto">
                           <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-border" />
                           <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border bg-muted/30 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-muted/50">
                              <Plane className="w-3.5 h-3.5 rotate-45 text-primary" /> 
                              <span>Travel to {cityGroups[groupIdx+1].city}</span>
                           </div>
                           <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/60 to-border" />
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
            </DragDropContext>

            <div className="border-t border-border my-12" />

            <section id="section-budget" className="mb-20 scroll-mt-20">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-4xl font-display font-bold text-foreground">Budgeting</h2>
                 <Button className="rounded-full bg-[#ff5a3f] hover:bg-[#ff5a3f]/90 text-white font-bold px-6 h-11 border-none">
                    <Plus className="w-4 h-4 mr-1.5" strokeWidth={3} /> Add expense
                 </Button>
               </div>

               <div className="bg-[#f3f4f6]/60 rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-8 mb-10">
                 <div className="flex-1">
                   <h4 className="text-5xl font-display font-bold text-foreground mb-8">₹0.00</h4>
                   <div className="flex flex-wrap gap-3">
                     <Button onClick={() => setSetBudgetOpen(true)} variant="secondary" className="rounded-2xl bg-[#e5e7eb] hover:bg-[#d1d5db] text-foreground font-bold px-5 h-12 flex gap-2">
                        <Pencil className="w-4 h-4" /> Set budget
                     </Button>
                     <Button variant="secondary" className="rounded-2xl bg-[#e5e7eb] hover:bg-[#d1d5db] text-foreground font-bold px-5 h-12 flex gap-2">
                        <ReceiptText className="w-4 h-4" /> Group balances
                     </Button>
                   </div>
                 </div>

                 <div className="flex flex-col gap-5 pr-4 justify-center">
                   <button className="flex items-center gap-3 text-[#4b5563] hover:text-foreground font-bold text-sm transition-colors group">
                     <BarChart3 className="w-5 h-5 opacity-70 group-hover:opacity-100" /> View breakdown
                   </button>
                   <button className="flex items-center gap-3 text-[#4b5563] hover:text-foreground font-bold text-sm transition-colors group">
                     <UserPlus className="w-5 h-5 opacity-70 group-hover:opacity-100" /> Add tripmate
                   </button>
                   <button className="flex items-center gap-3 text-[#4b5563] hover:text-foreground font-bold text-sm transition-colors group">
                     <Settings className="w-5 h-5 opacity-70 group-hover:opacity-100" /> Settings
                   </button>
                 </div>
               </div>

               <Collapsible defaultOpen>
                 <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                   <CollapsibleTrigger className="flex items-center gap-2 group">
                     <ChevronDown className="w-5 h-5 text-foreground transition-transform duration-200 group-data-[state=closed]:-rotate-90" strokeWidth={2.5} />
                     <h3 className="text-2xl font-bold text-foreground">Expenses</h3>
                   </CollapsibleTrigger>
                   <div className="flex items-center gap-1 text-sm font-bold text-[#111827]">
                     <span>Sort:</span>
                     <button className="flex items-center gap-1 hover:underline decoration-2">
                       Date (newest first) <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                     </button>
                   </div>
                 </div>
                 <CollapsibleContent>
                   <p className="text-[#4b5563] text-base mt-2">You haven't added any expenses yet.</p>
                 </CollapsibleContent>
               </Collapsible>
            </section>
          </div>
        </main>
      </div>

      <AddActivityDialog open={addActivityDayIndex !== null} onOpenChange={open => !open && setAddActivityDayIndex(null)} onSelect={addActivityFromSearch} />
      <ActivityDetailDialog activity={selectedActivity} open={!!selectedActivity} onOpenChange={open => !open && setSelectedActivity(null)} />

      {/* Set Budget Dialog */}
      <Dialog open={setBudgetOpen} onOpenChange={setSetBudgetOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader><DialogTitle className="text-2xl font-display font-bold text-center">Set Budget</DialogTitle></DialogHeader>
          <form className="space-y-6 mt-4" onSubmit={(e) => { e.preventDefault(); toast({ title: "Budget updated" }); setSetBudgetOpen(false); }}>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="number" step="0.01" defaultValue={budget || 0} placeholder="0.00" className="pl-12 h-14 rounded-2xl bg-muted border-none text-xl font-semibold" />
            </div>
            <Button type="submit" className="w-full rounded-2xl h-14 font-bold text-base">Save Budget</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripPage;
