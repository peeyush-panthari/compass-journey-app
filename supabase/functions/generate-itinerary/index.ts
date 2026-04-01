import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- HELPER: REST API GEMINI CALL ---
async function callGemini(apiKey: string, prompt: string) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[generate-itinerary] Attempting generation with model: ${model}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            }
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Model ${model} failed with status ${response.status}: ${errBody.substring(0, 200)}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error(`Model ${model} returned empty response.`);
      
      console.log(`[generate-itinerary] Successfully generated with model: ${model}`);
      return text;

    } catch (err) {
      console.warn(`[generate-itinerary] Model ${model} error:`, err.message);
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // --- CLIENT SETUP ---
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    const body = await req.json();
    const { destination, dates, companion, purpose, experiences, pace, budget, userId, startDate: rawStartDate } = body;

    // --- SAFE LOGGING ---
    try {
      await supabaseClient.from('system_logs').insert([{
        level: 'info',
        source: 'edge-function: generate-itinerary',
        message: 'Received generation request',
        details: { destination, dates, companion, userId }
      }]);
    } catch (logErr) {
      console.error("[generate-itinerary] Non-fatal: Could not log to system_logs. Table might be missing.", logErr.message);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set in secrets.");

    // --- PROMPT ---
    const prompt = `
      Generate a detailed travel itinerary for a trip to ${destination}.
      Trip Details:
      - Duration: ${dates}
      - Traveling with: ${companion}
      - Purpose: ${purpose}
      - Pace: ${pace}
      - Budget: ${budget}
      - Preferences: ${experiences.join(', ')}

      For every place in the itinerary MUST include:
      - name: String
      - description: Short description
      - whyVisit: Why it is worth visiting
      - openTime: Specific opening time (e.g. "09:00"), else "Not Available"
      - closeTime: Specific closing time (e.g. "18:00"), else "Not Available"
      - duration: (e.g. "2 hours")
      - ticketPrice: (e.g. "$15" or "Free")
      - bestTimeToVisit: (e.g. "Early morning")
      - travelTimeFromPrevious: (e.g. "15 mins walk")
      - foodSuggestions: Array of top 3 nearby
      - hiddenGems: Array of nearby gems
      - photoSpots: Array of photo spots
      - restStops: Array of cafes/rest stops
      - timeOfDay: 'morning', 'afternoon' or 'evening'
      - sortOrder: number
      - googleMapsUrl: Google Maps link if known (else null)

      Constraint 1 (CRITICAL): Ensure the itinerary is GEOGRAPHICALLY OPTIMIZED.
      Constraint 2 (CRITICAL): A single day MUST cover activities from a SINGLE CITY ONLY.
      Constraint 3 (CRITICAL): Response MUST be valid JSON.

      Respond ONLY with this JSON schema:
      {
        "days": [
          {
            "dayNumber": number,
            "city": "string",
            "country": "string",
            "activities": [
              {
                "name": "string",
                "description": "string",
                "whyVisit": "string",
                "openTime": "string",
                "closeTime": "string",
                "duration": "string",
                "ticketPrice": "string",
                "bestTimeToVisit": "string",
                "travelTimeFromPrevious": "string",
                "foodSuggestions": ["string"],
                "hiddenGems": ["string"],
                "photoSpots": ["string"],
                "restStops": ["string"],
                "timeOfDay": "string",
                "sortOrder": number,
                "google_maps_url": "string"
              }
            ]
          }
        ]
      }
    `;

    // --- GEMINI EXECUTION ---
    const text = await callGemini(apiKey, prompt);

    // --- EXTRACTION & CLEANUP ---
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    let itineraryData;
    try {
      itineraryData = JSON.parse(jsonStr);
    } catch (err) {
      const cleanerStr = jsonStr.replace(/```json|```/g, "").trim();
      itineraryData = JSON.parse(cleanerStr);
    }

    const ensureArray = (val: any) => Array.isArray(val) ? val : [];

    // ENHANCEMENT: Schema Resilience Truncation
    if (itineraryData.days && Array.isArray(itineraryData.days)) {
      itineraryData.days = itineraryData.days.map((day: any) => ({
        ...day,
        city: day.city?.substring(0, 100),
        country: day.country?.substring(0, 100),
        activities: (day.activities || []).map((act: any) => ({
          ...act,
          name: act.name?.substring(0, 255),
          description: act.description?.substring(0, 1500),
          whyVisit: act.whyVisit?.substring(0, 1000),
          timeOfDay: act.timeOfDay?.substring(0, 20),
          bestTimeToVisit: act.bestTimeToVisit?.substring(0, 100),
          travelTimeFromPrevious: act.travelTimeFromPrevious?.substring(0, 100),
          duration: act.duration?.substring(0, 50),
          ticketPrice: act.ticketPrice?.substring(0, 50),
          openTime: act.openTime?.substring(0, 20),
          closeTime: act.closeTime?.substring(0, 20),
          foodSuggestions: ensureArray(act.foodSuggestions),
          hiddenGems: ensureArray(act.hiddenGems),
          photoSpots: ensureArray(act.photoSpots),
          restStops: ensureArray(act.restStops)
        }))
      }));
    }

    // --- PERSISTENCE ---
    const baseDate = rawStartDate ? new Date(rawStartDate) : new Date();

    if (userId) {
      console.log("[generate-itinerary] Persisting trip for user:", userId);

      const { data: trip, error: tripError } = await supabaseClient.from('trips').insert({
        user_id: userId,
        title: `Trip to ${destination}`,
        countries: Array.isArray(destination) ? destination : [destination],
        start_date: baseDate.toISOString().split('T')[0],
        num_days: itineraryData.days.length,
        companion,
        purpose,
        experiences: Array.isArray(experiences) ? experiences : [experiences],
        pace,
        budget_tier: budget,
        status: 'published'
      }).select().single();

      if (tripError) throw new Error(`Database Error (Trip): ${tripError.message}`);

      itineraryData.tripId = trip.id;

      const daysToInsert = itineraryData.days.map((day: any, dayIdx: number) => {
        const dDate = new Date(baseDate);
        dDate.setDate(baseDate.getDate() + dayIdx);
        return {
          trip_id: trip.id,
          day_number: day.dayNumber || (dayIdx + 1),
          date: dDate.toISOString().split('T')[0],
          city: day.city,
          country: day.country,
          sort_order: dayIdx
        };
      });

      const { data: dayRecords, error: daysError } = await supabaseClient
        .from('itinerary_days')
        .insert(daysToInsert)
        .select();

      if (daysError) throw new Error(`Database Error (Days): ${daysError.message}`);

      if (dayRecords) {
        const activitiesToInsert: any[] = [];
        itineraryData.days.forEach((day: any, dayIdx: number) => {
          const dayNum = day.dayNumber || (dayIdx + 1);
          const dayRecord = dayRecords.find((r: any) => r.day_number === dayNum);
          if (dayRecord && day.activities) {
            day.activities.forEach((act: any, actIdx: number) => {
              activitiesToInsert.push({
                day_id: dayRecord.id,
                name: act.name,
                description: act.description,
                why_visit: act.whyVisit,
                duration: act.duration,
                time_of_day: act.timeOfDay,
                best_time_to_visit: act.bestTimeToVisit,
                open_time: act.openTime,
                close_time: act.closeTime,
                ticket_price: act.ticketPrice,
                travel_time_from_previous: act.travelTimeFromPrevious,
                food_suggestions: act.foodSuggestions,
                hidden_gems: act.hiddenGems,
                photo_spots: act.photoSpots,
                rest_stops: act.restStops,
                google_maps_url: act.google_maps_url,
                sort_order: actIdx
              });
            });
          }
        });

        if (activitiesToInsert.length > 0) {
          const { error: actsError } = await supabaseClient.from('activities').insert(activitiesToInsert);
          
          if (actsError) {
            console.warn("[generate-itinerary] Enriched insert failed, trying minimal fallback:", actsError.message);
            const minActs = activitiesToInsert.map(a => ({
              day_id: a.day_id,
              name: a.name,
              description: a.description,
              duration: a.duration,
              time_of_day: a.time_of_day,
              sort_order: a.sort_order
            }));
            const { error: minError } = await supabaseClient.from('activities').insert(minActs);
            if (minError) console.error("[generate-itinerary] Critical: Minimal insert also failed.", minError);
          }
        }
      }
    }

    return new Response(JSON.stringify(itineraryData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[generate-itinerary] Error:", error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});