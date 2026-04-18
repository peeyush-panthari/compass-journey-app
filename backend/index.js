const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

    const prompt = `As a luxury travel designer, create a premium day-by-day JSON itinerary for ${trip.countries.join(', ')}.
      Trip context: ${trip.num_days} days, traveling as ${trip.companion}, purpose: ${trip.purpose}, pace: ${trip.pace}, budget: ${trip.budget_tier}.
      
      For every place in the itinerary MUST include:
      - name: String (Specific name)
      - description: Short description
      - whyVisit: Narrative detail
      - timeOfDay: 'morning', 'afternoon' or 'evening'
      - sortOrder: Chronological order
      - openTime: "09:00"
      - closeTime: "18:00"
      - duration: "2 hours"
      - ticketPrice: "$20" or "Free"

      Respond ONLY with a valid JSON array of days containing activities.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const itinerary = JSON.parse(jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim());

    // 3. Persistence Phase
    const { data: days, error: daysErr } = await supabase.from('itinerary_days').insert(
      itinerary.map((d, i) => ({
        trip_id: trip.id,
        day_number: d.dayNumber || (i + 1),
        date: new Date(new Date(trip.start_date).getTime() + i * 86400000).toISOString().split('T')[0],
        city: d.city || trip.countries[0],
        country: d.country || "Destination",
        sort_order: i
      }))
    ).select();

    if (daysErr) throw daysErr;

    const actsToInsert = [];
    itinerary.forEach((d, dIdx) => {
      const dayId = days.find(r => r.day_number === (d.dayNumber || dIdx + 1))?.id;
      if (dayId) {
        d.activities?.forEach((act, aIdx) => {
          actsToInsert.push({
            day_id: dayId, name: act.name, description: act.description,
            time_of_day: act.timeOfDay || 'morning', sort_order: aIdx,
            why_visit: act.whyVisit, duration: act.duration, ticket_price: act.ticketPrice,
            open_time: act.openTime, close_time: act.closeTime
          });
        });
      }
    });

    if (actsToInsert.length > 0) {
      await supabase.from('activities').insert(actsToInsert);
    }

    // 4. Async Enrichment (Visuals)
    runBackgroundEnrichment(trip.id, trip.countries[0]);

    res.status(200).json({ status: "success" });
  } catch (err) {
    console.error(`[FATAL]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

async function runBackgroundEnrichment(tripId, city) {
  const { data: activities } = await supabase.from('activities')
    .select('*, itinerary_days!inner(city)')
    .eq('itinerary_days.trip_id', tripId);

  if (!activities) return;
  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  const youtubeKey = process.env.YOUTUBE_API_KEY;

  for (const act of activities) {
    const updates = {};
    const queryCity = act.itinerary_days.city || city;

    if (placesKey) {
      try {
        const pRes = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(`${act.name} in ${queryCity}`)}&inputtype=textquery&fields=place_id,rating,photos&key=${placesKey}`);
        const pData = await pRes.json();
        if (pData.candidates?.[0]) {
          const c = pData.candidates[0];
          updates.google_place_id = c.place_id;
          updates.rating = c.rating || 4.8;
          if (c.photos?.[0]) {
            updates.photo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${c.photos[0].photo_reference}&key=${placesKey}`;
          }
        }
      } catch (e) { }
    }

    if (youtubeKey) {
      try {
        const yRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=${encodeURIComponent(`${act.name} ${queryCity} guide`)}&type=video&key=${youtubeKey}`);
        const yData = await yRes.json();
        updates.youtube_videos = yData.items?.map(item => ({
          title: item.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnailUrl: item.snippet.thumbnails?.high?.url
        })) || [];
      } catch (e) { }
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('activities').update(updates).eq('id', act.id);
    }
  }
}

app.listen(PORT, () => console.log(`[RUN] GlobeGenie Master Curation Engine active on ${PORT}`));
