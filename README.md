# Financial Intelligence Platform (GovFinanceIntel)

Role-Based Financial Intelligence Platform with Email Authentication and Role Authorization designed for:
1. **Government Leadership (Department Officials)** (Statewide oversight, ₹485.0 Cr appropriations, economic ROI, policy simulator)
2. **University Finance Officer (University Staff)** (Institutional command center, ₹84.5 Cr operating budget, cash flows, grant burn-rates, fund reallocations)
3. **System Administrator (Auditor & IT Governance)** (RBAC directory, ERP gateway telemetry, immutable commit-style audit trail, alert rule engine)

The application is built with React 19, Tailwind CSS, shadcn UI design conventions, Recharts, and a **clean white GitHub-inspired aesthetic** (`#ffffff` canvas, `#f6f8fa` subtle areas, `#d0d7de` borders, `#1f2328` text). All financial figures are formatted in **Indian Rupees (₹)** with Lakh/Crore denominations.

## Role-Based Authentication & Authorization Flow

```
[Start] ──> [Login Form] (Enter credentials: email / password)
                 │
                 ▼
         [Authenticate User]
         ├─── Invalid ──> [Show Error (Invalid credentials)] ──> Returns to Login
         │
         └─── Valid ────> [Select Role]
                              ├── 🏛️ Government Leadership (Department Officials)
                              ├── 🎓 University Finance Officer (University Staff)
                              └── 🛡️ System Administrator (Auditor & IT Governance)
                                      │
                                      ▼
                           [Authorized Platform Console]
```

### Pre-Configured Demo Credentials

| Role Persona | Email | Password | Clearance Scope |
| :--- | :--- | :--- | :--- |
| **Government Leadership** | `elena.vance@gov.state.edu` | `password123` | Statewide appropriations, grants, simulator |
| **University Finance Officer** | `mchen@apex.edu` | `password123` | Campus GL, department spend, cash flow |
| **System Administrator** | `sjenkins@state.consortium.org` | `password123` | Enterprise RBAC, ERP gateways, audit logs, tripwires (All Roles) |
| **Super Administrator** | `admin@state.gov` | `password123` | Full Multi-Role Executive Access |

*Note: 1-click autofill buttons are available on the login screen for testing.*

## Quick Start
```bash
cd frontend
npm install
npm run dev
```

Visit: **[http://127.0.0.1:5173](http://127.0.0.1:5173)**
