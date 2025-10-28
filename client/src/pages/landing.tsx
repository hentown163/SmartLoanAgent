import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Brain, FileCheck, Activity } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">SmartLoan Agent</h1>
          </div>
          <Button onClick={handleLogin} data-testid="button-login">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Autonomous Loan Underwriting
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Enterprise-grade AI-powered loan decisioning with transparent agent orchestration,
            RBAC, and comprehensive audit trails for financial compliance.
          </p>
          <Button size="lg" onClick={handleLogin} data-testid="button-get-started">
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-base">Multi-Agent AI</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-sm">
                Autonomous agents for document parsing, credit scoring, risk assessment, and decision explanation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-base">Explainable AI</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-sm">
                Every decision comes with human-readable explanations that comply with financial regulations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-base">Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-sm">
                Complete RBAC for borrowers, loan officers, compliance auditors, and administrators.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription className="text-sm">
                Comprehensive logging of every agent action, decision, and human override for compliance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h3 className="text-2xl font-semibold text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold mx-auto mb-4">
                1
              </div>
              <h4 className="font-medium mb-2">Submit Application</h4>
              <p className="text-sm text-muted-foreground">
                Borrowers provide employment and financial information through a simple form.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold mx-auto mb-4">
                2
              </div>
              <h4 className="font-medium mb-2">Agent Processing</h4>
              <p className="text-sm text-muted-foreground">
                Four specialized AI agents analyze credit, assess risk, and generate decisions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold mx-auto mb-4">
                3
              </div>
              <h4 className="font-medium mb-2">Automated Decision</h4>
              <p className="text-sm text-muted-foreground">
                Auto-approve low risk, auto-reject high risk, or escalate medium risk cases.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold mx-auto mb-4">
                4
              </div>
              <h4 className="font-medium mb-2">Full Transparency</h4>
              <p className="text-sm text-muted-foreground">
                View detailed explanations and complete audit trails for every decision.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 SmartLoan Agent. Enterprise-grade autonomous loan underwriting.
          </p>
        </div>
      </footer>
    </div>
  );
}
