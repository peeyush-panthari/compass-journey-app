import { Clock, MapPin, Ticket, Star, ExternalLink, Navigation, Sun, Camera, Play, X, ChevronLeft, ChevronRight, UtensilsCrossed, Gem, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const formatTime = (timeString?: string | null) => {
  if (!timeString || timeString === "Not Available") return "Not Available";
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  } catch (e) {
    return timeString;
  }
};

export interface ActivityDetail {
  id: string;
  name: string;
  address: string;
  rating: number;
  openTime: string;
  closeTime: string;
  duration: string;
  ticketPrice: string;
  description: string;
  photoUrl: string;
  timeOfDay: "morning" | "afternoon" | "evening";
  bestTimeToVisit?: string;
  travelTimeFromPrevious?: string;
  googleMapsUrl?: string;
  photos?: string[];
  youtubeVideos?: { title: string; videoUrl: string; thumbnailUrl: string }[];
  whyVisit?: string;
  foodSuggestions?: string[];
  hiddenGems?: string[];
  photoSpots?: string[];
  restStops?: string[];
  sortOrder: number;
}

interface ActivityDetailDialogProps {
  activity: ActivityDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityDetailDialog = ({ activity, open, onOpenChange }: ActivityDetailDialogProps) => {
  const [fullScreenPhotoIndex, setFullScreenPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) setFullScreenPhotoIndex(null);
  }, [open, activity]);

  if (!activity) return null;

  const getYoutubeEmbedUrl = (url: string) => {
    // Robust regex to capture video ID from standard watch links, shorts, and shortened youtu.be links
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0` : null;
  };

  const isShorts = (url: string) => url.includes('/shorts/');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] p-0 rounded-3xl border-border/60 overflow-hidden w-[calc(100%-2rem)] mx-auto font-sans shadow-2xl">
          {/* Hero Image (Exact Globegenie Design) */}
          <div className="relative w-full h-52 overflow-hidden">
            <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover shadow-inner hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <h2 className="text-2xl font-display font-bold text-foreground drop-shadow-sm tracking-tight">{activity.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="text-[10px] font-bold gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {activity.rating}
                </Badge>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground truncate opacity-80">
                  <MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[220px]">{activity.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(90vh-14rem)] w-full scrollbar-hide px-5 pb-8">
            <div className="space-y-6 pt-5">
              {/* About Section */}
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-[0.1em] mb-2">Editor's Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed leading-7">{activity.description}</p>
              </div>

              {activity.whyVisit && (
                 <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-xl shadow-sm italic">
                   <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Gem className="w-3 h-3" /> Why we love it</h4>
                   <p className="text-sm text-foreground/90 leading-6">"{activity.whyVisit}"</p>
                 </div>
              )}

              <Separator className="opacity-50" />

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const hours = formatTime(activity.openTime) + " – " + formatTime(activity.closeTime);
                  return <DetailItem icon={<Clock className="w-4 h-4 text-primary" />} label="Operating Hours" value={hours} />;
                })()}
                <DetailItem icon={<Clock className="w-4 h-4 text-emerald-500" />} label="Time Investment" value={activity.duration} />
                <DetailItem icon={<Ticket className="w-4 h-4 text-rose-500" />} label="Journey Cost" value={activity.ticketPrice} />
                <DetailItem icon={<Sun className="w-4 h-4 text-amber-500" />} label="Prime Visiting Time" value={activity.bestTimeToVisit || "Early Morning"} />
              </div>

              {/* Recommendations Mapping */}
              {(activity.foodSuggestions?.length! > 0 || activity.hiddenGems?.length! > 0) && (
                <>
                  <Separator className="opacity-50" />
                  <div className="grid grid-cols-1 gap-4">
                    {activity.foodSuggestions && activity.foodSuggestions.length > 0 && (
                      <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
                        <div className="flex items-center gap-2 mb-2.5">
                           <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                           <h4 className="text-[10px] font-bold text-orange-800 uppercase tracking-widest">Gastronomy & Sips</h4>
                        </div>
                        <ul className="space-y-1.5 pl-2 text-sm text-muted-foreground">
                          {activity.foodSuggestions.map((item, i) => <li key={i} className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-200 mt-2 shrink-0" /> {item}</li>)}
                        </ul>
                      </div>
                    )}
                    {activity.hiddenGems && activity.hiddenGems.length > 0 && (
                      <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                        <div className="flex items-center gap-2 mb-2.5">
                           <Gem className="w-4 h-4 text-purple-600" />
                           <h4 className="text-[10px] font-bold text-purple-800 uppercase tracking-widest">Insider Secrets</h4>
                        </div>
                        <ul className="space-y-1.5 pl-2 text-sm text-muted-foreground">
                          {activity.hiddenGems.map((item, i) => <li key={i} className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-200 mt-2 shrink-0" /> {item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Discovery Gallery */}
              {activity.photos && activity.photos.length > 0 && (
                <>
                  <Separator className="opacity-50" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Camera className="w-4 h-4 text-primary" /> Visual Journey Gallery
                    </h3>
                    <div className="flex w-full overflow-x-auto gap-4 pb-3 snap-x snap-mandatory scrollbar-hide">
                      {activity.photos.map((photo, i) => (
                        <div key={i} className="w-28 h-28 sm:w-36 sm:h-36 flex-none rounded-2xl overflow-hidden snap-center cursor-pointer border-2 border-transparent hover:border-primary transition-all shadow-md group" onClick={() => setFullScreenPhotoIndex(i)}>
                          <img src={photo} alt={`${activity.name} gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Visual Guides */}
              {activity.youtubeVideos && activity.youtubeVideos.length > 0 && (
                <>
                  <Separator className="opacity-50" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Play className="w-4 h-4 text-destructive" /> Immersive Visual Guides
                    </h3>
                    <div className="space-y-6">
                      {activity.youtubeVideos.map((video, i) => {
                        const embedUrl = getYoutubeEmbedUrl(video.videoUrl);
                        const shortsMode = isShorts(video.videoUrl);
                        
                        return (
                          <div key={i} className="rounded-3xl overflow-hidden border border-border/80 bg-card shadow-2xl transition-all hover:shadow-primary/5">
                            {embedUrl ? (
                              <div className={cn(
                                "relative w-full bg-black shadow-inner overflow-hidden",
                                shortsMode ? "aspect-[9/16] max-w-[280px] mx-auto" : "aspect-video"
                              )}>
                                <iframe 
                                  src={embedUrl} 
                                  title={video.title} 
                                  className="absolute inset-0 w-full h-full border-0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen 
                                />
                              </div>
                            ) : (
                              <div className="aspect-video bg-muted flex items-center justify-center p-8 text-center text-xs text-muted-foreground">
                                Visual guide currently being optimized for playback.
                              </div>
                            )}
                            <div className="px-5 py-4 flex items-center justify-between bg-muted/30">
                              <div className="min-w-0 pr-4">
                                <p className="text-xs font-bold text-foreground truncate">{video.title}</p>
                                {shortsMode && (
                                  <Badge variant="outline" className="mt-1.5 text-[9px] h-4 font-bold border-rose-200 text-rose-500 bg-rose-50/50">
                                    <Sparkles className="w-2.5 h-2.5 mr-1" /> Immersive Short
                                  </Badge>
                                )}
                              </div>
                              <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full bg-white shadow-sm hover:bg-white/90">
                                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" title="Watch on YouTube">
                                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Full Resolution Viewer (Radix Dialog) */}
      <Dialog open={fullScreenPhotoIndex !== null} onOpenChange={(iso) => !iso && setFullScreenPhotoIndex(null)}>
        <DialogContent className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 rounded-none border-none bg-black/98 flex items-center justify-center [&>button]:hidden z-[200]">
          <DialogTitle className="sr-only">Photo Details</DialogTitle>
          {fullScreenPhotoIndex !== null && activity.photos && (
            <div className="relative w-full h-full flex items-center justify-center p-6">
              <button className="absolute top-8 right-8 text-white/50 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all z-[210]" onClick={() => setFullScreenPhotoIndex(null)}>
                <X className="w-8 h-8" />
              </button>
              {activity.photos.length > 1 && (
                <button className="absolute left-6 text-white/50 hover:text-white p-4 h-24 bg-white/5 hover:bg-white/10 rounded-2xl transition-all z-[210]" onClick={(e) => { e.stopPropagation(); setFullScreenPhotoIndex((prev) => prev! === 0 ? activity.photos!.length - 1 : prev! - 1); }}>
                  <ChevronLeft className="w-10 h-10" />
                </button>
              )}
              <img src={activity.photos[fullScreenPhotoIndex]} className="max-w-[95%] max-h-[92vh] object-contain shadow-2xl rounded-sm" />
              {activity.photos.length > 1 && (
                <button className="absolute right-6 text-white/50 hover:text-white p-4 h-24 bg-white/5 hover:bg-white/10 rounded-2xl transition-all z-[210]" onClick={(e) => { e.stopPropagation(); setFullScreenPhotoIndex((prev) => prev! === activity.photos!.length - 1 ? 0 : prev! + 1); }}>
                  <ChevronRight className="w-10 h-10" />
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-muted/30 border border-border/10 shadow-sm">
    <div className="mt-1 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5 leading-none">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate leading-none">{value}</p>
    </div>
  </div>
);

export default ActivityDetailDialog;
