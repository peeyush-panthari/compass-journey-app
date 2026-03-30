import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, User, Calendar, Lock, Eye, EyeOff, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const EditProfile = () => {
  const { user, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("male");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { 
    if (!loading && !user) navigate("/login"); 
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const result = await updateProfile({
      fullName,
      phone,
      age: age ? parseInt(age) : undefined,
      gender
    });
    setIsSaving(false);
    
    if (result.success) {
      toast({ title: "Profile updated" });
    } else {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) { toast({ title: "Missing fields", variant: "destructive" }); return; }
    if (newPassword.length < 8) { toast({ title: "Password too short", variant: "destructive" }); return; }
    if (newPassword !== confirmNewPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setResetSuccess(true);
    setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    toast({ title: "Password updated" });
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-18 sm:pt-24 pb-24 md:pb-16 max-w-2xl safe-top safe-bottom">
        <button onClick={() => navigate("/account")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Account
        </button>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">Edit Profile</h1>

          <div className="bg-card rounded-2xl border border-border shadow-card p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-ocean-gradient flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shadow-md">{fullName.charAt(0).toUpperCase()}</div>
              <div><h2 className="font-display font-bold text-foreground">{fullName}</h2><p className="text-sm text-muted-foreground">{email}</p></div>
            </div>

            <div className="space-y-4">
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10 h-11 rounded-xl" /></div></div>
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={email} readOnly className="pl-10 h-11 rounded-xl bg-muted/50 cursor-not-allowed" /></div></div>
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={phone} onChange={e => setPhone(e.target.value)} className="pl-10 h-11 rounded-xl" /></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Age</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="number" value={age} onChange={e => setAge(e.target.value)} className="pl-10 h-11 rounded-xl" /></div></div>
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Gender</label><Select value={gender} onValueChange={setGender}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="non-binary">Non-binary</SelectItem><SelectItem value="prefer-not">Prefer not to say</SelectItem></SelectContent></Select></div>
              </div>
              <Button onClick={handleSaveProfile} className="bg-ocean-gradient text-primary-foreground font-semibold rounded-xl shadow-sm mt-2"><Save className="w-4 h-4 mr-1" /> Save Changes</Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-foreground flex items-center gap-2"><Lock className="w-5 h-5" /> Reset Password</h2>
              {!showResetPassword && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowResetPassword(true)}>Change Password</Button>}
            </div>
            {showResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Current Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="pl-10 pr-10 h-11 rounded-xl" /><button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground compact-touch">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-10 pr-10 h-11 rounded-xl" /><button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground compact-touch">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Confirm</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={showNew ? "text" : "password"} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="pl-10 h-11 rounded-xl" /></div></div>
                {resetSuccess && <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg p-3 compact-touch"><CheckCircle className="w-4 h-4" /> Password updated!</div>}
                <div className="flex gap-2">
                  <Button type="submit" className="bg-ocean-gradient text-primary-foreground font-semibold rounded-xl">Update Password</Button>
                  <Button type="button" variant="ghost" className="rounded-xl" onClick={() => { setShowResetPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword(""); }}>Cancel</Button>
                </div>
              </form>
            ) : <p className="text-sm text-muted-foreground">Click "Change Password" to update.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;
