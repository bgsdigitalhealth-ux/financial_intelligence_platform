import React, { useState } from 'react'
import {
  LayoutDashboard,
  Building2,
  Wallet,
  UploadCloud,
  Sparkles,
  FileCheck2,
  ChevronRight,
  Info,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2,
  Landmark,
  FileSpreadsheet,
  Users,
  Cpu,
  ShieldCheck,
} from 'lucide-react'
import { ROLES, useFinancialData } from '@/context/FinancialDataContext'

export function SystemFlowchartBar({
  currentRole,
  activeTab,
  onSelectTab,
  onOpenFlowchartModal,
}) {
  const {
    universities = [],
    bankAccounts = [],
    statements = [],
    selectedUniversityId,
    setSelectedUniversityId,
    selectedAccountId,
  } = useFinancialData()

  // Toggle between Role Flow Track (Sequential matching Screenshot 1) and 6 Modules Grid (Screenshot 2)
  const [viewMode, setViewMode] = useState('flow') // 'flow' or 'modules'

  // Selected university details for display in workflow strip
  const currentUniv = universities.find((u) => u.id === selectedUniversityId) || universities[0]

  // Flow Track 1: Government Leadership Flow (Screenshot 1, Left Column)
  const govFlowSteps = [
    {
      stepNumber: '1',
      id: 'overview',
      title: '1. Leadership Dashboard',
      subtitle: 'Statewide KPIs & 32 Campuses',
      bullets: [
        'Statewide financial view & consolidated KPIs',
        '32 universities comparison table & cards',
        'Financial trends, anomalies & statutory tripwires',
        'Direct drill-down to any Karnataka university',
      ],
      icon: LayoutDashboard,
      color: '#0969da',
      activeBg: 'bg-[#0969da] text-white border-[#0969da] shadow-sm',
    },
    {
      stepNumber: '2',
      id: 'university_overview',
      title: '2. University Overview Dashboard',
      subtitle: currentUniv ? currentUniv.name : 'Select Campus',
      bullets: [
        'University financial allocation, spent & balance in ₹',
        'Bank accounts and live balances (Canara, SBI, etc.)',
        'Quarterly filing status (Q1–Q4) & trends',
        'View account details & executive review',
      ],
      icon: Building2,
      color: '#1a7f37',
      activeBg: 'bg-[#1a7f37] text-white border-[#1a7f37] shadow-sm',
    },
    {
      stepNumber: '3',
      id: 'reports',
      title: 'View Additional Reports',
      subtitle: '5 Research Domains & Compliance Matrix',
      bullets: [
        'Statewide fund distribution across 5 core research domains',
        'Category-wise analysis vs statutory expenditure benchmarks',
        'AI anomaly insights and cross-campus exception alerts',
        'Statutory compliance status matrix (GASB 34, 2 CFR 200, State Acts)',
      ],
      icon: FileSpreadsheet,
      color: '#8250df',
      activeBg: 'bg-[#8250df] text-white border-[#8250df] shadow-sm',
    },
  ]

  // Flow Track 2: University Finance Officer Flow (Sidebar: Dashboard, Bank Account, AI Validation, Compliance, AI Insights, Report)
  const univFlowSteps = [
    {
      stepNumber: '1',
      id: 'overview',
      title: 'Dashboard',
      subtitle: 'Login-Based University Metrics',
      bullets: [
        'Strictly login-based campus metrics & FY26 budget',
        'State appropriation drawdown vs utilization',
        'Aggregated liquid balances across own accounts',
        'Quarterly compliance & filing telemetry',
      ],
      icon: LayoutDashboard,
      color: '#0969da',
      activeBg: 'bg-[#0969da] text-white border-[#0969da] shadow-sm',
    },
    {
      stepNumber: '2',
      id: 'bank_accounts',
      title: 'Bank Account',
      subtitle: 'Top Cards, Details & Statement Upload',
      bullets: [
        'All accounts displayed in interactive cards at top',
        'Select card to view IFSC, live balance & charts',
        'General ledger transaction lines & audit trail',
        'Upload bank statement bound to selected account',
      ],
      icon: Landmark,
      color: '#1a7f37',
      activeBg: 'bg-[#1a7f37] text-white border-[#1a7f37] shadow-sm',
    },
    {
      stepNumber: '3',
      id: 'ai_validation',
      title: 'Ai validation',
      subtitle: 'Deep OCR & Exception Resolution',
      bullets: [
        'AI OCR parses raw transaction ledger lines',
        'Chart of Accounts automatic classification',
        'Mathematical reconciliation & closing check',
        'Resolve policy exceptions with CFO justification',
      ],
      icon: Sparkles,
      color: '#cf222e',
      activeBg: 'bg-[#cf222e] text-white border-[#cf222e] shadow-sm',
    },
    {
      stepNumber: '4',
      id: 'compliance',
      title: 'compliance',
      subtitle: 'Statutory Compliance Audit',
      bullets: [
        'Statutory compliance execution pipeline',
        'K.S.U. Act 2000 §102 & KGFR Ch 8 citations',
        'Automated regulatory retrieval & checks',
        'Official statutory declaration & sign-off submission',
      ],
      icon: ShieldCheck,
      color: '#8250df',
      activeBg: 'bg-[#8250df] text-white border-[#8250df] shadow-sm',
    },
    {
      stepNumber: '5',
      id: 'ai_insights',
      title: 'AI Insights',
      subtitle: 'Financial Intelligence Decision Support',
      bullets: [
        'Treasury burn rate & Q4 solvency forecasting',
        'Duplicate wire & tender threshold evasion screening',
        'KGFR allowable expense compliance audit',
        'Interactive financial reasoning & analysis',
      ],
      icon: Cpu,
      color: '#8250df',
      activeBg: 'bg-[#8250df] text-white border-[#8250df] shadow-sm',
    },
    {
      stepNumber: '6',
      id: 'reports',
      title: 'Report',
      subtitle: 'Statements, Reconciliation & Form 19-A',
      bullets: [
        'Quarterly Statement of Receipts & Expenditures',
        'Multi-Bank Treasury Reconciliation Statement',
        'Chart of Accounts functional expenditure breakdown',
        'Statutory Form 19-A Utilization Certificate (PDF/CSV)',
      ],
      icon: FileSpreadsheet,
      color: '#059669',
      activeBg: 'bg-[#059669] text-white border-[#059669] shadow-sm',
    },
  ]

  // The 6 Core Functional Modules Grid (Screenshot 2)
  const coreModules = [
    {
      step: '1',
      id: 'overview',
      name: '1. Leadership Dashboard',
      shortName: 'Leadership Dashboard',
      color: '#0969da',
      icon: LayoutDashboard,
      bullets: ['View consolidated KPIs', 'Compare 32 universities', 'Analyze financial trends', 'Identify alerts & anomalies', 'Drill down to university'],
    },
    {
      step: '2',
      id: currentRole === ROLES.GOV_LEADER ? 'university_overview' : 'overview',
      name: '2. University Overview',
      shortName: 'University Overview',
      color: '#1a7f37',
      icon: Building2,
      bullets: ['Select university', 'View financial summary', 'See bank accounts list', 'Check quarterly status', 'Navigate to bank account'],
    },
    {
      step: '3',
      id: 'select_account',
      name: '3. Bank Account Detail',
      shortName: 'Bank Account Detail',
      color: '#8250df',
      icon: Wallet,
      bullets: ['View account information', 'See transaction ledger', 'Check balances and charts', 'Review statement history', 'Proceed to upload statement'],
    },
    {
      step: '4',
      id: 'statement_upload',
      name: '4. Quarterly Statement Upload',
      shortName: 'Statement Upload',
      color: '#d97706',
      icon: UploadCloud,
      bullets: ['Select financial year & quarter', 'Choose bank account', 'Upload statement (PDF/CSV/XLSX)', 'Track upload and processing', 'Submit for validation'],
    },
    {
      step: '5',
      id: 'ai_validation',
      name: '5. AI Analysis & Validation',
      shortName: 'AI Validation',
      color: '#cf222e',
      icon: Sparkles,
      bullets: ['AI extracts transactions', 'AI classifies categories', 'Check reconciliation', 'Review flagged transactions', 'Approve / request correction'],
    },
    {
      step: '6',
      id: 'submission_compliance',
      name: '6. Submission & Compliance',
      shortName: 'Submission & Compliance',
      color: '#059669',
      icon: FileCheck2,
      bullets: ['View submission progress', 'Check pending statements', 'Send reminders (if needed)', 'Monitor approval status', 'Ensure 100% compliance'],
    },
  ]

  const isGovLeader = currentRole === ROLES.GOV_LEADER

  return (
    <div className="bg-white border-b border-[#d0d7de] px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Top Header: Title, Track Badge, View Mode Switcher, and SOP Modal Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-[#ddf4ff] border border-[#54aeff]/40 text-xs font-bold text-[#0969da]">
              ⚡
            </span>
            <div>
              <span className="text-xs font-bold text-[#1f2328] tracking-tight">
                {isGovLeader ? 'Track 1: Government Leadership Flow' : 'Track 2: University Finance Officer Flow'}
              </span>
              <span className="text-[11px] text-[#57606a] ml-2 hidden md:inline">
                Karnataka Dept of Higher Education SOP (K.S.U. Act 2000)
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isGovLeader
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isGovLeader ? 'Department Officials' : 'University Staff (CFO)'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Role Flow vs 6 Modules */}
            <div className="inline-flex rounded-md border border-[#d0d7de] bg-[#f6f8fa] p-0.5 text-[11px]">
              <button
                onClick={() => setViewMode('flow')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'flow'
                    ? 'bg-white text-[#0969da] shadow-2xs font-semibold'
                    : 'text-[#57606a] hover:text-[#1f2328]'
                }`}
              >
                Role Flow Track
              </button>
              <button
                onClick={() => setViewMode('modules')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'modules'
                    ? 'bg-white text-[#0969da] shadow-2xs font-semibold'
                    : 'text-[#57606a] hover:text-[#1f2328]'
                }`}
              >
                6 Core Modules
              </button>
            </div>

            <button
              onClick={onOpenFlowchartModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#0969da] bg-[#ddf4ff] hover:bg-[#b6e3ff] border border-[#54aeff]/40 rounded-md transition-colors cursor-pointer shadow-2xs"
            >
              <Info className="h-3.5 w-3.5" />
              <span>System Flow Chart Architecture</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Area */}
        {viewMode === 'flow' ? (
          /* Role Sequential Flow Track (Matching Screenshot 1) */
          <div>
            {isGovLeader ? (
              /* Government Leadership Flow: Step 1 -> Select Univ -> Step 2 -> Step 3 */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {govFlowSteps.map((step, idx) => {
                  const Icon = step.icon
                  const isActive =
                    (step.id === 'overview' && activeTab === 'overview') ||
                    (step.id === 'university_overview' && activeTab === 'university_overview') ||
                    (step.id === 'reports' && activeTab === 'reports')

                  return (
                    <div key={step.id} className="relative flex items-center">
                      <button
                        onClick={() => onSelectTab(step.id)}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                          isActive
                            ? `${step.activeBg} ring-2 ring-blue-400 ring-offset-1`
                            : 'bg-white hover:bg-[#f6f8fa] border-[#d0d7de] text-[#1f2328]'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 shrink-0 rounded-full text-xs font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 text-[#0969da] border border-blue-200'
                          }`}
                        >
                          {step.stepNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-[#1f2328]'}`}>
                              {step.title}
                            </span>
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#57606a]'}`} />
                          </div>
                          <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-[#57606a]'}`}>
                            {step.subtitle}
                          </div>
                          <div className={`text-[10px] mt-1 line-clamp-1 ${isActive ? 'text-white/70' : 'text-[#656d76]'}`}>
                            • {step.bullets[0]}
                          </div>
                        </div>
                      </button>

                      {idx < govFlowSteps.length - 1 && (
                        <div className="hidden md:flex absolute -right-2 z-10 items-center justify-center h-5 w-5 rounded-full bg-white border border-[#d0d7de] text-[#0969da] shadow-2xs">
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* University Finance Officer Flow: Dashboard -> Bank Account -> AI Validation -> Compliance -> AI Insights -> Report */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {univFlowSteps.map((step, idx) => {
                  const Icon = step.icon
                  const isActive =
                    (step.id === 'overview' && activeTab === 'overview') ||
                    activeTab === step.id

                  return (
                    <div key={step.id} className="relative flex items-center">
                      <button
                        onClick={() => onSelectTab(step.id)}
                        className={`w-full flex items-start gap-2 p-2 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                          isActive
                            ? `${step.activeBg} ring-2 ring-emerald-400 ring-offset-1`
                            : 'bg-white hover:bg-[#f6f8fa] border-[#d0d7de] text-[#1f2328]'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center h-5 w-5 shrink-0 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-50 text-[#1a7f37] border border-emerald-200'
                          }`}
                        >
                          {step.stepNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold truncate ${isActive ? 'text-white' : 'text-[#1f2328]'}`}>
                              {step.title}
                            </span>
                            <Icon className={`h-3 w-3 shrink-0 ${isActive ? 'text-white' : 'text-[#57606a]'}`} />
                          </div>
                          <div className={`text-[9.5px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-[#57606a]'}`}>
                            {step.subtitle}
                          </div>
                        </div>
                      </button>

                      {idx < univFlowSteps.length - 1 && (
                        <div className="hidden md:flex absolute -right-2 z-10 items-center justify-center h-4 w-4 rounded-full bg-white border border-[#d0d7de] text-[#1a7f37] shadow-2xs">
                          <ChevronRight className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* The 6 Core Functional Modules Grid (Matching Screenshot 2) */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {coreModules.map((s) => {
              const Icon = s.icon
              const isActive =
                activeTab === s.id ||
                (s.id === 'overview' && activeTab === 'overview' && isGovLeader) ||
                (s.id === 'university_overview' && activeTab === 'university_overview')

              return (
                <button
                  key={s.step}
                  onClick={() => onSelectTab(s.id)}
                  className={`relative flex flex-col p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#0969da] text-white border-[#0969da] shadow-xs ring-2 ring-offset-1 ring-blue-400'
                      : 'bg-white hover:bg-[#f6f8fa] border-[#d0d7de] text-[#1f2328]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]'
                      }`}
                    >
                      {s.step}
                    </span>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#57606a]'}`} />
                  </div>
                  <div className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-[#1f2328]'}`}>
                    {s.shortName}
                  </div>
                  <div className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-white/80' : 'text-[#656d76]'}`}>
                    {s.bullets[0]}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Database & System Layer (MySQL Workbench Engine) Live Strip */}
        <div className="bg-[#f6f8fa] rounded-lg border border-[#d0d7de] p-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-[#1f2328] font-bold">
            <Database className="h-3.5 w-3.5 text-[#0969da]" />
            <span>DATABASE AND SYSTEM PERSISTENCE LAYER:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="px-2 py-0.5 rounded bg-white border border-[#d0d7de] font-mono font-medium text-[#1f2328]">
              Users & Roles (3 Roles)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 font-mono font-medium text-blue-800">
              Universities ({universities.length || 32} Campuses)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-mono font-medium text-emerald-800">
              Bank Accounts ({bankAccounts.length || 96} Accounts)
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 font-mono font-medium text-purple-800">
              Quarters (Q1–Q4 FY26)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 font-mono font-medium text-amber-800">
              Statements ({statements.length} Filings & PDF)
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 font-mono font-medium text-rose-800">
              AI Analysis (OCR & Exceptions)
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 font-mono font-medium text-teal-800">
              Approvals (Statutory Sign-off)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

