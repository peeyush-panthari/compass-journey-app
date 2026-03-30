import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const DEMO_PHONE = "123456789";
  const DEMO_OTP = "0987";

  const handleGoogleSignup = () => {
    toast({ title: "Google Sign-In", description: "Google SSO will be available once the backend is connected." });
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 6) {
      toast({ title: "Invalid number", description: "Please enter a valid mobile number.", variant: "destructive" });
      return;
    }
    setOtpSent(true);
    toast({ title: "OTP Sent", description: `A verification code has been sent to ${phone}` });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast({ title: "Invalid OTP", description: "Please enter the verification code.", variant: "destructive" });
      return;
    }
    if (phone.replace(/\D/g, "") !== DEMO_PHONE || otp !== DEMO_OTP) {
      toast({ title: "Invalid OTP", description: "The verification code is incorrect.", variant: "destructive" });
      return;
    }
    signup(phone + "@phone.user", "Demo User", "otp-verified");
    toast({ title: "Welcome!", description: "Let's plan your trip!" });
    onOpenChange(false);
    resetState();
    navigate("/plan");
  };

  const resetState = () => { setPhone(""); setOtp(""); setOtpSent(false); };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/60">
        <DialogHeader className="flex flex-col items-center">
          <div className="mb-4">
            <img src="/assets/logo.png" alt="GlobeGenie" className="h-12 w-auto object-contain" />
          </div>
          <DialogTitle className="text-xl font-display font-bold text-center">Sign in to start planning</DialogTitle>
          <p className="text-sm text-muted-foreground text-center">Create an account or sign in to build your AI-powered itinerary</p>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Button variant="outline" className="w-full h-12 font-medium rounded-xl border-border/60 hover:bg-muted/50 text-base" onClick={handleGoogleSignup}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or use mobile number</span></div>
          </div>

          {!otpSent ? (
            <form className="space-y-3" onSubmit={handleSendOtp}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12 rounded-xl text-base" />
              </div>
              <Button type="submit" className="w-full h-12 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-90 rounded-xl text-base">
                Send OTP <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={handleVerifyOtp}>
              <p className="text-sm text-muted-foreground text-center">Enter the code sent to <span className="font-medium text-foreground">{phone}</span></p>
              <Input type="text" inputMode="numeric" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 rounded-xl text-center text-lg tracking-[0.5em] font-mono" maxLength={6} />
              <Button type="submit" className="w-full h-12 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-90 rounded-xl text-base">Verify & Start Planning</Button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">Change number</button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
