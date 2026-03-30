import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignup = () => { toast({ title: "Google Sign-Up", description: "Google SSO coming soon." }); };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) { toast({ title: "Invalid number", variant: "destructive" }); return; }
    setOtpSent(true);
    toast({ title: "OTP Sent", description: `Code sent to ${phone}` });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) { toast({ title: "Invalid OTP", variant: "destructive" }); return; }
    toast({ title: "Account Created!", description: "Welcome to GlobeGenie!" });
  };

  return (
    <div className="min-h-[100svh] bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden safe-top safe-bottom">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="bg-card rounded-2xl shadow-elevated p-6 sm:p-8 border border-border/60">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-ocean-gradient flex items-center justify-center shadow-sm"><Globe className="w-5 h-5 text-primary-foreground" /></div>
              <span className="text-2xl font-display font-bold text-foreground">GlobeGenie</span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Start planning your dream trips for free</p>
          </div>

          <Button variant="outline" className="w-full h-12 mb-6 font-medium rounded-xl" onClick={handleGoogleSignup}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>

          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or sign up with mobile</span></div></div>

          {!otpSent ? (
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="tel" placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-12 rounded-xl text-base" /></div>
              <Button type="submit" className="w-full h-12 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-90 rounded-xl text-base">Send OTP <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <p className="text-sm text-muted-foreground text-center">Enter code sent to <span className="font-medium text-foreground">{phone}</span></p>
              <Input type="text" inputMode="numeric" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 rounded-xl text-center text-lg tracking-[0.5em] font-mono" maxLength={6} />
              <Button type="submit" className="w-full h-12 bg-gold-gradient text-primary-foreground font-semibold shadow-gold hover:opacity-90 rounded-xl text-base">Verify & Create Account</Button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">Change number</button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link></p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
