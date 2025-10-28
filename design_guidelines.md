# SmartLoan Agent - Design Guidelines

## Design Approach
**Selected Approach:** Design System - Inspired by **Carbon Design System** and **Stripe Dashboard** patterns, optimized for data-heavy financial applications with clear information hierarchy and professional credibility.

**Key Design Principles:**
1. **Trust Through Clarity** - Transparent agent reasoning, clear decision pathways
2. **Cognitive Efficiency** - Dense information presented with excellent hierarchy
3. **Progressive Disclosure** - Complex details revealed contextually
4. **Status Transparency** - Real-time agent activity always visible

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - UI text, data, labels
- Monospace: JetBrains Mono - Agent outputs, technical data, audit logs

**Hierarchy:**
- **Page Titles:** text-2xl font-semibold (Loan Officer Dashboard, Application Review)
- **Section Headers:** text-lg font-medium (Active Applications, Agent Activity)
- **Card Titles:** text-base font-semibold (Application #12345, Credit Score Analysis)
- **Body Text:** text-sm (Application details, descriptions)
- **Data Labels:** text-xs font-medium uppercase tracking-wide (STATUS, RISK TIER)
- **Agent Names:** text-xs font-mono uppercase (CREDIT_SCORING_AGENT)
- **Metadata:** text-xs (timestamps, user IDs)

---

## Layout System

**Spacing Primitives:** Tailwind units of **2, 4, 6, and 8** (e.g., p-4, gap-6, mb-8)

**Grid Structure:**
- **Dashboard Layout:** Fixed sidebar (w-64) + main content area (flex-1)
- **Content Max-Width:** max-w-7xl for main dashboard content
- **Card Grids:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for application cards
- **Two-Column Details:** grid-cols-1 lg:grid-cols-2 for application details view

**Vertical Rhythm:**
- Section spacing: mb-8 between major sections
- Card spacing: gap-6 in grid layouts
- Internal card padding: p-6
- Compact lists: gap-4

---

## Component Library

### Navigation & Layout

**Sidebar Navigation (Role-Specific):**
- Fixed left sidebar with logo at top (h-16 flex items-center)
- Navigation items stacked vertically with icons from Heroicons (w-5 h-5)
- Active state: Slightly inset background, bold text
- Role badge at bottom showing current user role
- Spacing: gap-2 between nav items, p-4 sidebar padding

**Top Bar:**
- Height: h-16
- Contains: Breadcrumb navigation, real-time agent status indicator, user menu
- Right-aligned: User avatar + role badge + dropdown

### Core Data Components

**Application Card:**
- Rounded-lg border
- Padding: p-6
- Header: Application ID (font-semibold) + Status badge (inline)
- Grid layout for key metrics (2-column on desktop): DTI ratio, Credit Score, Employment Duration
- Footer: Timestamp + assigned officer + action buttons
- Spacing: gap-4 internal elements

**Agent Activity Timeline (Real-time Visualization):**
- Vertical timeline on right side or expandable panel
- Each agent step shows:
  - Agent name (font-mono, uppercase, text-xs)
  - Status indicator (processing/complete/failed - use subtle animation for active)
  - Timestamp (text-xs)
  - Expandable details (agent output JSON preview)
- Connector lines between steps (h-px border-dashed)
- Spacing: gap-6 between timeline items

**Decision Card (Explanation Display):**
- Prominent placement with subtle border emphasis
- Header: "AI Decision" + confidence level badge
- Main content: LLM-generated explanation (text-base, leading-relaxed)
- Expandable "View Agent Reasoning" showing each agent's contribution
- Footer: Override button (Loan Officers only) + timestamp

**Risk Assessment Widget:**
- Circular or horizontal progress indicator for risk score
- Three-tier visual system: Low/Medium/High risk
- Key factors list (DTI, credit score, employment) with individual indicators
- Compact: fits in sidebar or card header

### Forms & Input

**Loan Application Form:**
- Single-column layout (max-w-2xl)
- Grouped sections with clear headers: Personal Info, Employment, Financial Details
- Input fields: Consistent height (h-12), rounded-lg borders
- Labels: text-sm font-medium mb-2
- Helper text: text-xs below inputs
- Spacing: gap-6 between sections, gap-4 between fields

**Override Justification Modal:**
- Centered modal (max-w-lg)
- Header: "Override AI Decision" with warning indicator
- Textarea: h-32 for justification
- Warning text: "This action will be audited" (text-xs)
- Actions: Cancel + Submit Override buttons

### Dashboard Widgets

**Metrics Dashboard (Admin/Auditor View):**
- Grid of stat cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each card: p-6, rounded-lg
- Large number (text-3xl font-bold) + label below (text-sm)
- Optional trend indicator (↑↓ with small percentage)

**Audit Trail Table:**
- Striped rows for readability
- Compact row height (py-4)
- Columns: Timestamp, User, Action, Application ID, Agent Chain, Details
- Monospace font for technical IDs
- Expandable rows for full agent output
- Sticky header on scroll

**Filter Bar:**
- Horizontal layout with dropdowns for: Status, Risk Tier, Date Range, Assigned Officer
- Inline with search input (w-64)
- Clear filters button on right
- Height: h-12 items

### Buttons & Actions

**Primary Actions:** 
- Height: h-10 or h-12 for prominent CTAs
- Padding: px-6
- Rounded: rounded-lg
- Font: text-sm font-medium
- No href attributes - use onClick handlers to prevent link preview

**Secondary Actions:**
- Outlined style with border-2
- Same height/padding as primary

**Icon Buttons:**
- Square: w-10 h-10
- Rounded: rounded-lg
- Icons: Heroicons w-5 h-5 centered

**Button Groups:**
- Flex with gap-3 for spacing
- Right-aligned in cards/modals

### Status Indicators

**Badge System:**
- Small: px-2.5 py-1 text-xs rounded-full font-medium
- Status types: Approved, Pending, Escalated, Rejected, Processing
- Use with icon (w-4 h-4) inline for agent status

**Loading States:**
- Skeleton screens for data loading (h-4 w-full rounded animate-pulse)
- Spinner for agent processing (w-5 h-5 animate-spin from Heroicons)
- Progress bar for multi-step processes (h-2 rounded-full)

---

## Animations

**Minimal, Purposeful Motion:**
- Agent status transitions: Subtle pulse animation on "Processing" badges
- Card hover: translate-y-[-2px] transition-transform
- Modal entry: Fade in + scale (0.95 to 1.0) over 200ms
- No complex scroll animations or parallax effects

---

## Accessibility

**Consistent Implementation:**
- All interactive elements: h-10 minimum touch target
- Form inputs: Proper label associations, aria-describedby for helpers
- Status badges: Include aria-label with full status text
- Agent timeline: Proper heading hierarchy (h3 for agent names)
- Keyboard navigation: Focus rings (ring-2 ring-offset-2) on all interactive elements
- Skip links for sidebar navigation

---

## Role-Specific Layouts

**Borrower View:**
- Simplified single-application view (no sidebar)
- Large status card at top
- Application form or decision explanation below
- Minimal navigation: Logo + "My Application" + Sign Out

**Loan Officer Dashboard:**
- Full sidebar with: Escalated Queue, All Applications, Reports
- Three-column grid for application cards
- Quick filters at top
- Agent activity panel slides in from right on card click

**Compliance Auditor:**
- Table-first layout (audit trail prominent)
- Advanced filters always visible
- Export button (top-right)
- Read-only indicators throughout

**Admin:**
- Metrics dashboard at top (4-column stats)
- User management table below
- System health indicators in sidebar

---

## Images

**No hero image required** - This is a functional dashboard application. 

**Avatar Images:**
- User avatars in top bar and officer assignment (w-8 h-8 rounded-full)
- Placeholder: Initials on subtle background if no image

**Iconography:**
- Heroicons throughout (outline style for navigation, solid for inline status)
- Agent icons: Unique icon per agent type (document, calculator, shield, chat bubble)

---

## Special Considerations

**Link Behavior:**
- All navigation uses onClick handlers with programmatic routing
- No <a href> tags that show browser preview on hover
- Buttons styled as buttons with proper cursor pointer

**Agent Transparency:**
- Collapsible "View Agent Chain" in every decision view
- JSON output preview with syntax highlighting (monospace font)
- Clear visual distinction between automated vs. human decisions

**Compliance Indicators:**
- Audit badge on every action that's logged
- Timestamp everywhere (ISO format, text-xs)
- "Explainable AI" label near AI-generated content