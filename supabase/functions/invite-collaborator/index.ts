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
    const authHeader = req.headers.get('Authorization')

    console.log(`[GLOBEGENIE_LOG] [${requestId}] Checking creds...`, {
      supabase: !!supabaseUrl && !!supabaseServiceKey,
      twilio: !!twilioSid && !!twilioToken && !!twilioPhone
    });

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase auth not set up in secrets")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null
    const token = authHeader?.replace('Bearer ', '')
    if (!token) throw new Error("Missing authorization token")

    const { data: inviterUserData, error: inviterUserErr } = await supabase.auth.getUser(token)
    const inviter = inviterUserData?.user
    if (inviterUserErr || !inviter) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] Invalid inviter token:`, inviterUserErr)
      throw new Error("Unauthorized")
    }

    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', inviter.id)
      .maybeSingle()

    const { data: trip, error: tripErr } = await supabase.from('trips').select('id, title, user_id').eq('id', tripId).single()
    if (tripErr || !trip) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] Journey project not found:`, tripErr);
      throw new Error("Journey project not found")
    }

    if (trip.user_id !== inviter.id) {
      const { data: collaboration, error: collaborationErr } = await supabase
        .from('trip_collaborators')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', inviter.id)
        .eq('accepted', true)
        .in('role', ['owner', 'editor'])
        .maybeSingle()

      if (collaborationErr || !collaboration) {
        console.error(`[GLOBEGENIE_LOG] [${requestId}] Inviter lacks access:`, collaborationErr)
        throw new Error("You do not have permission to invite collaborators to this trip")
      }
    }

    let inviteDetails = { method: null, sent: false, provider: null }
    let collaboratorUserId: string | null = null

    if (normalizedEmail) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('email', normalizedEmail)
        .maybeSingle()

      collaboratorUserId = existingProfile?.id || null

      if (collaboratorUserId) {
        const redirectTo = `${appUrl}/invite?trip_id=${encodeURIComponent(tripId)}&mode=signin`
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: redirectTo,
            data: {
              trip_id: tripId,
              trip_title: trip.title,
              inviter_name: inviterProfile?.full_name || inviter.email || 'A GlobeGenie traveler',
              invite_mode: 'signin',
            },
          },
        })

        if (otpErr) {
          console.error(`[GLOBEGENIE_LOG] [${requestId}] Existing user email invite failed:`, otpErr)
        } else {
          inviteDetails = { method: 'email', sent: true, provider: 'magiclink' }
        }
      } else {
        const redirectTo = `${appUrl}/invite?trip_id=${encodeURIComponent(tripId)}&mode=signup`
        const { data: inviteUserData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo,
          data: {
            trip_id: tripId,
            trip_title: trip.title,
            inviter_name: inviterProfile?.full_name || inviter.email || 'A GlobeGenie traveler',
            invite_mode: 'signup',
          },
        })

        if (inviteErr) {
          console.error(`[GLOBEGENIE_LOG] [${requestId}] New user email invite failed:`, inviteErr)
        } else {
          collaboratorUserId = inviteUserData.user?.id ?? null
          inviteDetails = { method: 'email', sent: true, provider: 'supabase_invite' }
        }
      }
    }

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
            inviteDetails = { method: 'sms', sent: true, provider: 'twilio' }
        } else {
            const errBody = await tRes.json()
            console.error(`[GLOBEGENIE_LOG] [${requestId}] ⚠️ Twilio API error:`, errBody);
        }
    } else {
        console.warn(`[GLOBEGENIE_LOG] [${requestId}] Skipping SMS (skipped phone or lack of Twilio credentials)`);
    }

    // 2. Persist to DB
    console.log(`[GLOBEGENIE_LOG] [${requestId}] Persisting collaborator record to db...`);
    const collaboratorPayload = {
      trip_id: tripId,
      user_id: collaboratorUserId,
      email: normalizedEmail || null,
      role,
      invited_by: inviter.id,
      accepted: Boolean(collaboratorUserId),
    }

    let existingCollaborator = null

    if (collaboratorUserId) {
      const { data } = await supabase
        .from('trip_collaborators')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', collaboratorUserId)
        .maybeSingle()
      existingCollaborator = data
    }

    if (!existingCollaborator && normalizedEmail) {
      const { data } = await supabase
        .from('trip_collaborators')
        .select('id')
        .eq('trip_id', tripId)
        .eq('email', normalizedEmail)
        .maybeSingle()
      existingCollaborator = data
    }

    let collErr = null

    if (existingCollaborator?.id) {
      const { error } = await supabase
        .from('trip_collaborators')
        .update(collaboratorPayload)
        .eq('id', existingCollaborator.id)
      collErr = error
    } else {
      const { error } = await supabase
        .from('trip_collaborators')
        .insert(collaboratorPayload)
      collErr = error
    }

    if (collErr) {
      console.error(`[GLOBEGENIE_LOG] [${requestId}] ❌ Collaborator persistence failed:`, collErr);
      throw collErr;
    }

    console.log(`[GLOBEGENIE_LOG] [${requestId}] 🏁 Invitation process complete.`);
    return new Response(JSON.stringify({
      success: true,
      invite: inviteDetails,
      collaborator: {
        email: normalizedEmail,
        userId: collaboratorUserId,
        accepted: Boolean(collaboratorUserId),
      },
    }), {
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
