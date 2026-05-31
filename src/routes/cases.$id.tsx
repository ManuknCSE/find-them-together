import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, MapPin, Calendar, Share2, Phone, MessageCircle, Mail, Camera, Upload, Sparkles, CheckCircle2, BellRing, Loader2 } from "lucide-react";
import { AIScanAnimation } from "@/components/ai-scan";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { mapBackendCaseToFrontend } from "@/lib/utils";

export const Route = createFileRoute("/cases/$id")({ component: CaseDetail });

function CaseDetail() {
  const { id } = useParams({ from: "/cases/$id" });
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"form" | "scan" | "done">("form");
  const [result, setResult] = useState<{ result: string; confidence: number } | null>(null);

  // Form states for sighting submission
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch case details from backend
  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: () => request(`/cases/${id}`)
  });

  const c = useMemo(() => {
    return caseData ? mapBackendCaseToFrontend(caseData) : null;
  }, [caseData]);

  async function submitSighting(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Please login to submit a sighting");
      navigate({ to: "/auth" });
      return;
    }
    if (!evidenceFile) {
      toast.error("Please select a sighting photo to upload");
      return;
    }
    if (!c?._id) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("relatedCaseId", c._id);
      fd.append("address", address);
      fd.append("additionalNotes", notes);
      fd.append("currentGpsLocation", JSON.stringify([0, 0]));
      fd.append("evidenceImages", evidenceFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit sighting report");
      }

      toast.success("Sighting report uploaded. AI matching triggered!");
      setStage("scan");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit sighting");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading case details…</p>
        </div>
      </SiteLayout>
    );
  }

  if (!c) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-display font-bold">Case not found</h2>
          <Button asChild className="mt-4"><Link to="/cases">Back to cases</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-8">
        <Link to="/cases" className="text-sm text-muted-foreground hover:text-foreground">← All cases</Link>

        <div className="grid lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-4 aspect-[16/10] rounded-xl overflow-hidden">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={c.image} alt={`Thumbnail of ${c.name}`} className="h-full w-full object-cover opacity-60 hover:opacity-100 transition" />
                </div>
              ))}
            </div>

            <Card className="glass p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground font-mono">{c.id}</div>
                  <h1 className="text-3xl font-display font-bold mt-1">{c.name}</h1>
                  <div className="text-sm text-muted-foreground mt-1">{c.age} years · {c.gender}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.firVerified && <Badge className="bg-primary text-primary-foreground"><ShieldCheck className="h-3 w-3 mr-1" />FIR verified</Badge>}
                  <Badge variant="outline"><Sparkles className="h-3 w-3 mr-1" />AI: {c.aiMatch}</Badge>
                  <Badge variant={c.status === "Found" ? "secondary" : "destructive"}>{c.status}</Badge>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">{c.description}</p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                <Info label="Last seen" value={c.lastSeen} icon={Calendar} />
                <Info label="Location" value={`${c.location}, ${c.city}`} icon={MapPin} />
                <Info label="Reported" value={c.reportedAt} icon={Calendar} />
                <Info label="Reward" value={`₹${c.reward.toLocaleString("en-IN")}`} icon={ShieldCheck} />
              </div>
            </Card>

            {/* Map */}
            <Card className="glass p-0 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b">
                <div className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Last seen location</div>
                <Badge variant="outline">{c.distanceKm ?? "—"} km from you</Badge>
              </div>
              <div className="relative h-72">
                <iframe title="map" className="absolute inset-0 w-full h-full border-0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=77.20%2C28.60%2C77.25%2C28.65&layer=mapnik&marker=28.625%2C77.225`} />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="glass p-6">
              <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStage("form"); setResult(null); } }}>
                <DialogTrigger asChild>
                  <Button className="w-full gradient-brand text-white shadow-lg shadow-primary/30">
                    <Camera className="h-4 w-4" /> I Found This Person
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Submit a sighting</DialogTitle></DialogHeader>
                  {stage === "form" && (
                    <form onSubmit={submitSighting} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="evidence-file">Upload Photo Sighting</Label>
                        <Input id="evidence-file" type="file" accept="image/*" onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sighting-location">Current location</Label>
                        <Input id="sighting-location" placeholder="e.g. Park Street, Kolkata" value={address} onChange={e=>setAddress(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sighting-notes">Notes / comments</Label>
                        <Textarea id="sighting-notes" placeholder="Describe what you saw…" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
                      </div>
                      <Button type="submit" disabled={submitting} className="w-full gradient-brand text-white">
                        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Run AI verification
                      </Button>
                    </form>
                  )}
                  {stage === "scan" && (
                    <AIScanAnimation image={c.image} onComplete={async () => {
                      try {
                        // Refetch case detail to get calculated AI status from backend
                        const updated = await request(`/cases/${id}`);
                        const mapped = mapBackendCaseToFrontend(updated);
                        
                        let finalResult: "Match Found" | "Possible Match" | "No Match" = "No Match";
                        let confidence = 45;
                        
                        if (mapped.aiMatch === "Match Found") {
                          finalResult = "Match Found";
                          confidence = 92;
                        } else if (mapped.aiMatch === "Possible Match") {
                          finalResult = "Possible Match";
                          confidence = 72;
                        }
                        
                        setResult({ result: finalResult, confidence });
                        queryClient.invalidateQueries({ queryKey: ["case", id] });
                        queryClient.invalidateQueries({ queryKey: ["cases"] });
                      } catch (err) {
                        setResult({ result: "No Match", confidence: 32 });
                      }
                      setTimeout(() => setStage("done"), 1200);
                    }} />
                  )}
                  {stage === "done" && result && (
                    <div className="space-y-3">
                      <div className={`rounded-xl p-4 ${result.result === "Match Found" ? "bg-success/10 text-[color:var(--color-success)]" : result.result === "Possible Match" ? "bg-warning/15 text-[color:var(--color-warning)]" : "bg-muted text-muted-foreground"}`}>
                        <div className="font-display font-semibold">{result.result} · {result.confidence}%</div>
                      </div>
                      {result.result !== "No Match" && (
                        <Card className="p-4 space-y-2">
                          <div className="font-semibold text-sm flex items-center gap-2"><BellRing className="h-4 w-4 text-primary" /> Notifications dispatched</div>
                          {[
                            { i: Mail, t: "Email sent to family contact" },
                            { i: MessageCircle, t: "WhatsApp alert sent" },
                            { i: Phone, t: "Emergency contact notified" },
                          ].map((n, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2 }}
                              className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-[color:var(--color-success)]" />
                              <n.i className="h-3.5 w-3.5" />{n.t}
                            </motion.div>
                          ))}
                        </Card>
                      )}
                      <Button onClick={() => { toast.success("Thank you, your report has been submitted."); setOpen(false); setStage("form"); }} className="w-full gradient-brand text-white">Done</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button variant="outline"><Phone className="h-4 w-4" />Call</Button>
                <Button variant="outline"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                <Button variant="outline"><Mail className="h-4 w-4" />Email</Button>
                <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }}>
                  <Share2 className="h-4 w-4" />Share
                </Button>
              </div>
            </Card>

            <Card className="glass p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Reward</div>
              <div className="text-3xl font-display font-bold text-gradient">₹{c.reward.toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground mt-2">Released to the verified volunteer who provides the confirmed sighting. Subject to FIR verification.</p>
            </Card>

            <Card className="glass p-6">
              <div className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI match status</div>
              <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">{c.aiMatch}</Badge>
              <p className="text-xs text-muted-foreground mt-3">Our face recognition model continuously scans new sightings against this case profile.</p>
            </Card>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
      <div className="grid place-items-center h-8 w-8 rounded-md bg-primary/10 text-primary shrink-0"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
