import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Set up secured Service Role client for bypassing RLS to write to 'system_logs'
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    console.log("[generate-itinerary] Received payload:", JSON.stringify(body));

    await supabaseClient.from('system_logs').insert([{
      level: 'info',
      source: 'edge-function: generate-itinerary',
      message: 'Received payload for itinerary generation',
      details: body
    }]);

    const { 
      destination, dates, companion, purpose, experiences, pace, budget 
    } = body;

    const apiKey = Deno.env.get('GEMINI_API_KEY') || "";
    if (!apiKey) console.error("GEMINI_API_KEY is not set in environment.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are an expert travel planner. Create a detailed, day-by-day itinerary tailored to the following preferences:
      - Destinations: ${destination}
      - Dates/Duration: ${dates}
      - Companions: ${companion}
      - Purpose: ${purpose}
      - Preferred Experiences: ${experiences.join(', ')}
      - Travel Pace: ${pace}
      - Budget: ${budget}
      
      Respond purely in JSON format matching this schema:
      {
        "days": [
          {
            "dayNumber": number,
            "date": "YYYY-MM-DD",
            "city": "string",
            "country": "string",
            "activities": [
              {
                "name": "string",
                "description": "string",
                "duration": "string",
                "timeOfDay": "string",
                "bestTimeToVisit": "string"
              }
            ]
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (Deno.env.get('LOG_GEMINI') === '1') {
      console.log("[generate-itinerary] Raw Gemini Response:", text);
      await supabaseClient.from('system_logs').insert([{
        level: 'debug',
        source: 'edge-function: generate-itinerary',
        message: 'Raw Gemini Response output',
        details: { text }
      }]);
    }

    const jsonStr = text.replace(/```json|```/g, "").trim();
    let itineraryData = JSON.parse(jsonStr);

    // ENHANCEMENT: Truncate strings to prevent database schema insertion errors 
    // based on issues discovered in the previous 'globegenie' repository
    if (itineraryData.days && Array.isArray(itineraryData.days)) {
      itineraryData.days = itineraryData.days.map((day: any) => ({
        ...day,
        city: day.city?.substring(0, 100),
        country: day.country?.substring(0, 100),
        activities: day.activities?.map((act: any) => ({
          ...act,
          name: act.name?.substring(0, 255),
          timeOfDay: act.timeOfDay?.substring(0, 20),
          bestTimeToVisit: act.bestTimeToVisit?.substring(0, 100),
          travelTimeFromPrevious: act.travelTimeFromPrevious?.substring(0, 100),
          duration: act.duration?.substring(0, 20),
        }))
      }));
    }

    await supabaseClient.from('system_logs').insert([{
      level: 'info',
      source: 'edge-function: generate-itinerary',
      message: 'Successfully generated itinerary',
      details: { size: JSON.stringify(itineraryData).length }
    }]);

    return new Response(JSON.stringify(itineraryData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error(`[generate-itinerary] Error generating itinerary:`, error.message, error.stack);
    
    await supabaseClient.from('system_logs').insert([{
      level: 'error',
      source: 'edge-function: generate-itinerary',
      message: error.message || 'Unknown error occurred',
      details: { stack: error.stack }
    }]);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
});
