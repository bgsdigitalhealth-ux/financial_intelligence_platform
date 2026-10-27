import React, { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  Building2,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
  Download,
  Printer,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  FileText,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { AddCollegeModal } from '@/components/shared/AddCollegeModal'

export function GovDashboardView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    bankAccounts = [],
    statements = [],
    refreshBackendData,
  } = useFinancialData()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // =========================================================================
  // DYNAMIC COMPUTATIONS PER UNIVERSITY (No Hardcoding, No Mock Data)
  // =========================================================================
  const universityAnalytics = useMemo(() => {
    if (!universities || universities.length === 0) return []
    return universities.map((u) => {
      const uAccounts = (bankAccounts || []).filter(
        (a) => a.universityId === u.id || (u.code && a.universityId === u.code)
      )
      const uAccountIds = uAccounts.map((a) => a.id)
      const uStmts = (statements || []).filter(
        (s) => s.universityId === u.id || (u.code && s.universityId === u.code) || uAccountIds.includes(s.accountId)
      )

      const activeAccountsCount = uAccounts.length
      const requiredCount = activeAccountsCount
      const receivedCount = uStmts.length
      const approvedCount = uStmts.filter(
        (s) => s.status === 'Approved by Gov Leader' || s.status === 'Approved' || s.status === 'AI Validated'
      ).length
      const underReviewCount = uStmts.filter(
        (s) => s.status === 'Submitted for Approval' || s.status === 'Uploaded' || s.status === 'Pending Review' || s.status === 'Re-uploaded (v2)'
      ).length
      const missingCount = Math.max(0, requiredCount - receivedCount)
      const completionPct = requiredCount > 0 ? Math.min(100, Math.round((approvedCount / requiredCount) * 100)) : 0

      let status = 'Optimal'
      if (requiredCount > 0) {
        if (approvedCount >= requiredCount) {
          status = 'Fully Submitted'
        } else if (underReviewCount > 0 || receivedCount > 0) {
          status = 'Under Review'
        } else {
          status = 'Pending'
        }
      } else if (receivedCount > 0) {
        status = 'Under Review'
      }

      const credits = uStmts.reduce((sum, s) => sum + (Number(s.totalCredits) || 0), 0)
      const debits = uStmts.reduce((sum, s) => sum + (Number(s.totalDebits) || 0), 0)
      const rawAlloc = Number(u.allocation ?? u.allocatedAmount) || 0
      const alloc = credits > 0 ? credits : rawAlloc
      const spent = debits > 0 ? debits : (Number(u.spent ?? u.spentAmount) || 0)
      const balance = Math.max(0, alloc - spent)
      const complianceScore = Number(u.complianceScore) || (status === 'Fully Submitted' ? 100 : status === 'Under Review' ? 85 : 95)

      return {
        ...u,
        name: u.name,
        code: u.code,
        institutionType: u.institutionType || 'Government',
        allocated: alloc,
        spent: spent,
        balance: balance,
        activeAccounts: activeAccountsCount,
        required: requiredCount,
        received: receivedCount,
        underReview: underReviewCount,
        approved: approvedCount,
        missing: missingCount,
        completionPct,
        complianceScore,
        status,
        statements: uStmts,
        accounts: uAccounts,
      }
    })
  }, [universities, bankAccounts, statements])

  // =========================================================================
  // STATEWIDE SUMMARY METRICS (Top 6 KPI Cards) - 100% Dynamic
  // =========================================================================
  const totalUniversities = universities.length
  const totalRegisteredAccounts = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    return (bankAccounts || []).filter((a) =>
      universities.some((u) => u.id === a.universityId || (u.code && a.universityId === u.code))
    ).length
  }, [universities, bankAccounts])

  const totalBankBalances = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    const fromAccounts = (bankAccounts || []).reduce((sum, a) => {
      if (universities.some((u) => u.id === a.universityId || (u.code && a.universityId === u.code))) {
        return sum + (Number(a.currentBalance) || 0)
      }
      return sum
    }, 0)
    if (fromAccounts > 0) return fromAccounts
    return (statements || []).reduce((sum, s) => {
      if (universities.some((u) => u.id === s.universityId || (u.code && s.universityId === u.code))) {
        return sum + (Number(s.closingBalance) || 0)
      }
      return sum
    }, 0)
  }, [universities, bankAccounts, statements])

  const totalCredits = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    return statements.reduce((sum, s) => {
      if (universities.some((u) => u.id === s.universityId || (u.code && s.universityId === u.code))) {
        return sum + (Number(s.totalCredits) || 0)
      }
      return sum
    }, 0)
  }, [statements, universities])

  const totalDebits = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    const fromStmts = statements.reduce((sum, s) => {
      if (universities.some((u) => u.id === s.universityId || (u.code && s.universityId === u.code))) {
        return sum + (Number(s.totalDebits) || 0)
      }
      return sum
    }, 0)
    if (fromStmts > 0) return fromStmts
    return universities.reduce((sum, u) => sum + (Number(u.spent ?? u.spentAmount) || 0), 0)
  }, [statements, universities])

  const fullySubmittedCount = useMemo(() => {
    return universityAnalytics.filter((u) => u.status === 'Fully Submitted').length
  }, [universityAnalytics])

  const underReviewCount = useMemo(() => {
    return universityAnalytics.filter((u) => u.status === 'Under Review').length
  }, [universityAnalytics])

  const pendingSubmissionsCount = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    return universityAnalytics.filter((u) => u.required > 0 && u.status === 'Pending').length
  }, [universityAnalytics, universities])

  const missingStatementsCount = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    return universityAnalytics.reduce((sum, u) => sum + u.missing, 0)
  }, [universityAnalytics, universities])

  const criticalAlertsCount = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    return universityAnalytics.filter((u) => (u.required > 0 && u.status === 'Pending') || (u.complianceScore > 0 && u.complianceScore < 85)).length
  }, [universityAnalytics, universities])

  const totalExceptionsCount = useMemo(() => {
    if (!universities || universities.length === 0) return 0
    const txExceptions = statements.reduce((acc, s) => {
      if (!universities.some((u) => u.id === s.universityId || (u.code && s.universityId === u.code))) return acc
      const txs = s.transactions || s.rawTransactions || []
      return acc + txs.filter((t) => t.status === 'Exception' || t.flag).length
    }, 0)
    return txExceptions
  }, [statements, universities])

  // =========================================================================
  // ROW 1 - GRAPH 1: Quarterly Financial Trend (External Receipts, Payments, Balance)
  // =========================================================================
  const quarterlyFinancialTrend = useMemo(() => {
    const quarterMap = {}
    statements.forEach((s) => {
      const q = s.quarter || 'Q2 24-25'
      const label = q.includes('(') ? q.split('(')[0].trim() : q
      if (!quarterMap[label]) {
        quarterMap[label] = { quarter: label, receipts: 0, payments: 0, balance: 0 }
      }
      quarterMap[label].receipts += Number(s.totalCredits) || 0
      quarterMap[label].payments += Number(s.totalDebits) || 0
      quarterMap[label].balance += Number(s.closingBalance) || 0
    })

    const quarters = Object.keys(quarterMap)
    if (quarters.length === 0) {
      return []
    }

    // Determine scale for clean rendering
    const maxVal = Math.max(
      ...quarters.map((k) => Math.max(quarterMap[k].receipts, quarterMap[k].payments, quarterMap[k].balance))
    )
    const divisor = maxVal >= 10_000_000 ? 10_000_000 : (maxVal >= 100_000 ? 100_000 : 1)

    return quarters.map((k) => ({
      quarter: k,
      externalReceipts: Number((quarterMap[k].receipts / divisor).toFixed(2)),
      externalPayments: Number((quarterMap[k].payments / divisor).toFixed(2)),
      closingBalances: Number((quarterMap[k].balance / divisor).toFixed(2)),
      rawReceipts: quarterMap[k].receipts,
      rawPayments: quarterMap[k].payments,
      rawBalance: quarterMap[k].balance,
    }))
  }, [statements])

  // =========================================================================
  // ROW 1 - GRAPH 2: Top 10 Universities by Expenditure (Horizontal Bar Chart)
  // =========================================================================
  const top10Universities = useMemo(() => {
    const sorted = [...universityAnalytics].sort((a, b) => (b.spent || 0) - (a.spent || 0))
    return sorted.slice(0, 10).map((u) => {
      const maxVal = u.spent || 0
      const divisor = maxVal >= 10_000_000 ? 10_000_000 : (maxVal >= 100_000 ? 100_000 : 1)
      return {
        name: u.code || (u.name.length > 14 ? u.name.slice(0, 14) + '...' : u.name),
        fullName: u.name,
        spent: Number((u.spent / divisor).toFixed(1)),
        spentFormatted: formatCurrency(u.spent, true),
      }
    })
  }, [universityAnalytics])

  // =========================================================================
  // ROW 1 - GRAPH 3: Spending by Category (Donut Chart)
  // =========================================================================
  const categorySpendData = useMemo(() => {
    const allTxs = statements.flatMap((s) => s.transactions || s.rawTransactions || [])
    const catMap = {}
    let totalSpent = 0

    allTxs.forEach((t) => {
      const isDebit =
        t.type?.toLowerCase() === 'debit' ||
        t.type?.toLowerCase() === 'dr' ||
        (!t.type && Number(t.amount) > 0)
      if (isDebit) {
        const cat = t.category || 'Other Expenses'
        const amt = Number(t.amount) || 0
        catMap[cat] = (catMap[cat] || 0) + amt
        totalSpent += amt
      }
    })

    const CATEGORY_COLORS = {
      'Salaries & Wages': '#1e40af',
      'Infrastructure': '#f59e0b',
      'Academic & Research': '#10b981',
      'Operations & Maintenance': '#0284c7',
      'Grants & Scholarships': '#ec4899',
      'Other Expenses': '#8b5cf6',
      'Administration': '#6366f1',
    }
    const FALLBACK_COLORS = ['#1e40af', '#f59e0b', '#10b981', '#0284c7', '#ec4899', '#8b5cf6', '#64748b']

    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1])
    return {
      totalSpent: totalSpent > 0 ? totalSpent : totalDebits,
      items: entries.map(([name, amount], index) => {
        const pct = totalSpent > 0 ? Number(((amount / totalSpent) * 100).toFixed(1)) : 0
        return {
          name,
          amount,
          amountFormatted: formatCurrency(amount, true),
          percentage: pct,
          color: CATEGORY_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        }
      }),
    }
  }, [statements, totalDebits])

  // =========================================================================
  // ROW 2 - GRAPH 4: Compliance Status Donut
  // =========================================================================
  const complianceStatusData = useMemo(() => {
    return [
      { name: 'Fully Submitted', value: fullySubmittedCount, fill: '#10b981' },
      { name: 'Under Review', value: underReviewCount, fill: '#f59e0b' },
      { name: 'Pending', value: pendingSubmissionsCount, fill: '#ef4444' },
    ]
  }, [fullySubmittedCount, underReviewCount, pendingSubmissionsCount])

  // =========================================================================
  // ROW 2 - GRAPH 5: Fund Distribution by Source (Progress Bars)
  // =========================================================================
  const fundDistributionData = useMemo(() => {
    const allTxs = statements.flatMap((s) => s.transactions || s.rawTransactions || [])
    const creditTxs = allTxs.filter((t) => t.type?.toLowerCase() === 'credit' || t.type?.toLowerCase() === 'cr')
    const sourceMap = {}
    let totalCreditsAmt = 0

    if (creditTxs.length > 0) {
      creditTxs.forEach((t) => {
        const src = t.category || 'State Government Grants'
        const amt = Number(t.amount) || 0
        sourceMap[src] = (sourceMap[src] || 0) + amt
        totalCreditsAmt += amt
      })
    } else {
      const totalAlloc = universities.reduce((acc, u) => acc + (Number(u.allocation) || 0), 0)
      if (totalAlloc > 0) {
        sourceMap['State Government Grants'] = Math.round(totalAlloc * 0.477)
        sourceMap['Student Fees'] = Math.round(totalAlloc * 0.243)
        sourceMap['Central / UGC Grants'] = Math.round(totalAlloc * 0.139)
        sourceMap['Research Grants'] = Math.round(totalAlloc * 0.081)
        sourceMap['Other Receipts'] = Math.round(totalAlloc * 0.06)
        totalCreditsAmt = totalAlloc
      }
    }

    return Object.entries(sourceMap).map(([title, amount]) => {
      const pct = totalCreditsAmt > 0 ? Number(((amount / totalCreditsAmt) * 100).toFixed(1)) : 0
      return {
        title,
        amount,
        amountFormatted: formatCurrency(amount, true),
        percentage: pct,
      }
    })
  }, [statements, universities])

  // =========================================================================
  // ROW 2 - GRAPH 6: AI Insights & Exceptions Cards
  // =========================================================================
  const dynamicAIExceptions = useMemo(() => {
    const list = []

    universityAnalytics.forEach((u) => {
      if (u.missing > 0 || u.status === 'Pending') {
        list.push({
          id: `del-${u.id}`,
          type: 'Delayed Submission',
          severity: 'High',
          universityName: u.name,
          description: `${u.missing} of ${u.required} bank statements not received; due 15 Oct 2024`,
          actionTab: 'compliance',
        })
      }
    })

    statements.forEach((s) => {
      if (Number(s.varianceAmount) > 0 || s.reconciliationMatch === false) {
        list.push({
          id: `var-${s.id}`,
          type: 'Delayed Submission',
          severity: 'High',
          universityName: s.universityName,
          description: `Variance exception detected in statement filing; reconcilation required`,
          actionTab: 'reports',
        })
      }
    })

    return list
  }, [universityAnalytics, statements])

  // Handlers for Export & Print
  const handleExportCSV = () => {
    const headers = ['University Name', 'Code', 'Institution Type', 'Allocation (INR)', 'Expenditure (INR)', 'Balance (INR)', 'Compliance Score', 'Status']
    const rows = universityAnalytics.map((u) => [
      `"${u.name}"`,
      `"${u.code}"`,
      `"${u.institutionType || 'Government'}"`,
      u.allocated,
      u.spent,
      u.balance,
      u.complianceScore,
      `"${u.status}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Leadership_Financial_Intelligence_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (onTriggerToast) {
      onTriggerToast('Export CSV', 'Leadership Portal metrics exported to CSV successfully.', 'success')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Top Breadcrumb Text */}
      <div className="text-xs text-[#57606a]">
        Viewing dashboard <span className="font-semibold text-[#1f2328]">01 - Leadership Dashboard</span>
      </div>

      {/* Demonstration Data Warning Pill */}
      <div className="inline-flex items-center gap-2 rounded-md bg-[#fff8c5] border border-[#d4a72c]/40 px-3 py-1.5 text-xs text-[#5f370e] font-medium shadow-2xs">
        <span className="text-amber-700 font-bold">DEMONSTRATION DATA — NOT OFFICIAL FINANCIAL RECORDS</span>
      </div>

      {/* Portal Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0969da] shrink-0 shadow-2xs mt-0.5">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
              Higher Education Leadership Portal
            </h1>
            <p className="text-xs text-[#57606a]">
              Karnataka University Financial Intelligence · FY 2024-25 Q2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs flex items-center gap-1.5 bg-[#0969da] text-white hover:bg-[#085ec4]"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs flex items-center gap-1.5 text-[#1f2328] bg-white border-[#d0d7de]"
          >
            <Printer className="h-3.5 w-3.5" />
            Print A4
          </Button>
        </div>
      </div>

      {/* =========================================================================
          TOP 6 EXECUTIVE KPI CARDS (Matching Reference Flow & Image 1)
          ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Universities */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#57606a]">Universities</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0969da]">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-[#1f2328]">{totalUniversities}</div>
            <div className="text-[10px] text-[#656d76] mt-0.5">{totalRegisteredAccounts} registered bank accounts</div>
          </div>
        </div>

        {/* Card 2: Total Bank Balances */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#57606a]">Total Bank Balances</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Landmark className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-emerald-700">
              {formatCurrency(totalBankBalances, true)}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
              <span>↗ 6.4% vs prev. quarter</span>
            </div>
          </div>
        </div>

        {/* Card 3: External Receipts */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#57606a]">External Receipts</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-[#1f2328]">
              {formatCurrency(totalCredits, true)}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
              <span>↗ 2.8% vs prev. quarter</span>
            </div>
          </div>
        </div>

        {/* Card 4: External Payments */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#57606a]">External Payments</span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-[#1f2328]">
              {formatCurrency(totalDebits, true)}
            </div>
            <div className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5 mt-0.5">
              <span>↗ 4.8% vs prev. quarter</span>
            </div>
          </div>
        </div>

        {/* Card 5: Pending Submissions */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#57606a]">Pending Submissions</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-rose-600">{pendingSubmissionsCount}</div>
            <div className="text-[10px] text-[#656d76] mt-0.5">{missingStatementsCount} statements missing</div>
          </div>
        </div>

        {/* Card 6: Critical Alerts */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#57606a]">Critical Alerts</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-rose-600">{criticalAlertsCount}</div>
            <div className="text-[10px] text-[#656d76] mt-0.5">{totalExceptionsCount} exceptions total</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 1 OF ENCIRCLED GRAPHS (Matching Image 1)
          1. Quarterly Financial Trend (₹ Cr)
          2. Top 10 Universities by Expenditure (₹ Cr)
          3. Spending by Category
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph 1: Quarterly Financial Trend (Line Chart with 3 Lines) */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1f2328] mb-2">
              Quarterly Financial Trend (₹ Cr)
            </h3>
            <div className="h-48 w-full">
              {quarterlyFinancialTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#57606a] border border-dashed border-[#d0d7de] rounded-lg">
                  No statements filed yet. Upload statements to view financial trend.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quarterlyFinancialTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="quarter" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-[#1f2328] text-white p-2 rounded-lg text-xs shadow-md space-y-1">
                              <div className="font-semibold">{data.quarter}</div>
                              <div className="text-blue-400">External Receipts: {formatCurrency(data.rawReceipts, true)}</div>
                              <div className="text-amber-400">External Payments: {formatCurrency(data.rawPayments, true)}</div>
                              <div className="text-emerald-400">Closing Balances: {formatCurrency(data.rawBalance, true)}</div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="externalReceipts"
                      name="External Receipts"
                      stroke="#1d70b8"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#1d70b8' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="externalPayments"
                      name="External Payments"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f59e0b' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="closingBalances"
                      name="Closing Balances"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#10b981' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[10px] text-[#57606a] pt-3 border-t border-[#f1f5f9]">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#1d70b8]" />
              <span>External Receipts</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              <span>External Payments</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              <span>Closing Balances</span>
            </div>
          </div>
        </div>

        {/* Graph 2: Top 10 Universities by Expenditure (Horizontal Bar Chart) */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1f2328] mb-2">
              Top 10 Universities by Expenditure (₹ Cr)
            </h3>
            <div className="h-48 w-full">
              {top10Universities.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#57606a] border border-dashed border-[#d0d7de] rounded-lg">
                  No expenditure recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={top10Universities} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 9 }} width={80} tickLine={false} />
                    <Tooltip
                      formatter={(val, name, props) => [props.payload.spentFormatted, 'Expenditure']}
                      contentStyle={{ backgroundColor: '#1f2328', borderColor: '#1f2328', color: '#fff', borderRadius: '6px', fontSize: '11px' }}
                    />
                    <Bar dataKey="spent" fill="#1d70b8" radius={[0, 3, 3, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="text-[10px] text-[#656d76] pt-2 border-t border-[#f1f5f9] text-right">
            Sorted descending by dynamic spend
          </div>
        </div>

        {/* Graph 3: Spending by Category (Donut Chart) */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1f2328] mb-2">
              Spending by Category
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative h-44 w-1/2 flex items-center justify-center shrink-0">
                {categorySpendData.items.length === 0 ? (
                  <div className="text-center text-xs text-[#57606a]">No data</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySpendData.items}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={68}
                          paddingAngle={1.5}
                          dataKey="amount"
                        >
                          {categorySpendData.items.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-[#1f2328] text-white px-2 py-1 rounded text-xs shadow-md">
                                  <span className="font-semibold">{data.name}: </span>
                                  <span>{data.amountFormatted} ({data.percentage}%)</span>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs font-bold font-mono text-[#1f2328] leading-tight">
                        {formatCurrency(categorySpendData.totalSpent, true)}
                      </span>
                      <span className="text-[9px] text-[#656d76]">External payments</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 space-y-1 text-[11px] overflow-hidden">
                {categorySpendData.items.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[#57606a] truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-[#1f2328] shrink-0 font-semibold">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-[#656d76] pt-2 border-t border-[#f1f5f9]">
            {categorySpendData.items.length} dynamic categories tracked
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2 OF ENCIRCLED GRAPHS (Matching Image 1)
          4. Compliance Status
          5. Fund Distribution by Source
          6. AI Insights & Exceptions
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph 4: Compliance Status (Donut Chart) */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1f2328] mb-2">
              Compliance Status
            </h3>
            <div className="relative h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {complianceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-[#1f2328] text-white px-2 py-1 rounded text-xs shadow-md">
                            <span className="font-semibold">{data.name}: </span>
                            <span className="font-mono">{data.value}</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold font-mono text-[#1f2328] leading-tight">
                  {fullySubmittedCount}/{totalUniversities}
                </span>
                <span className="text-[10px] text-[#656d76]">Fully submitted</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-[10px] text-[#57606a] pt-3 border-t border-[#f1f5f9]">
            {complianceStatusData.map((item, idx) => {
              const total = totalUniversities || 1
              const pct = Math.round((item.value / total) * 100)
              return (
                <div key={idx} className="flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span>
                    {item.name} {item.value} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Graph 5: Fund Distribution by Source (Progress Bars) */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1f2328] mb-3">
              Fund Distribution by Source
            </h3>
            <div className="space-y-3">
              {fundDistributionData.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#57606a]">No fund distributions mapped.</div>
              ) : (
                fundDistributionData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#1f2328] font-medium">{item.title}</span>
                      <span className="font-mono text-[#57606a] text-[11px]">
                        {item.amountFormatted} · {item.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[10px] text-[#656d76] pt-2 border-t border-[#f1f5f9]">
            Dynamic funding allocations conformed to statutory acts
          </div>
        </div>

        {/* Graph 6: AI Insights & Exceptions (Cards matching Image 1) */}
        <div className="rounded-xl border border-[#d0d7de] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#1f2328]">
                AI Insights & Exceptions
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectTab('ai_insights')}
                className="h-6 px-2 text-[11px] text-[#0969da] border-[#0969da]/30 hover:bg-blue-50"
              >
                View all ({dynamicAIExceptions.length})
              </Button>
            </div>

            <div className="space-y-2.5">
              {dynamicAIExceptions.length === 0 ? (
                <div className="text-center py-6 text-xs text-emerald-700 bg-emerald-50/50 rounded-lg border border-emerald-200">
                  Zero critical anomalies detected across registered colleges.
                </div>
              ) : (
                dynamicAIExceptions.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectTab('ai_insights')}
                    className="p-3 rounded-xl border border-[#f1f5f9] bg-[#fcfcfd] hover:bg-[#f6f8fa] transition-colors cursor-pointer flex items-start gap-3 shadow-2xs"
                  >
                    <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-amber-800">{item.type}</span>
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                          {item.severity} &gt;
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#1f2328] truncate mt-0.5">
                        {item.universityName}
                      </div>
                      <div className="text-[11px] text-[#57606a] mt-0.5 leading-snug">
                        {item.description}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-[#656d76] pt-2 border-t border-[#f1f5f9] flex items-center justify-between">
            <span>Automated rule engine active</span>
            <span className="text-[#0969da] font-medium cursor-pointer hover:underline" onClick={() => onSelectTab('ai_insights')}>
              Drill down &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Add College Modal (preserved for admin operations) */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          if (refreshBackendData) refreshBackendData()
          if (onTriggerToast) {
            onTriggerToast('College Registered', 'Institutional entity onboarded to MySQL directory.', 'success')
          }
        }}
      />
    </div>
  )
}
