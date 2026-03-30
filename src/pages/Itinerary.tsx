import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Star, Clock, MapPin, Ticket, GripVertical, Plus, Trash2, Share2, Copy, Check, Plane,
  ChevronDown, ChevronRight, MoreHorizontal, StickyNote, MapPinned, Compass, FileText,
  Hotel, Car, UtensilsCrossed, Paperclip, DollarSign, Navigation, ThumbsUp, ThumbsDown,
  Heart, Smile, PanelLeftClose, PanelLeft, Search, X, UserPlus, Calendar, Pencil, List,
  Settings, Users, BarChart3, TrainFront, Bus, Ship, Anchor
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

type Activity = ActivityDetail;
interface Day { dayNumber: number; date: string; fullDate: string; city: string; country: string; activities: Activity[]; }

const initialItinerary: Day[] = [
  { dayNumber: 1, date: "Tue 4/14", fullDate: "Tuesday, April 14th", city: "Paris", country: "France", activities: [
    { id: "1", name: "Eiffel Tower", address: "Champ de Mars, Paris", rating: 4.7, openTime: "09:30", closeTime: "23:00", duration: "2h", ticketPrice: "€26", description: "The iconic iron lattice tower on the Champ de Mars.", photoUrl: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600&h=400&fit=crop", timeOfDay: "morning", bestTimeToVisit: "Early morning", travelTimeFromPrevious: "—", googleMapsUrl: "https://maps.google.com/?q=Eiffel+Tower+Paris", photos: ["https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=300&h=300&fit=crop"] },
    { id: "2", name: "Champ de Mars", address: "Champ de Mars, Paris", rating: 4.5, openTime: "Always", closeTime: "Open", duration: "45m", ticketPrice: "Free", description: "Large public green space near the Eiffel Tower.", photoUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", timeOfDay: "morning", travelTimeFromPrevious: "2 min walk" },
    { id: "3", name: "Arc de Triomphe", address: "Place Charles de Gaulle, Paris", rating: 4.7, openTime: "10:00", closeTime: "22:30", duration: "1h", ticketPrice: "€13", description: "Iconic triumphal arch at the western end of the Champs-Élysées.", photoUrl: "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "15 min walk" },
    { id: "4", name: "Musée d'Orsay", address: "1 Rue de la Légion d'Honneur, Paris", rating: 4.8, openTime: "09:30", closeTime: "18:00", duration: "2h", ticketPrice: "€16", description: "Impressionist and post-impressionist masterpieces in a former railway station.", photoUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "20 min walk" },
    { id: "5", name: "Panthéon", address: "Place du Panthéon, Paris", rating: 4.6, openTime: "10:00", closeTime: "18:00", duration: "1h", ticketPrice: "€11", description: "Neoclassical monument housing the remains of distinguished French citizens.", photoUrl: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&h=400&fit=crop", timeOfDay: "evening", travelTimeFromPrevious: "10 min walk" },
  ]},
  { dayNumber: 2, date: "Wed 4/15", fullDate: "Wednesday, April 15th", city: "Paris", country: "France", activities: [
    { id: "6", name: "Louvre Museum", address: "Rue de Rivoli, Paris", rating: 4.8, openTime: "09:00", closeTime: "18:00", duration: "3h", ticketPrice: "€17", description: "The world's largest art museum and a historic monument.", photoUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop", timeOfDay: "morning", travelTimeFromPrevious: "—" },
    { id: "7", name: "Tuileries Garden", address: "Place de la Concorde, Paris", rating: 4.5, openTime: "07:00", closeTime: "21:00", duration: "1h", ticketPrice: "Free", description: "Beautiful formal garden between the Louvre and Place de la Concorde.", photoUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "5 min walk" },
    { id: "8", name: "Sainte-Chapelle", address: "10 Bd du Palais, Paris", rating: 4.8, openTime: "09:00", closeTime: "17:00", duration: "45m", ticketPrice: "€11", description: "Gothic chapel famous for its stunning stained glass windows.", photoUrl: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "15 min walk" },
  ]},
  { dayNumber: 3, date: "Thu 4/16", fullDate: "Thursday, April 16th", city: "Paris", country: "France", activities: [
    { id: "9", name: "Basilique du Sacré-Cœur de Montmartre", address: "35 Rue du Chevalier de la Barre, Paris", rating: 4.7, openTime: "06:00", closeTime: "22:30", duration: "1.5h", ticketPrice: "Free", description: "White-domed basilica atop Montmartre with panoramic views.", photoUrl: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&h=400&fit=crop", timeOfDay: "morning", travelTimeFromPrevious: "—" },
    { id: "10", name: "Parc des Buttes-Chaumont", address: "1 Rue Botzaris, Paris", rating: 4.5, openTime: "07:00", closeTime: "21:00", duration: "1.5h", ticketPrice: "Free", description: "One of the largest parks in Paris with lakes, waterfalls, and a temple.", photoUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "20 min metro" },
    { id: "11", name: "The Centre Pompidou", address: "Place Georges-Pompidou, Paris", rating: 4.5, openTime: "11:00", closeTime: "21:00", duration: "2h", ticketPrice: "€15", description: "Modern art museum with iconic inside-out architecture.", photoUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "25 min metro" },
  ]},
  { dayNumber: 4, date: "Fri 4/17", fullDate: "Friday, April 17th", city: "Paris", country: "France", activities: [
    { id: "12", name: "Jardin du Luxembourg", address: "Rue de Médicis, Paris", rating: 4.7, openTime: "07:30", closeTime: "21:00", duration: "1.5h", ticketPrice: "Free", description: "Elegant 17th-century royal garden on the Left Bank.", photoUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", timeOfDay: "morning", travelTimeFromPrevious: "—" },
    { id: "13", name: "Petit Palais", address: "Av. Winston Churchill, Paris", rating: 4.6, openTime: "10:00", closeTime: "18:00", duration: "1.5h", ticketPrice: "Free", description: "Fine arts museum with an impressive Beaux-Arts facade.", photoUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop", timeOfDay: "morning", travelTimeFromPrevious: "15 min walk" },
    { id: "14", name: "Musée de l'Orangerie", address: "Jardin des Tuileries, Paris", rating: 4.7, openTime: "09:00", closeTime: "18:00", duration: "1h", ticketPrice: "€12.50", description: "Home to Monet's Water Lilies murals.", photoUrl: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "10 min walk" },
    { id: "15", name: "Notre-Dame Cathedral", address: "6 Parvis Notre-Dame, Paris", rating: 4.8, openTime: "08:00", closeTime: "18:45", duration: "1h", ticketPrice: "Free", description: "Medieval Catholic cathedral, a masterpiece of French Gothic architecture.", photoUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "20 min walk" },
  ]},
  { dayNumber: 5, date: "Sat 4/18", fullDate: "Saturday, April 18th", city: "London", country: "UK", activities: [
    { id: "16", name: "London Eye", address: "Riverside Building, London", rating: 4.5, openTime: "10:00", closeTime: "20:00", duration: "1h", ticketPrice: "£30", description: "Giant Ferris wheel on the South Bank of the Thames.", photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop", timeOfDay: "morning", travelTimeFromPrevious: "—" },
    { id: "17", name: "Big Ben", address: "Westminster, London", rating: 4.7, openTime: "Always", closeTime: "Open", duration: "30m", ticketPrice: "Free", description: "Iconic clock tower at the Palace of Westminster.", photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop", timeOfDay: "morning", travelTimeFromPrevious: "5 min walk" },
    { id: "18", name: "Buckingham Palace", address: "London SW1A 1AA", rating: 4.6, openTime: "09:30", closeTime: "17:30", duration: "2h", ticketPrice: "£30", description: "The London residence and administrative headquarters of the monarch.", photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "15 min walk" },
    { id: "19", name: "Trafalgar Square", address: "Trafalgar Square, London", rating: 4.5, openTime: "Always", closeTime: "Open", duration: "30m", ticketPrice: "Free", description: "Central London square with Nelson's Column and the National Gallery.", photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop", timeOfDay: "afternoon", travelTimeFromPrevious: "10 min walk" },
    { id: "20", name: "Tate Modern", address: "Bankside, London", rating: 4.6, openTime: "10:00", closeTime: "18:00", duration: "2h", ticketPrice: "Free", description: "Modern and contemporary art gallery in a former power station.", photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop", timeOfDay: "evening", travelTimeFromPrevious: "15 min walk" },
    { id: "21", name: "Borough Market", address: "8 Southwark St, London", rating: 4.7, openTime: "10:00", closeTime: "17:00", duration: "1.5h", ticketPrice: "Free", description: "One of London's oldest and most renowned food markets.", photoUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop", timeOfDay: "evening", travelTimeFromPrevious: "5 min walk" },
  ]},
];

const tripPlaces = [
  { name: "Paris", exploreLink: "/explore" },
  { name: "London", exploreLink: "/explore" },
];

const exploreCards = [
  { title: "Best of Paris", description: "Local specialties, guides, attractions, and more", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop", source: "GlobeGenie" },
  { title: "From Paris to London", description: "The best things to see and do along the way", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop", source: "GlobeGenie" },
  { title: "Search hotels with transparent pricing", description: "Unlike most sites, we don't sort based on commissions", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop", source: "GlobeGenie" },
];

const recommendedPlaces = [
  { name: "Van Gogh Museum", image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop" },
  { name: "Anne Frank House", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop" },
  { name: "Rijksmuseum", image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=200&h=200&fit=crop" },
];

let nextId = 100;

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

let expenseNextId = 1;

const CURRENCIES = ["$", "€", "£", "₹", "¥"];
const EXPENSE_CATEGORIES = ["Flight", "Lodging", "Food", "Transport", "Activities", "Shopping", "Other"];

const Itinerary = () => {
  const [itinerary, setItinerary] = useState<Day[]>(initialItinerary);
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
  const { toast } = useToast();
  const mainRef = useRef<HTMLDivElement>(null);
  const [otherPopoverOpen, setOtherPopoverOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"overview" | "itinerary" | "explore" | "budget" | "journal">("overview");
  const [mobileSelectedDay, setMobileSelectedDay] = useState(0);
  const isMobile = useIsMobile();
  let reservationNextId = reservations.length + 1;

  const cities = [...new Set(itinerary.map(d => d.city))];
  const tripTitle = `Trip to ${cities.join(" and ")}`;
  const dateRange = `4/14 - 4/20`;

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
    const a: Activity = { id: String(nextId++), name: place.name, address: place.address, rating: place.rating, openTime: place.openTime, closeTime: place.closeTime, duration: place.duration, ticketPrice: place.ticketPrice, description: place.description, photoUrl: place.photoUrl, timeOfDay: place.timeOfDay };
    setItinerary(prev => prev.map((day, i) => i === addActivityDayIndex ? { ...day, activities: [...day.activities, a] } : day));
    toast({ title: "Activity added", description: place.name });
  };

  const addDay = () => {
    const n = itinerary.length + 1;
    const last = itinerary[itinerary.length - 1];
    setItinerary(prev => [...prev, { dayNumber: n, date: `Day ${n}`, fullDate: `Day ${n}`, city: last?.city || "New City", country: last?.country || "Country", activities: [] }]);
    toast({ title: `Day ${n} added` });
  };

  const deleteDay = (dayIndex: number) => {
    if (itinerary.length <= 1) { toast({ title: "Cannot delete", variant: "destructive" }); return; }
    setItinerary(prev => prev.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, dayNumber: i + 1 })));
    toast({ title: "Day removed" });
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-14 sm:pt-16 safe-top" style={{ minHeight: "calc(100vh - 0px)" }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[220px] shrink-0 border-r border-border bg-card overflow-y-auto sticky top-14 sm:top-16 hidden md:block" style={{ height: "calc(100vh - 56px)" }}>
            <div className="p-4">
              {/* Overview */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left mb-1">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Overview</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-0.5">
                    {["Explore", "Notes", "Places to visit", "Untitled"].map((item) => (
                      <button key={item} onClick={() => scrollToSection(item.toLowerCase().replace(/ /g, "-"))} className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors ${activeSection === item.toLowerCase().replace(/ /g, "-") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                        {item}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Itinerary nav */}
              <Collapsible defaultOpen className="mt-4">
                <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left mb-1">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Itinerary</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-1">
                    {itinerary.map((day, i) => (
                      <button key={i} onClick={() => { scrollToSection(`day-${i}`); setExpandedDays(prev => new Set(prev).add(i)); }} className="block w-full text-left py-1.5 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <span className="text-xs font-medium text-foreground">{day.date}</span>
                        <p className="text-[10px] text-muted-foreground truncate">{day.activities.map(a => a.name).join(" • ").slice(0, 30)}…</p>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Budget nav */}
              <Collapsible defaultOpen className="mt-4">
                <CollapsibleTrigger className="flex items-center gap-1.5 w-full text-left mb-1">
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Budget</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-0.5">
                    <button onClick={() => scrollToSection("budget")} className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors ${activeSection === "budget" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                      View
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="mt-6 pt-4 border-t border-border space-y-1">
                <button onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full py-1.5 px-2 rounded-md hover:bg-muted/50">
                  <PanelLeftClose className="w-3.5 h-3.5" /> Hide sidebar
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-24 md:pb-16">
          {/* Show sidebar button */}
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="hidden md:flex fixed left-2 top-20 z-40 items-center gap-1 text-xs bg-card border border-border rounded-lg px-2 py-1.5 text-muted-foreground hover:text-foreground shadow-sm">
              <PanelLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Hero */}
          <div className="relative h-48 sm:h-56 overflow-hidden bg-muted">
            <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&h=400&fit=crop" alt="Trip" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
            {/* Trip Header Card */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5 sm:p-6 mb-8">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{tripTitle}</h1>
              <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{dateRange}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">P</div>
                  <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Explore Section */}
            <section id="section-explore" className="mb-8">
              <Collapsible defaultOpen>
                <div className="flex items-center justify-between mb-4">
                  <CollapsibleTrigger className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-xl font-display font-bold text-foreground">Explore</h2>
                  </CollapsibleTrigger>
                  <Link to="/explore">
                    <Button variant="default" size="sm" className="rounded-full bg-primary text-primary-foreground font-medium">
                      <Search className="w-3.5 h-3.5 mr-1" /> Browse all
                    </Button>
                  </Link>
                </div>
                <CollapsibleContent>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    {exploreCards.map((card, i) => (
                      <Link key={i} to="/explore" className="min-w-[220px] max-w-[240px] flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated transition-shadow group">
                        <div className="h-32 overflow-hidden">
                          <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-bold text-foreground mb-0.5 line-clamp-1">{card.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{card.description}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-ocean-gradient" />
                            <span className="text-[10px] text-muted-foreground">{card.source}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </section>

            {/* Reservations & Budgeting */}
            <section className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-muted/40 rounded-xl border border-border p-4">
                  <h3 className="text-sm font-bold text-foreground mb-3">Reservations and attachments</h3>
                  <div className="flex flex-wrap gap-4">
                    {([
                      { icon: Plane, label: "Flight" },
                      { icon: Hotel, label: "Lodging" },
                      { icon: Car, label: "Rental car" },
                      { icon: UtensilsCrossed, label: "Restaurant" },
                    ] as const).map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        onClick={() => setReservationDialogOpen(label as Reservation["type"])}
                        className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors relative"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px]">{label}</span>
                        {reservations.filter(r => r.type === label).length > 0 && (
                          <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-muted text-[9px] font-bold text-foreground flex items-center justify-center">
                            {reservations.filter(r => r.type === label).length}
                          </span>
                        )}
                      </button>
                    ))}

                    {/* Other dropdown with Train, Bus, Ferry, Cruise */}
                    <Popover open={otherPopoverOpen} onOpenChange={setOtherPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                          <span className="text-[10px]">Other</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align="start">
                        {([
                          { icon: TrainFront, label: "Train" },
                          { icon: Bus, label: "Bus" },
                          { icon: Ship, label: "Ferry" },
                          { icon: Anchor, label: "Cruise" },
                        ] as const).map(({ icon: Icon, label }) => (
                          <button
                            key={label}
                            onClick={() => {
                              setReservationDialogOpen(label as Reservation["type"]);
                              setOtherPopoverOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {label}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

                    {/* Attachment */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors relative"
                    >
                      <Paperclip className="w-5 h-5" />
                      <span className="text-[10px]">Attachment</span>
                      {attachments.length > 0 && (
                        <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-muted text-[9px] font-bold text-foreground flex items-center justify-center">
                          {attachments.length}
                        </span>
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach(f => {
                        setAttachments(prev => [...prev, {
                          id: String(Date.now() + Math.random()),
                          name: f.name,
                          size: f.size < 1024 ? `${f.size} B` : f.size < 1048576 ? `${(f.size / 1024).toFixed(1)} KB` : `${(f.size / 1048576).toFixed(1)} MB`,
                          addedAt: new Date().toLocaleDateString(),
                        }]);
                      });
                      toast({ title: `${files.length} file(s) attached` });
                      e.target.value = "";
                    }}
                  />

                  {/* Show added reservations */}
                  {reservations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {reservations.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-card rounded-lg border border-border/60 p-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              {r.type === "Flight" && <Plane className="w-4 h-4" />}
                              {r.type === "Lodging" && <Hotel className="w-4 h-4" />}
                              {r.type === "Rental car" && <Car className="w-4 h-4" />}
                              {r.type === "Restaurant" && <UtensilsCrossed className="w-4 h-4" />}
                              {r.type === "Train" && <TrainFront className="w-4 h-4" />}
                              {r.type === "Bus" && <Bus className="w-4 h-4" />}
                              {r.type === "Ferry" && <Ship className="w-4 h-4" />}
                              {r.type === "Cruise" && <Anchor className="w-4 h-4" />}
                              {r.type === "Other" && <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{r.type} • {r.date}{r.confirmationNumber ? ` • #${r.confirmationNumber}` : ""}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => {
                            setReservations(prev => prev.filter(x => x.id !== r.id));
                            toast({ title: "Reservation removed" });
                          }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show added attachments */}
                  {attachments.length > 0 && (
                    <div className={`${reservations.length > 0 ? "mt-2" : "mt-3 pt-3 border-t border-border"} space-y-2`}>
                      {attachments.map(a => (
                        <div key={a.id} className="flex items-center justify-between bg-card rounded-lg border border-border/60 p-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                              <Paperclip className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
                              <p className="text-[10px] text-muted-foreground">{a.size} • {a.addedAt}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => {
                            setAttachments(prev => prev.filter(x => x.id !== a.id));
                            toast({ title: "Attachment removed" });
                          }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => scrollToSection("budget")} className="w-full sm:w-[180px] bg-muted/40 rounded-xl border border-border p-4 text-left hover:bg-muted/60 transition-colors">
                  <h3 className="text-sm font-bold text-foreground mb-1">Budgeting</h3>
                  <p className="text-xl font-display font-bold text-foreground">{expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</p>
                  <span className="text-xs text-primary font-medium mt-1">View details</span>
                </button>
              </div>
            </section>

            {/* Notes */}
            <section id="section-notes" className="mb-8">
              <Collapsible defaultOpen>
                <div className="flex items-center justify-between mb-3">
                  <CollapsibleTrigger className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-xl font-display font-bold text-foreground">Notes</h2>
                  </CollapsibleTrigger>
                  <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <CollapsibleContent>
                  <Textarea
                    placeholder="Write or paste anything here: how to get around, tips and tricks"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] rounded-xl border-border/60 resize-none text-sm"
                  />
                </CollapsibleContent>
              </Collapsible>
            </section>

            {/* Places to visit */}
            <section id="section-places-to-visit" className="mb-8">
              <Collapsible defaultOpen>
                <div className="flex items-center justify-between mb-3">
                  <CollapsibleTrigger className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-xl font-display font-bold text-foreground">Places to visit</h2>
                  </CollapsibleTrigger>
                  <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <CollapsibleContent>
                  <div className="space-y-3">
                    {tripPlaces.map((place, i) => (
                      <div key={place.name} className="bg-muted/30 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">{i + 1}</div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{place.name}</h4>
                          <Link to={place.exploreLink} className="text-xs text-primary font-medium hover:underline">Explore {place.name}</Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add a place */}
                  <div className="flex items-center gap-2 mt-4 bg-muted/20 rounded-xl border border-border/50 px-3 py-2.5">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Add a place" className="border-0 shadow-none h-7 bg-transparent focus-visible:ring-0 text-sm p-0" />
                  </div>

                  {/* Recommended */}
                  <Collapsible className="mt-4">
                    <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                      <ChevronRight className="w-3.5 h-3.5" /> Recommended places
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                        {recommendedPlaces.map((p) => (
                          <div key={p.name} className="flex items-center gap-2 min-w-[180px] bg-card rounded-lg border border-border p-2 shrink-0">
                            <img src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-foreground line-clamp-2">{p.name}</span>
                            </div>
                            <button className="shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CollapsibleContent>
              </Collapsible>
            </section>

            <div className="border-t border-border my-8" />

            {/* Itinerary Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Itinerary</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {dateRange}
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-ocean-gradient text-primary-foreground font-semibold rounded-xl shadow-sm">
                      <Share2 className="w-4 h-4 mr-1" /> Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="font-display">Share Itinerary</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="flex gap-2">
                        <Input placeholder="Email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="rounded-xl" />
                        <Button onClick={handleShare} className="rounded-xl bg-ocean-gradient text-primary-foreground">Send</Button>
                      </div>
                      <Button variant="outline" className="w-full rounded-xl" onClick={copyLink}>
                        {linkCopied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Link</>}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Day-by-day */}
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="space-y-2">
                {itinerary.map((day, dayIndex) => {
                  const isExpanded = expandedDays.has(dayIndex);
                  const prevDay = dayIndex > 0 ? itinerary[dayIndex - 1] : null;
                  const isNewCity = prevDay && prevDay.city !== day.city;

                  return (
                    <div key={day.dayNumber} id={`section-day-${dayIndex}`}>
                      {isNewCity && (
                        <div className="flex items-center justify-center gap-2 my-6">
                          <div className="h-px flex-1 bg-border" />
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Plane className="w-3.5 h-3.5" /><span>Travel to {day.city}</span>
                          </div>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}

                      {/* Need a place to stay banner */}
                      {dayIndex === 0 && showHotelBanner && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-bold text-foreground">Need a place to stay?</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Looks like you don't have lodging for Apr 14 – 18 yet.</p>
                            <Link to="/hotels">
                              <Button size="sm" className="mt-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs">Book hotels</Button>
                            </Link>
                          </div>
                          <button onClick={() => setShowHotelBanner(false)} className="text-muted-foreground hover:text-foreground shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Day header */}
                      <div className="border-b border-border py-3">
                        <div className="flex items-center justify-between">
                          <button onClick={() => toggleDay(dayIndex)} className="flex items-center gap-2 text-left">
                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            <div>
                              <h3 className="text-lg font-display font-bold text-foreground">{day.fullDate}</h3>
                              {!isExpanded && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                                  {day.activities.map(a => a.name).join(" • ")}
                                </p>
                              )}
                            </div>
                          </button>
                          <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                      </div>

                      {/* Expanded day content */}
                      {isExpanded && (
                        <Droppable droppableId={String(dayIndex)}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="py-3 pl-4 border-l-2 border-primary/30 ml-2 space-y-1">
                              {day.activities.map((activity, actIdx) => (
                                <Draggable key={activity.id} draggableId={activity.id} index={actIdx}>
                                  {(prov, snap) => (
                                    <div ref={prov.innerRef} {...prov.draggableProps} className={`rounded-xl transition-all ${snap.isDragging ? "bg-card shadow-elevated ring-2 ring-primary/30" : ""}`}>
                                      {/* Activity row */}
                                      <div className="flex items-start gap-3 p-3 bg-card border border-border/60 rounded-xl hover:shadow-card transition-shadow mb-1">
                                        <div {...prov.dragHandleProps} className="mt-1 text-muted-foreground/40 hover:text-muted-foreground cursor-grab shrink-0">
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                                          {actIdx + 1}
                                        </div>
                                        <button onClick={() => setSelectedActivity(activity)} className="flex-1 min-w-0 text-left">
                                          <h4 className="font-semibold text-foreground text-sm">{activity.name}</h4>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            Open {activity.openTime}–{activity.closeTime} • {activity.description?.slice(0, 60)}…
                                          </p>
                                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 cursor-pointer hover:underline"><Check className="w-3 h-3" /> Mark as visited</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" /> Add time</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Paperclip className="w-3 h-3" /> Attach</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> Add cost</span>
                                          </div>
                                        </button>
                                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground/50 hover:text-destructive h-7 w-7" onClick={() => deleteActivity(dayIndex, activity.id)}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>

                                      {/* Travel info between activities */}
                                      {actIdx < day.activities.length - 1 && activity.travelTimeFromPrevious && (
                                        <div className="flex items-center gap-2 pl-14 py-1 text-[10px] text-muted-foreground">
                                          <Navigation className="w-3 h-3" />
                                          <span>{day.activities[actIdx + 1].travelTimeFromPrevious}</span>
                                          <span>•</span>
                                          <button className="text-primary hover:underline">Directions</button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed text-muted-foreground hover:text-foreground hover:border-primary/40 mt-2" onClick={() => setAddActivityDayIndex(dayIndex)}>
                                <Plus className="w-4 h-4 mr-1" /> Add Activity
                              </Button>
                            </div>
                          )}
                        </Droppable>
                      )}
                    </div>
                  );
                })}
              </div>
            </DragDropContext>

            <div className="mt-6 flex justify-center">
              <Button variant="outline" className="rounded-xl" onClick={addDay}>
                <Plus className="w-4 h-4 mr-1" /> Add Day
              </Button>
            </div>

            {/* Budget Section */}
            <section id="section-budget" className="mt-12">
              <div className="border-t border-border pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-foreground">Budgeting</h2>
                  <Button onClick={() => setAddExpenseOpen(true)} className="rounded-full bg-primary text-primary-foreground font-semibold">
                    <Plus className="w-4 h-4 mr-1" /> Add expense
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {/* Budget summary */}
                  <div className="flex-1 bg-muted/40 rounded-xl border border-border p-5">
                    <p className="text-3xl font-display font-bold text-foreground mb-3">
                      ${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setSetBudgetOpen(true)}>
                        <Pencil className="w-3 h-3 mr-1" /> Set budget
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-xs">
                        <List className="w-3 h-3 mr-1" /> Group balances
                      </Button>
                    </div>
                    {budget !== null && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Spent</span>
                          <span>${expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)} / ${budget.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (expenses.reduce((s, e) => s + e.amount, 0) / budget) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="w-full sm:w-[200px] space-y-2">
                    <button className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" /> View breakdown
                    </button>
                    <button className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground">
                      <UserPlus className="w-4 h-4 text-muted-foreground" /> Add tripmate
                    </button>
                    <button className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm text-foreground">
                      <Settings className="w-4 h-4 text-muted-foreground" /> Settings
                    </button>
                  </div>
                </div>

                {/* Expenses list */}
                <Collapsible defaultOpen>
                  <div className="flex items-center justify-between mb-3">
                    <CollapsibleTrigger className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-xl font-display font-bold text-foreground">Expenses</h3>
                    </CollapsibleTrigger>
                    <select value={expenseSortBy} onChange={(e) => setExpenseSortBy(e.target.value as any)} className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground">
                      <option value="newest">Date (newest first)</option>
                      <option value="oldest">Date (oldest first)</option>
                    </select>
                  </div>
                  <CollapsibleContent>
                    {expenses.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">You haven't added any expenses yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {[...expenses]
                          .sort((a, b) => expenseSortBy === "newest" ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id))
                          .map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{exp.category}</p>
                                <p className="text-[10px] text-muted-foreground">{exp.date} • Paid by {exp.paidBy} • {exp.split}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{exp.currency}{exp.amount.toFixed(2)}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => {
                                setExpenses(prev => prev.filter(e => e.id !== exp.id));
                                toast({ title: "Expense removed" });
                              }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-center">Add expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const amount = parseFloat((form.elements.namedItem("amount") as HTMLInputElement).value);
            const currency = (form.elements.namedItem("currency") as HTMLSelectElement).value;
            const category = (form.elements.namedItem("category") as HTMLSelectElement).value;
            const split = (form.elements.namedItem("split") as HTMLSelectElement).value;
            const date = (form.elements.namedItem("date") as HTMLInputElement).value;
            if (!amount || amount <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
            setExpenses(prev => [...prev, {
              id: String(expenseNextId++),
              amount,
              currency,
              category: category || "Other",
              paidBy: "You",
              split: split || "Don't split",
              date: date || new Date().toLocaleDateString(),
            }]);
            toast({ title: "Expense added", description: `${currency}${amount.toFixed(2)} for ${category}` });
            setAddExpenseOpen(false);
          }} className="space-y-4 mt-2">
            {/* Amount with currency */}
            <div className="flex items-center gap-2 border border-border rounded-xl p-3 focus-within:ring-2 focus-within:ring-primary/30">
              <select name="currency" defaultValue="$" className="bg-transparent text-sm font-medium text-foreground border-0 outline-none w-12">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input name="amount" type="number" step="0.01" min="0" placeholder="0" className="border-0 shadow-none text-lg font-medium focus-visible:ring-0 p-0 h-auto" />
            </div>

            {/* Category */}
            <div className="border border-border rounded-xl p-3 flex items-center gap-3">
              <List className="w-4 h-4 text-muted-foreground shrink-0" />
              <select name="category" defaultValue="" className="bg-transparent text-sm text-foreground flex-1 border-0 outline-none">
                <option value="" disabled>Select item</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Paid by */}
            <div className="border border-border rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Paid by</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">P</div>
                <span className="text-sm text-foreground">You</span>
              </div>
            </div>

            {/* Split */}
            <div className="border border-border rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Split</span>
              <select name="split" defaultValue="Don't split" className="bg-transparent text-sm text-foreground border-0 outline-none text-right">
                <option>Don't split</option>
                <option>Split equally</option>
                <option>Split by amount</option>
              </select>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Date:</span>
              <Input name="date" type="date" className="border-0 shadow-none text-sm text-muted-foreground focus-visible:ring-0 p-0 h-auto w-auto" />
            </div>

            <Button type="submit" className="w-full rounded-full bg-primary text-primary-foreground font-semibold text-base h-11">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Budget Dialog */}
      <Dialog open={setBudgetOpen} onOpenChange={setSetBudgetOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold text-center">Set Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const val = parseFloat((e.target as HTMLFormElement).budgetAmount.value);
            if (!val || val <= 0) { toast({ title: "Enter a valid budget", variant: "destructive" }); return; }
            setBudget(val);
            toast({ title: "Budget set", description: `$${val.toFixed(2)}` });
            setSetBudgetOpen(false);
          }} className="space-y-4 mt-2">
            <div className="flex items-center gap-2 border border-border rounded-xl p-3">
              <span className="text-lg font-medium text-foreground">$</span>
              <Input name="budgetAmount" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={budget?.toString() || ""} className="border-0 shadow-none text-lg font-medium focus-visible:ring-0 p-0 h-auto" />
            </div>
            <Button type="submit" className="w-full rounded-full bg-primary text-primary-foreground font-semibold h-10">Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Reservation Dialog */}
      <Dialog open={reservationDialogOpen !== null} onOpenChange={(open) => { if (!open) setReservationDialogOpen(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-center">
              Add {reservationDialogOpen}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const title = (form.elements.namedItem("res-title") as HTMLInputElement).value.trim();
            const details = (form.elements.namedItem("res-details") as HTMLInputElement).value.trim();
            const date = (form.elements.namedItem("res-date") as HTMLInputElement).value;
            const confirmation = (form.elements.namedItem("res-confirmation") as HTMLInputElement).value.trim();
            if (!title) { toast({ title: "Please enter a title", variant: "destructive" }); return; }
            setReservations(prev => [...prev, {
              id: String(Date.now()),
              type: reservationDialogOpen!,
              title,
              details,
              date: date || new Date().toLocaleDateString(),
              confirmationNumber: confirmation || undefined,
            }]);
            toast({ title: `${reservationDialogOpen} added`, description: title });
            setReservationDialogOpen(null);
          }} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {reservationDialogOpen === "Flight" ? "Flight / Airline" :
                 reservationDialogOpen === "Lodging" ? "Hotel / Property name" :
                 reservationDialogOpen === "Rental car" ? "Rental company" :
                 reservationDialogOpen === "Restaurant" ? "Restaurant name" :
                 reservationDialogOpen === "Train" ? "Train / Operator" :
                 reservationDialogOpen === "Bus" ? "Bus line / Operator" :
                 reservationDialogOpen === "Ferry" ? "Ferry / Operator" :
                 reservationDialogOpen === "Cruise" ? "Cruise line / Ship" : "Title"}
              </label>
              <Input name="res-title" placeholder={
                reservationDialogOpen === "Flight" ? "e.g. Air France AF1234" :
                reservationDialogOpen === "Lodging" ? "e.g. Hotel Le Marais" :
                reservationDialogOpen === "Rental car" ? "e.g. Europcar CDG" :
                reservationDialogOpen === "Restaurant" ? "e.g. Le Comptoir" :
                reservationDialogOpen === "Train" ? "e.g. Eurostar 9012" :
                reservationDialogOpen === "Bus" ? "e.g. FlixBus Paris → Lyon" :
                reservationDialogOpen === "Ferry" ? "e.g. Dover → Calais" :
                reservationDialogOpen === "Cruise" ? "e.g. MSC Grandiosa" : "e.g. Museum tickets"
              } className="rounded-xl" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Details</label>
              <Input name="res-details" placeholder={
                reservationDialogOpen === "Flight" ? "CDG → LHR, 10:30 AM" :
                reservationDialogOpen === "Lodging" ? "Check-in 3 PM, 2 nights" :
                reservationDialogOpen === "Rental car" ? "Compact, pickup at airport" :
                reservationDialogOpen === "Restaurant" ? "Reservation for 2, 8 PM" :
                reservationDialogOpen === "Train" ? "Seat 42A, 1st class" :
                reservationDialogOpen === "Bus" ? "Departure 8:00 AM, Platform 3" :
                reservationDialogOpen === "Ferry" ? "Vehicle + 2 passengers" :
                reservationDialogOpen === "Cruise" ? "Cabin B204, 7-night itinerary" : "Additional details"
              } className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <Input name="res-date" type="date" className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirmation # (optional)</label>
              <Input name="res-confirmation" placeholder="e.g. ABC123" className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-full bg-primary text-primary-foreground font-semibold text-base h-11">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AddActivityDialog open={addActivityDayIndex !== null} onOpenChange={open => { if (!open) setAddActivityDayIndex(null); }} onSelect={addActivityFromSearch} />
      <ActivityDetailDialog activity={selectedActivity} open={!!selectedActivity} onOpenChange={open => { if (!open) setSelectedActivity(null); }} />
    </div>
  );
};

export default Itinerary;
