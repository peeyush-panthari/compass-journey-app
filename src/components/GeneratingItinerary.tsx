import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plane, Hotel, Map, Camera, Coffee } from "lucide-react";
import { useState, useEffect } from "react";

const messages = [
  { text: "Finding the best routes...", icon: <Plane className="w-5 h-5" /> },
  { text: "Picking top stays...", icon: <Hotel className="w-5 h-5" /> },
  { text: "Crafting your adventure...", icon: <Map className="w-5 h-5" /> },
  { text: "Discovering hidden gems...", icon: <Camera className="w-5 h-5" /> },
  { text: "Locating local delicacies...", icon: <Coffee className="w-5 h-5" /> },
];

const GeneratingItinerary = ({ isOpen }: { isOpen: boolean }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentMessageIndex(0);
      return;
    }

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Stall at 95% until complete
        return prev + (100 / 30); // Reach 95% in about 30 seconds
      });
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, rotateX: 10 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-md p-8 bg-card border border-border/50 rounded-3xl shadow-2xl relative overflow-hidden"
          >
            {/* Background Decorative Circles */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.05, 0.1, 0.05],
                  rotate: 360 
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary rounded-full"
              />
            </div>

            <div className="flex flex-col items-center text-center">
              {/* Animated Icon Area */}
              <div className="relative mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center"
                >
                  <div className="w-16 h-16 bg-ocean-gradient rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-primary-foreground animate-pulse" />
                  </div>
                </motion.div>
                
                {/* Orbiting Dots */}
                {[0, 72, 144, 216, 288].map((degree, i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                    style={{ rotate: degree }}
                    className="absolute inset-0 flex items-start justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-[-4px]" />
                  </motion.div>
                ))}
              </div>

              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Generating Itinerary
              </h2>
              <p className="text-muted-foreground mb-8 text-sm">
                GlobeGenie AI is crafting your perfect trip...
              </p>

              {/* Cycling Messages */}
              <div className="h-12 flex items-center justify-center w-full bg-muted/40 rounded-2xl mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="flex items-center gap-2 text-primary font-medium text-sm"
                  >
                    {messages[currentMessageIndex].icon}
                    <span>{messages[currentMessageIndex].text}</span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-ocean-gradient"
                />
              </div>
              <div className="w-full flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Progress</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{Math.round(progress)}%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GeneratingItinerary;
