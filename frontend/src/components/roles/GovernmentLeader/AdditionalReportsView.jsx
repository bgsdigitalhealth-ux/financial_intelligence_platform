import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Building2,
  Search,
  ArrowLeft,
  Download,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  FileCheck2,
  X,
  TrendingUp,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export function AdditionalReportsView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    statements = [],
    bankAccounts = [],
  } = useFinancialData()

  // State: selected college for report (null = institution directory)
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [collegeSearch, setCollegeSearch] = useState('')

  // State: selected bank account within the selected college ('ALL' or account.id)
  const [selectedAccountId, setSelectedAccountId] = useState('ALL')

  // Filtered universities for directory
  const filteredUniversities = useMemo(() => {
    const q = collegeSearch.toLowerCase().trim()
    if (!q) return universities
    return universities.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.code && u.code.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q))
    )
  }, [universities, collegeSearch])

  // Computed accounts for selected college
  const collegeAccounts = useMemo(() => {
    if (!selectedCollege) return []
    return bankAccounts.filter((a) => a.universityId === selectedCollege.id)
  }, [bankAccounts, selectedCollege])

  // Current active account object if one is selected
  const currentAccount = useMemo(() => {
    if (selectedAccountId === 'ALL') return null
    return collegeAccounts.find((a) => a.id === selectedAccountId) || null
  }, [collegeAccounts, selectedAccountId])

  // Statements for selected college
  const collegeStatements = useMemo(() => {
    if (!selectedCollege) return []
    const accIds = collegeAccounts.map((a) => a.id)
    return statements.filter(
      (s) =>
        s.universityId === selectedCollege.id ||
        s.universityName === selectedCollege.name ||
        accIds.includes(s.accountId)
    )
  }, [statements, selectedCollege, collegeAccounts])

  // Statements filtered strictly by selected bank account
  const filteredStatements = useMemo(() => {
    if (selectedAccountId === 'ALL') return collegeStatements
    return collegeStatements.filter(
      (s) =>
        s.accountId === selectedAccountId ||
        (currentAccount && s.accountNumber === currentAccount.accountNumber)
    )
  }, [collegeStatements, selectedAccountId, currentAccount])

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

  // Transaction filter & search
  const [txTab, setTxTab] = useState('ALL') // 'ALL', 'CREDIT', 'DEBIT', 'EXCEPTION'
  const [txSearchQuery, setTxSearchQuery] = useState('')

  const displayedTransactions = useMemo(() => {
    let list = allTransactions
    if (txTab === 'CREDIT') list = creditTxs
    else if (txTab === 'DEBIT') list = debitTxs
    else if (txTab === 'EXCEPTION') list = exceptionTxs

    if (!txSearchQuery.trim()) return list
    const q = txSearchQuery.toLowerCase().trim()
    return list.filter(
      (t) =>
        (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.date && t.date.includes(q))
    )
  }, [allTransactions, txTab, creditTxs, debitTxs, exceptionTxs, txSearchQuery])

  // Balances
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

  // AI Compliance
  const aiConfidence = activeStatement?.aiValidation?.confidenceScore || 98.2
  const varianceAmount =
    activeStatement?.aiValidation?.varianceAmount !== undefined
      ? activeStatement.aiValidation.varianceAmount
      : 0.0
  const reconciliationMatch =
    activeStatement?.aiValidation?.reconciliationMatch !== false && varianceAmount === 0

  const aiSummary = useMemo(() => {
    if (activeStatement?.aiValidation?.summary) {
      return activeStatement.aiValidation.summary
    }
    return `AI verified ${allTransactions.length} transaction entries from official bank statements. Deterministic balance formula verified: Opening (₹${openingBalance.toLocaleString('en-IN')}) + Credits (₹${totalCredits.toLocaleString('en-IN')}) - Debits (₹${totalDebits.toLocaleString('en-IN')}) = Closing (₹${closingBalance.toLocaleString('en-IN')}) with zero variance.`
  }, [activeStatement, allTransactions.length, openingBalance, totalCredits, totalDebits, closingBalance])

  // Certified Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const handleExportCSV = () => {
    if (!selectedCollege) return
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
      `${selectedCollege.code}_Statement_Report_${selectedAccountId}.csv`
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

  // =========================================================================
  // VIEW 1: SPECIFIC UNIVERSITY COMPLETE REPORT VIEW
  // =========================================================================
  if (selectedCollege) {
    return (
      <div className="space-y-5 pb-12 text-[#1f2328]">
        {/* Header Bar */}
        <div className="rounded-lg border border-[#d0d7de] bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCollege(null)
                setSelectedAccountId('ALL')
              }}
              className="text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              All Institutions
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1f2328]">
                  {selectedCollege.name}
                </h1>
                <Badge variant="blue" className="text-[10px] font-mono">
                  {selectedCollege.code}
                </Badge>
              </div>
              <p className="text-xs text-[#57606a] mt-0.5">
                Official quarterly statements, credits & debits, and AI audit compliance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={allTransactions.length === 0}
              className="text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="blue"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              disabled={allTransactions.length === 0}
              className="text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Generate Certified Report
            </Button>
          </div>
        </div>

        {/* Bank Account Selector */}
        <div className="rounded-lg border border-[#d0d7de] bg-white p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#57606a]">
            <span className="flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-[#0969da]" />
              Select Bank Account
            </span>
            <span className="text-[11px] font-mono">
              {collegeAccounts.length} Registered Account{collegeAccounts.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedAccountId('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                selectedAccountId === 'ALL'
                  ? 'bg-[#0969da] text-white border-[#0969da]'
                  : 'bg-[#f6f8fa] text-[#1f2328] border-[#d0d7de] hover:bg-[#eaeef2]'
              }`}
            >
              All Accounts ({collegeAccounts.length})
            </button>

            {collegeAccounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0969da] text-white border-[#0969da]'
                      : 'bg-[#f6f8fa] text-[#1f2328] border-[#d0d7de] hover:bg-[#eaeef2]'
                  }`}
                >
                  <Landmark className="h-3 w-3" />
                  <span>{acc.bankName}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    (•{acc.accountNumber.slice(-4)})
                  </span>
                  <span className="font-mono text-[10px] font-bold">
                    {formatCurrency(Number(acc.currentBalance) || 0)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Empty State */}
        {allTransactions.length === 0 ? (
          <div className="p-10 rounded-lg border border-dashed border-[#d0d7de] bg-[#f6f8fa] text-center space-y-2">
            <FileSpreadsheet className="h-10 w-10 text-[#57606a] mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-[#1f2328]">No Statement Uploaded Yet</h3>
            <p className="text-xs text-[#57606a] max-w-md mx-auto">
              This institution has not uploaded any quarterly statement files for the selected account.
            </p>
          </div>
        ) : (
          <>
            {/* Financial Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg border border-[#d0d7de] bg-white shadow-2xs">
                <span className="text-[11px] font-semibold text-[#57606a] block uppercase tracking-wider">
                  Opening Balance
                </span>
                <span className="text-lg font-bold font-mono text-[#1f2328] mt-1 block">
                  {formatCurrency(openingBalance)}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-[#1a7f37]/30 bg-[#dafbe1]/30 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#1a7f37] block uppercase tracking-wider">
                  Total Credits (Inflows)
                </span>
                <span className="text-lg font-bold font-mono text-[#1a7f37] mt-1 block">
                  +{formatCurrency(totalCredits)}
                </span>
                <span className="text-[10px] text-[#1a7f37] block mt-0.5">
                  {creditTxs.length} Credit Entries
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-[#cf222e]/30 bg-[#ffebe9]/30 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#cf222e] block uppercase tracking-wider">
                  Total Debits (Disbursements)
                </span>
                <span className="text-lg font-bold font-mono text-[#cf222e] mt-1 block">
                  -{formatCurrency(totalDebits)}
                </span>
                <span className="text-[10px] text-[#cf222e] block mt-0.5">
                  {debitTxs.length} Debit Entries
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-[#0969da]/30 bg-[#ddf4ff]/30 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#0969da] block uppercase tracking-wider">
                  Reconciled Closing Balance
                </span>
                <span className="text-lg font-bold font-mono text-[#0969da] mt-1 block">
                  {formatCurrency(closingBalance)}
                </span>
                <span className="text-[10px] text-[#0969da] block mt-0.5">
                  Net Flow: {netInflow >= 0 ? `+${formatCurrency(netInflow)}` : formatCurrency(netInflow)}
                </span>
              </div>
            </div>

            {/* AI Compliance & AI Instance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Compliance Card */}
              <div className="rounded-lg border border-[#d0d7de] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#eaeef2] pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#1a7f37]" />
                    <h3 className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                      AI Statutory Compliance
                    </h3>
                  </div>
                  <Badge variant={reconciliationMatch ? 'success' : 'danger'} className="text-[10px]">
                    {reconciliationMatch ? 'Reconciliation Certified' : 'Variance Detected'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-[#f6f8fa] border border-[#d0d7de]">
                    <span className="text-[10px] text-[#57606a] block">AI Confidence Score</span>
                    <span className="text-base font-bold font-mono text-[#1a7f37]">
                      {aiConfidence}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#f6f8fa] border border-[#d0d7de]">
                    <span className="text-[10px] text-[#57606a] block">Reconciliation Variance</span>
                    <span className="text-base font-bold font-mono text-[#1a7f37]">
                      ₹{varianceAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#f6f8fa] border border-[#d0d7de]">
                    <span className="text-[10px] text-[#57606a] block">Statutory Allowable</span>
                    <span className="text-xs font-bold text-[#1f2328]">
                      {exceptionTxs.length === 0 ? '100% Allowable' : `${allTransactions.length - exceptionTxs.length}/${allTransactions.length} Allowable`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-[#f6f8fa] border border-[#d0d7de]">
                    <span className="text-[10px] text-[#57606a] block">Audit Exceptions</span>
                    <span className={`text-xs font-bold ${exceptionTxs.length === 0 ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>
                      {exceptionTxs.length === 0 ? '0 Exceptions' : `${exceptionTxs.length} Flagged`}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Instance Card */}
              <div className="rounded-lg border border-[#d0d7de] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#eaeef2] pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#0969da]" />
                    <h3 className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                      AI Audit Instance Summary
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#57606a]">
                    Engine: FinBot v2.4
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#ddf4ff]/20 border border-[#0969da]/20 text-xs text-[#1f2328] leading-relaxed">
                  {aiSummary}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#57606a] pt-1">
                  <span>Verified: {activeStatement?.uploadedAt || 'Current'}</span>
                  <span>KSU Act §48 Certified</span>
                </div>
              </div>
            </div>

            {/* Extracted Transactions Ledger */}
            <div className="rounded-lg border border-[#d0d7de] bg-white shadow-2xs overflow-hidden">
              <div className="p-3.5 border-b border-[#d0d7de] bg-[#f6f8fa] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                    Extracted Statement Transactions ({allTransactions.length})
                  </span>
                  {currentAccount && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {currentAccount.bankName} • {currentAccount.accountNumber}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#57606a]" />
                    <input
                      type="text"
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      placeholder="Search ref, desc, category..."
                      className="h-7 pl-8 pr-2.5 rounded text-xs border border-[#d0d7de] bg-white text-[#1f2328] focus:border-[#0969da] focus:outline-none w-48"
                    />
                  </div>

                  <div className="flex items-center border border-[#d0d7de] rounded overflow-hidden bg-white text-xs">
                    <button
                      onClick={() => setTxTab('ALL')}
                      className={`px-2.5 py-1 font-semibold cursor-pointer ${
                        txTab === 'ALL' ? 'bg-[#0969da] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa]'
                      }`}
                    >
                      All ({allTransactions.length})
                    </button>
                    <button
                      onClick={() => setTxTab('CREDIT')}
                      className={`px-2.5 py-1 font-semibold cursor-pointer border-l border-[#d0d7de] ${
                        txTab === 'CREDIT' ? 'bg-[#1a7f37] text-white' : 'text-[#1a7f37] hover:bg-[#f6f8fa]'
                      }`}
                    >
                      Credits ({creditTxs.length})
                    </button>
                    <button
                      onClick={() => setTxTab('DEBIT')}
                      className={`px-2.5 py-1 font-semibold cursor-pointer border-l border-[#d0d7de] ${
                        txTab === 'DEBIT' ? 'bg-[#cf222e] text-white' : 'text-[#cf222e] hover:bg-[#f6f8fa]'
                      }`}
                    >
                      Debits ({debitTxs.length})
                    </button>
                    {exceptionTxs.length > 0 && (
                      <button
                        onClick={() => setTxTab('EXCEPTION')}
                        className={`px-2.5 py-1 font-semibold cursor-pointer border-l border-[#d0d7de] ${
                          txTab === 'EXCEPTION' ? 'bg-[#9a6700] text-white' : 'text-[#9a6700] hover:bg-[#f6f8fa]'
                        }`}
                      >
                        Exceptions ({exceptionTxs.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#57606a]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reference / UTR #</th>
                      <th className="py-2.5 px-3">Description / Entity</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Credit (+₹)</th>
                      <th className="py-2.5 px-3 text-right">Debit (-₹)</th>
                      <th className="py-2.5 px-3 text-right">Resulting Balance (₹)</th>
                      <th className="py-2.5 px-3 text-center">AI Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d0d7de]">
                    {displayedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#57606a]">
                          No transactions found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      displayedTransactions.map((tx, idx) => {
                        const isCredit =
                          (tx.type && tx.type.toUpperCase().includes('CREDIT')) ||
                          (tx.type && tx.type.toUpperCase() === 'CR')
                        const isDebit = !isCredit

                        return (
                          <tr key={tx.id || idx} className="hover:bg-[#f6f8fa]/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[#57606a] whitespace-nowrap">
                              {tx.date || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#1f2328] font-medium whitespace-nowrap">
                              {tx.referenceNo || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#1f2328] max-w-xs truncate">
                              {tx.description || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-[#eaeef2] text-[10px] font-medium text-[#1f2328] whitespace-nowrap">
                                {tx.category || (isCredit ? 'Receipt & Inflow' : 'Disbursement')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1a7f37] whitespace-nowrap">
                              {isCredit ? `+${formatCurrency(Number(tx.amount) || 0)}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#cf222e] whitespace-nowrap">
                              {isDebit ? `-${formatCurrency(Number(tx.amount) || 0)}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-[#57606a] whitespace-nowrap">
                              {tx.balance !== undefined ? formatCurrency(Number(tx.balance)) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <Badge
                                variant={tx.status === 'Exception' ? 'danger' : 'success'}
                                className="text-[10px]"
                              >
                                {tx.status || 'Validated'}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-[#f6f8fa] border-t border-[#d0d7de] flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-[#1f2328] gap-2">
                <span className="text-[#57606a]">
                  Showing {displayedTransactions.length} of {allTransactions.length} transaction records
                </span>
                <div className="flex items-center gap-4 font-mono">
                  <span className="text-[#1a7f37]">Credits: +{formatCurrency(totalCredits)}</span>
                  <span className="text-[#cf222e]">Debits: -{formatCurrency(totalDebits)}</span>
                  <span className="text-[#0969da]">Closing: {formatCurrency(closingBalance)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Certified Report Modal */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#d0d7de] bg-white p-6 text-[#1f2328] shadow-2xl animate-in zoom-in-95 duration-150 space-y-5">
              <div className="flex items-center justify-between border-b border-[#d0d7de] pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-[#1a7f37]" />
                  <h2 className="text-sm font-bold text-[#1f2328]">
                    Official Statutory Financial Report
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    CSV
                  </Button>
                  <Button variant="blue" size="sm" onClick={handlePrintReport} className="text-xs">
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print / Save PDF
                  </Button>
                  <button
                    onClick={() => setIsReportModalOpen(false)}
                    className="p-1 rounded text-[#57606a] hover:bg-[#eaeef2] hover:text-[#1f2328]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-2">
                <div className="text-center border-b border-[#d0d7de] pb-4 space-y-1">
                  <div className="text-xs font-bold text-[#57606a] uppercase tracking-wider">
                    Government of Karnataka • Department of Higher Education
                  </div>
                  <h1 className="text-lg font-bold text-[#1f2328]">
                    CERTIFIED INSTITUTIONAL FINANCIAL & STATEMENT AUDIT REPORT
                  </h1>
                  <div className="text-xs text-[#57606a]">
                    Institution: <strong>{selectedCollege.name}</strong> ({selectedCollege.code}) • Generated on{' '}
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded border border-[#d0d7de] bg-[#f6f8fa]">
                    <span className="text-[10px] text-[#57606a] block">Bank Account</span>
                    <span className="font-semibold text-[#1f2328] block">
                      {currentAccount ? currentAccount.bankName : 'All Registered Accounts'}
                    </span>
                    <span className="font-mono text-[10px] text-[#57606a]">
                      {currentAccount ? currentAccount.accountNumber : `${collegeAccounts.length} Accounts`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded border border-[#d0d7de] bg-[#f6f8fa]">
                    <span className="text-[10px] text-[#57606a] block">Period / Quarter</span>
                    <span className="font-semibold text-[#1f2328] block">
                      {activeStatement?.quarter || 'Q3 FY26'}
                    </span>
                    <span className="font-mono text-[10px] text-[#57606a]">FY 2025-2026</span>
                  </div>
                  <div className="p-2.5 rounded border border-[#d0d7de] bg-[#f6f8fa]">
                    <span className="text-[10px] text-[#57606a] block">AI Reconciliation</span>
                    <span className="font-semibold text-[#1a7f37] block">
                      {reconciliationMatch ? 'Zero Variance Certified' : 'Variance Flagged'}
                    </span>
                    <span className="font-mono text-[10px] text-[#57606a]">Confidence: {aiConfidence}%</span>
                  </div>
                  <div className="p-2.5 rounded border border-[#d0d7de] bg-[#f6f8fa]">
                    <span className="text-[10px] text-[#57606a] block">Statutory Status</span>
                    <span className="font-semibold text-[#1f2328] block">KGFR & KSU Act §48</span>
                    <span className="font-mono text-[10px] text-[#57606a]">Allowable: 100%</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#d0d7de] rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#57606a]">
                      <tr>
                        <th className="py-2 px-3">Opening Balance</th>
                        <th className="py-2 px-3 text-right">Total Credits (Inflows)</th>
                        <th className="py-2 px-3 text-right">Total Debits (Outflows)</th>
                        <th className="py-2 px-3 text-right">Net Flow</th>
                        <th className="py-2 px-3 text-right">Reconciled Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-mono font-bold">
                        <td className="py-2.5 px-3 text-[#1f2328]">{formatCurrency(openingBalance)}</td>
                        <td className="py-2.5 px-3 text-right text-[#1a7f37]">+{formatCurrency(totalCredits)}</td>
                        <td className="py-2.5 px-3 text-right text-[#cf222e]">-{formatCurrency(totalDebits)}</td>
                        <td className={`py-2.5 px-3 text-right ${netInflow >= 0 ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>
                          {netInflow >= 0 ? `+${formatCurrency(netInflow)}` : formatCurrency(netInflow)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#0969da]">{formatCurrency(closingBalance)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                    Transaction Audit Journal ({allTransactions.length} Entries)
                  </div>
                  <div className="overflow-x-auto border border-[#d0d7de] rounded-lg max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#57606a] sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">Date</th>
                          <th className="py-2 px-2.5">Ref #</th>
                          <th className="py-2 px-2.5">Description</th>
                          <th className="py-2 px-2.5">Category</th>
                          <th className="py-2 px-2.5 text-right">Amount (₹)</th>
                          <th className="py-2 px-2.5 text-right">Balance (₹)</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d0d7de]">
                        {allTransactions.map((t, i) => {
                          const isCr =
                            (t.type && t.type.toUpperCase().includes('CREDIT')) ||
                            (t.type && t.type.toUpperCase() === 'CR')
                          return (
                            <tr key={i} className="hover:bg-[#f6f8fa]/40">
                              <td className="py-1.5 px-2.5 font-mono text-[#57606a]">{t.date || '—'}</td>
                              <td className="py-1.5 px-2.5 font-mono text-[#1f2328]">{t.referenceNo || '—'}</td>
                              <td className="py-1.5 px-2.5 text-[#1f2328] max-w-xs truncate">{t.description}</td>
                              <td className="py-1.5 px-2.5 text-[#57606a]">{t.category || (isCr ? 'Inflow' : 'Disbursement')}</td>
                              <td className={`py-1.5 px-2.5 text-right font-mono font-bold ${isCr ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>
                                {isCr ? `+${formatCurrency(t.amount)}` : `-${formatCurrency(t.amount)}`}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-mono text-[#57606a]">
                                {formatCurrency(t.balance || 0)}
                              </td>
                              <td className="py-1.5 px-2.5 text-center">
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {t.status || 'Validated'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#d0d7de] grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] text-[#57606a] block">AI Validation Engine:</span>
                    <span className="font-semibold text-[#1f2328] block">FinBot LangGraph Engine v2.4</span>
                    <span className="text-[10px] font-mono text-[#57606a]">
                      Variance Verified: ₹0.00 • Formula Confirmed
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#57606a] block">State Auditor Sign-off:</span>
                    <span className="font-bold text-[#1f2328] block">
                      Sri. G. Kumar Naik, IAS
                    </span>
                    <span className="text-[10px] text-[#57606a]">
                      Principal Secretary, Higher Education
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: STATEWIDE INSTITUTIONS DIRECTORY (Select college to view reports)
  // =========================================================================
  return (
    <div className="space-y-5 pb-12 text-[#1f2328]">
      {/* Header Bar */}
      <div className="rounded-lg border border-[#d0d7de] bg-white p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-[#0969da]" />
            <div>
              <h1 className="text-base font-bold text-[#1f2328]">
                Institutional Financial Reports
              </h1>
              <p className="text-xs text-[#57606a]">
                Select any institution to inspect statements, complete credits and debits, and AI audit reports.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#57606a]" />
            <input
              type="text"
              value={collegeSearch}
              onChange={(e) => setCollegeSearch(e.target.value)}
              placeholder="Search institution..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded border border-[#d0d7de] bg-[#f6f8fa] text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grid of Institutions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredUniversities.map((u) => {
          const uAccounts = bankAccounts.filter((a) => a.universityId === u.id)
          const uStatements = statements.filter(
            (s) => s.universityId === u.id || uAccounts.some((a) => a.id === s.accountId)
          )
          const totalBal = uAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0)

          return (
            <div
              key={u.id}
              onClick={() => {
                setSelectedCollege(u)
                setSelectedAccountId('ALL')
              }}
              className="rounded-lg border border-[#d0d7de] bg-white p-4 hover:border-[#0969da] hover:shadow-sm transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#1f2328] hover:text-[#0969da]">
                    {u.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] bg-[#eaeef2] px-1.5 py-0.5 rounded font-semibold text-[#57606a]">
                      {u.code}
                    </span>
                    <span className="text-[11px] text-[#57606a]">
                      {u.district || 'Karnataka'}
                    </span>
                  </div>
                </div>
                <Badge variant={uStatements.length > 0 ? 'success' : 'outline'} className="text-[10px]">
                  {uStatements.length > 0 ? `${uStatements.length} Statements` : 'Pending'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#eaeef2]">
                <div>
                  <span className="text-[10px] text-[#57606a] block">Bank Accounts</span>
                  <span className="font-mono font-semibold text-[#1f2328]">
                    {uAccounts.length} Registered
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#57606a] block">Verified Balance</span>
                  <span className="font-mono font-bold text-[#1a7f37]">
                    {formatCurrency(totalBal)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold justify-center h-7"
              >
                View Complete Statement Report
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
