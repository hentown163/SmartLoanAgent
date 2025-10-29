import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { LoanApplication, AgentState } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, FileText, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { LoanApplicationForm } from "@/components/loan-application-form";
import { AgentActivityTimeline } from "@/components/agent-activity-timeline";
import { AnimatedAgentProgress } from "@/components/animated-agent-progress";
import { DecisionCard } from "@/components/decision-card";
import { LoanSimulator } from "@/components/loan-simulator";
import { PersonalizedTips } from "@/components/personalized-tips";

export default function BorrowerDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

  // Redirect to login if not authenticated
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

  // Fetch borrower's application
  const { data: application, isLoading: appLoading } = useQuery<LoanApplication>({
    queryKey: ["/api/applications/my-application"],
    enabled: isAuthenticated,
    refetchInterval: (query) => {
      const app = query.state.data as LoanApplication | undefined;
      return app?.status === "processing" ? 2000 : false;
    },
  });

  // Fetch agent states if application exists
  const { data: agentStates } = useQuery<AgentState[]>({
    queryKey: [`/api/applications/${application?.id}/agents`],
    enabled: !!application?.id,
    refetchInterval: application?.status === "processing" ? 2000 : false, // Poll while processing
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleNewApplication = () => {
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["/api/applications/my-application"] });
  };

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      processing: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      escalated: { variant: "outline", icon: Clock },
    };

    const config = variants[status] || variants.processing;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1.5" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">My Loan Application</h1>
              <p className="text-xs text-muted-foreground">
                {user?.firstName} {user?.lastName}
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
      <main className="max-w-5xl mx-auto px-6 py-8">
        {showForm || !application ? (
          <Card className="p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl">New Loan Application</CardTitle>
              <CardDescription>
                Complete the form below to submit your loan application. Our AI agents will process it immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <LoanApplicationForm onSuccess={handleFormSuccess} />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold">Application #{application.id.slice(0, 8)}</h2>
                    {getStatusBadge(application.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submitted {new Date(application.createdAt!).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {application.status !== "processing" && (
                  <Button variant="outline" onClick={handleNewApplication} data-testid="button-new-application">
                    New Application
                  </Button>
                )}
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                    Loan Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Loan Amount</span>
                      <span className="text-sm font-medium" data-testid="text-loan-amount">
                        ${parseFloat(application.loanAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Purpose</span>
                      <span className="text-sm font-medium">{application.loanPurpose}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                    Financial Info
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Annual Income</span>
                      <span className="text-sm font-medium">
                        ${parseFloat(application.annualIncome).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Debt</span>
                      <span className="text-sm font-medium">
                        ${parseFloat(application.monthlyDebt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Activity Timeline */}
              {agentStates && agentStates.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium mb-4">AI Agents Processing Your Application</h3>
                  <AnimatedAgentProgress agentStates={agentStates} />
                </div>
              )}
            </Card>

            {/* What-If Simulator and Personalized Tips */}
            {application.status === "processing" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LoanSimulator 
                  initialData={{
                    loanAmount: application.loanAmount,
                    annualIncome: application.annualIncome,
                    monthlyDebt: application.monthlyDebt,
                    employmentDuration: application.employmentDuration,
                    employmentStatus: application.employmentStatus,
                  }}
                />
                <PersonalizedTips 
                  formData={{
                    annualIncome: application.annualIncome,
                    monthlyDebt: application.monthlyDebt,
                    employmentDuration: application.employmentDuration,
                    employmentStatus: application.employmentStatus,
                    loanAmount: application.loanAmount,
                  }}
                />
              </div>
            )}

            {/* Decision Card */}
            {application.finalDecision && application.aiExplanation && (
              <DecisionCard
                decision={application.finalDecision}
                explanation={application.aiExplanation}
                riskTier={application.riskTier}
                creditScore={application.creditScore}
                overriddenBy={application.overriddenBy}
                overrideReason={application.overrideReason}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
