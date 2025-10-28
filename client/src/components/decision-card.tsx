import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Shield } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface DecisionCardProps {
  decision: string;
  explanation: string;
  riskTier?: string | null;
  creditScore?: number | null;
  overriddenBy?: string | null;
  overrideReason?: string | null;
}

export function DecisionCard({
  decision,
  explanation,
  riskTier,
  creditScore,
  overriddenBy,
  overrideReason,
}: DecisionCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  const getDecisionConfig = () => {
    if (decision === "approved") {
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-900",
        title: "Application Approved",
      };
    } else if (decision === "rejected") {
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/20",
        borderColor: "border-red-200 dark:border-red-900",
        title: "Application Rejected",
      };
    } else {
      return {
        icon: AlertCircle,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        borderColor: "border-yellow-200 dark:border-yellow-900",
        title: "Under Review",
      };
    }
  };

  const getRiskBadge = () => {
    if (!riskTier) return null;

    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "default",
      medium: "secondary",
      high: "destructive",
    };

    return (
      <Badge variant={variants[riskTier]} data-testid={`badge-risk-${riskTier}`}>
        <Shield className="w-3 h-3 mr-1" />
        {riskTier.toUpperCase()} RISK
      </Badge>
    );
  };

  const config = getDecisionConfig();
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-background flex items-center justify-center ${config.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl" data-testid="text-decision-title">
                {config.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                AI-Powered Decision • Explainable AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRiskBadge()}
            {creditScore && (
              <Badge variant="outline" data-testid="badge-credit-score">
                Score: {creditScore}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* AI Explanation */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Decision Rationale</h4>
          <p className="text-sm leading-relaxed" data-testid="text-ai-explanation">
            {explanation}
          </p>
        </div>

        {/* Override Information */}
        {overriddenBy && overrideReason && (
          <div className="border-t border-border pt-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Human Override Applied</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  This decision was overridden by a loan officer.
                </p>
                <div className="bg-muted/50 rounded-md p-3 border border-border">
                  <p className="text-sm">{overrideReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Agent Reasoning */}
        <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-1 text-sm text-primary hover-elevate active-elevate-2 px-3 py-2 rounded-md"
              data-testid="button-view-agent-reasoning"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showReasoning ? 'rotate-180' : ''}`} />
              View Agent Chain
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="bg-muted/50 rounded-md p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-3">
                The decision was made through a multi-agent workflow involving document parsing,
                credit scoring, risk assessment, and explanation generation.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  <span className="font-mono">DOCUMENT_PARSER</span>
                  <span className="text-muted-foreground">→ Data validated</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  <span className="font-mono">CREDIT_SCORER</span>
                  <span className="text-muted-foreground">→ Score calculated</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  <span className="font-mono">RISK_ASSESSOR</span>
                  <span className="text-muted-foreground">→ Risk evaluated</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  <span className="font-mono">DECISION_EXPLAINER</span>
                  <span className="text-muted-foreground">→ Explanation generated</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
