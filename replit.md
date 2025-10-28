# SmartLoan Agent - Autonomous Loan Underwriting System

## Overview

SmartLoan Agent is an enterprise-grade autonomous loan underwriting system that uses multi-agent AI orchestration to process loan applications. The system provides transparent, explainable loan decisions with comprehensive audit trails and role-based access control (RBAC) for compliance with financial regulations.

The application automates the end-to-end loan underwriting process through specialized AI agents that handle document parsing, credit scoring, risk assessment, and decision explanation. Each agent's reasoning and outputs are tracked for full transparency and regulatory compliance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite for development and production builds.

**UI Component System**: Shadcn/ui (New York style) with Radix UI primitives for accessible, composable components. The design follows Carbon Design System and Stripe Dashboard patterns optimized for data-heavy financial applications.

**Styling**: Tailwind CSS with custom design tokens defined in CSS variables. Typography uses Inter for UI text and JetBrains Mono for technical data/agent outputs. The spacing system uses Tailwind units of 2, 4, 6, and 8 for consistent vertical rhythm.

**State Management**: TanStack Query (React Query) for server state with custom query client configuration. Authentication state is managed through a custom `useAuth` hook that queries the `/api/auth/user` endpoint.

**Routing**: Wouter for client-side routing with role-based dashboard rendering (Borrower, Loan Officer, Compliance Auditor, Admin).

**Real-time Updates**: Polling-based approach using TanStack Query's `refetchInterval` option. Applications in "processing" status poll every 2-3 seconds to show live agent activity.

### Backend Architecture

**Runtime**: Node.js with Express.js server framework using ES modules.

**Language**: TypeScript with strict type checking enabled.

**Multi-Agent Orchestration**: Custom agent system (in `server/agents.ts`) that coordinates four specialized agents:
- **Document Parser Agent**: Validates and extracts structured data from loan applications
- **Credit Scoring Agent**: Computes credit scores using external data and internal models
- **Risk Assessment Agent**: Evaluates risk tiers based on DTI ratios, employment stability, and other factors
- **Decision Explanation Agent**: Uses OpenAI GPT-5 to generate human-readable explanations compliant with Regulation B (ECOA)

Each agent creates state records tracking inputs, outputs, status, and timestamps for full auditability.

**Authentication**: Replit Auth (OpenID Connect) with Passport.js strategy. Session management uses `express-session` with PostgreSQL session store (`connect-pg-simple`). Sessions are configured with 1-week TTL and secure cookies.

**Authorization**: Role-Based Access Control (RBAC) with four roles:
- **Borrower**: Submit applications, view own application status and explanations
- **Loan Officer**: View all applications, override decisions with justification, add notes
- **Compliance Auditor**: Read-only access to all applications and full audit trail export
- **Admin**: Manage users, policies, and system configuration

RBAC is enforced through middleware functions (`isAuthenticated`, `requireRole`) that check user roles from session claims.

### Data Storage

**Database**: PostgreSQL (Neon serverless) accessed via Drizzle ORM with WebSocket connection pooling.

**Schema Design** (defined in `shared/schema.ts`):
- **users**: User profiles with role assignment (borrower, loan_officer, compliance_auditor, admin)
- **loan_applications**: Complete application data including applicant info, employment details, financial data, and AI decision fields (status, finalDecision, aiExplanation, riskTier, creditScore)
- **agent_states**: Tracks each agent's execution with input, output, status (pending/processing/completed/failed), and timestamps
- **audit_logs**: Comprehensive audit trail of all system actions with userId, applicationId, action type, agentName, and arbitrary detail objects
- **sessions**: Express session storage for authentication persistence

**Migration Strategy**: Drizzle Kit for schema management with migrations directory. Database URL is required via environment variable with validation.

**Data Relationships**: 
- One-to-many: User → LoanApplications
- One-to-many: LoanApplication → AgentStates
- One-to-many: LoanApplication → AuditLogs

### External Dependencies

**AI/ML Services**:
- **OpenAI API**: GPT-5 model (as of August 7, 2025) for decision explanation generation. API key required via `OPENAI_API_KEY` environment variable.
- Future integration points mentioned in design docs: Azure Form Recognizer for document parsing, external credit bureaus (e.g., CIBIL) for credit scoring.

**Database**:
- **Neon PostgreSQL**: Serverless PostgreSQL with WebSocket support for connection pooling. Requires `DATABASE_URL` environment variable.

**Authentication**:
- **Replit Auth (OIDC)**: Identity provider for user authentication. Requires `REPL_ID`, `ISSUER_URL`, and `SESSION_SECRET` environment variables.

**Development Tools**:
- **Vite**: Development server with HMR and production build tooling
- Replit-specific plugins: Runtime error overlay, cartographer, dev banner (development only)

**UI Dependencies**:
- **Radix UI**: Headless component primitives for accessibility (@radix-ui/*)
- **Lucide React**: Icon system
- **React Hook Form**: Form state management with Zod validation (@hookform/resolvers)
- **date-fns**: Date manipulation and formatting
- **cmdk**: Command palette component
- **class-variance-authority**: Type-safe CSS variant management

**Production Considerations**:
- Build process uses esbuild for server bundling and Vite for client bundling
- Separate `dist/` output directory for server and `dist/public/` for client assets
- Session store requires database table creation (handled by connect-pg-simple with `createTableIfMissing: false`)
- Application expects secure cookie settings in production (HTTPS required)