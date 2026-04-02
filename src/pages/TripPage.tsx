import { useState, useEffect } from "react";
import { Star, Clock, MapPin, Ticket, GripVertical, Plus, Trash2, Share2, Copy, Check, Plane } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import AddActivityDialog, { type PlaceResult } from "@/components/AddActivityDialog";
import ActivityDetailDialog, { type ActivityDetail } from "@/components/ActivityDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient"; // Fixed import for current project structure
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

let nextId = 100;

const makeDropId = (dayIndex: number, time: string) => `${dayIndex}-${time}`;
const parseDropId = (id: string) => {
  const [dayStr, ...rest] = id.split("-");
  return { dayIndex: parseInt(dayStr), timeOfDay: rest.join("-") as Activity["timeOfDay"] };
};

const TripPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
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
        
        const transformedDays = data.itinerary_days
          .sort((a: any, b: any) => a.day_number - b.day_number)
          .map((day: any, idx: number) => {
            return {
              dayNumber: day.day_number,
              date: day.date ? format(new Date(day.date), "MMMM dd") : `Day ${day.day_number}`,
              city: day.city || data.countries?.[0] || "City",
              country: day.country || "Country",
              activities: day.activities
               .sort((a: any, b: any) => a.sort_order - b.sort_order)
               .map((act: any) => {
                const photos = Array.isArray(act.photos) ? act.photos : [];
                return {
                  ...act,
                  photoUrl: act.photo_url || (photos.length > 0 ? photos[0] : "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1070&auto=format&fit=crop"),
                  photos,
                  rating: act.rating ? Number(act.rating) : 4.8,
                  openTime: act.open_time,
                  closeTime: act.close_time,
                  ticketPrice: act.ticket_price,
                  duration: act.duration,
                  timeOfDay: act.time_of_day || "morning",
                  youtubeVideos: act.youtube_videos || []
                };
              })
            };
          });
        
        setItinerary(transformedDays);
      } catch (err: any) {
        console.error("Failed to fetch trip", err);
        toast({
          title: "Error",
          description: "Could not load itinerary. Please try again.",
          variant: "destructive"
        });
        navigate("/account");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchTrip();
  }, [id, user, navigate, toast]);

  const handleDeleteTrip = async () => {
    if (!id) return;
    try {
      setIsDeletingTrip(true);
      await supabase.from('trips').delete().eq('id', id);
      toast({
        title: "Trip deleted",
        description: "Your itinerary has been removed.",
      });
      navigate("/account");
    } catch (error) {
      console.error("Failed to delete trip", error);
      toast({
        title: "Error",
        description: "Failed to delete the trip.",
        variant: "destructive",
      });
      setIsDeletingTrip(false);
    }
  };

  const deleteActivity = (dayIndex: number, activityId: string) => {
    setItinerary((prev) =>
      prev.map((day, i) =>
        i === dayIndex ? { ...day, activities: day.activities.filter((a) => a.id !== activityId) } : day
      )
    );
    toast({ title: "Activity removed" });
  };

  const addActivityFromSearch = (place: PlaceResult) => {
    if (addActivityDayIndex === null) return;
    const newActivity: Activity = {
      id: String(nextId++), name: place.name, address: place.address, rating: place.rating,
      openTime: place.openTime, closeTime: place.closeTime, duration: place.duration,
      ticketPrice: place.ticketPrice, description: place.description, photoUrl: place.photoUrl,
      timeOfDay: place.timeOfDay,
    };
    setItinerary((prev) =>
      prev.map((day, i) =>
        i === addActivityDayIndex ? { ...day, activities: [...day.activities, newActivity] } : day
      )
    );
    toast({ title: "Activity added", description: place.name });
  };

  const addDay = () => {
    const n = itinerary.length + 1;
    const lastDay = itinerary[itinerary.length - 1];
    setItinerary((prev) => [...prev, { dayNumber: n, date: `Day ${n}`, city: lastDay?.city || "New City", country: lastDay?.country || "Country", activities: [] }]);
    toast({ title: `Day ${n} added` });
  };

  const deleteDay = (dayIndex: number) => {
    if (itinerary.length <= 1) {
      toast({ title: "Cannot delete", description: "Need at least one day.", variant: "destructive" });
      return;
    }
    setItinerary((prev) => prev.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, dayNumber: i + 1 })));
    toast({ title: "Day removed" });
  };

  const handleShare = async () => {
    // Current logic mapping to globegenie structure
    toast({ title: "Invite sent!", description: `Invite sent to ${shareEmail}` });
    setShareEmail("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse font-display">Gathering your trip details...</p>
      </div>
    );
  }

  const cities = [...new Set(itinerary.map((d) => `${d.city}, ${d.country}`))];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-16 max-w-4xl safe-top safe-bottom">
        {/* Header (Exact Globegenie Design) */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground truncate max-w-[500px]">{cities.join(" → ")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {itinerary.length} Days · {itinerary[0]?.date}–{itinerary[itinerary.length - 1]?.date} · {cities.length} {cities.length === 1 ? "City" : "Cities"}
            </p>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all shadow-sm">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-2xl text-foreground">Delete Itinerary</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Are you sure you want to delete this trip? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="rounded-xl mt-0 h-10 px-4">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTrip} disabled={isDeletingTrip} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4">
                      {isDeletingTrip ? "Deleting..." : "Delete Trip"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-ocean-gradient text-white font-semibold rounded-xl shadow-sm">
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Share Journey</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="space-y-0.5">
                      <Label htmlFor="public-toggle" className="text-sm font-semibold">Public Link Sharing</Label>
                      <p className="text-[10px] text-muted-foreground">Anyone with the link can view</p>
                    </div>
                    <Switch id="public-toggle" checked={isPublic} onCheckedChange={async (val) => {
                       await supabase.from('trips').update({ status: val ? 'published' : 'draft' }).eq('id', id);
                       setIsPublic(val);
                       toast({ title: val ? "Published" : "Private" });
                    }} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold ml-1">Invite by Email</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Email address" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="rounded-xl h-10" />
                      <Button onClick={handleShare} disabled={isSharing} className="rounded-xl bg-primary text-white font-semibold px-4">Invite</Button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" className="w-full rounded-xl h-10 border-2 font-semibold" onClick={copyLink}>
                      {linkCopied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                      {linkCopied ? "Copied!" : "Copy Journey Link"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Itinerary Timeline (Drag \u0026 Drop Parity) */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-2">
            {itinerary.map((day, dayIndex) => {
              const prevDay = dayIndex > 0 ? itinerary[dayIndex - 1] : null;
              const isNewCity = !prevDay || prevDay.city !== day.city || prevDay.country !== day.country;
              const cityColor = getCityColor(day.city);
              const daysInCity = itinerary.filter((d) => d.city === day.city && d.country === day.country).length;

              return (
                <div key={day.dayNumber}>
                  {isNewCity && (
                    <>
                      {dayIndex > 0 && (
                        <div className="flex items-center justify-center gap-2 my-6">
                          <div className="h-px flex-1 bg-border" />
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                            <Plane className="w-3.5 h-3.5" />
                            <span>Moving to {day.city}</span>
                          </div>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div className={`rounded-xl ${cityColor.bg} border ${cityColor.border} p-3 sm:p-4 mb-4`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${cityColor.dot} shrink-0`} />
                          <div>
                            <h2 className="text-lg font-display font-bold text-foreground">{day.city}, {day.country}</h2>
                            <p className="text-xs text-muted-foreground">{daysInCity} Day Stopover</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <section className={`ml-3 sm:ml-5 pl-4 sm:pl-5 border-l-2 ${cityColor.border} pb-4 relative`}>
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 ${cityColor.border} flex items-center justify-center z-10 shadow-sm`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cityColor.dot}`} />
                    </div>

                    <div className="flex items-center justify-between mb-3 sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-border shadow-sm">
                      <h2 className="text-base font-display font-bold text-foreground">
                        Day {day.dayNumber} <span className="text-muted-foreground font-normal text-sm ml-2">— {day.date}</span>
                      </h2>
                      {canEdit && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive text-xs h-7" onClick={() => deleteDay(dayIndex)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>

                    {TIME_PERIODS.map((tp) => {
                      const label = timeLabels[tp];
                      const activities = day.activities.filter((a) => a.timeOfDay === tp);

                      return (
                        <Droppable key={tp} droppableId={makeDropId(dayIndex, tp)}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`mb-3 rounded-xl border-2 border-dashed transition-all p-1 ${snapshot.isDraggingOver ? `${label.border} bg-primary/5` : "border-transparent"}`}
                            >
                              <div className="flex items-center gap-2 mb-1.5 px-1">
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${label.color} ${label.border} border`}>{label.label}</span>
                                {activities.length === 0 && (
                                  <span className="text-[10px] text-muted-foreground italic opacity-50">Discovery Hub Empty</span>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                {activities.map((activity, i) => (
                                  <Draggable key={activity.id} draggableId={activity.id} index={i} isDragDisabled={!canEdit}>
                                    {(prov, snap) => (
                                      <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        className={`flex items-center gap-2 sm:gap-3 bg-card rounded-xl border border-border p-2 pr-3 transition-all cursor-pointer ${snap.isDragging ? "shadow-2xl ring-2 ring-primary/20 scale-105 z-50 bg-white" : "shadow-sm hover:shadow-md"}`}
                                        onClick={() => !snap.isDragging && setSelectedActivity(activity)}
                                      >
                                        <div {...prov.dragHandleProps} className="shrink-0 p-1">
                                          {canEdit && <GripVertical className="w-4 h-4 text-muted-foreground/30" />}
                                        </div>

                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                                          <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-bold text-foreground text-sm leading-tight truncate">{activity.name}</h3>
                                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-medium">
                                            <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {activity.rating}</span>
                                            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {activity.duration}</span>
                                            <span className="flex items-center gap-0.5"><Ticket className="w-2.5 h-2.5" /> {activity.ticketPrice}</span>
                                          </div>
                                        </div>

                                        {canEdit && (
                                          <button onClick={(e) => { e.stopPropagation(); deleteActivity(dayIndex, activity.id); }} className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
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
                      <Button variant="outline" size="sm" className="w-full border-dashed mt-1 h-9 rounded-xl text-[11px] font-bold bg-muted/20" onClick={() => setAddActivityDayIndex(dayIndex)}>
                        <Plus className="w-3 h-3 mr-1.5" /> Enrich {day.city} Journey
                      </Button>
                    )}
                  </section>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {canEdit && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" className="border-dashed border-2 px-12 h-12 rounded-xl font-bold group" onClick={addDay}>
               <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Extend Journey by 1 Day
            </Button>
          </div>
        )}

        <AddActivityDialog
          open={addActivityDayIndex !== null}
          onOpenChange={(open) => !open && setAddActivityDayIndex(null)}
          onSelect={addActivityFromSearch}
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
