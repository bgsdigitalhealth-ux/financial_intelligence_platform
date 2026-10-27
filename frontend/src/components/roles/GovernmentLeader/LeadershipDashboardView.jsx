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

  // State: selected college for full details view (null = list view)
  const [selectedCollegeForView, setSelectedCollegeForView] = useState(() => {
    if (selectedUniversityId) {
      return universities.find((u) => u.id === selectedUniversityId) || null
    }
    return null
  })

  // Synchronize when selectedUniversityId is changed externally (e.g. from AI Insights)
  React.useEffect(() => {
    if (selectedUniversityId) {
      const target = universities.find((u) => u.id === selectedUniversityId)
      if (target) setSelectedCollegeForView(target)
    }
  }, [selectedUniversityId, universities])

  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Transaction search & filter inside details view
  const [txSearch, setTxSearch] = useState('')
  const [txCategoryFilter, setTxCategoryFilter] = useState('ALL')

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

  // Computed data for the selected college
  const selectedCollegeAccounts = useMemo(() => {
    if (!selectedCollegeForView) return []
    return bankAccounts.filter((a) => a.universityId === selectedCollegeForView.id)
  }, [bankAccounts, selectedCollegeForView])

  const selectedCollegeAccountIds = useMemo(() => {
    return selectedCollegeAccounts.map((a) => a.id)
  }, [selectedCollegeAccounts])

  const selectedCollegeStatements = useMemo(() => {
    if (!selectedCollegeForView) return []
    return statements.filter(
      (s) =>
        s.universityId === selectedCollegeForView.id ||
        selectedCollegeAccountIds.includes(s.accountId)
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
  // VIEW 1: COLLEGE DETAILS & TRANSACTIONS (Opened when "View" is clicked)
  // =========================================================================
  if (selectedCollegeForView) {
    const alloc = Number(selectedCollegeForView.allocatedAmount) || 0
    const spent = Number(selectedCollegeForView.spentAmount) || 0
    const balance = Math.max(0, alloc - spent)
    const utilization = alloc > 0 ? Math.min(100, Math.round((spent / alloc) * 100)) : 0
    const compliance = Number(selectedCollegeForView.complianceScore) || 90

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
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to All Colleges
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1f2328]">
                  {selectedCollegeForView.name}
                </h1>
                <span className="font-mono text-xs text-[#57606a] bg-[#eaeef2] px-1.5 py-0.5 rounded font-semibold">
                  {selectedCollegeForView.code}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {selectedCollegeForView.institutionType || 'State Public'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectTab('reports')}
              className="text-xs text-[#0969da]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              View Reports
            </Button>
          </div>
        </div>

        {/* 1. College Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              State Budget Allocation
            </div>
            <div className="text-xl font-bold text-[#1f2328] mt-1 font-mono">
              {formatCurrency(alloc)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              Total Spent (Expenditure)
            </div>
            <div className="text-xl font-bold text-[#1f2328] mt-1 font-mono">
              {formatCurrency(spent)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              Remaining Balance
            </div>
            <div className="text-xl font-bold text-[#1f2328] mt-1 font-mono">
              {formatCurrency(balance)}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#d0d7de] shadow-2xs">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              Utilization Rate
            </div>
            <div className="text-xl font-bold text-[#0969da] mt-1 font-mono">
              {utilization}%
            </div>
          </div>
        </div>

        {/* 2. College Institutional Parameters */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0969da]" />
            College Institutional Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Official Email</span>
              <div className="font-mono text-xs text-[#1f2328] font-medium break-all">
                {selectedCollegeForView.officialEmail || 'N/A'}
              </div>
              <span className="text-[10px] text-[#656d76]">Campus Registrar</span>
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#0969da] uppercase">Authorized Finance Email</span>
              <div className="font-mono text-xs text-[#0969da] font-bold break-all">
                {selectedCollegeForView.financeEmail || 'N/A'}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">Finance Portal Login</span>
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Location</span>
              <div className="text-xs text-[#1f2328] font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#57606a]" />
                {selectedCollegeForView.district || 'Karnataka'}, {selectedCollegeForView.state || 'Karnataka'}
              </div>
              {selectedCollegeForView.address && (
                <div className="text-[10px] text-[#656d76] truncate">{selectedCollegeForView.address}</div>
              )}
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Affiliated University / Body</span>
              <div className="text-xs text-[#1f2328] font-medium">
                {selectedCollegeForView.affiliatedUniversity || 'Autonomous / Independent'}
              </div>
            </div>

            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50 space-y-1">
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Status</span>
              <div>
                <Badge
                  variant={
                    selectedCollegeForView.status === 'Optimal'
                      ? 'success'
                      : selectedCollegeForView.status === 'Watch'
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
              <span className="text-[10px] font-semibold text-[#57606a] uppercase">Compliance Score</span>
              <div className="text-xs font-bold text-[#1f2328] font-mono">
                {compliance}%
              </div>
            </div>
          </div>
        </div>

        {/* 3. Registered Bank Accounts */}
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
                          {acc.accountType || 'Savings'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-[#57606a]">
                        {acc.branchName || 'Main Branch'} • {acc.ifscCode}
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

        {/* 4. All Transactions Ledger */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0969da]" />
                Transactions Ledger ({selectedCollegeTransactions.length})
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
  // VIEW 2: ONLY LIST OF COLLEGES (Default view)
  // =========================================================================
  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center font-bold text-lg text-[#0969da]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
                All Colleges
              </h1>
              <div className="text-xs text-[#57606a]">
                {universities.length} Institutions Registered
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 text-xs shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add College
            </Button>
          </div>
        </div>
      </div>

      {/* List of Colleges Table */}
      <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search colleges by name, code, email, or district..."
              className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
            />
          </div>
          <span className="text-xs text-[#57606a] font-mono">
            {filteredUniversities.length} Colleges
          </span>
        </div>

        {/* Pure List of Colleges Table */}
        {filteredUniversities.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#d0d7de] rounded-lg">
            <Building2 className="h-8 w-8 text-[#57606a] mx-auto mb-2 opacity-40" />
            <div className="text-xs font-semibold text-[#1f2328]">No Colleges Found</div>
            {universities.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 text-xs"
              >
                + Add College
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                <tr>
                  <th className="py-3 px-3.5">College Name & Code</th>
                  <th className="py-3 px-3.5">Institution Type</th>
                  <th className="py-3 px-3.5">Official Email</th>
                  <th className="py-3 px-3.5">Authorized Finance Email</th>
                  <th className="py-3 px-3.5">District</th>
                  <th className="py-3 px-3.5">Allocated Budget</th>
                  <th className="py-3 px-3.5">Spent Amount</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {filteredUniversities.map((college) => {
                  const alloc = Number(college.allocatedAmount) || 0
                  const spent = Number(college.spentAmount) || 0

                  return (
                    <tr key={college.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-xs text-[#1f2328]">{college.name}</div>
                        <div className="font-mono text-[10px] text-[#57606a] mt-0.5">{college.code}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        <Badge variant="outline" className="text-[10px]">
                          {college.institutionType || 'State Public'}
                        </Badge>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[11px] text-[#1f2328]">
                        {college.officialEmail || 'N/A'}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-[#0969da]">
                        {college.financeEmail || 'N/A'}
                      </td>

                      <td className="py-3 px-3.5 text-[#57606a]">
                        {college.district || 'Karnataka'}
                      </td>

                      <td className="py-3 px-3.5 font-mono font-semibold text-[#1f2328]">
                        {formatCurrency(alloc)}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[#57606a]">
                        {formatCurrency(spent)}
                      </td>

                      <td className="py-3 px-3.5">
                        <Badge
                          variant={
                            college.status === 'Optimal'
                              ? 'success'
                              : college.status === 'Watch'
                              ? 'warning'
                              : 'danger'
                          }
                          className="text-[10px]"
                        >
                          {college.status || 'Optimal'}
                        </Badge>
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedCollegeForView(college)}
                          className="text-xs px-3 py-1 font-semibold"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shared Add College Modal */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />
    </div>
  )
}
