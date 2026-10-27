import React from 'react'
import {
  X,
  Landmark,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  Sparkles,
  UploadCloud,
  FileCheck2,
  FileSpreadsheet,
  Wallet,
  LayoutDashboard,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'

export function SystemFlowchartModal({ isOpen, onClose, onSelectTab }) {
  const {
    universities = [],
    bankAccounts = [],
    statements = [],
    users = [],
  } = useFinancialData()

  if (!isOpen) return null

  const handleStepClick = (tabId) => {
    if (onSelectTab) {
      onSelectTab(tabId)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl border border-[#d0d7de] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de] bg-[#f6f8fa]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#cf222e] text-white flex items-center justify-center font-bold shadow-xs">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1f2328]">
                  Karnataka Department of Higher Education
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/40 font-semibold">
                  Official SOP
                </span>
              </div>
              <p className="text-xs text-[#57606a]">
                University Financial Intelligence Platform — System Flow Chart Architecture
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#57606a] hover:text-[#1f2328] hover:bg-[#eaeef2] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner: Purpose */}
          <div className="bg-[#ddf4ff]/40 border border-[#54aeff]/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0969da]">
                STATUTORY MANDATE & PURPOSE
              </span>
              <p className="text-xs text-[#1f2328] mt-0.5 font-medium leading-relaxed">
                Monitor, analyze, and ensure timely submission and compliance of quarterly financial statements for all 32 government and open universities in Karnataka.
              </p>
            </div>
            <div className="shrink-0 text-xs text-[#0969da] font-mono font-semibold bg-white px-3 py-1.5 rounded-md border border-[#54aeff]/40 shadow-2xs">
              K.S.U. Act 2000 Certified
            </div>
          </div>

          {/* Workflow Tracks Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Government Admin Flow (View-Only Oversight) */}
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Landmark className="h-4 w-4 text-[#0969da]" />
                  <span>1. Government Admin Flow (View-Only)</span>
                </div>
                <span className="text-[11px] bg-blue-100 text-[#0969da] px-2 py-0.5 rounded font-medium">
                  Statewide Oversight
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-[#1f2328]">
                {/* Step 1 */}
                <div
                  onClick={() => handleStepClick('overview')}
                  className="p-3 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-[#0969da] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-blue-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#0969da] text-white text-[11px] flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>All Colleges Progress</span>
                    </div>
                    <span className="text-[10px] text-[#0969da] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>Statewide financial view & consolidated KPIs</li>
                    <li>32 universities comparison table & cards</li>
                    <li>Financial trends, anomalies & statutory tripwires</li>
                    <li>Direct drill-down to any Karnataka university</li>
                  </ul>
                </div>

                <div className="flex justify-center text-blue-400 font-bold text-sm">↓</div>

                {/* Select University */}
                <div
                  onClick={() => handleStepClick('overview')}
                  className="p-2.5 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg border border-blue-200 text-center font-semibold text-[11px] text-blue-900 cursor-pointer transition-colors"
                >
                  🏛️ Select University (Search or click from 32 campuses)
                </div>

                <div className="flex justify-center text-blue-400 font-bold text-sm">↓</div>

                {/* Step 2 */}
                <div
                  onClick={() => handleStepClick('university_overview')}
                  className="p-3 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-[#1a7f37] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-blue-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#1a7f37] text-white text-[11px] flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>University Overview Dashboard</span>
                    </div>
                    <span className="text-[10px] text-[#1a7f37] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>University financial allocation, spent & balance in ₹</li>
                    <li>Bank accounts and live balances (Canara Bank, SBI, etc.)</li>
                    <li>Quarterly filing status (Q1–Q4) & trends</li>
                    <li>View account details & executive review</li>
                  </ul>
                </div>

                <div className="flex justify-center text-blue-400 font-bold text-sm">↓</div>

                {/* Additional Reports */}
                <div
                  onClick={() => handleStepClick('reports')}
                  className="p-3 bg-white rounded-lg border border-blue-100 shadow-2xs hover:border-[#8250df] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-blue-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-[#8250df]" />
                      <span>All Reports (View Only)</span>
                    </div>
                    <span className="text-[10px] text-[#8250df] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>Statewide fund distribution across 5 core research domains</li>
                    <li>Category-wise analysis vs statutory expenditure benchmarks</li>
                    <li>AI anomaly insights and cross-campus exception alerts</li>
                    <li>Statutory compliance status matrix (GASB 34, 2 CFR 200, State Acts)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2. University Finance Officer Flow */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <Building2 className="h-4 w-4 text-[#1a7f37]" />
                  <span>University Finance Officer Flow</span>
                </div>
                <span className="text-[11px] bg-emerald-100 text-[#1a7f37] px-2 py-0.5 rounded font-medium">
                  University Staff (CFO)
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-[#1f2328]">
                {/* Step 1: Dashboard */}
                <div
                  onClick={() => handleStepClick('overview')}
                  className="p-3 bg-white rounded-lg border border-emerald-100 shadow-2xs hover:border-[#1a7f37] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#1a7f37] text-white text-[11px] flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>Dashboard (Login-Based Command)</span>
                    </div>
                    <span className="text-[10px] text-[#1a7f37] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>Strictly login-based campus metrics & FY26 budget</li>
                    <li>State appropriation drawdown vs utilization</li>
                    <li>Aggregated liquid balances across own accounts</li>
                    <li>Quarterly compliance & filing telemetry</li>
                  </ul>
                </div>

                <div className="flex justify-center text-emerald-400 font-bold text-sm">↓</div>

                {/* Step 2: Bank Account */}
                <div
                  onClick={() => handleStepClick('bank_accounts')}
                  className="p-3 bg-white rounded-lg border border-emerald-100 shadow-2xs hover:border-[#1a7f37] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#1a7f37] text-white text-[11px] flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Bank Account (Cards, Details & Upload)</span>
                    </div>
                    <span className="text-[10px] text-[#1a7f37] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>All accounts displayed in interactive cards at top</li>
                    <li>Select card to view IFSC, live balance & charts</li>
                    <li>General ledger transaction lines & audit trail</li>
                    <li>Upload bank statement bound to selected account</li>
                  </ul>
                </div>

                <div className="flex justify-center text-emerald-400 font-bold text-sm">↓</div>

                {/* Step 3: AI Validation */}
                <div
                  onClick={() => handleStepClick('ai_validation')}
                  className="p-3 bg-white rounded-lg border border-emerald-100 shadow-2xs hover:border-[#cf222e] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#cf222e] text-white text-[11px] flex items-center justify-center font-bold">
                        3
                      </span>
                      <span>Ai validation (OCR & COA)</span>
                    </div>
                    <span className="text-[10px] text-[#cf222e] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>AI OCR automatically extracts transactions & references</li>
                    <li>Auto-classifies into Higher Ed Chart of Accounts</li>
                    <li>Mathematical reconciliation match against closing totals</li>
                    <li>Review & resolve flagged exceptions with CFO justification</li>
                  </ul>
                </div>

                <div className="flex justify-center text-emerald-400 font-bold text-sm">↓</div>

                {/* Step 4: Compliance */}
                <div
                  onClick={() => handleStepClick('compliance')}
                  className="p-3 bg-white rounded-lg border border-emerald-100 shadow-2xs hover:border-[#8250df] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#8250df] text-white text-[11px] flex items-center justify-center font-bold">
                        4
                      </span>
                      <span>compliance (Statutory Audit)</span>
                    </div>
                    <span className="text-[10px] text-[#8250df] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>Statutory compliance execution pipeline</li>
                    <li>K.S.U. Act 2000 §102 & KGFR Ch 8 citations</li>
                    <li>Automated regulatory retrieval & checks</li>
                    <li>Official statutory declaration & sign-off submission</li>
                  </ul>
                </div>

                <div className="flex justify-center text-emerald-400 font-bold text-sm">↓</div>

                {/* Step 5: AI Insights */}
                <div
                  onClick={() => handleStepClick('ai_insights')}
                  className="p-3 bg-white rounded-lg border border-emerald-100 shadow-2xs hover:border-[#8250df] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#8250df] text-white text-[11px] flex items-center justify-center font-bold">
                        5
                      </span>
                      <span>AI Insights (Financial Intelligence)</span>
                    </div>
                    <span className="text-[10px] text-[#8250df] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>Treasury burn rate & Q4 solvency forecasting</li>
                    <li>Duplicate wire & tender threshold evasion screening</li>
                    <li>KGFR allowable expense compliance audit</li>
                    <li>Interactive financial reasoning & analysis</li>
                  </ul>
                </div>

                <div className="flex justify-center text-emerald-400 font-bold text-sm">↓</div>

                {/* Step 6: Report */}
                <div
                  onClick={() => handleStepClick('reports')}
                  className="p-3 bg-white rounded-lg border border-emerald-100 shadow-2xs hover:border-[#059669] hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-[#059669] text-white text-[11px] flex items-center justify-center font-bold">
                        6
                      </span>
                      <span>Report (Statements, Reconciliation & Form 19-A)</span>
                    </div>
                    <span className="text-[10px] text-[#059669] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      Open Module ➔
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-[#57606a] space-y-0.5 ml-1">
                    <li>Quarterly Statement of Receipts & Expenditures</li>
                    <li>Multi-Bank Treasury Reconciliation Statement</li>
                    <li>Chart of Accounts functional expenditure breakdown</li>
                    <li>Statutory Form 19-A Utilization Certificate (PDF/CSV)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: 6 Distinct Dashboards / Functional Cards */}
          <div className="border-t border-[#d0d7de] pt-5">
            <h3 className="text-xs font-bold text-[#1f2328] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#0969da]" />
              <span>THE 6 CORE FUNCTIONAL MODULES (FROM SYSTEM FLOW CHART)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Card 1 */}
              <div
                onClick={() => handleStepClick('overview')}
                className="rounded-lg border-2 border-[#0969da] bg-white p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-xs text-[#0969da] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#0969da] text-white text-[11px] flex items-center justify-center">1</span>
                    <span>1. Leadership Dashboard</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <ul className="text-[11px] text-[#57606a] space-y-1">
                  <li>• View consolidated KPIs</li>
                  <li>• Compare 32 universities</li>
                  <li>• Analyze financial trends</li>
                  <li>• Identify alerts & anomalies</li>
                  <li>• Drill down to university</li>
                </ul>
              </div>

              {/* Card 2 */}
              <div
                onClick={() => handleStepClick('university_overview')}
                className="rounded-lg border-2 border-[#1a7f37] bg-white p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-xs text-[#1a7f37] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#1a7f37] text-white text-[11px] flex items-center justify-center">2</span>
                    <span>2. University Overview</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <ul className="text-[11px] text-[#57606a] space-y-1">
                  <li>• Select university</li>
                  <li>• View financial summary</li>
                  <li>• See bank accounts list</li>
                  <li>• Check quarterly status</li>
                  <li>• Navigate to bank account</li>
                </ul>
              </div>

              {/* Card 3 */}
              <div
                onClick={() => handleStepClick('select_account')}
                className="rounded-lg border-2 border-[#8250df] bg-white p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-xs text-[#8250df] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#8250df] text-white text-[11px] flex items-center justify-center">3</span>
                    <span>3. Bank Account Detail</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <ul className="text-[11px] text-[#57606a] space-y-1">
                  <li>• View account information</li>
                  <li>• See transaction ledger</li>
                  <li>• Check balances and charts</li>
                  <li>• Review statement history</li>
                  <li>• Proceed to upload statement</li>
                </ul>
              </div>

              {/* Card 4 */}
              <div
                onClick={() => handleStepClick('statement_upload')}
                className="rounded-lg border-2 border-[#d97706] bg-white p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-xs text-[#d97706] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#d97706] text-white text-[11px] flex items-center justify-center">4</span>
                    <span>4. Quarterly Statement Upload</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <ul className="text-[11px] text-[#57606a] space-y-1">
                  <li>• Select financial year & quarter</li>
                  <li>• Choose bank account</li>
                  <li>• Upload statement (PDF/CSV/XLSX)</li>
                  <li>• Track upload and processing</li>
                  <li>• Submit for validation</li>
                </ul>
              </div>

              {/* Card 5 */}
              <div
                onClick={() => handleStepClick('ai_validation')}
                className="rounded-lg border-2 border-[#cf222e] bg-white p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-xs text-[#cf222e] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#cf222e] text-white text-[11px] flex items-center justify-center">5</span>
                    <span>5. AI Analysis & Validation</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <ul className="text-[11px] text-[#57606a] space-y-1">
                  <li>• AI extracts transactions</li>
                  <li>• AI classifies categories</li>
                  <li>• Check reconciliation</li>
                  <li>• Review flagged transactions</li>
                  <li>• Approve / request correction</li>
                </ul>
              </div>

              {/* Card 6 */}
              <div
                onClick={() => handleStepClick('submission_compliance')}
                className="rounded-lg border-2 border-[#059669] bg-white p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-xs text-[#059669] mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#059669] text-white text-[11px] flex items-center justify-center">6</span>
                    <span>6. Submission & Compliance</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <ul className="text-[11px] text-[#57606a] space-y-1">
                  <li>• View submission progress</li>
                  <li>• Check pending statements</li>
                  <li>• Send reminders (if needed)</li>
                  <li>• Monitor approval status</li>
                  <li>• Ensure 100% compliance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Database and System Layer */}
          <div className="border-t border-[#d0d7de] pt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1f2328] uppercase tracking-wider mb-2">
              <Database className="h-4 w-4 text-[#0969da]" />
              <span>DATABASE AND SYSTEM PERSISTENCE LAYER</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[10px]">
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">Users & Roles</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">user_id, role</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">{users.length || 3} Active Roles</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">Universities</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">32 Campuses</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">{universities.length || 32} Institutions Registered</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">Bank Accounts</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">96 Accounts</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">{bankAccounts.length || 96} Live Records</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">Quarters</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">Q1–Q4 FY26</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">Active Fiscal Cycle</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">Statements</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">Filings & PDF</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">{statements.length} Documents</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">Transactions</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">Extracted Lines</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">GL Reconciled</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">AI Analysis</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">OCR & Exceptions</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">Chart of Accounts</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] text-center shadow-2xs">
                <div className="font-bold text-[#1f2328]">Approvals</div>
                <div className="text-[#0969da] font-mono mt-0.5 font-semibold">Statutory Sign-off</div>
                <div className="text-[9.5px] text-[#57606a] mt-0.5">State Certified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#d0d7de] bg-[#f6f8fa] flex items-center justify-between">
          <span className="text-xs text-[#57606a]">
            Government of Karnataka • Higher Education Council • FIPS 140-3 Live Sync
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0969da] hover:bg-[#0854b0] rounded-md transition-colors cursor-pointer shadow-xs"
          >
            Close Diagram
          </button>
        </div>
      </div>
    </div>
  )
}

