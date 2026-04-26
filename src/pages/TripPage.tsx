import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Star, Clock, MapPin, Ticket, GripVertical, Plus, Trash2, Share2, Copy, Check, Plane,
  ChevronDown, ChevronRight, MoreHorizontal, StickyNote, MapPinned, Compass, FileText,
  Hotel, Car, UtensilsCrossed, Paperclip, DollarSign, Navigation, ThumbsUp, ThumbsDown,
  Heart, Smile, PanelLeftClose, PanelLeft, Search, X, UserPlus, Calendar, Pencil, List,
  Settings, Users, BarChart3, TrainFront, Bus, Ship, Anchor, Globe, Wallet, Info, Map as MapIcon,
  ReceiptText, Sparkles, BedDouble, Wine, Landmark, ShoppingBag, Fuel, ShoppingCart, CircleDollarSign, X as CloseIcon
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { resolveActivityPhotoUrl } from "@/lib/activityPhoto";
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

const formatActivityTime = (timeString?: string | null) => {
  if (!timeString || timeString === "Not Available") return null;
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  } catch {
    return timeString;
  }
};

const getOpeningHoursLabel = (activity: Activity) => {
  const open = formatActivityTime(activity.openTime);
  const close = formatActivityTime(activity.closeTime);
  if (open && close) return `${open} - ${close}`;
  if (open) return open;
  return null;
};

const getEditorSummary = (activity: Activity) => {
  const summary = activity.description || activity.whyVisit || "";
  return summary.trim() || "Summary coming soon";
};

const hasActivityRating = (activity: Activity) => {
  return activity.rating !== null && activity.rating !== undefined && activity.rating !== 0;
};

const hasActivityDuration = (activity: Activity) => {
  return Boolean(activity.duration && activity.duration.trim());
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
  title: string;
  paidBy: string;
  split: "none" | "everyone" | "individuals";
  participants: string[];
  date: string;
}

const CURRENCIES = ["$", "€", "£", "₹", "¥"];
const EXPENSE_CATEGORIES = ["Flight", "Lodging", "Food", "Transport", "Activities", "Shopping", "Other"];

const CURRENCY_OPTIONS = [
  { symbol: "₹", label: "Indian Rupee", code: "INR", flag: "🇮🇳" },
  { symbol: "$", label: "US Dollar", code: "USD", flag: "🇺🇸" },
  { symbol: "€", label: "Euro", code: "EUR", flag: "🇪🇺" },
  { symbol: "£", label: "British Pound", code: "GBP", flag: "🇬🇧" },
  { symbol: "¥", label: "Japanese Yen", code: "JPY", flag: "🇯🇵" },
] as const;

interface Tripmate {
  id: string;
  name: string;
}

type ExpenseSort = "newest" | "oldest" | "highest" | "lowest";

const CATEGORY_OPTIONS = [
  { value: "Flights", icon: Plane },
  { value: "Lodging", icon: BedDouble },
  { value: "Car rental", icon: Car },
  { value: "Transit", icon: TrainFront },
  { value: "Food", icon: UtensilsCrossed },
  { value: "Drinks", icon: Wine },
  { value: "Sightseeing", icon: Landmark },
  { value: "Activities", icon: Ticket },
  { value: "Shopping", icon: ShoppingBag },
  { value: "Gas", icon: Fuel },
  { value: "Groceries", icon: ShoppingCart },
  { value: "Other", icon: ReceiptText },
] as const;

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const formatMoney = (amount: number, currency: string) => `${currency}${amount.toFixed(2)}`;

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
  const [expenseSortBy, setExpenseSortBy] = useState<ExpenseSort>("newest");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [reservationDialogOpen, setReservationDialogOpen] = useState<Reservation["type"] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [otherPopoverOpen, setOtherPopoverOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"overview" | "itinerary" | "explore" | "budget" | "journal">("overview");
  const [mobileSelectedDay, setMobileSelectedDay] = useState(0);
  const isMobile = useIsMobile();
  const [tripmates, setTripmates] = useState<Tripmate[]>([]);
  const [groupBalancesOpen, setGroupBalancesOpen] = useState(false);
  const [groupBalancesView, setGroupBalancesView] = useState<"summary" | "overview">("summary");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [expenseSettingsOpen, setExpenseSettingsOpen] = useState(false);
  const [simplifyGroupExpenses, setSimplifyGroupExpenses] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState<(typeof CURRENCY_OPTIONS)[number]["symbol"]>("₹");
  const [budgetDraft, setBudgetDraft] = useState("");
  const [expenseDraft, setExpenseDraft] = useState({
    amount: "",
    currency: "₹",
    category: "",
    paidBy: "",
    split: "none" as Expense["split"],
    participants: [] as string[],
    date: "",
  });

  useEffect(() => {
    const displayName =
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0]?.replace(/[._-]+/g, " ") ||
      "You";

    setTripmates((prev) => {
      const ownerId = user?.id || "you";
      const ownerName = `You (${displayName.replace(/\b\w/g, (c: string) => c.toUpperCase())})`;
      if (prev.length > 0) {
        return prev.map((mate, idx) => (idx === 0 ? { ...mate, id: ownerId, name: ownerName } : mate));
      }
      return [
        { id: ownerId, name: ownerName },
        { id: "anon-connect", name: "Anon Connect" },
      ];
    });
  }, [user?.id, user?.email, user?.user_metadata?.full_name]);

  useEffect(() => {
    setExpenseDraft((prev) => ({
      ...prev,
      paidBy: prev.paidBy || tripmates[0]?.id || "",
      participants: prev.participants.length ? prev.participants : tripmates.map((mate) => mate.id),
    }));
  }, [tripmates]);

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

  const totalSpent = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);

  const budgetCurrency = expenses[0]?.currency || defaultCurrency || expenseDraft.currency || "₹";
  const budgetProgress = budget && budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const sortedExpenses = useMemo(() => {
    const next = [...expenses];
    switch (expenseSortBy) {
      case "oldest":
        return next.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
      case "highest":
        return next.sort((a, b) => b.amount - a.amount);
      case "lowest":
        return next.sort((a, b) => a.amount - b.amount);
      case "newest":
      default:
        return next.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    }
  }, [expenseSortBy, expenses]);

  const groupBalances = useMemo(() => {
    const balances = Object.fromEntries(tripmates.map((mate) => [mate.id, 0])) as Record<string, number>;

    expenses.forEach((expense) => {
      const participants =
        expense.split === "none"
          ? [expense.paidBy]
          : expense.split === "everyone"
            ? tripmates.map((mate) => mate.id)
            : expense.participants.length
              ? expense.participants
              : [expense.paidBy];

      if (!participants.length) return;

      const share = expense.amount / participants.length;
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
      participants.forEach((participantId) => {
        balances[participantId] = (balances[participantId] || 0) - share;
      });
    });

    return tripmates.map((mate) => ({
      ...mate,
      amount: Number((balances[mate.id] || 0).toFixed(2)),
    }));
  }, [expenses, tripmates]);

  const currentUserBalance = groupBalances.find((mate) => mate.id === tripmates[0]?.id)?.amount || 0;

  // Fetch Live Data
  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
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
              address: act.address || "",
              rating: act.rating ?? 0,
              openTime: act.open_time || act.openTime || "",
              closeTime: act.close_time || act.closeTime || "",
              duration: act.duration || "",
              ticketPrice: act.ticket_price || act.ticketPrice || "",
              description: act.description || "",
              timeOfDay: act.time_of_day || "morning",
              bestTimeToVisit: act.best_time_to_visit || act.bestTimeToVisit,
              travelTimeFromPrevious: act.travel_time_from_previous || act.travelTimeFromPrevious,
              googleMapsUrl: act.google_maps_url || act.googleMapsUrl,
              whyVisit: act.why_visit || act.whyVisit,
              foodSuggestions: act.food_suggestions || act.foodSuggestions || [],
              hiddenGems: act.hidden_gems || act.hiddenGems || [],
              photoUrl: resolveActivityPhotoUrl(act.photo_url),
              sortOrder: act.sort_order ?? act.sortOrder ?? 0,
              youtubeVideos: act.youtube_videos || []
            }))
        }));

        setItinerary(transformedDays);

        let firstPhotoRaw: string | null = null;
        for (const day of daysData) {
          const sorted = [...(day.activities || [])].sort((a: any, b: any) => a.sort_order - b.sort_order);
          const p = sorted[0]?.photo_url;
          if (p) {
            firstPhotoRaw = p;
            break;
          }
        }
        if (firstPhotoRaw && tripData?.id && !tripData.cover_image) {
          const { error: coverErr } = await supabase.from("trips").update({ cover_image: firstPhotoRaw }).eq("id", tripData.id);
          if (!coverErr) setTrip((prev: any) => (prev ? { ...prev, cover_image: firstPhotoRaw } : prev));
        }

        // --- Fetch Budget & Expenses ---
        const { data: budgetData, error: budgetErr } = await supabase.from("trip_budgets").select("*").eq("trip_id", id).maybeSingle();
        if (!budgetErr && budgetData) {
          setBudget(Number(budgetData.total_budget));
          setDefaultCurrency(budgetData.currency);
        }

        const { data: expensesData, error: expensesErr } = await supabase.from("expenses").select("*").eq("trip_id", id);
        if (!expensesErr && expensesData) {
          setExpenses(expensesData.map((e: any) => ({
            id: e.id,
            amount: Number(e.amount),
            currency: e.currency,
            category: e.category,
            title: e.title || e.category,
            paidBy: e.paid_by,
            split: e.split,
            participants: e.participants || [],
            date: e.date
          })));
        }


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

  const inviteCollaborator = async (emailInput: string, source: "share" | "tripmate") => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      toast({ title: "Enter a valid email address" });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Enter a valid email address" });
      return false;
    }
    if (!id || !trip) {
      toast({ title: "Trip not loaded yet", description: "Please wait a moment and try again." });
      return false;
    }

    setShareSubmitting(true);
    try {
      console.log('🔄 Invoking invite-collaborator function...', { tripId: id, email });

      const { data, error } = await supabase.functions.invoke("invite-collaborator", {
        body: {
          tripId: id,
          email,
          role: "editor",
        },
      });

      // Enhanced error logging
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Failed to invoke Edge Function');
      }

      if (data?.error) {
        console.error('❌ Function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Invite successful:', data);

      setTripmates((prev) => {
        if (prev.some((mate) => mate.id === data?.collaborator?.userId || mate.name === email)) return prev;
        return [
          ...prev,
          {
            id: data?.collaborator?.userId || `invite-${email}`,
            name: email,
          },
        ];
      });

      toast({
        title: "Invitation sent",
        description: `Trip shared with ${email}`,
      });

      return true;
    } catch (err: any) {
      console.error("❌ Failed to invite collaborator:", err);

      // More descriptive error messages
      let errorMessage = "Could not send the invite right now.";
      if (err?.context) {
        try {
          const body = await err.context.json();
          if (body?.error) errorMessage = body.error;
        } catch {
          /* ignore response parse issues */
        }
      }

      if (err?.message?.includes('Unauthorized')) {
        errorMessage = "You don't have permission to invite collaborators.";
      } else if (err?.message?.includes('not found')) {
        errorMessage = "Trip not found. Please refresh the page.";
      } else if (err?.message?.includes('Supabase auth not set up')) {
        errorMessage = "Server configuration error. Please contact support.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast({
        title: "Invite failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setShareSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const resetExpenseDraft = () => {
    setExpenseDraft({
      amount: "",
      currency: defaultCurrency,
      category: "",
      paidBy: tripmates[0]?.id || "",
      split: "none",
      participants: tripmates.map((mate) => mate.id),
      date: "",
    });
  };

  const openAddExpense = () => {
    resetExpenseDraft();
    setAddExpenseOpen(true);
  };

  const handleCurrencyChange = async (value: string) => {
    setDefaultCurrency(value);
    // If budget exists, update the currency in Supabase
    if (budget !== null) {
      await supabase.from("trip_budgets").upsert({
        trip_id: id,
        total_budget: budget,
        currency: value
      }, { onConflict: 'trip_id' });
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(budgetDraft);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: "Enter a valid budget amount" });
      return;
    }

    const { error } = await supabase.from("trip_budgets").upsert({
      trip_id: id,
      total_budget: value,
      currency: defaultCurrency
    }, { onConflict: 'trip_id' });

    if (error) {
      toast({ title: "Failed to save budget", variant: "destructive" });
      return;
    }

    setBudget(value);
    setSetBudgetOpen(false);
    toast({ title: "Budget updated" });
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a valid expense amount" });
      return;
    }
    if (!expenseDraft.category) {
      toast({ title: "Select an expense category" });
      return;
    }

    const participants =
      expenseDraft.split === "everyone"
        ? tripmates.map((mate) => mate.id)
        : expenseDraft.split === "individuals"
          ? expenseDraft.participants
          : [expenseDraft.paidBy];

    if (expenseDraft.split === "individuals" && participants.length === 0) {
      toast({ title: "Choose at least one person for the split" });
      return;
    }

    const newExpense = {
      id: crypto.randomUUID(),
      trip_id: id,
      amount,
      currency: expenseDraft.currency,
      category: expenseDraft.category,
      title: expenseDraft.category,
      paid_by: expenseDraft.paidBy,
      split: expenseDraft.split,
      participants,
      date: expenseDraft.date || new Date().toISOString().slice(0, 10),
    };

    const { error } = await supabase.from("expenses").insert(newExpense);

    if (error) {
      toast({ title: "Failed to save expense", variant: "destructive" });
      return;
    }

    setExpenses((prev) => [
      {
        id: newExpense.id,
        amount: newExpense.amount,
        currency: newExpense.currency,
        category: newExpense.category,
        title: newExpense.title,
        paidBy: newExpense.paid_by,
        split: newExpense.split as Expense["split"],
        participants: newExpense.participants,
        date: newExpense.date,
      },
      ...prev,
    ]);

    setAddExpenseOpen(false);
    toast({ title: "Expense added" });
  };


  const toggleExpenseParticipant = (participantId: string) => {
    setExpenseDraft((prev) => ({
      ...prev,
      participants: prev.participants.includes(participantId)
        ? prev.participants.filter((id) => id !== participantId)
        : [...prev.participants, participantId],
    }));
  };

  const exportExpensesAsCsv = () => {
    const headers = ["Date", "Category", "Amount", "Currency", "Paid By", "Split", "Participants"];
    const rows = expenses.map((expense) => {
      const payer = tripmates.find((mate) => mate.id === expense.paidBy)?.name || expense.paidBy;
      const participants = expense.participants
        .map((id) => tripmates.find((mate) => mate.id === id)?.name || id)
        .join(", ");

      return [
        expense.date,
        expense.category,
        expense.amount.toFixed(2),
        expense.currency,
        payer,
        expense.split,
        participants,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trip-expenses-${trip?.id || "export"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Expenses exported" });
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
  const dateRange = itinerary.length > 0 ? `${itinerary[0].date} - ${itinerary[itinerary.length - 1].date}` : "Curation in progress";

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
                <Button size="sm" variant="default" className="rounded-full text-xs h-8 px-4 font-semibold" onClick={() => setShareDialogOpen(true)}>Share</Button>
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
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${mobileTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
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
              {/* Day selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">
                {itinerary.map((day, i) => (
                  <button key={i} onClick={() => setMobileSelectedDay(i)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mobileSelectedDay === i ? "bg-foreground text-background" : "bg-muted text-foreground"}`}>
                    Day {day.dayNumber}
                  </button>
                ))}
              </div>

              {itinerary[mobileSelectedDay] && (() => {
                const day = itinerary[mobileSelectedDay];
                const cityColor = getCityColor(day.city);
                return (
                  <div>
                    {/* City sub-header for current day */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", cityColor.dot)} />
                      <span className="text-xs font-semibold text-foreground">
                        {day.city}{day.country && day.country !== "Country" ? `, ${day.country}` : ""}
                      </span>
                    </div>
                    <h2 className="text-base font-display font-bold text-foreground mb-2.5">
                      Day {day.dayNumber} — {day.date}
                    </h2>
                    {/* Compact numbered activity list — no time-of-day grouping */}
                    <div className="space-y-1.5">
                      {day.activities.length === 0 && (
                        <p className="text-xs text-muted-foreground italic py-1">No activities yet</p>
                      )}
                      {day.activities.map((activity, actIdx) => (
                        (() => {
                          const openingHours = getOpeningHoursLabel(activity);
                          const showRating = hasActivityRating(activity);
                          const showDuration = hasActivityDuration(activity);
                          return (
                            <div
                              key={activity.id}
                              className="flex items-center gap-2.5 px-2.5 py-2 bg-card border border-border/60 rounded-xl cursor-pointer"
                              onClick={() => setSelectedActivity(activity)}
                            >
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                {actIdx + 1}
                              </div>
                              <div className="w-10 h-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <img src={activity.photoUrl} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-sm leading-tight truncate">{activity.name}</h4>
                                <p className="mt-0.5 text-xs leading-relaxed text-foreground/85 line-clamp-2">
                                  {getEditorSummary(activity)}
                                </p>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-[10px] text-muted-foreground">
                                  {showRating && (
                                    <span className="flex items-center gap-1 min-w-0">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                                      <span className="truncate">{activity.rating}</span>
                                    </span>
                                  )}
                                  {openingHours && (
                                    <span className="flex items-center gap-1 min-w-0">
                                      <Clock className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">{openingHours}</span>
                                    </span>
                                  )}
                                  {showDuration && (
                                    <span className="flex items-center gap-1 min-w-0 col-span-2">
                                      <Clock className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">Avg Time Spend: {activity.duration}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground border border-dashed border-border/50 rounded-xl mt-2 hover:border-primary/40 hover:text-primary" onClick={() => setAddActivityDayIndex(mobileSelectedDay)}>
                      <Plus className="w-3 h-3 mr-1" strokeWidth={2.5} /> Add Activity
                    </Button>
                  </div>
                );
              })()}
            </div>
          )}
          {mobileTab === "budget" && (
            <div className="space-y-6">
              {budget ? (
                <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-3xl font-display font-bold text-foreground">{formatMoney(totalSpent, budgetCurrency)}</h4>
                      <p className="text-sm text-muted-foreground mt-2">Budget: {formatMoney(budget, budgetCurrency)}</p>
                    </div>
                    <div className="space-y-3 text-sm font-semibold text-muted-foreground">
                      <button className="flex items-center gap-2" onClick={() => toast({ title: "Breakdown coming soon" })}>
                        <BarChart3 className="w-4 h-4" /> View breakdown
                      </button>
                      <button className="flex items-center gap-2" onClick={() => setAddTripmateOpen(true)}>
                        <UserPlus className="w-4 h-4" /> Add tripmate
                      </button>
                      <button className="flex items-center gap-2" onClick={() => setExpenseSettingsOpen(true)}>
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${budgetProgress}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <Button onClick={() => { setBudgetDraft(String(budget)); setSetBudgetOpen(true); }} variant="secondary" className="rounded-2xl h-11 bg-muted hover:bg-muted/80 text-foreground justify-start font-bold">
                      <Pencil className="w-4 h-4 mr-2" /> Edit budget
                    </Button>
                    <Button onClick={() => setGroupBalancesOpen(true)} variant="secondary" className="rounded-2xl h-11 bg-muted hover:bg-muted/80 text-foreground justify-start font-bold">
                      <ReceiptText className="w-4 h-4 mr-2" /> Group balances
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center py-12">
                  <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <h4 className="font-display font-bold mb-1">Set a budget to start tracking</h4>
                  <p className="text-muted-foreground text-xs max-w-[240px] mb-6">Once your budget is set, we’ll track expenses and balances against it here.</p>
                  <Button size="sm" className="rounded-xl px-6" onClick={() => { setBudgetDraft(budget ? String(budget) : ""); setSetBudgetOpen(true); }}>
                    <Pencil className="w-4 h-4 mr-1" /> Set Budget
                  </Button>
                </div>
              )}

              <div className="bg-card border border-border/60 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-display font-bold">Expenses</h4>
                  <Select value={expenseSortBy} onValueChange={(value: ExpenseSort) => setExpenseSortBy(value)}>
                    <SelectTrigger className="w-[180px] h-9 rounded-xl border-border/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Date (newest first)</SelectItem>
                      <SelectItem value="oldest">Date (oldest first)</SelectItem>
                      <SelectItem value="highest">Amount (highest first)</SelectItem>
                      <SelectItem value="lowest">Amount (lowest first)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sortedExpenses.length > 0 ? (
                  <div className="space-y-3">
                    {sortedExpenses.map((expense) => {
                      const categoryMeta = CATEGORY_OPTIONS.find((option) => option.value === expense.category);
                      const CategoryIcon = categoryMeta?.icon || ReceiptText;
                      return (
                        <div key={expense.id} className="flex items-center gap-3 py-2">
                          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <CategoryIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{expense.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(expense.date), "MMM d")} • {expense.category}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-foreground">{formatMoney(expense.amount, expense.currency)}</p>
                            <div className="flex justify-end -space-x-1 mt-2">
                              {expense.participants.slice(0, 3).map((participantId) => {
                                const mate = tripmates.find((entry) => entry.id === participantId);
                                return (
                                  <div key={participantId} className="w-7 h-7 rounded-full bg-muted text-foreground text-xs font-bold flex items-center justify-center border-2 border-background">
                                    {getInitials(mate?.name || "?")}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground text-sm mb-4">No expenses yet. Add your first shared cost below.</p>
                  </div>
                )}

                <Button size="sm" className="rounded-xl px-6 mt-4" onClick={openAddExpense}>
                  <Plus className="w-4 h-4 mr-1" /> Add Expense
                </Button>
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
                  <Button variant="default" className="rounded-xl shadow-sm" onClick={() => setShareDialogOpen(true)}><Share2 className="w-4 h-4 mr-1" /> Share</Button>
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

                      {/* Change 1 & 2: Replaced the large colored city header card with a
                           slim inline sub-header that just shows city name + day count.
                           The header is visually lightweight — an accent dot, bold city name,
                           muted day count, and a hairline rule — matching the screenshot style. */}
                      <div className="flex items-center gap-2.5 mt-8 mb-3 first:mt-0">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", cityColor.dot)} />
                        <h2 className="text-base font-display font-bold text-foreground leading-none">
                          {group.city}{group.country && group.country !== "Country" ? `, ${group.country}` : ""}
                        </h2>
                        <span className="text-xs text-muted-foreground font-medium">
                          {group.totalDays} {group.totalDays === 1 ? "Day" : "Days"}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      <div className={cn("ml-3 border-l-2 pl-5 space-y-4", cityColor.border)}>
                        {group.days.map((day: any) => {
                          const dayIdx = itinerary.findIndex(d => d.id === day.id);
                          return (
                            <div key={day.id} id={`section-day-${dayIdx}`} className="scroll-mt-24 relative">
                              {/* Timeline dot */}
                              <div className={cn("absolute top-2.5 -left-[29px] w-3 h-3 rounded-full bg-background border-2 z-10", cityColor.border)} />

                              {/* Change 4: Reduced day header — smaller text, less vertical padding,
                                   tighter sticky bar so it consumes less screen real estate */}
                              <div className="flex items-center justify-between mb-2 sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-2 -mx-2 px-2 border-b border-border/40">
                                <h3 className="text-sm font-display font-bold text-foreground">
                                  Day {day.dayNumber}
                                  <span className="text-muted-foreground font-normal ml-2">— {day.date}</span>
                                </h3>
                                <button
                                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() => {
                                    setItinerary(prev => prev.filter((_, i) => i !== dayIdx));
                                    toast({ title: "Day removed" });
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              </div>

                              <Droppable droppableId={String(dayIdx)}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                      "space-y-1.5 rounded-xl transition-colors",
                                      snapshot.isDraggingOver ? "bg-muted/20" : ""
                                    )}
                                  >
                                    {/* Change 3: Removed Morning/Afternoon/Evening grouping.
                                         Activities are now rendered as a flat numbered list.
                                         The number badge replaces the time-of-day label. */}
                                    {day.activities.length === 0 && (
                                      <p className="text-xs text-muted-foreground italic py-1.5 px-1 opacity-60">No activities yet — add one below</p>
                                    )}

                                    {day.activities.map((activity: any, actIdx: number) => (
                                      <Draggable key={activity.id} draggableId={activity.id} index={actIdx}>
                                        {(prov, snap) => (
                                          (() => {
                                            const openingHours = getOpeningHoursLabel(activity);
                                            const showRating = hasActivityRating(activity);
                                            const showDuration = hasActivityDuration(activity);
                                            return (
                                              // Change 4: Compact card — p-2.5 instead of p-3,
                                              // smaller photo (w-12 h-12 vs w-16 h-16),
                                              // tighter gap, no transport divider between items
                                              <div
                                                ref={prov.innerRef}
                                                {...prov.draggableProps}
                                                className={cn(
                                                  "group relative flex items-center gap-2.5 px-2.5 py-2 bg-card border border-border/60 rounded-xl transition-all",
                                                  snap.isDragging ? "shadow-elevated ring-2 ring-primary/20 z-50 scale-[1.01]" : "hover:shadow-sm hover:border-border"
                                                )}
                                              >
                                                {/* Drag handle */}
                                                <div {...prov.dragHandleProps} className="shrink-0 text-muted-foreground/30 cursor-grab active:cursor-grabbing group-hover:text-muted-foreground/60 transition-opacity">
                                                  <GripVertical className="w-3.5 h-3.5" />
                                                </div>

                                                {/* Number badge — replaces time-of-day label */}
                                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                  {actIdx + 1}
                                                </div>

                                                {/* Thumbnail — smaller than before */}
                                                <div className="w-11 h-11 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/10">
                                                  <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedActivity(activity)}>
                                                  <h4 className="font-semibold text-foreground text-sm leading-tight truncate group-hover:text-primary transition-colors">
                                                    {activity.name}
                                                  </h4>
                                                  <p className="mt-0.5 text-sm leading-relaxed text-foreground/85 line-clamp-2">
                                                    {getEditorSummary(activity)}
                                                  </p>
                                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-3 gap-y-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
                                                    {showRating && (
                                                      <span className="flex items-center gap-1 min-w-0">
                                                        <Star className="w-2.5 h-2.5 text-gold fill-gold shrink-0" />
                                                        <span className="truncate">{activity.rating}</span>
                                                      </span>
                                                    )}
                                                    {openingHours && (
                                                      <span className="flex items-center gap-1 min-w-0">
                                                        <Clock className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="truncate">{openingHours}</span>
                                                      </span>
                                                    )}
                                                    {showDuration && (
                                                      <span className="flex items-center gap-1 min-w-0">
                                                        <Clock className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="truncate">Avg Time Spend: {activity.duration}</span>
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Delete */}
                                                <button
                                                  className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1.5 transition-all hover:bg-destructive/10 hover:text-destructive rounded-lg shrink-0"
                                                  onClick={(e) => { e.stopPropagation(); deleteActivity(dayIdx, activity.id); }}
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            );
                                          })()
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Add Activity Button — compact ghost style */}
                                    <button
                                      onClick={() => setAddActivityDayIndex(dayIdx)}
                                      className="w-full py-2.5 border border-dashed border-border/50 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add Activity
                                    </button>
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        })}
                      </div>

                      {/* Inter-city travel divider — kept as-is */}
                      {groupIdx < cityGroups.length - 1 && (
                        <div className="flex items-center gap-4 py-6 justify-center max-w-lg mx-auto">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-border" />
                          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border bg-muted/30 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-muted/50">
                            <Plane className="w-3.5 h-3.5 rotate-45 text-primary" />
                            <span>Travel to {cityGroups[groupIdx + 1].city}</span>
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
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 h-11 border-none" onClick={openAddExpense}>
                  <Plus className="w-4 h-4 mr-1.5" strokeWidth={3} /> Add expense
                </Button>
              </div>

              {budget ? (
                <div className="bg-card border border-border/60 rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-8 mb-10 shadow-card">
                  <div className="flex-1">
                    <h4 className="text-4xl font-display font-bold text-foreground">{formatMoney(totalSpent, budgetCurrency)}</h4>
                    <div className="flex items-center gap-4 mt-6 mb-8">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[520px]">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${budgetProgress}%` }} />
                      </div>
                      <p className="text-lg text-muted-foreground">Budget: {formatMoney(budget, budgetCurrency)}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => { setBudgetDraft(String(budget)); setSetBudgetOpen(true); }} variant="secondary" className="rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold px-5 h-12 flex gap-2">
                        <Pencil className="w-4 h-4" /> Edit budget
                      </Button>
                      <Button onClick={() => setGroupBalancesOpen(true)} variant="secondary" className="rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold px-5 h-12 flex gap-2">
                        <ReceiptText className="w-4 h-4" /> Group balances
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5 pr-4 justify-center">
                    <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group" onClick={() => toast({ title: "Breakdown coming soon" })}>
                      <BarChart3 className="w-5 h-5 opacity-70 group-hover:opacity-100" /> View breakdown
                    </button>
                    <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group" onClick={() => setShareDialogOpen(true)}>
                      <UserPlus className="w-5 h-5 opacity-70 group-hover:opacity-100" /> Add tripmate
                    </button>
                    <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group" onClick={() => setExpenseSettingsOpen(true)}>
                      <Settings className="w-5 h-5 opacity-70 group-hover:opacity-100" /> Settings
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border/60 rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-8 mb-10 shadow-card">
                  <div className="flex-1">
                    <h4 className="text-4xl font-display font-bold text-foreground">{formatMoney(0, budgetCurrency)}</h4>
                    <div className="flex flex-wrap gap-3 mt-6">
                      <Button onClick={() => { setBudgetDraft(""); setSetBudgetOpen(true); }} variant="secondary" className="rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold px-5 h-12 flex gap-2">
                        <Pencil className="w-4 h-4" /> Set budget
                      </Button>
                      <Button onClick={() => setGroupBalancesOpen(true)} variant="secondary" className="rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold px-5 h-12 flex gap-2">
                        <ReceiptText className="w-4 h-4" /> Group balances
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5 pr-4 justify-center">
                    <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group" onClick={() => toast({ title: "Breakdown coming soon" })}>
                      <BarChart3 className="w-5 h-5 opacity-70 group-hover:opacity-100" /> View breakdown
                    </button>
                    <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group" onClick={() => setShareDialogOpen(true)}>
                      <UserPlus className="w-5 h-5 opacity-70 group-hover:opacity-100" /> Add tripmate
                    </button>
                    <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group" onClick={() => setExpenseSettingsOpen(true)}>
                      <Settings className="w-5 h-5 opacity-70 group-hover:opacity-100" /> Settings
                    </button>
                  </div>
                </div>
              )}

              <Collapsible defaultOpen>
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <CollapsibleTrigger className="flex items-center gap-2 group">
                    <ChevronDown className="w-5 h-5 text-foreground transition-transform duration-200 group-data-[state=closed]:-rotate-90" strokeWidth={2.5} />
                    <h3 className="text-2xl font-bold text-foreground">Expenses</h3>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                    <span>Sort:</span>
                    <Select value={expenseSortBy} onValueChange={(value: ExpenseSort) => setExpenseSortBy(value)}>
                      <SelectTrigger className="w-[220px] h-10 border-none bg-transparent px-0 font-bold shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Date (newest first)</SelectItem>
                        <SelectItem value="oldest">Date (oldest first)</SelectItem>
                        <SelectItem value="highest">Amount (highest first)</SelectItem>
                        <SelectItem value="lowest">Amount (lowest first)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CollapsibleContent>
                  {sortedExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {sortedExpenses.map((expense) => {
                        const categoryMeta = CATEGORY_OPTIONS.find((option) => option.value === expense.category);
                        const CategoryIcon = categoryMeta?.icon || ReceiptText;
                        return (
                          <div key={expense.id} className="flex items-center justify-between py-4 border-b border-border/50 last:border-b-0">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                <CategoryIcon className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xl font-bold text-foreground truncate">{expense.title}</h4>
                                <p className="text-muted-foreground text-base mt-1">{format(new Date(expense.date), "MMM d")} • {expense.category}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-6">
                              <p className="text-xl font-bold text-foreground">{formatMoney(expense.amount, expense.currency)}</p>
                              <div className="flex justify-end -space-x-1 mt-3">
                                {expense.participants.slice(0, 4).map((participantId) => {
                                  const mate = tripmates.find((entry) => entry.id === participantId);
                                  return (
                                    <div key={participantId} className="w-10 h-10 rounded-full bg-muted text-foreground text-sm font-bold flex items-center justify-center border-2 border-background">
                                      {getInitials(mate?.name || "?")}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-base mt-2">You haven't added any expenses yet.</p>
                  )}
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
        <DialogContent className="sm:max-w-xs rounded-3xl border-none shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-display font-bold text-center">Set Budget</DialogTitle></DialogHeader>
          <form className="space-y-6 mt-4" onSubmit={handleSaveBudget}>
            <div className="relative">
              <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="number" step="0.01" value={budgetDraft} onChange={(e) => setBudgetDraft(e.target.value)} placeholder="0.00" className="pl-12 h-12 rounded-2xl bg-muted border-none text-lg font-semibold" />
            </div>
            <Button type="submit" className="w-full rounded-2xl h-12 font-bold text-sm">Save Budget</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border border-border/60 shadow-elevated p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-center">Add expense</DialogTitle>
          </DialogHeader>
          <form className="space-y-3 mt-3" onSubmit={handleSaveExpense}>
            <div className="rounded-3xl border-2 border-primary/20 bg-card px-4 py-3.5 flex items-center gap-3">
              <Select value={expenseDraft.currency} onValueChange={(value) => setExpenseDraft((prev) => ({ ...prev, currency: value }))}>
                <SelectTrigger className="w-14 border-none shadow-none px-0 text-lg font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                value={expenseDraft.amount}
                onChange={(e) => setExpenseDraft((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="border-none shadow-none text-xl px-0 h-auto font-semibold"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="w-full h-16 rounded-3xl border border-border bg-card px-5 flex items-center justify-between text-left">
                  <span className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ReceiptText className="w-4 h-4" />
                    {expenseDraft.category || "Select item"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[410px] max-w-[90vw] rounded-3xl p-6">
                <p className="text-lg font-bold text-foreground mb-4">Select from a category</p>
                <div className="grid grid-cols-2 gap-4">
                  {CATEGORY_OPTIONS.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setExpenseDraft((prev) => ({ ...prev, category: option.value }))}
                        className={cn(
                          "rounded-2xl bg-muted/60 border px-4 py-6 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors",
                          expenseDraft.category === option.value ? "border-primary bg-primary/5 text-foreground" : "border-transparent"
                        )}
                      >
                        <OptionIcon className="w-8 h-8" />
                        <span className="text-lg">{option.value}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-foreground">Paid by</span>
                <Select value={expenseDraft.paidBy} onValueChange={(value) => setExpenseDraft((prev) => ({ ...prev, paidBy: value }))}>
                  <SelectTrigger className="w-[230px] h-10 rounded-2xl border-none shadow-none text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tripmates.map((mate) => (
                      <SelectItem key={mate.id} value={mate.id}>{mate.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-foreground">Split</span>
                <Select
                  value={expenseDraft.split}
                  onValueChange={(value: Expense["split"]) =>
                    setExpenseDraft((prev) => ({
                      ...prev,
                      split: value,
                      participants: value === "everyone" ? tripmates.map((mate) => mate.id) : prev.participants,
                    }))
                  }
                >
                  <SelectTrigger className="w-[190px] h-10 rounded-2xl border-none shadow-none text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individuals">Individuals</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="none">Don't split</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {expenseDraft.split !== "none" && (
                <div className="space-y-2 pt-1">
                  {tripmates.map((mate) => {
                    const checked =
                      expenseDraft.split === "everyone" ? true : expenseDraft.participants.includes(mate.id);
                    return (
                      <button
                        key={mate.id}
                        type="button"
                        onClick={() => expenseDraft.split === "individuals" && toggleExpenseParticipant(mate.id)}
                        className="flex items-center gap-4"
                      >
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border-2", checked ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent")}>
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="w-9 h-9 rounded-full bg-muted text-foreground text-xs font-bold flex items-center justify-center">
                          {getInitials(mate.name)}
                        </div>
                        <span className="text-sm text-foreground">{mate.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-muted-foreground">Date:</span>
                <Input
                  type="date"
                  value={expenseDraft.date}
                  onChange={(e) => setExpenseDraft((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-[170px] h-9 rounded-xl border-border text-sm"
                />
              </div>
              <Button type="submit" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-10 text-sm">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={groupBalancesOpen} onOpenChange={setGroupBalancesOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl border border-border/60 shadow-elevated p-5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center">Group balances</DialogTitle>
          </DialogHeader>
          <div className="mt-3">
            <div className="grid grid-cols-2 bg-muted rounded-2xl p-1">
              <button className={cn("rounded-2xl py-2.5 text-sm", groupBalancesView === "summary" ? "bg-card shadow-sm font-semibold text-foreground" : "text-muted-foreground")} onClick={() => setGroupBalancesView("summary")}>Your summary</button>
              <button className={cn("rounded-2xl py-2.5 text-sm", groupBalancesView === "overview" ? "bg-card shadow-sm font-semibold text-foreground" : "text-muted-foreground")} onClick={() => setGroupBalancesView("overview")}>Group overview</button>
            </div>

            <div className="mt-4 space-y-1">
              {(groupBalancesView === "summary" ? groupBalances.filter((mate) => mate.id === tripmates[0]?.id) : groupBalances).map((mate) => (
                <div key={mate.id} className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted text-foreground text-base font-bold flex items-center justify-center">
                      {getInitials(mate.name)}
                    </div>
                    <span className="text-lg text-foreground">{mate.name}</span>
                  </div>
                  <div className={cn("text-lg font-bold", mate.amount < 0 ? "text-destructive" : mate.amount > 0 ? "text-primary" : "text-muted-foreground")}>
                    {mate.amount > 0 ? "+" : mate.amount < 0 ? "-" : ""}{formatMoney(Math.abs(mate.amount), budgetCurrency)}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <Button variant="outline" className="rounded-full h-10 text-sm font-bold" onClick={() => toast({ title: "Transaction history coming soon" })}>
                <ReceiptText className="w-4 h-4 mr-2" /> Transaction history
              </Button>
              <Button variant="outline" className="rounded-full h-10 text-sm font-bold" onClick={() => toast({ title: "Currency switch coming soon" })}>
                <DollarSign className="w-4 h-4 mr-2" /> Change currency
              </Button>
            </div>

            <Button className="w-full rounded-full h-10 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold" onClick={() => toast({ title: currentUserBalance < 0 ? "You owe the group" : currentUserBalance > 0 ? "The group owes you" : "You're settled up" })}>
              Settle up
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl border border-border/60 shadow-elevated p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center">Share Trip & Invite Tripmates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="Invite by email"
              type="email"
              className="h-12 rounded-2xl text-base"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="rounded-2xl h-12 font-bold text-sm" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" /> Copy link
              </Button>
              <Button
                type="button"
                className="rounded-2xl h-12 font-bold text-sm"
                disabled={shareSubmitting || !trip}
                onClick={async () => {
                  const success = await inviteCollaborator(shareEmail, "share");
                  if (success) {
                    setShareEmail("");
                    setShareDialogOpen(false);
                  }
                }}
              >
                {shareSubmitting ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseSettingsOpen} onOpenChange={setExpenseSettingsOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border border-border/60 shadow-elevated p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center">Expense settings</DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-8">
            <div className="flex items-start justify-between gap-5">
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-foreground">Simplify group expenses</h3>
                <p className="text-muted-foreground text-sm leading-7 mt-3">
                  We'll do the math for you. Settle your group expenses with fewer transactions at the end of your trip.
                </p>
              </div>
              <Switch
                checked={simplifyGroupExpenses}
                onCheckedChange={setSimplifyGroupExpenses}
                className="mt-1 h-[12px] w-[60px] rounded-full border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [&>span]:!h-[16px] [&>span]:!w-[16px] [&>span[data-state=checked]]:translate-x-[42px] [&>span[data-state=unchecked]]:translate-x-[2px] data-[state=checked]:bg-primary/70 data-[state=unchecked]:bg-muted"
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-foreground">Default currency</h3>
              <Select value={defaultCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-full h-auto rounded-3xl border border-border bg-card px-5 py-4">
                  <div className="flex items-center gap-4 text-left">
                    {(() => {
                      const selectedCurrency = CURRENCY_OPTIONS.find((option) => option.symbol === defaultCurrency) || CURRENCY_OPTIONS[0];
                      return (
                        <>
                          <span className="text-3xl leading-none">{selectedCurrency.flag}</span>
                          <div>
                            <div className="text-lg font-medium text-foreground">{selectedCurrency.label}</div>
                            <div className="text-sm text-muted-foreground mt-1">{selectedCurrency.code}</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.symbol} value={option.symbol}>
                      {option.flag} {option.label} ({option.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-5">
              <div className="max-w-md">
                <h3 className="text-xl font-bold text-foreground">Export as CSV</h3>
                <p className="text-muted-foreground text-sm leading-7 mt-3">
                  Download your trip expenses as a CSV file.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={exportExpensesAsCsv}
                className="rounded-full h-12 px-6 bg-muted hover:bg-muted/80 text-foreground font-bold"
              >
                <FileText className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripPage;
