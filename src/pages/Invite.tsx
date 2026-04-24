import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Invite = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (loading) return;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const tripId = searchParams.get("trip_id");
    const mode = searchParams.get("mode") || "signin";

    if (!tokenHash || !type || !tripId) {
      navigate("/login", { replace: true });
      return;
    }

    const acceptPath = `/invite/accept?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&trip_id=${encodeURIComponent(tripId)}`;

    if (user) {
      navigate(acceptPath, { replace: true });
      return;
    }

    navigate(`${mode === "signup" ? "/signup" : "/login"}?next=${encodeURIComponent(acceptPath)}`, { replace: true });
  }, [loading, navigate, searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Preparing your trip invite...</p>
      </div>
    </div>
  );
};

export default Invite;
