import { Clock, MapPin, Ticket, Star, ExternalLink, Navigation, Sun, Camera, Play, X, ChevronLeft, ChevronRight, UtensilsCrossed, Gem, Coffee, Quote } from "lucide-react";
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

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] sm:max-h-[90vh] p-0 rounded-[20px] border-border/40 shadow-elevated overflow-hidden w-[calc(100%-2rem)] mx-auto font-sans antialiased">
          {/* Immersive Hero Section (Top 30%) */}
          <div className="relative w-full aspect-[16/9] sm:h-64 overflow-hidden">
            <img
              src={activity.photoUrl}
              alt={activity.name}
              className="w-full h-full object-cover select-none"
            />
            {/* Cinematic Progressive Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/25 to-transparent pointer-events-none" />
            
            <div className="absolute bottom-5 left-5 right-5 z-10">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground drop-shadow-sm leading-tight mb-2 tracking-tight">
                {activity.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-white/80 dark:bg-card/80 backdrop-blur-md text-[10px] sm:text-xs font-bold gap-1 px-2.5 py-1">
                  <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" /> {activity.rating}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80 bg-white/40 dark:bg-card/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                  <MapPin className="w-3.5 h-3.5" /> 
                  <span className="truncate max-w-[150px] sm:max-w-[250px]">{activity.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(90vh-16rem)] w-full scrollbar-hide">
            <div className="px-6 py-6 space-y-6 w-full min-w-0">
              
              {/* Premium whyVisit Insight */}
              {activity.whyVisit && (
                <div className="bg-primary/5 border-l-[3px] border-primary p-4 rounded-r-2xl relative group overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-5">
                      <Quote className="w-12 h-12 rotate-12" />
                   </div>
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.1em] mb-2">Why it's a must-visit</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium italic">"{activity.whyVisit}"</p>
                </div>
              )}

              {/* Core Description */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">The Story</h3>
                <p className="text-sm text-foreground leading-[1.6] leading-relaxed font-sans">{activity.description}</p>
              </div>

              {/* Dynamic Information Grid (2-column Detail Tiles) */}
              <div className="grid grid-cols-2 gap-3.5">
                {(() => {
                  const formattedOpen = formatTime(activity.openTime);
                  const formattedClose = formatTime(activity.closeTime);
                  let hoursDisplay = "Not Available";
                  if (formattedOpen !== "Not Available" && formattedClose !== "Not Available") {
                    hoursDisplay = `${formattedOpen} – ${formattedClose}`;
                  } else if (formattedOpen !== "Not Available") {
                    hoursDisplay = `${formattedOpen} onwards`;
                  } else if (formattedClose !== "Not Available") {
                    hoursDisplay = `Until ${formattedClose}`;
                  }
                  return <DetailTile icon={<Clock className="w-4 h-4 text-primary" />} label="Opening Hours" value={hoursDisplay} colorClass="bg-primary/5" iconColor="text-primary" />;
                })()}
                
                <DetailTile icon={<Clock className="w-4 h-4" />} label="Est. Time" value={activity.duration} colorClass="bg-primary/5" iconColor="text-primary" />
                
                <DetailTile icon={<Ticket className="w-4 h-4" />} label="Ticket Price" value={activity.ticketPrice} colorClass="bg-destructive/5" iconColor="text-[#FF5A5F]" />
                
                <DetailTile icon={<Sun className="w-4 h-4" />} label="Best Timing" value={activity.bestTimeToVisit || "Morning"} colorClass="bg-amber-500/5" iconColor="text-[#F59E0B]" />
                
                {activity.travelTimeFromPrevious && (
                   <DetailTile icon={<Navigation className="w-4 h-4" />} label="Navigation" value={activity.travelTimeFromPrevious} colorClass="bg-emerald-500/5" iconColor="text-[#10B981]" />
                )}
                
                <a 
                  href={activity.googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-all group col-span-1"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Location</span>
                    <span className="text-[11px] font-bold text-foreground">View Maps</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              {/* Social & Media Layer: Photo Gallery */}
              {activity.photos && activity.photos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5" /> High-Res Gallery
                  </h3>
                  <div className="flex w-full overflow-x-auto gap-3 pb-2 snap-x snap-mandatory scrollbar-hide">
                    {activity.photos.map((photo, i) => (
                      <div
                        key={i}
                        className="w-28 h-28 sm:w-36 sm:h-36 flex-none rounded-2xl overflow-hidden snap-center cursor-pointer hover:shadow-lg transition-all border border-border/40"
                        onClick={() => setFullScreenPhotoIndex(i)}
                      >
                        <img src={photo} alt={`${activity.name} ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Recommendation Hub */}
              {(activity.foodSuggestions?.length! > 0 || activity.hiddenGems?.length! > 0 || activity.photoSpots?.length! > 0) && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Insider Recommendations</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activity.foodSuggestions && activity.foodSuggestions.length > 0 && (
                      <RecommendationBox title="Food \u0026 Coffee" items={activity.foodSuggestions} icon={<UtensilsCrossed className="w-4 h-4 text-orange-500" />} />
                    )}
                    {activity.hiddenGems && activity.hiddenGems.length > 0 && (
                      <RecommendationBox title="Hidden Gems" items={activity.hiddenGems} icon={<Gem className="w-4 h-4 text-purple-500" />} />
                    )}
                    {activity.photoSpots && activity.photoSpots.length > 0 && (
                      <RecommendationBox title="Photo Spots" items={activity.photoSpots} icon={<Camera className="w-4 h-4 text-blue-500" />} />
                    )}
                  </div>
                </div>
              )}

              {/* YouTube Vlogs \u0026 Shorts */}
              {activity.youtubeVideos && activity.youtubeVideos.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-destructive" /> Visual Guides \u0026 Shorts
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    {activity.youtubeVideos.map((video, i) => {
                      const videoUrl = video.videoUrl || video.url;
                      if (!videoUrl) return null;
                      const embedUrl = getYoutubeEmbedUrl(videoUrl);
                      return (
                        <div key={i} className="group rounded-2xl overflow-hidden border border-border/60 bg-card shadow-soft hover:shadow-elevated transition-all duration-300">
                          {embedUrl && (
                            <div className="relative w-full aspect-video bg-muted">
                              <iframe
                                src={embedUrl}
                                title={video.title}
                                className="absolute inset-0 w-full h-full border-0 select-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}
                          <div className="px-4 py-3 flex items-center justify-between bg-muted/10">
                            <span className="text-[11px] font-bold text-foreground truncate pr-4">{video.title}</span>
                            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline underline-offset-4">
                              Watch on YT <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Black-out Full Screen Photo Viewer */}
      <Dialog
        open={fullScreenPhotoIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setFullScreenPhotoIndex(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 rounded-none border-none bg-black/98 flex items-center justify-center shadow-none [&>button]:hidden z-[200]"
        >
          <DialogTitle className="sr-only">Immersive Viewer</DialogTitle>
          {fullScreenPhotoIndex !== null && activity.photos && (
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
              <button
                className="absolute top-6 right-6 text-white/50 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all z-[210] outline-none"
                onClick={() => setFullScreenPhotoIndex(null)}
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>

              {activity.photos.length > 1 && (
                <button
                  className="absolute left-4 sm:left-12 text-white/50 hover:text-white p-4 bg-white/5 backdrop-blur-xl rounded-full transition-all z-[210] focus:ring-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreenPhotoIndex((prev) => prev! === 0 ? activity.photos!.length - 1 : prev! - 1);
                  }}
                >
                  <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
              )}

              <img
                src={activity.photos[fullScreenPhotoIndex]}
                alt="Fullscreen"
                className="max-w-full max-h-[85vh] object-contain select-none shadow-gold transition-all duration-500 rounded-lg"
              />

              {activity.photos.length > 1 && (
                <button
                  className="absolute right-4 sm:right-12 text-white/50 hover:text-white p-4 bg-white/5 backdrop-blur-xl rounded-full transition-all z-[210] focus:ring-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreenPhotoIndex((prev) => prev! === activity.photos!.length - 1 ? 0 : prev! + 1);
                  }}
                >
                  <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
                </button>
              )}
              
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-[10px] font-bold tracking-widest uppercase bg-white/5 px-4 py-2 rounded-full backdrop-blur-md">
                {fullScreenPhotoIndex + 1} / {activity.photos.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const DetailTile = ({ icon, label, value, colorClass, iconColor }: { icon: React.ReactNode; label: string; value: string; colorClass: string; iconColor: string }) => (
  <div className={`flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border/10 ${colorClass}`}>
    <div className={`${iconColor} bg-white dark:bg-card p-1.5 rounded-lg w-fit shadow-soft`}>{icon}</div>
    <div className="flex flex-col">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
    </div>
  </div>
);

const RecommendationBox = ({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) => (
  <div className="bg-muted/30 p-4 rounded-2xl border border-border/20 shadow-soft">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h4 className="text-[10px] font-bold text-foreground uppercase tracking-[0.1em]">{title}</h4>
    </div>
    <ul className="space-y-2 pl-4">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-foreground/80 list-disc list-outside marker:text-primary/40 font-medium leading-tight">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default ActivityDetailDialog;
