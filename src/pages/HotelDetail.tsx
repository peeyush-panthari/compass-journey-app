import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, MapPin, Check, ChevronLeft, ChevronRight, Users, BedDouble, Maximize, Wifi, Coffee, Car, Waves, Dumbbell, UtensilsCrossed, Wine, ConciergeBell, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { hotels } from "@/data/hotels";
import { useToast } from "@/hooks/use-toast";

const amenityIcons: Record<string, any> = {
  "Free WiFi": Wifi, "Pool": Waves, "Spa": Waves, "Restaurant": UtensilsCrossed,
  "Bar": Wine, "Gym": Dumbbell, "Parking": Car, "Concierge": ConciergeBell,
  "Room Service": ConciergeBell, "Breakfast": Coffee,
};

const HotelDetail = () => {
  const { id } = useParams();
  const hotel = hotels.find((h) => h.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  if (!hotel) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="text-xl font-display font-bold text-foreground">Hotel not found</h1>
          <Link to="/hotels"><Button variant="link" className="mt-4">← Back to listings</Button></Link>
        </div>
      </div>
    );
  }

  const nextImage = () => setActiveImage((prev) => (prev + 1) % hotel.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);

  const handleBook = (roomName: string, price: number) => {
    toast({ title: "Booking Requested", description: `${roomName} at ${hotel.currency}${price}/night — Booking flow coming soon!` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-5xl safe-top safe-bottom">
        {/* Back */}
        <Link to="/hotels" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to results
        </Link>

        {/* Image Gallery */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-xl overflow-hidden mb-6 aspect-[16/7]">
          <img src={hotel.images[activeImage]} alt={hotel.name} className="w-full h-full object-cover" />
          {hotel.images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-card transition-colors shadow-md"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-card transition-colors shadow-md"><ChevronRight className="w-5 h-5" /></button>
            </>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {hotel.images.map((_, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`w-2 h-2 rounded-full transition-colors ${i === activeImage ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
          <button onClick={() => setSaved(!saved)} className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${saved ? "bg-red-500 text-white" : "bg-card/80 backdrop-blur text-foreground hover:bg-card"}`}>
            <Heart className={`w-4 h-4 ${saved ? "fill-white" : ""}`} />
          </button>
        </motion.div>

        {/* Thumbnail strip */}
        {hotel.images.length > 1 && (
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1">
            {hotel.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${i === activeImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Details */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-1">
                {Array.from({ length: hotel.stars }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">{hotel.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" />{hotel.location}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="bg-primary text-primary-foreground text-sm font-bold px-2.5 py-1 rounded-lg">{hotel.rating}</div>
                <span className="text-sm text-muted-foreground">{hotel.reviewCount} reviews</span>
                <div className="flex gap-2">
                  {hotel.freeCancellation && <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200">Free cancellation</Badge>}
                  {hotel.breakfastIncluded && <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200">Breakfast included</Badge>}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-base font-display font-bold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{hotel.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-base font-display font-bold text-foreground mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((a) => {
                  const Icon = amenityIcons[a] || Check;
                  return (
                    <div key={a} className="flex items-center gap-2 text-sm text-foreground">
                      <Icon className="w-4 h-4 text-muted-foreground" /> {a}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-base font-display font-bold text-foreground mb-3">Guest Reviews</h2>
              <div className="space-y-4">
                {hotel.reviews.map((review) => (
                  <div key={review.id} className="bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground text-xs font-bold">{review.author.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{review.author}</p>
                          <p className="text-[10px] text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Rooms & Booking */}
          <div className="lg:w-[340px] shrink-0">
            <div className="bg-card rounded-xl border border-border shadow-card p-5 sticky top-20">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-2xl font-display font-bold text-foreground">{hotel.currency}{hotel.pricePerNight}</span>
                  <span className="text-sm text-muted-foreground"> /night</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-foreground mb-3">Available Rooms</h3>
              <div className="space-y-3">
                {hotel.roomTypes.map((room) => (
                  <div key={room.id} className="border border-border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-foreground">{room.name}</h4>
                      <span className="text-sm font-bold text-foreground">{hotel.currency}{room.price}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mb-2">
                      <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{room.bedType}</span>
                      <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{room.size}</span>
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />Up to {room.maxGuests}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {room.amenities.map((a) => (
                        <span key={a} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{a}</span>
                      ))}
                    </div>
                    <Button size="sm" className="w-full bg-ocean-gradient text-primary-foreground font-semibold rounded-lg text-xs" onClick={() => handleBook(room.name, room.price)}>
                      Book Now
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;
