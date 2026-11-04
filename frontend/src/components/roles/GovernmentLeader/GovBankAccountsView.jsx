import React, { useState, useMemo } from 'react'
import {
  Landmark,
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function GovBankAccountsView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    bankAccounts = [],
    statements = [],
    createBankAccount,
    deleteBankAccount,
  } = useFinancialData()

  // Active Sub-tab: 'accounts' | 'statements' | 'transactions'
  const [activeSubTab, setActiveSubTab] = useState('accounts')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedUnivFilter, setSelectedUnivFilter] = useState('ALL')

  // Modals
  const [selectedAccountForView, setSelectedAccountForView] = useState(null)
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
  const [newAccountData, setNewAccountData] = useState({
    universityId: '',
    accountName: 'Main University Account',
    bankName: 'State Bank of India',
    branch: 'Main Branch',
    accountNumber: '',
    accountType: 'Current Account',
    ifscCode: '',
    openingBalance: '0',
  })

  // Helper to mask account number: XXXX + last 4 digits
  const maskAccountNumber = (accNo) => {
    if (!accNo) return 'XXXX0000'
    const str = String(accNo).replace(/\s+/g, '')
    const last4 = str.slice(-4)
    return `XXXX${last4}`
  }

  // Combined accounts with university info
  const combinedAccounts = useMemo(() => {
    return bankAccounts.map((acc) => {
      const u = universities.find(
        (x) => x.id === acc.universityId || (x.code && x.code === acc.universityId)
      )
      return {
        ...acc,
        universityName: u ? u.name : acc.universityName || 'State University',
        universityCode: u ? u.code : 'UNIV',
        accountName: acc.accountName || (acc.accountType ? `${acc.accountType} - Main` : 'Main University Account'),
        branch: acc.branch || acc.branchName || 'Main Branch',
        status: acc.status || 'Active',
      }
    })
  }, [bankAccounts, universities])

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return combinedAccounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (acc.accountName && acc.accountName.toLowerCase().includes(q)) ||
        (acc.universityName && acc.universityName.toLowerCase().includes(q)) ||
        (acc.bankName && acc.bankName.toLowerCase().includes(q)) ||
        (acc.branch && acc.branch.toLowerCase().includes(q)) ||
        (acc.accountNumber && acc.accountNumber.includes(q))

      const matchesStatus = statusFilter === 'ALL' || acc.status === statusFilter
      const matchesUniv = selectedUnivFilter === 'ALL' || acc.universityId === selectedUnivFilter

      return matchesSearch && matchesStatus && matchesUniv
    })
  }, [combinedAccounts, searchQuery, statusFilter, selectedUnivFilter])

  // Combined Statements list across all universities
  const allStatementsList = useMemo(() => {
    return statements.map((stmt) => {
      const u = universities.find(
        (x) => x.id === stmt.universityId || (x.code && x.code === stmt.universityId)
      )
      return {
        ...stmt,
        universityName: u ? u.name : stmt.universityName || 'Registered University',
      }
    })
  }, [statements, universities])

  const filteredStatements = useMemo(() => {
    return allStatementsList.filter((s) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (s.universityName && s.universityName.toLowerCase().includes(q)) ||
        (s.bankName && s.bankName.toLowerCase().includes(q)) ||
        (s.fileName && s.fileName.toLowerCase().includes(q)) ||
        (s.quarter && s.quarter.toLowerCase().includes(q))
      const matchesUniv = selectedUnivFilter === 'ALL' || s.universityId === selectedUnivFilter
      return matchesSearch && matchesUniv
    })
  }, [allStatementsList, searchQuery, selectedUnivFilter])

  // Combined Transactions across all statements
  const allTransactionsList = useMemo(() => {
    const list = []
    statements.forEach((stmt) => {
      const u = universities.find(
        (x) => x.id === stmt.universityId || (x.code && x.code === stmt.universityId)
      )
      const uName = u ? u.name : stmt.universityName || 'Registered University'
      let txs = stmt.transactions || stmt.rawTransactions || []
      if (typeof txs === 'string') {
        try { txs = JSON.parse(txs) } catch { txs = [] }
      }
      if (Array.isArray(txs)) {
        txs.forEach((tx) => {
          list.push({
            ...tx,
            statementId: stmt.id,
            universityName: uName,
            bankName: stmt.bankName,
            accountNumber: stmt.accountNumber,
          })
        })
      }
    })
    return list
  }, [statements, universities])

  const filteredTransactions = useMemo(() => {
    return allTransactionsList.filter((tx) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.referenceNo && tx.referenceNo.toLowerCase().includes(q)) ||
        (tx.universityName && tx.universityName.toLowerCase().includes(q)) ||
        (tx.category && tx.category.toLowerCase().includes(q))
      return matchesSearch
    })
  }, [allTransactionsList, searchQuery])

  // Delete handler
  const handleDeleteAccount = async (account) => {
    if (!account) return
    if (!window.confirm(`Are you sure you want to delete bank account ${maskAccountNumber(account.accountNumber)} (${account.bankName})?`)) {
      return
    }
    try {
      if (deleteBankAccount) {
        await deleteBankAccount(account.id)
      }
      if (onTriggerToast) {
        onTriggerToast('Account Removed', `Bank account ${maskAccountNumber(account.accountNumber)} removed.`, 'success')
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Delete Failed', err.message || 'Could not delete account.', 'danger')
      }
    }
  }

  // Create handler
  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (!newAccountData.universityId) {
      alert('Please select a university')
      return
    }
    if (!newAccountData.accountNumber || newAccountData.accountNumber.length < 6) {
      alert('Please enter a valid bank account number')
      return
    }

    try {
      if (createBankAccount) {
        await createBankAccount({
          ...newAccountData,
          currentBalance: Number(newAccountData.openingBalance) || 0,
        })
      }
      setIsAddAccountModalOpen(false)
      setNewAccountData({
        universityId: '',
        accountName: 'Main University Account',
        bankName: 'State Bank of India',
        branch: 'Main Branch',
        accountNumber: '',
        accountType: 'Current Account',
        ifscCode: '',
        openingBalance: '0',
      })
      if (onTriggerToast) {
        onTriggerToast('Account Added', 'New university bank account registered.', 'success')
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Failed', err.message || 'Could not register bank account.', 'danger')
      }
    }
  }

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Bar (Matching Panel 3 Mockup) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
            Bank Accounts
          </h1>
          <p className="text-xs text-[#57606a] mt-0.5">
            Manage university bank accounts and uploaded statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddAccountModalOpen(true)}
            className="h-8.5 text-xs flex items-center gap-1.5 bg-[#0969da] text-white hover:bg-[#085ec4] shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </Button>
        </div>
      </div>

      {/* 2. Sub-Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#d0d7de] shadow-xs">
        {/* Left: 3 Sub-tabs matching Panel 3 */}
        <div className="flex items-center gap-1.5 bg-[#f6f8fa] p-1 rounded-lg border border-[#d0d7de]">
          <button
            onClick={() => setActiveSubTab('accounts')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'accounts'
                ? 'bg-[#0969da] text-white shadow-2xs'
                : 'text-[#57606a] hover:text-[#1f2328]'
            }`}
          >
            Accounts ({combinedAccounts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('statements')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'statements'
                ? 'bg-[#0969da] text-white shadow-2xs'
                : 'text-[#57606a] hover:text-[#1f2328]'
            }`}
          >
            Bank Statements ({statements.length})
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'transactions'
                ? 'bg-[#0969da] text-white shadow-2xs'
                : 'text-[#57606a] hover:text-[#1f2328]'
            }`}
          >
            Transaction History ({allTransactionsList.length})
          </button>
        </div>

        {/* Right: Search Input & Filter */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#57606a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search account / university..."
              className="w-full h-8.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
            />
          </div>

          {activeSubTab === 'accounts' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8.5 rounded-lg border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          )}
        </div>
      </div>

      {/* 3. Sub-Tab 1: Accounts Table (Matching Panel 3 Columns Exactly) */}
      {activeSubTab === 'accounts' && (
        <div className="overflow-x-auto rounded-xl border border-[#d0d7de] bg-white shadow-xs">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12 p-6">
              <Landmark className="h-10 w-10 text-[#57606a] mx-auto mb-2 opacity-40" />
              <div className="text-sm font-semibold text-[#1f2328]">No Bank Accounts Found</div>
              <p className="text-xs text-[#57606a] mt-1">
                {searchQuery ? 'No registered accounts match your search filter.' : 'No bank accounts registered yet in database.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5">Account Name</th>
                  <th className="py-3 px-3.5">University</th>
                  <th className="py-3 px-3.5">Bank & Branch</th>
                  <th className="py-3 px-3.5 font-mono">Account No.</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {filteredAccounts.map((acc, idx) => (
                  <tr key={acc.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                    <td className="py-3 px-3.5 text-center font-mono text-[#57606a] font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-[#1f2328]">{acc.accountName}</div>
                      <div className="text-[10px] text-[#57606a]">{acc.accountType || 'Current Account'}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-[#1f2328]">{acc.universityName}</div>
                      <div className="text-[10px] font-mono text-[#57606a]">{acc.universityCode}</div>
                    </td>
                    <td className="py-3 px-3.5 text-[#57606a]">
                      <div className="font-medium text-[#1f2328]">{acc.bankName}</div>
                      <div className="text-[10px] text-[#57606a]">{acc.branch}</div>
                    </td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-[#1f2328]">
                      {maskAccountNumber(acc.accountNumber)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          acc.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAccountForView(acc)}
                          className="p-1.5 text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                          title="View Account Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc)}
                          className="p-1.5 text-[#57606a] hover:text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors cursor-pointer"
                          title="Delete Bank Account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 4. Sub-Tab 2: Bank Statements Table */}
      {activeSubTab === 'statements' && (
        <div className="overflow-x-auto rounded-xl border border-[#d0d7de] bg-white shadow-xs">
          {filteredStatements.length === 0 ? (
            <div className="text-center py-12 p-6">
              <FileSpreadsheet className="h-10 w-10 text-[#57606a] mx-auto mb-2 opacity-40" />
              <div className="text-sm font-semibold text-[#1f2328]">No Bank Statements Uploaded</div>
              <p className="text-xs text-[#57606a] mt-1">
                No financial statement files have been uploaded yet by universities.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5">Period & Quarter</th>
                  <th className="py-3 px-3.5">University</th>
                  <th className="py-3 px-3.5">Bank & Account</th>
                  <th className="py-3 px-3.5 text-right">Total Credits</th>
                  <th className="py-3 px-3.5 text-right">Total Debits</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {filteredStatements.map((stmt, idx) => (
                  <tr key={stmt.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                    <td className="py-3 px-3.5 text-center font-mono text-[#57606a] font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-[#1f2328]">{stmt.quarter || 'Q2'} {stmt.financialYear || '2025'}</div>
                      <div className="text-[10px] text-[#57606a]">{stmt.fileName || 'Statement.pdf'}</div>
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-[#1f2328]">
                      {stmt.universityName}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#57606a]">
                      {stmt.bankName} ({maskAccountNumber(stmt.accountNumber)})
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-700">
                      +{formatCurrency(Number(stmt.totalCredits) || 0)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-rose-700">
                      -{formatCurrency(Number(stmt.totalDebits) || 0)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <Badge variant="success" className="text-[10px]">
                        {stmt.status === 'Approved by Gov Leader' || stmt.status === 'AI Validated' ? 'Processed' : stmt.status || 'Processed'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => onSelectTab && onSelectTab('reports')}
                        className="text-xs text-[#0969da] hover:underline font-medium cursor-pointer"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 5. Sub-Tab 3: Transaction History Table */}
      {activeSubTab === 'transactions' && (
        <div className="overflow-x-auto rounded-xl border border-[#d0d7de] bg-white shadow-xs">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 p-6">
              <FileText className="h-10 w-10 text-[#57606a] mx-auto mb-2 opacity-40" />
              <div className="text-sm font-semibold text-[#1f2328]">No Extracted Transactions</div>
              <p className="text-xs text-[#57606a] mt-1">
                Upload bank statements in university login to extract transactions dynamically.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">University</th>
                  <th className="py-3 px-3.5">Description</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5 text-right">Amount</th>
                  <th className="py-3 px-3.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {filteredTransactions.slice(0, 100).map((tx, idx) => {
                  const isCredit = (tx.type || '').toUpperCase().includes('CREDIT') || (tx.type || '').toUpperCase() === 'CR'
                  return (
                    <tr key={tx.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[#57606a] whitespace-nowrap">{tx.date || '—'}</td>
                      <td className="py-2.5 px-3.5 font-medium text-[#1f2328]">{tx.universityName}</td>
                      <td className="py-2.5 px-3.5 text-[#1f2328] max-w-xs truncate" title={tx.description}>{tx.description || 'Disbursement Line'}</td>
                      <td className="py-2.5 px-3.5 text-[#57606a]">{tx.category || 'Administrative'}</td>
                      <td className="py-2.5 px-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {isCredit ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3.5 text-right font-mono font-semibold ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(Number(tx.amount) || 0)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-[#57606a]">
                        {tx.balance ? formatCurrency(Number(tx.balance)) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Account Details View Modal */}
      {selectedAccountForView && (
        <Modal
          isOpen={!!selectedAccountForView}
          onClose={() => setSelectedAccountForView(null)}
          title="Bank Account Specification"
          className="max-w-md"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 bg-[#f6f8fa] rounded-xl border border-[#d0d7de] space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[#57606a] font-sans">University</span>
                <span className="font-semibold text-[#1f2328]">{selectedAccountForView.universityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57606a] font-sans">Account Name</span>
                <span className="font-semibold text-[#1f2328]">{selectedAccountForView.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57606a] font-sans">Bank & Branch</span>
                <span className="font-semibold text-[#1f2328]">{selectedAccountForView.bankName}, {selectedAccountForView.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57606a] font-sans">Account No. (Masked)</span>
                <span className="font-semibold text-[#0969da]">{maskAccountNumber(selectedAccountForView.accountNumber)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57606a] font-sans">Account Type</span>
                <span className="font-semibold text-[#1f2328]">{selectedAccountForView.accountType || 'Current Account'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57606a] font-sans">Status</span>
                <span className="font-semibold text-emerald-700">{selectedAccountForView.status}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAccountForView(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Account Modal */}
      {isAddAccountModalOpen && (
        <Modal
          isOpen={isAddAccountModalOpen}
          onClose={() => setIsAddAccountModalOpen(false)}
          title="Register University Bank Account"
          className="max-w-lg"
        >
          <form onSubmit={handleCreateAccount} className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Select University *
              </label>
              <select
                value={newAccountData.universityId}
                onChange={(e) => setNewAccountData({ ...newAccountData, universityId: e.target.value })}
                required
                className="w-full h-8.5 rounded-lg border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
              >
                <option value="">-- Choose University --</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={newAccountData.accountName}
                  onChange={(e) => setNewAccountData({ ...newAccountData, accountName: e.target.value })}
                  required
                  placeholder="e.g. Main University Account"
                  className="w-full h-8.5 rounded-lg border border-[#d0d7de] px-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={newAccountData.bankName}
                  onChange={(e) => setNewAccountData({ ...newAccountData, bankName: e.target.value })}
                  required
                  placeholder="e.g. State Bank of India"
                  className="w-full h-8.5 rounded-lg border border-[#d0d7de] px-2.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={newAccountData.branch}
                  onChange={(e) => setNewAccountData({ ...newAccountData, branch: e.target.value })}
                  required
                  placeholder="e.g. Mandirya Branch"
                  className="w-full h-8.5 rounded-lg border border-[#d0d7de] px-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={newAccountData.accountNumber}
                  onChange={(e) => setNewAccountData({ ...newAccountData, accountNumber: e.target.value })}
                  required
                  placeholder="e.g. 405351387552"
                  className="w-full h-8.5 rounded-lg border border-[#d0d7de] px-2.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="text-xs bg-[#0969da] text-white hover:bg-[#085ec4]"
              >
                Register Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
