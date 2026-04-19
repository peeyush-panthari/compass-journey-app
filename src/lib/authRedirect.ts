/**
 * Google (and other) OAuth flows return the browser to this URL after Supabase
 * exchanges the code. It must match what you add in the Supabase dashboard.
 *
 * Supabase → Authentication → URL Configuration:
 * - Add to **Redirect URLs**: `http://YOUR_LAN_IP:8080/auth/callback` (same IP:port you open on the phone).
 * - Wildcards: `http://192.168.1.*:8080/**` may work depending on project settings; otherwise add the exact URL.
 *
 * Optional: set `VITE_OAUTH_REDIRECT_ORIGIN` in `.env.local` to the exact origin (no trailing slash),
 * e.g. `http://192.168.1.23:8080` if `window.location.origin` is wrong in an embedded browser.
 */
export function getOAuthRedirectTo(): string {
  const envOrigin = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN?.trim().replace(/\/$/, "");
  if (envOrigin) return `${envOrigin}/auth/callback`;

  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}
