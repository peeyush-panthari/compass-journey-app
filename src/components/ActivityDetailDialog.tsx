import { Clock, MapPin, Ticket, Star, ExternalLink, Navigation, Sun, Camera, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
  youtubeVideos?: { title: string; url: string; thumbnailUrl: string }[];
}

interface ActivityDetailDialogProps {
  activity: ActivityDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityDetailDialog = ({ activity, open, onOpenChange }: ActivityDetailDialogProps) => {
  if (!activity) return null;

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] p-0 rounded-2xl border-border/60 overflow-hidden w-[calc(100%-2rem)] mx-auto">
        <div className="relative w-full h-48 overflow-hidden">
          <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-xl font-display font-bold text-foreground drop-shadow-sm">{activity.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs gap-1 compact-touch">
                <Star className="w-3 h-3 text-gold fill-gold" /> {activity.rating}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1 compact-touch">
                <MapPin className="w-3 h-3" /> {activity.address}
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-12rem)]">
          <div className="px-5 pb-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailItem icon={<Clock className="w-4 h-4 text-primary" />} label="Opening Hours" value={`${activity.openTime} – ${activity.closeTime}`} />
              <DetailItem icon={<Clock className="w-4 h-4 text-accent" />} label="Est. Time Needed" value={activity.duration} />
              <DetailItem icon={<Ticket className="w-4 h-4 text-coral" />} label="Ticket Price" value={activity.ticketPrice} />
              <DetailItem icon={<Sun className="w-4 h-4 text-gold" />} label="Best Time to Visit" value={activity.bestTimeToVisit || "Morning"} />
              {activity.travelTimeFromPrevious && (
                <DetailItem icon={<Navigation className="w-4 h-4 text-sea-foam" />} label="Travel from Previous" value={activity.travelTimeFromPrevious} />
              )}
            </div>

            {activity.googleMapsUrl && (
              <>
                <Separator />
                <a href={activity.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                </a>
              </>
            )}

            {activity.photos && activity.photos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Camera className="w-4 h-4 text-primary" /> Photos</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {activity.photos.map((photo, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden">
                        <img src={photo} alt={`${activity.name} photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activity.youtubeVideos && activity.youtubeVideos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Play className="w-4 h-4 text-destructive" /> Videos & Shorts</h3>
                  <div className="space-y-3">
                    {activity.youtubeVideos.map((video, i) => {
                      const embedUrl = getYoutubeEmbedUrl(video.url);
                      return (
                        <div key={i} className="rounded-xl overflow-hidden border border-border">
                          {embedUrl && (
                            <div className="aspect-video">
                              <iframe src={embedUrl} title={video.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            </div>
                          )}
                          <div className="px-3 py-2 flex items-center justify-between bg-card">
                            <span className="text-xs font-medium text-foreground truncate">{video.title}</span>
                            <a href={video.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground compact-touch">
                                <ExternalLink className="w-3 h-3 mr-1" /> Open
                              </Button>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
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

export default ActivityDetailDialog;
