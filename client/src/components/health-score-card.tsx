import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { HealthScoreResult } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HealthScoreCardProps {
  formData: {
    fullName?: string;
    email?: string;
    phone?: string;
    employmentStatus?: string;
    employmentDuration?: string;
    employer?: string;
    jobTitle?: string;
    annualIncome?: string;
    monthlyDebt?: string;
    loanAmount?: string;
    loanPurpose?: string;
  };
}

export function HealthScoreCard({ formData }: HealthScoreCardProps) {
  const { data: healthScore, isLoading } = useQuery<HealthScoreResult>({
    queryKey: ["/api/health-score", formData],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/health-score", formData);
      return response as unknown as HealthScoreResult;
    },
    enabled: true,
    refetchInterval: false,
  });

  if (isLoading || !healthScore) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Application Health Score</CardTitle>
              <CardDescription>Calculating your loan readiness...</CardDescription>
            </div>
            <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-health-score" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  const scorePercentage = (healthScore.score / healthScore.maxScore) * 100;
  const scoreColor = scorePercentage >= 80 ? "text-green-600 dark:text-green-400" : 
                     scorePercentage >= 60 ? "text-yellow-600 dark:text-yellow-400" : 
                     "text-red-600 dark:text-red-400";
  
  const progressColor = scorePercentage >= 80 ? "bg-green-600" : 
                        scorePercentage >= 60 ? "bg-yellow-600" : 
                        "bg-red-600";

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Application Health Score
            </CardTitle>
            <CardDescription>Your current loan readiness score</CardDescription>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={`text-4xl font-bold ${scoreColor}`}
            data-testid="text-health-score"
          >
            {healthScore.score}/{healthScore.maxScore}
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(scorePercentage)}%</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className={`h-full ${progressColor} transition-all`} 
              style={{ width: `${scorePercentage}%` }}
              data-testid="progress-health-score"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Score Breakdown
          </h4>
          <AnimatePresence mode="popLayout">
            {healthScore.factors.map((factor, index) => (
              <motion.div
                key={factor.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border"
                data-testid={`factor-${factor.category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {factor.impact > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.category}</span>
                    <Badge variant={factor.impact > 0 ? "default" : "secondary"} className="text-xs">
                      +{factor.impact} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{factor.suggestion}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {healthScore.missingDocuments.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Missing Documents
            </h4>
            <div className="grid gap-2">
              {healthScore.missingDocuments.map((doc, index) => (
                <motion.div
                  key={doc}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-testid={`missing-doc-${index}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
                  {doc}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
