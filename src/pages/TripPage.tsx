import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { 
  Calendar, MapPin, Share2, Trash2, Plus, 
  MoreHorizontal, ChevronRight, Info, Video, 
  Image as ImageIcon, DollarSign, Wallet, 
  Map as MapIcon, Plane, Bed, Car, Utensils, 
  Train, Bus, Anchor, Ship, Ticket, Globe,
  Compass, Clock, Star, MessageSquare, 
  ChevronDown, Search, ArrowLeft, Menu, X,
  LayoutDashboard, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import ActivityDetailDialog from "@/components/ActivityDetailDialog";
import AddActivityDialog from "@/components/AddActivityDialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  name: string;
  description: string;
  timeOfDay: string;
  sortOrder: number;
  photoUrl?: string;
  rating?: number;
  openTime?: string;
  closeTime?: string;
  ticketPrice?: string;
  duration?: string;
  youtubeVideos?: any[];
  whyVisit?: string;
  [key: string]: any;
}

interface Day {
  id?: string;
  dayNumber: number;
  date: string;
  city: string;
  country: string;
  activities: Activity[];
}

const TripPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  
  // Sidebar & Navigation State (Original UI)
  const [activeSection, setActiveSection] = useState("itinerary");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const mainRef = useRef<HTMLDivElement>(null);

  // Dialog State
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [addActivityDayIndex, setAddActivityDayIndex] = useState<number | null>(null);
  const [budget, setBudget] = useState<number>(2500);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data: tripData, error: tripErr } = await supabase.from("trips").select("*").eq("id", id).single();
        if (tripErr) throw tripErr;
        setTrip(tripData);
        if (user && tripData.user_id === user.id) setCanEdit(true);

        const { data: daysData, error: daysErr } = await supabase.from("itinerary_days").select("*, activities(*)").eq("trip_id", id).order("day_number", { ascending: true });
        if (daysErr) throw daysErr;

        const transformedDays = daysData.map((day: any) => ({
          id: day.id,
          dayNumber: day.day_number,
          date: day.date ? format(new Date(day.date), "MMMM dd") : `Day ${day.day_number}`,
          city: day.city || "City",
          country: day.country || "Country",
          activities: (day.activities || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((act: any) => ({
              ...act,
              timeOfDay: act.time_of_day || "morning",
              photoUrl: act.photo_url || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1070&auto=format&fit=crop",
              rating: act.rating || 4.8,
              youtubeVideos: act.youtube_videos || []
            }))
        }));

        setItinerary(transformedDays);
        
        // --- STEP: Trigger Background Enrichment (Propagating to restored UI) ---
        const needsEnrichment = transformedDays.some(day => 
          day.activities.some((act: any) => !act.youtubeVideos || act.youtubeVideos.length === 0)
        );
        if (needsEnrichment) {
          console.log("[TripPage] 🚀 Starting Background Immersive Media Worker...");
          supabase.functions.invoke("enrich-trip", { body: { tripId: id } });
        }
      } catch (err: any) {
        console.error("Failed to fetch trip", err);
        navigate("/account");
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

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse font-display">Opening your travel journal...</p>
      </div>
    );
  }

  const cities = [...new Set(itinerary.map(d => d.city))];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden pt-16">
        {/* ORIGINAL SIDEBAR: Left Navigation Section */}
        <aside className={cn(
          "bg-card border-r border-border transition-all duration-300 flex flex-col z-20",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden sm:w-20"
        )}>
          <div className="flex-1 py-6 px-4 space-y-2">
            {[
              { id: "overview", label: "Explore", icon: Compass },
              { id: "itinerary", label: "Itinerary", icon: BookOpen },
              { id: "budget", label: "Budget", icon: Wallet },
              { id: "reservations", label: "Reservations", icon: Ticket },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium",
                  activeSection === item.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={cn("transition-opacity", !sidebarOpen && "sm:hidden")}>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => navigate("/account")}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className={cn(!sidebarOpen && "sm:hidden")}>Exit Journal</span>
            </Button>
          </div>
        </aside>

        {/* ORIGINAL RIGHT SECTION: Details with Independent Scroll */}
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-muted/20 custom-scrollbar relative">
          <div className="container max-w-5xl mx-auto px-6 py-8 pb-24">
            
            {/* Header within Right Section */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest mb-3">
                <Globe className="w-4 h-4" /> {trip?.companion || "Solo Voyage"} 
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
                {cities.join(" → ") || "New Adventure"}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-full border border-border shadow-sm text-sm">
                  <Calendar className="w-4 h-4" /> {itinerary.length} Days
                </span>
                <span className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-full border border-border shadow-sm text-sm">
                  <MapPin className="w-4 h-4" /> {cities.length} {cities.length === 1 ? "City" : "Cities"}
                </span>
                <Badge className="bg-primary/10 text-primary border-none px-3 py-1">
                   {trip?.budget_tier || "Balanced"}
                </Badge>
              </div>
            </div>

            {/* Render Section based on activeSection */}
            {activeSection === "itinerary" && (
              <div className="space-y-10">
                {itinerary.map((day, dayIdx) => (
                  <div key={day.dayNumber} className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <button 
                      onClick={() => toggleDay(dayIdx)}
                      className="w-full flex items-center justify-between p-8 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex flex-col items-center justify-center text-primary-foreground shadow-lg">
                          <span className="text-[10px] uppercase font-bold opacity-80">Day</span>
                          <span className="text-xl font-bold leading-none">{day.dayNumber}</span>
                        </div>
                        <div className="text-left">
                          <h2 className="text-2xl font-display font-bold text-foreground">{day.city}</h2>
                          <p className="text-sm text-muted-foreground">{day.date} · {day.activities.length} Activities</p>
                        </div>
                      </div>
                      <ChevronDown className={cn("w-6 h-6 text-muted-foreground transition-transform duration-300", expandedDays.has(dayIdx) && "rotate-180")} />
                    </button>

                    {expandedDays.has(dayIdx) && (
                      <div className="px-8 pb-8 space-y-6">
                        {day.activities.map((activity, actIdx) => (
                          <div 
                            key={activity.id}
                            className="group relative flex gap-6 p-4 rounded-[2rem] hover:bg-muted/50 transition-all cursor-pointer"
                            onClick={() => setSelectedActivity(activity)}
                          >
                            <div className="w-32 h-32 rounded-3xl overflow-hidden shrink-0 border-2 border-border group-hover:border-primary/30 transition-colors">
                              <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 pt-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-display font-bold text-foreground">{activity.name}</h3>
                                <Badge className="bg-background text-primary border-primary/20">{activity.timeOfDay}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">{activity.description}</p>
                              <div className="flex gap-4 text-xs font-bold text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {activity.duration || "1.5h"}</span>
                                <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> {activity.ticketPrice || "Free"}</span>
                                <span className="flex items-center gap-1.5 text-primary"><Star className="w-3.5 h-3.5 fill-primary" /> {activity.rating || 4.8}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {canEdit && (
                          <Button variant="outline" className="w-full py-6 rounded-2xl border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={() => setAddActivityDayIndex(dayIdx)}>
                            <Plus className="w-4 h-4 mr-2" /> Add a New Activity
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeSection === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-[2.5rem] p-10 space-y-6">
                  <h2 className="text-3xl font-display font-bold mb-4">Journey Highlights</h2>
                  <p className="text-muted-foreground leading-relaxed">This curated stay in {cities.join(" and ")} has been specifically tailored to your {trip?.purpose || "leisure"} goals. You'll experience a perfect blend of high-fidelity local landmarks and hidden culinary gems.</p>
                  <div className="h-48 bg-muted rounded-3xl relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1470&auto=format&fit=crop" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                       <Button className="rounded-full bg-white text-black hover:bg-white/90">View Interactive Map</Button>
                    </div>
                  </div>
                </div>
                <div className="bg-primary rounded-[2.5rem] p-10 text-primary-foreground">
                   <Sparkles className="w-10 h-10 mb-6 opacity-80" />
                   <h2 className="text-3xl font-display font-bold mb-4">Master AI Tip</h2>
                   <p className="opacity-90 leading-relaxed mb-6">"Since you chose a {trip?.pace || 'moderate'} pace, I recommend visiting teamLab Borderless early in the morning to beat the crowds while maintaining your morning energy."</p>
                   <Button variant="secondary" className="w-full rounded-2xl h-12 font-bold">Ask AI Designer</Button>
                </div>
              </div>
            )}

            {activeSection === "budget" && (
               <div className="space-y-8">
                  <div className="bg-card border border-border rounded-[2.5rem] p-12 text-center">
                    <Wallet className="w-16 h-16 text-primary mx-auto mb-6 opacity-20" />
                    <h2 className="text-4xl font-display font-bold mb-2">${budget}</h2>
                    <p className="text-muted-foreground mb-8">Estimated remaining balance for your voyage</p>
                    <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-12">
                       <div className="bg-primary h-full w-[15%]" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 bg-muted/40 rounded-3xl"><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Spent</p><p className="text-xl font-bold">$345.00</p></div>
                       <div className="p-6 bg-muted/40 rounded-3xl"><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Planned</p><p className="text-xl font-bold">$2,155.00</p></div>
                    </div>
                  </div>
               </div>
            )}
          </div>
        </main>
      </div>

      <AddActivityDialog open={addActivityDayIndex !== null} onOpenChange={open => !open && setAddActivityDayIndex(null)} onSelect={() => toast({ title: "Mock add successful" })} />
      <ActivityDetailDialog activity={selectedActivity} open={!!selectedActivity} onOpenChange={open => !open && setSelectedActivity(null)} />
    </div>
  );
};

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);

export default TripPage;
