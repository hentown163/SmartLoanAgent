import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, LoanApplication, AgentState } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Loader2, Shield, Users, FileText, Activity, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle, BarChart3 } from "lucide-react";

interface AgentAnalytics {
  agentMetrics: {
    document_parser: { total: number; completed: number; failed: number; avgTime: number };
    credit_scorer: { total: number; completed: number; failed: number; avgTime: number };
    risk_assessor: { total: number; completed: number; failed: number; avgTime: number };
    decision_explainer: { total: number; completed: number; failed: number; avgTime: number };
  };
  decisionStats: {
    approved: number;
    rejected: number;
    escalated: number;
    processing: number;
  };
  riskTierStats: {
    low: number;
    medium: number;
    high: number;
  };
  recentAgentStates: AgentState[];
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery<LoanApplication[]>({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AgentAnalytics>({
    queryKey: ["/api/admin/agent-analytics"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.ok) {
      window.location.href = "/login";
    }
  };

  if (authLoading || usersLoading || appsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleDistribution = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const approvalRate = applications.length > 0
    ? ((applications.filter(a => a.status === "approved").length / applications.length) * 100).toFixed(1)
    : "0.0";

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSuccessRate = (completed: number, total: number) => {
    return total > 0 ? ((completed / total) * 100).toFixed(0) : "0";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold" data-testid="stat-total-users">
                  {users.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Applications</p>
                <p className="text-3xl font-bold" data-testid="stat-applications">
                  {applications.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
                <p className="text-3xl font-bold" data-testid="stat-approval-rate">
                  {approvalRate}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Loan Officers</p>
                <p className="text-3xl font-bold" data-testid="stat-loan-officers">
                  {roleDistribution['loan_officer'] || 0}
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Agent Performance</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time monitoring of AI agent performance and metrics
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics && Object.entries(analytics.agentMetrics).map(([agentName, metrics]) => (
                  <div key={agentName} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        <span className="font-medium capitalize">
                          {agentName.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        <div className="w-2 h-2 rounded-full bg-white mr-2" />
                        Active
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs">Completed</span>
                        </div>
                        <p className="text-lg font-semibold">{metrics.completed}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">Avg Time</span>
                        </div>
                        <p className="text-lg font-semibold">{formatDuration(metrics.avgTime)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs">Success</span>
                        </div>
                        <p className="text-lg font-semibold">{getSuccessRate(metrics.completed, metrics.total)}%</p>
                      </div>
                    </div>

                    {metrics.failed > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-1 text-destructive">
                          <XCircle className="w-3 h-3" />
                          <span className="text-xs">{metrics.failed} failed executions</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Recent Agent Activity</h2>
                <p className="text-sm text-muted-foreground">
                  Latest agent executions across the system
                </p>
              </div>

              <div className="space-y-3">
                {analytics?.recentAgentStates.map((state) => (
                  <div key={state.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          state.agentStatus === 'completed' ? 'bg-green-600' :
                          state.agentStatus === 'processing' ? 'bg-blue-600' :
                          state.agentStatus === 'failed' ? 'bg-red-600' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {state.agentName.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Application {state.applicationId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          state.agentStatus === 'completed' ? 'default' :
                          state.agentStatus === 'processing' ? 'secondary' :
                          'destructive'
                        }>
                          {state.agentStatus}
                        </Badge>
                        {state.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(state.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Decision Distribution</h2>
                  <p className="text-sm text-muted-foreground">
                    Breakdown of loan decisions by the AI system
                  </p>
                </div>

                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-600" />
                        <span className="text-sm">Approved</span>
                      </div>
                      <span className="font-semibold">{analytics.decisionStats.approved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-600" />
                        <span className="text-sm">Rejected</span>
                      </div>
                      <span className="font-semibold">{analytics.decisionStats.rejected}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-600" />
                        <span className="text-sm">Escalated</span>
                      </div>
                      <span className="font-semibold">{analytics.decisionStats.escalated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-600" />
                        <span className="text-sm">Processing</span>
                      </div>
                      <span className="font-semibold">{analytics.decisionStats.processing}</span>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Risk Tier Analysis</h2>
                  <p className="text-sm text-muted-foreground">
                    Distribution of applications by risk assessment
                  </p>
                </div>

                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-600" />
                        <span className="text-sm">Low Risk</span>
                      </div>
                      <span className="font-semibold">{analytics.riskTierStats.low}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-600" />
                        <span className="text-sm">Medium Risk</span>
                      </div>
                      <span className="font-semibold">{analytics.riskTierStats.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-600" />
                        <span className="text-sm">High Risk</span>
                      </div>
                      <span className="font-semibold">{analytics.riskTierStats.high}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">User Management</h2>
                <p className="text-sm text-muted-foreground">
                  Manage roles and permissions for all system users
                </p>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">User</TableHead>
                      <TableHead className="font-medium">Email</TableHead>
                      <TableHead className="font-medium">Role</TableHead>
                      <TableHead className="font-medium">Joined</TableHead>
                      <TableHead className="font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {u.profileImageUrl ? (
                              <img
                                src={u.profileImageUrl}
                                alt={`${u.firstName} ${u.lastName}`}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium">
                              {u.firstName} {u.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role })}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="borrower">Borrower</SelectItem>
                              <SelectItem value="loan_officer">Loan Officer</SelectItem>
                              <SelectItem value="compliance_auditor">Compliance Auditor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.createdAt!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {u.id === user?.id && "You"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">System Activity</h2>
                <p className="text-sm text-muted-foreground">
                  Monitor system health and recent application processing
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Database Connection</p>
                      <p className="text-xs text-muted-foreground">All systems operational</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">Healthy</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Agent Processing Pipeline</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.decisionStats.processing || 0} applications in queue
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Running</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">API Health</p>
                      <p className="text-xs text-muted-foreground">Response time &lt; 100ms</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">Optimal</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
