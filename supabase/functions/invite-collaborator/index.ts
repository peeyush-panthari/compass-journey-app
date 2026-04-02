import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[GLOBEGENIE_LOG] [${requestId}] Incoming ${req.method} request to invite-collaborator`);

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

    const { tripId, email, phone, role = 'viewer' } = body;
    console.log(`[GLOBEGENIE_LOG] [${requestId}] Inviting role "${role}" for tripId: ${tripId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')
    const appUrl = Deno.env.get('APP_URL') || 'https://globegenie.app'

    console.log(`[GLOBEGENIE_LOG] [${requestId}] Checking creds...`, {
      supabase: !!supabaseUrl && !!supabaseServiceKey,
      twilio: !!twilioSid && !!twilioToken && !!twilioPhone
    });

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase auth not set up in secrets")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: trip, error: tripErr } = await supabase.from('trips').select('title').eq('id', tripId).single()
    if (tripErr || !trip) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] Journey project not found:`, tripErr);
      throw new Error("Journey project not found")
    }

    let inviteDetails = { method: null, sent: false }

    // 1. Send SMS Invite (Twilio)
    if (phone && twilioSid && twilioToken && twilioPhone) {
        console.log(`[GLOBEGENIE_LOG] [${requestId}] 📱 Sending SMS via Twilio to ${phone} for "${trip.title}"`);
        const auth = btoa(`${twilioSid}:${twilioToken}`)
        const smsBody = new URLSearchParams({
            From: twilioPhone,
            To: phone,
            Body: `🌍 Pack your bags! You have been invited to collaborate on "${trip.title}"! Join the journey here: ${appUrl}/trip/${tripId}`
        })

        const tRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: smsBody.toString()
        })

        if (tRes.ok) {
            console.log(`[GLOBEGENIE_LOG] [${requestId}] ✅ Twilio SMS success!`);
            inviteDetails = { method: 'sms', sent: true }
        } else {
            const errBody = await tRes.json()
            console.error(`[GLOBEGENIE_LOG] [${requestId}] ⚠️ Twilio API error:`, errBody);
        }
    } else {
        console.warn(`[GLOBEGENIE_LOG] [${requestId}] Skipping SMS (skipped phone or lack of Twilio credentials)`);
    }

    // 2. Persist to DB
    console.log(`[GLOBEGENIE_LOG] [${requestId}] Persisting collaborator record to db...`);
    const { error: collErr } = await supabase.from('trip_collaborators').insert({
        trip_id: tripId,
        email: email || null,
        phone: phone || null,
        role,
        accepted: false
    })

    if (collErr) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Collaborator persistence failed:`, collErr);
      throw collErr;
    }

    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🏁 Invitation process complete.`);
    return new Response(JSON.stringify({ success: true, invite: inviteDetails }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`[GLOBEGENIE_LOG] [${requestId}] 🚨 CRITICAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
});
