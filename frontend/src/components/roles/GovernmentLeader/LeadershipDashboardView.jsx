import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Building2,
  Search,
  Plus,
  ArrowLeft,
  Landmark,
  FileText,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MapPin,
  Calendar,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
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

  // State: selected college for bank details view (null = all colleges list view only)
  const [selectedCollegeForView, setSelectedCollegeForView] = useState(null)

  // Only synchronize when selectedUniversityId is changed explicitly after initial mount
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

  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copiedText, setCopiedText] = useState('')

  // Transaction search & filter inside details view
  const [txSearch, setTxSearch] = useState('')
  const [txCategoryFilter, setTxCategoryFilter] = useState('ALL')

  const handleCopy = (text, label) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(''), 2000)
    if (onTriggerToast) {
      onTriggerToast('Copied to Clipboard', `${label || text} copied!`, 'success')
    }
  }

  const handleDeleteCollege = async (college) => {
    if (!college) return
    if (!window.confirm(`Are you sure you want to delete "${college.name}" (${college.code})? This will permanently remove the college and its registered data.`)) {
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
        onTriggerToast('College Deleted', `${college.name} removed successfully.`, 'success')
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Delete Failed', err.message || 'Could not delete college.', 'danger')
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

  // Filtered universities for the list view
  const filteredUniversities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return universities
    return universities.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.code && u.code.toLowerCase().includes(q)) ||
        (u.officialEmail && u.officialEmail.toLowerCase().includes(q)) ||
        (u.financeEmail && u.financeEmail.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        (u.institutionType && u.institutionType.toLowerCase().includes(q))
    )
  }, [universities, searchQuery])

  // Computed bank data for the selected college
  const selectedCollegeAccounts = useMemo(() => {
    if (!selectedCollegeForView) return []
    return bankAccounts.filter(
      (a) =>
        a.universityId === selectedCollegeForView.id ||
        (selectedCollegeForView.code && a.universityId === selectedCollegeForView.code) ||
        (a.universityName &&
          selectedCollegeForView.name &&
          a.universityName.toLowerCase() === selectedCollegeForView.name.toLowerCase())
    )
  }, [bankAccounts, selectedCollegeForView])

  const selectedCollegeAccountIds = useMemo(() => {
    return selectedCollegeAccounts.map((a) => a.id)
  }, [selectedCollegeAccounts])

  const totalBankBalance = useMemo(() => {
    return selectedCollegeAccounts.reduce((sum, acc) => sum + (Number(acc.currentBalance) || 0), 0)
  }, [selectedCollegeAccounts])

  const selectedCollegeStatements = useMemo(() => {
    if (!selectedCollegeForView) return []
    return statements.filter(
      (s) =>
        s.universityId === selectedCollegeForView.id ||
        (selectedCollegeForView.code && s.universityId === selectedCollegeForView.code) ||
        selectedCollegeAccountIds.includes(s.accountId) ||
        (s.universityName &&
          selectedCollegeForView.name &&
          s.universityName.toLowerCase() === selectedCollegeForView.name.toLowerCase())
    )
  }, [statements, selectedCollegeForView, selectedCollegeAccountIds])

  const selectedCollegeTransactions = useMemo(() => {
    if (!selectedCollegeStatements.length) return []
    return selectedCollegeStatements.flatMap((s) =>
      (s.transactions || []).map((t) => ({
        ...t,
        quarter: s.quarter,
        financialYear: s.financialYear,
        bankName: s.bankName,
        accountNumber: s.accountNumber,
      }))
    )
  }, [selectedCollegeStatements])

  const filteredTransactions = useMemo(() => {
    return selectedCollegeTransactions.filter((t) => {
      const q = txSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.type && t.type.toLowerCase().includes(q))

      const matchesCat = txCategoryFilter === 'ALL' || t.category === txCategoryFilter

      return matchesSearch && matchesCat
    })
  }, [selectedCollegeTransactions, txSearch, txCategoryFilter])

  const txCategories = useMemo(() => {
    const cats = new Set(selectedCollegeTransactions.map((t) => t.category).filter(Boolean))
    return Array.from(cats)
  }, [selectedCollegeTransactions])

  // =========================================================================
  // VIEW 1: COLLEGE BANK DETAILS (Opened when a particular college is clicked)
  // =========================================================================
  if (selectedCollegeForView) {
    return (
      <div className="space-y-6 pb-12">
        {/* Top Back Navigation Bar */}
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
              Back to All Colleges
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

        {/* Bank Details Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Total Bank Accounts
            </div>
            <div className="text-lg font-bold text-[#1f2328] mt-1 font-mono">
              {selectedCollegeAccounts.length} Accounts
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Total Bank Balance
            </div>
            <div
              className="text-lg font-bold text-[#1a7f37] mt-1 font-mono truncate"
              title={formatCurrency(totalBankBalance)}
            >
              {formatCurrency(totalBankBalance)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Filed Bank Statements
            </div>
            <div className="text-lg font-bold text-[#0969da] mt-1 font-mono">
              {selectedCollegeStatements.length} Statements
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Total Transactions Filed
            </div>
            <div className="text-lg font-bold text-[#1f2328] mt-1 font-mono">
              {selectedCollegeTransactions.length} Recorded
            </div>
          </div>
        </div>

        {/* All Bank Details: Registered Bank Accounts */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#d0d7de]/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#0969da]" />
                All Bank Details & Registered Accounts ({selectedCollegeAccounts.length})
              </h2>
              <p className="text-xs text-[#57606a] mt-0.5">
                Official institutional escrow and operating accounts registered for {selectedCollegeForView.name}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] text-[#0969da] border-[#0969da]/30 bg-[#ddf4ff]/40">
              Verified Bank Accounts
            </Badge>
          </div>

          {selectedCollegeAccounts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#d0d7de] rounded-lg text-xs text-[#57606a]">
              <Landmark className="h-8 w-8 text-[#57606a] mx-auto mb-2 opacity-40" />
              No bank accounts registered yet by this institution.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account Cards Grid for Rich Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCollegeAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 bg-[#f6f8fa] rounded-xl border border-[#d0d7de] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-[#ddf4ff] border border-[#0969da]/30 flex items-center justify-center text-[#0969da] font-bold shrink-0">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#1f2328]">{acc.bankName}</div>
                          <div className="text-[10px] text-[#57606a]">{acc.branch || acc.branchName || 'Main Campus Branch'}</div>
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

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-[#d0d7de]/70">
                        <span className="text-[9px] uppercase font-semibold text-[#57606a] block">
                          Account Number
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-mono font-bold text-xs text-[#1f2328] truncate">
                            {acc.accountNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(acc.accountNumber, 'Account Number')}
                            className="p-0.5 hover:bg-[#f6f8fa] rounded text-[#57606a] hover:text-[#0969da] cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedText === acc.accountNumber ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-[#d0d7de]/70">
                        <span className="text-[9px] uppercase font-semibold text-[#57606a] block">
                          IFSC Code
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-mono font-bold text-xs text-[#0969da]">
                            {acc.ifscCode}
                          </span>
                          <button
                            onClick={() => handleCopy(acc.ifscCode, 'IFSC Code')}
                            className="p-0.5 hover:bg-[#f6f8fa] rounded text-[#57606a] hover:text-[#0969da] cursor-pointer"
                            title="Copy IFSC Code"
                          >
                            {copiedText === acc.ifscCode ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-[#d0d7de]/70">
                        <span className="text-[9px] uppercase font-semibold text-[#57606a] block">
                          Account Holder
                        </span>
                        <span className="text-xs font-medium text-[#1f2328] block truncate mt-0.5">
                          {acc.accountHolderName || selectedCollegeForView.name}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-[#d0d7de]/70">
                        <span className="text-[9px] uppercase font-semibold text-[#57606a] block">
                          Account Type
                        </span>
                        <span className="text-xs font-medium text-[#1f2328] block truncate mt-0.5">
                          {acc.accountType || 'Treasury Operating Account'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-[#d0d7de]/70 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-[#57606a] block">
                          Current Verified Balance
                        </span>
                        <span className="font-mono text-sm font-bold text-[#1a7f37]">
                          {formatCurrency(Number(acc.currentBalance) || 0)}
                        </span>
                      </div>
                      {acc.currency && (
                        <span className="font-mono text-[10px] text-[#57606a] bg-[#f6f8fa] px-1.5 py-0.5 rounded border border-[#d0d7de]">
                          {acc.currency}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Bank Accounts Table */}
              <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Bank Name</th>
                      <th className="py-2.5 px-3">Account Number</th>
                      <th className="py-2.5 px-3">Account Holder</th>
                      <th className="py-2.5 px-3">Account Type</th>
                      <th className="py-2.5 px-3">Branch & IFSC</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d0d7de]">
                    {selectedCollegeAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#1f2328]">{acc.bankName}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#1f2328]">
                          {acc.accountNumber}
                        </td>
                        <td className="py-2.5 px-3 text-[#57606a]">
                          {acc.accountHolderName || selectedCollegeForView.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {acc.accountType || 'Treasury Operating Account'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-[#57606a] font-mono">
                          {acc.branch || acc.branchName || 'Main Branch'} • {acc.ifscCode}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="success" className="text-[9px]">
                            {acc.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1a7f37]">
                          {formatCurrency(Number(acc.currentBalance) || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteAccount(acc)}
                            className="p-1 text-[#57606a] hover:text-[#cf222e] rounded hover:bg-[#ffebe9] transition-colors cursor-pointer"
                            title="Delete Bank Account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Filed Bank Statements */}
        {selectedCollegeStatements.length > 0 && (
          <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#0969da]" />
              Filed Bank Statements ({selectedCollegeStatements.length})
            </h2>
            <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Quarter & FY</th>
                    <th className="py-2.5 px-3">Bank & Account</th>
                    <th className="py-2.5 px-3">Statement Date</th>
                    <th className="py-2.5 px-3 text-right">Opening Balance</th>
                    <th className="py-2.5 px-3 text-right">Credits (+)</th>
                    <th className="py-2.5 px-3 text-right">Debits (-)</th>
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
                        {stmt.bankName} ({stmt.accountNumber || '—'})
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#57606a]">
                        {stmt.statementDate || stmt.uploadDate || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatCurrency(Number(stmt.openingBalance) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#1a7f37]">
                        +{formatCurrency(Number(stmt.totalCredits) || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#cf222e]">
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
          </div>
        )}

        {/* Bank Transactions Ledger */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0969da]" />
                Bank Transactions ({selectedCollegeTransactions.length})
              </h2>
            </div>

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
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#d0d7de] rounded-lg text-xs text-[#57606a]">
              {selectedCollegeTransactions.length === 0
                ? 'No transactions filed yet for this college’s bank accounts.'
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
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {filteredTransactions.map((tx, idx) => {
                    const isDebit = tx.type?.toLowerCase() === 'debit' || tx.type?.toLowerCase() === 'dr'
                    return (
                      <tr key={tx.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#57606a] whitespace-nowrap">
                          {tx.transactionDate || tx.date || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-[#1f2328]">
                          {tx.referenceNo || tx.ref || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[#1f2328] max-w-xs truncate" title={tx.description}>
                          {tx.description || 'Transaction'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-[#eaeef2] text-[10px] font-medium text-[#24292f]">
                            {tx.category || 'General'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold text-[10px] ${
                              isDebit ? 'text-[#cf222e]' : 'text-[#1a7f37]'
                            }`}
                          >
                            {isDebit ? 'DEBIT' : 'CREDIT'}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isDebit ? 'text-[#cf222e]' : 'text-[#1a7f37]'
                          }`}
                        >
                          {isDebit ? '-' : '+'}
                          {formatCurrency(Number(tx.amount) || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#57606a]">
                          {tx.balance ? formatCurrency(Number(tx.balance)) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant={
                              tx.status === 'Exception'
                                ? 'danger'
                                : tx.status === 'Resolved' || tx.status === 'Approved'
                                ? 'success'
                                : 'outline'
                            }
                            className="text-[10px]"
                          >
                            {tx.status || 'Verified'}
                          </Badge>
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
  // VIEW 2: ALL COLLEGES LIST ONLY (Default View for Government Admin)
  // =========================================================================
  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#ddf4ff] border border-[#0969da]/30 flex items-center justify-center font-bold text-lg text-[#0969da]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
                Universities & Colleges
              </h1>
              <div className="text-xs text-[#57606a]">
                {universities.length} Registered State Institutions • All Colleges Directory
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add College
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#d0d7de] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search universities by name, code, email, or district..."
            className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#57606a] font-mono font-medium">
          {filteredUniversities.length} Colleges Displayed
        </span>
      </div>

      {/* Pure List of All Colleges Table */}
      {filteredUniversities.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#d0d7de] rounded-xl bg-white p-6">
          <Building2 className="h-10 w-10 text-[#57606a] mx-auto mb-2 opacity-40" />
          <div className="text-sm font-semibold text-[#1f2328]">No Universities Found</div>
          <p className="text-xs text-[#57606a] mt-1">Try adjusting your search criteria or enroll a new college.</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-3 text-xs cursor-pointer"
          >
            + Add College
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d0d7de] bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
              <tr>
                <th className="py-3 px-3.5">College Name & Code</th>
                <th className="py-3 px-3.5">Institution Type</th>
                <th className="py-3 px-3.5">District</th>
                <th className="py-3 px-3.5">Bank Accounts</th>
                <th className="py-3 px-3.5">Total Bank Balance</th>
                <th className="py-3 px-3.5">Official Email</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {filteredUniversities.map((college) => {
                const collegeAccounts = bankAccounts.filter(
                  (a) =>
                    a.universityId === college.id ||
                    (college.code && a.universityId === college.code) ||
                    (a.universityName && college.name && a.universityName.toLowerCase() === college.name.toLowerCase())
                )
                const collegeBal = collegeAccounts.reduce(
                  (sum, a) => sum + (Number(a.currentBalance) || 0),
                  0
                )

                return (
                  <tr
                    key={college.id}
                    onClick={() => setSelectedCollegeForView(college)}
                    className="hover:bg-[#f6f8fa]/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-xs text-[#1f2328] group-hover:text-[#0969da] transition-colors">
                        {college.name}
                      </div>
                      <div className="font-mono text-[10px] text-[#57606a] mt-0.5">
                        {college.code}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <Badge variant="outline" className="text-[10px]">
                        {college.institutionType || 'State Public University'}
                      </Badge>
                    </td>

                    <td className="py-3 px-3.5 text-[#57606a]">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#57606a] shrink-0" />
                        {college.district || 'Karnataka'}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#0969da] bg-[#ddf4ff]/60 px-2 py-0.5 rounded border border-[#0969da]/20 font-semibold">
                        <Landmark className="h-3 w-3" />
                        {collegeAccounts.length} {collegeAccounts.length === 1 ? 'Account' : 'Accounts'}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 font-mono font-bold text-[#1a7f37]">
                      {formatCurrency(collegeBal)}
                    </td>

                    <td className="py-3 px-3.5 font-mono text-[11px] text-[#57606a]">
                      {college.officialEmail || 'N/A'}
                    </td>

                    <td className="py-3 px-3.5">
                      <Badge
                        variant={
                          college.status === 'Optimal'
                            ? 'success'
                            : college.status === 'Watch' || college.status === 'Notice'
                            ? 'warning'
                            : 'danger'
                        }
                        className="text-[10px]"
                      >
                        {college.status || 'Optimal'}
                      </Badge>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCollegeForView(college)
                          }}
                          className="text-xs px-2.5 py-1 font-semibold text-[#0969da] border-[#0969da]/30 hover:bg-[#0969da] hover:text-white transition-colors cursor-pointer"
                        >
                          View Bank Details
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCollege(college)
                          }}
                          className="p-1.5 text-[#57606a] hover:text-[#cf222e] rounded-md hover:bg-[#ffebe9] transition-colors cursor-pointer"
                          title="Delete College"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Shared Add College Modal */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  )
}
