import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function placePhotoStorageToken(photoReference: string) {
  return `placephoto:${photoReference}`;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

async function getPlaceAddress(placesKey: string, placeId: string) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address&key=${placesKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.result?.formatted_address) {
      return data.result.formatted_address as string;
    }
    return null;
  } catch (e) {
    console.error("[ENRICH_TRIP] address lookup failed:", (e as any)?.message || e);
    return null;
  }
}

async function enrichPlaceFromGoogle(placesKey: string, placeName: string, city: string) {
  const input = encodeURIComponent(`${placeName} in ${city}`);
  const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${input}&inputtype=textquery&fields=place_id,rating,photos,formatted_address&key=${placesKey}`;
  const pRes = await fetch(findUrl);
  const pData = await pRes.json();

  if (!pData.candidates?.[0]) return null;

  const c = pData.candidates[0];
  let photoRefs = c.photos?.map((p: any) => p.photo_reference).filter(Boolean) || [];
  let photoRef = photoRefs[0] || null;

  if (!photoRef && c.place_id) {
    const dUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(c.place_id)}&fields=photos,rating&key=${placesKey}`;
    const dRes = await fetch(dUrl);
    const dData = await dRes.json();
    if (dData.status === "OK") {
      photoRefs = dData.result?.photos?.map((p: any) => p.photo_reference).filter(Boolean) || [];
      photoRef = photoRefs[0] || null;
    }
  }

  if (photoRefs.length < 5) {
    try {
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${placeName} in ${city}`)}&key=${placesKey}`;
      const tRes = await fetch(textSearchUrl);
      const tData = await tRes.json();
      const supplemental = uniqueStrings(
        (tData.results || [])
          .flatMap((result: any) => (result.photos || []).map((photo: any) => photo.photo_reference))
      );
      photoRefs = uniqueStrings([...photoRefs, ...supplemental]);
    } catch (e) {
      console.error("[ENRICH_TRIP] supplemental photo search failed:", (e as any)?.message || e);
    }
  }

  return {
    google_place_id: c.place_id || null,
    rating: c.rating ?? null,
    photo_url: photoRef ? placePhotoStorageToken(photoRef) : null,
    photos: uniqueStrings(photoRefs).slice(0, 30).map((ref: string) => placePhotoStorageToken(ref)),
    formatted_address: c.formatted_address || null,
  };
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
    // Enrich if any visual payload is missing.
    const targets = activities.filter(a =>
      !a.youtube_videos || a.youtube_videos.length === 0 || !a.photo_url || !a.photos || a.photos.length === 0 || !a.google_place_id
    )
    console.log(`[ENRICH_TRIP] Found ${targets.length} targets for enrichment.`)

    const BATCH_SIZE = 15;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const batch = targets.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (act) => {
        const city = act.itinerary_days.city;
        const updates: any = {};

        if (placesKey) {
          try {
            const place = await enrichPlaceFromGoogle(placesKey, act.name, city);
            if (place) {
              if (place.google_place_id) {
                updates.google_place_id = place.google_place_id;
                updates.google_maps_url = `https://www.google.com/maps/place/?q=place_id:${place.google_place_id}`;
              }
              if (place.rating != null) updates.rating = place.rating;
              if (place.photo_url) updates.photo_url = place.photo_url;
              if (place.photos && place.photos.length > 0) updates.photos = place.photos;
              if (!act.address && place.google_place_id) {
                const address = await getPlaceAddress(placesKey, place.google_place_id);
                if (address) updates.address = address;
              } else if (!act.address && place.formatted_address) {
                updates.address = place.formatted_address;
              }
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
