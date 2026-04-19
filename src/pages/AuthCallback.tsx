import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

/**
 * AuthCallback Page
 * Used as a dedicated route for OAuth/OTP redirects.
 * Its job is to ensure the session is exchanged and the URL is cleaned
 * before the user lands on a protected page.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[AuthCallback] Handling session hydration...");
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) {
            console.error("[AuthCallback] PKCE exchange failed:", exchangeError.message);
            navigate("/login?error=oauth_exchange_failed");
            return;
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[AuthCallback] Session hydration error:", error.message);
          navigate("/login?error=session_failed");
          return;
        }

        if (session) {
          console.log("[AuthCallback] Session successfully recovered. Cleaning URL...");
          // We don't need replaceState here if we're moving targets, but it's good practice
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/my-trips", { replace: true });
        } else {
          console.warn("[AuthCallback] No session found after redirect.");
          navigate("/login");
        }
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-medium tracking-tight">Completing your login</h2>
          <p className="text-sm text-muted-foreground">Synchronizing your journal...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
