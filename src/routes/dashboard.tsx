import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site-layout";
import { CaseCard } from "@/components/case-card";
import { NOTIFICATIONS, VOLUNTEER_FEED, STATS } from "@/lib/mock-data";
import { Sparkles, Heart, Trophy, Users, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api-client";
import { useMemo } from "react";
import { mapBackendCaseToFrontend } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { data: casesResponse, isLoading } = useQuery({
    queryKey: ["dashboard-cases"],
    queryFn: () => request("/cases?limit=100")
  });

  const cases = useMemo(() => {
    return (casesResponse?.data || []).map(mapBackendCaseToFrontend);
  }, [casesResponse]);

  const nearby = cases.slice(0, 3);
  const found = cases.filter((c: any) => c.status === "Found").slice(0, 3);
  const highReward = [...cases].sort((a: any, b: any) => b.reward - a.reward).slice(0, 3);
  const aiAlerts = cases.filter((c: any) => c.aiMatch === "Match Found" || c.aiMatch === "Possible Match").slice(0, 3);

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</div>
            <h1 className="text-3xl font-display font-bold mt-1">Your impact dashboard</h1>
          </div>
          <Button asChild className="gradient-brand text-white"><Link to="/report">Report a new case</Link></Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading dashboard stats…</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
              {[
                { v: cases.filter((c: any) => c.status === "Active").length, l: "Active missing cases", i: MapPin },
                { v: aiAlerts.length, l: "AI match alerts", i: Sparkles },
                { v: cases.filter((c: any) => c.status === "Found").length, l: "Recently reunited", i: Heart },
                { v: STATS.activeVolunteers.toLocaleString("en-IN"), l: "Active volunteers", i: Users },
              ].map((s, i) => (
                <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass p-5 flex items-center gap-3">
                    <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/10 text-primary"><s.i className="h-5 w-5" /></div>
                    <div>
                      <div className="text-2xl font-bold font-display">{s.v}</div>
                      <div className="text-xs text-muted-foreground">{s.l}</div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Section title="Active missing cases" link="/cases">
              {nearby.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{nearby.map((c: any, i: number) => <CaseCard key={c.id} c={c} index={i} />)}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">No active cases.</div>
              )}
            </Section>

            <Section title="AI match alerts" link="/notifications">
              {aiAlerts.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{aiAlerts.map((c: any, i: number) => <CaseCard key={c.id} c={c} index={i} />)}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">No AI alerts found.</div>
              )}
            </Section>

            <Section title="High reward cases">
              {highReward.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{highReward.map((c: any, i: number) => <CaseCard key={c.id} c={c} index={i} />)}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">No reward cases.</div>
              )}
            </Section>

            <Section title="Recently found">
              {found.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{found.map((c: any, i: number) => <CaseCard key={c.id} c={c} index={i} />)}</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">No solved cases listed.</div>
              )}
            </Section>

            <div className="grid lg:grid-cols-2 gap-6 mt-12">
              <Card className="glass p-6">
                <h3 className="font-display text-xl font-semibold mb-4">Volunteer activity feed</h3>
                <ul className="space-y-3">
                  {VOLUNTEER_FEED.map((v) => (
                    <li key={v.id} className="flex items-center gap-3 text-sm">
                      <div className="h-9 w-9 rounded-full gradient-brand grid place-items-center text-white text-xs font-semibold">{v.user.split(" ").map(s=>s[0]).join("")}</div>
                      <div className="flex-1"><span className="font-medium">{v.user}</span> <span className="text-muted-foreground">{v.action}</span> <span className="font-mono text-xs">{v.target}</span></div>
                      <div className="text-xs text-muted-foreground">{v.time}</div>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="glass p-6">
                <h3 className="font-display text-xl font-semibold mb-4">Latest notifications</h3>
                <ul className="space-y-3">
                  {NOTIFICATIONS.map(n => (
                    <li key={n.id} className="flex items-start gap-3">
                      <Badge variant="outline" className="capitalize">{n.type}</Badge>
                      <div className="flex-1"><div className="text-sm font-medium">{n.title}</div><div className="text-xs text-muted-foreground">{n.body}</div></div>
                      <div className="text-xs text-muted-foreground">{n.time}</div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )}
      </section>
    </SiteLayout>
  );
}

function Section({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <div className="mt-12">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-display font-bold">{title}</h2>
        {link && <Button asChild variant="ghost" size="sm"><Link to={link}>View all <ArrowRight className="h-3 w-3" /></Link></Button>}
      </div>
      {children}
    </div>
  );
}
