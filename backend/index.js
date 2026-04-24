const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const blogsRouter = require('./routes/blogs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/blogs', blogsRouter);

/** Proxy Place Photos so the API key stays on the server (browser loads /api/place-photo, not maps.googleapis.com with key). */
app.get("/api/place-photo", async (req, res) => {
  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  const photoRef = req.query.photoreference || req.query.photo_reference;
  const maxwidth = Math.min(parseInt(String(req.query.maxwidth || "1200"), 10) || 1200, 1600);
  if (!photoRef || !placesKey) {
    return res.status(400).json({ error: "Missing photoreference or GOOGLE_PLACES_API_KEY" });
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${encodeURIComponent(photoRef)}&key=${placesKey}`;
    const r = await fetch(url);
    if (!r.ok) {
      console.error("[GENIE][place-photo] upstream", r.status, await r.text().catch(() => ""));
      return res.status(r.status).end();
    }
    const ct = r.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buf = Buffer.from(await r.arrayBuffer());
    return res.send(buf);
  } catch (e) {
    console.error("[GENIE][place-photo]", e?.message || e);
    return res.status(502).end();
  }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PORT = process.env.PORT || 10000;

// PHASE 1: Create the Trip Shell (Instant)
app.post('/api/trips', async (req, res) => {
  const { destination, startDate, numDays, companions, purpose, pace, budget, experiences, userId } = req.body;

  if (!userId) return res.status(401).json({ error: "Auth required" });

  try {
    const { data: trip, error } = await supabase.from('trips').insert({
      user_id: userId,
      title: `Curated Voyage: ${destination}`,
      countries: Array.isArray(destination) ? destination : [destination],
      start_date: startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      num_days: numDays,
      companion: companions,
      purpose, pace, budget_tier: budget,
      status: 'published'
    }).select().single();

    if (error) throw error;
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PHASE 2: Generate the Itinerary (High-Stability AI window)
app.post('/api/trips/:id/generate', async (req, res) => {
  const tripId = req.params.id;
  console.log(`[GENIE] Starting AI Curation for Trip: ${tripId}`);

  try {
    // 1. Fetch trip context
    const { data: trip, error: fetchErr } = await supabase.from('trips').select('*').eq('id', tripId).single();
    if (fetchErr || !trip) throw new Error("Trip not found");

    // 2. Consultation Phase (Gemini)
    // FIX: "gemini-flash-latest" is not a valid model name and causes a 404 from the Gemini API,
    // which makes the generate endpoint return 500 and the loading screen gets stuck forever.
    // The correct model name is "gemini-1.5-flash-latest".
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `As a luxury travel designer, create a premium day-by-day JSON itinerary for ${trip.countries.join(", ")}.
      Trip context: ${trip.num_days} days, traveling as ${trip.companion}, purpose: ${trip.purpose}, pace: ${trip.pace}, budget: ${trip.budget_tier}.

      Respond ONLY with a valid JSON array. Each element is ONE day and MUST use this exact shape (camelCase keys):
      {
        "dayNumber": 1,
        "city": "Name of the main city for that day (e.g. Mumbai) — required for each day",
        "country": "Country name",
        "activities": [
          {
            "name": "Specific real venue or attraction name",
            "address": "Full street address with city and country",
            "description": "2-3 sentence description",
            "whyVisit": "Why this place is special and worth visiting",
            "timeOfDay": "morning" | "afternoon" | "evening",
            "sortOrder": 1,
            "openTime": "09:00",
            "closeTime": "18:00",
            "duration": "2 hours",
            "ticketPrice": "$20",
            "bestTimeToVisit": "Early morning to avoid crowds",
            "travelTimeFromPrevious": "15 mins taxi" or "First stop",
            "foodSuggestions": ["Try the masala dosa at MTR", "Coffee at Indian Coffee House"],
            "hiddenGems": ["Secret rooftop view on 3rd floor", "Hidden garden behind the main building"]
          }
        ]
      }
      
      IMPORTANT RULES:
      - For first activity of each day: travelTimeFromPrevious = "First stop of the day"
      - For other activities: provide realistic travel time from previous activity (e.g., "10 mins walk", "20 mins taxi")
      - foodSuggestions: 2-3 specific nearby food/drink recommendations with venue names
      - hiddenGems: 2-3 insider tips or secret spots at/near the location
      - address: Must be a complete address including street, city, country
      - bestTimeToVisit: Specific timing advice (e.g., "Early morning", "Sunset", "Weekday afternoons")
      
      dayNumber must be 1..${trip.num_days}. Spread cities across days logically. No markdown, only JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const itinerary = JSON.parse(jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim());

    // 3. Persistence Phase
    const { data: days, error: daysErr } = await supabase.from('itinerary_days').insert(
      itinerary.map((d, i) => ({
        trip_id: trip.id,
        day_number: Number(d.dayNumber) || (i + 1),
        date: new Date(new Date(trip.start_date).getTime() + i * 86400000).toISOString().split('T')[0],
        city: d.city || trip.countries[0],
        country: d.country || "Destination",
        sort_order: i
      }))
    ).select();

    if (daysErr) throw daysErr;

    const actsToInsert = [];
    itinerary.forEach((d, dIdx) => {
      const want = Number(d.dayNumber) || dIdx + 1;
      const dayId = days.find((r) => Number(r.day_number) === want)?.id;
      if (dayId) {
        d.activities?.forEach((act, aIdx) => {
          actsToInsert.push({
            day_id: dayId,
            name: act.name,
            address: act.address || null,
            description: act.description,
            time_of_day: act.timeOfDay || 'morning',
            sort_order: aIdx,
            why_visit: act.whyVisit,
            duration: act.duration,
            ticket_price: act.ticketPrice,
            open_time: act.openTime,
            close_time: act.closeTime,
            best_time_to_visit: act.bestTimeToVisit || null,
            travel_time_from_previous: act.travelTimeFromPrevious || null,
            food_suggestions: act.foodSuggestions || [],
            hidden_gems: act.hiddenGems || []
          });
        });
      }
    });

    if (actsToInsert.length > 0) {
      await supabase.from('activities').insert(actsToInsert);
    }

    // 4. Async Enrichment (Visuals) — do not await; logs to console for debugging
    runBackgroundEnrichment(trip.id, trip.countries?.[0] || "").catch((e) =>
      console.error("[GENIE][Enrichment] Unhandled:", e?.message || e)
    );

    res.status(200).json({ status: "success" });
  } catch (err) {
    console.error(`[FATAL]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

/** Store only the photo reference; client resolves via /api/place-photo (keeps key off the client). */
function placePhotoStorageToken(photoReference) {
  return `placephoto:${photoReference}`;
}

/**
 * Get detailed address from Google Place Details API
 */
async function getPlaceAddress(placesKey, placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_address&key=${placesKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === "OK" && data.result?.formatted_address) {
      return data.result.formatted_address;
    }
    return null;
  } catch (e) {
    console.error(`[GENIE][Address] Failed for place_id ${placeId}:`, e?.message || e);
    return null;
  }
}

/**
 * Find Place + optional Details fallback — Find Place often omits `photos` even when they exist.
 * Now also fetches multiple photos for the gallery.
 */
async function enrichPlaceFromGoogle(placesKey, placeName, queryCity) {
  const input = encodeURIComponent(`${placeName} in ${queryCity}`);
  const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${input}&inputtype=textquery&fields=place_id,rating,photos&key=${placesKey}`;
  const pRes = await fetch(findUrl);
  const pData = await pRes.json();

  if (pData.status !== "OK" && pData.status !== "ZERO_RESULTS") {
    console.error(
      `[GENIE][Places] FindPlace status=${pData.status} error_message=${pData.error_message || "n/a"} query="${placeName}" city="${queryCity}"`
    );
    return null;
  }

  const c = pData.candidates?.[0];
  if (!c) {
    console.warn(`[GENIE][Places] ZERO_RESULTS for "${placeName}" in ${queryCity}`);
    return null;
  }

  let photoRef = c.photos?.[0]?.photo_reference;
  let photoRefs = c.photos?.map(p => p.photo_reference).filter(Boolean) || [];
  
  // If no photos from FindPlace, try Place Details
  if (!photoRef && c.place_id) {
    const dUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(c.place_id)}&fields=photos,rating&key=${placesKey}`;
    const dRes = await fetch(dUrl);
    const dData = await dRes.json();
    if (dData.status !== "OK") {
      console.warn(
        `[GENIE][Places] Details status=${dData.status} ${dData.error_message || ""} place_id=${c.place_id}`
      );
    } else {
      photoRef = dData.result?.photos?.[0]?.photo_reference;
      photoRefs = dData.result?.photos?.map(p => p.photo_reference).filter(Boolean) || [];
      if (photoRef) console.log(`[GENIE][Places] Got ${photoRefs.length} photos via Place Details for "${placeName}"`);
    }
  }

  const out = {
    google_place_id: c.place_id,
    rating: c.rating ?? null,
    photo_url: photoRef ? placePhotoStorageToken(photoRef) : null,
    photos: photoRefs.slice(0, 10).map(ref => placePhotoStorageToken(ref)) // Get up to 10 photos
  };
  
  if (!out.photo_url) {
    console.warn(`[GENIE][Places] No photo for "${placeName}" (${queryCity}) place_id=${c.place_id || "none"}`);
  }
  return out;
}

/** "Mumbai and Bangalore and Kolkata" → "Mumbai" so Places search is not bloated. */
function normalizeCityForPlaces(city, fallback) {
  const s = String(city || fallback || "").trim();
  if (!s) return "";
  const parts = s.split(/\s*,\s*|\s+and\s+/i).map((x) => x.trim()).filter(Boolean);
  if (parts.length > 1) return parts[0];
  return s;
}

async function runBackgroundEnrichment(tripId, fallbackCity) {
  const { data: days, error: daysErr } = await supabase
    .from("itinerary_days")
    .select("id, city")
    .eq("trip_id", tripId);

  if (daysErr) {
    console.error("[GENIE][Enrichment] itinerary_days query failed:", daysErr.message);
    return;
  }
  if (!days?.length) {
    console.warn("[GENIE][Enrichment] No itinerary days for trip", tripId);
    return;
  }

  const dayById = Object.fromEntries(days.map((d) => [d.id, d]));
  const dayIds = days.map((d) => d.id);

  const { data: activities, error: actErr } = await supabase
    .from("activities")
    .select("*")
    .in("day_id", dayIds);

  if (actErr) {
    console.error("[GENIE][Enrichment] activities query failed:", actErr.message);
    return;
  }
  if (!activities?.length) {
    console.warn("[GENIE][Enrichment] No activities to enrich for trip", tripId);
    return;
  }

  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  const youtubeKey = process.env.YOUTUBE_API_KEY;

  if (!placesKey) {
    console.warn("[GENIE][Enrichment] GOOGLE_PLACES_API_KEY is missing — place photos skipped. Set it in backend/.env");
  }
  if (!youtubeKey) {
    console.warn("[GENIE][Enrichment] YOUTUBE_API_KEY is missing — video links skipped.");
  }

  console.log(`[GENIE][Enrichment] trip=${tripId} activities=${activities.length} placesKey=${placesKey ? "yes" : "NO"}`);

  for (const act of activities) {
    const day = dayById[act.day_id];
    const queryCity = normalizeCityForPlaces(day?.city, fallbackCity);
    if (!queryCity) {
      console.warn(`[GENIE][Enrichment] No city for activity "${act.name}" — skipping Places lookup`);
      continue;
    }

    const updates = {};

    if (placesKey) {
      try {
        const place = await enrichPlaceFromGoogle(placesKey, act.name, queryCity);
        if (place) {
          if (place.google_place_id) {
            updates.google_place_id = place.google_place_id;
            // Generate Google Maps URL from place_id
            updates.google_maps_url = `https://www.google.com/maps/place/?q=place_id:${place.google_place_id}`;
          }
          if (place.rating != null) updates.rating = place.rating;
          if (place.photo_url) updates.photo_url = place.photo_url;
          
          // Save photos array for gallery
          if (place.photos && place.photos.length > 0) {
            updates.photos = place.photos;
          }
          
          // Get address if not already set by Gemini
          if (!act.address && place.google_place_id) {
            const address = await getPlaceAddress(placesKey, place.google_place_id);
            if (address) updates.address = address;
          }
        }
      } catch (e) {
        console.error(`[GENIE][Places] Exception for "${act.name}":`, e?.message || e);
      }
    }

    if (youtubeKey) {
      try {
        const yRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=${encodeURIComponent(`${act.name} ${queryCity} guide`)}&type=video&key=${youtubeKey}`
        );
        const yData = await yRes.json();
        if (yData.error) {
          console.error("[GENIE][YouTube]", yData.error.message || yData.error);
        } else {
          updates.youtube_videos =
            yData.items?.map((item) => ({
              title: item.snippet.title,
              videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              thumbnailUrl: item.snippet.thumbnails?.high?.url,
            })) || [];
        }
      } catch (e) {
        console.error(`[GENIE][YouTube] Exception for "${act.name}":`, e?.message || e);
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: upErr } = await supabase.from("activities").update(updates).eq("id", act.id);
      if (upErr) console.error("[GENIE][Enrichment] activity update failed:", upErr.message, act.id);
    }
  }

  await syncTripCoverImage(tripId);
  console.log(`[GENIE][Enrichment] Finished trip=${tripId}`);
}

/** Match trip list / homepage cards to the in-trip banner: first activity with a photo, in day order. */
async function syncTripCoverImage(tripId) {
  const { data: days, error: dErr } = await supabase
    .from("itinerary_days")
    .select("id")
    .eq("trip_id", tripId)
    .order("day_number", { ascending: true });
  if (dErr || !days?.length) return;
  for (const day of days) {
    const { data: acts } = await supabase
      .from("activities")
      .select("photo_url")
      .eq("day_id", day.id)
      .not("photo_url", "is", null)
      .order("sort_order", { ascending: true })
      .limit(1);
    const u = acts?.[0]?.photo_url;
    if (u) {
      const { error: uErr } = await supabase.from("trips").update({ cover_image: u }).eq("id", tripId);
      if (uErr) console.error("[GENIE][Enrichment] cover_image update failed:", uErr.message);
      else console.log(`[GENIE][Enrichment] trips.cover_image set for trip ${tripId}`);
      return;
    }
  }
}

app.listen(PORT, "0.0.0.0", () =>
  console.log(`[RUN] GlobeGenie Master Curation Engine active on http://0.0.0.0:${PORT} (LAN: use this machine's IP)`)
);
