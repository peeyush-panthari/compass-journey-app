import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";

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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AuthLoadingGuard = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        {/* Animated Background Decor */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-ocean-gradient flex items-center justify-center shadow-lg animate-float">
              <span className="text-2xl font-display font-bold text-background">G</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-sea-foam rounded-full animate-ping" />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-display font-bold text-foreground tracking-tight">GlobeGenie</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthLoadingGuard>
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
                <Route path="/chat" element={<Chat />} />
                <Route path="/plan" element={<PlanTrip />} />
                {/* FIX: Changed from /trip to /trip/:id so useParams() can read the trip ID */}
                <Route path="/trip/:id" element={<TripPage />} />
                <Route path="/account" element={<Account />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/hotels" element={<Hotels />} />
                <Route path="/hotels/:id" element={<HotelDetail />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <BottomNav />
            <InstallPrompt />
          </AuthLoadingGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
