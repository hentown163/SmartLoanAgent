import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with roles (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 50 }).notNull().default("borrower"), // borrower, loan_officer, compliance_auditor, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Loan applications table
export const loanApplications = pgTable("loan_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Applicant information
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  
  // Employment information
  employmentStatus: text("employment_status").notNull(),
  employmentDuration: text("employment_duration").notNull(),
  employer: text("employer").notNull(),
  jobTitle: text("job_title").notNull(),
  
  // Financial information
  annualIncome: decimal("annual_income", { precision: 12, scale: 2 }).notNull(),
  monthlyDebt: decimal("monthly_debt", { precision: 12, scale: 2 }).notNull(),
  loanAmount: decimal("loan_amount", { precision: 12, scale: 2 }).notNull(),
  loanPurpose: text("loan_purpose").notNull(),
  
  // Credit information
  creditScore: integer("credit_score"),
  
  // Application status
  status: varchar("status", { length: 50 }).notNull().default("processing"), // processing, approved, rejected, escalated
  riskTier: varchar("risk_tier", { length: 50 }), // low, medium, high
  
  // Decision information
  finalDecision: text("final_decision"),
  aiExplanation: text("ai_explanation"),
  
  // Override information (for loan officers)
  overriddenBy: varchar("overridden_by").references(() => users.id),
  overrideReason: text("override_reason"),
  overriddenAt: timestamp("overridden_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loanApplicationsRelations = relations(loanApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [loanApplications.userId],
    references: [users.id],
  }),
  overriddenByUser: one(users, {
    fields: [loanApplications.overriddenBy],
    references: [users.id],
  }),
  agentStates: many(agentStates),
  auditLogs: many(auditLogs),
}));

// Agent states table - tracks each agent's processing state
export const agentStates = pgTable("agent_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => loanApplications.id),
  
  agentName: varchar("agent_name", { length: 100 }).notNull(), // document_parser, credit_scorer, risk_assessor, decision_explainer
  agentStatus: varchar("agent_status", { length: 50 }).notNull().default("pending"), // pending, processing, completed, failed
  
  // Agent input and output
  input: jsonb("input"),
  output: jsonb("output"),
  
  // Agent metadata
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentStatesRelations = relations(agentStates, ({ one }) => ({
  application: one(loanApplications, {
    fields: [agentStates.applicationId],
    references: [loanApplications.id],
  }),
}));

// Audit logs table - comprehensive audit trail
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(() => loanApplications.id),
  userId: varchar("user_id").references(() => users.id),
  
  action: varchar("action", { length: 100 }).notNull(), // application_submitted, agent_started, agent_completed, decision_made, override_applied
  agentName: varchar("agent_name", { length: 100 }),
  
  details: jsonb("details"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  application: one(loanApplications, {
    fields: [auditLogs.applicationId],
    references: [loanApplications.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertLoanApplicationSchema = createInsertSchema(loanApplications).omit({
  id: true,
  userId: true,
  creditScore: true,
  status: true,
  riskTier: true,
  finalDecision: true,
  aiExplanation: true,
  overriddenBy: true,
  overrideReason: true,
  overriddenAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  annualIncome: z.string().min(1, "Annual income is required"),
  monthlyDebt: z.string().min(1, "Monthly debt is required"),
  loanAmount: z.string().min(1, "Loan amount is required"),
});

export const overrideDecisionSchema = z.object({
  overrideReason: z.string().min(10, "Override reason must be at least 10 characters"),
  newDecision: z.enum(["approved", "rejected"]),
});

export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type LoanApplication = typeof loanApplications.$inferSelect;
export type AgentState = typeof agentStates.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type OverrideDecision = z.infer<typeof overrideDecisionSchema>;
