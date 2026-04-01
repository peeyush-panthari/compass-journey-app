import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// YouTube Search Service (Official v3 Integration)
async function fetchYouTubeVideos(query: string, limit: number = 3) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[YouTubeService] YOUTUBE_API_KEY missing. Falling back to high-quality links.");
    return [
       { title: `${query} | Travel Guide`, videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " guide")}` },
       { title: `${query} | Hidden Gems`, videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " hidden gems")}` }
    ];
  }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${limit}&q=${encodeURIComponent(query + " travel guide shorts vlogs")}&type=video&key=${apiKey}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.items && Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        title: item.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url
      }));
    }
    return [];
  } catch (err) {
    console.error("[YouTubeService] Official API Fetch failed:", err);
    return [];
  }
}

app.post('/generate-itinerary', async (req: Request, res: Response) => {
  try {
    const { 
      destination, dates, companion, purpose, experiences, pace, budget, userId, startDate: rawStartDate 
    } = req.body;

    console.log(`[Backend] Request received for: ${destination}`);

    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"; 
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Generate a detailed travel itinerary for a trip to ${destination}.
      Trip Details:
      - Duration: ${dates}
      - Start Date: ${rawStartDate}
      - Traveling with: ${companion}
      - Purpose: ${purpose}
      - Pace: ${pace}
      - Budget: ${budget}
      - Preferences: ${experiences ? (Array.isArray(experiences) ? experiences.join(', ') : experiences) : 'None'}

      For every place in the itinerary MUST include:
      - name: String (Specific name of the place)
      - description: Short description
      - whyVisit: Why it is worth visiting
      - openTime: Specific opening time (e.g. "09:00"), strictly output "Not Available" if unknown.
      - closeTime: Specific closing time (e.g. "18:00"), strictly output "Not Available" if unknown.
      - duration: Estimated time needed (e.g. "2 hours")
      - ticketPrice: Price if any (e.g. "$15" or "Free")
      - bestTimeToVisit: Specific time (e.g. "Early morning" or "Sunset")
      - travelTimeFromPrevious: Estimated travel time from previous location (e.g. "15 mins walk" or "10 mins taxi")
      - foodSuggestions: Array of top 3 restaurants or local food to try nearby
      - hiddenGems: Array of hidden gems or local experiences nearby
      - photoSpots: Array of the best photo spots at or near this location
      - restStops: Array of cafes or rest stops nearby
      - timeOfDay: Strictly one of: 'morning', 'afternoon', 'evening'
      - sortOrder: Chronological order of activity in the day
      - google_maps_url: Google Maps link if known (else null)

      Constraint 1 (CRITICAL): Ensure the itinerary is GEOGRAPHICALLY OPTIMIZED so that places visited within the same day are close to each other to minimize travel time.
      Constraint 2 (CRITICAL): A single day MUST cover activities from a SINGLE CITY ONLY. Do not mix cities on the same day.
      Constraint 3 (CRITICAL): DO NOT club or group 2 distinct places or activities together in a single entry. Each generated activity must be one single physical place.

      Please respond with a valid JSON array where each object represents a day.
      Each day object should have:
      - dayNumber: number
      - city: string (The primary city for this day's activities)
      - country: string (The country of the city)
      - activities: array of objects as defined above

      Respond ONLY with the JSON. Do not wrap the JSON in markdown code blocks.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    let days = JSON.parse(jsonStr.replace(/```json|```/g, "").trim());

    // Normalize to an object for internal consistency if needed, 
    // but the AI is now returning an array directly as per your snippet.
    const itineraryData: any = { days: Array.isArray(days) ? days : [] };

    const baseDate = rawStartDate ? new Date(rawStartDate) : new Date();

    if (userId) {
      console.log("[Backend] Saving trip record for user:", userId);
      const { data: trip, error: tripError } = await supabase.from('trips').insert({
        user_id: userId,
        title: `Trip to ${destination}`,
        countries: Array.isArray(destination) ? destination : [destination],
        start_date: baseDate.toISOString().split('T')[0],
        num_days: itineraryData.days.length,
        companion,
        purpose,
        experiences: Array.isArray(experiences) ? experiences : [experiences],
        pace,
        budget_tier: budget,
        status: 'published'
      }).select().single();

      if (tripError) {
        console.error("[Backend] Error saving trip:", tripError.message);
        throw tripError;
      }

      console.log("[Backend] Trip record created with ID:", trip.id);
      itineraryData.tripId = trip.id;

      const daysToInsert = itineraryData.days.map((day: any, idx: number) => {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + idx);
        return {
          trip_id: trip.id,
          day_number: day.dayNumber || (idx + 1),
          date: d.toISOString().split('T')[0],
          city: day.city,
          country: day.country,
          sort_order: idx
        };
      });

      console.log(`[Backend] Inserting ${daysToInsert.length} itinerary days...`);
      const { data: dayRecords, error: daysError } = await supabase
        .from('itinerary_days')
        .insert(daysToInsert)
        .select();

      if (daysError) {
        console.error("[Backend] Error saving days:", daysError.message);
        throw daysError;
      }

      console.log("[Backend] Itinerary days saved successfully.");

      if (dayRecords) {
        const activities: any[] = [];
        itineraryData.days.forEach((day: any, dIdx: number) => {
          const dayRec = dayRecords.find((r: any) => r.day_number === (day.dayNumber || (dIdx + 1)));
          if (dayRec && day.activities) {
            day.activities.forEach((act: any, aIdx: number) => {
              activities.push({
                day_id: dayRec.id,
                name: act.name,
                description: act.description,
                why_visit: act.whyVisit,
                duration: act.duration,
                time_of_day: act.timeOfDay,
                best_time_to_visit: act.bestTimeToVisit,
                open_time: act.openTime,
                close_time: act.closeTime,
                ticket_price: act.ticketPrice,
                travel_time_from_previous: act.travelTimeFromPrevious,
                food_suggestions: act.foodSuggestions,
                hidden_gems: act.hiddenGems,
                photo_spots: act.photoSpots,
                rest_stops: act.restStops,
                google_maps_url: act.google_maps_url,
                sort_order: aIdx
              });
            });
          }
        });

        if (activities.length > 0) {
          console.log(`[Backend] Inserting ${activities.length} enriched activities...`);
          
          // Map activities and add photo_url base on place name
          const activitiesWithPhotos = activities.map(a => ({
            ...a,
            photo_url: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&keyword=${encodeURIComponent(a.name)}`
          }));

          const { error: actsErr } = await supabase.from('activities').insert(activitiesWithPhotos);
          if (actsErr) {
            console.warn("[Backend] Warning: Enriched insertion failed, trying minimal fallback:", actsErr.message);
            // Fallback to core columns if enrichment fails
            const minActs = activities.map(a => ({
               day_id: a.day_id,
               name: a.name,
               description: a.description,
               duration: a.duration,
               time_of_day: a.time_of_day,
               sort_order: a.sort_order
            }));
            const { error: minErr } = await supabase.from('activities').insert(minActs);
            if (minErr) console.error("[Backend] Critical: Minimal insertion failed too.", minErr.message);
          } else {
            console.log("[Backend] Activities saved successfully with images.");
          }
        }
      }
    }

    console.log(`[Backend] Process complete for user ${userId}. Sending ${itineraryData.days.length} days to frontend.`);
    res.json(itineraryData);
    console.log("[Backend] Response sent.");

  } catch (error: any) {
    console.error('[Backend] Error generating itinerary:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
