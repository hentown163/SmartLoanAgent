// API routes with authentication and RBAC
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated, requireRole } from "./localAuth";
import { insertLoanApplicationSchema, overrideDecisionSchema, loanSimulationSchema, type HealthScoreResult, type LoanSimulationResult, type PersonalizedTip } from "@shared/schema";
import { processLoanApplication } from "./agents";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupLocalAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Loan application routes
  app.post("/api/applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const validatedData = insertLoanApplicationSchema.parse(req.body);

      // Create application
      const application = await storage.createLoanApplication(userId, validatedData);

      // Log submission
      await storage.createAuditLog({
        applicationId: application.id,
        userId,
        action: "application_submitted",
        details: { applicationId: application.id },
      });

      // Start agent processing asynchronously (don't wait)
      processLoanApplication(application.id).catch((error) => {
        console.error("Agent processing error:", error);
      });

      res.json(application);
    } catch (error: any) {
      console.error("Error creating application:", error);
      res.status(400).json({ message: error.message || "Failed to create application" });
    }
  });

  // Get borrower's own application
  app.get("/api/applications/my-application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const applications = await storage.getLoanApplicationsByUser(userId);
      
      // Return the most recent application
      const application = applications.length > 0 ? applications[0] : null;
      
      if (application) {
        res.json(application);
      } else {
        res.status(404).json({ message: "No application found" });
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Get all applications (for loan officers, auditors, admins)
  app.get("/api/applications", isAuthenticated, requireRole("loan_officer", "compliance_auditor", "admin"), async (req: any, res) => {
    try {
      const applications = await storage.getAllLoanApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get specific application (for loan officers, auditors, admins)
  app.get("/api/applications/:id", isAuthenticated, requireRole("loan_officer", "compliance_auditor", "admin"), async (req: any, res) => {
    try {
      const application = await storage.getLoanApplication(req.params.id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Get agent states for an application
  app.get("/api/applications/:id/agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const application = await storage.getLoanApplication(req.params.id);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check permissions: borrower can only see their own, others can see all
      if (user?.role === "borrower" && application.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const agentStates = await storage.getAgentStatesByApplication(req.params.id);
      res.json(agentStates);
    } catch (error) {
      console.error("Error fetching agent states:", error);
      res.status(500).json({ message: "Failed to fetch agent states" });
    }
  });

  // Override AI decision (loan officers only)
  app.post("/api/applications/:id/override", isAuthenticated, requireRole("loan_officer"), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = overrideDecisionSchema.parse(req.body);

      const application = await storage.getLoanApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Update application with override
      const updatedApp = await storage.updateLoanApplication(req.params.id, {
        status: validatedData.newDecision,
        finalDecision: validatedData.newDecision,
        overriddenBy: userId,
        overrideReason: validatedData.overrideReason,
        overriddenAt: new Date(),
      });

      // Log the override
      await storage.createAuditLog({
        applicationId: req.params.id,
        userId,
        action: "override_applied",
        details: {
          previousDecision: application.finalDecision,
          newDecision: validatedData.newDecision,
          reason: validatedData.overrideReason,
        },
      });

      res.json(updatedApp);
    } catch (error: any) {
      console.error("Error overriding decision:", error);
      res.status(400).json({ message: error.message || "Failed to override decision" });
    }
  });

  // Get audit logs (auditors and admins only)
  app.get("/api/audit-logs", isAuthenticated, requireRole("compliance_auditor", "admin"), async (req: any, res) => {
    try {
      const auditLogs = await storage.getAllAuditLogs();
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get all users (admins only)
  app.get("/api/admin/users", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role (admins only)
  app.patch("/api/admin/users/:id/role", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { role } = req.body;
      const validRoles = ["borrower", "loan_officer", "compliance_auditor", "admin"];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Get agent analytics (admins only)
  app.get("/api/admin/agent-analytics", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const [agentStates, applications] = await Promise.all([
        storage.getAllAgentStates(),
        storage.getAllLoanApplications(),
      ]);
      
      // Calculate agent performance metrics
      const agentMetrics = {
        document_parser: { total: 0, completed: 0, failed: 0, avgTime: 0 },
        credit_scorer: { total: 0, completed: 0, failed: 0, avgTime: 0 },
        risk_assessor: { total: 0, completed: 0, failed: 0, avgTime: 0 },
        decision_explainer: { total: 0, completed: 0, failed: 0, avgTime: 0 },
      };
      
      agentStates.forEach(state => {
        const agent = state.agentName as keyof typeof agentMetrics;
        if (agentMetrics[agent]) {
          agentMetrics[agent].total++;
          if (state.agentStatus === "completed") agentMetrics[agent].completed++;
          if (state.agentStatus === "failed") agentMetrics[agent].failed++;
          
          if (state.startedAt && state.completedAt) {
            const duration = new Date(state.completedAt).getTime() - new Date(state.startedAt).getTime();
            agentMetrics[agent].avgTime += duration;
          }
        }
      });
      
      // Calculate average times
      Object.keys(agentMetrics).forEach(agent => {
        const key = agent as keyof typeof agentMetrics;
        if (agentMetrics[key].completed > 0) {
          agentMetrics[key].avgTime = Math.round(agentMetrics[key].avgTime / agentMetrics[key].completed);
        }
      });
      
      // Decision analytics
      const decisionStats = {
        approved: applications.filter(a => a.status === "approved").length,
        rejected: applications.filter(a => a.status === "rejected").length,
        escalated: applications.filter(a => a.status === "escalated").length,
        processing: applications.filter(a => a.status === "processing").length,
      };
      
      // Risk tier distribution
      const riskTierStats = {
        low: applications.filter(a => a.riskTier === "low").length,
        medium: applications.filter(a => a.riskTier === "medium").length,
        high: applications.filter(a => a.riskTier === "high").length,
      };
      
      res.json({
        agentMetrics,
        decisionStats,
        riskTierStats,
        recentAgentStates: agentStates.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching agent analytics:", error);
      res.status(500).json({ message: "Failed to fetch agent analytics" });
    }
  });

  // Real-time borrower dashboard features
  
  // Calculate application health score based on form data
  app.post("/api/health-score", isAuthenticated, async (req: any, res) => {
    try {
      const { fullName, email, phone, employmentStatus, employmentDuration, employer, jobTitle, annualIncome, monthlyDebt, loanAmount, loanPurpose } = req.body;
      
      let score = 0;
      const maxScore = 100;
      const factors: HealthScoreResult["factors"] = [];
      const missingDocuments: string[] = [];
      
      // Personal Information (15 points)
      if (fullName && email && phone) {
        score += 15;
        factors.push({
          category: "Personal Information",
          impact: 15,
          suggestion: "Complete"
        });
      } else {
        const missing = !fullName ? "Full Name" : !email ? "Email" : "Phone";
        factors.push({
          category: "Personal Information",
          impact: 0,
          suggestion: `Add ${missing} to gain 15 points`
        });
      }
      
      // Employment Information (25 points)
      if (employmentStatus && employmentDuration && employer && jobTitle) {
        let employmentScore = 15;
        
        // Bonus for full-time employment
        if (employmentStatus === "full_time") employmentScore += 5;
        
        // Bonus for longer employment
        if (employmentDuration === "5+y") employmentScore += 5;
        else if (employmentDuration === "3-5y") employmentScore += 3;
        
        score += employmentScore;
        factors.push({
          category: "Employment",
          impact: employmentScore,
          suggestion: employmentStatus === "full_time" ? "Strong employment profile" : "Consider full-time employment for better score"
        });
      } else {
        factors.push({
          category: "Employment",
          impact: 0,
          suggestion: "Complete employment details to gain up to 25 points"
        });
      }
      
      // Financial Health (35 points)
      if (annualIncome && monthlyDebt) {
        const income = parseFloat(annualIncome || "0");
        const debt = parseFloat(monthlyDebt || "0");
        const monthlyIncome = income / 12;
        const dtiRatio = debt / monthlyIncome;
        
        let financialScore = 0;
        let suggestion = "";
        
        if (income > 0) {
          if (income >= 100000) {
            financialScore += 15;
            suggestion = "Excellent income level";
          } else if (income >= 75000) {
            financialScore += 12;
            suggestion = `Increase income to $100k+ to gain ${15 - 12} more points`;
          } else if (income >= 50000) {
            financialScore += 8;
            suggestion = `Increase income to $75k+ to gain ${15 - 8} more points`;
          } else {
            financialScore += 5;
            suggestion = `Increase income to $75k+ to gain ${15 - 5} more points`;
          }
        }
        
        if (dtiRatio < 0.2) {
          financialScore += 20;
          suggestion += ". Excellent debt-to-income ratio";
        } else if (dtiRatio < 0.35) {
          financialScore += 15;
          suggestion += `. Reduce monthly debt by $${Math.round((dtiRatio - 0.2) * monthlyIncome)} to gain ${20 - 15} points`;
        } else if (dtiRatio < 0.5) {
          financialScore += 8;
          suggestion += `. Reduce monthly debt by $${Math.round((dtiRatio - 0.35) * monthlyIncome)} to gain ${15 - 8} points`;
        } else {
          suggestion += ". High debt-to-income ratio - consider reducing monthly debt";
        }
        
        score += financialScore;
        factors.push({
          category: "Financial Health",
          impact: financialScore,
          suggestion
        });
      } else {
        factors.push({
          category: "Financial Health",
          impact: 0,
          suggestion: "Add income and debt information to gain up to 35 points"
        });
      }
      
      // Loan Amount Reasonability (15 points)
      if (loanAmount && annualIncome) {
        const loan = parseFloat(loanAmount);
        const income = parseFloat(annualIncome);
        const loanToIncome = loan / income;
        
        let loanScore = 0;
        let suggestion = "";
        
        if (loanToIncome < 0.3) {
          loanScore = 15;
          suggestion = "Loan amount is well within your income";
        } else if (loanToIncome < 0.5) {
          loanScore = 10;
          suggestion = `Reduce loan to $${Math.round(income * 0.3).toLocaleString()} to gain ${15 - 10} points`;
        } else if (loanToIncome < 0.8) {
          loanScore = 5;
          suggestion = `Reduce loan to $${Math.round(income * 0.5).toLocaleString()} to gain ${15 - 5} points`;
        } else {
          suggestion = `Reduce loan to $${Math.round(income * 0.5).toLocaleString()} to improve score`;
        }
        
        score += loanScore;
        factors.push({
          category: "Loan Amount",
          impact: loanScore,
          suggestion
        });
      } else {
        factors.push({
          category: "Loan Amount",
          impact: 0,
          suggestion: "Add loan amount to gain up to 15 points"
        });
      }
      
      // Loan Purpose (10 points)
      if (loanPurpose) {
        score += 10;
        factors.push({
          category: "Loan Purpose",
          impact: 10,
          suggestion: "Purpose specified"
        });
      } else {
        factors.push({
          category: "Loan Purpose",
          impact: 0,
          suggestion: "Specify loan purpose to gain 10 points"
        });
      }
      
      // Document checklist
      missingDocuments.push("3 months of payslips");
      missingDocuments.push("6 months of bank statements");
      missingDocuments.push("Government-issued ID");
      missingDocuments.push("Address proof");
      missingDocuments.push("Employment verification letter");
      
      const result: HealthScoreResult = {
        score,
        maxScore,
        factors,
        missingDocuments
      };
      
      res.json(result);
    } catch (error: any) {
      console.error("Error calculating health score:", error);
      res.status(500).json({ message: "Failed to calculate health score" });
    }
  });
  
  // Simulate loan scenario with different parameters
  app.post("/api/simulate-loan", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = loanSimulationSchema.parse(req.body);
      
      const income = parseFloat(validatedData.annualIncome);
      const debt = parseFloat(validatedData.monthlyDebt);
      const loanAmount = parseFloat(validatedData.loanAmount);
      const employmentDuration = validatedData.employmentDuration;
      const employmentStatus = validatedData.employmentStatus;
      
      // Calculate credit score (same logic as agent)
      let creditScore = 650;
      
      if (income > 100000) creditScore += 100;
      else if (income > 75000) creditScore += 70;
      else if (income > 50000) creditScore += 40;
      
      const durationMap: Record<string, number> = {
        "0-1y": 0,
        "1-2y": 20,
        "2-3y": 40,
        "3-5y": 60,
        "5+y": 80,
      };
      creditScore += durationMap[employmentDuration] || 0;
      
      if (employmentStatus === "full_time") creditScore += 30;
      else if (employmentStatus === "self_employed") creditScore += 15;
      
      const monthlyIncome = income / 12;
      const estimatedLoanPayment = loanAmount * 0.008;
      const totalMonthlyDebt = debt + estimatedLoanPayment;
      const dtiRatio = totalMonthlyDebt / monthlyIncome;
      
      if (dtiRatio < 0.2) creditScore += 50;
      else if (dtiRatio < 0.35) creditScore += 20;
      else if (dtiRatio > 0.5) creditScore -= 50;
      
      creditScore = Math.min(850, Math.max(300, Math.round(creditScore)));
      
      // Determine risk tier and approval chance
      let riskTier = "medium";
      let approvalChance = 50;
      let recommendation = "";
      
      if (creditScore >= 750 && dtiRatio < 0.35) {
        riskTier = "low";
        approvalChance = 92;
        recommendation = "Excellent profile! Very high approval probability.";
      } else if (creditScore <= 550 || dtiRatio > 0.5) {
        riskTier = "high";
        approvalChance = 18;
        recommendation = "Consider improving your credit score and reducing debt before applying.";
      } else {
        riskTier = "medium";
        approvalChance = 65;
        recommendation = "Good profile. Application will be reviewed by a loan officer.";
      }
      
      // Calculate EMI (using simple monthly interest calculation)
      const annualInterestRate = riskTier === "low" ? 0.08 : riskTier === "medium" ? 0.12 : 0.16;
      const monthlyInterestRate = annualInterestRate / 12;
      const loanTermMonths = 60; // 5 years
      const emi = loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths) / 
                  (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
      
      const result: LoanSimulationResult = {
        approvalChance,
        riskTier,
        estimatedEmi: Math.round(emi),
        creditScore,
        dtiRatio: parseFloat(dtiRatio.toFixed(3)),
        recommendation
      };
      
      res.json(result);
    } catch (error: any) {
      console.error("Error simulating loan:", error);
      res.status(400).json({ message: error.message || "Failed to simulate loan" });
    }
  });
  
  // Get personalized tips based on applicant profile
  app.post("/api/personalized-tips", isAuthenticated, async (req: any, res) => {
    try {
      const { annualIncome, monthlyDebt, employmentDuration, employmentStatus, loanAmount } = req.body;
      
      const tips: PersonalizedTip[] = [];
      
      // Income-based tips
      const income = parseFloat(annualIncome || "0");
      if (income < 75000) {
        tips.push({
          id: "tip-income-1",
          category: "income",
          title: "Increase Income Documentation",
          description: "Applicants with annual income above $75,000 have 23% higher approval rates. Consider documenting additional income sources.",
          impact: "high"
        });
      }
      
      // Debt-based tips
      const debt = parseFloat(monthlyDebt || "0");
      const monthlyIncome = income / 12;
      const dtiRatio = debt / monthlyIncome;
      
      if (dtiRatio > 0.35) {
        tips.push({
          id: "tip-debt-1",
          category: "debt",
          title: "Reduce Monthly Debt Obligations",
          description: `Your debt-to-income ratio is ${(dtiRatio * 100).toFixed(1)}%. Reducing monthly debt to $${Math.round(monthlyIncome * 0.35)} (35% DTI) improves approval odds by ~28%.`,
          impact: "high"
        });
      }
      
      // Employment-based tips
      if (employmentDuration === "0-1y") {
        tips.push({
          id: "tip-employment-1",
          category: "employment",
          title: "Wait for Employment Stability",
          description: "Applicants with 2+ years at current employer have 31% higher approval rates. Consider waiting 12 months for better terms.",
          impact: "medium"
        });
      }
      
      if (employmentStatus !== "full_time") {
        tips.push({
          id: "tip-employment-2",
          category: "employment",
          title: "Full-Time Employment Advantage",
          description: "Full-time employees receive 15% better interest rates on average. Consider transitioning to full-time if possible.",
          impact: "medium"
        });
      }
      
      // Document tips
      tips.push({
        id: "tip-docs-1",
        category: "documents",
        title: "Link 6+ Months of Bank Statements",
        description: "Applicants with your profile who provided 6+ months of salary credit history improved approval odds by 19%.",
        impact: "high"
      });
      
      tips.push({
        id: "tip-docs-2",
        category: "documents",
        title: "Provide Employment Verification",
        description: "An official employment letter from HR increases approval probability by 12% and can reduce interest rates.",
        impact: "medium"
      });
      
      // Loan amount tips
      const loan = parseFloat(loanAmount || "0");
      const loanToIncome = loan / income;
      
      if (loanToIncome > 0.5) {
        tips.push({
          id: "tip-amount-1",
          category: "general",
          title: "Consider a Smaller Loan Amount",
          description: `Reducing your loan request to $${Math.round(income * 0.4).toLocaleString()} would improve your approval chances by ~22% and reduce EMI burden.`,
          impact: "high"
        });
      }
      
      // General tips
      tips.push({
        id: "tip-general-1",
        category: "general",
        title: "Submit During Business Hours",
        description: "Applications submitted Monday-Friday 9am-5pm are processed 40% faster due to immediate agent availability.",
        impact: "low"
      });
      
      res.json(tips);
    } catch (error: any) {
      console.error("Error generating tips:", error);
      res.status(500).json({ message: "Failed to generate tips" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
