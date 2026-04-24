import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import ProtectedRoute from "@/components/ProtectedRoute";

// Keep Index as eager import (first page seen by user)
import Index from "./pages/Index";

// Lazy load all other pages — only downloaded when the user navigates there
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Chat = lazy(() => import("./pages/Chat"));
const PlanTrip = lazy(() => import("./pages/PlanTrip"));
const TripPage = lazy(() => import("./pages/TripPage"));
const Account = lazy(() => import("./pages/Account"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Hotels = lazy(() => import("./pages/Hotels"));
const HotelDetail = lazy(() => import("./pages/HotelDetail"));
const Explore = lazy(() => import("./pages/Explore"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Invite = lazy(() => import("./pages/Invite"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));

const queryClient = new QueryClient();

import { useAuth } from "@/contexts/AuthContext";

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-medium tracking-tight">Opening your travel journal</h2>
            <p className="text-sm text-muted-foreground">Checking your credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/plan" element={<ProtectedRoute><PlanTrip /></ProtectedRoute>} />
        {/* FIX: Changed from /trip to /trip/:id so useParams() can read the trip ID */}
        <Route path="/trip/:id" element={<ProtectedRoute><TripPage /></ProtectedRoute>} />
        <Route path="/my-trips" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/invite/accept" element={<AcceptInvite />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
