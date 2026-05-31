import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Users, Heart, Shield, Sparkles, MapPin, ArrowRight, FileText, HandHelping, Camera, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteLayout } from "@/components/site-layout";
import { CaseCard } from "@/components/case-card";
import { MOCK_CASES, STATS, VOLUNTEER_FEED } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api-client";
import { mapBackendCaseToFrontend } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Index });

function Stat({ value, label, icon: Icon, accent }: { value: string; label: string; icon: any; accent?: boolean }) {
  return (
    <Card className="glass p-5">
      <div className="flex items-center gap-3">
        <div className={`grid place-items-center h-11 w-11 rounded-xl ${accent ? "bg-[color:var(--color-accent-orange)]/15 text-[color:var(--color-accent-orange)]" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-display font-bold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function Index() {
  const { data: casesResponse } = useQuery({
    queryKey: ["featured-cases"],
    queryFn: () => request("/cases?limit=6")
  });
  const cases = (casesResponse?.data || []).map(mapBackendCaseToFrontend);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 gradient-brand-soft" />
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[color:var(--color-accent-orange)]/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
              28,910 volunteers actively searching right now
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight">
              Together We Can{" "}
              <span className="text-gradient">Bring Them Home</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              A community-driven, AI-powered platform to report missing persons, mobilise volunteers, and reunite families faster than ever.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="gradient-brand text-white hover:opacity-95 shadow-lg shadow-primary/30">
                <Link to="/report"><FileText className="h-4 w-4" />Report Missing Person</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass">
                <Link to="/volunteer"><HandHelping className="h-4 w-4" />Become a Volunteer</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/cases">Explore Cases <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            <Stat value={STATS.totalCases.toLocaleString("en-IN")} label="Total Missing Cases" icon={Search} />
            <Stat value={STATS.peopleFound.toLocaleString("en-IN")} label="People Found" icon={Heart} accent />
            <Stat value={STATS.activeVolunteers.toLocaleString("en-IN")} label="Active Volunteers" icon={Users} />
            <Stat value={`₹${(STATS.rewardsClaimed / 100000).toFixed(1)}L`} label="Rewards Claimed" icon={Shield} accent />
          </div>
        </div>
      </section>

      {/* Featured cases */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Urgent</div>
            <h2 className="text-3xl font-display font-bold">High-priority cases</h2>
          </div>
          <Button asChild variant="ghost"><Link to="/cases">View all <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.length > 0 ? (
            cases.map((c: any, i: number) => <CaseCard key={c.id} c={c} index={i} />)
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 text-center py-8 text-muted-foreground">
              No active cases reported yet.
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">How it works</div>
          <h2 className="text-3xl font-display font-bold">From report to reunion in 5 steps</h2>
          <p className="mt-3 text-muted-foreground">AI augments a network of volunteers, NGOs, and authorities to act faster when every minute counts.</p>
        </div>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            { icon: FileText, title: "Report", desc: "Family files a detailed report with photos and FIR." },
            { icon: Users, title: "Volunteers", desc: "Nearby volunteers are alerted within a search radius." },
            { icon: Sparkles, title: "AI Verify", desc: "Face recognition matches sightings to the case." },
            { icon: BellRing, title: "Notify", desc: "Emergency contacts, family and police are alerted instantly." },
            { icon: Heart, title: "Reunite", desc: "Verified meet-up. Rewards processed transparently." },
          ].map((s, i) => (
            <motion.div key={s.title}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}>
              <Card className="glass p-5 h-full">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">STEP {i + 1}</div>
                <div className="mt-3 grid place-items-center h-11 w-11 rounded-xl gradient-brand text-white">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-display font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Volunteer feed + AI alerts */}
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Live AI activity
            </h3>
            <span className="text-xs text-muted-foreground">Updated continuously</span>
          </div>
          <ul className="divide-y">
            {[
              { c: "FT-2404", txt: "AI matched a sighting in Park Street with 91% confidence", time: "2m ago" },
              { c: "FT-2401", txt: "New photo evidence under review by face-match model", time: "11m ago" },
              { c: "FT-2402", txt: "Distance estimate updated — possible movement north", time: "32m ago" },
              { c: "FT-2406", txt: "Volunteer-submitted CCTV frame matched (88%)", time: "1h ago" },
            ].map((a, i) => (
              <li key={i} className="py-3 flex items-start gap-3">
                <div className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Camera className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm"><span className="font-semibold">{a.c}</span> · {a.txt}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-[color:var(--color-accent-orange)]" /> Volunteer feed
            </h3>
            <Button asChild variant="ghost" size="sm"><Link to="/volunteer">Join</Link></Button>
          </div>
          <ul className="space-y-3">
            {VOLUNTEER_FEED.map((v) => (
              <li key={v.id} className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full gradient-brand grid place-items-center text-white text-xs font-semibold">
                  {v.user.split(" ").map((s) => s[0]).join("")}
                </div>
                <div className="flex-1"><span className="font-medium">{v.user}</span> <span className="text-muted-foreground">{v.action}</span> <span className="font-mono text-xs">{v.target}</span></div>
                <div className="text-xs text-muted-foreground">{v.time}</div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* CTA banner */}
      <section className="container mx-auto px-4 py-16">
        <Card className="relative overflow-hidden p-10 lg:p-14 border-0">
          <div className="absolute inset-0 gradient-brand" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="relative text-white max-w-2xl">
            <h3 className="text-3xl lg:text-4xl font-display font-bold">Every minute matters.</h3>
            <p className="mt-3 text-white/90">Report a missing person, become a volunteer in your city, or share a case. Together we can shorten the time it takes to bring them home.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/report"><FileText className="h-4 w-4" />Report a case</Link></Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
                <Link to="/volunteer"><MapPin className="h-4 w-4" />Volunteer near me</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
