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
    const { tripId, email, role } = await req.json();

    console.log(`Sending invitation for ${tripId} to ${email} as ${role}`);
    
    // In a production environment, this is where you'd trigger a service like Resend or SendGrid.
    // For local development, returning success.
    
    return new Response(JSON.stringify({ success: true, message: "Invitation mock sent to " + email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
});
