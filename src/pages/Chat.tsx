import { useState, useRef, useEffect } from "react";
import { Send, Globe, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { generateWithGeminiFallback } from "@/lib/gemini";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: string[];
}

const chatFlow = [
  { question: "Hi! I'm GlobeGenie 🌍 Let's plan your perfect trip. Where would you like to go?", key: "destination" },
  { question: "Great choice! When are you planning to travel, and for how many days?", key: "dates" },
  { question: "Who's traveling?", options: ["Solo", "With friends", "As a couple", "Family with kids"], key: "group" },
  { question: "What's the purpose of your trip?", options: ["Leisure", "Business", "Honeymoon", "Adventure", "Cultural exploration"], key: "purpose" },
  { question: "What's your budget range?", options: ["Budget-friendly", "Mid-range", "Luxury", "No limit"], key: "budget" },
  { question: "What activities interest you most?", options: ["Historical sites", "Food & dining", "Nature & outdoors", "Adventure sports", "Shopping", "Nightlife"], key: "activities" },
  { question: "What pace do you prefer?", options: ["Relaxed — fewer stops", "Moderate — balanced mix", "Packed — see everything!"], key: "pace" }
];

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([{ id: "0", role: "assistant", content: chatFlow[0].question }]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Store user answers
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isGenerating]);

  const generateItinerary = async (finalAnswers: Record<string, string>) => {
    setIsGenerating(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Perfect! I have everything I need. 🎉 Let me generate your personalized trip using Gemini AI..." }]);
    
    try {
      const destination = finalAnswers["destination"] || "Paris";
      const numDays = finalAnswers["dates"] || "7 days";
      const companion = finalAnswers["group"] || "Solo";
      const purpose = finalAnswers["purpose"] || "Leisure";
      const experiences = [finalAnswers["activities"] || "Sightseeing"];
      const pace = finalAnswers["pace"] || "Moderate";
      const budget = finalAnswers["budget"] || "Mid-range";

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("Gemini API key is not configured.");
      }

      const prompt = `You are an expert travel planner. Create a detailed, day-by-day itinerary tailored to the following preferences:
- Destinations: ${destination}
- Dates/Duration: ${numDays}
- Companions: ${companion}
- Purpose: ${purpose}
- Preferred Experiences: ${experiences.join(', ')}
- Travel Pace: ${pace}
- Budget: ${budget}

Respond purely in JSON format matching this schema (NO markdown, NO code fences, ONLY raw JSON):
{
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "city": "string",
      "country": "string",
      "activities": [
        {
          "name": "string (max 200 chars)",
          "description": "string (max 500 chars)",
          "duration": "string (e.g. 2 hours)",
          "timeOfDay": "string (e.g. morning, afternoon, evening)",
          "bestTimeToVisit": "string"
        }
      ]
    }
  ]
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const rawText = await generateWithGeminiFallback(prompt, controller.signal);

      clearTimeout(timeoutId);

      const jsonStr = rawText.replace(/```json\s*|```\s*/g, "").trim();
      
      let itineraryData;
      try {
        itineraryData = JSON.parse(jsonStr);
      } catch (parseErr) {
        throw new Error("AI returned invalid JSON.");
      }

      if (!itineraryData?.days || !Array.isArray(itineraryData.days)) {
        throw new Error("AI returned an empty itinerary.");
      }

      // Persist to Supabase if user is logged in
      let tripId: string | null = null;
      if (user?.id) {
        try {
          const { data: trip, error: tripError } = await supabase.from('trips').insert({
            user_id: user.id,
            title: `Trip to ${destination}`,
            countries: [destination],
            num_days: itineraryData.days.length,
            companion,
            purpose,
            experiences,
            pace,
            budget_tier: budget,
            status: 'published'
          }).select().single();

          if (!tripError && trip) {
            tripId = trip.id;
            const daysToInsert = itineraryData.days.map((day: any, idx: number) => ({
              trip_id: trip.id,
              day_number: day.dayNumber,
              date: day.date,
              city: day.city,
              country: day.country,
              sort_order: idx
            }));

            const { data: dayRecords, error: daysError } = await supabase.from('itinerary_days').insert(daysToInsert).select();

            if (!daysError && dayRecords) {
              const activitiesToInsert: any[] = [];
              itineraryData.days.forEach((day: any) => {
                const dayRecord = dayRecords.find((r: any) => r.day_number === day.dayNumber);
                if (dayRecord && day.activities) {
                  day.activities.forEach((act: any, actIdx: number) => {
                    activitiesToInsert.push({
                      day_id: dayRecord.id,
                      name: act.name,
                      description: act.description,
                      duration: act.duration,
                      time_of_day: act.timeOfDay,
                      best_time_to_visit: act.bestTimeToVisit,
                      sort_order: actIdx
                    });
                  });
                }
              });
              if (activitiesToInsert.length > 0) {
                await supabase.from('activities').insert(activitiesToInsert);
              }
            }
          }
        } catch (dbErr) {
          console.warn("DB persistence failed:", dbErr);
        }
      }

      if (tripId) {
        navigate(`/trip?id=${tripId}`);
      } else {
        navigate("/trip", { state: { transientItinerary: itineraryData.days } });
      }
    } catch (err) {
      console.error("AI Generation Error:", err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Oops, something went wrong with the AI planner. Please try again later!" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = (value: string) => {
    if (!value.trim() || isComplete || isGenerating) return;
    
    const currentKey = chatFlow[currentStep].key;
    const updatedAnswers = { ...answers, [currentKey]: value };
    setAnswers(updatedAnswers);
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: value };
    
    const nextStep = currentStep + 1;
    if (nextStep < chatFlow.length) {
      const nextQ = chatFlow[nextStep];
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: nextQ.question, options: nextQ.options };
      setMessages(prev => [...prev, userMsg, botMsg]);
      setCurrentStep(nextStep);
    } else {
      setMessages(prev => [...prev, userMsg]);
      generateItinerary(updatedAnswers);
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
                {msg.options && !isGenerating && !isComplete && msg.id === messages[messages.length -1].id && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.options.map(opt => (
                      <button key={opt} onClick={() => handleSend(opt)} className="px-3 py-1.5 rounded-full bg-background text-foreground text-xs font-medium border border-border hover:border-primary hover:bg-primary/5 transition-colors compact-touch">{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isGenerating && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-muted text-foreground rounded-bl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Thinking...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isComplete && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex justify-center mt-6 mb-12">
            <Link to="/trip"><Button size="lg" className="bg-gold-gradient text-accent-foreground font-semibold shadow-gold">View Your Trip →</Button></Link>
          </motion.div>
        )}
      </div>

      {!isComplete && !isGenerating && (
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
