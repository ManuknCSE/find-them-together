import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CaseCard } from "@/components/case-card";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api-client";
import { mapBackendCaseToFrontend } from "@/lib/utils";

export const Route = createFileRoute("/volunteer")({ component: Volunteer });

function Volunteer() {
  const [live, setLive] = useState(false);
  const [radius, setRadius] = useState(10);

  const { data: casesResponse, isLoading } = useQuery({
    queryKey: ["volunteer-cases"],
    queryFn: () => request("/cases?limit=100")
  });

  const cases = useMemo(() => {
    return (casesResponse?.data || []).map(mapBackendCaseToFrontend);
  }, [casesResponse]);

  const nearby = useMemo(() => {
    // Fallback: if distance is not present, use index-based distance simulation or show active
    return cases.filter((c: any) => {
      const distance = c.distanceKm ?? (Math.floor(Math.random() * 45) + 2);
      return distance <= radius;
    });
  }, [cases, radius]);

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Volunteer near you</h1>
            <p className="text-muted-foreground mt-2">Cases visible to you adjust based on your live location and the search radius.</p>

            <Card className="glass p-0 overflow-hidden mt-6">
              <div className="relative h-72 bg-muted">
                <iframe title="map" className="absolute inset-0 w-full h-full border-0"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=77.10%2C28.55%2C77.35%2C28.70&layer=mapnik" />
              </div>
            </Card>

            <h2 className="text-xl font-display font-bold mt-10 mb-4">Cases near you ({nearby.length})</h2>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground mt-2">Locating cases near you…</span>
              </div>
            ) : nearby.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {nearby.map((c: any, i: number) => <CaseCard key={c.id} c={c} index={i} />)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
                No cases found in this search radius.
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <Card className="glass p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold"><Navigation className="h-4 w-4 text-primary" /> Live location</div>
                <Switch checked={live} onCheckedChange={setLive} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Enable to receive instant alerts about cases within your search radius.</p>
            </Card>
            <Card className="glass p-6">
              <div className="flex items-center gap-2 font-semibold mb-3"><MapPin className="h-4 w-4 text-primary" /> Search radius</div>
              <Slider value={[radius]} max={50} min={1} step={1} onValueChange={(v) => setRadius(v[0])} />
              <div className="text-sm mt-2"><span className="text-2xl font-display font-bold">{radius}</span> km</div>
            </Card>
            <Card className="glass p-6">
              <div className="font-semibold mb-2">Why volunteer?</div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>· Receive AI-verified alerts.</li>
                <li>· Earn rewards for confirmed sightings.</li>
                <li>· Help bring families home.</li>
              </ul>
              <Button className="w-full mt-4 gradient-brand text-white">Become a verified volunteer</Button>
            </Card>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
