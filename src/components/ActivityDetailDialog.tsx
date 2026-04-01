import { Clock, MapPin, Ticket, Star, ExternalLink, Navigation, Sun, Camera, Play, X, ChevronLeft, ChevronRight, UtensilsCrossed, Gem, Quote } from "lucide-react";
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
  youtubeVideos?: { title: string; videoUrl?: string; url?: string; thumbnailUrl: string }[];
  whyVisit?: string;
  foodSuggestions?: string[];
  hiddenGems?: string[];
  photoSpots?: string[];
  restStops?: string[];
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

  // Intelligent Media Fallback Engine (Maintains globegenie parity while ensuring content)
  const finalPhotos = (activity.photos && activity.photos.length > 0) 
    ? activity.photos 
    : [
        `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800`,
        `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800`
      ];

  const finalVideos = (activity.youtubeVideos && activity.youtubeVideos.length > 0)
    ? activity.youtubeVideos
    : [];

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] p-0 rounded-2xl border-border/60 overflow-hidden w-[calc(100%-2rem)] mx-auto font-sans">
          {/* Hero Image (Exact Globegenie Mapping) */}
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={activity.photoUrl || finalPhotos[0]}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-xl font-display font-bold text-foreground drop-shadow-sm leading-tight">{activity.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-[10px] sm:text-xs font-bold gap-1 px-2">
                  <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" /> {activity.rating || 4.8}
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
                  <MapPin className="w-3 h-3" /> 
                  <span className="truncate max-w-[200px]">{activity.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(90vh-12rem)] w-full scrollbar-hide">
            <div className="px-5 pb-6 space-y-5 w-full min-w-0">
              
              {/* About Section */}
              <div className="pt-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-1.5">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
              </div>

              {activity.whyVisit && (
                 <div className="bg-primary/5 border-l-[3px] border-primary p-3.5 rounded-r-xl">
                   <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Insider Insight</h4>
                   <p className="text-sm text-foreground/90 italic">"{activity.whyVisit}"</p>
                 </div>
              )}

              <Separator className="opacity-60" />

              {/* Details Grid (Exact DetailItem Mapping) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const formattedOpen = formatTime(activity.openTime);
                  const formattedClose = formatTime(activity.closeTime);
                  let hoursDisplay = "Morning \u2013 Evening";
                  if (formattedOpen !== "Not Available" && formattedClose !== "Not Available") {
                    hoursDisplay = `${formattedOpen} \u2013 ${formattedClose}`;
                  }
                  return <DetailItem icon={<Clock className="w-4 h-4 text-primary" />} label="Opening Hours" value={hoursDisplay} />;
                })()}
                
                <DetailItem icon={<Clock className="w-4 h-4 text-accent" />} label="Est. Time Needed" value={activity.duration || "2-3 hours"} />
                <DetailItem icon={<Ticket className="w-4 h-4 text-[#FF5A5F]" />} label="Ticket Price" value={activity.ticketPrice || "Free Entry"} />
                <DetailItem icon={<Sun className="w-4 h-4 text-[#F59E0B]" />} label="Best Time to Visit" value={activity.bestTimeToVisit || "Morning"} />
              </div>

              {/* Recommendation Sections (Rich Metadata) */}
              {(activity.foodSuggestions?.length! > 0 || activity.hiddenGems?.length! > 0) && (
                <>
                  <Separator className="opacity-60" />
                  <div className="grid grid-cols-1 gap-4">
                    {activity.foodSuggestions && activity.foodSuggestions.length > 0 && (
                      <div className="bg-muted/30 p-3.5 rounded-xl border border-border/20">
                        <div className="flex items-center gap-2 mb-2">
                           <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                           <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Food \u0026 Coffee</h4>
                        </div>
                        <ul className="space-y-1.5 pl-5 list-disc text-sm text-muted-foreground">
                          {activity.foodSuggestions.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {activity.hiddenGems && activity.hiddenGems.length > 0 && (
                      <div className="bg-muted/30 p-3.5 rounded-xl border border-border/20">
                        <div className="flex items-center gap-2 mb-2">
                           <Gem className="w-4 h-4 text-purple-500" />
                           <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Hidden Gems</h4>
                        </div>
                        <ul className="space-y-1.5 pl-5 list-disc text-sm text-muted-foreground">
                          {activity.hiddenGems.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Media Layer: Photo Gallery */}
              {finalPhotos.length > 1 && (
                <>
                  <Separator className="opacity-60" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" /> Photo Gallery
                    </h3>
                    <div className="flex w-full overflow-x-auto gap-3 pb-2 snap-x snap-mandatory scrollbar-hide">
                      {finalPhotos.map((photo, i) => (
                        <div
                          key={i}
                          className="w-24 h-24 sm:w-32 sm:h-32 flex-none rounded-xl overflow-hidden snap-center cursor-pointer border border-border/20 shadow-sm"
                          onClick={() => setFullScreenPhotoIndex(i)}
                        >
                          <img src={photo} alt={`${activity.name} ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* YouTube Vlogs \u0026 Shorts */}
              {finalVideos.length > 0 && (
                <>
                  <Separator className="opacity-60" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Play className="w-4 h-4 text-destructive" /> Visual Guides \u0026 Shorts
                    </h3>
                    <div className="space-y-4">
                      {finalVideos.map((video, i) => {
                        const videoUrl = video.videoUrl || video.url;
                        if (!videoUrl) return null;
                        const embedUrl = getYoutubeEmbedUrl(videoUrl);
                        return (
                          <div key={i} className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                            {embedUrl && (
                              <div className="relative w-full aspect-video bg-muted">
                                <iframe src={embedUrl} title={video.title} className="absolute inset-0 w-full h-full border-0" allowFullScreen />
                              </div>
                            )}
                            <div className="px-3.5 py-3 flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground truncate pr-4">{video.title}</span>
                              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary">
                                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> YouTube
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

      {/* Pro Photo Viewer (Radix Dialog Based) */}
      <Dialog open={fullScreenPhotoIndex !== null} onOpenChange={(iso) => !iso && setFullScreenPhotoIndex(null)}>
        <DialogContent className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 rounded-none border-none bg-black/95 flex items-center justify-center shadow-none [&>button]:hidden z-[200]">
          <DialogTitle className="sr-only">Viewer</DialogTitle>
          {fullScreenPhotoIndex !== null && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <button
                className="absolute top-6 right-6 text-white p-3 hover:bg-white/10 rounded-full transition-all z-[210]"
                onClick={() => setFullScreenPhotoIndex(null)}
              >
                <X className="w-7 h-7" />
              </button>

              {finalPhotos.length > 1 && (
                <button
                  className="absolute left-4 text-white p-3 bg-black/40 hover:bg-white/10 rounded-full transition-all z-[210]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreenPhotoIndex((prev) => prev! === 0 ? finalPhotos.length - 1 : prev! - 1);
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}

              <img src={finalPhotos[fullScreenPhotoIndex]} className="max-w-full max-h-[90vh] object-contain shadow-2xl transition-all duration-300" />

              {finalPhotos.length > 1 && (
                <button
                  className="absolute right-4 text-white p-3 bg-black/40 hover:bg-white/10 rounded-full transition-all z-[210]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreenPhotoIndex((prev) => prev! === finalPhotos.length - 1 ? 0 : prev! + 1);
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
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
  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/10">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold leading-none mb-1.5">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate leading-none">{value}</p>
    </div>
  </div>
);

export default ActivityDetailDialog;
