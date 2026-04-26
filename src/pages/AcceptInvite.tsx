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

      if (!tripId) {
        navigate("/my-trips", { replace: true });
        return;
      }

      let userId: string | null = null;
      let userEmail: string | null = null;

      if (tokenHash && type) {
        // New user flow: verify the OTP/invite token to complete sign-in
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "magiclink" | "invite",
        });

        if (error || !data.user) {
          console.error("[AcceptInvite] verifyOtp failed:", error?.message);
          navigate(`/login?next=${encodeURIComponent(`/trip/${tripId}`)}`, { replace: true });
          return;
        }
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      } else {
        // Existing user magic link flow: Supabase already authenticated via hash fragment
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("[AcceptInvite] No authenticated user found.");
          navigate(`/login?next=${encodeURIComponent(`/trip/${tripId}`)}`, { replace: true });
          return;
        }
        userId = user.id;
        userEmail = user.email ?? null;
      }

      // Link the invitation to this user and mark it as accepted
      if (userId && userEmail) {
        console.log("[AcceptInvite] Linking invitation for user:", userId);
        const { error: updateError } = await supabase
          .from("trip_collaborators")
          .update({ user_id: userId, accepted: true })
          .match({ trip_id: tripId, email: userEmail });

        if (updateError) {
          console.error("[AcceptInvite] Failed to link invitation:", updateError.message);
        }
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
