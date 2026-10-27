import React, { useState, useMemo } from 'react'
import {
  Building2,
  Search,
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  Mail,
  MapPin,
  Landmark,
  FileText,
  CheckCircle2,
  AlertCircle,
  Filter,
  KeyRound,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  ExternalLink,
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
  } = useFinancialData()

  // State: selected college for full details view (null = card-wise list view)
  const [selectedCollegeForView, setSelectedCollegeForView] = useState(() => {
    if (selectedUniversityId) {
      return universities.find((u) => u.id === selectedUniversityId) || null
    }
    return null
  })

  // Synchronize when selectedUniversityId is changed externally
  React.useEffect(() => {
    if (selectedUniversityId) {
      const target = universities.find((u) => u.id === selectedUniversityId)
      if (target) setSelectedCollegeForView(target)
    }
  }, [selectedUniversityId, universities])

  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copiedText, setCopiedText] = useState('')

  // Transaction search & filter inside details view
  const [txSearch, setTxSearch] = useState('')
  const [txCategoryFilter, setTxCategoryFilter] = useState('ALL')

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(''), 2000)
    if (onTriggerToast) {
      onTriggerToast('Copied to Clipboard', `${label || text} copied!`, 'success')
    }
  }

  // Filtered universities for the card-wise view
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

  // Computed data for the selected college
  const selectedCollegeAccounts = useMemo(() => {
    if (!selectedCollegeForView) return []
    return bankAccounts.filter(
      (a) =>
        a.universityId === selectedCollegeForView.id ||
        (a.universityName && selectedCollegeForView.name && a.universityName.toLowerCase() === selectedCollegeForView.name.toLowerCase())
    )
  }, [bankAccounts, selectedCollegeForView])

  const selectedCollegeAccountIds = useMemo(() => {
    return selectedCollegeAccounts.map((a) => a.id)
  }, [selectedCollegeAccounts])

  const selectedCollegeStatements = useMemo(() => {
    if (!selectedCollegeForView) return []
    return statements.filter(
      (s) =>
        s.universityId === selectedCollegeForView.id ||
        selectedCollegeAccountIds.includes(s.accountId) ||
        (s.universityName && selectedCollegeForView.name && s.universityName.toLowerCase().includes(selectedCollegeForView.name.toLowerCase()))
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
  // VIEW 1: COLLEGE DETAILS & TRANSACTIONS (Opened when a card is clicked)
  // =========================================================================
  if (selectedCollegeForView) {
    const alloc = Number(selectedCollegeForView.allocation ?? selectedCollegeForView.allocatedAmount) || 0
    const spent = Number(selectedCollegeForView.spent ?? selectedCollegeForView.spentAmount) || 0
    const balance = Number(selectedCollegeForView.availableCash) || Math.max(0, alloc - spent)
    const utilization = alloc > 0 ? Number(((spent / alloc) * 100).toFixed(1)) : 0
    const compliance = Number(selectedCollegeForView.complianceScore) || 98

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

        {/* 1. College Key Metrics (Accurate Real Numbers) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              State Budget Allocation
            </div>
            <div className="text-lg font-bold text-[#1f2328] mt-1 font-mono truncate" title={formatCurrency(alloc)}>
              {formatCurrency(alloc)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Total Spent (Expenditure)
            </div>
            <div className="text-lg font-bold text-[#cf222e] mt-1 font-mono truncate" title={formatCurrency(spent)}>
              {formatCurrency(spent)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Remaining Balance
            </div>
            <div className="text-lg font-bold text-[#1a7f37] mt-1 font-mono truncate" title={formatCurrency(balance)}>
              {formatCurrency(balance)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Utilization Rate
            </div>
            <div className="text-lg font-bold text-[#0969da] mt-1 font-mono">
              {utilization}%
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Total Accounts
            </div>
            <div className="text-lg font-bold text-[#1f2328] mt-1 font-mono">
              {selectedCollegeAccounts.length} Accounts
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[10px] font-semibold text-[#57606a] uppercase tracking-wider">
              Total Transactions
            </div>
            <div className="text-lg font-bold text-[#1f2328] mt-1 font-mono">
              {selectedCollegeTransactions.length} Filed
            </div>
          </div>
        </div>

        {/* 2. Login Access & College Institutional Details */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#d0d7de]/70 pb-3">
            <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#0969da]" />
              Authorized Login Access & Institutional Details
            </h2>
            <Badge variant="outline" className="text-[10px] text-[#0969da] border-[#0969da]/30 bg-[#ddf4ff]/40">
              Government Verified Claims
            </Badge>
          </div>

          {/* Login Access Credentials Box */}
          <div className="rounded-lg border border-[#0969da]/30 bg-[#ddf4ff]/25 p-4 space-y-3">
            <div className="text-xs font-bold text-[#0969da] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              University Finance Officer Portal Login Credentials
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-md border border-[#d0d7de] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#57606a] uppercase font-semibold block">Authorized Login Email</span>
                  <span className="font-mono text-xs font-bold text-[#0969da]">{selectedCollegeForView.financeEmail || 'N/A'}</span>
                </div>
                {selectedCollegeForView.financeEmail && (
                  <button
                    onClick={() => handleCopy(selectedCollegeForView.financeEmail, 'Login Email')}
                    className="p-1 hover:bg-[#f6f8fa] rounded text-[#57606a] hover:text-[#0969da] cursor-pointer"
                    title="Copy Email"
                  >
                    {copiedText === selectedCollegeForView.financeEmail ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              <div className="bg-white p-3 rounded-md border border-[#d0d7de] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#57606a] uppercase font-semibold block">Authentication Method</span>
                  <span className="font-mono text-xs font-bold text-[#0969da]">4-Digit Mock OTP</span>
                </div>
                <Badge variant="outline" className="text-[9px] text-[#0969da] border-[#0969da]/30">
                  Password-Free
                </Badge>
              </div>

              <div className="bg-white p-3 rounded-md border border-[#d0d7de] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#57606a] uppercase font-semibold block">Assigned Role</span>
                  <span className="text-xs font-bold text-[#1a7f37]">University CFO / Finance Officer</span>
                </div>
                <Badge variant="success" className="text-[9px]">Active</Badge>
              </div>
            </div>
          </div>

          {/* Institutional Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs pt-1">
            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Campus Registrar Official Email</span>
              <div className="font-mono text-xs text-[#1f2328] font-medium break-all">
                {selectedCollegeForView.officialEmail || 'N/A'}
              </div>
              <span className="text-[10px] text-[#656d76]">Official State Correspondence</span>
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Campus Location & District</span>
              <div className="text-xs text-[#1f2328] font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#57606a] shrink-0" />
                {selectedCollegeForView.district || 'Bengaluru Urban'}, {selectedCollegeForView.state || 'Karnataka'}
              </div>
              {selectedCollegeForView.address && (
                <div className="text-[10px] text-[#656d76] truncate">{selectedCollegeForView.address}</div>
              )}
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Affiliated University / Governing Body</span>
              <div className="text-xs text-[#1f2328] font-medium">
                {selectedCollegeForView.affiliatedUniversity || 'Autonomous / Independent State University'}
              </div>
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Operational Status</span>
              <div>
                <Badge
                  variant={
                    selectedCollegeForView.status === 'Optimal'
                      ? 'success'
                      : selectedCollegeForView.status === 'Watch' || selectedCollegeForView.status === 'Notice'
                      ? 'warning'
                      : 'danger'
                  }
                  className="text-[10px]"
                >
                  {selectedCollegeForView.status || 'Optimal'}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Statutory Compliance Score</span>
              <div className="text-xs font-bold text-[#1f2328] font-mono">
                {compliance}% • Grade {selectedCollegeForView.complianceGrade || 'A+'}
              </div>
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Last Financial Audit</span>
              <div className="text-xs font-medium text-[#1f2328] font-mono">
                {selectedCollegeForView.lastAudit || '2026-09-30'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Registered Bank Accounts of this University */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
              <Landmark className="h-4 w-4 text-[#0969da]" />
              Registered Bank Accounts ({selectedCollegeAccounts.length})
            </h2>
          </div>

          {selectedCollegeAccounts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#d0d7de] rounded-lg text-xs text-[#57606a]">
              No bank accounts registered yet by this institution.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Bank Name</th>
                    <th className="py-2.5 px-3">Account Number</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Branch & IFSC</th>
                    <th className="py-2.5 px-3">Account Holder</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {selectedCollegeAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#1f2328]">{acc.bankName}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold">{acc.accountNumber}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {acc.accountType || 'State Treasury Escrow'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[#57606a]">
                        {acc.branch || acc.branchName || 'Main Branch'} • {acc.ifscCode}
                      </td>
                      <td className="py-2.5 px-3 text-[#57606a]">{acc.accountHolderName || selectedCollegeForView.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1f2328]">
                        {formatCurrency(Number(acc.currentBalance) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Total Transactions Ledger of this University */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0969da]" />
                Total Transactions ({selectedCollegeTransactions.length})
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
                ? 'No transactions filed yet. Transactions will appear dynamically once the college finance officer uploads bank statements.'
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
  // VIEW 2: ONLY CARD-WISE UNIVERSITIES (Card-wise view as requested)
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
                {universities.length} Registered State Institutions • Card Directory
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
          {filteredUniversities.length} Institutions Displayed
        </span>
      </div>

      {/* Pure Card-Wise Universities Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUniversities.map((college) => {
            const cAlloc = Number(college.allocation ?? college.allocatedAmount) || 0
            const cSpent = Number(college.spent ?? college.spentAmount) || 0
            const cBal = Number(college.availableCash) || Math.max(0, cAlloc - cSpent)
            const cUtil = cAlloc > 0 ? Math.min(100, Math.round((cSpent / cAlloc) * 100)) : 0

            const collegeAccounts = bankAccounts.filter(
              (a) =>
                a.universityId === college.id ||
                (a.universityName && college.name && a.universityName.toLowerCase() === college.name.toLowerCase())
            )
            const collegeAccountIds = collegeAccounts.map((a) => a.id)
            const collegeStatements = statements.filter(
              (s) =>
                s.universityId === college.id ||
                collegeAccountIds.includes(s.accountId) ||
                (s.universityName && college.name && s.universityName.toLowerCase().includes(college.name.toLowerCase()))
            )
            const txCount = collegeStatements.reduce((sum, s) => sum + (s.transactions?.length || 0), 0)

            return (
              <div
                key={college.id}
                onClick={() => setSelectedCollegeForView(college)}
                className="group bg-white rounded-xl border border-[#d0d7de] p-5 hover:border-[#0969da] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
              >
                {/* Card Header: Icon, Name, Code & Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-[#ddf4ff] border border-[#0969da]/30 flex items-center justify-center text-[#0969da] font-bold text-sm shrink-0 group-hover:bg-[#0969da] group-hover:text-white transition-colors">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#1f2328] group-hover:text-[#0969da] transition-colors line-clamp-1">
                          {college.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-[#f6f8fa] border border-[#d0d7de] text-[#57606a] px-1.5 py-0.2 rounded font-semibold">
                            {college.code}
                          </span>
                          <span className="text-[11px] text-[#57606a] flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 text-[#57606a]" />
                            {college.district || 'Karnataka'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        college.status === 'Optimal'
                          ? 'success'
                          : college.status === 'Watch' || college.status === 'Notice'
                          ? 'warning'
                          : 'danger'
                      }
                      className="text-[9px] shrink-0"
                    >
                      {college.status || 'Optimal'}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-[#656d76] line-clamp-1">
                    {college.institutionType || 'State Public University'}
                  </div>
                </div>

                {/* Financial Summary Figures */}
                <div className="bg-[#f6f8fa] rounded-lg p-3 border border-[#d0d7de]/60 space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-[#57606a] uppercase font-semibold block">Allocation</span>
                      <span className="font-mono text-xs font-bold text-[#1f2328] block truncate" title={formatCurrency(cAlloc)}>
                        {formatCurrency(cAlloc)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#57606a] uppercase font-semibold block">Spent</span>
                      <span className="font-mono text-xs font-bold text-[#cf222e] block truncate" title={formatCurrency(cSpent)}>
                        {formatCurrency(cSpent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#57606a] uppercase font-semibold block">Remaining</span>
                      <span className="font-mono text-xs font-bold text-[#1a7f37] block truncate" title={formatCurrency(cBal)}>
                        {formatCurrency(cBal)}
                      </span>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-[#57606a] mb-1">
                      <span>Budget Utilization</span>
                      <span className="font-bold font-mono text-[#0969da]">{cUtil}%</span>
                    </div>
                    <div className="w-full bg-[#d0d7de]/50 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cUtil > 85 ? 'bg-amber-500' : 'bg-[#0969da]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, cUtil))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Badges: Accounts Count & Transactions Count */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white border border-[#d0d7de] rounded-md py-1.5 px-2 flex items-center gap-1.5 text-[#1f2328]">
                    <Landmark className="h-3.5 w-3.5 text-[#0969da] shrink-0" />
                    <span className="font-medium truncate">{collegeAccounts.length} Bank Accounts</span>
                  </div>
                  <div className="bg-white border border-[#d0d7de] rounded-md py-1.5 px-2 flex items-center gap-1.5 text-[#1f2328]">
                    <FileText className="h-3.5 w-3.5 text-[#1a7f37] shrink-0" />
                    <span className="font-medium truncate">{txCount} Transactions</span>
                  </div>
                </div>

                {/* Login Access Info Bar */}
                <div className="bg-[#ddf4ff]/40 border border-[#0969da]/20 rounded-md p-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <KeyRound className="h-3.5 w-3.5 text-[#0969da] shrink-0" />
                    <span className="font-mono text-[10px] text-[#0969da] font-medium truncate">
                      {college.financeEmail || 'finance@university.edu'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0969da] uppercase shrink-0">
                    Login Active
                  </span>
                </div>

                {/* Card Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedCollegeForView(college)
                  }}
                  className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 text-[#0969da] border-[#0969da]/30 hover:bg-[#0969da] hover:text-white transition-colors cursor-pointer"
                >
                  View University Data & Audit
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
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
