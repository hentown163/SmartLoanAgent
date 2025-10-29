import type { AgentState } from "@shared/schema";
import { motion } from "framer-motion";
import { FileText, Calculator, Shield, MessageSquare, CheckCircle, Clock, Loader2 } from "lucide-react";

interface AnimatedAgentProgressProps {
  agentStates: AgentState[];
}

const agentConfig = {
  document_parser: {
    icon: FileText,
    label: "Parsing",
    emoji: "📄",
    color: "text-blue-600 dark:text-blue-400 bg-blue-600/10",
  },
  credit_scorer: {
    icon: Calculator,
    label: "Scoring",
    emoji: "💳",
    color: "text-green-600 dark:text-green-400 bg-green-600/10",
  },
  risk_assessor: {
    icon: Shield,
    label: "Risk Check",
    emoji: "⚖️",
    color: "text-orange-600 dark:text-orange-400 bg-orange-600/10",
  },
  decision_explainer: {
    icon: MessageSquare,
    label: "Decision",
    emoji: "✅",
    color: "text-purple-600 dark:text-purple-400 bg-purple-600/10",
  },
};

export function AnimatedAgentProgress({ agentStates }: AnimatedAgentProgressProps) {
  const agents = ["document_parser", "credit_scorer", "risk_assessor", "decision_explainer"];
  
  const getAgentState = (agentName: string) => {
    return agentStates.find(state => state.agentName === agentName);
  };

  const getAgentStatus = (agentName: string) => {
    const state = getAgentState(agentName);
    if (!state) return "pending";
    return state.agentStatus;
  };

  const isActive = (agentName: string) => {
    return getAgentStatus(agentName) === "processing";
  };

  const isCompleted = (agentName: string) => {
    return getAgentStatus(agentName) === "completed";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {agents.map((agentName, index) => {
          const config = agentConfig[agentName as keyof typeof agentConfig];
          const Icon = config.icon;
          const status = getAgentStatus(agentName);
          const active = isActive(agentName);
          const completed = isCompleted(agentName);

          return (
            <div key={agentName} className="flex-1 relative">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: active || completed ? 1 : 0.9,
                    opacity: completed || active || status === "pending" ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center ${config.color} border-2 ${
                    completed ? "border-green-600" : active ? "border-primary" : "border-muted"
                  }`}
                  data-testid={`agent-icon-${agentName}`}
                >
                  {completed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : active ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                  
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                <div className="text-center">
                  <div className="text-xs font-medium">{config.emoji} {config.label}</div>
                  {active && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-primary font-medium"
                    >
                      Active
                    </motion.div>
                  )}
                  {completed && (
                    <div className="text-xs text-green-600 dark:text-green-400">Done</div>
                  )}
                  {status === "pending" && (
                    <div className="text-xs text-muted-foreground">Pending</div>
                  )}
                </div>
              </div>

              {index < agents.length - 1 && (
                <div className="absolute top-8 left-1/2 w-full h-0.5 bg-muted">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: completed ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {agentStates
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          })
          .slice(-4)
          .map((state, index) => {
            const config = agentConfig[state.agentName as keyof typeof agentConfig];
            const Icon = config?.icon || Clock;
            
            return (
              <motion.div
                key={state.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 p-2 rounded bg-muted/50"
                data-testid={`agent-state-${state.agentName}`}
              >
                {state.agentStatus === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : state.agentStatus === "processing" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {config?.label || state.agentName}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {state.agentStatus}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
