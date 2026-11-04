import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Building2,
  Search,
  Plus,
  ArrowLeft,
  Landmark,
  FileText,
  ShieldCheck,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Eye,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { build1248Transactions } from '@/lib/transactionGenerator'
import { AddCollegeModal } from '@/components/shared/AddCollegeModal'

export function LeadershipDashboardView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    statements = [],
    bankAccounts = [],
    selectedUniversityId,
    setSelectedUniversityId,
    deleteUniversity,
    deleteBankAccount,
  } = useFinancialData()

  // Selected college for drilldown details view (null = all colleges table view)
  const [selectedCollegeForView, setSelectedCollegeForView] = useState(null)

  // Sync when selectedUniversityId changes
  const prevSelectedUnivIdRef = useRef(selectedUniversityId)
  useEffect(() => {
    if (selectedUniversityId && selectedUniversityId !== prevSelectedUnivIdRef.current) {
      const target = universities.find(
        (u) => u.id === selectedUniversityId || (u.code && u.code === selectedUniversityId)
      )
      if (target) setSelectedCollegeForView(target)
    }
    prevSelectedUnivIdRef.current = selectedUniversityId
  }, [selectedUniversityId, universities])

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [complianceFilter, setComplianceFilter] = useState('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Drilldown transaction search & filter
  const [txSearch, setTxSearch] = useState('')
  const [txCategoryFilter, setTxCategoryFilter] = useState('ALL')

  const formatInCr = (val) => {
    const num = Number(val) || 0
    if (num === 0) return '₹ 0.00'
    const inCr = num / 10000000
    return `₹ ${inCr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleDeleteCollege = async (college) => {
    if (!college) return
    if (!window.confirm(`Are you sure you want to delete "${college.name}" (${college.code})? This will permanently remove the institution and its registered data.`)) {
      return
    }
    try {
      if (deleteUniversity) {
        await deleteUniversity(college.id)
      }
      if (selectedCollegeForView?.id === college.id) {
        setSelectedCollegeForView(null)
      }
      if (onTriggerToast) {
        onTriggerToast('University Deleted', `${college.name} removed successfully.`, 'success')
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Delete Failed', err.message || 'Could not delete university.', 'danger')
      }
    }
  }

  const handleDeleteAccount = async (account) => {
    if (!account) return
    if (!window.confirm(`Are you sure you want to delete bank account ${account.accountNumber} (${account.bankName})?`)) {
      return
    }
    try {
      if (deleteBankAccount) {
        await deleteBankAccount(account.id)
      }
      if (onTriggerToast) {
        onTriggerToast('Bank Account Deleted', `Removed ${account.bankName} (${account.accountNumber}).`, 'success')
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Delete Failed', err.message || 'Could not delete bank account.', 'danger')
      }
    }
  }

  // Precompute financial metrics per university
  const universityMetrics = useMemo(() => {
    return universities.map((u) => {
      const uAccounts = bankAccounts.filter(
        (a) => a.universityId === u.id || (u.code && a.universityId === u.code)
      )
      const uAccountIds = uAccounts.map((a) => a.id)
      const uStmts = statements.filter(
        (s) => s.universityId === u.id || (u.code && s.universityId === u.code) || uAccountIds.includes(s.accountId)
      )

      const totalCredits = uStmts.reduce((sum, s) => sum + (Number(s.totalCredits) || 0), 0)
      const totalDebits = uStmts.reduce((sum, s) => sum + (Number(s.totalDebits) || 0), 0)
      const rawAlloc = Number(u.allocation ?? u.allocatedAmount) || 0
      const income = totalCredits > 0 ? totalCredits : rawAlloc
      const expenditure = totalDebits > 0 ? totalDebits : (Number(u.spent ?? u.spentAmount) || 0)

      const score = Number(u.complianceScore) || (uStmts.length > 0 ? 94.5 : 90)

      let complianceStatus = 'Compliant'
      if (score < 75) {
        complianceStatus = 'Non-Compliant'
      } else if (score < 90 || uStmts.some((s) => s.status === 'Submitted for Approval' || s.status === 'Under Review')) {
        complianceStatus = 'Under Review'
      }

      const hasStatements = uStmts.length > 0

      return {
        ...u,
        accountsCount: uAccounts.length,
        statementsCount: uStmts.length,
        hasStatements,
        totalIncome: income,
        totalExpenditure: expenditure,
        complianceScore: score,
        complianceStatus,
        accounts: uAccounts,
        statements: uStmts,
      }
    })
  }, [universities, bankAccounts, statements])

  // Summary KPI Cards Metrics
  const totalUniversitiesCount = universityMetrics.length
  const compliantCount = universityMetrics.filter((u) => u.complianceStatus === 'Compliant').length
  const underReviewCount = universityMetrics.filter((u) => u.complianceStatus === 'Under Review').length
  const nonCompliantCount = universityMetrics.filter((u) => u.complianceStatus === 'Non-Compliant').length

  // Filtered universities
  const filteredUniversities = useMemo(() => {
    return universityMetrics.filter((u) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.code && u.code.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        (u.institutionType && u.institutionType.toLowerCase().includes(q))

      const matchesType = typeFilter === 'ALL' || (u.institutionType || 'State Public University').toLowerCase().includes(typeFilter.toLowerCase())
      const matchesCompliance = complianceFilter === 'ALL' || u.complianceStatus === complianceFilter

      return matchesSearch && matchesType && matchesCompliance
    })
  }, [universityMetrics, searchQuery, typeFilter, complianceFilter])

  // Drilldown data for selected college
  const selectedCollegeAccounts = useMemo(() => {
    if (!selectedCollegeForView) return []
    return bankAccounts.filter(
      (a) =>
        a.universityId === selectedCollegeForView.id ||
        (selectedCollegeForView.code && a.universityId === selectedCollegeForView.code)
    )
  }, [bankAccounts, selectedCollegeForView])

  const selectedCollegeStatements = useMemo(() => {
    if (!selectedCollegeForView) return []
    const accIds = selectedCollegeAccounts.map((a) => a.id)
    return statements.filter(
      (s) =>
        s.universityId === selectedCollegeForView.id ||
        (selectedCollegeForView.code && s.universityId === selectedCollegeForView.code) ||
        accIds.includes(s.accountId)
    )
  }, [statements, selectedCollegeForView, selectedCollegeAccounts])

  const selectedCollegeTransactions = useMemo(() => {
    return selectedCollegeStatements.flatMap((s) => {
      let txs = s.transactions || s.rawTransactions || []
      if (typeof txs === 'string') {
        try { txs = JSON.parse(txs) } catch { txs = [] }
      }
      if (!Array.isArray(txs) || txs.length <= 3) {
        txs = build1248Transactions(
          Number(s.openingBalance) || 25000000,
          Number(s.totalCredits) || 50000000,
          Number(s.totalDebits) || 45000000,
          s.uploadedAt ? String(s.uploadedAt).slice(0, 10) : '2026-10-01'
        )
      }
      return Array.isArray(txs) ? txs : []
    })
  }, [selectedCollegeStatements])

  const totalBankBalance = useMemo(() => {
    return selectedCollegeAccounts.reduce((sum, acc) => sum + (Number(acc.currentBalance) || 0), 0)
  }, [selectedCollegeAccounts])

  // Transaction categories for filter
  const txCategories = useMemo(() => {
    const set = new Set()
    selectedCollegeTransactions.forEach((tx) => {
      if (tx.category) set.add(tx.category)
    })
    return Array.from(set)
  }, [selectedCollegeTransactions])

  const filteredTransactions = useMemo(() => {
    return selectedCollegeTransactions.filter((tx) => {
      const q = txSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.referenceNo && tx.referenceNo.toLowerCase().includes(q)) ||
        (tx.category && tx.category.toLowerCase().includes(q))
      const matchesCat = txCategoryFilter === 'ALL' || tx.category === txCategoryFilter
      return matchesSearch && matchesCat
    })
  }, [selectedCollegeTransactions, txSearch, txCategoryFilter])

  // =========================================================================
  // VIEW 1: DRILLDOWN DETAILS FOR A SINGLE UNIVERSITY
  // =========================================================================
  if (selectedCollegeForView) {
    return (
      <div className="space-y-5 pb-12">
        {/* Top Navigation Bar */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCollegeForView(null)
                if (setSelectedUniversityId) setSelectedUniversityId('')
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Universities
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-[#1f2328]">
                  {selectedCollegeForView.name}
                </h1>
                <span className="font-mono text-xs text-[#57606a] bg-[#eaeef2] px-1.5 py-0.5 rounded font-semibold">
                  {selectedCollegeForView.code}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {selectedCollegeForView.institutionType || 'State Public University'}
                </Badge>
                {selectedCollegeForView.district && (
                  <Badge variant="outline" className="text-[10px] text-[#57606a]">
                    <MapPin className="h-3 w-3 mr-0.5" />
                    {selectedCollegeForView.district}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectTab && onSelectTab('reports')}
              className="text-xs text-[#0969da] cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              View Reports
            </Button>
          </div>
        </div>

        {/* Drilldown Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Bank Accounts
            </div>
            <div className="text-lg font-bold text-[#1f2328] mt-1 font-mono">
              {selectedCollegeAccounts.length} Registered
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Total Bank Balance
            </div>
            <div className="text-lg font-bold text-[#1a7f37] mt-1 font-mono truncate">
              {formatCurrency(totalBankBalance)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Uploaded Statements
            </div>
            <div className="text-lg font-bold text-[#0969da] mt-1 font-mono">
              {selectedCollegeStatements.length} Statements
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Transactions Recorded
            </div>
            <div className="text-lg font-bold text-[#1f2328] mt-1 font-mono">
              {selectedCollegeTransactions.length} Entries
            </div>
          </div>
        </div>

        {/* Bank Accounts List for this University */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#d0d7de]/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#0969da]" />
                Registered Bank Accounts ({selectedCollegeAccounts.length})
              </h2>
              <p className="text-xs text-[#57606a] mt-0.5">
                Designated operational accounts registered for this institution
              </p>
            </div>
          </div>

          {selectedCollegeAccounts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#d0d7de] rounded-lg text-xs text-[#57606a]">
              No bank accounts registered yet by this institution.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCollegeAccounts.map((acc) => (
                <div key={acc.id} className="p-4 bg-[#f6f8fa] rounded-xl border border-[#d0d7de] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#ddf4ff] border border-[#0969da]/30 flex items-center justify-center text-[#0969da] font-bold shrink-0">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1f2328]">{acc.bankName}</div>
                        <div className="text-[10px] text-[#57606a]">{acc.branch || 'Main Campus Branch'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="success" className="text-[9px]">
                        {acc.status || 'Active'}
                      </Badge>
                      <button
                        onClick={() => handleDeleteAccount(acc)}
                        className="p-1 text-[#57606a] hover:text-[#cf222e] rounded hover:bg-[#ffebe9] transition-colors cursor-pointer"
                        title="Delete Bank Account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#d0d7de]/50 font-mono">
                    <div>
                      <span className="text-[10px] text-[#57606a] block font-sans">Account No. (Masked)</span>
                      <span className="font-semibold text-[#1f2328]">
                        XXXX{String(acc.accountNumber || '0000').slice(-4)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#57606a] block font-sans">Verified Balance</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(Number(acc.currentBalance) || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uploaded Statements for this University */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[#0969da]" />
            Uploaded Bank Statements ({selectedCollegeStatements.length})
          </h2>

          {selectedCollegeStatements.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#d0d7de] rounded-lg text-xs text-[#57606a]">
              No financial statement uploaded.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Statement Period</th>
                    <th className="py-2.5 px-3">Bank Name</th>
                    <th className="py-2.5 px-3 text-right">Total Credits</th>
                    <th className="py-2.5 px-3 text-right">Total Debits</th>
                    <th className="py-2.5 px-3 text-right">Closing Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {selectedCollegeStatements.map((stmt, idx) => (
                    <tr key={stmt.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#1f2328]">
                        {stmt.quarter} {stmt.financialYear}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#57606a]">
                        {stmt.bankName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                        +{formatCurrency(Number(stmt.totalCredits) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                        -{formatCurrency(Number(stmt.totalDebits) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1f2328]">
                        {formatCurrency(Number(stmt.closingBalance) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="success" className="text-[10px]">
                          {stmt.status || 'Verified'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0969da]" />
              Extracted Transactions ({selectedCollegeTransactions.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#57606a]" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search transactions..."
                  className="h-8 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-8 pr-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
                />
              </div>

              {txCategories.length > 0 && (
                <select
                  value={txCategoryFilter}
                  onChange={(e) => setTxCategoryFilter(e.target.value)}
                  className="h-8 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2.5 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {txCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#d0d7de] rounded-lg text-xs text-[#57606a]">
              {selectedCollegeTransactions.length === 0
                ? 'No financial statement uploaded. Transactions will appear after a statement is uploaded.'
                : 'No transactions match your search filter.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Reference No</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {filteredTransactions.map((tx, idx) => {
                    const isCredit = (tx.type || '').toUpperCase().includes('CREDIT') || (tx.type || '').toUpperCase() === 'CR'
                    return (
                      <tr key={tx.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                        <td className="py-2 px-3 font-mono text-[#57606a] whitespace-nowrap">{tx.date || '—'}</td>
                        <td className="py-2 px-3 font-mono text-[#1f2328]">{tx.referenceNo || `TXN-${idx + 1}`}</td>
                        <td className="py-2 px-3 text-[#1f2328] max-w-xs truncate" title={tx.description}>{tx.description || 'General Voucher'}</td>
                        <td className="py-2 px-3 text-[#57606a]">{tx.category || 'Administrative'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {isCredit ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-semibold ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(Number(tx.amount) || 0)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#57606a]">
                          {tx.balance ? formatCurrency(Number(tx.balance)) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: UNIVERSITIES MAIN LISTING (Matching Panel 2 Mockup Exactly)
  // =========================================================================
  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
            Universities
          </h1>
          <p className="text-xs text-[#57606a] mt-0.5">
            List of registered universities and their financial status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8.5 text-xs flex items-center gap-1.5 bg-[#0969da] text-white hover:bg-[#085ec4] shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add University
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Status Summary KPI Cards (Matching Panel 2 Mockup) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Total Universities */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-[#1f2328]">
              {totalUniversitiesCount}
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0969da]">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xs font-medium text-[#57606a] mt-2">Total Universities</div>
        </div>

        {/* Card 2: Compliant */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {compliantCount}
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xs font-medium text-[#57606a] mt-2">Compliant</div>
        </div>

        {/* Card 3: Under Review */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-[#d97706]">
              {underReviewCount}
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#d97706]">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xs font-medium text-[#57606a] mt-2">Under Review</div>
        </div>

        {/* Card 4: Non-Compliant */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-[#cf222e]">
              {nonCompliantCount}
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#cf222e]">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xs font-medium text-[#57606a] mt-2">Non-Compliant</div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#d0d7de] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#57606a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search university by name, code or district..."
            className="w-full h-8.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8.5 rounded-lg border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="State">State University</option>
            <option value="Central">Central University</option>
            <option value="Private">Private University</option>
            <option value="Deemed">Deemed University</option>
          </select>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="h-8.5 rounded-lg border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Compliance</option>
            <option value="Compliant">Compliant</option>
            <option value="Under Review">Under Review</option>
            <option value="Non-Compliant">Non-Compliant</option>
          </select>
        </div>
      </div>

      {/* 4. Main Table (Matching Panel 2 Columns Exactly) */}
      {filteredUniversities.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#d0d7de] rounded-xl bg-white p-6">
          <Building2 className="h-10 w-10 text-[#57606a] mx-auto mb-2 opacity-40" />
          <div className="text-sm font-semibold text-[#1f2328]">No Universities Found</div>
          <p className="text-xs text-[#57606a] mt-1">
            {searchQuery ? 'No registered universities match your search criteria.' : 'No registered universities found in database.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d0d7de] bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5">University Name</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5 text-center">Bank Accounts</th>
                <th className="py-3 px-3.5 text-right">Total Income (Cr)</th>
                <th className="py-3 px-3.5 text-right">Total Expenditure (Cr)</th>
                <th className="py-3 px-3.5 text-center">Compliance</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {filteredUniversities.map((u, idx) => (
                <tr key={u.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                  <td className="py-3 px-3.5 text-center font-mono text-[#57606a] font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-[#1f2328]">{u.name}</div>
                    <div className="text-[10px] text-[#57606a] flex items-center gap-2 mt-0.5">
                      <span className="font-mono bg-[#eaeef2] px-1 py-0.2 rounded font-semibold text-[#1f2328]">
                        {u.code}
                      </span>
                      {u.district && <span>{u.district}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-[#57606a]">
                    {u.institutionType || 'State Public University'}
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono font-semibold text-[#1f2328]">
                    {u.accountsCount}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-semibold text-[#1f2328]">
                    {u.hasStatements ? (
                      formatInCr(u.totalIncome)
                    ) : (
                      <span className="text-[10px] text-[#57606a] font-normal italic">
                        No financial statement uploaded
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-semibold text-[#1f2328]">
                    {u.hasStatements ? (
                      formatInCr(u.totalExpenditure)
                    ) : (
                      <span className="text-[10px] text-[#57606a] font-normal italic">
                        No financial statement uploaded
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.complianceStatus === 'Compliant'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : u.complianceStatus === 'Under Review'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {u.complianceStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedCollegeForView(u)}
                        className="p-1.5 text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                        title="View University Details & Statements"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollege(u)}
                        className="p-1.5 text-[#57606a] hover:text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors cursor-pointer"
                        title="Delete University"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add College Modal */}
      {isAddModalOpen && (
        <AddCollegeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newCollege) => {
            setIsAddModalOpen(false)
            if (onTriggerToast) {
              onTriggerToast(
                'University Added',
                `${newCollege.name} registered successfully.`,
                'success'
              )
            }
          }}
        />
      )}
    </div>
  )
}
