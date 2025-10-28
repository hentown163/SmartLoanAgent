import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { User, LoanApplication } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, Shield, Users, FileText, Activity } from "lucide-react";

export default function AdminDashboard() {
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

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery<LoanApplication[]>({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (authLoading || usersLoading || appsLoading) {
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
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

        {/* User Management */}
        <Card className="p-6 mb-8">
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
                      <Badge variant="outline">
                        {u.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt!).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">System Health</h2>
            <p className="text-sm text-muted-foreground">
              AI agent system status and performance metrics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Document Parser Agent</span>
                <Badge variant="default" className="bg-green-600">
                  <div className="w-2 h-2 rounded-full bg-white mr-2" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Processing application data and validation
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Credit Scoring Agent</span>
                <Badge variant="default" className="bg-green-600">
                  <div className="w-2 h-2 rounded-full bg-white mr-2" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Analyzing credit history and calculating scores
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Risk Assessment Agent</span>
                <Badge variant="default" className="bg-green-600">
                  <div className="w-2 h-2 rounded-full bg-white mr-2" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Evaluating risk tiers and applying policies
              </p>
            </div>

            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Decision Explainer Agent</span>
                <Badge variant="default" className="bg-green-600">
                  <div className="w-2 h-2 rounded-full bg-white mr-2" />
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Generating compliant, readable explanations
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
