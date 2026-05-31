import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Mail, Lock, Phone, User, ShieldCheck, Loader2 } from "lucide-react";
import { BrandWordmark } from "@/components/brand-logo";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { request } from "@/lib/api-client";

export const Route = createFileRoute("/auth")({ component: Auth });

const COUNTRIES = [
  { code: "+91", name: "India" }, { code: "+1", name: "USA" }, { code: "+44", name: "UK" },
  { code: "+971", name: "UAE" }, { code: "+61", name: "Australia" }, { code: "+65", name: "Singapore" },
];

function Auth() {
  const { theme, toggle } = useTheme();
  const [stage, setStage] = useState<"form" | "otp" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [loginCaptcha, setLoginCaptcha] = useState(false);
  const [signupCaptcha, setSignupCaptcha] = useState(false);

  // Real auth state and methods
  const { login, register: apiRegister, verifyOtp: apiVerifyOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const isLogin = form.dataset.tab === "login";
    const captchaOk = isLogin ? loginCaptcha : signupCaptcha;
    if (!captchaOk) { toast.error("Please complete the CAPTCHA"); return; }
    
    setLoading(true);
    try {
      if (isLogin) {
        if (loginMethod === "email") {
          await login(email, password);
          setStage("success");
          toast.success("Successfully logged in!");
        } else {
          // Mobile OTP login: Request Twilio OTP to be sent
          await request("/auth/otp/resend", {
            method: "POST",
            body: { mobileNumber, countryCode },
          });
          toast.success("OTP sent successfully!");
          setStage("otp");
        }
      } else {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        // Registering
        await apiRegister({
          fullName,
          email,
          password,
          mobileNumber,
          countryCode,
          role: "family_member"
        });
        toast.success("Account created! Verification OTP sent.");
        setStage("otp");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }
    setLoading(true);
    try {
      await apiVerifyOtp(mobileNumber, countryCode, otp);
      setStage("success");
      toast.success("Phone verified successfully!");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col p-12 text-white overflow-hidden">
        <div className="absolute inset-0 gradient-brand" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative">
          <Link to="/" className="inline-flex"><BrandWordmark className="text-white" /></Link>
        </div>
        <div className="relative mt-auto space-y-6">
          <h2 className="text-4xl font-display font-bold leading-tight">Join a movement that brings families back together.</h2>
          <p className="text-white/85 max-w-md">Sign in to report cases, receive AI match alerts, and volunteer in your city. Your account keeps every action secure and verified.</p>
          <ul className="space-y-2 text-sm">
            {["Encrypted, privacy-first identity", "Verified by FIR and document upload", "Get nearby case alerts within minutes"].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Link to="/"><BrandWordmark /></Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        </div>
        <div className="flex-1 grid place-items-center p-6">
          <Card className="glass w-full max-w-md p-6 sm:p-8">
            {stage === "success" ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                  className="mx-auto grid place-items-center h-16 w-16 rounded-full bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]">
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
                <h3 className="mt-4 text-2xl font-display font-bold">Verified!</h3>
                <p className="mt-2 text-sm text-muted-foreground">Your account is ready. Welcome to FindThem.</p>
                <Button asChild className="mt-6 gradient-brand text-white"><Link to="/dashboard">Go to dashboard</Link></Button>
              </motion.div>
            ) : stage === "otp" ? (
              <div className="text-center">
                <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div>
                <h3 className="mt-4 text-xl font-display font-semibold">Verify your phone</h3>
                <p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code via SMS</p>
                <div className="mt-6 flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} className="h-12 w-12" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={verifyOtp} disabled={loading} className="mt-6 w-full gradient-brand text-white">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify code
                </Button>
                <button onClick={() => setStage("form")} className="mt-3 text-xs text-muted-foreground hover:text-foreground">← Back</button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-display font-bold">Welcome back</h3>
                  <p className="text-sm text-muted-foreground mt-1">Sign in or create your account</p>
                </div>

                <Tabs defaultValue="signup">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-3 mt-5">
                    <form onSubmit={submit} data-tab="login" className="space-y-3">
                      <Tabs value={loginMethod} onValueChange={(val) => setLoginMethod(val as "email" | "phone")}>
                        <TabsList className="grid grid-cols-2 w-full bg-muted/60">
                          <TabsTrigger value="email">Email</TabsTrigger>
                          <TabsTrigger value="phone">Mobile OTP</TabsTrigger>
                        </TabsList>
                        <TabsContent value="email" className="space-y-3 mt-4">
                          <Field icon={<Mail className="h-4 w-4" />} label="Email">
                            <Input type="email" placeholder="you@example.com" required={loginMethod === "email"} value={email} onChange={(e) => setEmail(e.target.value)} />
                          </Field>
                          <Field icon={<Lock className="h-4 w-4" />} label="Password">
                            <Input type="password" placeholder="••••••••" required={loginMethod === "email"} value={password} onChange={(e) => setPassword(e.target.value)} />
                          </Field>
                        </TabsContent>
                        <TabsContent value="phone" className="space-y-3 mt-4">
                          <div className="flex gap-2">
                            <Select value={countryCode} onValueChange={setCountryCode}>
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} {c.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input type="tel" placeholder="98765 43210" className="flex-1" required={loginMethod === "phone"} value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                          </div>
                        </TabsContent>
                      </Tabs>
                      <Captcha checked={loginCaptcha} onCheck={setLoginCaptcha} />
                      <Button type="submit" disabled={loading} className="w-full gradient-brand text-white">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={submit} data-tab="signup" className="space-y-3 mt-5">
                      <Field icon={<User className="h-4 w-4" />} label="Full name">
                        <Input placeholder="Priya Sharma" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </Field>
                      <Field icon={<Mail className="h-4 w-4" />} label="Email">
                        <Input type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field icon={<Lock className="h-4 w-4" />} label="Password">
                          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </Field>
                        <Field icon={<Lock className="h-4 w-4" />} label="Confirm">
                          <Input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </Field>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mobile number</Label>
                        <div className="flex gap-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} {c.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="tel" placeholder="98765 43210" className="flex-1" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                        </div>
                      </div>
                      <Captcha checked={signupCaptcha} onCheck={setSignupCaptcha} />
                      <Button type="submit" disabled={loading} className="w-full gradient-brand text-white">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div></div>
                <Button variant="outline" className="w-full">
                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                  Continue with Google
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1.5">{icon}{label}</Label>
      {children}
    </div>
  );
}

function Captcha({ checked, onCheck }: { checked: boolean; onCheck: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-md border bg-muted/40 p-3 cursor-pointer text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheck(!!v)} />
      <span>I'm not a robot</span>
      <span className="ml-auto text-[10px] text-muted-foreground font-mono">reCAPTCHA</span>
    </label>
  );
}
