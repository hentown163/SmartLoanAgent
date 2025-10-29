import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PersonalizedTip } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, FileText, Briefcase, DollarSign, Info } from "lucide-react";
import { motion } from "framer-motion";

interface PersonalizedTipsProps {
  formData: {
    annualIncome?: string;
    monthlyDebt?: string;
    employmentDuration?: string;
    employmentStatus?: string;
    loanAmount?: string;
  };
}

export function PersonalizedTips({ formData }: PersonalizedTipsProps) {
  const { data: tips } = useQuery<PersonalizedTip[]>({
    queryKey: ["/api/personalized-tips", formData],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/personalized-tips", formData);
      return response as unknown as PersonalizedTip[];
    },
    enabled: Boolean(formData.annualIncome || formData.monthlyDebt || formData.employmentDuration),
  });

  if (!tips || tips.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "income": return TrendingUp;
      case "debt": return DollarSign;
      case "documents": return FileText;
      case "employment": return Briefcase;
      default: return Info;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-600/10 text-red-600 dark:text-red-400 border-red-600/20";
      case "medium": return "bg-yellow-600/10 text-yellow-600 dark:text-yellow-400 border-yellow-600/20";
      case "low": return "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20";
      default: return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Personalized Tips
        </CardTitle>
        <CardDescription>
          AI-powered suggestions to improve your approval chances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tips.map((tip, index) => {
            const Icon = getCategoryIcon(tip.category);
            return (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border bg-background/50 space-y-2"
                data-testid={`tip-${tip.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold">{tip.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getImpactColor(tip.impact)}`}
                        data-testid={`badge-impact-${tip.impact}`}
                      >
                        {tip.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
