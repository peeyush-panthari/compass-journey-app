import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[GLOBEGENIE_LOG] [${requestId}] Incoming ${req.method} request to enrich-activity`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] Failed to parse request body:`, e);
      throw new Error("Invalid JSON body");
    }

    const { name, location } = body;
    console.log(`[GLOBEGENIE_LOG] [${requestId}] Enriching activity "${name}" at "${location}"`);

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] GOOGLE_PLACES_API_KEY is not set`);
      throw new Error("API key not configured");
    }
    
    // Enrichment of manually added activities with Google Places richness
    const query = encodeURIComponent(`${name} in ${location}`);
    const endpoint = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,rating,photos,formatted_address,geometry&key=${apiKey}`;
    
    console.log(`[GLOBEGENIE_LOG] [${requestId}] Calling Google Places API for enrichment...`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GLOBEGENIE_LOG] [${requestId}] Google Places API Error: ${response.status} - ${errText}`);
      throw new Error(`Places API failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates?.[0]) {
      const p = data.candidates[0];
      console.log(`[GLOBEGENIE_LOG] [${requestId}] ✨ Activity successfully enriched with Place ID: ${p.place_id}`);
      return new Response(JSON.stringify({ 
         placeId: p.place_id,
         rating: p.rating,
         address: p.formatted_address,
         photoReference: p.photos?.[0]?.photo_reference
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`[GLOBEGENIE_LOG] [${requestId}] ⚠️ No Places candidates found for activity enrichment.`);
    return new Response(JSON.stringify({ message: "No results matched this activity." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(`[GLOBEGENIE_LOG] [${requestId}] 🚨 ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
