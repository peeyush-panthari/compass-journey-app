import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Star, Clock, MapPin, Ticket, GripVertical, Plus, Trash2, Share2, Copy, Check, Plane,
  ChevronDown, ChevronRight, MoreHorizontal, StickyNote, MapPinned, Compass, FileText,
  Hotel, Car, UtensilsCrossed, Paperclip, DollarSign, Navigation, ThumbsUp, ThumbsDown,
  Heart, Smile, PanelLeftClose, PanelLeft, Search, X, UserPlus, Calendar, Pencil, List,
  Settings, Users, BarChart3, TrainFront, Bus, Ship, Anchor, Globe
} from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* MOBILE TAB BAR (< md) */}
      <div className="md:hidden">
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
        </div>
      </div>

      {/* DESKTOP LAYOUT (md+) */}
      <div className="hidden md:flex pt-14 sm:pt-16 safe-top" style={{ minHeight: "calc(100vh - 0px)" }}>
        {sidebarOpen && (
          <aside className="w-[220px] shrink-0 border-r border-border bg-card overflow-y-auto sticky top-14 sm:top-16" style={{ height: "calc(100vh - 56px)" }}>
            <div className="p-4">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left mb-1">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Overview</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-0.5">
                    {["Explore", "Notes", "Places to visit"].map((item) => (
                      <button key={item} onClick={() => scrollToSection(item.toLowerCase().replace(/ /g, "-"))} className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors ${activeSection === item.toLowerCase().replace(/ /g, "-") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        {item}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible defaultOpen className="mt-4">
                <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left mb-1">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Itinerary</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-1">
                    {itinerary.map((day, i) => (
                      <button key={i} onClick={() => { scrollToSection(`day-${i}`); setExpandedDays(prev => new Set(prev).add(i)); }} className={`block w-full text-left py-1.5 px-2 rounded-md transition-colors ${activeSection === `day-${i}` ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        <span className="text-xs font-medium">{day.date}</span>
                        <p className="text-[10px] truncate">{day.activities.map(a => a.name).join(" • ")}</p>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <button onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full py-1.5 px-2 rounded-md hover:bg-muted/50 mt-6">
                <PanelLeftClose className="w-3.5 h-3.5" /> Hide sidebar
              </button>
            </div>
          </aside>
        )}

        <main ref={mainRef} className="flex-1 overflow-y-auto pb-16">
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
              <div className="space-y-4">
                {itinerary.map((day, dayIndex) => (
                  <div key={day.dayNumber} id={`section-day-${dayIndex}`} className="scroll-mt-20">
                    <button onClick={() => toggleDay(dayIndex)} className="flex items-center gap-2 w-full text-left py-3 border-b">
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedDays.has(dayIndex) ? "rotate-90" : ""}`} />
                      <h3 className="text-lg font-display font-bold">{day.fullDate}</h3>
                    </button>

                    {expandedDays.has(dayIndex) && (
                      <Droppable droppableId={String(dayIndex)}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="py-3 pl-4 border-l-2 border-primary/30 ml-2 space-y-2">
                            {day.activities.map((activity, actIdx) => (
                              <Draggable key={activity.id} draggableId={activity.id} index={actIdx}>
                                {(prov, snap) => (
                                  <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className={`flex items-start gap-4 p-4 bg-card border rounded-xl hover:shadow-card transition-shadow ${snap.isDragging ? "shadow-elevated ring-2 ring-primary/30" : ""}`}>
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">{actIdx+1}</div>
                                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedActivity(activity)}>
                                      <h4 className="font-bold">{activity.name}</h4>
                                      <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                                    </div>
                                    {activity.photoUrl && <img src={activity.photoUrl} className="w-20 h-20 rounded-lg object-cover" />}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={() => setAddActivityDayIndex(dayIndex)}>
                              <Plus className="w-4 h-4 mr-1" /> Add Activity
                            </Button>
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>
        </main>
      </div>

      <AddActivityDialog open={addActivityDayIndex !== null} onOpenChange={open => !open && setAddActivityDayIndex(null)} onSelect={addActivityFromSearch} />
      <ActivityDetailDialog activity={selectedActivity} open={!!selectedActivity} onOpenChange={open => !open && setSelectedActivity(null)} />
    </div>
  );
};

export default TripPage;
