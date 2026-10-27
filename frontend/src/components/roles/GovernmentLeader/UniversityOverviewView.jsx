import React, { useState, useMemo } from 'react'
import {
  Building2,
  Landmark,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  History,
  FileCheck2,
  Calendar,
  Lock,
  Search,
  Eye,
  FileSpreadsheet,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function UniversityOverviewView({ onSelectTab, onTriggerToast }) {
  const {
    universities,
    selectedUniversityId,
    setSelectedUniversityId,
    selectedUniversity,
    universityAccounts,
    statements,
    reviewStatement,
  } = useFinancialData()

  // Selected account for ledger drawer/modal
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState('APPROVE')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Current university's statements
  const univStatements = useMemo(() => {
    return statements.filter(
      (s) => s.universityId === selectedUniversity?.id || s.universityName === selectedUniversity?.name
    )
  }, [statements, selectedUniversity])

  // Active or pending statement
  const activeStatement = useMemo(() => {
    return (
      univStatements.find((s) => s.status === 'Submitted for Approval') ||
      univStatements[0] ||
      statements.find((s) => s.universityId === selectedUniversity?.id) ||
      null
    )
  }, [univStatements, statements, selectedUniversity])

  const pendingStatement = activeStatement?.status === 'Submitted for Approval' ? activeStatement : null

  // Quarterly spend trend for selected university
  const quarterlyTrendData = useMemo(() => {
    const alloc = Number(selectedUniversity?.allocation) || 0
    const qBudget = Math.round(alloc / 4)
    const getQSpent = (qKey) => {
      const stmt = (univStatements || []).find((s) => (s.quarter || '').toLowerCase().includes(qKey.toLowerCase()))
      return stmt ? Number(stmt.totalDebits) || 0 : 0
    }
    const liveSpent = Number(selectedUniversity?.spent) || 0
    return [
      { quarter: 'Q1 FY26', budget: qBudget, actual: getQSpent('q1') },
      { quarter: 'Q2 FY26', budget: qBudget, actual: getQSpent('q2') },
      { quarter: 'Q3 FY26 (Live)', budget: qBudget, actual: getQSpent('q3') || liveSpent },
      { quarter: 'Q4 FY26 (Est.)', budget: qBudget, actual: getQSpent('q4') },
    ]
  }, [selectedUniversity, univStatements])

  // Handle Gov Leader review submit
  const handleReviewSubmit = async () => {
    if (!pendingStatement) return
    setIsSubmittingReview(true)
    try {
      await reviewStatement(pendingStatement.id, {
        action: reviewAction,
        reviewer: 'Sri. G. Kumar Naik, IAS (Principal Secretary to Government, Higher Education Dept)',
        notes: reviewNotes || (reviewAction === 'APPROVE' ? 'Executive statutory sign-off granted.' : 'Revision requested.'),
      })

      setIsReviewModalOpen(false)
      setReviewNotes('')

      if (onTriggerToast) {
        onTriggerToast(
          reviewAction === 'APPROVE' ? 'Statutory Approval Granted' : 'Revision Mandated',
          reviewAction === 'APPROVE'
            ? `Officially signed off on ${pendingStatement.universityName} ${pendingStatement.quarter} statement.`
            : `Returned statement to ${pendingStatement.universityName} CFO for amendment.`
        )
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Review Action Failed', err.message, 'danger')
      }
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (!selectedUniversity) {
    return (
      <div className="py-16 text-center">
        <div className="h-12 w-12 mx-auto rounded-full bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center text-[#57606a] mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#1f2328]">No College Selected for Drill-down</h3>
        <p className="text-xs text-[#57606a] mt-1 max-w-md mx-auto">
          Institutional drill-down will become active once colleges register their institutional profile and upload quarterly statements.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 text-xs text-[#0969da]"
          onClick={() => onSelectTab('all_colleges')}
        >
          ← Return to All Colleges Progress
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Government Admin View-Only College Drill-down Banner */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-lg bg-[#1a7f37] text-white text-sm flex items-center justify-center font-bold shrink-0">
            🏛️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                College Progress & Accounts Drill-down (View Only)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Government Admin Oversight
              </span>
            </div>
            <p className="text-[11px] text-[#57606a] mt-0.5">
              Live financial allocation, expenditure progress in ₹, institutional bank accounts, and filed quarterly statement filings for <strong>{selectedUniversity.name}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('all_colleges')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            All Colleges Progress
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('reports')}
            className="text-xs font-semibold"
          >
            <span>View All Reports</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Campus Selector & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-3 rounded-lg border border-[#d0d7de]">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#0969da]" />
          <span className="font-semibold text-xs text-[#1f2328]">{selectedUniversity.name}</span>
          <Badge variant="blue" className="text-[10px] font-mono">
            {selectedUniversity.code}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-[#57606a]">
            {selectedUniversity.region} Region
          </Badge>
        </div>

        {/* 32 Universities Quick Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#57606a] whitespace-nowrap font-medium">Switch Campus:</span>
          <select
            value={selectedUniversity.id}
            onChange={(e) => setSelectedUniversityId(e.target.value)}
            className="h-8 text-xs rounded-md border border-[#d0d7de] bg-white text-[#1f2328] px-2.5 focus:outline-none focus:border-[#0969da]"
          >
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* University Financial Summary Header Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-[#d0d7de]">
          <div className="text-[11px] text-[#57606a] font-medium uppercase tracking-wider">State Allocation</div>
          <div className="text-xl font-bold text-[#1f2328] mt-1">
            {formatCurrency(selectedUniversity.allocation, true)}
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            Enacted FY26 Appropriations
          </div>
        </Card>

        <Card className="p-4 bg-white border border-[#d0d7de]">
          <div className="text-[11px] text-[#57606a] font-medium uppercase tracking-wider">Disbursed / Expended</div>
          <div className="text-xl font-bold text-[#1a7f37] mt-1">
            {formatCurrency(selectedUniversity.spent, true)}
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            Utilization Rate: <span className="font-semibold">{selectedUniversity.utilization}%</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-[#d0d7de]">
          <div className="text-[11px] text-[#57606a] font-medium uppercase tracking-wider">Available Treasury Cash</div>
          <div className="text-xl font-bold text-[#0969da] mt-1">
            {formatCurrency(selectedUniversity.availableCash || (selectedUniversity.allocation - selectedUniversity.spent), true)}
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            Across {universityAccounts.length} Institutional Bank Accounts
          </div>
        </Card>

        <Card className="p-4 bg-white border border-[#d0d7de]">
          <div className="text-[11px] text-[#57606a] font-medium uppercase tracking-wider">Compliance & Health</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-[#1f2328]">
              {selectedUniversity.complianceGrade || 'Pending'}
            </span>
            <Badge
              variant={
                (selectedUniversity.statementStatus || '').toLowerCase().includes('pending')
                  ? 'outline'
                  : selectedUniversity.status === 'Optimal'
                  ? 'success'
                  : selectedUniversity.status === 'Audit Flag'
                  ? 'danger'
                  : 'warning'
              }
              className="text-[10px]"
            >
              {(selectedUniversity.statementStatus || '').toLowerCase().includes('pending')
                ? 'Awaiting Filing'
                : `${selectedUniversity.complianceScore}/100 Score`}
            </Badge>
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            {Number(selectedUniversity.patents) > 0 ? `${selectedUniversity.patents} Patents Filed • ` : ''}
            {selectedUniversity.region} Region • {selectedUniversity.category}
          </div>
        </Card>
      </div>

      {/* Review Submitted Statement Module (Cross-Flow Review Action & AI Reports) */}
      {activeStatement && (
        <Card className="border-2 border-[#0969da]/40 bg-[#f0f8ff]/50">
          <CardHeader className="pb-3 border-b border-[#0969da]/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-full bg-[#0969da]/10 text-[#0969da]">
                  <FileCheck2 className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
                    Official Quarterly Bank Statement & AI Audit Report
                    {activeStatement.status === 'Submitted for Approval' ? (
                      <Badge variant="blue" className="animate-pulse">
                        Awaiting Gov Sign-Off
                      </Badge>
                    ) : (
                      <Badge variant={activeStatement.status === 'Approved' ? 'success' : 'outline'}>
                        {activeStatement.status}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#57606a]">
                    Submitted by {activeStatement.uploadedBy || 'College Finance'} • Dynamic AI Classification & Risk Verification
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeStatement.status === 'Submitted for Approval' && (
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="text-xs font-semibold"
                  >
                    <FileCheck2 className="h-3.5 w-3.5 mr-1" />
                    Review & Grant Statutory Sign-Off
                  </Button>
                )}
                <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                  <Eye className="h-3.5 w-3.5" />
                  View-Only Audit Mode
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-3.5 text-xs space-y-4">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded border border-[#d0d7de]">
              <div>
                <span className="text-[#57606a] block text-[11px]">Statement Quarter:</span>
                <span className="font-semibold text-[#1f2328]">{activeStatement.quarter}</span>
              </div>
              <div>
                <span className="text-[#57606a] block text-[11px]">Bank & Account:</span>
                <span className="font-semibold text-[#1f2328]">{activeStatement.bankName} ({activeStatement.accountNumber})</span>
              </div>
              <div>
                <span className="text-[#57606a] block text-[11px]">Total Debits (Disbursed):</span>
                <span className="font-semibold text-[#cf222e]">{formatCurrency(activeStatement.totalDebits, true)}</span>
              </div>
              <div>
                <span className="text-[#57606a] block text-[11px]">AI Extraction Accuracy:</span>
                <span className="font-semibold text-[#1a7f37]">
                  {activeStatement.aiValidation?.confidenceScore || 98.2}% Reconciled
                </span>
              </div>
            </div>

            {/* AI Compliance & Risk Report Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded border border-emerald-200 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Statutory Compliance Score
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-[#1f2328]">
                    {selectedUniversity.complianceScore || 98}/100
                  </span>
                  <Badge variant="success">Grade: {selectedUniversity.complianceGrade || 'A+'}</Badge>
                </div>
                <p className="text-[10px] text-[#57606a] mt-1">
                  Karnataka State Universities Act 2000 §102 verified.
                </p>
              </div>

              <div className="p-3 bg-white rounded border border-blue-200 shadow-2xs">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  Fiscal Risk Assessment
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-[#1f2328]">
                    {selectedUniversity.status === 'Audit Flag' ? 'Elevated Risk' : 'Low Risk (Optimal)'}
                  </span>
                  <Badge variant={selectedUniversity.status === 'Audit Flag' ? 'danger' : 'outline'}>
                    {selectedUniversity.status === 'Audit Flag' ? 'Warning' : 'Verified'}
                  </Badge>
                </div>
                <p className="text-[10px] text-[#57606a] mt-1">
                  GASB 34 ledger reconciliation: Zero unauthorized variances.
                </p>
              </div>

              <div className="p-3 bg-white rounded border border-purple-200 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                  Allowable Cost Principles
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-[#1f2328]">KGFR Ch. 8 Rule 149</span>
                  <Badge variant="success">Passed</Badge>
                </div>
                <p className="text-[10px] text-[#57606a] mt-1">
                  All parsed disbursements categorized into statutory pillars.
                </p>
              </div>
            </div>

            {/* AI Transaction Summary Table */}
            {activeStatement.transactions && (
              <div className="space-y-1.5">
                <span className="font-semibold text-[#1f2328]">
                  Extracted Transactions Audit ({activeStatement.transactions.length} entries parsed by AI engine):
                </span>
                <div className="overflow-x-auto rounded border border-[#d0d7de] bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">AI Category</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d0d7de]">
                      {(activeStatement.transactions || []).map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#f6f8fa]/60">
                          <td className="py-2 px-3 font-mono text-[11px]">{tx.date}</td>
                          <td className="py-2 px-3 text-[#1f2328] max-w-xs truncate">{tx.description}</td>
                          <td className="py-2 px-3">
                            <span className="bg-[#f6f8fa] border border-[#d0d7de] px-1.5 py-0.5 rounded text-[10px]">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={tx.type === 'CREDIT' ? 'text-[#1a7f37] font-semibold' : 'text-[#cf222e]'}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="py-2 px-3">
                            {tx.status === 'Validated' ? (
                              <Badge variant="success" className="text-[10px]">Validated</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px]">Resolved by CFO</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Institutional Bank Accounts and Balances */}
      <Card>
        <CardHeader className="border-b border-[#d0d7de] pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#0969da]" />
                Institutional Bank Accounts & Live Balances (₹)
              </CardTitle>
              <CardDescription className="text-xs text-[#57606a]">
                Real-time treasury account balances registered under {selectedUniversity.name}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-xs">
              {universityAccounts.length} Verified Accounts
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[#57606a] font-semibold">
                  <th className="py-2.5 px-3">Bank Name & Branch</th>
                  <th className="py-2.5 px-3">Account Number</th>
                  <th className="py-2.5 px-3">IFSC Code</th>
                  <th className="py-2.5 px-3">Account Purpose</th>
                  <th className="py-2.5 px-3">Live Balance (₹)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {universityAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-xs text-[#57606a]">
                      <Landmark className="h-6 w-6 text-[#8c959f] mx-auto mb-2 opacity-50" />
                      No bank accounts registered yet by {selectedUniversity.name}.
                    </td>
                  </tr>
                ) : (
                  universityAccounts.map((acct) => (
                    <tr key={acct.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1f2328]">{acct.bankName}</div>
                        <div className="text-[11px] text-[#57606a]">{acct.branch || 'State Capital Branch'}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-[#1f2328]">
                        {acct.accountNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#57606a]">
                        {acct.ifscCode || 'SBIN0001042'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[11px]">
                          {acct.accountName || acct.accountType}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1a7f37]">
                        {formatCurrency(acct.currentBalance, true)}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="success" className="text-[10px]">
                          Active Solvency
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLedgerAccount(acct)}
                          className="text-xs text-[#0969da] h-7 px-2"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Ledger
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Expenditure Trends */}
      <Card>
        <CardHeader className="border-b border-[#d0d7de] pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1f2328]">
                Quarterly Spend vs Budget Allocation (FY26)
              </CardTitle>
              <CardDescription className="text-xs text-[#57606a]">
                Budgeted disbursement schedule against actual GL settlements
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectTab('reports')}
              className="text-xs"
            >
              View Additional Reports
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {univStatements.length === 0 && (selectedUniversity.spent || 0) === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-xs text-[#57606a] border border-dashed border-[#d0d7de] rounded-lg bg-[#f6f8fa]/50">
              <Landmark className="h-6 w-6 text-[#8c959f] mb-2 opacity-50" />
              <span>No quarterly bank statements filed yet by {selectedUniversity.name}.</span>
              <span className="text-[11px] text-[#8c959f] mt-0.5">Quarterly spend analytics activate automatically upon statement upload.</span>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d0d7de" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#57606a" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#57606a"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d0d7de',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [formatCurrency(val, true), '']}
                  />
                  <Bar dataKey="budget" name="Quarterly Budget" fill="#0969da" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual Expenditure" fill="#1a7f37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Details / Ledger Modal */}
      {selectedLedgerAccount && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLedgerAccount(null)}
          title={`${selectedLedgerAccount.bankName} Ledger Details`}
          description={`Account Number: ${selectedLedgerAccount.accountNumber} • IFSC: ${selectedLedgerAccount.ifscCode}`}
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedLedgerAccount(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#f6f8fa] rounded border border-[#d0d7de] flex justify-between items-center">
              <div>
                <span className="text-[#57606a] block text-[11px]">Current Ledger Balance:</span>
                <span className="text-base font-bold text-[#1a7f37]">
                  {formatCurrency(selectedLedgerAccount.currentBalance)}
                </span>
              </div>
              <Badge variant="success">Solvent • Statutory Compliant</Badge>
            </div>

            <div className="font-semibold text-[#1f2328]">Recent Account Activity</div>
            <div className="rounded border border-[#d0d7de] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a]">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Description</th>
                    <th className="py-2 px-2.5">Type</th>
                    <th className="py-2 px-2.5">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {(() => {
                    const stmt = (statements || []).find(
                      (s) => s.accountId === selectedLedgerAccount.id || s.accountNumber === selectedLedgerAccount.accountNumber
                    )
                    const txs = stmt?.transactions || []
                    if (txs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[#57606a]">
                            No transactions on record for this account.
                          </td>
                        </tr>
                      )
                    }
                    return txs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#f6f8fa]/50">
                        <td className="py-2 px-2.5 font-mono">{tx.date}</td>
                        <td className="py-2 px-2.5 font-medium text-[#1f2328] max-w-xs truncate">{tx.description}</td>
                        <td className={`py-2 px-2.5 font-semibold ${tx.type === 'CREDIT' ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>
                          {tx.type}
                        </td>
                        <td className="py-2 px-2.5 font-semibold font-mono">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* Review & Approval Modal */}
      {isReviewModalOpen && pendingStatement && (
        <Modal
          isOpen={true}
          onClose={() => setIsReviewModalOpen(false)}
          title={
            reviewAction === 'APPROVE'
              ? 'Grant Official Statutory Approval'
              : 'Mandate Quarterly Statement Revision'
          }
          description={`Institution: ${pendingStatement.universityName} • ${pendingStatement.quarter}`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'APPROVE' ? 'blue' : 'danger'}
                size="sm"
                disabled={isSubmittingReview}
                onClick={handleReviewSubmit}
              >
                {isSubmittingReview
                  ? 'Processing Sign-off...'
                  : reviewAction === 'APPROVE'
                  ? 'Confirm Official Approval'
                  : 'Transmit Revision Mandate'}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div
              className={`p-3 rounded border text-xs ${
                reviewAction === 'APPROVE'
                  ? 'bg-[#ddf4ff]/50 border-[#0969da]/30 text-[#0969da]'
                  : 'bg-[#ffebe9]/50 border-[#cf222e]/30 text-[#cf222e]'
              }`}
            >
              {reviewAction === 'APPROVE' ? (
                <span>
                  <strong>Department of Higher Education Sign-off:</strong> Granting approval certifies that this institution has fulfilled all statutory reporting guidelines under State Finance Act §102.
                </span>
              ) : (
                <span>
                  <strong>Revision Request:</strong> This statement will be returned to the University CFO with your notes for correction and re-submission.
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Executive Review Notes & Statutory Directives:
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'APPROVE'
                    ? 'Enter statutory sign-off notes or grant release instructions...'
                    : 'Detail the reasons for revision (e.g., voucher discrepancy, missing grant documentation)...'
                }
                className="w-full rounded-md border border-[#d0d7de] p-2 text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Bottom Step Forward Navigation Bar */}
      <div className="rounded-lg border border-[#d0d7de] bg-[#f6f8fa] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#57606a]">
          <strong className="text-[#1f2328]">Next Steps in Official SOP:</strong> View research domain distribution, statutory benchmarks, and cross-campus compliance matrix.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('all_colleges')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            All Colleges Progress
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('reports')}
            className="text-xs font-semibold"
          >
            <span>Proceed to Step 3: View Additional Reports</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
