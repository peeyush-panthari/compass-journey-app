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
    <div className="fixed bottom-4 left-3 right-3 z-[60] md:left-auto md:right-4 md:bottom-4 md:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-elevated p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-foreground">Install GlobeGenie</p>
          {isIOS ? (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Tap <Share className="inline w-3 h-3 -mt-0.5 text-primary" /> then <strong>"Add to Home Screen"</strong>
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Add to home screen for quick access.
            </p>
          )}
        </div>
        {!isIOS && (
          <Button
            size="sm"
            onClick={handleInstall}
            className="h-8 text-xs bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-90 rounded-lg shrink-0 px-3"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Install
          </Button>
        )}
        <button onClick={handleDismiss} className="p-1 -mr-1 text-muted-foreground hover:text-foreground compact-touch shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
