// Storage implementation with PostgreSQL (from javascript_database and javascript_log_in_with_replit blueprints)
import {
  users,
  loanApplications,
  agentStates,
  auditLogs,
  type User,
  type UpsertUser,
  type LoanApplication,
  type InsertLoanApplication,
  type AgentState,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Loan application operations
  createLoanApplication(userId: string, data: InsertLoanApplication): Promise<LoanApplication>;
  getLoanApplication(id: string): Promise<LoanApplication | undefined>;
  getLoanApplicationsByUser(userId: string): Promise<LoanApplication[]>;
  getAllLoanApplications(): Promise<LoanApplication[]>;
  updateLoanApplication(id: string, data: Partial<LoanApplication>): Promise<LoanApplication>;
  
  // Agent state operations
  createAgentState(applicationId: string, agentName: string, input: any): Promise<AgentState>;
  updateAgentState(id: string, data: Partial<AgentState>): Promise<AgentState>;
  getAgentStatesByApplication(applicationId: string): Promise<AgentState[]>;
  
  // Audit log operations
  createAuditLog(data: {
    applicationId?: string;
    userId?: string;
    action: string;
    agentName?: string;
    details?: any;
  }): Promise<AuditLog>;
  getAllAuditLogs(): Promise<AuditLog[]>;
  
  // User management operations
  updateUserRole(userId: string, newRole: string): Promise<User>;
  
  // Agent analytics operations
  getAllAgentStates(): Promise<AgentState[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  
  // Loan application operations
  async createLoanApplication(userId: string, data: InsertLoanApplication): Promise<LoanApplication> {
    const [application] = await db
      .insert(loanApplications)
      .values({
        ...data,
        userId,
        status: "processing",
      })
      .returning();
    return application;
  }

  async getLoanApplication(id: string): Promise<LoanApplication | undefined> {
    const [application] = await db.select().from(loanApplications).where(eq(loanApplications.id, id));
    return application;
  }

  async getLoanApplicationsByUser(userId: string): Promise<LoanApplication[]> {
    return await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.userId, userId))
      .orderBy(desc(loanApplications.createdAt));
  }

  async getAllLoanApplications(): Promise<LoanApplication[]> {
    return await db.select().from(loanApplications).orderBy(desc(loanApplications.createdAt));
  }

  async updateLoanApplication(id: string, data: Partial<LoanApplication>): Promise<LoanApplication> {
    const [application] = await db
      .update(loanApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(loanApplications.id, id))
      .returning();
    return application;
  }
  
  // Agent state operations
  async createAgentState(applicationId: string, agentName: string, input: any): Promise<AgentState> {
    const [agentState] = await db
      .insert(agentStates)
      .values({
        applicationId,
        agentName,
        agentStatus: "pending",
        input,
        startedAt: new Date(),
      })
      .returning();
    return agentState;
  }

  async updateAgentState(id: string, data: Partial<AgentState>): Promise<AgentState> {
    const [agentState] = await db
      .update(agentStates)
      .set(data)
      .where(eq(agentStates.id, id))
      .returning();
    return agentState;
  }

  async getAgentStatesByApplication(applicationId: string): Promise<AgentState[]> {
    return await db
      .select()
      .from(agentStates)
      .where(eq(agentStates.applicationId, applicationId))
      .orderBy(agentStates.createdAt);
  }
  
  // Audit log operations
  async createAuditLog(data: {
    applicationId?: string;
    userId?: string;
    action: string;
    agentName?: string;
    details?: any;
  }): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(data)
      .returning();
    return auditLog;
  }

  async getAllAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }
  
  // User management operations
  async updateUserRole(userId: string, newRole: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  // Agent analytics operations
  async getAllAgentStates(): Promise<AgentState[]> {
    return await db.select().from(agentStates).orderBy(desc(agentStates.createdAt));
  }
}

export const storage = new DatabaseStorage();
