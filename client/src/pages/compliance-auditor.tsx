import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { AuditLog, LoanApplication } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Download, Loader2, Shield, FileText } from "lucide-react";

export default function ComplianceAuditor() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

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

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    enabled: isAuthenticated,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery<LoanApplication[]>({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleExport = () => {
    const csvContent = generateCSV(auditLogs);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "Audit trail has been downloaded as CSV.",
    });
  };

  const generateCSV = (logs: AuditLog[]) => {
    const headers = ['Timestamp', 'Application ID', 'User ID', 'Action', 'Agent', 'Details'];
    const rows = logs.map(log => [
      new Date(log.createdAt!).toISOString(),
      log.applicationId || '',
      log.userId || '',
      log.action,
      log.agentName || '',
      JSON.stringify(log.details || {}),
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  };

  if (authLoading || logsLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalDecisions = applications.filter(a => a.finalDecision).length;
  const overrides = applications.filter(a => a.overriddenBy).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Compliance Auditor</h1>
              <p className="text-xs text-muted-foreground">
                {user?.firstName} {user?.lastName} • {user?.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-audit">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Audit Events</p>
                <p className="text-3xl font-bold" data-testid="stat-audit-events">
                  {auditLogs.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
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
                <p className="text-sm text-muted-foreground mb-1">AI Decisions</p>
                <p className="text-3xl font-bold" data-testid="stat-decisions">
                  {totalDecisions}
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Human Overrides</p>
                <p className="text-3xl font-bold" data-testid="stat-overrides">
                  {overrides}
                </p>
              </div>
              <Shield className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
        </div>

        {/* Audit Trail */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl">Complete Audit Trail</CardTitle>
            <CardDescription>
              Comprehensive log of all agent actions, decisions, and human interventions
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No audit events recorded yet</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Timestamp</TableHead>
                      <TableHead className="font-medium">Application</TableHead>
                      <TableHead className="font-medium">Action</TableHead>
                      <TableHead className="font-medium">Agent</TableHead>
                      <TableHead className="font-medium">User</TableHead>
                      <TableHead className="font-medium">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                        <TableCell className="font-mono text-xs">
                          {new Date(log.createdAt!).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.applicationId ? log.applicationId.slice(0, 8) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.agentName || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.userId ? log.userId.slice(0, 8) : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <details className="cursor-pointer">
                            <summary className="text-xs text-primary hover-elevate active-elevate-2 px-2 py-1 rounded-md inline-block">
                              View
                            </summary>
                            <pre className="mt-2 text-xs bg-muted/50 p-2 rounded-md overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
