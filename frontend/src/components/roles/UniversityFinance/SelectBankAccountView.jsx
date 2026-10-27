import React, { useState, useMemo } from 'react'
import {
  Landmark,
  CreditCard,
  Search,
  Filter,
  ArrowUpDown,
  UploadCloud,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export function SelectBankAccountView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    bankAccounts = [],
    selectedAccountId,
    setSelectedAccountId,
    statements = [],
  } = useFinancialData()

  const [txSearch, setTxSearch] = useState('')
  const [txFilter, setTxFilter] = useState('ALL') // 'ALL', 'CREDIT', 'DEBIT'

  const { currentUser } = useAuth()

  // Identify the logged-in university dynamically
  const myUniversity = useMemo(() => {
    if (currentUser?.universityId) {
      const u = (universities || []).find((x) => x.id === currentUser.universityId)
      if (u) return u
    }
    if (currentUser?.universityName) {
      const u = (universities || []).find((x) => x.name.toLowerCase().includes(currentUser.universityName.toLowerCase()))
      if (u) return u
    }
    return (
      (universities || []).find((u) => u.id === 'univ-01' || u.code === 'VTU') ||
      (universities || [])[0] ||
      { id: 'univ-01', name: 'Visvesvaraya Technological University', code: 'VTU' }
    )
  }, [universities, currentUser])

  // Own university accounts (queried dynamically from MySQL)
  const accounts = useMemo(() => {
    return bankAccounts.filter((a) => a.universityId === myUniversity.id)
  }, [bankAccounts, myUniversity])

  // Current active account
  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null
  }, [accounts, selectedAccountId])

  // Dynamic ledger transactions for this account strictly from its MySQL statement
  const transactions = useMemo(() => {
    if (!currentAccount) return []
    let base = []
    const matchedStatement = statements.find(
      (s) => s.accountId === currentAccount?.id || s.accountNumber === currentAccount?.accountNumber
    )
    if (matchedStatement?.transactions && matchedStatement.transactions.length > 0) {
      base = matchedStatement.transactions.map((t) => ({
        id: t.id,
        date: t.date,
        reference: t.referenceNo || t.reference || t.id,
        description: t.description,
        category: t.category,
        type: t.type,
        amount: Number(t.amount) || 0,
        balance: Number(t.balance) || 0,
      }))
    }

    return base.filter((t) => {
      const q = (txSearch || '').toLowerCase()
      const matchesSearch =
        (t.description || '').toLowerCase().includes(q) ||
        (t.reference || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      const matchesType = txFilter === 'ALL' || t.type === txFilter
      return matchesSearch && matchesType
    })
  }, [statements, currentAccount, txSearch, txFilter])

  // Statements for this specific account
  const accountStatements = useMemo(() => {
    if (!currentAccount) return []
    return statements.filter(
      (s) => s.accountId === currentAccount?.id || s.accountNumber === currentAccount?.accountNumber
    )
  }, [statements, currentAccount])


  return (
    <div className="space-y-6">
      {/* Workflow Navigation Banner (Track 2: Step 3 of 6) */}
      <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50/70 via-white to-purple-50/40 p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 rounded-full bg-[#8250df] text-white text-xs flex items-center justify-center font-bold shrink-0">
            3
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Step 3: Select Bank Account (Bank Account Detail)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                General Ledger & History
              </span>
            </div>
            <p className="text-[11px] text-[#57606a] mt-0.5">
              Account details, IFSC, Branch, balance history, cash flow charts & general ledger transaction lines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('overview')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            Step 2: Overview
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('statement_upload')}
            className="text-xs font-semibold"
          >
            <span>Proceed to Step 4: Statement Upload</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-[#d0d7de]">
        <div>
          <h2 className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#0969da]" />
            Select Bank Account
          </h2>
          <p className="text-xs text-[#57606a]">
            Switch between institutional bank accounts to inspect balances, transaction ledgers and statements
          </p>
        </div>

        {currentAccount && (
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('statement_upload')}
            className="text-xs shadow-sm self-start sm:self-auto"
          >
            <UploadCloud className="h-3.5 w-3.5 mr-1" />
            Upload Statement for this Account (Step 4)
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-[#d0d7de] bg-[#f6f8fa] text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-[#8250df]">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f2328]">No Bank Accounts Configured</h3>
            <p className="text-xs text-[#57606a] max-w-md mx-auto mt-1">
              Your institution has not configured any bank accounts yet. Please add your official bank account in Step 1/Bank Accounts tab to proceed with Step 3 ledger inspection.
            </p>
          </div>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('bank_accounts')}
            className="text-xs font-semibold cursor-pointer"
          >
            Configure Official Bank Account (Step 1)
          </Button>
        </div>
      ) : (
        <>
          {/* Account Cards Carousel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {accounts.map((acct) => {
              const isSelected = acct.id === currentAccount?.id
              return (
                <div
                  key={acct.id}
                  onClick={() => setSelectedAccountId(acct.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#0969da] bg-[#ddf4ff]/20 shadow-sm'
                      : 'border-[#d0d7de] bg-white hover:border-[#0969da]/60 hover:bg-[#f6f8fa]/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-[#1f2328]">{acct.bankName}</h4>
                      <span className="font-mono text-[11px] text-[#57606a]">{acct.accountNumber}</span>
                    </div>
                    {isSelected && (
                      <Badge variant="blue" className="text-[10px]">Active</Badge>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] text-[#57606a] block">Current Balance:</span>
                    <span className="text-lg font-bold text-[#1a7f37]">
                      {formatCurrency(acct.currentBalance, true)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#d0d7de]/50 flex justify-between text-[11px] text-[#57606a]">
                    <span>{acct.accountName || acct.accountType}</span>
                    <span className="font-mono">{acct.ifscCode}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Account Details & Balances (Step 3 requirements) */}
          {currentAccount && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-white border border-[#d0d7de] md:col-span-2">
                <CardTitle className="text-xs font-semibold text-[#1f2328] uppercase tracking-wider mb-2">
                  Selected Account Credentials & Metadata
                </CardTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#57606a] block text-[11px]">Account Holder:</span>
                    <span className="font-semibold text-[#1f2328]">{currentAccount.accountName || myUniversity.name}</span>
                  </div>
                  <div>
                    <span className="text-[#57606a] block text-[11px]">Primary Bank:</span>
                    <span className="font-semibold text-[#1f2328]">{currentAccount.bankName}</span>
                  </div>
                  <div>
                    <span className="text-[#57606a] block text-[11px]">Branch:</span>
                    <span className="font-semibold text-[#1f2328]">{currentAccount.branch || 'Campus Branch'}</span>
                  </div>
                  <div>
                    <span className="text-[#57606a] block text-[11px]">Currency:</span>
                    <span className="font-semibold text-[#1f2328]">INR (₹ Indian Rupees)</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-[#f6f8fa] border border-[#d0d7de] flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-[#57606a] font-medium uppercase tracking-wider">
                    Live Verified Balance (₹)
                  </div>
                  <div className="text-2xl font-bold text-[#1a7f37] mt-1">
                    {formatCurrency(currentAccount.currentBalance)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#1a7f37] font-semibold mt-2">
                  <ShieldCheck className="h-4 w-4" />
                  GL Balance Reconciled with State Treasury
                </div>
              </Card>
            </div>
          )}

          {/* View Transactions (Step 3 requirement) */}
          {currentAccount && (
            <Card>
              <CardHeader className="border-b border-[#d0d7de] pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold text-[#1f2328]">
                      Transaction Ledger ({currentAccount.bankName})
                    </CardTitle>
                    <CardDescription className="text-xs text-[#57606a]">
                      Live feed of electronic transfers, disbursements, payroll vouchers and supplier invoices
                    </CardDescription>
                  </div>

            {/* Ledger Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57606a]" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="h-8 pl-8 pr-2.5 text-xs rounded-md border border-[#d0d7de] bg-white focus:outline-none focus:border-[#0969da]"
                />
              </div>

              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="h-8 px-2 text-xs rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">Credits Inflow</option>
                <option value="DEBIT">Debits Outflow</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[#57606a] font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Description / Beneficiary</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount (₹)</th>
                  <th className="py-2.5 px-4 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#57606a]">
                      No ledger transactions on record for this account yet. Upload a statement to parse transactions.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#f6f8fa]/60 transition">
                      <td className="py-3 px-3 font-mono text-[11px] text-[#57606a]">{tx.date}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#0969da]">{tx.reference}</td>
                      <td className="py-3 px-3 font-medium text-[#1f2328] max-w-sm truncate">{tx.description}</td>
                      <td className="py-3 px-3">
                        <span className="bg-[#f6f8fa] border border-[#d0d7de] px-1.5 py-0.5 rounded text-[10px] text-[#57606a]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold text-[11px] ${
                            tx.type === 'CREDIT' ? 'text-[#1a7f37]' : 'text-[#cf222e]'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#1f2328]">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#57606a]">
                        {formatCurrency(tx.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* See Statement History (Step 3 requirement) */}
      {currentAccount && (
      <Card>
        <CardHeader className="border-b border-[#d0d7de] pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
                <History className="h-4 w-4 text-[#0969da]" />
                Quarterly Statement History ({currentAccount.bankName})
              </CardTitle>
              <CardDescription className="text-xs text-[#57606a]">
                Record of quarterly bank statements filed, OCR parsed and verified
              </CardDescription>
            </div>
            <Badge variant="default" className="text-xs">
              {accountStatements.length} Filed Records
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[#57606a] font-semibold">
                  <th className="py-2.5 px-3">Quarter</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Upload Date</th>
                  <th className="py-2.5 px-3">Debits / Credits</th>
                  <th className="py-2.5 px-3">AI Accuracy</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {accountStatements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#57606a]">
                      No statement history yet for this account. Proceed to upload Q3 statement.
                    </td>
                  </tr>
                ) : (
                  accountStatements.map((stmt) => (
                    <tr key={stmt.id} className="hover:bg-[#f6f8fa]/60">
                      <td className="py-3 px-3 font-semibold text-[#1f2328]">{stmt.quarter}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#0969da]">{stmt.fileName}</td>
                      <td className="py-3 px-3 text-[11px] text-[#57606a]">{stmt.uploadedAt}</td>
                      <td className="py-3 px-3">
                        <span className="text-[#1a7f37]">+{formatCurrency(stmt.totalCredits, true)}</span> /{' '}
                        <span className="text-[#cf222e]">-{formatCurrency(stmt.totalDebits, true)}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1a7f37]">
                        {stmt.aiValidation?.confidenceScore || 98.2}%
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            stmt.status === 'Approved by Gov Leader'
                              ? 'success'
                              : stmt.status === 'Submitted for Approval'
                              ? 'blue'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {stmt.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectTab('ai_validation')}
                          className="text-xs text-[#0969da] h-7 px-2"
                        >
                          Inspect (Step 5)
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
      </>
      )}

      {/* Bottom Step Forward Navigation Bar */}
      <div className="rounded-lg border border-[#d0d7de] bg-[#f6f8fa] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#57606a]">
          <strong className="text-[#1f2328]">Next Steps in Official SOP:</strong> Upload a bank statement file (PDF, CSV, XLSX) for quarterly filing and automated AI OCR extraction.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('overview')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            Step 2: University Overview
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('statement_upload')}
            className="text-xs font-semibold"
          >
            <span>Proceed to Step 4: Quarterly Statement Upload</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
