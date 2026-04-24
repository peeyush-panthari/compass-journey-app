import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const acceptInvite = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const tripId = searchParams.get("trip_id");

      if (!tokenHash || !type || !tripId) {
        navigate("/my-trips", { replace: true });
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "magiclink" | "invite",
      });

      if (error) {
        console.error("[AcceptInvite] verifyOtp failed:", error.message);
        navigate(`/login?next=${encodeURIComponent(`/trip/${tripId}`)}`, { replace: true });
        return;
      }

      navigate(`/trip/${tripId}`, { replace: true });
    };

    acceptInvite();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Opening your shared trip...</p>
      </div>
    </div>
  );
};

export default AcceptInvite;
