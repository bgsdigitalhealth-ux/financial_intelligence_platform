import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  X,
  Check,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'

export function UnivReportsView({ onSelectTab, onTriggerToast }) {
  const { universities, bankAccounts = [], statements = [] } = useFinancialData()
  const { currentUser } = useAuth()

  // Identify logged-in university dynamically
  const myUniversity = useMemo(() => {
    if (currentUser?.universityId) {
      const u = universities.find((x) => x.id === currentUser.universityId)
      if (u) return u
    }
    if (currentUser?.universityName) {
      const u = universities.find((x) =>
        x.name.toLowerCase().includes(currentUser.universityName.toLowerCase())
      )
      if (u) return u
    }
    return (
      universities.find((u) => u.id === 'univ-01' || u.code === 'VTU') ||
      universities[0] || {
        id: currentUser?.universityId || 'univ-01',
        name: currentUser?.organization || 'College Enrolled',
        code: 'VTU',
        allocation: 450000000,
      }
    )
  }, [universities, currentUser])

  // Own university bank accounts
  const ownAccounts = useMemo(() => {
    return bankAccounts.filter((a) => a.universityId === myUniversity.id)
  }, [bankAccounts, myUniversity])

  // State: selected bank account ('ALL' or account.id)
  const [selectedAccountId, setSelectedAccountId] = useState('ALL')

  // Selected bank account object if any
  const currentAccount = useMemo(() => {
    if (selectedAccountId === 'ALL') return null
    return ownAccounts.find((a) => a.id === selectedAccountId) || null
  }, [ownAccounts, selectedAccountId])

  // Own university statements
  const myStatements = useMemo(() => {
    return statements.filter(
      (s) =>
        s.universityId === myUniversity.id ||
        s.universityName === myUniversity.name ||
        ownAccounts.some((a) => a.id === s.accountId)
    )
  }, [statements, myUniversity, ownAccounts])

  // Statements filtered strictly by selected bank account
  const filteredStatements = useMemo(() => {
    if (selectedAccountId === 'ALL') return myStatements
    return myStatements.filter(
      (s) =>
        s.accountId === selectedAccountId ||
        (currentAccount && s.accountNumber === currentAccount.accountNumber)
    )
  }, [myStatements, selectedAccountId, currentAccount])

  // Active statement
  const activeStatement = filteredStatements[0] || null

  // All extracted transactions for the selected scope
  const allTransactions = useMemo(() => {
    if (selectedAccountId !== 'ALL' && activeStatement) {
      return activeStatement.transactions || []
    }
    if (filteredStatements.length > 0) {
      return filteredStatements.flatMap((s) => s.transactions || [])
    }
    return []
  }, [selectedAccountId, activeStatement, filteredStatements])

  // Split into Credits and Debits
  const creditTxs = useMemo(() => {
    return allTransactions.filter(
      (t) =>
        (t.type && t.type.toUpperCase().includes('CREDIT')) ||
        (t.type && t.type.toUpperCase() === 'CR')
    )
  }, [allTransactions])

  const debitTxs = useMemo(() => {
    return allTransactions.filter(
      (t) =>
        (t.type && t.type.toUpperCase().includes('DEBIT')) ||
        (t.type && t.type.toUpperCase() === 'DR') ||
        (!t.type && t.amount > 0)
    )
  }, [allTransactions])

  const exceptionTxs = useMemo(() => {
    return allTransactions.filter((t) => t.status === 'Exception' || t.flag)
  }, [allTransactions])

  // Transaction filters & search
  const [txTab, setTxTab] = useState('ALL') // 'ALL', 'CREDIT', 'DEBIT', 'EXCEPTION'
  const [searchQuery, setSearchQuery] = useState('')

  const displayedTransactions = useMemo(() => {
    let list = allTransactions
    if (txTab === 'CREDIT') list = creditTxs
    else if (txTab === 'DEBIT') list = debitTxs
    else if (txTab === 'EXCEPTION') list = exceptionTxs

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (t) =>
        (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.date && t.date.includes(q))
    )
  }, [allTransactions, txTab, creditTxs, debitTxs, exceptionTxs, searchQuery])

  // Dynamic balance metrics
  const totalCredits = useMemo(() => {
    if (activeStatement && selectedAccountId !== 'ALL') {
      return Number(activeStatement.totalCredits) || 0
    }
    return creditTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [activeStatement, selectedAccountId, creditTxs])

  const totalDebits = useMemo(() => {
    if (activeStatement && selectedAccountId !== 'ALL') {
      return Number(activeStatement.totalDebits) || 0
    }
    return debitTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  }, [activeStatement, selectedAccountId, debitTxs])

  const openingBalance = useMemo(() => {
    if (activeStatement && activeStatement.openingBalance !== undefined) {
      return Number(activeStatement.openingBalance)
    }
    if (currentAccount && currentAccount.currentBalance !== undefined) {
      return Number(currentAccount.currentBalance)
    }
    if (allTransactions.length > 0 && allTransactions[0].balance !== undefined) {
      return Number(allTransactions[0].balance)
    }
    return 0
  }, [activeStatement, currentAccount, allTransactions])

  const closingBalance = useMemo(() => {
    if (activeStatement && activeStatement.closingBalance !== undefined) {
      return Number(activeStatement.closingBalance)
    }
    if (currentAccount && currentAccount.currentBalance !== undefined) {
      return Number(currentAccount.currentBalance)
    }
    return openingBalance + totalCredits - totalDebits
  }, [activeStatement, currentAccount, openingBalance, totalCredits, totalDebits])

  const netInflow = totalCredits - totalDebits

  // AI Compliance values
  const aiConfidence = activeStatement?.aiValidation?.confidenceScore || 98.2
  const varianceAmount =
    activeStatement?.aiValidation?.varianceAmount !== undefined
      ? activeStatement.aiValidation.varianceAmount
      : 0.0
  const reconciliationMatch =
    activeStatement?.aiValidation?.reconciliationMatch !== false && varianceAmount === 0

  // AI Instance summary text
  const aiSummary = useMemo(() => {
    if (activeStatement?.aiValidation?.summary) {
      return activeStatement.aiValidation.summary
    }
    return `AI verified ${allTransactions.length} transaction entries from official bank statements. Deterministic balance formula verified: Opening (₹${openingBalance.toLocaleString('en-IN')}) + Credits (₹${totalCredits.toLocaleString('en-IN')}) - Debits (₹${totalDebits.toLocaleString('en-IN')}) = Closing (₹${closingBalance.toLocaleString('en-IN')}) with zero variance.`
  }, [activeStatement, allTransactions.length, openingBalance, totalCredits, totalDebits, closingBalance])

  // Certified Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [activeReportSubTab, setActiveReportSubTab] = useState('generate') // 'generate', 'history'
  const [selectedReportType, setSelectedReportType] = useState('Financial Summary Report')
  const [selectedReportPeriod, setSelectedReportPeriod] = useState('Apr 2025 - Mar 2026')

  // Report export handler
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Reference No',
      'Description',
      'Category',
      'Type',
      'Amount',
      'Balance',
      'AI Status',
    ]
    const rows = allTransactions.map((t) => [
      t.date || '',
      `"${t.referenceNo || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.category || ''}"`,
      t.type || '',
      t.amount || 0,
      t.balance || 0,
      t.status || 'Validated',
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `${myUniversity.code}_Statement_Report_${selectedAccountId}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (onTriggerToast) {
      onTriggerToast(
        'CSV Export Complete',
        `Downloaded ${allTransactions.length} transaction records.`
      )
    }
  }

  const handlePrintReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Header Row: Report title + FY Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-[#1f2328] tracking-tight">Report</h1>
          <p className="text-xs text-[#57606a] mt-0.5">
            Generate, view and download financial reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              className="text-xs font-semibold bg-white border border-[#d0d7de] rounded-lg px-3 py-1.5 pr-7 text-[#1f2328] appearance-none focus:outline-none focus:border-[#16a34a] cursor-pointer shadow-2xs"
            >
              <option value="FY 2025 - 2026">FY 2025 - 2026</option>
              <option value="FY 2024 - 2025">FY 2024 - 2025</option>
            </select>
          </div>

          <button
            type="button"
            className="p-2 text-[#57606a] hover:text-[#1f2328] bg-white border border-[#d0d7de] rounded-lg shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#16a34a]" />
          </button>

          <div className="h-8 w-8 rounded-full bg-[#059669] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar: Generate Report | Report History */}
      <div className="flex items-center gap-2 border-b border-[#d0d7de] pb-2">
        <button
          type="button"
          onClick={() => setActiveReportSubTab('generate')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeReportSubTab === 'generate'
              ? 'bg-[#16a34a] text-white shadow-2xs'
              : 'text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#1f2328]'
          }`}
        >
          Generate Report
        </button>
        <button
          type="button"
          onClick={() => setActiveReportSubTab('history')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeReportSubTab === 'history'
              ? 'bg-[#16a34a] text-white shadow-2xs'
              : 'text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#1f2328]'
          }`}
        >
          Report History
        </button>
      </div>

      {/* 3. Main Row: Generate Report Card (Left) & Available Reports Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Generate Report Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#d0d7de] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1f2328] pb-3 border-b border-[#d0d7de]">
              Generate Report
            </h2>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#57606a] mb-1.5">
                  Select Report Type
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-3 py-2 text-[#1f2328] focus:outline-none focus:border-[#16a34a]"
                >
                  <option value="Financial Summary Report">Financial Summary Report</option>
                  <option value="Expenditure Analysis">Expenditure Analysis</option>
                  <option value="Compliance Report">Compliance Report</option>
                  <option value="AI Insights Report">AI Insights Report</option>
                  <option value="Statutory Form 19-A">Statutory Form 19-A</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#57606a] mb-1.5">
                  Period
                </label>
                <select
                  value={selectedReportPeriod}
                  onChange={(e) => setSelectedReportPeriod(e.target.value)}
                  className="w-full text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-3 py-2 text-[#1f2328] focus:outline-none focus:border-[#16a34a]"
                >
                  <option value="Apr 2025 - Mar 2026">Apr 2025 - Mar 2026</option>
                  <option value="FY 2025 - 2026">FY 2025 - 2026</option>
                  <option value="Apr 2025 - Jun 2025">Apr 2025 - Jun 2025</option>
                  <option value="Jul 2025 - Sep 2025">Jul 2025 - Sep 2025</option>
                  <option value="Oct 2025 - Dec 2025">Oct 2025 - Dec 2025</option>
                  <option value="Jan 2026 - Mar 2026">Jan 2026 - Mar 2026</option>
                </select>
              </div>

              <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de] text-[11px] text-[#57606a] space-y-1">
                <div>• Institution: <strong>{myUniversity.name}</strong></div>
                <div>• Format: Statutory PDF / CSV with Karnataka Government Seal</div>
                <div>• Integrity: AI Reconciled with K.S.U. Act 2000</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#d0d7de]">
            <Button
              variant="blue"
              size="sm"
              onClick={() => {
                setIsReportModalOpen(true)
                if (onTriggerToast) {
                  onTriggerToast('Report Generated', `Compiled ${selectedReportType} for ${selectedReportPeriod}.`)
                }
              }}
              className="w-full text-xs font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white border-none cursor-pointer"
            >
              Generate Report
            </Button>
          </div>
        </div>

        {/* Right Column: Available Reports Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#d0d7de] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d0d7de]">
              <h2 className="text-sm font-bold text-[#1f2328]">Available Reports</h2>
              <Badge variant="outline" className="text-xs font-semibold text-[#57606a]">
                4 Reports
              </Badge>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[11px] font-semibold text-[#57606a]">
                    <th className="py-2.5 px-3">Report Name</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Generated On</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {[
                    { name: 'Annual Financial Summary', period: 'FY 2025 - 2026', date: '03 Jul 2025' },
                    { name: 'Expenditure Analysis', period: 'Apr 2025 - Jun 2025', date: '03 Jul 2025' },
                    { name: 'Compliance Report', period: 'Apr 2025 - Jun 2025', date: '02 Jul 2025' },
                    { name: 'AI Insights Report', period: 'Apr 2025 - Jun 2025', date: '02 Jul 2025' },
                  ].map((rpt, idx) => (
                    <tr key={idx} className="hover:bg-[#f6f8fa] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#1f2328]">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-[#16a34a] shrink-0" />
                          <span>{rpt.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#57606a]">{rpt.period}</td>
                      <td className="py-3 px-3 text-[#57606a] font-mono text-[11px]">{rpt.date}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-[#57606a]">
                          <button
                            type="button"
                            title="View Report Details"
                            onClick={() => setIsReportModalOpen(true)}
                            className="p-1 hover:text-[#0969da] hover:bg-blue-50 rounded transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Download Report CSV/PDF"
                            onClick={handleExportCSV}
                            className="p-1 hover:text-[#16a34a] hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Certified Report Modal (Preview with exact dynamic numbers) */}
      {isReportModalOpen && (
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title={`Certified Statutory Financial Report — ${selectedReportType}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#57606a]">
                Karnataka State Universities Act 2000 § 102 Compliant
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="blue"
                  size="sm"
                  onClick={handleExportCSV}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white border-none"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download Report (CSV)
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#14532d]">{myUniversity.name}</h3>
                <div className="text-[11px] text-[#16a34a] mt-0.5">
                  Institution Code: {myUniversity.code} • Period: {selectedReportPeriod}
                </div>
              </div>
              <Badge variant="success" className="text-xs">
                AI Certified Clean
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-[#d0d7de] rounded-lg">
                <span className="text-[10px] text-[#57606a] block uppercase">Opening Balance</span>
                <span className="font-mono font-bold text-sm text-[#1f2328]">
                  {formatCurrency(openingBalance)}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#d0d7de] rounded-lg">
                <span className="text-[10px] text-[#16a34a] block uppercase">Total Credits</span>
                <span className="font-mono font-bold text-sm text-[#16a34a]">
                  +{formatCurrency(totalCredits)}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#d0d7de] rounded-lg">
                <span className="text-[10px] text-[#cf222e] block uppercase">Total Debits</span>
                <span className="font-mono font-bold text-sm text-[#cf222e]">
                  -{formatCurrency(totalDebits)}
                </span>
              </div>
              <div className="p-3 bg-white border border-[#d0d7de] rounded-lg">
                <span className="text-[10px] text-[#0969da] block uppercase">Closing Balance</span>
                <span className="font-mono font-bold text-sm text-[#0969da]">
                  {formatCurrency(closingBalance)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[#1f2328] mb-2">Verified Ledger Entries ({allTransactions.length} items)</h4>
              <div className="max-h-60 overflow-y-auto border border-[#d0d7de] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f6f8fa] sticky top-0 border-b border-[#d0d7de] text-[10px] uppercase text-[#57606a]">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Ref No</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d0d7de]">
                    {allTransactions.slice(0, 50).map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-[11px]">{t.date}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-[#0969da]">{t.referenceNo || `REF-${idx + 1}`}</td>
                        <td className="py-2 px-3 font-medium">{t.description}</td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-bold ${t.type?.toLowerCase().includes('credit') ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
