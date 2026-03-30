import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destination, checkIn, checkOut, rooms, guests, filters } = await req.json();

    const apiKey = Deno.env.get('VITE_GOOGLE_MAPS_API_KEY');
    
    // Quick mockup integration with Google Places Text Search
    const endpoint = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hotels+in+${encodeURIComponent(destination)}&key=${apiKey}`;
    
    const response = await fetch(endpoint);
    const data = await response.json();

    return new Response(JSON.stringify({ results: data.results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
