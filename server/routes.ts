// API routes with authentication and RBAC
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated, requireRole } from "./localAuth";
import { insertLoanApplicationSchema, overrideDecisionSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
