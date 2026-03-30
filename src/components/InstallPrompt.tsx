import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) return;

    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    if (isIOS) {
      const timer = setTimeout(() => setShowIOSPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone, isIOS]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSPrompt(false);
    setDeferredPrompt(null);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !showIOSPrompt) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] md:left-auto md:right-4 md:bottom-4 md:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-elevated p-4 flex items-start gap-3">
        <img src="/assets/logo.png" alt="GlobeGenie" className="h-10 sm:h-12 w-auto rounded-xl shadow-sm flex-shrink-0 object-contain" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground">Install GlobeGenie</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Tap <Share className="inline w-3.5 h-3.5 -mt-0.5 text-primary" /> then <strong>"Add to Home Screen"</strong> for the best experience.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for quick access & offline use.
            </p>
          )}
          {!isIOS && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="mt-2 h-8 text-xs bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-90 rounded-lg"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Install App
            </Button>
          )}
        </div>
        <button onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground compact-touch">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
