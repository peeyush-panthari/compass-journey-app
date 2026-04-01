import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment.");
      throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in Supabase secrets.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      - name: String (Specific name of the place, do NOT club places together. E.g. "Eiffel Tower" not "Eiffel Tower and Champ de Mars")
      - description: Short description
      - whyVisit: Why it is worth visiting
      - openTime: Specific opening time (e.g. "09:00"), strictly output "Not Available" if unknown.
      - closeTime: Specific closing time (e.g. "18:00"), strictly output "Not Available" if unknown.
      - duration: Estimated time needed (e.g. "2 hours")
      - ticketPrice: Price if any (e.g. "$15" or "Free")
      - bestTimeToVisit: Specific time (e.g. "Early morning" or "Sunset")
      - travelTimeFromPrevious: Estimated travel time from previous location (e.g. "15 mins walk" or "10 mins taxi")
      - foodSuggestions: Array of top 3 restaurants or local food to try nearby
      - hiddenGems: Array of hidden gems or local experiences nearby
      - photoSpots: Array of the best photo spots at or near this location
      - restStops: Array of cafes or rest stops nearby
      - timeOfDay: Strictly one of: 'morning', 'afternoon', 'evening'
      - sortOrder: Chronological order of activity in the day
      - googleMapsUrl: Google Maps link if known (else null)

      Constraint 1 (CRITICAL): Ensure the itinerary is GEOGRAPHICALLY OPTIMIZED so that places visited within the same day are close to each other to minimize travel time.
      Constraint 2 (CRITICAL): A single day MUST cover activities from a SINGLE CITY ONLY. Do not mix cities on the same day.
      Constraint 3 (CRITICAL): DO NOT club or group 2 distinct places or activities together in a single entry. Each generated activity must be one single physical place.

      Please respond with a valid JSON object matching this schema:
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
                "googleMapsUrl": "string"
              }
            ]
          }
        ]
      }

      Respond ONLY with the JSON. Do not wrap the JSON in markdown code blocks.
    `;

    console.log("[generate-itinerary] Starting Gemini generation...");

    const geminiPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Gemini AI took too long to respond. Please try a shorter trip or try again.")),
        50000
      )
    );

    const result = await Promise.race([geminiPromise, timeoutPromise]);
    const text = result.response.text();
    console.log("[generate-itinerary] Gemini responded successfully.");

    if (Deno.env.get('LOG_GEMINI') === '1') {
      console.log("[generate-itinerary] Raw Gemini Response:", text);
      await supabaseClient.from('system_logs').insert([{
        level: 'debug',
        source: 'edge-function: generate-itinerary',
        message: 'Raw Gemini Response output',
        details: { text }
      }]);
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    let itineraryData;
    try {
      itineraryData = JSON.parse(jsonStr);
    } catch (err) {
      console.error("[generate-itinerary] JSON Parse Error. Raw string:", jsonStr.substring(0, 200));
      const cleanerStr = jsonStr.replace(/```json|```/g, "").trim();
      itineraryData = JSON.parse(cleanerStr);
    }

    const ensureArray = (val: any) => Array.isArray(val) ? val : [];

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

    const { userId, startDate: rawStartDate } = body;
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

      if (tripError) {
        console.error("[generate-itinerary] Error saving trip:", tripError);
        throw new Error(`Database Error (Trip): ${tripError.message}`);
      }

      itineraryData.tripId = trip.id;

      const daysToInsert = itineraryData.days.map((day: any, dayIdx: number) => {
        const currentDayDate = new Date(baseDate);
        currentDayDate.setDate(baseDate.getDate() + dayIdx);
        return {
          trip_id: trip.id,
          day_number: day.dayNumber || (dayIdx + 1),
          date: currentDayDate.toISOString().split('T')[0],
          city: day.city,
          country: day.country,
          sort_order: dayIdx
        };
      });

      const { data: dayRecords, error: daysError } = await supabaseClient
        .from('itinerary_days')
        .insert(daysToInsert)
        .select();

      if (daysError) {
        console.error("[generate-itinerary] Error saving days:", daysError);
        throw new Error(`Database Error (Days): ${daysError.message}`);
      }

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
                google_maps_url: act.googleMapsUrl,
                sort_order: actIdx
              });
            });
          }
        });

        if (activitiesToInsert.length > 0) {
          console.log("[generate-itinerary] Inserting", activitiesToInsert.length, "activities...");
          const { error: actsError } = await supabaseClient
            .from('activities')
            .insert(activitiesToInsert);

          if (actsError) {
            console.warn("[generate-itinerary] Enriched insert failed, trying minimal fallback. Error:", actsError.message);
            const minimalActivities = activitiesToInsert.map(a => ({
              day_id: a.day_id,
              name: a.name,
              description: a.description,
              duration: a.duration,
              time_of_day: a.time_of_day,
              sort_order: a.sort_order
            }));
            const { error: minError } = await supabaseClient
              .from('activities')
              .insert(minimalActivities);
            if (minError) {
              console.error("[generate-itinerary] Critical: Minimal insertion also failed.", minError);
            }
          }
        }
      }
    }

    await supabaseClient.from('system_logs').insert([{
      level: 'info',
      source: 'edge-function: generate-itinerary',
      message: 'Successfully generated and persisted itinerary',
      details: { tripId: itineraryData.tripId, size: JSON.stringify(itineraryData).length }
    }]);

    return new Response(JSON.stringify(itineraryData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[generate-itinerary] Error:", error.message, error.stack);

    try {
      await supabaseClient.from('system_logs').insert([{
        level: 'error',
        source: 'edge-function: generate-itinerary',
        message: error.message || 'Unknown error occurred',
        details: { stack: error.stack }
      }]);
    } catch (logErr) {
      console.error("Critical: Could not log error to database.", logErr);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});