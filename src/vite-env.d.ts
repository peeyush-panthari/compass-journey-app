/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional: e.g. `http://192.168.1.23:8080` when testing Google SSO on a phone over Wi‑Fi */
  readonly VITE_OAUTH_REDIRECT_ORIGIN?: string;
}
