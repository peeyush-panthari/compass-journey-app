import { Clock, MapPin, Ticket, Star, ExternalLink, Navigation, Sun, Camera, Play, X, ChevronLeft, ChevronRight, UtensilsCrossed, Gem, Coffee } from "lucide-react";
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
  // Extended fields
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] p-0 rounded-2xl border-border/60 overflow-hidden w-[calc(100%-2rem)] mx-auto">
          {/* Hero Image */}
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={activity.photoUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-xl font-display font-bold text-foreground drop-shadow-sm line-clamp-1">{activity.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Star className="w-3 h-3 text-gold fill-gold" /> {activity.rating}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                  <MapPin className="w-3 h-3" /> {activity.address}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(90vh-12rem)] w-full">
            <div className="px-5 pb-5 space-y-4 w-full min-w-0">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  return <DetailItem icon={<Clock className="w-4 h-4 text-primary" />} label="Opening Hours" value={hoursDisplay} />;
                })()}
                <DetailItem icon={<Clock className="w-4 h-4 text-accent" />} label="Est. Time Needed" value={activity.duration} />
                <DetailItem icon={<Ticket className="w-4 h-4 text-coral" />} label="Ticket Price" value={activity.ticketPrice} />
                <DetailItem icon={<Sun className="w-4 h-4 text-gold" />} label="Best Time to Visit" value={activity.bestTimeToVisit || "Morning"} />
                {activity.travelTimeFromPrevious && (
                  <DetailItem icon={<Navigation className="w-4 h-4 text-sea-foam" />} label="Travel from Previous" value={activity.travelTimeFromPrevious} />
                )}
              </div>

              {/* Google Maps Link */}
              {activity.googleMapsUrl && (
                <>
                  <Separator />
                  <a
                    href={activity.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </a>
                </>
              )}

              {/* Photos */}
              {activity.photos && activity.photos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-primary" /> Photos
                    </h3>
                    <div className="flex w-full overflow-x-auto gap-3 pb-3 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {activity.photos.map((photo, i) => (
                        <div
                          key={i}
                          className="w-24 h-24 sm:w-32 sm:h-32 flex-none rounded-lg overflow-hidden snap-center cursor-pointer group shrink-0"
                          onClick={() => setFullScreenPhotoIndex(i)}
                        >
                          <img src={photo} alt={`${activity.name} photo ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Recommendations Section */}
              {(activity.foodSuggestions?.length! > 0 || activity.hiddenGems?.length! > 0 || activity.photoSpots?.length! > 0 || activity.restStops?.length! > 0) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Local Recommendations</h3>
                    
                    {activity.foodSuggestions && activity.foodSuggestions.length > 0 && (
                      <RecommendationList 
                        title="Food & Drinks" 
                        items={activity.foodSuggestions} 
                        icon={<UtensilsCrossed className="w-4 h-4 text-orange-500" />} 
                      />
                    )}

                    {activity.hiddenGems && activity.hiddenGems.length > 0 && (
                      <RecommendationList 
                        title="Hidden Gems" 
                        items={activity.hiddenGems} 
                        icon={<Gem className="w-4 h-4 text-purple-500" />} 
                      />
                    )}

                    {activity.photoSpots && activity.photoSpots.length > 0 && (
                      <RecommendationList 
                        title="Top Photo Spots" 
                        items={activity.photoSpots} 
                        icon={<Camera className="w-4 h-4 text-blue-500" />} 
                      />
                    )}

                    {activity.restStops && activity.restStops.length > 0 && (
                      <RecommendationList 
                        title="Quick Rest Stops" 
                        items={activity.restStops} 
                        icon={<Coffee className="w-4 h-4 text-green-600" />} 
                      />
                    )}
                  </div>
                </>
              )}

              {/* YouTube Videos */}
              {activity.youtubeVideos && activity.youtubeVideos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Play className="w-4 h-4 text-destructive" /> Videos & Shorts
                    </h3>
                    <div className="space-y-4 w-full max-w-full min-w-0">
                      {activity.youtubeVideos.map((video, i) => {
                        const videoUrl = video.videoUrl || video.url;
                        if (!videoUrl) return null;
                        const embedUrl = getYoutubeEmbedUrl(videoUrl);
                        return (
                          <div key={i} className="w-full max-w-full min-w-0 rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                            {embedUrl && (
                              <div className="relative w-full max-w-full min-w-0 aspect-video bg-muted overflow-hidden">
                                <iframe
                                  src={embedUrl}
                                  title={video.title}
                                  className="absolute inset-0 w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  style={{ maxWidth: "100%", minWidth: 0 }}
                                />
                              </div>
                            )}
                            <div className="px-3 py-2.5 flex items-center justify-between border-t border-border/50">
                              <span className="text-xs font-semibold text-foreground truncate max-w-[70%]">{video.title}</span>
                              <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 px-2 shrink-0">
                                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View on YouTube
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

      {/* Full Screen Photo Viewer */}
      <Dialog
        open={fullScreenPhotoIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setFullScreenPhotoIndex(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-w-[100vw] w-screen h-screen max-h-[100vh] p-0 m-0 rounded-none border-none bg-black/95 flex items-center justify-center shadow-none [&>button]:hidden z-[200]"
        >
          <DialogTitle className="sr-only">Photo Viewer</DialogTitle>
          {fullScreenPhotoIndex !== null && activity.photos && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <button
                className="absolute top-4 right-4 text-white p-3 hover:bg-white/10 rounded-full transition-colors z-[210] focus:outline-none"
                onClick={() => setFullScreenPhotoIndex(null)}
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>

              {activity.photos.length > 1 && (
                <button
                  className="absolute left-2 sm:left-8 text-white p-3 bg-black/20 hover:bg-white/10 backdrop-blur-sm rounded-full transition-colors z-[210] focus:outline-none"
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
                alt="Full screen photo"
                className="max-w-full max-h-[90vh] object-contain select-none shadow-2xl relative z-[205]"
              />

              {activity.photos.length > 1 && (
                <button
                  className="absolute right-2 sm:right-8 text-white p-3 bg-black/20 hover:bg-white/10 backdrop-blur-sm rounded-full transition-colors z-[210] focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullScreenPhotoIndex((prev) => prev! === activity.photos!.length - 1 ? 0 : prev! + 1);
                  }}
                >
                  <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
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
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
    <div className="mt-0.5 shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const RecommendationList = ({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      {icon}
      <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">{title}</h4>
    </div>
    <ul className="grid grid-cols-1 gap-1.5 pl-6">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-muted-foreground list-disc list-outside marker:text-primary">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default ActivityDetailDialog;
