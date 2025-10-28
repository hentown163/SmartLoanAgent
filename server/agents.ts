// Multi-agent orchestration system for loan underwriting
import OpenAI from "openai";
import { storage } from "./storage";
import type { LoanApplication } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AgentOrchestrationResult {
  finalDecision: string;
  aiExplanation: string;
  riskTier: string;
  creditScore: number;
}

// Document Parser Agent - validates and extracts structured data
async function documentParserAgent(applicationId: string, application: LoanApplication) {
  const agentState = await storage.createAgentState(applicationId, "document_parser", {
    applicationData: application,
  });

  await storage.updateAgentState(agentState.id, {
    agentStatus: "processing",
  });

  // Simulate document parsing and validation
  const output = {
    validated: true,
    extractedData: {
      fullName: application.fullName,
      income: parseFloat(application.annualIncome),
      monthlyDebt: parseFloat(application.monthlyDebt),
      loanAmount: parseFloat(application.loanAmount),
      employmentDuration: application.employmentDuration,
      employmentStatus: application.employmentStatus,
    },
  };

  await storage.updateAgentState(agentState.id, {
    agentStatus: "completed",
    output,
    completedAt: new Date(),
  });

  await storage.createAuditLog({
    applicationId,
    action: "agent_completed",
    agentName: "document_parser",
    details: { output },
  });

  return output.extractedData;
}

// Credit Scoring Agent - calculates credit score using hybrid logic
async function creditScoringAgent(
  applicationId: string,
  extractedData: any
) {
  const agentState = await storage.createAgentState(applicationId, "credit_scorer", {
    extractedData,
  });

  await storage.updateAgentState(agentState.id, {
    agentStatus: "processing",
  });

  // Simulate credit scoring with rule-based logic
  let baseScore = 650; // Base credit score

  // Income factor
  if (extractedData.income > 100000) baseScore += 100;
  else if (extractedData.income > 75000) baseScore += 70;
  else if (extractedData.income > 50000) baseScore += 40;

  // Employment duration factor
  const durationMap: Record<string, number> = {
    "0-1y": 0,
    "1-2y": 20,
    "2-3y": 40,
    "3-5y": 60,
    "5+y": 80,
  };
  baseScore += durationMap[extractedData.employmentDuration] || 0;

  // Employment status factor
  if (extractedData.employmentStatus === "full_time") baseScore += 30;
  else if (extractedData.employmentStatus === "self_employed") baseScore += 15;

  // Calculate DTI ratio
  const monthlyIncome = extractedData.income / 12;
  const estimatedLoanPayment = extractedData.loanAmount * 0.008; // Rough estimate
  const totalMonthlyDebt = extractedData.monthlyDebt + estimatedLoanPayment;
  const dtiRatio = totalMonthlyDebt / monthlyIncome;

  // DTI impact on score
  if (dtiRatio < 0.2) baseScore += 50;
  else if (dtiRatio < 0.35) baseScore += 20;
  else if (dtiRatio > 0.5) baseScore -= 50;

  // Cap the score
  const creditScore = Math.min(850, Math.max(300, Math.round(baseScore)));

  const output = {
    creditScore,
    dtiRatio: parseFloat(dtiRatio.toFixed(3)),
    factors: {
      income: extractedData.income,
      employmentDuration: extractedData.employmentDuration,
      employmentStatus: extractedData.employmentStatus,
    },
  };

  await storage.updateAgentState(agentState.id, {
    agentStatus: "completed",
    output,
    completedAt: new Date(),
  });

  await storage.createAuditLog({
    applicationId,
    action: "agent_completed",
    agentName: "credit_scorer",
    details: { output },
  });

  return output;
}

// Risk Assessment Agent - evaluates risk tier and applies policies
async function riskAssessmentAgent(
  applicationId: string,
  creditData: any
) {
  const agentState = await storage.createAgentState(applicationId, "risk_assessor", {
    creditData,
  });

  await storage.updateAgentState(agentState.id, {
    agentStatus: "processing",
  });

  let riskTier = "medium";
  let decision = "escalated";

  // Three-tier risk assessment
  // High score, low DTI = Low risk (auto-approve)
  if (creditData.creditScore >= 750 && creditData.dtiRatio < 0.35) {
    riskTier = "low";
    decision = "approved";
  }
  // Low score or high DTI = High risk (auto-reject)
  else if (creditData.creditScore <= 550 || creditData.dtiRatio > 0.5) {
    riskTier = "high";
    decision = "rejected";
  }
  // Medium risk = Escalate to loan officer
  else {
    riskTier = "medium";
    decision = "escalated";
  }

  const output = {
    riskTier,
    decision,
    reasoning: {
      creditScore: creditData.creditScore,
      dtiRatio: creditData.dtiRatio,
      policyApplied: `${decision === "approved" ? "Auto-approve" : decision === "rejected" ? "Auto-reject" : "Escalate"} policy`,
    },
  };

  await storage.updateAgentState(agentState.id, {
    agentStatus: "completed",
    output,
    completedAt: new Date(),
  });

  await storage.createAuditLog({
    applicationId,
    action: "agent_completed",
    agentName: "risk_assessor",
    details: { output },
  });

  return output;
}

// Decision Explanation Agent - generates human-readable explanation using GPT-5
async function decisionExplainerAgent(
  applicationId: string,
  application: LoanApplication,
  creditData: any,
  riskAssessment: any
) {
  const agentState = await storage.createAgentState(applicationId, "decision_explainer", {
    application,
    creditData,
    riskAssessment,
  });

  await storage.updateAgentState(agentState.id, {
    agentStatus: "processing",
  });

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const prompt = `You are a loan underwriting AI system that generates compliant, human-readable explanations for loan decisions.

Application Details:
- Applicant: ${application.fullName}
- Loan Amount: $${parseFloat(application.loanAmount).toLocaleString()}
- Annual Income: $${parseFloat(application.annualIncome).toLocaleString()}
- Employment: ${application.employmentStatus} at ${application.employer} for ${application.employmentDuration}
- Purpose: ${application.loanPurpose}

Credit Analysis:
- Credit Score: ${creditData.creditScore}
- Debt-to-Income Ratio: ${(creditData.dtiRatio * 100).toFixed(1)}%

Risk Assessment:
- Risk Tier: ${riskAssessment.riskTier}
- Decision: ${riskAssessment.decision}

Generate a clear, professional explanation for this ${riskAssessment.decision} decision. Follow these guidelines:
1. Be factual and transparent
2. Explain the key factors that influenced the decision
3. Use plain language (not technical jargon)
4. Comply with fair lending regulations (no discriminatory language)
5. Keep it concise (2-3 sentences)
6. Be empathetic but professional

Format: Return ONLY the explanation text, no additional commentary.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 300,
  });

  const explanation = response.choices[0].message.content || "Decision explanation unavailable.";

  const output = {
    explanation,
    decision: riskAssessment.decision,
    riskTier: riskAssessment.riskTier,
    creditScore: creditData.creditScore,
  };

  await storage.updateAgentState(agentState.id, {
    agentStatus: "completed",
    output,
    completedAt: new Date(),
  });

  await storage.createAuditLog({
    applicationId,
    action: "agent_completed",
    agentName: "decision_explainer",
    details: { output },
  });

  return output;
}

// Main agent orchestration function
export async function processLoanApplication(
  applicationId: string
): Promise<AgentOrchestrationResult> {
  console.log(`[Agent Orchestration] Processing application ${applicationId}`);

  // Get the application
  const application = await storage.getLoanApplication(applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  try {
    // Agent 1: Document Parser
    const extractedData = await documentParserAgent(applicationId, application);

    // Agent 2: Credit Scorer
    const creditData = await creditScoringAgent(applicationId, extractedData);

    // Agent 3: Risk Assessor
    const riskAssessment = await riskAssessmentAgent(applicationId, creditData);

    // Agent 4: Decision Explainer
    const explanation = await decisionExplainerAgent(
      applicationId,
      application,
      creditData,
      riskAssessment
    );

    // Update application with final decision
    await storage.updateLoanApplication(applicationId, {
      status: riskAssessment.decision,
      riskTier: riskAssessment.riskTier,
      creditScore: creditData.creditScore,
      finalDecision: riskAssessment.decision,
      aiExplanation: explanation.explanation,
    });

    await storage.createAuditLog({
      applicationId,
      userId: application.userId,
      action: "decision_made",
      details: {
        decision: riskAssessment.decision,
        riskTier: riskAssessment.riskTier,
        creditScore: creditData.creditScore,
      },
    });

    console.log(`[Agent Orchestration] Completed application ${applicationId}: ${riskAssessment.decision}`);

    return {
      finalDecision: riskAssessment.decision,
      aiExplanation: explanation.explanation,
      riskTier: riskAssessment.riskTier,
      creditScore: creditData.creditScore,
    };
  } catch (error) {
    console.error(`[Agent Orchestration] Error processing application ${applicationId}:`, error);
    
    // Mark application as failed
    await storage.updateLoanApplication(applicationId, {
      status: "rejected",
      finalDecision: "rejected",
      aiExplanation: "Application processing failed due to technical error.",
    });

    throw error;
  }
}
