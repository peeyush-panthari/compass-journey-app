import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '')

  try {
    const { tripId } = await req.json()
    if (!tripId) throw new Error("tripId is required")

    console.log(`[ENRICH_TRIP] Starting Phase 2 enrichment for trip: ${tripId}`)

    const placesKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    const youtubeKey = Deno.env.get('YOUTUBE_API_KEY')

    // 1. Fetch all activities for this trip
    const { data: activities, error: actErr } = await supabase
      .from('activities')
      .select('*, itinerary_days!inner(trip_id, city)')
      .eq('itinerary_days.trip_id', tripId)

    if (actErr) throw actErr
    if (!activities || activities.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No activities to enrich" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 2. Parallel Enrichment (Batch of 15)
    // We only enrich if youtube_videos is null or empty
    const targets = activities.filter(a => !a.youtube_videos || a.youtube_videos.length === 0)
    console.log(`[ENRICH_TRIP] Found ${targets.length} targets for enrichment.`)

    const BATCH_SIZE = 15;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const batch = targets.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (act) => {
        const city = act.itinerary_days.city;
        const updates: any = {};

        if (placesKey && !act.google_place_id) {
          try {
            const query = encodeURIComponent(`${act.name} in ${city}`);
            const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,rating,formatted_address&key=${placesKey}`;
            const pRes = await fetch(placesUrl);
            const pData = await pRes.json();
            if (pData.candidates?.[0]) {
              updates.google_place_id = pData.candidates[0].place_id;
              updates.rating = pData.candidates[0].rating || 4.8;
            }
          } catch (e) {}
        }

        if (youtubeKey) {
          try {
            const ytQuery = encodeURIComponent(`${act.name} ${city} travel guide`);
            const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=${ytQuery}&type=video&key=${youtubeKey}`;
            const yRes = await fetch(ytUrl);
            if (yRes.ok) {
              const yData = await yRes.json();
              updates.youtube_videos = yData.items?.map((item: any) => ({
                title: item.snippet.title,
                videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnailUrl: item.snippet.thumbnails?.high?.url
              })) || [];
            }
          } catch (e) {}
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from('activities').update(updates).eq('id', act.id);
        }
      }));
    }

    console.log(`[ENRICH_TRIP] Phase 2 enrichment complete for trip: ${tripId}`)
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error(`[ENRICH_TRIP] Fatal error:`, err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
