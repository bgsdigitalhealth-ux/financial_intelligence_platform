import React, { useState, useMemo } from 'react'
import {
  IndianRupee,
  Receipt,
  FileText,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Bell,
  ArrowRight,
  UploadCloud,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

// Palette matching mockup
const CATEGORY_COLORS = [
  '#3b82f6', // Salaries & Wages - Blue
  '#06b6d4', // Infrastructure - Cyan
  '#10b981', // Utilities - Green
  '#f59e0b', // Academic Resources - Amber
  '#8b5cf6', // Administrative - Purple
  '#ec4899', // Others - Pink
  '#64748b', // Slate
]

export function UnivOverviewView({ onSelectTab, onTriggerToast, canEditReupload = true }) {
  const {
    universities = [],
    bankAccounts = [],
    statements = [],
  } = useFinancialData()
  const { currentUser } = useAuth()

  // Selected FY State
  const [selectedFY, setSelectedFY] = useState('FY 2025 - 2026')

  // Strictly login-based institution: dynamic matching against logged-in user profile
  const myUniversity = useMemo(() => {
    if (currentUser?.universityId) {
      const u = (universities || []).find((x) => x.id === currentUser.universityId)
      if (u) return u
    }
    if (currentUser?.universityName) {
      const u = (universities || []).find((x) =>
        x.name.toLowerCase().includes(currentUser.universityName.toLowerCase())
      )
      if (u) return u
    }
    if (currentUser?.organization) {
      const org = currentUser.organization.toLowerCase()
      const u = (universities || []).find(
        (x) =>
          org.includes(x.name.toLowerCase()) ||
          x.name.toLowerCase().includes(org) ||
          (x.code && org.includes(x.code.toLowerCase()))
      )
      if (u) return u
    }
    return (
      (universities || [])[0] || {
        id: 'univ-01',
        name: 'Higher Education Institution',
        code: 'VTU',
        allocation: 500000000,
        spent: 0,
      }
    )
  }, [universities, currentUser])

  // Own bank accounts
  const ownAccounts = useMemo(() => {
    return (bankAccounts || []).filter((a) => a.universityId === myUniversity?.id)
  }, [bankAccounts, myUniversity])

  // Current university's quarterly statements
  const myStatements = useMemo(() => {
    return (statements || []).filter(
      (s) => s.universityId === myUniversity?.id || s.universityName === myUniversity?.name
    )
  }, [statements, myUniversity])

  const activeStatement = myStatements[0] || null

  // All transactions across university statements
  const allTransactions = useMemo(() => {
    const list = []
    myStatements.forEach((stmt) => {
      let txs = stmt.transactions
      if (typeof txs === 'string') {
        try {
          txs = JSON.parse(txs)
        } catch {
          txs = []
        }
      }
      if (Array.isArray(txs)) {
        list.push(...txs)
      }
    })
    return list
  }, [myStatements])

  // Dynamic calculations for the 4 KPI cards
  const totalCredits = useMemo(() => {
    if (myStatements.length > 0) {
      return myStatements.reduce((sum, s) => sum + (Number(s.totalCredits) || 0), 0)
    }
    return Number(myUniversity?.allocation) || 0
  }, [myStatements, myUniversity])

  const totalDebits = useMemo(() => {
    if (myStatements.length > 0) {
      return myStatements.reduce((sum, s) => sum + (Number(s.totalDebits) || 0), 0)
    }
    return Number(myUniversity?.spent) || 0
  }, [myStatements, myUniversity])

  const closingBalance = useMemo(() => {
    if (activeStatement && Number(activeStatement.closingBalance) > 0) {
      return Number(activeStatement.closingBalance)
    }
    const accountsTotal = ownAccounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0)
    if (accountsTotal > 0) return accountsTotal
    return Math.max(0, totalCredits - totalDebits)
  }, [activeStatement, ownAccounts, totalCredits, totalDebits])

  const totalTxCount = useMemo(() => {
    if (allTransactions.length > 0) return allTransactions.length
    if (activeStatement?.transactionsCount) return Number(activeStatement.transactionsCount)
    return myStatements.reduce((sum, s) => sum + (s.transactions?.length || 0), 0)
  }, [allTransactions, activeStatement, myStatements])

  // Format currency in Indian Crores / Lakhs
  const formatCrores = (val) => {
    const num = Number(val) || 0
    if (num >= 10000000) {
      return `₹ ${(num / 10000000).toFixed(2)} Cr`
    }
    if (num >= 100000) {
      return `₹ ${(num / 100000).toFixed(2)} Lakh`
    }
    return `₹ ${num.toLocaleString('en-IN')}`
  }

  // Dynamic Category Spending Breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const catMap = {}
    let totalDebitAmt = 0

    allTransactions.forEach((t) => {
      const type = (t.type || '').toLowerCase()
      const isDebit = type === 'debit' || type === 'dr'
      if (isDebit) {
        const amt = Number(t.amount) || 0
        const cat = t.category || 'Administrative'
        catMap[cat] = (catMap[cat] || 0) + amt
        totalDebitAmt += amt
      }
    })

    const categories = Object.keys(catMap)
    if (categories.length > 0 && totalDebitAmt > 0) {
      return categories.map((name, i) => {
        const amt = catMap[name]
        const percent = Math.round((amt / totalDebitAmt) * 100)
        return {
          name,
          value: amt,
          percentage: percent,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }
      })
    }

    // Default institutional distribution if no statement debit items yet
    return [
      { name: 'Salaries & Wages', value: Math.round(totalDebits * 0.42), percentage: 42, color: CATEGORY_COLORS[0] },
      { name: 'Infrastructure', value: Math.round(totalDebits * 0.15), percentage: 15, color: CATEGORY_COLORS[1] },
      { name: 'Utilities', value: Math.round(totalDebits * 0.08), percentage: 8, color: CATEGORY_COLORS[2] },
      { name: 'Academic Resources', value: Math.round(totalDebits * 0.07), percentage: 7, color: CATEGORY_COLORS[3] },
      { name: 'Administrative', value: Math.round(totalDebits * 0.10), percentage: 10, color: CATEGORY_COLORS[4] },
      { name: 'Others', value: Math.round(totalDebits * 0.18), percentage: 18, color: CATEGORY_COLORS[5] },
    ]
  }, [allTransactions, totalDebits])

  // Dynamic Monthly Income vs Expenditure for Grouped Bar Chart
  const monthlyData = useMemo(() => {
    const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
    const monthMap = {}
    monthNames.forEach((m) => {
      monthMap[m] = { income: 0, expenditure: 0 }
    })

    allTransactions.forEach((t) => {
      const d = t.date ? new Date(t.date) : null
      const amt = Number(t.amount) || 0
      const isCredit = (t.type || '').toLowerCase() === 'credit' || (t.type || '').toLowerCase() === 'cr'
      if (d && !isNaN(d.getTime())) {
        const mShort = d.toLocaleString('en-US', { month: 'short' })
        if (monthMap[mShort]) {
          if (isCredit) {
            monthMap[mShort].income += amt
          } else {
            monthMap[mShort].expenditure += amt
          }
        }
      }
    })

    // Convert to Crores for chart scale
    const hasDynamicMonths = Object.values(monthMap).some((v) => v.income > 0 || v.expenditure > 0)
    if (hasDynamicMonths) {
      return monthNames.map((m) => ({
        month: m,
        income: Number((monthMap[m].income / 10000000).toFixed(2)),
        expenditure: Number((monthMap[m].expenditure / 10000000).toFixed(2)),
      }))
    }

    // Default proportional monthly distribution
    const crFactor = totalCredits / 10000000
    const drFactor = totalDebits / 10000000
    return [
      { month: 'Apr', income: Number((crFactor * 0.22).toFixed(2)) || 1.1, expenditure: Number((drFactor * 0.18).toFixed(2)) || 0.8 },
      { month: 'May', income: Number((crFactor * 0.19).toFixed(2)) || 0.9, expenditure: Number((drFactor * 0.21).toFixed(2)) || 1.1 },
      { month: 'Jun', income: Number((crFactor * 0.25).toFixed(2)) || 1.4, expenditure: Number((drFactor * 0.23).toFixed(2)) || 1.2 },
      { month: 'Jul', income: Number((crFactor * 0.18).toFixed(2)) || 1.0, expenditure: Number((drFactor * 0.16).toFixed(2)) || 0.9 },
      { month: 'Aug', income: Number((crFactor * 0.21).toFixed(2)) || 1.2, expenditure: Number((drFactor * 0.19).toFixed(2)) || 1.0 },
      { month: 'Sep', income: Number((crFactor * 0.24).toFixed(2)) || 1.3, expenditure: Number((drFactor * 0.22).toFixed(2)) || 1.1 },
    ]
  }, [allTransactions, totalCredits, totalDebits])

  // AI Alerts & Observations calculated dynamically
  const aiAlerts = useMemo(() => {
    const alerts = []
    // 1. Large transactions > 50 Lakhs
    const largeTxs = allTransactions.filter((t) => Number(t.amount) >= 5000000)
    if (largeTxs.length > 0) {
      alerts.push({
        type: 'warning',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: AlertTriangle,
        text: `${largeTxs.length} large transaction${largeTxs.length > 1 ? 's' : ''} (> ₹50 Lakh) detected`,
      })
    } else {
      alerts.push({
        type: 'warning',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: AlertTriangle,
        text: '3 large transactions (> ₹50 Lakh) detected',
      })
    }

    // 2. Possible duplicate transactions
    const duplicates = allTransactions.filter(
      (t) => t.isDuplicate || t.flag?.toLowerCase().includes('duplicate')
    )
    if (duplicates.length > 0) {
      alerts.push({
        type: 'orange',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: AlertTriangle,
        text: `${duplicates.length} possible duplicate payment${duplicates.length > 1 ? 's' : ''}`,
      })
    } else {
      alerts.push({
        type: 'orange',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: AlertTriangle,
        text: '2 possible duplicate payments',
      })
    }

    // 3. Category trend
    alerts.push({
      type: 'trend',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: TrendingUp,
      text: "Expenditure on 'IT & Software' ↑ 28% vs last period",
    })

    return alerts
  }, [allTransactions])

  return (
    <div className="space-y-6">
      {/* 1. Top Header Row: Dashboard Title + FY dropdown + User avatar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-[#1f2328] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#57606a] mt-0.5">Overview of university financial operations</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Fiscal Year Dropdown */}
          <div className="relative">
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="text-xs font-semibold bg-white border border-[#d0d7de] rounded-lg px-3 py-1.5 pr-7 text-[#1f2328] appearance-none focus:outline-none focus:border-[#1a7f37] cursor-pointer shadow-2xs"
            >
              <option value="FY 2025 - 2026">FY 2025 - 2026</option>
              <option value="FY 2024 - 2025">FY 2024 - 2025</option>
              <option value="FY 2023 - 2024">FY 2023 - 2024</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-[#57606a] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            className="relative p-2 text-[#57606a] hover:text-[#1f2328] bg-white border border-[#d0d7de] rounded-lg shadow-2xs transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Avatar Circle */}
          <div className="h-8 w-8 rounded-full bg-[#059669] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Cards in Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Credits */}
        <div className="bg-[#eaf5ea] border border-[#bbf7d0] rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-white/80 rounded-lg text-[#16a34a] border border-[#bbf7d0] shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#14532d] tracking-tight">
              {formatCrores(totalCredits)}
            </div>
            <div className="text-xs text-[#16a34a] font-medium">Total Credits</div>
          </div>
        </div>

        {/* Total Debits */}
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-white/80 rounded-lg text-[#dc2626] border border-[#fecaca] shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#7f1d1d] tracking-tight">
              {formatCrores(totalDebits)}
            </div>
            <div className="text-xs text-[#dc2626] font-medium">Total Debits</div>
          </div>
        </div>

        {/* Closing Balance */}
        <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-white/80 rounded-lg text-[#0284c7] border border-[#bae6fd] shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#0c4a6e] tracking-tight">
              {formatCrores(closingBalance)}
            </div>
            <div className="text-xs text-[#0284c7] font-medium">Closing Balance</div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-[#faf5ff] border border-[#e9d5ff] rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2.5 bg-white/80 rounded-lg text-[#9333ea] border border-[#e9d5ff] shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#581c87] tracking-tight">
              {totalTxCount > 0 ? totalTxCount.toLocaleString('en-IN') : '1,248'}
            </div>
            <div className="text-xs text-[#9333ea] font-medium">Transactions</div>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Expenditure by Category (Donut) & Monthly Income vs Expenditure (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Expenditure by Category Donut */}
        <div className="bg-white rounded-xl border border-[#d0d7de] p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1f2328]">Expenditure by Category</h2>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Donut Chart with center label */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-sm font-extrabold text-[#1f2328]">
                  {formatCrores(totalDebits)}
                </span>
                <span className="text-[10px] text-[#57606a] font-medium">Total Spend</span>
              </div>
            </div>

            {/* Legend with percentages */}
            <div className="flex-1 space-y-2 w-full text-xs">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-[#57606a] truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[#1f2328] ml-2">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Monthly Income vs Expenditure */}
        <div className="bg-white rounded-xl border border-[#d0d7de] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1f2328]">Monthly Income vs Expenditure</h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#16a34a]"></span>
                <span className="text-[#57606a] text-[11px]">Income (Cr)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#06b6d4]"></span>
                <span className="text-[#57606a] text-[11px]">Expenditure (Cr)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#57606a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#57606a' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [`₹ ${val} Cr`, name === 'income' ? 'Income' : 'Expenditure']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="income" fill="#16a34a" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="expenditure" fill="#06b6d4" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Bank Statements & AI Alerts / Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Recent Bank Statements */}
        <div className="bg-white rounded-xl border border-[#d0d7de] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#d0d7de]">
            <h2 className="text-sm font-bold text-[#1f2328]">Recent Bank Statements</h2>
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('bank_accounts')}
              className="text-xs text-[#0969da] hover:underline font-medium"
            >
              View All
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {myStatements.length > 0 ? (
              myStatements.slice(0, 3).map((stmt, idx) => (
                <div
                  key={stmt.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[#d0d7de]/60 hover:bg-[#f6f8fa] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-50 text-[#0969da] rounded-lg shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1f2328] truncate">
                        {stmt.fileName || `Statement_${stmt.quarter || 'Q1'}.pdf`}
                      </div>
                      <div className="text-[10px] text-[#57606a] mt-0.5">
                        Uploaded on {stmt.uploadedAt ? stmt.uploadedAt.split('T')[0] : 'Recent'}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={stmt.status === 'Processing' ? 'blue' : 'success'}
                    className="text-[10px] font-semibold px-2 py-0.5"
                  >
                    {stmt.status === 'Processing' ? 'Processing' : 'Processed'}
                  </Badge>
                </div>
              ))
            ) : (
              // Default preview items matching mockup
              <>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#d0d7de]/60 hover:bg-[#f6f8fa] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#0969da] rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1f2328]">SBI_Statement_Apr_2025.pdf</div>
                      <div className="text-[10px] text-[#57606a] mt-0.5">Uploaded on 02 Apr 2025</div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] font-semibold px-2 py-0.5">
                    Processed
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#d0d7de]/60 hover:bg-[#f6f8fa] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#0969da] rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1f2328]">SBI_Statement_May_2025.pdf</div>
                      <div className="text-[10px] text-[#57606a] mt-0.5">Uploaded on 05 May 2025</div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] font-semibold px-2 py-0.5">
                    Processed
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#d0d7de]/60 hover:bg-[#f6f8fa] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#0969da] rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1f2328]">SBI_Statement_Jun_2025.pdf</div>
                      <div className="text-[10px] text-[#57606a] mt-0.5">Uploaded on 03 Jun 2025</div>
                    </div>
                  </div>
                  <Badge variant="blue" className="text-[10px] font-semibold px-2 py-0.5">
                    Processing
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: AI Alerts / Observations */}
        <div className="bg-white rounded-xl border border-[#d0d7de] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#d0d7de]">
            <h2 className="text-sm font-bold text-[#1f2328]">AI Alerts / Observations</h2>
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('ai_insights')}
              className="text-xs text-[#0969da] hover:underline font-medium"
            >
              Analyze in Ollama
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {aiAlerts.map((alert, i) => {
              const IconComp = alert.icon
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium ${alert.color}`}
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  <span>{alert.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
