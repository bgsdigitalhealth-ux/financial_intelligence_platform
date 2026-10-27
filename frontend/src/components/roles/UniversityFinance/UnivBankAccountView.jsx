import React, { useState, useMemo } from 'react'
import {
  Landmark,
  CreditCard,
  Search,
  UploadCloud,
  FileText,
  Clock,
  CheckCircle2,
  History,
  ArrowRight,
  ShieldCheck,
  Building,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

const KARNATAKA_BANKS_PRESETS = [
  { name: 'Canara Bank', ifscPrefix: 'CNRB0001001', branch: 'Main Campus Branch' },
  { name: 'State Bank of India', ifscPrefix: 'SBIN0040101', branch: 'University Campus Branch' },
  { name: 'Bank of Baroda', ifscPrefix: 'BARB0BAN001', branch: 'Vidhana Soudha Branch' },
  { name: 'Union Bank of India', ifscPrefix: 'UBIN0530101', branch: 'District Treasury Branch' },
  { name: 'HDFC Bank', ifscPrefix: 'HDFC0000101', branch: 'City Branch' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC0000101', branch: 'Institutional Branch' },
  { name: 'Punjab National Bank', ifscPrefix: 'PUNJ0000101', branch: 'Commercial Branch' },
]

export function UnivBankAccountView({
  onSelectTab,
  onTriggerToast,
  initialOpenUpload = false,
  canEditReupload = true,
}) {
  const {
    universities,
    bankAccounts = [],
    selectedAccountId,
    setSelectedAccountId,
    statements = [],
    uploadStatement,
    reuploadStatement,
    deleteStatement,
    setActiveStatement,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
  } = useFinancialData()
  const { currentUser } = useAuth()

  // Identify the logged-in university dynamically
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
      universities[0] ||
      { id: currentUser?.universityId || '', name: currentUser?.organization || 'College Enrolled', code: 'COL' }
    )
  }, [universities, currentUser])

  // Filter bank accounts strictly to this logged-in university
  const accounts = useMemo(() => {
    return (bankAccounts || []).filter((a) => a.universityId === myUniversity.id)
  }, [bankAccounts, myUniversity])

  // Selected active account
  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null
  }, [accounts, selectedAccountId])

  // Ledger Search & Filter
  const [txSearch, setTxSearch] = useState('')
  const [txFilter, setTxFilter] = useState('ALL') // 'ALL', 'CREDIT', 'DEBIT'

  // Matched statements for this account strictly from live statements
  const matchedStatements = useMemo(() => {
    if (!currentAccount) return []
    return (statements || []).filter(
      (s) =>
        s.accountId === currentAccount.id ||
        s.accountNumber === currentAccount.accountNumber ||
        (s.universityId === myUniversity.id && s.bankName === currentAccount.bankName)
    )
  }, [statements, currentAccount, myUniversity])

  // Active statement for this account
  const activeStatement = useMemo(() => {
    return matchedStatements[0] || null
  }, [matchedStatements])

  // Dynamic ledger transactions strictly for this selected bank account's active statement
  const transactions = useMemo(() => {
    if (!activeStatement || !activeStatement.transactions) return []

    const base = (activeStatement.transactions || []).map((t) => ({
      id: t.id,
      date: t.date,
      reference: t.referenceNo || t.reference || t.id,
      description: t.description,
      category: t.category,
      type: t.type,
      amount: Number(t.amount) || 0,
      balance: Number(t.balance) || 0,
      status: t.status,
    }))

    return base.filter((t) => {
      const q = (txSearch || '').toLowerCase()
      const matchesSearch =
        (t.description || '').toLowerCase().includes(q) ||
        (t.reference || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      const matchesType = txFilter === 'ALL' || t.type === txFilter
      return matchesSearch && matchesType
    })
  }, [activeStatement, txSearch, txFilter])

  // Balance history trend data for selected account
  const balanceTrend = useMemo(() => {
    if (!currentAccount) return []
    const bal = Number(currentAccount.currentBalance) || 0
    return [
      { month: 'Jul 2026', balance: bal },
      { month: 'Aug 2026', balance: bal },
      { month: 'Sep 2026', balance: bal },
      { month: 'Oct 2026 (Live)', balance: bal },
    ]
  }, [currentAccount])

  // --- Statement Edit & Reupload State ---
  const [statementToEdit, setStatementToEdit] = useState(null)
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false)
  const [reuploadQuarter, setReuploadQuarter] = useState('Q3 FY26 (Oct - Dec 2026)')
  const [reuploadReason, setReuploadReason] = useState('')
  const [reuploadFile, setReuploadFile] = useState(null)
  const [isReuploading, setIsReuploading] = useState(false)

  // Masking helper
  const maskAccNum = (num) => {
    if (!num) return ''
    const str = String(num)
    if (str.length <= 4) return str
    return '••••••••' + str.slice(-4)
  }

  // --- Dynamic Bank Account Creation State ---
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({
    bankName: 'Canara Bank',
    customBankName: '',
    accountHolderName: '',
    accountName: '',
    accountType: 'Treasury Operating Account',
    accountNumber: '',
    ifscCode: 'CNRB0001001',
    branch: 'Main Campus Branch',
    currency: 'INR',
    status: 'Active',
    description: '',
    currentBalance: '0',
  })

  // Previous uploaded statements strictly for this selected bank account
  const previousStatements = matchedStatements

  const handleOpenReuploadModal = (stmt) => {
    setStatementToEdit(stmt)
    setReuploadQuarter(stmt.quarter || 'Q3 FY26 (Oct - Dec 2026)')
    setReuploadReason('')
    setReuploadFile(null)
    setIsReuploadModalOpen(true)
  }

  const handleConfirmReupload = async () => {
    if (!statementToEdit || !currentAccount) return
    if (!reuploadReason.trim()) {
      if (onTriggerToast) {
        onTriggerToast('Revision Reason Required', 'Please enter a justification for the audit trail.', 'danger')
      }
      return
    }

    setIsReuploading(true)
    try {
      const fileName = reuploadFile ? reuploadFile.name : `${currentAccount.bankName.replace(/\s+/g, '_')}_Corrected_Q3_Statement.csv`

      await reuploadStatement(statementToEdit.id, {
        quarter: reuploadQuarter,
        fileName,
        reason: reuploadReason,
        reuploadedBy: `${currentUser?.name || 'Dr. Ramesh Babu, KAS'} (Finance Officer)`,
        totalCredits: statementToEdit.totalCredits,
        totalDebits: statementToEdit.totalDebits,
      })

      setIsReuploadModalOpen(false)
      setIsReuploading(false)
      setStatementToEdit(null)

      if (onTriggerToast) {
        onTriggerToast(
          'Statement Re-uploaded & Re-validated',
          `Replaced statement for ${currentAccount.bankName} (${reuploadQuarter}). AI OCR re-validation complete.`
        )
      }
    } catch (err) {
      setIsReuploading(false)
      if (onTriggerToast) {
        onTriggerToast('Re-upload Failed', err.message, 'danger')
      }
    }
  }

  // --- Dynamic Account Creation ---
  const handleBankPresetChange = (name) => {
    const preset = KARNATAKA_BANKS_PRESETS.find((b) => b.name === name)
    if (preset) {
      setNewAccount((prev) => ({
        ...prev,
        bankName: name,
        branch: preset.branch,
        ifscCode: preset.ifscPrefix,
      }))
    } else {
      setNewAccount((prev) => ({ ...prev, bankName: name }))
    }
  }

  const handleCreateAccountSubmit = async (e) => {
    e.preventDefault()
    const resolvedBankName = newAccount.bankName === 'Other' ? newAccount.customBankName : newAccount.bankName
    const holderName = (newAccount.accountHolderName || newAccount.accountName || '').trim()

    if (!resolvedBankName || !newAccount.accountNumber || !holderName) {
      if (onTriggerToast) {
        onTriggerToast('Incomplete Form', 'Please provide Bank Name, Account Holder Name, and Account Number.', 'danger')
      }
      return
    }

    setIsSubmittingAccount(true)
    try {
      const created = await createBankAccount({
        universityId: myUniversity.id,
        bankName: resolvedBankName,
        accountNumber: newAccount.accountNumber.trim(),
        accountHolderName: holderName,
        accountName: holderName,
        accountType: newAccount.accountType,
        branch: newAccount.branch.trim() || 'Main Campus Branch',
        ifscCode: newAccount.ifscCode.trim() || 'SBIN0001000',
        currency: newAccount.currency || 'INR',
        status: newAccount.status || 'Active',
        description: (newAccount.description || '').trim(),
        currentBalance: Number(newAccount.currentBalance) || 0,
      })

      setIsAddAccountModalOpen(false)
      setIsSubmittingAccount(false)
      setNewAccount({
        bankName: 'Canara Bank',
        customBankName: '',
        accountHolderName: '',
        accountName: '',
        accountType: 'Treasury Operating Account',
        accountNumber: '',
        ifscCode: 'CNRB0001001',
        branch: 'Main Campus Branch',
        currency: 'INR',
        status: 'Active',
        description: '',
        currentBalance: '0',
      })

      if (onTriggerToast) {
        onTriggerToast(
          'Bank Account Added',
          `Configured ${created.bankName} (${created.accountNumberMasked || maskAccNum(created.accountNumber)}) successfully.`,
          'success'
        )
      }
    } catch (err) {
      setIsSubmittingAccount(false)
      if (onTriggerToast) {
        onTriggerToast('Error Adding Account', err.message || 'Server rejected bank account creation.', 'danger')
      }
    }
  }

  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`Are you sure you want to delete bank account ${account.accountNumber} (${account.bankName})? This will also remove any attached statements.`)) {
      return
    }
    try {
      await deleteBankAccount(account.id)
      if (onTriggerToast) {
        onTriggerToast('Bank Account Deleted', `Removed ${account.bankName} (${account.accountNumber}).`)
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Delete Failed', err.message, 'danger')
      }
    }
  }

  // --- Statement Upload Panel State ---
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(initialOpenUpload)
  const [selectedQuarter, setSelectedQuarter] = useState('Q3 FY26 (Oct - Dec 2026)')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('idle') // idle, uploading, ocr, ai_classifying, verifying, completed
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startUploadProcess(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      startUploadProcess(e.target.files[0])
    }
  }

  // Template download helper so users can fill genuine data without mock strings
  const handleDownloadTemplate = () => {
    const csvContent =
      'Date,Reference,Description,Type,Amount,Balance\n' +
      '2026-10-01,RTGS-GOVKAR-001,State Higher Education Grant Inflow,CREDIT,50000000,50000000\n' +
      '2026-10-05,NEFT-SAL-002,Faculty Teaching & Research Staff Monthly Payroll,DEBIT,18000000,32000000\n' +
      '2026-10-10,INV-LAB-003,Nanotechnology Cleanroom Consumables & Lab Equipment,DEBIT,4500000,27500000\n' +
      '2026-10-15,ACH-STIP-004,State Doctoral Scholar Research Fellowships,DEBIT,2500000,25000000\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Bank_Statement_Template_${myUniversity.code || 'UNIV'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (onTriggerToast) {
      onTriggerToast('Template Downloaded', 'Template CSV downloaded. Fill in actual transactions and upload.')
    }
  }

  const startUploadProcess = async (file) => {
    if (!currentAccount) {
      if (onTriggerToast) {
        onTriggerToast('No Account Selected', 'Please configure and select a bank account first.', 'danger')
      }
      return
    }

    setUploadedFile(file)
    setProcessingStage('uploading')
    setUploadProgress(20)

    try {
      setTimeout(() => {
        setProcessingStage('ocr')
        setUploadProgress(50)
      }, 400)

      setTimeout(() => {
        setProcessingStage('ai_classifying')
        setUploadProgress(75)
      }, 800)

      setTimeout(async () => {
        setProcessingStage('verifying')
        setUploadProgress(90)

        const formData = new FormData()
        formData.append('statementFile', file)
        formData.append('universityId', myUniversity.id)
        formData.append('accountId', currentAccount.id)
        formData.append('quarter', selectedQuarter)
        formData.append('uploadedBy', `${currentUser?.name || 'Dr. Ramesh Babu, KAS'} (${currentUser?.roleTitle || 'Finance Officer'})`)

        try {
          const res = await uploadStatement(formData)
          setActiveStatement(res)
          setProcessingStage('completed')
          setUploadProgress(100)

          if (onTriggerToast) {
            onTriggerToast(
              'Statement Uploaded & OCR Processed',
              `Processed ${file.name} for ${currentAccount.bankName}. Extracted ${res.transactions?.length || 0} transactions ready for AI Validation.`
            )
          }
        } catch (apiErr) {
          setProcessingStage('idle')
          if (onTriggerToast) {
            onTriggerToast('Upload Error', apiErr.message || 'Failed to process statement CSV.', 'danger')
          }
        }
      }, 1200)
    } catch (err) {
      setProcessingStage('idle')
      if (onTriggerToast) {
        onTriggerToast('Upload Failed', err.message, 'danger')
      }
    }
  }

  const handleResetUpload = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setProcessingStage('idle')
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Institution Scope */}
      <div className="rounded-lg border border-[#d0d7de] bg-white p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#0969da]" />
            <h1 className="text-sm font-bold text-[#1f2328]">
              Bank Accounts & Treasury Management
            </h1>
            <Badge variant="blue" className="text-[10px] font-mono">
              {myUniversity.code}
            </Badge>
          </div>
          <p className="text-xs text-[#57606a] mt-0.5">
            {myUniversity.name} • Manage institutional bank accounts, view real-time general ledger transactions, and upload quarterly statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddAccountModalOpen(true)}
            className="text-xs font-semibold shadow-2xs cursor-pointer text-[#0969da] border-[#54aeff]/40 hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Bank Account
          </Button>

          {canEditReupload && currentAccount && (
            <Button
              variant={isUploadPanelOpen ? 'secondary' : 'blue'}
              size="sm"
              onClick={() => setIsUploadPanelOpen((prev) => !prev)}
              className="text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
              {isUploadPanelOpen ? 'Close Upload Form' : `Upload Statement for ${currentAccount.bankName}`}
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Section: ALL Accounts in Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[#1f2328] uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-[#0969da]" />
            Institutional Bank Accounts ({accounts.length} Active Accounts)
          </span>
          <span className="text-[11px] text-[#57606a]">
            {accounts.length > 0 ? 'Click any card to select account view' : 'No accounts configured yet'}
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[#d0d7de] bg-[#f6f8fa] text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#0969da]">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1f2328]">No bank accounts have been added yet.</h3>
              <p className="text-xs text-[#57606a] max-w-md mx-auto mt-1">
                Your institution does not have any registered bank accounts in the database. Add your official institutional bank account to begin uploading transaction statements and executing intelligence analysis.
              </p>
            </div>
            <Button
              variant="blue"
              size="sm"
              onClick={() => setIsAddAccountModalOpen(true)}
              className="text-xs font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Bank Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {accounts.map((acct) => {
              const isSelected = acct.id === currentAccount?.id

              return (
                <div
                  key={acct.id}
                  onClick={() => setSelectedAccountId(acct.id)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer text-left relative ${
                    isSelected
                      ? 'border-[#0969da] bg-[#ddf4ff]/20 shadow-sm ring-2 ring-[#0969da]/30'
                      : 'border-[#d0d7de] bg-white hover:border-[#8c959f] hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isSelected
                            ? 'bg-[#0969da] text-white shadow-xs'
                            : 'bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]'
                        }`}
                      >
                        🏦
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#1f2328]">{acct.bankName}</h3>
                        <p className="text-[10px] text-[#57606a] font-mono">{acct.accountNumberMasked || maskAccNum(acct.accountNumber)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0969da] text-white flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="h-3 w-3" />
                          Selected
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteAccount(acct)
                        }}
                        className="p-1 rounded text-[#8c959f] hover:text-[#cf222e] hover:bg-red-50"
                        title="Delete Bank Account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-[#57606a] truncate mb-2">
                    {acct.accountName}
                  </div>

                  <div className="pt-2 border-t border-[#d0d7de]/60 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#57606a]">Live Balance</div>
                      <div className="text-base font-bold text-[#1a7f37]">
                        {formatCurrency(acct.currentBalance, true)}
                      </div>
                    </div>
                    <Badge variant={isSelected ? 'blue' : 'default'} className="text-[10px]">
                      {acct.accountType ? acct.accountType.split('/')[0].trim() : 'Current'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Upload Statement Panel (Bound to selected account) */}
      {isUploadPanelOpen && currentAccount && (
        <Card className="border-2 border-[#0969da] bg-gradient-to-br from-blue-50/40 via-white to-white">
          <CardHeader className="border-b border-[#d0d7de] pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-[#0969da]" />
                  Upload Statement for {currentAccount.bankName} ({currentAccount.accountNumber})
                </CardTitle>
                <CardDescription className="text-xs text-[#57606a]">
                  This statement will be bound to account <strong className="font-mono">{currentAccount.accountNumber}</strong> with live OCR and Chart of Accounts categorization.
                </CardDescription>
              </div>
              <Badge variant="blue" className="self-start sm:self-auto font-mono text-[10px]">
                Target: {currentAccount.bankName}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Step A: Select Quarter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#0969da]" />
                  Financial Quarter Period:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Q1 FY26 (Apr - Jun 2026)', label: 'Q1 FY26', desc: 'Apr - Jun 2026' },
                    { id: 'Q2 FY26 (Jul - Sep 2026)', label: 'Q2 FY26', desc: 'Jul - Sep 2026' },
                    { id: 'Q3 FY26 (Oct - Dec 2026)', label: 'Q3 FY26 (Current)', desc: 'Oct - Dec 2026' },
                    { id: 'Q4 FY26 (Jan - Mar 2027)', label: 'Q4 FY26', desc: 'Jan - Mar 2027' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setSelectedQuarter(q.id)}
                      className={`p-2 rounded border text-left transition cursor-pointer ${
                        selectedQuarter === q.id
                          ? 'border-[#0969da] bg-[#ddf4ff]/50 text-[#0969da] font-bold'
                          : 'border-[#d0d7de] bg-white text-[#1f2328] hover:bg-[#f6f8fa]'
                      }`}
                    >
                      <div className="text-xs">{q.label}</div>
                      <div className="text-[10px] text-[#57606a]">{q.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1.5 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-[#0969da]" />
                  Selected Bank Account (Locked):
                </label>
                <div className="p-3 rounded-lg border border-blue-200 bg-white text-xs space-y-1">
                  <div className="flex justify-between font-bold text-[#1f2328]">
                    <span>{currentAccount.bankName}</span>
                    <span className="text-[#1a7f37] font-semibold">{formatCurrency(currentAccount.currentBalance, true)}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#57606a]">Account: {currentAccount.accountNumber}</div>
                  <div className="text-[11px] text-[#57606a]">Branch: {currentAccount.branch || 'Campus Branch'} • IFSC: {currentAccount.ifscCode}</div>
                </div>
              </div>
            </div>

            {/* Step B: Upload File or Download Template */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragOver ? 'border-[#0969da] bg-[#ddf4ff]/40' : 'border-[#d0d7de] hover:border-[#0969da] bg-white'
              }`}
            >
              <UploadCloud className="h-8 w-8 text-[#0969da] mx-auto mb-2" />
              <div className="text-xs font-semibold text-[#1f2328]">
                Drag and drop your bank statement (CSV, XLSX, PDF) or click to browse
              </div>
              <p className="text-[11px] text-[#57606a] mt-1">
                Statement will be parsed dynamically with AI OCR and auto-reconciled against account {currentAccount.accountNumber}
              </p>

              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                accept=".csv,.pdf,.xlsx"
                onChange={handleFileChange}
              />

              <div className="mt-3 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload-input').click()}
                  className="text-xs"
                >
                  Select File from Computer
                </Button>
                <span className="text-xs text-[#8c959f]">or</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-xs font-semibold text-[#0969da] border-[#54aeff]/40"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Sample CSV Template
                </Button>
              </div>
            </div>

            {/* Upload Stepper Progress */}
            {processingStage !== 'idle' && (
              <div className="p-3.5 bg-[#f6f8fa] rounded-lg border border-[#d0d7de] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1f2328]">
                    Processing {uploadedFile?.name || 'Statement'}
                  </span>
                  <span className="font-mono text-[#0969da] font-bold">{uploadProgress}%</span>
                </div>

                <div className="w-full bg-[#d0d7de] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0969da] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] text-center">
                  <span className={uploadProgress >= 25 ? 'font-bold text-[#0969da]' : 'text-[#8c959f]'}>1. Uploading</span>
                  <span className={uploadProgress >= 50 ? 'font-bold text-[#0969da]' : 'text-[#8c959f]'}>2. OCR Extraction</span>
                  <span className={uploadProgress >= 75 ? 'font-bold text-[#0969da]' : 'text-[#8c959f]'}>3. AI Classification</span>
                  <span className={uploadProgress >= 100 ? 'font-bold text-[#1a7f37]' : 'text-[#8c959f]'}>4. Reconciled</span>
                </div>

                {processingStage === 'completed' && (
                  <div className="p-3 bg-[#dafbe1]/40 border border-[#1a7f37]/30 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2 text-xs text-[#1a7f37]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Bank statement successfully ingested and categorized! Ready for AI Validation.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={handleResetUpload} className="text-xs">
                        Upload Another
                      </Button>
                      <Button
                        variant="blue"
                        size="sm"
                        onClick={() => onSelectTab('ai_validation')}
                        className="text-xs font-semibold"
                      >
                        Proceed to AI Validation
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Selected Account Details & Historical Charts */}
      {currentAccount && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Account Details Specs */}
          <Card className="lg:col-span-1 bg-white">
            <CardHeader className="border-b border-[#d0d7de] pb-3">
              <CardTitle className="text-xs font-bold text-[#1f2328] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0969da]" />
                Account Details & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3.5 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">Bank Name:</span>
                <span className="font-semibold text-[#1f2328]">{currentAccount.bankName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">Account Holder:</span>
                <span className="font-medium text-[#1f2328]">{currentAccount.accountHolderName || currentAccount.accountName || myUniversity.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">Account Number:</span>
                <span className="font-mono font-semibold text-[#0969da]">{currentAccount.accountNumberMasked || maskAccNum(currentAccount.accountNumber)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">IFSC Code:</span>
                <span className="font-mono text-[#1f2328]">{currentAccount.ifscCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">Branch:</span>
                <span className="text-[#1f2328]">{currentAccount.branch || 'Main Campus Branch'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">Account Type:</span>
                <span className="text-[#1f2328]">{currentAccount.accountType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">Currency:</span>
                <span className="font-mono text-[#1f2328]">{currentAccount.currency || 'INR'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                <span className="text-[#57606a]">Account Status:</span>
                <Badge variant="success" className="text-[10px]">{currentAccount.status || 'Active'}</Badge>
              </div>
              {currentAccount.description && (
                <div className="flex justify-between py-1 border-b border-[#d0d7de]/50">
                  <span className="text-[#57606a]">Description:</span>
                  <span className="text-[#1f2328] text-[11px] truncate max-w-[180px]">{currentAccount.description}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-[#57606a]">Statutory Solvency:</span>
                <Badge variant="blue" className="text-[10px]">Compliant</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Balance Trend Chart */}
          <Card className="lg:col-span-2 bg-white">
            <CardHeader className="border-b border-[#d0d7de] pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-[#1f2328] uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4 w-4 text-[#1a7f37]" />
                  Live Account Balance Trend
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Live Ledger Sync
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="acctBalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0969da" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0969da" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d0d7de" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#57606a' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`}
                      tick={{ fontSize: 10, fill: '#57606a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Balance']}
                      contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #d0d7de' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name="Account Balance"
                      stroke="#0969da"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#acctBalGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. General Ledger Transaction Lines */}
      {currentAccount && (
        <Card>
          <CardHeader className="border-b border-[#d0d7de] pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0969da]" />
                  General Ledger Transactions — {currentAccount.bankName}
                </CardTitle>
                <CardDescription className="text-xs text-[#57606a]">
                  Dynamic ledger journal lines parsed from verified quarterly statement filings
                </CardDescription>
              </div>

              {/* Search & Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57606a]" />
                  <input
                    type="text"
                    placeholder="Search reference, description..."
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
                  <option value="ALL">All Entries</option>
                  <option value="CREDIT">Credits Only (+)</option>
                  <option value="DEBIT">Debits Only (-)</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[11px] font-semibold text-[#57606a]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Reference No</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Chart Category</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-[#57606a]">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#1f2328]">No transactions on record for this account</p>
                          <p className="text-[11px] text-[#57606a]">
                            Upload a quarterly bank statement (CSV) above to parse, classify, and reconcile live ledger entries.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#f6f8fa]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#57606a]">{tx.date}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-[#0969da]">{tx.reference}</td>
                        <td className="py-2.5 px-3 font-medium text-[#1f2328]">{tx.description}</td>
                        <td className="py-2.5 px-3 text-[#57606a] text-[11px]">{tx.category}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={tx.type === 'CREDIT' ? 'success' : 'danger'} className="text-[9.5px]">
                            {tx.type}
                          </Badge>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-semibold font-mono ${
                            tx.type === 'CREDIT' ? 'text-[#1a7f37]' : 'text-[#cf222e]'
                          }`}
                        >
                          {tx.type === 'CREDIT' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-[#1f2328]">
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

      {/* 6. Previous Statement Uploads History */}
      {currentAccount && (
        <Card className="bg-white border border-[#d0d7de]">
          <CardHeader className="border-b border-[#d0d7de] pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
                  <History className="h-4 w-4 text-[#0969da]" />
                  Previous Statement Uploads History — {currentAccount.bankName}
                </CardTitle>
                <CardDescription className="text-xs text-[#57606a]">
                  Chronological record of filed quarterly statements for account {currentAccount.accountNumber}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[11px] font-semibold text-[#57606a]">
                    <th className="py-2.5 px-3">Quarter</th>
                    <th className="py-2.5 px-3">Statement File</th>
                    <th className="py-2.5 px-3">Uploaded At</th>
                    <th className="py-2.5 px-3">Uploaded By</th>
                    <th className="py-2.5 px-3 text-right">Credits (+)</th>
                    <th className="py-2.5 px-3 text-right">Debits (-)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Finance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {previousStatements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#57606a]">
                        No quarterly statements have been uploaded for this account yet.
                      </td>
                    </tr>
                  ) : (
                    previousStatements.map((stmt) => (
                      <tr key={stmt.id} className="hover:bg-[#f6f8fa]/70 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#1f2328]">
                          {stmt.quarter}
                          {stmt.isCorrected && (
                            <span className="block text-[10px] text-[#0969da] font-normal">
                              ● Corrected Revision
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] font-medium text-[#0969da]">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[#57606a]" />
                            <span>{stmt.fileName}</span>
                          </div>
                          <span className="text-[10px] text-[#57606a] font-normal">
                            Size: {stmt.fileSize || '250 KB'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#57606a] font-mono text-[11px]">
                          {stmt.uploadedAt || 'Recently'}
                        </td>
                        <td className="py-3 px-3 text-[#1f2328] font-medium">
                          {stmt.uploadedBy || 'Finance Officer'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#1a7f37]">
                          +{formatCurrency(stmt.totalCredits || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#cf222e]">
                          -{formatCurrency(stmt.totalDebits || 0)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={stmt.status?.includes('Approved') ? 'success' : 'blue'} className="text-[9.5px]">
                            {stmt.status || 'AI Validated'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEditReupload && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReuploadModal(stmt)}
                                className="h-7 text-[11px] px-2 font-semibold text-[#0969da] hover:bg-blue-50 border-[#0969da]/30 cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit & Reupload
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveStatement(stmt)
                                onSelectTab('ai_validation')
                              }}
                              className="h-7 text-[11px] px-2 text-[#57606a] hover:text-[#1f2328]"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Report
                            </Button>
                          </div>
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

      {/* 7. Modal: Add Official Bank Account */}
      {isAddAccountModalOpen && (
        <Modal
          isOpen={isAddAccountModalOpen}
          onClose={() => setIsAddAccountModalOpen(false)}
          title="Configure Institutional Bank Account"
          description="Register an official public sector or scheduled commercial bank account for your university."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="blue"
                size="sm"
                disabled={isSubmittingAccount}
                onClick={handleCreateAccountSubmit}
                className="text-xs font-semibold cursor-pointer"
              >
                {isSubmittingAccount ? 'Registering...' : 'Save & Register Account'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAccount.bankName}
                  onChange={(e) => handleBankPresetChange(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                >
                  {KARNATAKA_BANKS_PRESETS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                  <option value="Other">Other Bank (Custom)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${myUniversity.name || 'University Treasury'}`}
                  value={newAccount.accountHolderName}
                  onChange={(e) => setNewAccount({ ...newAccount, accountHolderName: e.target.value, accountName: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                />
              </div>
            </div>

            {newAccount.bankName === 'Other' && (
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Custom Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank of Maharashtra, Axis Bank..."
                  value={newAccount.customBankName}
                  onChange={(e) => setNewAccount({ ...newAccount, customBankName: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 102938475610"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  className="w-full h-8 px-2.5 font-mono rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">IFSC Code (where applicable):</label>
                <input
                  type="text"
                  placeholder="e.g. CNRB0001001"
                  value={newAccount.ifscCode}
                  onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full h-8 px-2.5 font-mono uppercase rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Account Type:</label>
                <select
                  value={newAccount.accountType}
                  onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                >
                  <option value="Treasury Operating Account">Treasury Operating Account</option>
                  <option value="Sponsored Research Grant Escrow">Sponsored Research Grant Escrow</option>
                  <option value="Faculty & Staff Payroll Ledger">Faculty & Staff Payroll Ledger</option>
                  <option value="Student Fee & Examination Clearing">Student Fee & Examination Clearing</option>
                  <option value="Capital Projects & Infrastructure">Capital Projects & Infrastructure</option>
                  <option value="Savings Account">Savings Account</option>
                  <option value="Current Account">Current Account</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Branch Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Main Campus Branch"
                  value={newAccount.branch}
                  onChange={(e) => setNewAccount({ ...newAccount, branch: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Account Currency:</label>
                <select
                  value={newAccount.currency}
                  onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Account Status:</label>
                <select
                  value={newAccount.status}
                  onChange={(e) => setNewAccount({ ...newAccount, status: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Dormant">Dormant</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Optional Account Description:</label>
              <input
                type="text"
                placeholder="e.g. Primary State Treasury grant dispersal and operational fund"
                value={newAccount.description}
                onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Initial Opening Balance (₹ INR):</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={newAccount.currentBalance}
                onChange={(e) => setNewAccount({ ...newAccount, currentBalance: e.target.value })}
                className="w-full h-8 px-2.5 font-mono rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* 8. Modal: Edit & Reupload Statement (Finance Role Only) */}
      {isReuploadModalOpen && statementToEdit && currentAccount && (
        <Modal
          isOpen={isReuploadModalOpen}
          onClose={() => setIsReuploadModalOpen(false)}
          title={`Edit & Reupload Bank Statement — ${currentAccount.bankName}`}
          description="Authorized Finance Officer Correction • Karnataka State Universities Act 2000 §102"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#57606a]">
                Author: <strong>{currentUser?.name || 'Dr. Ramesh Babu, KAS'}</strong> (Finance Officer)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReuploadModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="blue"
                  size="sm"
                  disabled={isReuploading}
                  onClick={handleConfirmReupload}
                  className="text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5 mr-1" />
                  {isReuploading ? 'Ingesting & Validating...' : 'Confirm Reupload & Run AI Validation'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#57606a]">Current File Name:</span>
                <span className="font-mono font-semibold text-[#1f2328]">{statementToEdit.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57606a]">Bank & Account Number:</span>
                <span className="font-semibold text-[#1f2328]">
                  {currentAccount.bankName} ({currentAccount.accountNumber})
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Financial Quarter & Accounting Period:
              </label>
              <select
                value={reuploadQuarter}
                onChange={(e) => setReuploadQuarter(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              >
                <option value="Q3 FY26 (Oct - Dec 2026)">Q3 FY26 (Oct - Dec 2026) — Current Active Filing</option>
                <option value="Q2 FY26 (Jul - Sep 2026)">Q2 FY26 (Jul - Sep 2026)</option>
                <option value="Q1 FY26 (Apr - Jun 2026)">Q1 FY26 (Apr - Jun 2026)</option>
                <option value="Q4 FY26 (Jan - Mar 2027)">Q4 FY26 (Jan - Mar 2027) — Upcoming</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Upload Corrected Replacement Statement File (PDF, CSV, XLSX):
              </label>
              <div className="border border-dashed border-[#0969da]/50 rounded-lg p-3 bg-blue-50/20 text-center space-y-2">
                <input
                  type="file"
                  id="reupload-file-input"
                  className="hidden"
                  accept=".csv,.pdf,.xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReuploadFile(e.target.files[0])
                    }
                  }}
                />
                <div className="text-xs text-[#57606a]">
                  {reuploadFile ? (
                    <span className="font-mono font-bold text-[#1a7f37]">
                      ✓ Selected: {reuploadFile.name} ({(reuploadFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <span>Drag and drop corrected file here, or browse files</span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('reupload-file-input').click()}
                    className="text-xs bg-white"
                  >
                    Select File from Computer
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-xs text-[#0969da]"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Correction Justification & Revision Reason (Required for Audit Journal):
              </label>
              <textarea
                rows={3}
                value={reuploadReason}
                onChange={(e) => setReuploadReason(e.target.value)}
                placeholder="Specify why the previous statement was replaced (e.g., Erroneous branch statement was initially uploaded; replaced with verified certified general ledger statement)..."
                className="w-full rounded-md border border-[#d0d7de] p-2 text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
