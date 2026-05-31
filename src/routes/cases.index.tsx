import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteLayout } from "@/components/site-layout";
import { CaseCard } from "@/components/case-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api-client";
import { mapBackendCaseToFrontend } from "@/lib/utils";

export const Route = createFileRoute("/cases/")({ component: CasesIndex });

function CasesIndex() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");

  // Fetch cases from the backend
  const { data: casesResponse, isLoading } = useQuery({
    queryKey: ["cases", status, city, q],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status !== "all") {
        const mappedStatus = status === "Active" ? "active" : status === "Found" ? "resolved" : "pending_verification";
        params.append("status", mappedStatus);
      }
      if (city !== "all") {
        params.append("city", city);
      }
      if (q) {
        params.append("search", q);
      }
      params.append("limit", "100");
      return request(`/cases?${params.toString()}`);
    }
  });

  const cases = useMemo(() => {
    return (casesResponse?.data || []).map(mapBackendCaseToFrontend);
  }, [casesResponse]);

  // Load unique cities dynamically from the database to build filter
  const { data: allCasesResponse } = useQuery({
    queryKey: ["all-cases-cities"],
    queryFn: () => request("/cases?limit=200")
  });

  const cities = useMemo(() => {
    const list = allCasesResponse?.data || [];
    const uniqueCities = new Set(list.map((c: any) => c.lastSeenLocation?.city).filter(Boolean));
    return Array.from(uniqueCities) as string[];
  }, [allCasesResponse]);

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Browse missing person cases</h1>
          <p className="text-muted-foreground mt-2">
            {isLoading ? "Loading cases…" : `${cases.length} case(s) found — filter by location and status.`}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search by name, ID, location…" className="pl-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Status filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Found">Found</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger aria-label="City filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground mt-2">Loading cases…</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cases.map((c: any, i: number) => <CaseCard key={c.id} c={c} index={i} />)}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
