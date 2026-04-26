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

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "magiclink" | "invite",
      });

      if (error || !data.user) {
        console.error("[AcceptInvite] verifyOtp failed:", error?.message);
        navigate(`/login?next=${encodeURIComponent(`/trip/${tripId}`)}`, { replace: true });
        return;
      }

      // Explicitly link the invitation to the user's ID and mark it as accepted
      // This handles cases where the user was invited by email before they had an account.
      console.log("[AcceptInvite] Linking invitation for user:", data.user.id);
      await supabase
        .from("trip_collaborators")
        .update({
          user_id: data.user.id,
          accepted: true
        })
        .match({ trip_id: tripId, email: data.user.email });

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
