import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LoanSimulationResult } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoanSimulatorProps {
  initialData?: {
    loanAmount?: string;
    annualIncome?: string;
    monthlyDebt?: string;
    employmentDuration?: string;
    employmentStatus?: string;
  };
}

export function LoanSimulator({ initialData }: LoanSimulatorProps) {
  const [loanAmount, setLoanAmount] = useState(initialData?.loanAmount || "");
  const [annualIncome, setAnnualIncome] = useState(initialData?.annualIncome || "");
  const [monthlyDebt, setMonthlyDebt] = useState(initialData?.monthlyDebt || "");
  const [employmentDuration, setEmploymentDuration] = useState(initialData?.employmentDuration || "");
  const [employmentStatus, setEmploymentStatus] = useState(initialData?.employmentStatus || "");

  const simulation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/simulate-loan", data);
      return response as unknown as LoanSimulationResult;
    },
  });

  const handleSimulate = () => {
    if (loanAmount && annualIncome && monthlyDebt && employmentDuration && employmentStatus) {
      simulation.mutate({
        loanAmount,
        annualIncome,
        monthlyDebt,
        employmentDuration,
        employmentStatus,
      });
    }
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case "low": return "text-green-600 dark:text-green-400 bg-green-600/10 border-green-600/20";
      case "medium": return "text-yellow-600 dark:text-yellow-400 bg-yellow-600/10 border-yellow-600/20";
      case "high": return "text-red-600 dark:text-red-400 bg-red-600/10 border-red-600/20";
      default: return "";
    }
  };

  const getApprovalColor = (chance: number) => {
    if (chance >= 80) return "text-green-600 dark:text-green-400";
    if (chance >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          What-If Simulator
        </CardTitle>
        <CardDescription>
          Test different loan parameters to see how they affect your approval chances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sim-loan-amount">Loan Amount</Label>
            <Input
              id="sim-loan-amount"
              type="number"
              placeholder="25000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              data-testid="input-sim-loan-amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-annual-income">Annual Income</Label>
            <Input
              id="sim-annual-income"
              type="number"
              placeholder="75000"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              data-testid="input-sim-annual-income"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-monthly-debt">Monthly Debt</Label>
            <Input
              id="sim-monthly-debt"
              type="number"
              placeholder="1200"
              value={monthlyDebt}
              onChange={(e) => setMonthlyDebt(e.target.value)}
              data-testid="input-sim-monthly-debt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-employment-duration">Employment Duration</Label>
            <Select value={employmentDuration} onValueChange={setEmploymentDuration}>
              <SelectTrigger id="sim-employment-duration" data-testid="select-sim-employment-duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1y">0-1 Year</SelectItem>
                <SelectItem value="1-2y">1-2 Years</SelectItem>
                <SelectItem value="2-3y">2-3 Years</SelectItem>
                <SelectItem value="3-5y">3-5 Years</SelectItem>
                <SelectItem value="5+y">5+ Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="sim-employment-status">Employment Status</Label>
            <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
              <SelectTrigger id="sim-employment-status" data-testid="select-sim-employment-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="self_employed">Self Employed</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={simulation.isPending || !loanAmount || !annualIncome || !monthlyDebt || !employmentDuration || !employmentStatus}
          className="w-full"
          data-testid="button-simulate"
        >
          {simulation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Run Simulation
            </>
          )}
        </Button>

        <AnimatePresence mode="wait">
          {simulation.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 pt-4 border-t"
            >
              <h4 className="text-sm font-semibold">Simulation Results</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${getRiskColor(simulation.data.riskTier)}`}>
                  <div className="text-xs text-muted-foreground mb-1">Risk Tier</div>
                  <div className="text-2xl font-bold capitalize" data-testid="text-sim-risk-tier">
                    {simulation.data.riskTier}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-primary/5">
                  <div className="text-xs text-muted-foreground mb-1">Approval Chance</div>
                  <div className={`text-2xl font-bold ${getApprovalColor(simulation.data.approvalChance)}`} data-testid="text-sim-approval-chance">
                    {simulation.data.approvalChance}%
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-primary/5">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Credit Score
                  </div>
                  <div className="text-2xl font-bold" data-testid="text-sim-credit-score">
                    {simulation.data.creditScore}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-primary/5">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Est. EMI
                  </div>
                  <div className="text-2xl font-bold" data-testid="text-sim-emi">
                    ${simulation.data.estimatedEmi.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs font-medium mb-2">DTI Ratio</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        simulation.data.dtiRatio < 0.35 ? "bg-green-600" : 
                        simulation.data.dtiRatio < 0.5 ? "bg-yellow-600" : "bg-red-600"
                      }`}
                      style={{ width: `${Math.min(simulation.data.dtiRatio * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium" data-testid="text-sim-dti">
                    {(simulation.data.dtiRatio * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-background/50">
                <p className="text-sm text-muted-foreground" data-testid="text-sim-recommendation">
                  {simulation.data.recommendation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
