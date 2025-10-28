import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import BorrowerDashboard from "@/pages/borrower-dashboard";
import LoanOfficerDashboard from "@/pages/loan-officer-dashboard";
import ComplianceAuditor from "@/pages/compliance-auditor";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Route based on user role */}
          {user?.role === "borrower" && <Route path="/" component={BorrowerDashboard} />}
          {user?.role === "loan_officer" && <Route path="/" component={LoanOfficerDashboard} />}
          {user?.role === "compliance_auditor" && <Route path="/" component={ComplianceAuditor} />}
          {user?.role === "admin" && <Route path="/" component={AdminDashboard} />}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
