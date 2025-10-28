import { type AgentState } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { FileText, Calculator, Shield, MessageSquare, CheckCircle, Loader2, XCircle, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface AgentActivityTimelineProps {
  agentStates: AgentState[];
}

const agentConfig = {
  document_parser: {
    name: "Document Parser",
    icon: FileText,
    description: "Extracts and validates application data",
  },
  credit_scorer: {
    name: "Credit Scorer",
    icon: Calculator,
    description: "Analyzes credit history and scores",
  },
  risk_assessor: {
    name: "Risk Assessor",
    icon: Shield,
    description: "Evaluates risk tier and policies",
  },
  decision_explainer: {
    name: "Decision Explainer",
    icon: MessageSquare,
    description: "Generates human-readable explanation",
  },
};

export function AgentActivityTimeline({ agentStates }: AgentActivityTimelineProps) {
  const sortedStates = [...agentStates].sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedStates.map((state, index) => (
        <AgentActivityItem
          key={state.id}
          state={state}
          isLast={index === sortedStates.length - 1}
        />
      ))}
    </div>
  );
}

function AgentActivityItem({ state, isLast }: { state: AgentState; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = agentConfig[state.agentName as keyof typeof agentConfig];
  
  if (!config) return null;

  const Icon = config.icon;
  
  const getStatusIcon = () => {
    switch (state.agentStatus) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    };

    return (
      <Badge variant={variants[state.agentStatus]} className="text-xs gap-1">
        {getStatusIcon()}
        {state.agentStatus.charAt(0).toUpperCase() + state.agentStatus.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-5 top-12 w-px h-full bg-border" />
      )}

      <div className="flex gap-4">
        {/* Agent icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>

        {/* Agent details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wide font-medium">
                {state.agentName}
              </span>
              {getStatusBadge()}
            </div>
            {state.completedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(state.completedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2">{config.description}</p>

          {/* Collapsible output */}
          {state.output && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-1 text-xs text-primary hover-elevate active-elevate-2 px-2 py-1 rounded-md"
                  data-testid={`button-view-details-${state.agentName}`}
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  View Details
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted/50 rounded-md p-3 border border-border">
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify(state.output, null, 2)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
