import { useState } from "react";
import { Star, Clock, MapPin, Ticket, GripVertical, Plus, Trash2, Share2, Copy, Check, Plane } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import AddActivityDialog, { type PlaceResult } from "@/components/AddActivityDialog";
import ActivityDetailDialog, { type ActivityDetail } from "@/components/ActivityDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Activity = ActivityDetail;
interface Day { dayNumber: number; date: string; city: string; country: string; activities: Activity[]; }

const CITY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {};
const CITY_PALETTE = [
  { bg: "bg-primary/10", border: "border-primary/25", text: "text-primary", dot: "bg-primary" },
  { bg: "bg-accent/10", border: "border-accent/25", text: "text-accent-foreground", dot: "bg-accent" },
  { bg: "bg-sea-foam/10", border: "border-sea-foam/25", text: "text-foreground", dot: "bg-sea-foam" },
  { bg: "bg-coral/10", border: "border-coral/25", text: "text-foreground", dot: "bg-coral" },
  { bg: "bg-gold/10", border: "border-gold/25", text: "text-foreground", dot: "bg-gold" },
];
let colorIndex = 0;
const getCityColor = (city: string) => { if (!CITY_COLORS[city]) { CITY_COLORS[city] = CITY_PALETTE[colorIndex % CITY_PALETTE.length]; colorIndex++; } return CITY_COLORS[city]; };

const initialItinerary: Day[] = [
  { dayNumber: 1, date: "March 15", city: "Rome", country: "Italy", activities: [
    { id: "1", name: "Colosseum", address: "Piazza del Colosseo, Roma", rating: 4.7, openTime: "09:00", closeTime: "19:00", duration: "2.5h", ticketPrice: "€16", description: "The iconic ancient Roman amphitheater.", photoUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop", timeOfDay: "morning", bestTimeToVisit: "Early morning", travelTimeFromPrevious: "—", googleMapsUrl: "https://maps.google.com/?q=Colosseum+Rome", photos: ["https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=300&h=300&fit=crop","https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=300&h=300&fit=crop"] },
    { id: "2", name: "Roman Forum", address: "Via della Salara Vecchia, Roma", rating: 4.6, openTime: "09:00", closeTime: "19:00", duration: "1.5h", ticketPrice: "Included", description: "The heart of ancient Rome.", photoUrl: "https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=600&h=400&fit=crop", timeOfDay: "morning", bestTimeToVisit: "Late morning", travelTimeFromPrevious: "5 min walk", googleMapsUrl: "https://maps.google.com/?q=Roman+Forum+Rome" },
    { id: "3", name: "Trevi Fountain", address: "Piazza di Trevi, Roma", rating: 4.8, openTime: "Always", closeTime: "Open", duration: "30m", ticketPrice: "Free", description: "The largest Baroque fountain in Rome.", photoUrl: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=600&h=400&fit=crop", timeOfDay: "afternoon", bestTimeToVisit: "Early morning or late evening", travelTimeFromPrevious: "15 min walk", googleMapsUrl: "https://maps.google.com/?q=Trevi+Fountain+Rome" },
    { id: "4", name: "Trastevere Dinner", address: "Trastevere, Roma", rating: 4.5, openTime: "19:00", closeTime: "23:00", duration: "2h", ticketPrice: "€30-50", description: "Authentic Roman cuisine in charming cobblestone streets.", photoUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop", timeOfDay: "evening", bestTimeToVisit: "Evening (7-9 PM)", travelTimeFromPrevious: "20 min walk", googleMapsUrl: "https://maps.google.com/?q=Trastevere+Rome" },
  ]},
  { dayNumber: 2, date: "March 16", city: "Rome", country: "Italy", activities: [
    { id: "5", name: "Vatican Museums", address: "Viale Vaticano, Roma", rating: 4.6, openTime: "09:00", closeTime: "18:00", duration: "3h", ticketPrice: "€17", description: "Home to the breathtaking Sistine Chapel.", photoUrl: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&h=400&fit=crop", timeOfDay: "morning", bestTimeToVisit: "Early morning", travelTimeFromPrevious: "—", googleMapsUrl: "https://maps.google.com/?q=Vatican+Museums+Rome" },
    { id: "6", name: "St. Peter's Basilica", address: "Piazza San Pietro, Vaticano", rating: 4.8, openTime: "07:00", closeTime: "18:30", duration: "1.5h", ticketPrice: "Free", description: "The largest church in the world.", photoUrl: "https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?w=600&h=400&fit=crop", timeOfDay: "afternoon", bestTimeToVisit: "Afternoon", travelTimeFromPrevious: "5 min walk", googleMapsUrl: "https://maps.google.com/?q=St+Peters+Basilica+Rome" },
  ]},
  { dayNumber: 3, date: "March 17", city: "Florence", country: "Italy", activities: [
    { id: "8", name: "Uffizi Gallery", address: "Piazzale degli Uffizi, Firenze", rating: 4.8, openTime: "08:15", closeTime: "18:50", duration: "3h", ticketPrice: "€20", description: "Masterpieces by Botticelli and Leonardo.", photoUrl: "https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=600&h=400&fit=crop", timeOfDay: "morning", bestTimeToVisit: "Early morning", travelTimeFromPrevious: "—", googleMapsUrl: "https://maps.google.com/?q=Uffizi+Gallery+Florence" },
    { id: "9", name: "Ponte Vecchio", address: "Ponte Vecchio, Firenze", rating: 4.7, openTime: "Always", closeTime: "Open", duration: "30m", ticketPrice: "Free", description: "Florence's iconic medieval stone bridge.", photoUrl: "https://images.unsplash.com/photo-1543429257-3eb0b65d9c58?w=600&h=400&fit=crop", timeOfDay: "afternoon", bestTimeToVisit: "Sunset", travelTimeFromPrevious: "5 min walk", googleMapsUrl: "https://maps.google.com/?q=Ponte+Vecchio+Florence" },
  ]},
];

const TIME_PERIODS = ["morning", "afternoon", "evening"] as const;
const timeLabels = {
  morning: { label: "Morning", color: "bg-gold/10 text-gold-dark", border: "border-gold/20" },
  afternoon: { label: "Afternoon", color: "bg-primary/10 text-primary", border: "border-primary/20" },
  evening: { label: "Evening", color: "bg-coral/10 text-coral", border: "border-coral/20" },
};

let nextId = 100;
const makeDropId = (dayIndex: number, time: string) => `${dayIndex}-${time}`;
const parseDropId = (id: string) => { const [dayStr, ...rest] = id.split("-"); return { dayIndex: parseInt(dayStr), timeOfDay: rest.join("-") as Activity["timeOfDay"] }; };

const Itinerary = () => {
  const [itinerary, setItinerary] = useState<Day[]>(initialItinerary);
  const [shareEmail, setShareEmail] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [addActivityDayIndex, setAddActivityDayIndex] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { toast } = useToast();

  const deleteActivity = (dayIndex: number, activityId: string) => { setItinerary(prev => prev.map((day, i) => i === dayIndex ? { ...day, activities: day.activities.filter(a => a.id !== activityId) } : day)); toast({ title: "Activity removed" }); };
  const addActivityFromSearch = (place: PlaceResult) => { if (addActivityDayIndex === null) return; const a: Activity = { id: String(nextId++), name: place.name, address: place.address, rating: place.rating, openTime: place.openTime, closeTime: place.closeTime, duration: place.duration, ticketPrice: place.ticketPrice, description: place.description, photoUrl: place.photoUrl, timeOfDay: place.timeOfDay }; setItinerary(prev => prev.map((day, i) => i === addActivityDayIndex ? { ...day, activities: [...day.activities, a] } : day)); toast({ title: "Activity added", description: place.name }); };
  const addDay = () => { const n = itinerary.length + 1; const last = itinerary[itinerary.length - 1]; setItinerary(prev => [...prev, { dayNumber: n, date: `Day ${n}`, city: last?.city || "New City", country: last?.country || "Country", activities: [] }]); toast({ title: `Day ${n} added` }); };
  const deleteDay = (dayIndex: number) => { if (itinerary.length <= 1) { toast({ title: "Cannot delete", variant: "destructive" }); return; } setItinerary(prev => prev.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, dayNumber: i + 1 }))); toast({ title: "Day removed" }); };
  const handleShare = () => { if (shareEmail.trim()) { toast({ title: "Shared!", description: `Sent to ${shareEmail}` }); setShareEmail(""); } };
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); toast({ title: "Link copied!" }); };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const src = parseDropId(result.source.droppableId);
    const dst = parseDropId(result.destination.droppableId);
    setItinerary(prev => {
      const next = prev.map(d => ({ ...d, activities: [...d.activities] }));
      const srcActs = next[src.dayIndex].activities;
      const srcTime = srcActs.filter(a => a.timeOfDay === src.timeOfDay);
      const moved = srcTime[result.source.index];
      if (!moved) return prev;
      next[src.dayIndex].activities = srcActs.filter(a => a.id !== moved.id);
      moved.timeOfDay = dst.timeOfDay;
      const dstActs = next[dst.dayIndex].activities;
      const dstTime = dstActs.filter(a => a.timeOfDay === dst.timeOfDay);
      dstTime.splice(result.destination!.index, 0, moved);
      const rebuilt: Activity[] = [];
      for (const tp of TIME_PERIODS) { if (tp === dst.timeOfDay) rebuilt.push(...dstTime); else rebuilt.push(...dstActs.filter(a => a.timeOfDay === tp)); }
      next[dst.dayIndex].activities = rebuilt;
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-4xl safe-top safe-bottom">
        {(() => {
          const cities = [...new Set(itinerary.map(d => `${d.city}, ${d.country}`))];
          return (
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div><h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">{cities.join(" → ")}</h1><p className="text-xs text-muted-foreground mt-0.5">{itinerary.length} Days · {itinerary[0]?.date}–{itinerary[itinerary.length - 1]?.date}</p></div>
              <Dialog><DialogTrigger asChild><Button size="sm" className="bg-ocean-gradient text-primary-foreground font-semibold rounded-xl shadow-sm"><Share2 className="w-4 h-4 mr-1" /> Share</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-display">Share Itinerary</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="flex gap-2"><Input placeholder="Email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} className="rounded-xl" /><Button onClick={handleShare} className="rounded-xl bg-ocean-gradient text-primary-foreground">Send</Button></div><Button variant="outline" className="w-full rounded-xl" onClick={copyLink}>{linkCopied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Link</>}</Button></div></DialogContent>
              </Dialog>
            </div>
          );
        })()}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-2">
            {itinerary.map((day, dayIndex) => {
              const prevDay = dayIndex > 0 ? itinerary[dayIndex - 1] : null;
              const isNewCity = !prevDay || prevDay.city !== day.city;
              const cityColor = getCityColor(day.city);
              const daysInCity = itinerary.filter(d => d.city === day.city).length;
              return (
                <div key={day.dayNumber}>
                  {isNewCity && (<>
                    {dayIndex > 0 && (<div className="flex items-center justify-center gap-2 my-6"><div className="h-px flex-1 bg-border" /><div className="flex items-center gap-1.5 text-xs text-muted-foreground compact-touch"><Plane className="w-3.5 h-3.5" /><span>Travel to {day.city}</span></div><div className="h-px flex-1 bg-border" /></div>)}
                    <div className={`rounded-xl ${cityColor.bg} border ${cityColor.border} p-3 sm:p-4 mb-4`}><div className="flex items-center gap-2.5"><div className={`w-2.5 h-2.5 rounded-full ${cityColor.dot} shrink-0`} /><div><h2 className="text-lg font-display font-bold text-foreground">{day.city}, {day.country}</h2><p className="text-xs text-muted-foreground">{daysInCity} {daysInCity === 1 ? "Day" : "Days"}</p></div></div></div>
                  </>)}
                  <section className={`ml-3 sm:ml-5 pl-4 sm:pl-5 border-l-2 ${cityColor.border} pb-4`}>
                    <div className="flex items-center justify-between mb-3 sticky top-14 z-30 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-border">
                      <h2 className="text-base font-display font-bold text-foreground">Day {day.dayNumber} <span className="text-muted-foreground font-normal text-sm">— {day.date}</span></h2>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive text-xs h-7 compact-touch" onClick={() => deleteDay(dayIndex)}><Trash2 className="w-3 h-3 mr-1" /> Remove</Button>
                    </div>
                    {TIME_PERIODS.map(tp => {
                      const label = timeLabels[tp];
                      const activities = day.activities.filter(a => a.timeOfDay === tp);
                      return (
                        <Droppable key={tp} droppableId={makeDropId(dayIndex, tp)}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className={`mb-3 rounded-lg border transition-colors min-h-[40px] ${snapshot.isDraggingOver ? `${label.border} bg-muted/50` : "border-transparent"}`}>
                              <div className="flex items-center gap-2 mb-1.5 px-1"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${label.color} compact-touch`}>{label.label}</span></div>
                              {activities.map((activity, actIdx) => (
                                <Draggable key={activity.id} draggableId={activity.id} index={actIdx}>
                                  {(prov, snap) => (
                                    <div ref={prov.innerRef} {...prov.draggableProps} className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl mb-1.5 transition-all ${snap.isDragging ? "bg-card shadow-elevated ring-2 ring-primary/30" : "bg-card border border-border/60 hover:border-primary/20 hover:shadow-card"}`}>
                                      <div {...prov.dragHandleProps} className="mt-1 text-muted-foreground/40 hover:text-muted-foreground cursor-grab shrink-0 compact-touch"><GripVertical className="w-4 h-4" /></div>
                                      <button onClick={() => setSelectedActivity(activity)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 compact-touch"><img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" /></button>
                                      <button onClick={() => setSelectedActivity(activity)} className="flex-1 min-w-0 text-left compact-touch">
                                        <h4 className="font-semibold text-foreground text-sm truncate">{activity.name}</h4>
                                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                          <span className="flex items-center gap-0.5 compact-touch"><Star className="w-3 h-3 text-gold fill-gold" /> {activity.rating}</span>
                                          <span className="flex items-center gap-0.5 compact-touch"><Clock className="w-3 h-3" /> {activity.duration}</span>
                                          <span className="flex items-center gap-0.5 compact-touch"><Ticket className="w-3 h-3" /> {activity.ticketPrice}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1 compact-touch"><MapPin className="w-3 h-3 shrink-0" /> {activity.address}</p>
                                      </button>
                                      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground/50 hover:text-destructive h-7 w-7 compact-touch" onClick={() => deleteActivity(dayIndex, activity.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-dashed text-muted-foreground hover:text-foreground hover:border-primary/40 mt-1" onClick={() => setAddActivityDayIndex(dayIndex)}>
                      <Plus className="w-4 h-4 mr-1" /> Add Activity
                    </Button>
                  </section>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        <div className="mt-6 flex justify-center"><Button variant="outline" className="rounded-xl" onClick={addDay}><Plus className="w-4 h-4 mr-1" /> Add Day</Button></div>
      </div>

      <AddActivityDialog open={addActivityDayIndex !== null} onOpenChange={open => { if (!open) setAddActivityDayIndex(null); }} onSelect={addActivityFromSearch} />
      <ActivityDetailDialog activity={selectedActivity} open={!!selectedActivity} onOpenChange={open => { if (!open) setSelectedActivity(null); }} />
    </div>
  );
};

export default Itinerary;
