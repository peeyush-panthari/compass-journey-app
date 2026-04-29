const DEFAULT_BACKEND_PORT = 10000;

/**
 * Base URL for the Express API (`backend/`).
 * When testing the PWA on a phone via Wi‑Fi (e.g. http://192.168.1.10:8080), `localhost`
 * would refer to the phone, not your dev machine — so we derive the host from the page.
 * Override with `VITE_BACKEND_URL` for production or custom setups.
 */
export function getBackendUrl(): string {
  return getBackendUrlCandidates()[0];
}

export function getBackendUrlCandidates(): string[] {
  const candidates = new Set<string>();
  const fromEnv = import.meta.env.VITE_BACKEND_URL?.trim();
  if (fromEnv) candidates.add(fromEnv.replace(/\/$/, ""));

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      candidates.add(`${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`);
    }
  }

  candidates.add(`http://localhost:${DEFAULT_BACKEND_PORT}`);
  candidates.add(`http://127.0.0.1:${DEFAULT_BACKEND_PORT}`);

  return [...candidates];
}
