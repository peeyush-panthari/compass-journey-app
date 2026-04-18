import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
