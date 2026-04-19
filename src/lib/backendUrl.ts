const DEFAULT_BACKEND_PORT = 10000;

/**
 * Base URL for the Express API (`backend/`).
 * When testing the PWA on a phone via Wi‑Fi (e.g. http://192.168.1.10:8080), `localhost`
 * would refer to the phone, not your dev machine — so we derive the host from the page.
 * Override with `VITE_BACKEND_URL` for production or custom setups.
 */
export function getBackendUrl(): string {
  const fromEnv = import.meta.env.VITE_BACKEND_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
    }
  }

  return `http://localhost:${DEFAULT_BACKEND_PORT}`;
}
