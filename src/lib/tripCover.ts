import { resolveActivityPhotoUrl } from "@/lib/activityPhoto";

/** When `trips.cover_image` is empty — rotate stock art so cards aren’t identical. */
const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=380&fit=crop",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=380&fit=crop",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=380&fit=crop",
  "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=380&fit=crop",
  "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=380&fit=crop",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=380&fit=crop",
];

/**
 * Cover for trip list cards — uses `trips.cover_image` (same source as trip banner: first activity photo),
 * resolved through the Places proxy when needed; otherwise a rotating placeholder.
 */
export function tripCardCoverUrl(coverImage: string | null | undefined, index: number): string {
  const t = coverImage?.trim();
  if (t) return resolveActivityPhotoUrl(t);
  return FALLBACK_COVERS[Math.abs(index) % FALLBACK_COVERS.length];
}
