import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLoanApplicationSchema, type InsertLoanApplication } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { HealthScoreCard } from "./health-score-card";

interface LoanApplicationFormProps {
  onSuccess?: () => void;
}

export function LoanApplicationForm({ onSuccess }: LoanApplicationFormProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertLoanApplication>({
    resolver: zodResolver(insertLoanApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      employmentStatus: "",
      employmentDuration: "",
      employer: "",
      jobTitle: "",
      annualIncome: "",
      monthlyDebt: "",
      loanAmount: "",
      loanPurpose: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertLoanApplication) => {
      return await apiRequest("POST", "/api/applications", data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your loan application is being processed by our AI agents.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLoanApplication) => {
    mutation.mutate(data);
  };

  const formData = form.watch();

  return (
    <div className="space-y-8">
      <HealthScoreCard formData={formData} />
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              data-testid="input-full-name"
              {...form.register("fullName")}
              placeholder="John Doe"
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              data-testid="input-email"
              {...form.register("email")}
              placeholder="john@example.com"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              data-testid="input-phone"
              {...form.register("phone")}
              placeholder="+1 (555) 123-4567"
            />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div>
        <h3 className="text-lg font-medium mb-4">Employment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Employment Status *</Label>
            <Select
              value={form.watch("employmentStatus")}
              onValueChange={(value) => form.setValue("employmentStatus", value)}
            >
              <SelectTrigger id="employmentStatus" data-testid="select-employment-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="self_employed">Self Employed</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.employmentStatus && (
              <p className="text-xs text-destructive">{form.formState.errors.employmentStatus.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employmentDuration">Employment Duration *</Label>
            <Select
              value={form.watch("employmentDuration")}
              onValueChange={(value) => form.setValue("employmentDuration", value)}
            >
              <SelectTrigger id="employmentDuration" data-testid="select-employment-duration">
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
            {form.formState.errors.employmentDuration && (
              <p className="text-xs text-destructive">{form.formState.errors.employmentDuration.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer">Employer *</Label>
            <Input
              id="employer"
              data-testid="input-employer"
              {...form.register("employer")}
              placeholder="ABC Corporation"
            />
            {form.formState.errors.employer && (
              <p className="text-xs text-destructive">{form.formState.errors.employer.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              data-testid="input-job-title"
              {...form.register("jobTitle")}
              placeholder="Software Engineer"
            />
            {form.formState.errors.jobTitle && (
              <p className="text-xs text-destructive">{form.formState.errors.jobTitle.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div>
        <h3 className="text-lg font-medium mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="annualIncome">Annual Income *</Label>
            <Input
              id="annualIncome"
              type="number"
              data-testid="input-annual-income"
              {...form.register("annualIncome")}
              placeholder="75000"
            />
            {form.formState.errors.annualIncome && (
              <p className="text-xs text-destructive">{form.formState.errors.annualIncome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyDebt">Monthly Debt Payments *</Label>
            <Input
              id="monthlyDebt"
              type="number"
              data-testid="input-monthly-debt"
              {...form.register("monthlyDebt")}
              placeholder="1200"
            />
            {form.formState.errors.monthlyDebt && (
              <p className="text-xs text-destructive">{form.formState.errors.monthlyDebt.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanAmount">Loan Amount Requested *</Label>
            <Input
              id="loanAmount"
              type="number"
              data-testid="input-loan-amount"
              {...form.register("loanAmount")}
              placeholder="25000"
            />
            {form.formState.errors.loanAmount && (
              <p className="text-xs text-destructive">{form.formState.errors.loanAmount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanPurpose">Loan Purpose *</Label>
            <Select
              value={form.watch("loanPurpose")}
              onValueChange={(value) => form.setValue("loanPurpose", value)}
            >
              <SelectTrigger id="loanPurpose" data-testid="select-loan-purpose">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                <SelectItem value="home_improvement">Home Improvement</SelectItem>
                <SelectItem value="major_purchase">Major Purchase</SelectItem>
                <SelectItem value="medical">Medical Expenses</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.loanPurpose && (
              <p className="text-xs text-destructive">{form.formState.errors.loanPurpose.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-submit-application"
          className="min-w-32"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
      </form>
    </div>
  );
}
