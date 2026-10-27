# GovFinanceIntel — Financial Intelligence Platform

A high-performance, role-based financial intelligence platform tailored for **Higher Education & State Public Sector Governance**. Built with **React**, **Tailwind CSS**, **shadcn UI patterns**, and **Recharts**, with a **clean white GitHub-inspired aesthetic** (`#ffffff` main canvas, `#f6f8fa` subtle containers, `#d0d7de` crisp borders, and dark charcoal `#1f2328` typography).

---

## 🎯 Role-Based Architecture & Features

The platform provides dedicated, authorized command views tailored to three core personas:

### 1. 🏛️ Government Leader
*Persona: Hon. Dr. Elena Vance — Secretary of Higher Education & Research*
- **Executive Macro Overview**: Statewide monitoring of **₹485.0 Crore** in public appropriations across 12 participating universities.
- **Economic ROI Multiplier (3.42x)**: Tracks technology transfer, patent generation (882 IP filings), and regional economic spillover.
- **State Grant Disbursement Pipeline**: Four-stage drawdown tracking (Statutory Release $\to$ Treasury Authorization $\to$ University Research Escrow $\to$ Milestone Settlement) with an electronic sign-off modal.
- **Compliance & Fiscal Risk Map**: Auditing university drawdowns against allowable cost guidelines (GASB 34 / 2 CFR 200). Includes audit warnings for flagged campuses (e.g., Coastal Maritime Academy).
- **Interactive Policy Budget Simulator**: What-if sandbox with real-time sliders to adjust STEM research subsidies, workforce upskilling, and green transition funding, projecting simulated economic ROI gains, tech jobs created, and budget impact.
- **Legislative Briefs & Reports**: Downloadable GASB-34 financial statements and official state appropriation packages.

---

### 2. 🎓 University Finance
*Persona: Marcus Chen, CPA — Vice President of Finance & CFO, Apex State Polytechnic University*
- **Institutional Financial Command Center**: Overseeing **₹84.5 Crore** annual operating budget, month 9 burn-rate trajectory (73.6%), and **+₹1.62 Crore** projected net surplus.
- **Monthly Operating Cash Flow**: Visualizing tuition intake spikes (August & January) against steady faculty payroll and debt service covenants.
- **Departmental Ledger & Overspend Alerts**: Real-time budget vs. actuals across academic units (College of Computing & AI, Bio-Engineering, Business, Materials, Humanities, and Infrastructure) with automated deficit flags.
- **Sponsored Research Grant Tracker**: Tracking 142 extramural grants (NIH, NSF, DOE, DARPA, State Chip Consortium) with F&A indirect recovery rates, burn rates, and expiration countdown warnings.
- **Inter-Account Reallocation Workflow**: Formal ledger transfer requisitions (e.g., emergency transfers between Central Contingency and research laboratories) with live CFO one-click approval/rejection.

---

### 3. 🛡️ System Administrator
*Persona: Sarah Jenkins, CISSP — Director of Financial Systems & Security Architecture*
- **Consortium Telemetry & Health**: 99.98% platform availability, 24ms sync latency, 384 active authenticated sessions, and 100% MFA enforcement.
- **Campus ERP Gateways**: Continuous synchronization brokers connecting **Workday Financials**, **Ellucian Banner 9.3**, **Oracle Cloud ERP**, and **SAP S/4HANA**.
- **Role-Based Access Control (RBAC)**: Directory of 1,482 user accounts with granular authority delegation and an interactive "Provision New User" modal.
- **Immutable Cryptographic Audit Trail**: GitHub commit-style append-only journal (`commit 8f3a9d...`) recording all financial disbursements, rule modifications, and GL synchronizations with SHA-256 validation.
- **Automated Alert Rule Engine**: Configurable anomaly tripwires (departmental overspend limits, grant expiration countdowns, and abnormal transfer thresholds) with live enable/disable toggles.

---

### 🤖 AI Financial Copilot
- Accessible via the **AI Financial Copilot** button in the top navigation bar.
- Pre-loaded with contextual queries tailored to each role or free-form financial questions.
- Produces diagnostic breakdowns, root cause analysis, and actionable legislative/CFO recommendations.

---

## 🛠️ Technology Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + GitHub White Light Theme tokens
- **Components**: shadcn UI pattern architecture (Cards, Modals, Badges, Buttons, Inputs, Tooltips)
- **Data Visualizations**: Recharts (Area charts, Bar charts, Donut charts, Line charts)
- **Icons**: Lucide React

---

## 🚀 Getting Started

### 1. Navigate to the frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npx vite --host 127.0.0.1 --port 5173
```
Open **[http://127.0.0.1:5173](http://127.0.0.1:5173)** in your browser.

### 4. Build for production
```bash
npm run build
```
