/**
 * Utility to call the Google Gemini API with automatic model fallback.
 * Prioritizes newer, more capable models and falls back to older ones if quota limits or errors occur.
 */

const PREFERRED_MODELS = [
  "gemini-2.0-flash",           // Gemini 2 Flash
  "gemini-1.5-flash",           // Gemini 1.5 Flash (Ultimate fallback)
];

export async function generateWithGeminiFallback(prompt: string, signal: AbortSignal): Promise<string> {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured. Please check your environment variables.");
  }

  let lastError: any = null;

  for (const model of PREFERRED_MODELS) {
    console.log(`[Gemini API] Attempting generation with model: ${model}...`);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            }
          }),
          signal,
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        console.warn(`[Gemini API] Model ${model} failed with status ${response.status}: ${errBody.substring(0, 150)}`);
        
        // Throw an error to trigger the catch block and try the next model
        throw new Error(`Model ${model} failed (${response.status})`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        console.warn(`[Gemini API] Model ${model} returned empty response.`);
        throw new Error(`Model ${model} returned empty content.`);
      }

      console.log(`[Gemini API] Successfully generated itinerary using model: ${model} ✅`);
      return rawText;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Don't fall back if the request was actively aborted (timeout)
        throw err;
      }
      lastError = err;
      // Continue to the next model in the loop
    }
  }

  // If all models in the fallback array failed
  console.error("[Gemini API] All preferred models failed. Last error:", lastError);
  throw new Error("AI trip generation failed due to quota limits or API availability. Please try again later.");
}
