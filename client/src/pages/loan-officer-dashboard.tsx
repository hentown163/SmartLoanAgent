import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { LoanApplication, AgentState, OverrideDecision } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, AlertCircle, Clock, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { AgentActivityTimeline } from "@/components/agent-activity-timeline";
import { DecisionCard } from "@/components/decision-card";

export default function LoanOfficerDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [newDecision, setNewDecision] = useState<"approved" | "rejected">("approved");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: applications = [], isLoading: appsLoading } = useQuery<LoanApplication[]>({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
    refetchInterval: 3000, // Poll for new applications and status updates
  });

  const { data: agentStates } = useQuery<AgentState[]>({
    queryKey: [`/api/applications/${selectedApp?.id}/agents`],
    enabled: !!selectedApp?.id,
    refetchInterval: selectedApp?.status === "processing" ? 2000 : false,
  });

  const overrideMutation = useMutation({
    mutationFn: async ({ applicationId, data }: { applicationId: string; data: OverrideDecision }) => {
      return await apiRequest("POST", `/api/applications/${applicationId}/override`, data);
    },
    onSuccess: () => {
      toast({
        title: "Override Applied",
        description: "Your decision override has been recorded and audited.",
      });
      setOverrideDialogOpen(false);
      setOverrideReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      if (selectedApp) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${selectedApp.id}/agents`] });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to override decision.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleOverride = () => {
    if (!selectedApp || !overrideReason.trim() || overrideReason.length < 10) {
      toast({
        title: "Invalid Override",
        description: "Please provide a detailed reason (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    overrideMutation.mutate({
      applicationId: selectedApp.id,
      data: {
        overrideReason: overrideReason.trim(),
        newDecision,
      },
    });
  };

  const escalatedApps = applications.filter(app => app.status === "escalated");
  const allApps = applications;

  if (authLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Loan Officer Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {user?.firstName} {user?.lastName} • {user?.role}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Escalated Cases</p>
                <p className="text-3xl font-bold" data-testid="stat-escalated">
                  {escalatedApps.length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
                <p className="text-3xl font-bold" data-testid="stat-total">
                  {allApps.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-3xl font-bold" data-testid="stat-approved">
                  {allApps.filter(a => a.status === "approved").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                <p className="text-3xl font-bold" data-testid="stat-rejected">
                  {allApps.filter(a => a.status === "rejected").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Escalated Applications</CardTitle>
            <CardDescription>
              Review and override AI decisions for medium-risk applications
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {escalatedApps.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No escalated applications at this time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {escalatedApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onSelect={() => setSelectedApp(app)}
                    isSelected={selectedApp?.id === app.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Application Details */}
        {selectedApp && (
          <Card className="p-6 mt-8">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Application #{selectedApp.id.slice(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    {selectedApp.fullName} • {selectedApp.email}
                  </CardDescription>
                </div>
                <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-override-decision">
                      Override Decision
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Override AI Decision</DialogTitle>
                      <DialogDescription>
                        This action will be logged in the audit trail and requires a detailed justification.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="newDecision">New Decision *</Label>
                        <Select value={newDecision} onValueChange={(v: "approved" | "rejected") => setNewDecision(v)}>
                          <SelectTrigger id="newDecision" data-testid="select-new-decision">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="overrideReason">Justification * (min 10 characters)</Label>
                        <Textarea
                          id="overrideReason"
                          data-testid="textarea-override-reason"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Provide a detailed reason for overriding the AI decision..."
                          className="h-32"
                        />
                        <p className="text-xs text-muted-foreground">
                          ⚠️ This action will be audited for compliance
                        </p>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setOverrideDialogOpen(false)}
                          data-testid="button-cancel-override"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleOverride}
                          disabled={overrideMutation.isPending}
                          data-testid="button-submit-override"
                        >
                          {overrideMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            "Apply Override"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="p-0 space-y-6">
              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Loan Amount
                  </p>
                  <p className="text-lg font-semibold">
                    ${parseFloat(selectedApp.loanAmount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Annual Income
                  </p>
                  <p className="text-lg font-semibold">
                    ${parseFloat(selectedApp.annualIncome).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Monthly Debt
                  </p>
                  <p className="text-lg font-semibold">
                    ${parseFloat(selectedApp.monthlyDebt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Agent Activity */}
              {agentStates && agentStates.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium mb-4">Agent Processing Activity</h3>
                  <AgentActivityTimeline agentStates={agentStates} />
                </div>
              )}

              {/* AI Decision */}
              {selectedApp.finalDecision && selectedApp.aiExplanation && (
                <div className="border-t border-border pt-6">
                  <DecisionCard
                    decision={selectedApp.finalDecision}
                    explanation={selectedApp.aiExplanation}
                    riskTier={selectedApp.riskTier}
                    creditScore={selectedApp.creditScore}
                    overriddenBy={selectedApp.overriddenBy}
                    overrideReason={selectedApp.overrideReason}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ApplicationCard({
  application,
  onSelect,
  isSelected,
}: {
  application: LoanApplication;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-colors hover-elevate active-elevate-2 ${
        isSelected ? "border-primary bg-primary/5" : "border-border"
      }`}
      data-testid={`card-application-${application.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold truncate">{application.fullName}</h3>
            <Badge variant="outline" className="text-xs">
              #{application.id.slice(0, 8)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {application.email} • {application.phone}
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Loan:</span>{" "}
              <span className="font-medium">${parseFloat(application.loanAmount).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Income:</span>{" "}
              <span className="font-medium">${parseFloat(application.annualIncome).toLocaleString()}</span>
            </div>
            {application.riskTier && (
              <div>
                <span className="text-muted-foreground">Risk:</span>{" "}
                <span className="font-medium">{application.riskTier.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Submitted</p>
          <p className="text-xs font-medium">
            {new Date(application.createdAt!).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
