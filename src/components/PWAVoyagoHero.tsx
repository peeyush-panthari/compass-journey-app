import { Variants, motion, TargetAndTransition } from "framer-motion";
import { Search, Bell, User, MapPin, Send, Sun, Camera, Rocket, Palmtree, Mountain, ArrowRight, Bike, Utensils } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const floatingAnimation: Variants = {
  initial: { y: 0 },
  animate: (i: number): TargetAndTransition => ({
    y: [0, -10, 0],
    transition: {
      duration: 3 + i * 0.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }),
};

export default function PWAVoyagoHero({ onAuthOpen }: { onAuthOpen: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAction = () => {
    if (user) {
      navigate("/plan");
    } else {
      onAuthOpen();
    }
  };
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#F0F7FF] flex flex-col font-sans">
      
      {/* 🎨 Background Pastel Circles */}
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] rounded-full bg-[#E5F1FF] blur-[60px] opacity-60" />
      <div className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] rounded-full bg-[#FCF8E8] blur-[50px] opacity-70" />
      <div className="absolute bottom-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#F3E8FF] blur-[80px] opacity-50" />
      <div className="absolute bottom-[20%] right-[-20%] w-[300px] h-[300px] rounded-full bg-[#E0FFE9] blur-[70px] opacity-40" />

      {/* 🔝 Floating Animation Area (Lowered to clear logo) */}
      <div className="relative z-20 h-[45vh] w-full pointer-events-none">
        
        {/* 🎈 Floating Destination Badges (Starting lower at 30%) */}
        {/* Paris */}
        <motion.div 
          custom={0} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute right-6 top-[30%] pointer-events-auto bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 border border-blue-50/50"
        >
          <Rocket className="w-4 h-4 text-[#FF6B6B]" />
          <span className="text-sm font-bold text-[#1A1A1A]">Paris</span>
        </motion.div>

        {/* Bali */}
        <motion.div 
          custom={1} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute left-[5%] top-[35%] pointer-events-auto bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 border border-blue-50/50"
        >
          <Palmtree className="w-4 h-4 text-[#FFB86C]" />
          <span className="text-sm font-bold text-[#1A1A1A]">Bali</span>
        </motion.div>

        {/* Santorini */}
        <motion.div 
          custom={8} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute right-[10%] top-[55%] pointer-events-auto bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 border border-blue-50/50"
        >
          <MapPin className="w-4 h-4 text-[#2B7FFF]" />
          <span className="text-sm font-bold text-[#1A1A1A]">Santorini</span>
        </motion.div>

        {/* Singapore */}
        <motion.div 
          custom={9} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute left-[8%] top-[68%] pointer-events-auto bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 border border-blue-50/50"
        >
          <Send className="w-4 h-4 text-[#FF6B6B]" />
          <span className="text-sm font-bold text-[#1A1A1A]">Singapore</span>
        </motion.div>

        {/* Maldives */}
        <motion.div 
          custom={2} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute right-[25%] top-[40%] pointer-events-auto bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 border border-blue-50/50"
        >
          <Palmtree className="w-4 h-4 text-[#2ECC71]" />
          <span className="text-sm font-bold text-[#1A1A1A]">Maldives</span>
        </motion.div>

        {/* Himachal */}
        <motion.div 
          custom={3} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute left-[35%] top-[52%] pointer-events-auto bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 border border-blue-50/50"
        >
          <Mountain className="w-4 h-4 text-[#9B59B6]" />
          <span className="text-sm font-bold text-[#1A1A1A]">Himachal</span>
        </motion.div>

        {/* 🍦 Floating Icons */}
        <motion.div 
          custom={4} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute top-[25%] left-[45%] w-12 h-12 rounded-2xl bg-[#FFF9E5] flex items-center justify-center shadow-sm"
        >
          <Sun className="w-6 h-6 text-[#FFD700]" />
        </motion.div>

        <motion.div 
          custom={5} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute top-[42%] left-[10%] w-10 h-10 rounded-xl bg-[#FFF2F2] flex items-center justify-center shadow-sm"
        >
          <Camera className="w-5 h-5 text-[#FF6B6B]" />
        </motion.div>

        <motion.div 
          custom={6} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute right-[5%] top-[75%] w-10 h-10 rounded-xl bg-[#F0F7FF] flex items-center justify-center shadow-sm"
        >
          <Bike className="w-5 h-5 text-[#2B7FFF]" />
        </motion.div>

        <motion.div 
          custom={10} variants={floatingAnimation} initial="initial" animate="animate"
          className="absolute top-[85%] left-[30%] w-10 h-10 rounded-xl bg-[#E0FFE9] flex items-center justify-center shadow-sm"
        >
          <Utensils className="w-5 h-5 text-[#2ECC71]" />
        </motion.div>
      </div>

      {/* 📝 Lower Content (Functional Parity with Web version) */}
      <div className="relative z-30 text-center w-full px-8 pb-32 mt-auto">
        <h1 className="text-4xl font-display font-bold text-[#1A1A1A] leading-tight mb-4">
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
          className="text-[13px] font-medium text-muted-foreground mb-10 leading-relaxed max-w-[340px] mx-auto"
        >
          GlobeGenie uses AI to create personalized trips with real venue data and smart scheduling.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.7 }}
          className="flex justify-center"
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
    </div>
  );
}
