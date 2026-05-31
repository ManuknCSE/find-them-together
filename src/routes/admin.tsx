import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { Loader2, ShieldCheck, XCircle, AlertTriangle, Database, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

export const Route = createFileRoute("/admin")({ component: AdminPanel });

function AdminPanel() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  // Route guarding
  if (!token || (user?.role !== "admin" && user?.role !== "police_verification_team")) {
    return <Navigate to="/auth" />;
  }

  // Queries
  const { data: casesData, isLoading: loadingCases } = useQuery({
    queryKey: ["admin-cases"],
    queryFn: () => request("/admin/cases?limit=100")
  });

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => request("/reports?limit=100") // listReports endpoint
  });

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["admin-ai-logs"],
    queryFn: () => request("/admin/ai-logs?limit=100")
  });

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => request("/admin/analytics")
  });

  // Mutations
  const verifyCaseMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => request(`/admin/cases/${id}/verify`, {
      method: "PATCH",
      body: { status }
    }),
    onSuccess: () => {
      toast.success("Case verification status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify case");
    }
  });

  const verifyReportMutation = useMutation({
    mutationFn: ({ id, verificationStatus }: { id: string; verificationStatus: string }) => request(`/admin/reports/${id}/verify`, {
      method: "PATCH",
      body: { verificationStatus }
    }),
    onSuccess: () => {
      toast.success("Report verification status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to verify report");
    }
  });

  const activeCases = casesData?.data || [];
  const activeReports = reportsData?.data || [];
  const aiLogsList = logsData?.data || [];

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Admin verification panel</h1>
            <p className="text-muted-foreground mt-2">Manage incoming missing cases, sightings, and review AI audit logs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-cases"] });
              queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
              queryClient.invalidateQueries({ queryKey: ["admin-ai-logs"] });
              queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
              toast.success("Panel data refreshed!");
            }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full lg:max-w-2xl bg-muted/60">
            <TabsTrigger value="cases">Cases ({activeCases.length})</TabsTrigger>
            <TabsTrigger value="reports">Sightings ({activeReports.length})</TabsTrigger>
            <TabsTrigger value="ai-logs">AI Logs ({aiLogsList.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Cases Verification Tab */}
          <TabsContent value="cases">
            {loadingCases ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : activeCases.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No missing person cases submitted yet.</Card>
            ) : (
              <div className="grid gap-4">
                {activeCases.map((c: any) => (
                  <Card key={c._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{c.caseId || c._id}</span>
                        <Badge variant={c.caseStatus === "active" ? "secondary" : "outline"}>{c.caseStatus}</Badge>
                      </div>
                      <h3 className="text-lg font-bold font-display mt-1">{c.missingPersonName}</h3>
                      <p className="text-sm text-muted-foreground">Last seen in {c.lastSeenLocation?.city || "Unknown City"} on {c.lastSeenDate ? c.lastSeenDate.split("T")[0] : "N/A"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-success border-success/30 hover:bg-success/15" size="sm" onClick={() => verifyCaseMutation.mutate({ id: c._id, status: "active" })}>
                        <ShieldCheck className="h-4 w-4 mr-1.5" /> Approve Case
                      </Button>
                      <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/15" size="sm" onClick={() => verifyCaseMutation.mutate({ id: c._id, status: "rejected" })}>
                        <XCircle className="h-4 w-4 mr-1.5" /> Reject Case
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sightings Verification Tab */}
          <TabsContent value="reports">
            {loadingReports ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : activeReports.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No volunteer sightings submitted yet.</Card>
            ) : (
              <div className="grid gap-4">
                {activeReports.map((r: any) => (
                  <Card key={r._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">Sighting S-{r._id.slice(-6)}</span>
                        <Badge variant={r.verificationStatus === "verified" ? "secondary" : "outline"}>{r.verificationStatus}</Badge>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">AI Confidence: {r.aiMatchConfidence}%</Badge>
                      </div>
                      <h3 className="text-base font-semibold font-display mt-2">Address: {r.address || "Unknown"}</h3>
                      {r.additionalNotes && <p className="text-sm text-muted-foreground mt-1">"{r.additionalNotes}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-success border-success/30 hover:bg-success/15" size="sm" onClick={() => verifyReportMutation.mutate({ id: r._id, verificationStatus: "verified" })}>
                        <ShieldCheck className="h-4 w-4 mr-1.5" /> Verify
                      </Button>
                      <Button variant="outline" className="text-warning border-warning/30 hover:bg-warning/15" size="sm" onClick={() => verifyReportMutation.mutate({ id: r._id, verificationStatus: "fake" })}>
                        <AlertTriangle className="h-4 w-4 mr-1.5" /> Mark Fake
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI Detection Logs Tab */}
          <TabsContent value="ai-logs">
            {loadingLogs ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : aiLogsList.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No AI biometric match scans processed yet.</Card>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs uppercase bg-muted/60 text-foreground font-mono">
                    <tr>
                      <th className="px-6 py-3">Log ID</th>
                      <th className="px-6 py-3">Case ID</th>
                      <th className="px-6 py-3">Sighting ID</th>
                      <th className="px-6 py-3">Confidence</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiLogsList.map((log: any) => (
                      <tr key={log._id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-6 py-4 font-mono text-xs">{log._id}</td>
                        <td className="px-6 py-4 font-mono text-xs">{log.caseId}</td>
                        <td className="px-6 py-4 font-mono text-xs">{log.reportId || "N/A"}</td>
                        <td className="px-6 py-4 font-semibold text-foreground">{log.confidence}%</td>
                        <td className="px-6 py-4">
                          <Badge className={
                            log.status === "match" ? "bg-success/15 text-success border-0" :
                            log.status === "possible_match" ? "bg-warning/15 text-warning border-0" :
                            "bg-muted text-muted-foreground border-0"
                          }>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {loadingAnalytics ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : !analyticsData ? (
              <Card className="p-8 text-center text-muted-foreground">No analytics summary details available.</Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 flex items-center gap-4 glass">
                  <div className="p-3 bg-primary/15 text-primary rounded-xl"><Activity className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">AI Face Matches</h4>
                    <p className="text-2xl font-bold font-display mt-0.5">{analyticsData.aiMatches || 0}</p>
                  </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 glass">
                  <div className="p-3 bg-success/15 text-success rounded-xl"><ShieldCheck className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Users</h4>
                    <p className="text-2xl font-bold font-display mt-0.5">
                      {analyticsData.usersByRole?.reduce((sum: number, u: any) => sum + u.count, 0) || 0}
                    </p>
                  </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 glass">
                  <div className="p-3 bg-warning/15 text-warning rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Reports</h4>
                    <p className="text-2xl font-bold font-display mt-0.5">
                      {analyticsData.reportsByStatus?.find((r: any) => r._id === "pending")?.count || 0}
                    </p>
                  </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 glass">
                  <div className="p-3 bg-blue-500/15 text-blue-500 rounded-xl"><Database className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Cases</h4>
                    <p className="text-2xl font-bold font-display mt-0.5">
                      {analyticsData.casesByStatus?.find((c: any) => c._id === "active")?.count || 0}
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
