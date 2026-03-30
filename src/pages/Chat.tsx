import { useState, useRef, useEffect } from "react";
import { Send, Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: string[];
}

const chatFlow: { question: string; options?: string[]; key: string }[] = [
  { question: "Hi! I'm GlobeGenie 🌍 Let's plan your perfect trip. Where would you like to go?", key: "destination" },
  { question: "Great choice! When are you planning to travel, and for how many days?", key: "dates" },
  { question: "Who's traveling?", options: ["Solo", "With friends", "As a couple", "Family with kids"], key: "group" },
  { question: "What's the purpose of your trip?", options: ["Leisure", "Business", "Honeymoon", "Adventure", "Cultural exploration"], key: "purpose" },
  { question: "What's your budget range?", options: ["Budget-friendly", "Mid-range", "Luxury", "No limit"], key: "budget" },
  { question: "What activities interest you most?", options: ["Historical sites", "Food & dining", "Nature & outdoors", "Adventure sports", "Shopping", "Nightlife"], key: "activities" },
  { question: "What pace do you prefer?", options: ["Relaxed — fewer stops", "Moderate — balanced mix", "Packed — see everything!"], key: "pace" },
  { question: "Any special requirements? (dietary, accessibility, etc.) Type 'none' if not.", key: "special" },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: "0", role: "assistant", content: chatFlow[0].question }]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = (value: string) => {
    if (!value.trim() || isComplete) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: value };
    const nextStep = currentStep + 1;

    if (nextStep < chatFlow.length) {
      const nextQ = chatFlow[nextStep];
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: nextQ.question, options: nextQ.options };
      setMessages(prev => [...prev, userMsg, botMsg]);
      setCurrentStep(nextStep);
    } else {
      const finalMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Perfect! I have everything I need. 🎉 Let me generate your personalized itinerary..." };
      setMessages(prev => [...prev, userMsg, finalMsg]);
      setIsComplete(true);
    }
    setInputValue("");
  };

  return (
    <div className="min-h-[100svh] bg-background flex flex-col">
      <div className="border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 safe-top">
        <Link to="/"><Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="w-9 h-9 rounded-full bg-ocean-gradient flex items-center justify-center"><Globe className="w-5 h-5 text-primary-foreground" /></div>
        <div><h1 className="font-display font-bold text-foreground text-base">GlobeGenie</h1><p className="text-xs text-muted-foreground">AI Travel Assistant</p></div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:px-8 max-w-3xl mx-auto w-full">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                {msg.content}
                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.options.map(opt => (
                      <button key={opt} onClick={() => handleSend(opt)} className="px-3 py-1.5 rounded-full bg-background text-foreground text-xs font-medium border border-border hover:border-primary hover:bg-primary/5 transition-colors compact-touch">{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isComplete && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex justify-center mt-6">
            <Link to="/itinerary"><Button size="lg" className="bg-gold-gradient text-accent-foreground font-semibold shadow-gold">View Your Itinerary →</Button></Link>
          </motion.div>
        )}
      </div>

      {!isComplete && (
        <div className="border-t border-border bg-card/80 backdrop-blur-xl p-3 sm:p-4 safe-bottom">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend(inputValue)} placeholder="Type your answer..." className="h-11" />
            <Button onClick={() => handleSend(inputValue)} size="icon" className="h-11 w-11 bg-ocean-gradient text-primary-foreground shrink-0"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
