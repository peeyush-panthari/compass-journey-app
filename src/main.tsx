import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// FORCE: Unregister all service workers to clear stale PWA redirects
navigator.serviceWorker?.getRegistrations().then((registrations) => {
  registrations.forEach((r) => r.unregister());
});

createRoot(document.getElementById("root")!).render(<App />);
