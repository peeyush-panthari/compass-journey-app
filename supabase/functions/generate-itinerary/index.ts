import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[GLOBEGENIE_LOG] [${requestId}] Incoming ${req.method} request to generate-itinerary`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🛫 Generating voyage for user: ${userId} to ${destination}`);
    console.log(`[GLOBEGENIE_LOG] [${requestId}] 📅 Dates: ${dates} | Companion: ${companion} | Purpose: ${purpose}`);

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const placesKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    const youtubeKey = Deno.env.get('YOUTUBE_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log(`[GLOBEGENIE_LOG] [${requestId}] Secrets check:`, {
      geminiKey: !!geminiKey,
      placesKey: !!placesKey,
      youtubeKey: !!youtubeKey,
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey
    });

    if (!geminiKey) throw new Error("GEMINI_API_KEY NOT SET in Edge secrets")

    // 1. Call Gemini AI (Native Fetch)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`
    
    const prompt = `
      As a luxury travel designer, create a premium day-by-day JSON itinerary for ${destination}.
      Trip context: ${dates} days, traveling as ${companion}, purpose: ${purpose}, pace: ${pace}, budget: ${budget}.
      Specific Interests: ${Array.isArray(experiences) ? experiences.join(', ') : experiences}.
      Respond ONLY with a JSON array of days.
      Day schema: { "dayNumber": 1, "city": "City", "country": "Country", "activities": [{ "name": "Name", "description": "Compelling short description", "whyVisit": "Insider secret tip", "timeOfDay": "morning|afternoon|evening", "duration": "e.g. 2h", "ticketPrice": "e.g. Free or $20", "openTime": "string", "closeTime": "string", "foodSuggestions": ["Nearby Resto"], "hiddenGems": ["Nearby Secret"], "photoSpots": ["Best spot"] }] }
    `

    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🤖 Consulting Gemini AI...`);
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
    
    console.log(`[GLOBEGENIE_LOG] [${requestId}] 📝 Raw Gemini text length: ${text.length}`);
    
    const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || text
    let itinerary;
    try {
      itinerary = JSON.parse(jsonStr.replace(/```json|```/g, "").trim())
      console.log(`[GLOBEGENIE_LOG] [${requestId}] ✨ Gemini success! Generated ${itinerary.length} days.`);
    } catch (e) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Failed to parse Gemini response as JSON:`, text);
      throw new Error("JSON parsing failed for AI response");
    }

    // 2. Controlled Enrichment Pipeline (Batching to prevent timeouts/limits)
    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🔍 Beginning Deep Enrichment (Parallel Batches)...`);
    const startObj = startDate ? new Date(startDate) : new Date();
    
    // Flatten activities for batch processing
    const allActivities: any[] = [];
    itinerary.forEach((day: any, dIdx: number) => {
      const d = new Date(startObj);
      d.setDate(startObj.getDate() + dIdx);
      day.date = d.toISOString().split('T')[0];
      day.activities?.forEach((act: any) => {
        allActivities.push({ act, city: day.city });
      });
    });

    const BATCH_SIZE = 5; // Process 5 activities at a time
    for (let i = 0; i < allActivities.length; i += BATCH_SIZE) {
      const batch = allActivities.slice(i, i + BATCH_SIZE);
      console.log(`[GLOBEGENIE_LOG] [${requestId}] 📦 Processing Enrichment Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allActivities.length/BATCH_SIZE)}`);
      
      await Promise.all(batch.map(async ({ act, city }) => {
        // Google Places Enrichment
        if (placesKey) {
          try {
            const query = encodeURIComponent(`${act.name} in ${city}`);
            const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,rating,formatted_address&key=${placesKey}`;
            const pRes = await fetch(placesUrl);
            const pData = await pRes.json();
            if (pData.candidates?.[0]) {
              console.log(`[GLOBEGENIE_LOG] [${requestId}] 📍 Places matched: "${act.name}"`);
              act.googlePlaceId = pData.candidates[0].place_id;
              act.rating = pData.candidates[0].rating || 4.8;
              act.address = pData.candidates[0].formatted_address;
            }
          } catch (e: any) {
            console.warn(`[GLOBEGENIE_LOG] [${requestId}] ⚠️ Places enrichment failed for "${act.name}":`, e.message);
          }
        }
        
        // YouTube Enrichment
        if (youtubeKey) {
          try {
            const ytQuery = encodeURIComponent(`${act.name} ${city} travel guide`);
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=${ytQuery}&type=video&key=${youtubeKey}`;
            const yRes = await fetch(ytUrl);
            const yData = await yRes.json();
            act.youtubeVideos = yData.items?.map((item: any) => ({
              title: item.snippet.title,
              videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              thumbnailUrl: item.snippet.thumbnails?.high?.url
            })) || [];
          } catch (e: any) {
            console.warn(`[GLOBEGENIE_LOG] [${requestId}] ⚠️ YouTube enrichment failed for "${act.name}":`, e.message);
          }
        }

        act.photoUrl = `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800`;
        act.photos = [act.photoUrl];
      }));
    }

    // 3. Persist Trip to Database
    console.log(`[GLOBEGENIE_LOG] [${requestId}] 💾 Persisting itinerary to database...`);
    if (userId && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: trip, error: tripErr } = await supabase.from('trips').insert({
        user_id: userId,
        title: `Curated Voyage: ${destination}`,
        countries: [destination],
        start_date: startObj.toISOString().split('T')[0],
        num_days: itinerary.length,
        companion,
        purpose,
        experiences: Array.isArray(experiences) ? experiences : [experiences],
        pace,
        budget_tier: budget,
        status: 'published'
      }).select().single()

      if (tripErr) {
        console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Trip insertion failed:`, tripErr);
        throw tripErr;
      }

      if (trip) {
        console.log(`[GLOBEGENIE_LOG] [${requestId}] 🏛️ Created trip record: ${trip.id}`);
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

        if (daysErr) {
          console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Days insertion failed:`, daysErr);
          throw daysErr;
        }

        if (days) {
          const actsToInsert: any[] = []
          itinerary.forEach((d: any) => {
            const dayId = days.find((r: any) => r.day_number === d.dayNumber)?.id
            if (dayId) {
              console.log(`[GLOBEGENIE_LOG] [${requestId}] 🗺️ Processing Day ${d.dayNumber} activities`);
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
            if (actsErr) {
              console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Activities insertion failed:`, actsErr);
              throw actsErr;
            }
            console.log(`[GLOBEGENIE_LOG] [${requestId}] 📝 Successfully inserted ${actsToInsert.length} activities.`);
          }
        }
        console.log(`[GLOBEGENIE_LOG] [${requestId}] 🏁 Voyage curation complete for trip: ${trip.id}`);
        return new Response(JSON.stringify({ tripId: trip.id, days: itinerary }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }
    }

    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🏁 Returning itinerary without DB persistence (missing userId or creds)`);
    return new Response(JSON.stringify({ days: itinerary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error(`[GLOBEGENIE_LOG] [${requestId}] 🚨 CRITICAL ERROR:`, err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
