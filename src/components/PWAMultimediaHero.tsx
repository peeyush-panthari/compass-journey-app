import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// 🌍 Destinations
const LOCATIONS = {
  paris: { lat: 48.8566, lng: 2.3522 },
  bali: { lat: -8.4095, lng: 115.1889 },
  dubai: { lat: 25.2048, lng: 55.2708 },
};

export default function PWAMultimediaHero({ onAuthOpen }: { onAuthOpen: () => void }) {
  const globeRef = useRef<any>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();

  const [arcs, setArcs] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== "undefined" ? window.innerWidth : 400, 
    height: typeof window !== "undefined" ? window.innerHeight : 800 
  });

  // ✈️ Route animation
  const animateRoute = (destination: { lat: number; lng: number }) => {
    const start = { lat: 20.5937, lng: 78.9629 }; // India

    setArcs([
      {
        startLat: start.lat,
        startLng: start.lng,
        endLat: destination.lat,
        endLng: destination.lng,
      },
    ]);

    setPoints([
      { lat: destination.lat, lng: destination.lng },
    ]);
  };

  // 📜 Scroll highlight
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 200) animateRoute(LOCATIONS.paris);
      else if (y < 400) animateRoute(LOCATIONS.bali);
      else animateRoute(LOCATIONS.dubai);
    };

    window.addEventListener("scroll", onScroll);
    // Initial call
    animateRoute(LOCATIONS.paris);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 🔄 Auto rotate & resize
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    controls.enableZoom = false; // Disable zoom for background hero

    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✨ Background animation (particles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrame: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(100,150,255,0.12)";
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-[#f7fbff] via-[#eef5ff] to-white flex flex-col items-center justify-end pb-24 px-6">
      
      {/* ✨ Animated Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* 🌍 Ultra Minimal Globe (Positioned at the TOP part) */}
      <div className="absolute inset-x-0 top-0 h-[45svh] z-10 flex items-start justify-center pointer-events-none overflow-hidden">
        <div className="translate-y-[-10%] scale-110 sm:scale-100">
           <Globe
            ref={globeRef}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="#a8c5ff"
            atmosphereAltitude={0.15}
            arcsData={arcs}
            arcColor={() => ["#7aa2ff", "#4facfe"]}
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={1800}
            pointsData={points}
            pointColor={() => "#ff6b6b"}
            pointAltitude={0.02}
            pointRadius={1.2}
            width={dimensions.width}
            height={dimensions.height * 0.5} // Shrink height to top half
          />
        </div>
      </div>

      {/* 📝 Content Overlay (Moved LOWER on screen) */}
      <div className="relative z-20 text-center w-full max-w-sm pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/15 rounded-full px-4 py-1.5 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-sea-foam animate-pulse" />
          <span className="text-xs font-medium text-primary">Free to get started</span>
        </motion.div>

        <h1 className="text-4xl font-display font-bold text-foreground leading-tight mb-4">
          Plan trips that
          <motion.span 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="block text-gradient-ocean"
          >
            feel magical
          </motion.span>
        </h1>

        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="text-sm text-muted-foreground mb-8 leading-relaxed px-4"
        >
          GlobeGenie uses AI to create personalized trips with real venue data and smart scheduling.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.7 }}
          className="flex justify-center pointer-events-auto"
        >
          {user ? (
            <Link to="/plan" className="w-full">
              <Button size="lg" className="w-full bg-gold-gradient text-primary-foreground font-semibold shadow-gold h-14 rounded-2xl group">
                Start Planning <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Button 
              size="lg" 
              className="w-full bg-gold-gradient text-primary-foreground font-semibold shadow-gold h-14 rounded-2xl group"
              onClick={onAuthOpen}
            >
              Start Planning <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </motion.div>
      </div>

      {/* 🏙️ City Hint Icon (Keep near bottom) */}
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute bottom-6 z-30"
      >
        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      </motion.div>
    </div>
  );
}
