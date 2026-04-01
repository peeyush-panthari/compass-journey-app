import { useState, useEffect } from "react";
import { 
  Star, Clock, MapPin, Ticket, GripVertical, Plus, Trash2, Share2, Copy, Check, Plane,
  ChevronDown, MapPinned, Hotel, Car, UtensilsCrossed, Paperclip, Navigation, 
  Search, X, Calendar, MoreHorizontal, ExternalLink, Play, Camera, StarHalf, Info
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { format } from "date-fns";
import ActivityDetailDialog, { type ActivityDetail } from "@/components/ActivityDetailDialog";
import AddActivityDialog, { type PlaceResult } from "@/components/AddActivityDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

type Activity = ActivityDetail;

interface Day {
  dayNumber: number;
  date: string;
  city: string;
  country: string;
  activities: Activity[];
}

const CITY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {};
const CITY_PALETTE = [
  { bg: "bg-primary/8", border: "border-primary/25", text: "text-primary", dot: "bg-primary" },
  { bg: "bg-accent/8", border: "border-accent/25", text: "text-accent-foreground", dot: "bg-accent" },
  { bg: "bg-sea-foam/8", border: "border-sea-foam/25", text: "text-foreground", dot: "bg-sea-foam" },
  { bg: "bg-coral/8", border: "border-coral/25", text: "text-foreground", dot: "bg-coral" },
  { bg: "bg-gold/8", border: "border-gold/25", text: "text-foreground", dot: "bg-gold" },
];

let colorIndex = 0;
const getCityColor = (city: string) => {
  if (!CITY_COLORS[city]) {
    CITY_COLORS[city] = CITY_PALETTE[colorIndex % CITY_PALETTE.length];
    colorIndex++;
  }
  return CITY_COLORS[city];
};

const TIME_PERIODS = ["morning", "afternoon", "evening"] as const;
const timeLabels = {
  morning: { label: "Morning", color: "bg-gold/10 text-gold-dark", border: "border-gold/20" },
  afternoon: { label: "Afternoon", color: "bg-primary/10 text-primary", border: "border-primary/20" },
  evening: { label: "Evening", color: "bg-coral/10 text-coral", border: "border-coral/20" },
};

const makeDropId = (dayIndex: number, time: string) => `${dayIndex}-${time}`;
const parseDropId = (id: string) => {
  const [dayStr, ...rest] = id.split("-");
  return { dayIndex: parseInt(dayStr), timeOfDay: rest.join("-") as Activity["timeOfDay"] };
};

const TripPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareEmail, setShareEmail] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [addActivityDayIndex, setAddActivityDayIndex] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('trips')
          .select(`
            *,
            itinerary_days (
              *,
              activities (*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Trip not found");

        setTrip(data);
        setIsPublic(data.status === 'published');
        setCanEdit(data.user_id === user?.id);

        const mappedDays = data.itinerary_days
          .sort((a: any, b: any) => a.day_number - b.day_number)
          .map((day: any) => ({
            dayNumber: day.day_number,
            date: day.date ? format(new Date(day.date), "MMMM dd") : `Day ${day.day_number}`,
            city: day.city || data.countries?.[0] || "Destination",
            country: day.country || "Country",
            activities: day.activities
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((act: any) => ({
                ...act,
                id: act.id,
                name: act.name,
                address: act.address || "",
                rating: act.rating || 4.8,
                openTime: act.open_time,
                closeTime: act.close_time,
                duration: act.duration,
                ticketPrice: act.ticket_price,
                description: act.description,
                photoUrl: act.photo_url,
                timeOfDay: act.time_of_day || "morning",
                bestTimeToVisit: act.best_time_to_visit,
                travelTimeFromPrevious: act.travel_time_from_previous,
                googleMapsUrl: act.google_maps_url,
                photos: act.photos || [],
                youtubeVideos: act.youtube_videos || [],
                whyVisit: act.why_visit,
                foodSuggestions: act.food_suggestions,
                hiddenGems: act.hidden_gems,
                photoSpots: act.photo_spots,
                restStops: act.rest_stops
              }))
          }));

        setItinerary(mappedDays);
      } catch (err: any) {
        console.error("Failed to fetch trip", err);
        toast({ title: "Error", description: "Could not load itinerary.", variant: "destructive" });
        if (!authLoading) navigate("/account");
      } finally {
        setLoading(false);
      }
    };

    if (id && !authLoading) fetchTrip();
  }, [id, user, authLoading, navigate]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !canEdit) return;

    const src = parseDropId(result.source.droppableId);
    const dst = parseDropId(result.destination.droppableId);

    setItinerary((prev) => {
      const next = prev.map((d) => ({ ...d, activities: [...d.activities] }));

      const srcDayActivities = next[src.dayIndex].activities;
      const srcTimeActivities = srcDayActivities.filter((a) => a.timeOfDay === src.timeOfDay);
      const movedActivity = srcTimeActivities[result.source.index];

      if (!movedActivity) return prev;

      next[src.dayIndex].activities = srcDayActivities.filter((a) => a.id !== movedActivity.id);
      movedActivity.timeOfDay = dst.timeOfDay;

      const dstDayActivities = next[dst.dayIndex].activities;
      const dstTimeActivities = dstDayActivities.filter((a) => a.timeOfDay === dst.timeOfDay);

      dstTimeActivities.splice(result.destination.index, 0, movedActivity);

      const rebuilt: Activity[] = [];
      for (const tp of TIME_PERIODS) {
        if (tp === dst.timeOfDay) {
          rebuilt.push(...dstTimeActivities);
        } else {
          rebuilt.push(...dstDayActivities.filter((a) => a.timeOfDay === tp));
        }
      }
      next[dst.dayIndex].activities = rebuilt;

      return next;
    });
    
    toast({ title: "Itinerary updated" });
  };

  const deleteActivity = (dayIndex: number, activityId: string) => {
    setItinerary(prev => prev.map((day, i) => i === dayIndex ? { ...day, activities: day.activities.filter(a => a.id !== activityId) } : day));
    toast({ title: "Activity removed" });
  };

  const addDay = () => {
    const n = itinerary.length + 1;
    const lastDay = itinerary[itinerary.length - 1];
    const newDay: Day = {
      dayNumber: n,
      date: `Day ${n}`,
      city: lastDay?.city || "New Destination",
      country: lastDay?.country || "",
      activities: []
    };
    setItinerary(prev => [...prev, newDay]);
    toast({ title: `Day ${n} added` });
  };

  const deleteDay = (dayIndex: number) => {
    if (itinerary.length <= 1) {
      toast({ title: "Cannot delete", description: "You need at least one day in your journey.", variant: "destructive" });
      return;
    }
    setItinerary(prev => prev.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, dayNumber: i + 1 })));
    toast({ title: "Day removed" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
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
        {/* Header Section (Exact Globegenie Mapping) */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              {cities.join(" \u2192 ") || "Your Journey"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{itinerary.length} Days \u00b7 {itinerary[0]?.date} \u2013 {itinerary[itinerary.length - 1]?.date}</span>
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
                    <AlertDialogDescription>
                      Are you sure you want to delete this trip? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTrip} disabled={isDeletingTrip} className="rounded-xl bg-destructive">
                      {isDeletingTrip ? "Deleting..." : "Delete Trip"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-ocean-gradient text-white font-bold rounded-xl shadow-md px-6">
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">Share Journey</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-2">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border border-border/60">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Public Sharing</Label>
                      <p className="text-[10px] text-muted-foreground">Anyone with the link can view</p>
                    </div>
                    <Switch checked={isPublic} onCheckedChange={async (val) => {
                      await supabase.from('trips').update({ status: val ? 'published' : 'draft' }).eq('id', id);
                      setIsPublic(val);
                      toast({ title: val ? "Published" : "Private" });
                    }} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold ml-1">Invite Collaborators</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Email address" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="rounded-xl" />
                      <Button onClick={() => toast({ title: "Invite Sent!" })} className="bg-primary rounded-xl px-5 font-bold">Invite</Button>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full rounded-xl h-11 font-bold border-2" onClick={copyLink}>
                    {linkCopied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                    {linkCopied ? "Link Copied!" : "Copy Journey Link"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Itinerary Timeline (Drag \u0026 Drop Parity) */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-4">
            {itinerary.map((day, dayIndex) => {
              const prevDay = dayIndex > 0 ? itinerary[dayIndex - 1] : null;
              const isNewCity = !prevDay || prevDay.city !== day.city;
              const cityColor = getCityColor(day.city);
              const daysInCity = itinerary.filter(d => d.city === day.city).length;

              return (
                <div key={day.dayNumber}>
                  {/* City Change Visual Indicator */}
                  {isNewCity && (
                    <>
                      {dayIndex > 0 && (
                        <div className="flex items-center justify-center gap-3 my-8">
                          <div className="h-px flex-1 bg-border/60" />
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/40 px-4 py-1.5 rounded-full border border-border/40">
                            <Plane className="w-3.5 h-3.5 rotate-45" />
                            <span>Moving to {day.city}</span>
                          </div>
                          <div className="h-px flex-1 bg-border/60" />
                        </div>
                      )}
                      <div className={`rounded-2xl ${cityColor.bg} border ${cityColor.border} p-5 mb-5 shadow-sm`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${cityColor.dot} animate-pulse`} />
                          <div>
                            <h2 className="text-xl font-display font-bold text-foreground">{day.city}, {day.country}</h2>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-80">{daysInCity} Day Stopover</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <section className={`ml-4 sm:ml-6 pl-6 sm:pl-8 border-l-2 ${cityColor.border} pb-8 relative`}>
                    {/* Day Pill Positioning */}
                    <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-background border-2 ${cityColor.border} flex items-center justify-center z-10 shadow-sm`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cityColor.dot}`} />
                    </div>

                    <div className="flex items-center justify-between mb-5 sticky top-20 z-20 bg-background/95 backdrop-blur-md py-2 -mx-4 px-4 rounded-xl shadow-sm border border-border/20">
                      <h3 className="text-lg font-display font-bold text-foreground">
                        Day {day.dayNumber} <span className="text-muted-foreground font-normal text-base ml-2 opacity-60">/ {day.date}</span>
                      </h3>
                      {canEdit && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-8 rounded-lg" onClick={() => deleteDay(dayIndex)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                        </Button>
                      )}
                    </div>

                    {/* Morning / Afternoon / Evening Buckets */}
                    {TIME_PERIODS.map((tp) => {
                      const label = timeLabels[tp];
                      const activities = day.activities.filter(a => a.timeOfDay === tp);

                      return (
                        <Droppable key={tp} droppableId={makeDropId(dayIndex, tp)}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`mb-6 rounded-2xl border-2 border-dashed transition-all p-2 ${snapshot.isDraggingOver ? `${label.border} bg-primary/5` : "border-transparent"}`}
                            >
                              <div className="flex items-center gap-3 mb-3 px-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${label.color} ${label.border} border`}>
                                  {label.label}
                                </span>
                                {activities.length === 0 && (
                                  <span className="text-[10px] text-muted-foreground italic opacity-50">Drop activities here</span>
                                )}
                              </div>

                              <div className="space-y-3">
                                {activities.map((activity, i) => (
                                  <Draggable key={activity.id} draggableId={activity.id} index={i} isDragDisabled={!canEdit}>
                                    {(prov, snap) => (
                                      <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        className={`group flex items-center gap-4 bg-card rounded-2xl border border-border/60 p-3 pr-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${snap.isDragging ? "shadow-xl ring-2 ring-primary/20 scale-105 z-50 bg-white" : ""}`}
                                        onClick={() => !snap.isDragging && setSelectedActivity(activity)}
                                      >
                                        <div {...prov.dragHandleProps} className="shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors">
                                          {canEdit && <GripVertical className="w-5 h-5" />}
                                        </div>

                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-muted relative shadow-inner">
                                          <img src={activity.photoUrl || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1070"} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                          <div className="absolute top-1 right-1 bg-black/40 backdrop-blur-md rounded-md p-0.5">
                                            <Camera className="w-2.5 h-2.5 text-white" />
                                          </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-foreground text-sm flex items-center gap-2 truncate">
                                            {activity.name}
                                            {activity.youtubeVideos?.length! > 0 && <span className="bg-destructive/10 text-destructive text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1"><Play className="w-2 h-2 fill-destructive" /> VLOG</span>}
                                          </h4>
                                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5 text-[11px] text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1 bg-amber-500/5 text-amber-600 px-1.5 py-0.5 rounded-md">
                                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {activity.rating}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" /> {activity.duration || '2h'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Ticket className="w-3 h-3" /> {activity.ticketPrice || 'Free'}
                                            </span>
                                          </div>
                                        </div>

                                        {canEdit && (
                                          <button onClick={(e) => { e.stopPropagation(); deleteActivity(dayIndex, activity.id); }} className="shrink-0 p-2 text-muted-foreground/30 hover:text-destructive transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </div>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}

                    {canEdit && (
                      <Button variant="outline" size="sm" className="w-full border-dashed mt-2 text-xs h-10 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all font-bold" onClick={() => setAddActivityDayIndex(dayIndex)}>
                        <Plus className="w-3.5 h-3.5 mr-2" /> Add {day.city} Hub
                      </Button>
                    )}
                  </section>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {canEdit && (
          <div className="mt-12 flex justify-center">
            <Button variant="outline" className="border-dashed border-2 px-12 h-14 rounded-2xl font-bold text-lg shadow-sm hover:shadow-md transition-all group" onClick={addDay}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                Extend Journey by 1 Day
              </div>
            </Button>
          </div>
        )}

        <AddActivityDialog
          open={addActivityDayIndex !== null}
          onOpenChange={(open) => !open && setAddActivityDayIndex(null)}
          onSelect={(place) => {
            if (addActivityDayIndex === null) return;
            const newAct: ActivityDetail = {
              id: Math.random().toString(36).substr(2, 9),
              name: place.name,
              address: place.address,
              rating: place.rating,
              openTime: place.openTime,
              closeTime: place.closeTime,
              duration: place.duration,
              ticketPrice: place.ticketPrice,
              description: place.description,
              photoUrl: place.photoUrl,
              timeOfDay: place.timeOfDay,
            };
            setItinerary(prev => prev.map((d, i) => i === addActivityDayIndex ? { ...d, activities: [...d.activities, newAct] } : d));
            toast({ title: "Hub added to itinerary" });
          }}
        />

        <ActivityDetailDialog
          activity={selectedActivity}
          open={!!selectedActivity}
          onOpenChange={(open) => !open && setSelectedActivity(null)}
        />
      </div>
    </div>
  );
};

export default TripPage;
