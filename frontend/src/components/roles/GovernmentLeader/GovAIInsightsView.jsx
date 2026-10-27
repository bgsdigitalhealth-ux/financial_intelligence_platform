import React, { useState, useMemo } from 'react'
import {
  Lightbulb,
  Printer,
  ChevronRight,
  X,
  AlertTriangle,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

export function GovAIInsightsView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    bankAccounts = [],
    statements = [],
    setSelectedUniversityId,
  } = useFinancialData()

  const [typeFilter, setTypeFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [selectedException, setSelectedException] = useState(null)

  // =========================================================================
  // DYNAMIC ANOMALY & EXCEPTION COMPUTATION (No hardcoded dummy records)
  // =========================================================================
  const allExceptions = useMemo(() => {
    const list = []

    universities.forEach((u) => {
      const uAccounts = (bankAccounts || []).filter((a) => a.universityId === u.id)
      const uAccountIds = uAccounts.map((a) => a.id)
      const uStmts = (statements || []).filter(
        (s) => s.universityId === u.id || uAccountIds.includes(s.accountId)
      )

      const activeAccountsCount = Math.max(1, uAccounts.length)
      const requiredCount = activeAccountsCount
      const receivedCount = uStmts.length
      const approvedCount = uStmts.filter(
        (s) => s.status === 'Approved by Gov Leader' || s.status === 'Approved' || s.status === 'AI Validated'
      ).length
      const rejectedCount = uStmts.filter((s) => s.status === 'Rejected').length
      const missingCount = Math.max(0, requiredCount - receivedCount)

      const credits = uStmts.reduce((sum, s) => sum + (Number(s.totalCredits) || 0), 0)
      const debits = uStmts.reduce((sum, s) => sum + (Number(s.totalDebits) || 0), 0)
      const rawAlloc = Number(u.allocation) || Number(u.allocatedAmount) || 0
      const alloc = credits > 0 ? credits : rawAlloc
      const spent = debits > 0 ? debits : (Number(u.spent) || Number(u.spentAmount) || 0)
      const balance = Math.max(0, alloc - spent)
      const utilization = alloc > 0 ? Math.round((spent / alloc) * 100) : 0

      // 1. Delayed Submission Rule
      if (missingCount > 0 || u.status === 'Pending' || receivedCount === 0) {
        list.push({
          id: `del-${u.id}`,
          type: 'Delayed Submission',
          tagClass: 'bg-amber-50 text-amber-800 border-amber-200',
          universityId: u.id,
          universityName: u.name,
          universityCode: u.code,
          description: `${missingCount} of ${requiredCount} bank statements not received; due 15 Oct 2024.`,
          severity: missingCount >= 2 ? 'High' : 'Medium',
          bulletPoints: [
            `Received: ${receivedCount}`,
            `Missing: ${missingCount}`,
            `Rejected: ${rejectedCount}`,
          ],
        })
      }

      // 2. High Outflow Rule
      if (spent > 0 && (utilization >= 75 || spent > alloc * 0.75)) {
        list.push({
          id: `outflow-${u.id}`,
          type: 'High Outflow',
          tagClass: 'bg-rose-50 text-rose-800 border-rose-200',
          universityId: u.id,
          universityName: u.name,
          universityCode: u.code,
          description: `External payments accelerated to ${utilization}% of sanctioned allocation (${formatCurrency(spent, true)} deployed).`,
          severity: utilization >= 85 ? 'High' : 'Medium',
          bulletPoints: [
            `Total Expended: ${formatCurrency(spent)}`,
            `Budget Sanctioned: ${formatCurrency(alloc)}`,
            `Remaining Treasury Balance: ${formatCurrency(balance)}`,
          ],
        })
      }

      // 3. Duplicate Candidate Transactions Rule
      const uTransactions = uStmts.flatMap((s) => s.transactions || s.rawTransactions || [])
      const amountCounts = {}
      uTransactions.forEach((t) => {
        const amt = Number(t.amount) || 0
        if (amt > 0) {
          amountCounts[amt] = (amountCounts[amt] || 0) + 1
        }
      })
      const duplicatePairs = Object.entries(amountCounts).filter(([_, count]) => count > 1)
      if (duplicatePairs.length > 0) {
        list.push({
          id: `dup-${u.id}`,
          type: 'Duplicate Transactions',
          tagClass: 'bg-purple-50 text-purple-800 border-purple-200',
          universityId: u.id,
          universityName: u.name,
          universityCode: u.code,
          description: `${duplicatePairs.length} duplicate-candidate payment pairs (same amount, category or reference).`,
          severity: 'Medium',
          bulletPoints: [
            `Duplicate Candidate Pairs: ${duplicatePairs.length}`,
            `Review Status: Awaiting Dual-Control Verification`,
            `Designated Account: ${uAccounts[0]?.accountNumber || 'Primary Escrow'}`,
          ],
        })
      }

      // 4. Compliance Score Watch Rule
      const score = Number(u.complianceScore) || 100
      if (score < 85 || u.status === 'Watch' || u.status === 'Critical') {
        list.push({
          id: `comp-${u.id}`,
          type: 'Compliance Watch',
          tagClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          universityId: u.id,
          universityName: u.name,
          universityCode: u.code,
          description: `Institution compliance conformance score evaluated at ${score}/100. Review recommended under Section 102.`,
          severity: score < 75 ? 'High' : 'Medium',
          bulletPoints: [
            `Compliance Score: ${score}/100`,
            `Status Grade: ${u.complianceGrade || 'B'}`,
            `Active Solvency Accounts: ${activeAccountsCount}`,
          ],
        })
      }
    })

    // 5. Statement Variance Rule
    statements.forEach((s) => {
      if (Number(s.varianceAmount) > 0 || s.reconciliationMatch === false) {
        list.push({
          id: `var-${s.id}`,
          type: 'Reconciliation Variance',
          tagClass: 'bg-rose-50 text-rose-800 border-rose-200',
          universityId: s.universityId,
          universityName: s.universityName,
          universityCode: 'STMT',
          description: `Statement reconciliation discrepancy: variance of ${formatCurrency(s.varianceAmount)} detected in ${s.quarter}.`,
          severity: 'High',
          bulletPoints: [
            `Reported Variance: ${formatCurrency(s.varianceAmount)}`,
            `Closing Balance: ${formatCurrency(s.closingBalance)}`,
            `Statement Quarter: ${s.quarter}`,
          ],
        })
      }
    })

    return list
  }, [universities, bankAccounts, statements])

  // Available unique types for filter dropdown
  const availableTypes = useMemo(() => {
    return Array.from(new Set(allExceptions.map((e) => e.type)))
  }, [allExceptions])

  // Filtered exceptions based on dropdown choices
  const filteredExceptions = useMemo(() => {
    return allExceptions.filter((e) => {
      const matchType = typeFilter === 'ALL' || e.type === typeFilter
      const matchSev = severityFilter === 'ALL' || e.severity === severityFilter
      return matchType && matchSev
    })
  }, [allExceptions, typeFilter, severityFilter])

  // Open university overview drill-down and show its transactions
  const handleOpenUniversityOverview = (universityId) => {
    if (setSelectedUniversityId && universityId) {
      setSelectedUniversityId(universityId)
    }
    setSelectedException(null)
    onSelectTab('all_colleges')
    if (onTriggerToast) {
      onTriggerToast('Opening University Transactions', 'Navigated to university transaction ledger.', 'info')
    }
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Demonstration Banner */}
      <div className="inline-flex items-center gap-2 rounded-md bg-[#fff8c5] border border-[#d4a72c]/40 px-3 py-1.5 text-xs text-[#5f370e] font-medium shadow-2xs">
        <span className="text-amber-700 font-bold">DEMONSTRATION DATA — NOT OFFICIAL FINANCIAL RECORDS</span>
      </div>

      {/* Top Breadcrumb Text */}
      <div className="text-xs text-[#57606a]">
        Leadership &gt; <span className="font-semibold text-[#1f2328]">AI Insights</span>
      </div>

      {/* Main Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0969da] shrink-0 shadow-2xs mt-0.5">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
              AI Insights & Exceptions
            </h1>
            <p className="text-xs text-[#57606a]">
              SYNTHETIC DEMO OUTPUT · {allExceptions.length} exceptions · FY 2024-25 Q2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs flex items-center gap-1.5 text-[#1f2328] bg-white border-[#d0d7de]"
          >
            <Printer className="h-3.5 w-3.5" />
            Print A4
          </Button>
        </div>
      </div>

      {/* Subheader & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h2 className="text-sm font-bold text-[#1f2328]">
          Exceptions ({filteredExceptions.length})
        </h2>

        <div className="flex items-center gap-2">
          {/* Type Filter Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">All types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Severity Filter Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">All severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Exceptions List */}
      <div className="rounded-xl border border-[#d0d7de] bg-white overflow-hidden shadow-2xs divide-y divide-[#d0d7de]">
        {filteredExceptions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#57606a]">
            No exceptions found matching the selected filter criteria.
          </div>
        ) : (
          filteredExceptions.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedException(item)}
              className="p-4 hover:bg-[#f6f8fa] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${item.tagClass}`}
                  >
                    {item.type}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#1f2328] mt-1">
                  {item.universityName}
                </div>
                <div className="text-xs text-[#57606a]">
                  {item.description}
                </div>
              </div>

              <div className="shrink-0 sm:text-right">
                <span
                  className={`text-xs font-semibold ${
                    item.severity === 'High' ? 'text-rose-600' : 'text-amber-600'
                  }`}
                >
                  {item.severity}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          MODAL CARD (Opened on clicking any exception list item)
          ========================================================================= */}
      {selectedException && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#d0d7de] p-6 max-w-lg w-full shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="pr-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1f2328]">
                  {selectedException.type} — {selectedException.universityName}
                </h3>
                <button
                  onClick={() => setSelectedException(null)}
                  className="absolute top-4 right-4 text-[#57606a] hover:text-[#1f2328] p-1 rounded-md hover:bg-[#eaeef2] transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[11px] text-[#57606a] uppercase tracking-wider font-medium mt-1">
                SYNTHETIC DEMO OUTPUT — rule-based recommendation, not an accounting finding.
              </div>
            </div>

            {/* Modal Body */}
            <p className="text-xs text-[#1f2328] leading-relaxed">
              {selectedException.description}
            </p>

            {/* Bullet Points */}
            <div className="space-y-1.5 text-xs text-[#1f2328] py-1">
              {selectedException.bulletPoints?.map((bp, i) => (
                <div key={i} className="flex items-center gap-2 font-medium">
                  <span className="text-[#57606a]">•</span>
                  <span>{bp}</span>
                </div>
              ))}
            </div>

            {/* Severity Tag */}
            <div className="text-xs text-[#1f2328] flex items-center gap-2 pt-1">
              <span className="font-semibold text-[#57606a]">Severity:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedException.severity === 'High'
                    ? 'text-rose-600 bg-rose-50 border border-rose-200'
                    : 'text-amber-700 bg-amber-50 border border-amber-200'
                }`}
              >
                {selectedException.severity}
              </span>
            </div>

            {/* Modal Action Button */}
            <div className="flex justify-end pt-3 border-t border-[#f1f5f9]">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleOpenUniversityOverview(selectedException.universityId)}
                className="bg-[#0969da] text-white hover:bg-[#085ec4] text-xs font-semibold px-4 py-2"
              >
                Open university overview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
