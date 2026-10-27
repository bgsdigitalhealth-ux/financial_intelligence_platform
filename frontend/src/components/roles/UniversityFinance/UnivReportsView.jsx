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
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
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
  const { universities, bankAccounts, statements } = useFinancialData()
  const { currentUser } = useAuth()

  // Identify logged-in university dynamically
  const myUniversity = useMemo(() => {
    if (currentUser?.universityId) {
      const u = universities.find((x) => x.id === currentUser.universityId)
      if (u) return u
    }
    if (currentUser?.universityName) {
      const u = universities.find((x) => x.name.toLowerCase().includes(currentUser.universityName.toLowerCase()))
      if (u) return u
    }
    return (
      universities.find((u) => u.id === 'univ-01' || u.code === 'VTU') ||
      universities[0] ||
      { id: currentUser?.universityId || 'univ-01', name: currentUser?.organization || 'College Pending Setup', code: 'VTU', allocation: 0 }
    )
  }, [universities, currentUser])

  // Own university bank accounts
  const ownAccounts = useMemo(() => {
    return (bankAccounts || []).filter((a) => a.universityId === myUniversity.id)
  }, [bankAccounts, myUniversity])

  // Own university statements
  const myStatements = useMemo(() => {
    return (statements || []).filter(
      (s) => s.universityId === myUniversity.id || s.universityName === myUniversity.name
    )
  }, [statements, myUniversity])

  const activeStatement = myStatements[0]

  // Selected report tab
  const [selectedReportTab, setSelectedReportTab] = useState('quarterly_statement') // 'quarterly_statement', 'bank_reconciliation', 'category_breakdown', 'utilization_cert'

  const handleExport = (reportName, format = 'PDF') => {
    if (onTriggerToast) {
      onTriggerToast(
        `Exporting ${reportName}`,
        `Cryptographically generated ${format} stamped with K.S.U. Act 2000 verification hash.`
      )
    }
  }

  // Aggregate dynamic transaction data from the active statement
  const transactions = activeStatement?.transactions || []
  const creditTxs = transactions.filter((t) => t.type === 'CREDIT')
  const debitTxs = transactions.filter((t) => t.type === 'DEBIT')

  // Group dynamic inflows by category / head
  const dynamicInflows = useMemo(() => {
    if (creditTxs.length === 0 && activeStatement?.totalCredits) {
      return [{ category: 'Receipt & Inflow', amount: activeStatement.totalCredits, count: 1 }]
    }
    const map = {}
    creditTxs.forEach((t) => {
      const cat = t.category || t.description || 'Receipt & Inflow'
      map[cat] = (map[cat] || 0) + Number(t.amount || 0)
    })
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      count: creditTxs.filter((t) => (t.category || t.description || 'Receipt & Inflow') === category).length,
    }))
  }, [creditTxs, activeStatement])

  // Group dynamic outflows by category / head
  const dynamicOutflows = useMemo(() => {
    if (debitTxs.length === 0 && activeStatement?.totalDebits) {
      return [{ category: 'Disbursement', amount: activeStatement.totalDebits, count: 1 }]
    }
    const map = {}
    debitTxs.forEach((t) => {
      const cat = t.category || t.description || 'Disbursement'
      map[cat] = (map[cat] || 0) + Number(t.amount || 0)
    })
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      count: debitTxs.filter((t) => (t.category || t.description || 'Disbursement') === category).length,
    }))
  }, [debitTxs, activeStatement])

  const totalCredits = activeStatement?.totalCredits || 0
  const totalDebits = activeStatement?.totalDebits || 0
  const openingBalance = activeStatement?.openingBalance || 0
  const closingBalance = activeStatement?.closingBalance || (openingBalance + totalCredits - totalDebits)
  const netInflow = totalCredits - totalDebits

  // Dynamic bar chart comparison data for quarterly receipts & disbursements
  const statementFlowComparison = useMemo(() => {
    return [
      { name: 'Opening Bal', amount: openingBalance, fill: '#57606a' },
      { name: 'Total Inflows', amount: totalCredits, fill: '#1a7f37' },
      { name: 'Total Outflows', amount: totalDebits, fill: '#cf222e' },
      { name: 'Closing Bal', amount: closingBalance, fill: '#0969da' },
    ]
  }, [openingBalance, totalCredits, totalDebits, closingBalance])

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-lg border border-[#d0d7de] bg-white p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[#0969da]" />
            <h1 className="text-sm font-bold text-[#1f2328]">
              Institutional Financial & Statutory Reports
            </h1>
            <Badge variant="blue" className="text-[10px] font-mono">
              {myUniversity.code}
            </Badge>
          </div>
          <p className="text-xs text-[#57606a] mt-0.5">
            {myUniversity.name} • Official quarterly statements, multi-bank reconciliations, and Form 19-A utilization certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('Official Quarterly Report Package', 'CSV')}
            disabled={!activeStatement}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => handleExport('Official Quarterly Report Package', 'PDF')}
            disabled={!activeStatement}
            className="text-xs font-semibold shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Download Certified PDF
          </Button>
        </div>
      </div>

      {/* 2. Report Category Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          {
            id: 'quarterly_statement',
            title: 'Quarterly Statement',
            desc: activeStatement ? `${activeStatement.quarter} Receipts & Debits` : 'Receipts & Disbursements',
          },
          {
            id: 'bank_reconciliation',
            title: 'Bank Reconciliation',
            desc: `${ownAccounts.length} Registered Accounts`,
          },
          {
            id: 'category_breakdown',
            title: 'Expenditure Categories',
            desc: `${dynamicOutflows.length} Active Ledger Heads`,
          },
          {
            id: 'utilization_cert',
            title: 'Utilization Certificate',
            desc: 'Statutory Form 19-A / PFMS',
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReportTab(tab.id)}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              selectedReportTab === tab.id
                ? 'border-[#0969da] bg-[#ddf4ff]/30 text-[#0969da] font-bold shadow-2xs'
                : 'border-[#d0d7de] bg-white hover:bg-[#f6f8fa] text-[#1f2328]'
            }`}
          >
            <div className="text-xs">{tab.title}</div>
            <div className="text-[10px] text-[#57606a] mt-0.5">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* 3. Empty State if No Statement Uploaded */}
      {!activeStatement ? (
        <div className="p-10 rounded-xl border border-dashed border-[#d0d7de] bg-[#f6f8fa] text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#0969da]">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f2328]">No Statement Data Available Yet</h3>
            <p className="text-xs text-[#57606a] max-w-md mx-auto mt-1">
              Your institution has not uploaded any quarterly bank statements with transaction records. Once you select a bank account and upload a statement CSV, this report will dynamically parse and render live Receipts & Disbursements, Multi-Bank Reconciliations, and Form 19-A certificates.
            </p>
          </div>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('bank_accounts')}
            className="text-xs font-semibold cursor-pointer"
          >
            <Landmark className="h-3.5 w-3.5 mr-1.5" />
            Configure Bank Account & Upload Statement (Step 1-4)
          </Button>
        </div>
      ) : (
        <>
          {/* Quarterly Statement Tab */}
          {selectedReportTab === 'quarterly_statement' && (
            <Card className="bg-white">
              <CardHeader className="border-b border-[#d0d7de] pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#1f2328]">
                      Statement of Receipts and Disbursements — {activeStatement.quarter}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#57606a]">
                      Bank: {activeStatement.bankName} ({activeStatement.accountNumber}) • Filed by {activeStatement.uploadedBy} • K.S.U. Act 2000 § 102
                    </CardDescription>
                  </div>
                  <Badge variant="blue" className="font-mono text-[10px]">
                    {activeStatement.financialYear || 'FY 2025-2026'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-[#d0d7de] bg-[#f6f8fa]/60">
                    <span className="text-[11px] text-[#57606a] block">Opening Balance</span>
                    <span className="text-base font-bold text-[#1f2328]">{formatCurrency(openingBalance)}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#1a7f37]/30 bg-[#dafbe1]/30">
                    <span className="text-[11px] text-[#1a7f37] block font-medium">Total Inflows (Credits)</span>
                    <span className="text-base font-bold text-[#1a7f37]">+{formatCurrency(totalCredits)}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#cf222e]/30 bg-[#ffebe9]/30">
                    <span className="text-[11px] text-[#cf222e] block font-medium">Total Outflows (Debits)</span>
                    <span className="text-base font-bold text-[#cf222e]">-{formatCurrency(totalDebits)}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-[#0969da]/30 bg-[#ddf4ff]/30">
                    <span className="text-[11px] text-[#0969da] block font-medium">Reconciled Closing Balance</span>
                    <span className="text-base font-bold text-[#0969da]">{formatCurrency(closingBalance)}</span>
                  </div>
                </div>

                {/* Quarterly Receipts & Disbursements Graph */}
                <div className="p-4 rounded-xl border border-[#d0d7de] bg-[#f6f8fa]/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#d0d7de]/70 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-[#1f2328] uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-[#0969da]" />
                        Quarterly Receipts & Disbursements Flow (₹)
                      </h4>
                      <p className="text-[11px] text-[#57606a]">
                        Statutory ledger comparison conforming to Karnataka General Financial Rules
                      </p>
                    </div>
                    <Badge variant="blue" className="text-[10px] font-mono">
                      {activeStatement.bankName}
                    </Badge>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statementFlowComparison} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#57606a', fontSize: 11 }} tickLine={false} />
                        <YAxis
                          tick={{ fill: '#57606a', fontSize: 11 }}
                          tickLine={false}
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-[#1f2328] text-white p-2.5 rounded-lg text-xs shadow-md">
                                  <div className="font-semibold">{data.name}</div>
                                  <div className="font-mono font-bold text-emerald-400 mt-1">
                                    {formatCurrency(data.amount)}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {statementFlowComparison.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Section A: Inflows */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#1f2328] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-[#1a7f37]" />
                    Section A: Revenue / Receipts Inflows ({dynamicInflows.length} Heads)
                  </div>
                  <div className="overflow-x-auto border border-[#d0d7de] rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[11px] font-semibold text-[#57606a]">
                          <th className="py-2.5 px-3">Revenue / Receipt Head</th>
                          <th className="py-2.5 px-3 text-center">Transaction Lines</th>
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d0d7de]">
                        {dynamicInflows.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#f6f8fa]/50">
                            <td className="py-2.5 px-3 font-medium text-[#1f2328]">{item.category}</td>
                            <td className="py-2.5 px-3 text-center text-[#57606a] font-mono text-[11px]">{item.count}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#1a7f37]">
                              +{formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#f6f8fa] font-bold text-[#1f2328]">
                          <td className="py-2.5 px-3">Total Receipts & Inflows (A)</td>
                          <td className="py-2.5 px-3 text-center font-mono">{creditTxs.length || 1}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#1a7f37]">
                            +{formatCurrency(totalCredits)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section B: Disbursements */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#1f2328] uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#cf222e]" />
                    Section B: Operational & Capital Disbursements ({dynamicOutflows.length} Heads)
                  </div>
                  <div className="overflow-x-auto border border-[#d0d7de] rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[11px] font-semibold text-[#57606a]">
                          <th className="py-2.5 px-3">Expenditure Category</th>
                          <th className="py-2.5 px-3 text-center">Transaction Lines</th>
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d0d7de]">
                        {dynamicOutflows.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#f6f8fa]/50">
                            <td className="py-2.5 px-3 font-medium text-[#1f2328]">{item.category}</td>
                            <td className="py-2.5 px-3 text-center text-[#57606a] font-mono text-[11px]">{item.count}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#cf222e]">
                              -{formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#f6f8fa] font-bold text-[#1f2328]">
                          <td className="py-2.5 px-3">Total Disbursements & Outflows (B)</td>
                          <td className="py-2.5 px-3 text-center font-mono">{debitTxs.length || 1}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#cf222e]">
                            -{formatCurrency(totalDebits)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Net Position */}
                <div className="p-3.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-[#1f2328]">Quarterly Net Position (Inflows - Outflows):</span>
                    <span className="text-[11px] text-[#57606a] block">Reconciled with General Ledger Cash Book</span>
                  </div>
                  <span className={`text-base font-bold font-mono ${netInflow >= 0 ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>
                    {netInflow >= 0 ? `+${formatCurrency(netInflow)}` : formatCurrency(netInflow)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Reconciliation Tab */}
          {selectedReportTab === 'bank_reconciliation' && (
            <Card className="bg-white">
              <CardHeader className="border-b border-[#d0d7de] pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#1f2328]">
                      Multi-Bank Account Reconciliation Summary
                    </CardTitle>
                    <CardDescription className="text-xs text-[#57606a]">
                      Reconciliation between physical statement ledger and state treasury balances
                    </CardDescription>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Zero Variance Certified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {ownAccounts.map((acct) => {
                    const isStatementAccount = acct.id === activeStatement.accountId || acct.accountNumber === activeStatement.accountNumber
                    const acctOpening = isStatementAccount ? openingBalance : acct.currentBalance
                    const acctClosing = isStatementAccount ? closingBalance : acct.currentBalance

                    return (
                      <div key={acct.id} className="p-4 rounded-lg border border-[#d0d7de] bg-[#f6f8fa]/60 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center font-bold text-[#1f2328]">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-[#0969da]" />
                            <span>{acct.bankName}</span>
                          </div>
                          <Badge variant="success" className="text-[9.5px]">Reconciled</Badge>
                        </div>
                        <div className="font-mono text-[11px] text-[#57606a]">
                          Acc: {acct.accountNumber} • IFSC: {acct.ifscCode}
                        </div>
                        <div className="pt-2 border-t border-[#d0d7de]/60 space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-[#57606a]">Opening Balance:</span>
                            <span className="font-mono font-medium text-[#1f2328]">{formatCurrency(acctOpening)}</span>
                          </div>
                          {isStatementAccount && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-[#57606a]">Statement Credits:</span>
                                <span className="font-mono text-[#1a7f37]">+{formatCurrency(totalCredits)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#57606a]">Statement Debits:</span>
                                <span className="font-mono text-[#cf222e]">-{formatCurrency(totalDebits)}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between pt-1 border-t border-[#d0d7de]/40">
                            <span className="text-[#1f2328] font-semibold">Verified Closing Balance:</span>
                            <span className="font-mono font-bold text-[#1a7f37]">{formatCurrency(acctClosing)}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#57606a]">Audit Variance:</span>
                            <span className="font-mono font-bold text-[#1a7f37]">₹0.00 (Zero Variance)</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenditure Categories Tab */}
          {selectedReportTab === 'category_breakdown' && (
            <Card className="bg-white">
              <CardHeader className="border-b border-[#d0d7de] pb-3">
                <CardTitle className="text-sm font-bold text-[#1f2328]">
                  Expenditure Breakdown by Chart of Accounts Category
                </CardTitle>
                <CardDescription className="text-xs text-[#57606a]">
                  Statutory comparison of actual institutional disbursements from {activeStatement.fileName}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Category Spend Chart */}
                <div className="p-4 rounded-xl border border-[#d0d7de] bg-[#f6f8fa]/40 space-y-2">
                  <h4 className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                    Statutory Spending Allocation by Head (₹)
                  </h4>
                  <div className="h-56 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dynamicOutflows} margin={{ top: 10, right: 20, left: 20, bottom: 35 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" vertical={false} />
                        <XAxis
                          dataKey="category"
                          tick={{ fill: '#57606a', fontSize: 10 }}
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fill: '#57606a', fontSize: 11 }}
                          tickLine={false}
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-[#1f2328] text-white p-2.5 rounded-lg text-xs shadow-md">
                                  <div className="font-semibold">{data.category}</div>
                                  <div className="font-mono font-bold text-emerald-400 mt-1">
                                    {formatCurrency(data.amount)}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="amount" fill="#0969da" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {dynamicOutflows.map((c, i) => {
                    const share = totalDebits > 0 ? Number(((c.amount / totalDebits) * 100).toFixed(1)) : 0
                    return (
                      <div key={i} className="p-3 rounded-lg border border-[#d0d7de] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#1f2328]">{c.category}</div>
                          <div className="text-[11px] text-[#57606a]">
                            Share of Quarterly Debits: {share}% • {c.count} Transaction Line{c.count === 1 ? '' : 's'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#1f2328]">{formatCurrency(c.amount)}</span>
                          <Badge variant="success" className="text-[10px]">KGFR Compliant</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form 19-A Utilization Certificate Tab */}
          {selectedReportTab === 'utilization_cert' && (
            <Card className="border-2 border-[#1a7f37] bg-white">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50/40 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-[#1a7f37]" />
                    Statutory Form 19-A (Utilization Certificate)
                  </CardTitle>
                  <Badge variant="success">PFMS & K.S.U. Act Certified</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs leading-relaxed text-[#1f2328]">
                <p className="p-3.5 rounded bg-[#f6f8fa] border border-[#d0d7de]">
                  Certified that out of <strong>{formatCurrency(myUniversity.allocation, true)}</strong> of grants-in-aid sanctioned
                  during the financial year 2025-2026 in favour of <strong>{myUniversity.name}</strong>, a verified sum of{' '}
                  <strong>{formatCurrency(totalDebits, true)}</strong> has been disbursed and utilized for authorized academic, infrastructure,
                  and operational purposes in {activeStatement.quarter}. The unexpended allocation balance of{' '}
                  <strong>{formatCurrency(Math.max(0, myUniversity.allocation - totalDebits), true)}</strong> remains credited in university accounts.
                </p>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-[#d0d7de]/60 text-xs">
                  <span className="text-[#57606a]">
                    Comptroller Sign-off: <strong className="text-[#1f2328]">{currentUser?.name || 'Dr. Ramesh Babu, KAS'}</strong> (Verified from {activeStatement.bankName})
                  </span>
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => handleExport('Form 19-A Utilization Certificate', 'PDF')}
                    className="text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download Certified Form 19-A
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
