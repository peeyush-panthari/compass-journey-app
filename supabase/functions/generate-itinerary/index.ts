import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Global logger helper
async function logEvent(supabase: any, requestId: string, userId: string | null, eventType: string, status: string, message: string, payload?: any) {
  try {
    const { error } = await supabase.from('system_logs').insert({
      request_id: requestId,
      user_id: userId === "00000000-0000-0000-0000-000000000000" ? null : userId,
      event_type: eventType,
      status: status,
      message: message,
      payload: payload
    });
    if (error) console.error(`[GLOBEGENIE_LOG] Failed to write system log: ${error.message}`);
  } catch (e) {
    console.error(`[GLOBEGENIE_LOG] Logger crash:`, e);
  }
}

serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[GLOBEGENIE_LOG] [${requestId}] Incoming ${req.method} request to generate-itinerary`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '')

  try {
    let body;
    try {
      body = await req.json();
      console.log(`[GLOBEGENIE_LOG] [${requestId}] Request body parsed successfully`);
    } catch (e) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] Failed to parse request body:`, e);
      throw new Error("Invalid JSON body");
    }

    const { 
      destination, dates, companion, purpose, experiences, pace, budget, userId, startDate 
    } = body;

    await logEvent(supabase, requestId, userId, 'REQUEST_INBOUND', 'pending', `Starting curation for ${destination}`, { 
      destination, dates, userId 
    });

    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🛫 Generating voyage for user: ${userId} to ${destination}`);

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const placesKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    const youtubeKey = Deno.env.get('YOUTUBE_API_KEY')

    if (!geminiKey) throw new Error("GEMINI_API_KEY NOT SET in Edge secrets")

    // 1. Call Gemini AI (Stable Flask Model)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
    
    const prompt = `
      As a luxury travel designer, create a premium day-by-day JSON itinerary for ${destination}.
      Trip context: ${dates} days, traveling as ${companion}, purpose: ${purpose}, pace: ${pace}, budget: ${budget}.
      Specific Interests: ${Array.isArray(experiences) ? experiences.join(', ') : experiences}.
      Respond ONLY with a JSON array of days.
      Day schema: { "dayNumber": 1, "city": "City", "country": "Country", "activities": [{ "name": "Name", "description": "Compelling short description", "whyVisit": "Insider secret tip", "timeOfDay": "morning|afternoon|evening", "duration": "e.g. 2h", "ticketPrice": "e.g. Free or $20", "openTime": "string", "closeTime": "string", "foodSuggestions": ["Nearby Resto"], "hiddenGems": ["Nearby Secret"], "photoSpots": ["Best spot"] }] }
    `

    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🤖 Consulting Gemini AI...`);
    await logEvent(supabase, requestId, userId, 'AI_TRIGGER', 'pending', 'Sending prompt to Gemini');
    
    const geminiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Gemini API Error: ${geminiRes.status} - ${errText}`);
      throw new Error(`Gemini failed: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
    
    const dataText = text.trim()
    const jsonMatch = dataText.match(/\[[\s\S]*\]/)
    const jsonStrClean = jsonMatch ? jsonMatch[0] : dataText.replace(/```json|```/g, "").trim()
    
    let itinerary;
    try {
      itinerary = JSON.parse(jsonStrClean)
      console.log(`[GLOBEGENIE_LOG] [${requestId}] ✨ Gemini success! Generated ${itinerary.length} days.`);
      if (!Array.isArray(itinerary) || itinerary.length === 0) throw new Error("AI returned empty itinerary");
      await logEvent(supabase, requestId, userId, 'AI_RESPONSE', 'success', `Generated ${itinerary.length} days`);
    } catch (e: any) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Failed to parse Gemini response: ${e.message}`, text);
      throw new Error(`AI generated invalid data structure: ${e.message}`);
    }

    // 2. Controlled Enrichment Pipeline
    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🔍 Beginning Deep Enrichment (Parallel Batches)...`);
    const startObj = startDate ? new Date(startDate) : new Date();
    
    const allActivities: any[] = [];
    itinerary.forEach((day: any, dIdx: number) => {
      const d = new Date(startObj);
      d.setDate(startObj.getDate() + dIdx);
      day.date = d.toISOString().split('T')[0];
      day.activities?.forEach((act: any) => {
        allActivities.push({ act, city: day.city });
      });
    });

    await logEvent(supabase, requestId, userId, 'ENRICHMENT_START', 'pending', `Starting enrichment for ${allActivities.length} activities`);

    const BATCH_SIZE = 15; // Increased to parallelize more and beat 60s timeout
    for (let i = 0; i < allActivities.length; i += BATCH_SIZE) {
      const batch = allActivities.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async ({ act, city }) => {
        if (placesKey) {
          try {
            const query = encodeURIComponent(`${act.name} in ${city}`);
            const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,rating,formatted_address&key=${placesKey}`;
            const pRes = await fetch(placesUrl);
            const pData = await pRes.json();
            if (pData.candidates?.[0]) {
              act.googlePlaceId = pData.candidates[0].place_id;
              act.rating = pData.candidates[0].rating || 4.8;
              act.address = pData.candidates[0].formatted_address;
            }
          } catch (e: any) {
            console.warn(`[GLOBEGENIE_LOG] [${requestId}] ⚠️ Places enrichment failed:`, e.message);
          }
        }
        if (youtubeKey) {
          try {
            const ytQuery = encodeURIComponent(`${act.name} ${city} travel guide`);
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=${ytQuery}&type=video&key=${youtubeKey}`;
            const yRes = await fetch(ytUrl);
            if (yRes.ok) {
              const yData = await yRes.json();
              act.youtubeVideos = yData.items?.map((item: any) => ({
                title: item.snippet.title,
                videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnailUrl: item.snippet.thumbnails?.high?.url
              })) || [];
            }
          } catch (e: any) {
            console.warn(`[GLOBEGENIE_LOG] [${requestId}] ⚠️ YouTube enrichment failed:`, e.message);
          }
        }
        act.photoUrl = `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800`;
        act.photos = [act.photoUrl];
      }));
    }

    // 3. Persist Trip to Database
    console.log(`[GLOBEGENIE_LOG] [${requestId}] 💾 Persisting itinerary to database...`);
    if (userId && supabaseUrl && supabaseServiceKey) {
      const { data: trip, error: tripErr } = await supabase.from('trips').insert({
        user_id: userId,
        title: `Curated Voyage: ${destination || 'Untitled Journey'}`,
        countries: Array.isArray(destination) ? destination : [destination || 'Worldwide'],
        start_date: startObj.toISOString().split('T')[0],
        num_days: itinerary.length,
        companion: companion || 'Solo',
        purpose: purpose || 'Leisure',
        experiences: Array.isArray(experiences) ? experiences : [experiences || 'Cultural'],
        pace: pace || 'Moderate',
        budget_tier: budget || 'Mid-range',
        status: 'published'
      }).select().single()

      if (tripErr) throw tripErr;

      if (trip) {
        const { data: days, error: daysErr } = await supabase.from('itinerary_days').insert(
          itinerary.map((d: any) => ({
            trip_id: trip.id,
            day_number: d.dayNumber,
            date: d.date,
            city: d.city,
            country: d.country,
            sort_order: d.dayNumber - 1
          }))
        ).select()

        if (daysErr) throw daysErr;

        if (days) {
          const actsToInsert: any[] = []
          itinerary.forEach((d: any) => {
            const dayId = days.find((r: any) => r.day_number === d.dayNumber)?.id
            if (dayId) {
              d.activities?.forEach((act: any, aIdx: number) => {
                actsToInsert.push({
                   day_id: dayId,
                   name: act.name,
                   description: act.description,
                   why_visit: act.whyVisit,
                   time_of_day: act.timeOfDay,
                   duration: act.duration,
                   open_time: act.openTime,
                   close_time: act.closeTime,
                   ticket_price: act.ticketPrice,
                   food_suggestions: act.foodSuggestions,
                   hidden_gems: act.hiddenGems,
                   photo_spots: act.photoSpots,
                   photo_url: act.photoUrl,
                   photos: act.photos,
                   youtube_videos: act.youtubeVideos,
                   sort_order: aIdx
                })
              })
            }
          })
          if (actsToInsert.length > 0) {
            const { error: actsErr } = await supabase.from('activities').insert(actsToInsert);
            if (actsErr) throw actsErr;
          }
          await logEvent(supabase, requestId, userId, 'DB_PERSISTENCE', 'success', `Saved trip ${trip.id}`);
        }
        
        console.log(`[GLOBEGENIE_LOG] [${requestId}] 🏁 Voyage complete: ${trip.id}`);
        return new Response(JSON.stringify({ tripId: trip.id, days: itinerary }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }
    }

    return new Response(JSON.stringify({ days: itinerary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error(`[GLOBEGENIE_LOG] [${requestId}] 🚨 CRITICAL ERROR:`, err)
    // Extract userId safely even if body parsing failed
    const fallbackUserId = (req as any)._body?.userId || "unknown";
    await logEvent(supabase, requestId, fallbackUserId, 'ERROR', 'error', err.message, { stack: err.stack });
    return new Response(JSON.stringify({ 
      error: true, 
      message: err.message || "An unexpected error occurred",
      trace: requestId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
