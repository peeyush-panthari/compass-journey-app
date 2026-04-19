import { getBackendUrl } from "@/lib/backendUrl";

const FALLBACK =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1070&auto=format&fit=crop";

/**
 * Resolve activity photo for display. Google Place Photo URLs embed the API key; browsers often
 * fail to load them when the key is server-restricted. We proxy via the backend instead.
 */
export function resolveActivityPhotoUrl(photoUrl: string | null | undefined): string {
  if (!photoUrl || !String(photoUrl).trim()) return FALLBACK;

  const raw = String(photoUrl).trim();

  if (raw.startsWith("placephoto:")) {
    const ref = raw.slice("placephoto:".length);
    return `${getBackendUrl()}/api/place-photo?photoreference=${encodeURIComponent(ref)}&maxwidth=1200`;
  }

  if (raw.includes("maps.googleapis.com/maps/api/place/photo")) {
    try {
      const u = new URL(raw, "http://localhost");
      const ref = u.searchParams.get("photoreference") || u.searchParams.get("photo_reference");
      if (ref) {
        return `${getBackendUrl()}/api/place-photo?photoreference=${encodeURIComponent(ref)}&maxwidth=1200`;
      }
    } catch {
      /* ignore */
    }
  }

  return raw;
}

export { FALLBACK as ACTIVITY_PHOTO_FALLBACK };
