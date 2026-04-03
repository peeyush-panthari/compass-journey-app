import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Users, Sparkles, Calendar, Shield, FileText, MessageSquare, ArrowRight, Plane, Map, Star, Clock, DollarSign, Hotel, Paperclip, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import PWAVoyagoHero from "@/components/PWAVoyagoHero";

const features = [
  { icon: Sparkles, title: "AI-Powered Trips", description: "Chat with our AI to generate a personalized day-by-day travel plan optimized for your interests and budget.", iconBg: "bg-primary/10 text-primary" },
  { icon: MapPin, title: "Drag & Drop Planner", description: "Reorder activities, add new stops, and customize your trip with an intuitive drag-and-drop interface.", iconBg: "bg-accent/10 text-accent" },
  { icon: DollarSign, title: "Trip Budgeting", description: "Track expenses, set budgets, split costs with tripmates, and view spending breakdowns by category.", iconBg: "bg-sea-foam/10 text-sea-foam" },
  { icon: Plane, title: "Reservations Hub", description: "Manage flights, hotels, rental cars, trains, ferries, restaurants, and more — all in one place.", iconBg: "bg-coral/10 text-coral" },
  { icon: Globe, title: "Explore Destinations", description: "Discover top attractions, restaurants, cafes, and photo spots with curated guides for every stop.", iconBg: "bg-primary/10 text-primary" },
  { icon: Hotel, title: "Hotel Search", description: "Find and compare hotels with transparent pricing — no commission-based sorting.", iconBg: "bg-accent/10 text-accent" },
  { icon: Paperclip, title: "Attachments & Documents", description: "Attach boarding passes, booking confirmations, and travel documents directly to your trip.", iconBg: "bg-sea-foam/10 text-sea-foam" },
  { icon: BookOpen, title: "Travel Journal", description: "Capture memories, write notes, and keep a personal journal of your trip experiences.", iconBg: "bg-coral/10 text-coral" },
];

const steps = [
  { step: "01", title: "Plan your trip", description: "Chat with our AI or start from scratch — set your destinations, dates, and preferences.", icon: MessageSquare },
  { step: "02", title: "Build your trip", description: "Get a day-by-day plan with activities, photos, and timings. Drag to reorder and customize.", icon: Map },
  { step: "03", title: "Add reservations & budget", description: "Book hotels, add flights and restaurants, track expenses, and attach travel documents.", icon: Calendar },
  { step: "04", title: "Explore & travel", description: "Discover local gems, share your trip with friends, and access everything on the go.", icon: Plane },
];

const destinationCards = [
  { city: "Rome", country: "Italy", days: 3, venues: 12, img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=300&h=200&fit=crop", rating: 4.8 },
  { city: "Tokyo", country: "Japan", days: 5, venues: 18, img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&h=200&fit=crop", rating: 4.9 },
  { city: "Paris", country: "France", days: 4, venues: 15, img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&h=200&fit=crop", rating: 4.7 },
];

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Mobile PWA Hero (Voyago Design) */}
      <div className="block md:hidden">
        <PWAVoyagoHero onAuthOpen={() => setAuthOpen(true)} />
      </div>

      {/* Desktop Hero */}
      <section className="relative min-h-[100svh] hidden md:flex items-center bg-hero-gradient overflow-x-hidden">
        <div className="absolute top-20 right-[30%] w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-drift" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-drift" style={{ animationDelay: "5s" }} />

        <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-20 pb-24 md:pb-12 safe-top">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/15 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-sea-foam animate-pulse" />
                <span className="text-sm font-medium text-primary compact-touch">Free to get started</span>
              </motion.div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] mb-4 sm:mb-6">
                Plan trips that
                <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="block text-gradient-ocean">
                  feel magical
                </motion.span>
              </h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-md leading-relaxed">
                GlobeGenie uses AI to create personalized trips, enriched with real venue data, photos, and smart scheduling.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col sm:flex-row gap-3">
                {user ? (
                  <Link to="/plan">
                    <Button size="lg" className="w-full sm:w-auto bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-95 transition-all text-base px-8 h-12 rounded-xl group">
                      Start Planning <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" className="w-full sm:w-auto bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-95 transition-all text-base px-8 h-12 rounded-xl group" onClick={() => setAuthOpen(true)}>
                    Start Planning <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </motion.div>
            </motion.div>

            {/* Right - Hero image composition (hidden on mobile) */}
            <div className="relative hidden md:flex items-center justify-center min-h-[440px] lg:min-h-[540px] overflow-visible">
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 70 }} className="relative z-10 w-full max-w-[340px] lg:max-w-[400px]">
                <div className="rounded-3xl overflow-hidden shadow-elevated border border-border/40">
                  <img
                    src="/assets/hero-travel.jpg"
                    alt="Beautiful coastal destination"
                    className="w-full h-[260px] lg:h-[320px] object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="absolute -bottom-5 left-4 right-4 bg-card/95 backdrop-blur-xl rounded-2xl p-4 shadow-elevated border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">3-Day Rome Trip</p>
                      <p className="text-xs text-muted-foreground">AI-generated · 12 venues</p>
                    </div>
                    <div className="text-xs font-semibold text-sea-foam bg-sea-foam/10 px-2.5 py-1 rounded-full shrink-0 compact-touch">Ready</div>
                  </div>
                </motion.div>
              </motion.div>

              {destinationCards.map((dest, i) => (
                <motion.div key={dest.city} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 + i * 0.15, type: "spring", stiffness: 100 }}
                  className={`absolute bg-card rounded-xl shadow-elevated border border-border/50 overflow-hidden ${i === 0 ? "left-0 lg:-left-10 top-0 lg:top-8 w-[140px] lg:w-[160px]" : i === 1 ? "right-0 lg:-right-8 top-0 lg:top-4 w-[130px] lg:w-[150px]" : "right-0 lg:-right-6 bottom-16 lg:bottom-24 w-[140px] lg:w-[160px]"}`}>
                  <motion.div animate={{ y: [0, i % 2 === 0 ? -6 : -4, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}>
                    <img src={dest.img} alt={dest.city} className="w-full h-[72px] object-cover" />
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-foreground">{dest.city}</p>
                      <p className="text-[10px] text-muted-foreground">{dest.country} · {dest.days} days</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                        <span className="text-[10px] font-medium text-foreground">{dest.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }} className="absolute left-0 lg:-left-6 bottom-0 lg:bottom-4 z-20">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="bg-card rounded-xl p-3 shadow-elevated border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><Globe className="w-4 h-4 text-accent" /></div>
                    <div><p className="text-xs font-bold text-foreground">50+ Destinations</p><p className="text-[10px] text-muted-foreground">Ready to explore</p></div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.8, type: "spring" }} className="absolute top-0 left-[30%] z-20">
                <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="bg-card rounded-full px-3.5 py-2 shadow-elevated border border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground compact-touch">Smart scheduling</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-sea-foam animate-pulse" />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 bg-background relative">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-3 block compact-touch">Features</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Everything for the <span className="text-gradient-gold">perfect trip</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From AI-generated trips to collaborative editing, GlobeGenie handles every detail.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group bg-card rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-elevated transition-all duration-500 border border-border/60 hover:border-primary/20 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-sky-gradient relative">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-16">
            <span className="text-sm font-semibold text-accent tracking-wider uppercase mb-3 block compact-touch">How It Works</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Four simple steps</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="relative bg-card rounded-2xl p-5 sm:p-6 shadow-card border border-border/60 text-center group hover:shadow-elevated transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-xs font-bold text-primary/60 mb-2 compact-touch">{step.step}</div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 pb-28 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-5xl sm:text-6xl mb-6 inline-block">🌍</motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-4">Ready to plan your next adventure?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">Create your free account and start planning your dream trip with AI today.</p>
            {user ? (
              <Link to="/plan">
                <Button size="lg" className="bg-gold-gradient text-primary-foreground font-semibold shadow-gold rounded-xl text-base px-8 h-12">Let's Go! <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            ) : (
              <Button size="lg" className="bg-gold-gradient text-primary-foreground font-semibold shadow-gold rounded-xl text-base px-8 h-12" onClick={() => setAuthOpen(true)}>Get Started Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
            )}
          </motion.div>
        </div>
      </section>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Index;
