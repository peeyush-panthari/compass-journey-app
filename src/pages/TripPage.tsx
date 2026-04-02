import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import {
  Calendar, MapPin, Share2, Trash2, Plus,
  MoreHorizontal, ChevronRight, Info, Video,
  Image as ImageIcon, DollarSign, Wallet,
  Map as MapIcon, Plane, Bed, Car, Utensils,
  Train, Bus, Anchor, Ship, Ticket, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import ActivityDetailDialog from "@/components/ActivityDetailDialog";
import AddActivityDialog from "@/components/AddActivityDialog";
import { useAuth } from "@/contexts/AuthContext";

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
  googlePlaceId?: string;
  photos?: string[];
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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [addActivityDayIndex, setAddActivityDayIndex] = useState<number | null>(null);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Expenses & Reservations state (Original UI)
  const [expenses, setExpenses] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [budget, setBudget] = useState<number | null>(2000);
  const [setBudgetOpen, setSetBudgetOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState<string | null>(null);

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
          city: day.city || tripData.countries?.[0] || "City",
          country: day.country || "Country",
          activities: (day.activities || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((act: any) => ({
              ...act,
              id: act.id,
              timeOfDay: act.time_of_day || "morning",
              photoUrl: act.photo_url || (act.photos?.[0]) || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1070&auto=format&fit=crop",
              rating: act.rating || 4.8,
              youtubeVideos: act.youtube_videos || []
            }))
        }));

        setItinerary(transformedDays);

        // --- STEP: Trigger Background Enrichment (Logic Parity) ---
        const needsEnrichment = transformedDays.some(day => day.activities.some((act: any) => !act.youtubeVideos || act.youtubeVideos.length === 0));
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

  const handleDeleteTrip = async () => {
    if (!id) return;
    try {
      setIsDeletingTrip(true);
      await supabase.from('trips').delete().eq('id', id);
      toast({ title: "Trip deleted" });
      navigate("/account");
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete trip.", variant: "destructive" });
      setIsDeletingTrip(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceDayIndex = itinerary.findIndex(d => `day-${d.dayNumber}` === source.droppableId);
    const destDayIndex = itinerary.findIndex(d => `day-${d.dayNumber}` === destination.droppableId);

    const newItinerary = [...itinerary];
    const [movedActivity] = newItinerary[sourceDayIndex].activities.splice(source.index, 1);
    newItinerary[destDayIndex].activities.splice(destination.index, 0, movedActivity);
    setItinerary(newItinerary);

    // Sync with DB (Simplified for re-render)
    await Promise.all(newItinerary[destDayIndex].activities.map((act, idx) =>
      supabase.from('activities').update({ sort_order: idx, day_id: newItinerary[destDayIndex].id }).eq('id', act.id)
    ));
    toast({ title: "Itinerary updated" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Navbar />
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse font-display">Gathering your trip details...</p>
      </div>
    );
  }

  const cities = [...new Set(itinerary.map((d) => d.city))];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 max-w-4xl">
        {/* ORIGINAL Aesthetic: Bold Header Section */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              {cities.join(" → ") || "Your Journey"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{itinerary.length} Days · {itinerary[0]?.date} – {itinerary[itinerary.length - 1]?.date}</span>
              <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20">{trip?.budget_tier || 'Balanced'}</Badge>
            </div>
          </div>

          <div className="flex gap-2.5">
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl shadow-sm">
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-2xl">Delete Itinerary</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. All your curated stops will be lost.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl border-none bg-muted">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTrip} className="rounded-2xl bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl shadow-sm">
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-none shadow-2xl p-8 max-w-md">
                <DialogHeader className="text-center">
                  <DialogTitle className="font-display text-3xl mb-2">Share Trip</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  <div className="flex bg-muted rounded-2xl p-2 items-center gap-2">
                    <Input readOnly value={window.location.href} className="border-none shadow-none bg-transparent h-10 text-sm focus-visible:ring-0" />
                    <Button onClick={copyLink} size="sm" className="rounded-xl px-4 font-semibold">{linkCopied ? "Copied!" : "Copy"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ORIGINAL Aesthetic: Tabs System */}
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-8 rounded-2xl w-full sm:w-auto h-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="itinerary" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Itinerary</TabsTrigger>
            <TabsTrigger value="details" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Details</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Expenses</TabsTrigger>
            <TabsTrigger value="reservations" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Reservations</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="space-y-12">
                {itinerary.map((day, dayIndex) => (
                  <div key={day.dayNumber} className="relative">
                    <div className="flex items-center justify-between mb-6 sticky top-24 bg-background/80 backdrop-blur-md z-10 py-2">
                      <div className="flex items-baseline gap-3">
                        <Badge variant="secondary" className="rounded-lg px-2.5 py-1 text-sm bg-primary/10 text-primary border-none">Day {day.dayNumber}</Badge>
                        <h2 className="text-xl font-display font-bold text-foreground">{day.date} · {day.city}</h2>
                      </div>
                      {canEdit && (
                        <Button variant="ghost" size="sm" className="rounded-lg text-primary hover:bg-primary/5" onClick={() => setAddActivityDayIndex(dayIndex)}>
                          <Plus className="w-4 h-4 mr-1" /> Add Activity
                        </Button>
                      )}
                    </div>

                    <Droppable droppableId={`day-${day.dayNumber}`}>
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {day.activities.map((activity, index) => (
                            <Draggable key={activity.id} draggableId={activity.id} index={index} isDragDisabled={!canEdit}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300"
                                  onClick={() => setSelectedActivity(activity)}>
                                  <div className="flex flex-col sm:flex-row h-full">
                                    <div className="w-full sm:w-48 h-48 sm:h-auto relative shrink-0 overflow-hidden">
                                      <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                                        <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none text-[10px] capitalize font-semibold shadow-sm">{activity.timeOfDay}</Badge>
                                        {activity.rating && <Badge className="bg-background/80 backdrop-blur-md text-primary border-none text-[10px] items-center gap-0.5 shadow-sm">★ {activity.rating}</Badge>}
                                      </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                      <div>
                                        <div className="flex justify-between items-start mb-2">
                                          <h3 className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">{activity.name}</h3>
                                          {activity.youtubeVideos && activity.youtubeVideos.length > 0 && <Video className="w-4 h-4 text-red-500" />}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">{activity.description}</p>
                                      </div>
                                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                                          <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> {activity.ticketPrice || 'Varies'}</span>
                                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{activity.duration || '2h'}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          </TabsContent>

          <TabsContent value="details" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="text-xl font-display font-bold flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> Trip Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm py-3 border-b border-border/50"><span className="text-muted-foreground">Destination</span><span className="font-semibold">{cities.join(", ")}</span></div>
                  <div className="flex justify-between text-sm py-3 border-b border-border/50"><span className="text-muted-foreground">Duration</span><span className="font-semibold">{itinerary.length} Days</span></div>
                  <div className="flex justify-between text-sm py-3 border-b border-border/50"><span className="text-muted-foreground">Companions</span><span className="font-semibold capitalize">{trip?.companion || 'Solo'}</span></div>
                  <div className="flex justify-between text-sm py-3"><span className="text-muted-foreground">Budget Tier</span><Badge variant="secondary" className="bg-primary/10 text-primary capitalize">{trip?.budget_tier || 'Balanced'}</Badge></div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-display font-bold flex items-center gap-2 mb-6"><Globe className="w-5 h-5 text-primary" /> Region Overview</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">Enjoy a curated stay across {cities.join(" and ")}. This itinerary blends historical discovery with high-fidelity local culinary experiences, specifically tailored for a {trip?.purpose || 'leisure'} voyage.</p>
                <Button className="w-full rounded-2xl h-11" variant="outline"><MapIcon className="w-4 h-4 mr-2" /> View Full Map</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6 pt-4">
            <div className="bg-primary/5 rounded-3xl p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-sm text-primary font-semibold mb-1">Total Budget Spent</p>
                <h4 className="text-4xl font-display font-bold text-foreground">$0.00 <span className="text-lg text-muted-foreground font-normal">/ ${budget || 0}</span></h4>
              </div>
              <Button onClick={() => setSetBudgetOpen(true)} variant="outline" className="rounded-2xl h-11 border-primary/20 hover:bg-primary/5">Set Budget</Button>
            </div>
            <div className="bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center py-20 min-h-[300px]">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <h4 className="text-xl font-display font-bold mb-2">No Expenses Yet</h4>
              <p className="text-muted-foreground text-sm max-w-xs mb-6">Track your travel costs and split bills with friends directly from your itinerary.</p>
              <Button className="rounded-2xl h-11 px-8"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="space-y-8 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Flight', 'Lodging', 'Rental car', 'Restaurant', 'Train', 'Bus', 'Ferry', 'Cruise'].map((type) => (
                <Button key={type} variant="outline" className="h-auto py-6 flex-col gap-3 rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all group" onClick={() => setReservationDialogOpen(type)}>
                  {type === 'Flight' && <Plane className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  {type === 'Lodging' && <Bed className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  {type === 'Rental car' && <Car className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  {type === 'Restaurant' && <Utensils className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  {type === 'Train' && <Train className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  {type === 'Bus' && <Bus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  {type === 'Ferry' && <Anchor className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  {type === 'Cruise' && <Ship className="w-6 h-6 text-muted-foreground group-hover:text-primary" />}
                  <span className="text-xs font-semibold">{type}</span>
                </Button>
              ))}
            </div>
            <div className="bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center py-20">
              <Ticket className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <h4 className="text-xl font-display font-bold mb-2">Reservations Hub</h4>
              <p className="text-muted-foreground text-sm max-w-xs">Organize your flight tickets, hotel bookings, and restaurant reservations in one central location.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

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

      {/* Reservation Dialog (Simplified original structure) */}
      <Dialog open={reservationDialogOpen !== null} onOpenChange={(open) => !open && setReservationDialogOpen(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader><DialogTitle className="font-display text-2xl text-center">Add {reservationDialogOpen}</DialogTitle></DialogHeader>
          <form className="space-y-4 mt-4" onSubmit={(e) => { e.preventDefault(); setReservationDialogOpen(null); toast({ title: "Reservation added" }); }}>
            <div className="space-y-2"><label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wider">Title</label><Input placeholder="e.g. Flight to Paris" className="rounded-xl h-12 bg-muted border-none" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wider">Details</label><Input placeholder="Confirmation #, Time, etc." className="rounded-xl h-12 bg-muted border-none" /></div>
            <Button type="submit" className="w-full rounded-2xl h-12 font-bold mt-4">Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AddActivityDialog open={addActivityDayIndex !== null} onOpenChange={open => !open && setAddActivityDayIndex(null)} onSelect={() => toast({ title: "Activity logic pending" })} />
      <ActivityDetailDialog activity={selectedActivity} open={!!selectedActivity} onOpenChange={open => !open && setSelectedActivity(null)} />
    </div>
  );
};

export default TripPage;
