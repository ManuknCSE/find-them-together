import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import React from "react";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Upload, MapPin, Check, FileText, User, Fingerprint, CalendarDays, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";

export const Route = createFileRoute("/report")({ component: Report });

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Identification", icon: Fingerprint },
  { id: 3, label: "Missing details", icon: CalendarDays },
  { id: 4, label: "Uploads", icon: Upload },
  { id: 5, label: "Contact & reward", icon: Phone },
  { id: 6, label: "Preview", icon: FileText },
];

function Report() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const progress = (step / STEPS.length) * 100;

  // Step 1: Personal
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyShape, setBodyShape] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [hairStyle, setHairStyle] = useState("");
  const [eyeColor, setEyeColor] = useState("");

  // Step 2: Identification
  const [tattoos, setTattoos] = useState("");
  const [birthmarks, setBirthmarks] = useState("");
  const [scars, setScars] = useState("");
  const [disabilityInfo, setDisabilityInfo] = useState("");
  const [clothesLastWorn, setClothesLastWorn] = useState("");
  const [otherBodyMarks, setOtherBodyMarks] = useState("");

  // Step 3: Missing details
  const [dateMissing, setDateMissing] = useState("");
  const [timeMissing, setTimeMissing] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = "India";

  // Step 4: Files
  const [firCopyFile, setFirCopyFile] = useState<File | null>(null);
  const [additionalDocFile, setAdditionalDocFile] = useState<File | null>(null);

  // Step 5: Contact
  const [familyPhone, setFamilyPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [familyEmail, setFamilyEmail] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [preferredCommunication, setPreferredCommunication] = useState<string[]>([]);

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).slice(0, 5);
    setFiles((f) => [...f, ...dropped].slice(0, 5));
  }

  async function publishCase() {
    if (!token) {
      toast.error("Please login to submit a case");
      navigate({ to: "/auth" });
      return;
    }
    setPublishing(true);
    try {
      const fd = new FormData();
      fd.append("missingPersonName", name);
      fd.append("age", age);
      fd.append("gender", gender.toLowerCase() === "male" ? "male" : gender.toLowerCase() === "female" ? "female" : "non_binary");
      fd.append("height", height);
      fd.append("weight", weight);
      fd.append("bodyShape", bodyShape);
      fd.append("tattoos", tattoos);
      fd.append("birthmarks", birthmarks);
      fd.append("lastSeenClothing", clothesLastWorn);

      const lastSeenDateVal = dateMissing ? (timeMissing ? `${dateMissing}T${timeMissing}` : dateMissing) : new Date().toISOString();
      fd.append("lastSeenDate", lastSeenDateVal);

      fd.append("lastSeenLocation", JSON.stringify({
        address: lastSeenLocation,
        city,
        state: stateName,
        country
      }));

      fd.append("familyContactDetails", JSON.stringify({
        name: "Family Member",
        relationship: "Family",
        phone: familyPhone,
        email: familyEmail
      }));

      fd.append("rewardAmount", String(Number(rewardAmount) || 0));

      files.forEach((f) => {
        fd.append("photos", f);
      });

      if (firCopyFile) {
        fd.append("firCopy", firCopyFile);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/cases`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit case");
      }

      toast.success("Case published — volunteers and matching systems notified");
      navigate({ to: "/cases" });
    } catch (err: any) {
      toast.error(err.message || "Failed to publish case");
    } finally {
      setPublishing(false);
    }
  }

  function handleCommChange(channel: string, checked: boolean) {
    if (checked) {
      setPreferredCommunication(prev => [...prev, channel]);
    } else {
      setPreferredCommunication(prev => prev.filter(c => c !== channel));
    }
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Report a missing person</h1>
          <p className="text-muted-foreground mt-2">All information stays confidential and is only shared with verified volunteers and authorities.</p>
        </div>

        {/* Stepper */}
        <div className="mb-6">
          <nav aria-label="Form progress" role="list" className="flex items-center justify-between mb-3 overflow-x-auto pb-2">
            {STEPS.map((s) => (
              <div key={s.id} role="listitem"
                aria-current={step === s.id ? "step" : undefined}
                aria-label={`Step ${s.id}: ${s.label} — ${step > s.id ? "Completed" : step === s.id ? "Current" : "Upcoming"}`}
                className={`flex items-center gap-2 text-xs whitespace-nowrap ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}>
                <div className={`grid place-items-center h-7 w-7 rounded-full text-xs font-semibold ${step > s.id ? "bg-[color:var(--color-success)] text-white" : step === s.id ? "gradient-brand text-white" : "bg-muted"}`}>
                  {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </nav>
          <Progress value={progress} />
        </div>

        <Card className="glass p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {step === 1 && (
                <Grid title="Personal details">
                  <Row><Label htmlFor="name">Full name</Label><Input id="name" placeholder="Priya Sharma" value={name} onChange={e=>setName(e.target.value)} /></Row>
                  <Row><Label htmlFor="age">Age</Label><Input id="age" type="number" placeholder="14" value={age} onChange={e=>setAge(e.target.value)} /></Row>
                  <Row><Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger id="gender"><SelectValue placeholder="Select"/></SelectTrigger>
                      <SelectContent>{["Male","Female","Other"].map(g=><SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </Row>
                  <Row><Label htmlFor="height">Height (cm)</Label><Input id="height" type="number" placeholder="165" value={height} onChange={e=>setHeight(e.target.value)} /></Row>
                  <Row><Label htmlFor="weight">Weight (kg)</Label><Input id="weight" type="number" placeholder="52" value={weight} onChange={e=>setWeight(e.target.value)} /></Row>
                  <Row><Label htmlFor="bodyShape">Body shape</Label><Input id="bodyShape" placeholder="Slim / Average / Heavy" value={bodyShape} onChange={e=>setBodyShape(e.target.value)} /></Row>
                  <Row><Label htmlFor="skinTone">Skin tone</Label><Input id="skinTone" placeholder="Fair / Wheatish / Dark" value={skinTone} onChange={e=>setSkinTone(e.target.value)} /></Row>
                  <Row><Label htmlFor="hairStyle">Hair style</Label><Input id="hairStyle" placeholder="Short black, curly" value={hairStyle} onChange={e=>setHairStyle(e.target.value)} /></Row>
                  <Row><Label htmlFor="eyeColor">Eye color</Label><Input id="eyeColor" placeholder="Brown" value={eyeColor} onChange={e=>setEyeColor(e.target.value)} /></Row>
                </Grid>
              )}
              {step === 2 && (
                <Grid title="Identification details">
                  <Row className="sm:col-span-2"><Label htmlFor="tattoos">Tattoos</Label><Textarea id="tattoos" placeholder="Describe any tattoos and their location" rows={2} value={tattoos} onChange={e=>setTattoos(e.target.value)} /></Row>
                  <Row><Label htmlFor="birthmarks">Birthmarks</Label><Input id="birthmarks" placeholder="e.g. left cheek" value={birthmarks} onChange={e=>setBirthmarks(e.target.value)} /></Row>
                  <Row><Label htmlFor="scars">Scars</Label><Input id="scars" placeholder="e.g. above right eyebrow" value={scars} onChange={e=>setScars(e.target.value)} /></Row>
                  <Row><Label htmlFor="disabilityInfo">Disability info</Label><Input id="disabilityInfo" placeholder="If any" value={disabilityInfo} onChange={e=>setDisabilityInfo(e.target.value)} /></Row>
                  <Row><Label htmlFor="clothesLastWorn">Clothes last worn</Label><Input id="clothesLastWorn" placeholder="Blue school uniform" value={clothesLastWorn} onChange={e=>setClothesLastWorn(e.target.value)} /></Row>
                  <Row className="sm:col-span-2"><Label htmlFor="otherBodyMarks">Other body marks</Label><Textarea id="otherBodyMarks" placeholder="Other distinguishing features" rows={2} value={otherBodyMarks} onChange={e=>setOtherBodyMarks(e.target.value)} /></Row>
                </Grid>
              )}
              {step === 3 && (
                <Grid title="Missing details">
                  <Row><Label htmlFor="dateMissing">Date missing</Label><Input id="dateMissing" type="date" value={dateMissing} onChange={e=>setDateMissing(e.target.value)} /></Row>
                  <Row><Label htmlFor="timeMissing">Time (approx)</Label><Input id="timeMissing" type="time" value={timeMissing} onChange={e=>setTimeMissing(e.target.value)} /></Row>
                  <Row className="sm:col-span-2"><Label htmlFor="lastSeenLocation">Last seen location</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="lastSeenLocation" className="pl-9" placeholder="e.g. Connaught Place metro gate 4" value={lastSeenLocation} onChange={e=>setLastSeenLocation(e.target.value)} /></div></Row>
                  <Row><Label htmlFor="city">City</Label><Input id="city" placeholder="New Delhi" value={city} onChange={e=>setCity(e.target.value)} /></Row>
                  <Row><Label htmlFor="stateName">State</Label><Input id="stateName" placeholder="Delhi" value={stateName} onChange={e=>setStateName(e.target.value)} /></Row>
                  <Row><Label htmlFor="country">Country</Label><Input id="country" placeholder="India" value={country} disabled /></Row>
                  <div className="sm:col-span-2 rounded-lg overflow-hidden border h-56">
                    <iframe title="map" className="w-full h-full border-0" src={`https://www.openstreetmap.org/export/embed.html?bbox=77.20%2C28.60%2C77.25%2C28.65&layer=mapnik`} />
                  </div>
                </Grid>
              )}
              {step === 4 && (
                <div>
                  <h3 className="font-display text-xl font-semibold mb-4">Upload section</h3>
                  <div onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}
                    className="rounded-xl border-2 border-dashed p-10 text-center bg-muted/30 hover:bg-muted/50 transition">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-3 font-medium">Drag and drop 2–5 photos here</div>
                    <div className="text-xs text-muted-foreground mt-1">PNG, JPG up to 8 MB each</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const picked = Array.from(e.target.files ?? []);
                        const oversized = picked.filter(f => f.size > 8 * 1024 * 1024);
                        if (oversized.length) {
                          toast.error(`${oversized.length} file(s) exceed 8 MB. Please compress them.`);
                          e.target.value = '';
                          return;
                        }
                        setFiles((f) => [...f, ...picked].slice(0, 5));
                        e.target.value = '';
                      }}
                    />
                    <Button type="button" variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>Browse files</Button>
                  </div>
                  {files.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {files.map((f,i) => <div key={i} className="aspect-square rounded-md bg-muted grid place-items-center text-xs px-2 text-center">{f.name}</div>)}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    <Row><Label htmlFor="firCopy">FIR copy (PDF/JPG)</Label><Input id="firCopy" type="file" accept=".pdf,image/*" onChange={e=>setFirCopyFile(e.target.files?.[0] || null)} /></Row>
                    <Row><Label htmlFor="additionalDoc">Additional document</Label><Input id="additionalDoc" type="file" onChange={e=>setAdditionalDocFile(e.target.files?.[0] || null)} /></Row>
                  </div>
                </div>
              )}
              {step === 5 && (
                <Grid title="Contact & reward">
                  <Row><Label htmlFor="familyPhone">Family contact number</Label><Input id="familyPhone" type="tel" placeholder="+91 98765 43210" value={familyPhone} onChange={e=>setFamilyPhone(e.target.value)} /></Row>
                  <Row><Label htmlFor="alternatePhone">Alternate contact</Label><Input id="alternatePhone" type="tel" value={alternatePhone} onChange={e=>setAlternatePhone(e.target.value)} /></Row>
                  <Row><Label htmlFor="familyEmail">Email address</Label><Input id="familyEmail" type="email" placeholder="family@example.com" value={familyEmail} onChange={e=>setFamilyEmail(e.target.value)} /></Row>
                  <Row><Label htmlFor="rewardAmount">Reward / bounty (₹)</Label><Input id="rewardAmount" type="number" placeholder="50000" value={rewardAmount} onChange={e=>setRewardAmount(e.target.value)} /></Row>
                  <div className="sm:col-span-2">
                    <Label>Preferred communication</Label>
                    <div className="flex gap-4 mt-2">
                      {["Email", "WhatsApp", "SMS"].map(p => (
                        <label key={p} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={preferredCommunication.includes(p)} onCheckedChange={(checked) => handleCommChange(p, !!checked)} /> {p}
                        </label>
                      ))}
                    </div>
                  </div>
                </Grid>
              )}
              {step === 6 && (
                <div>
                  <h3 className="font-display text-xl font-semibold mb-4">Preview & publish</h3>
                  <Card className="p-5 bg-muted/30">
                    <div className="text-sm text-muted-foreground">Once published, your case becomes visible to verified volunteers in the search radius and the AI matching system starts scanning new sightings instantly.</div>
                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--color-success)]" /> Personal & identification details captured</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--color-success)]" /> {files.length} photo(s) uploaded</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--color-success)]" /> Last seen location pinned</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[color:var(--color-success)]" /> Contact channels confirmed</li>
                    </ul>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || publishing}>
              <ChevronLeft className="h-4 w-4" />Back
            </Button>
            {step < STEPS.length ? (
              <Button onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))} className="gradient-brand text-white">
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={publishCase} disabled={publishing} className="gradient-brand text-white">
                {publishing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Publish case
              </Button>
            )}
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="font-display text-xl font-semibold mb-4">{title}</h3><div className="grid sm:grid-cols-2 gap-4">{children}</div></div>;
}
function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}
