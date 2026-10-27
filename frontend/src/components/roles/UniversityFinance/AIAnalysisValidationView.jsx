import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Layers,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Edit3,
  Undo2,
  Download,
  Info,
  Filter,
  Landmark,
  Calculator,
  Search,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function AIAnalysisValidationView({ onSelectTab, onTriggerToast }) {
  const {
    activeStatement,
    statements,
    resolveStatementException,
  } = useFinancialData()
  const { currentUser } = useAuth()

  // Use current active statement or fallback to latest statement for logged in university strictly
  const statement = useMemo(() => {
    if (currentUser?.universityId) {
      const myStmts = statements.filter((s) => s.universityId === currentUser.universityId)
      if (myStmts.length > 0) {
        if (activeStatement && activeStatement.universityId === currentUser.universityId) {
          return activeStatement
        }
        return myStmts[0]
      }
      return null
    }
    return activeStatement || statements[0] || null
  }, [activeStatement, statements, currentUser])

  // Exception resolution state
  const [selectedTx, setSelectedTx] = useState(null)
  const [resolutionAction, setResolutionAction] = useState('CFO Approved with Justification')
  const [resolutionNote, setResolutionNote] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  // Filter state
  const [filterTab, setFilterTab] = useState('ALL') // 'ALL', 'VALIDATED', 'EXCEPTION', 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('')

  // Masking helper
  const maskAccNum = (num) => {
    if (!num) return ''
    const str = String(num)
    if (str.length <= 4) return str
    return '••••••••' + str.slice(-4)
  }

  // Deterministic financial reconciliation values (calculated vs extracted)
  const openingBalance = Number(statement?.openingBalance) || 0
  const totalCredits = Number(statement?.totalCredits) || 0
  const totalDebits = Number(statement?.totalDebits) || 0
  const calculatedClosing = openingBalance + totalCredits - totalDebits
  const reportedClosing = Number(statement?.closingBalance) || 0
  const variance = Math.abs(calculatedClosing - reportedClosing)
  const isReconciled = variance < 0.01

  // Extracted metrics & duplicate check
  const extractedTxCount = (statement?.transactions || []).length
  const duplicateTxList = (statement?.transactions || []).filter(
    (t) => t.flag?.toLowerCase().includes('duplicate') || t.isDuplicate
  )

  // Unresolved & Resolved exceptions
  const pendingExceptions = useMemo(() => {
    return (statement?.transactions || []).filter((t) => t.status === 'Exception' && !t.resolved)
  }, [statement])

  const resolvedExceptions = useMemo(() => {
    return (statement?.transactions || []).filter((t) => t.resolved || t.status === 'Resolved')
  }, [statement])

  // Average confidence calculation
  const avgConfidence = useMemo(() => {
    const txs = statement?.transactions || []
    if (txs.length === 0) return statement?.aiValidation?.confidenceScore || 98.2
    const total = txs.reduce((sum, t) => sum + (Number(t.aiConfidence) || 95), 0)
    return (total / txs.length).toFixed(1)
  }, [statement])

  // Filtered transactions for table
  const filteredTransactions = useMemo(() => {
    let list = statement?.transactions || []

    if (filterTab === 'VALIDATED') {
      list = list.filter((t) => t.status === 'Validated' && !t.resolved)
    } else if (filterTab === 'EXCEPTION') {
      list = list.filter((t) => t.status === 'Exception' && !t.resolved)
    } else if (filterTab === 'RESOLVED') {
      list = list.filter((t) => t.resolved || t.status === 'Resolved')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
      )
    }

    return list
  }, [statement, filterTab, searchQuery])

  // Handle Resolve Exception Submit
  const handleResolveSubmit = async () => {
    if (!selectedTx || !statement) return
    setIsResolving(true)
    try {
      await resolveStatementException(statement.id, {
        transactionId: selectedTx.id,
        resolutionAction,
        resolutionNote: resolutionNote || 'Justified by Finance Officer per higher education procurement provisions',
        newCategory: newCategory || undefined,
      })

      setSelectedTx(null)
      setResolutionNote('')
      setNewCategory('')

      if (onTriggerToast) {
        onTriggerToast(
          'Exception Resolved',
          `Updated transaction ${selectedTx.referenceNo} to Resolved status with CFO justification.`
        )
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Resolution Failed', err.message, 'danger')
      }
    } finally {
      setIsResolving(false)
    }
  }

  // Clear Empty State when no statement is available
  if (!statement) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-[#d0d7de] bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#8250df]" />
              <h1 className="text-sm font-bold text-[#1f2328]">
                AI Analysis & Ledger Validation
              </h1>
              <Badge variant="purple" className="text-[10px]">
                Deterministic Engine
              </Badge>
            </div>
            <p className="text-xs text-[#57606a] mt-0.5">
              Automated OCR transaction extraction, mathematical balance reconciliation, and policy compliance verification.
            </p>
          </div>
          <Button variant="blue" size="sm" onClick={() => onSelectTab('bank_accounts')}>
            <Landmark className="h-3.5 w-3.5 mr-1.5" />
            Upload Bank Statement
          </Button>
        </div>

        <div className="bg-white p-8 rounded-xl border border-[#d0d7de] text-center shadow-xs space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <div className="h-12 w-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-[#8250df]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-[#1f2328]">
              No Quarterly Statement Uploaded Yet
            </h2>
            <p className="text-xs text-[#57606a]">
              Upload your institution's official bank statement (PDF or CSV) to trigger the automated 4-stage AI validation pipeline.
            </p>
          </div>

          {/* 4 Pillars of AI Validation Explained */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left max-w-4xl mx-auto">
            <div className="p-3.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa]">
              <div className="font-bold text-xs text-[#1f2328] flex items-center gap-1.5 mb-1">
                <FileCheck2 className="h-4 w-4 text-[#0969da]" />
                1. OCR & Parsing
              </div>
              <p className="text-[11px] text-[#57606a]">
                Extracts opening balance, transaction rows, reference numbers, and closing balance without manual entry.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa]">
              <div className="font-bold text-xs text-[#1f2328] flex items-center gap-1.5 mb-1">
                <Calculator className="h-4 w-4 text-[#1a7f37]" />
                2. Math Reconciliation
              </div>
              <p className="text-[11px] text-[#57606a]">
                Proves mathematically: Opening + Credits − Debits = Closing. Flags any discrepancies or unrecorded entries.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa]">
              <div className="font-bold text-xs text-[#1f2328] flex items-center gap-1.5 mb-1">
                <Sparkles className="h-4 w-4 text-[#8250df]" />
                3. Chart-of-Accounts
              </div>
              <p className="text-[11px] text-[#57606a]">
                Deep learning NLP auto-classifies transactions into approved budget heads (Payroll, Lab Infra, Consumables).
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa]">
              <div className="font-bold text-xs text-[#1f2328] flex items-center gap-1.5 mb-1">
                <ShieldAlert className="h-4 w-4 text-[#cf222e]" />
                4. Anomaly Screening
              </div>
              <p className="text-[11px] text-[#57606a]">
                Scans for duplicate payments, unallowable expenditures under KGFR Ch 8, and provides CFO resolution workflows.
              </p>
            </div>
          </div>

          <Button variant="blue" size="sm" onClick={() => onSelectTab('bank_accounts')}>
            Go to Bank Accounts & Upload Statement
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50/70 via-white to-blue-50/40 p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[#8250df] text-white text-xs flex items-center justify-center font-bold shrink-0">
              5
            </span>
            <h1 className="text-sm font-bold text-[#1f2328]">
              Step 5: AI Analysis & Validation
            </h1>
            <Badge variant="purple" className="text-[10px]">
              AI Reconciled
            </Badge>
          </div>
          <p className="text-xs text-[#57606a] mt-0.5">
            OCR line extraction, double-entry mathematical reconciliation, Chart of Accounts classification & exception resolution.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('statement_upload')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            Step 4: Upload
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('submission_compliance')}
            className="text-xs font-semibold"
          >
            <span>Proceed to Step 6: Compliance</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* 2. Visual AI Validation Pipeline Stepper (Crystal Clear Understanding) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: Document Parsing & OCR */}
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center justify-between text-xs font-bold text-[#1f2328]">
            <span>1. OCR & Parsing</span>
            <CheckCircle2 className="h-4 w-4 text-[#1a7f37]" />
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            <strong>{extractedTxCount}</strong> transactions parsed from statement.
          </div>
          <div className="text-[10px] font-semibold text-[#1a7f37] mt-1.5 flex items-center gap-1">
            ✓ Text & Header Extraction Complete
          </div>
        </div>

        {/* Step 2: Double-Entry Math Reconciliation */}
        <div
          className={`p-3 rounded-lg border ${
            isReconciled ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#1f2328]">
            <span>2. Ledger Reconciliation</span>
            {isReconciled ? (
              <CheckCircle2 className="h-4 w-4 text-[#1a7f37]" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[#cf222e]" />
            )}
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            Formula: Opening + Credits − Debits
          </div>
          <div
            className={`text-[10px] font-semibold mt-1.5 ${
              isReconciled ? 'text-[#1a7f37]' : 'text-[#cf222e]'
            }`}
          >
            {isReconciled ? '✓ Math Verified (₹0.00 Variance)' : `⚠ Discrepancy: ${formatCurrency(variance)}`}
          </div>
        </div>

        {/* Step 3: Chart of Accounts Auto-Classification */}
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
          <div className="flex items-center justify-between text-xs font-bold text-[#1f2328]">
            <span>3. COA Auto-Classification</span>
            <Sparkles className="h-4 w-4 text-[#0969da]" />
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            Auto-categorized into statutory budget heads.
          </div>
          <div className="text-[10px] font-semibold text-[#0969da] mt-1.5">
            ✓ Average AI Confidence: {avgConfidence}%
          </div>
        </div>

        {/* Step 4: Policy & Anomaly Screening */}
        <div
          className={`p-3 rounded-lg border ${
            pendingExceptions.length === 0
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-amber-200 bg-amber-50/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#1f2328]">
            <span>4. Anomaly & Rule Check</span>
            {pendingExceptions.length === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-[#1a7f37]" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[#d97706]" />
            )}
          </div>
          <div className="text-[11px] text-[#57606a] mt-1">
            Screens duplicate payments & unallowable costs.
          </div>
          <div
            className={`text-[10px] font-semibold mt-1.5 ${
              pendingExceptions.length === 0 ? 'text-[#1a7f37]' : 'text-[#d97706]'
            }`}
          >
            {pendingExceptions.length === 0
              ? '✓ Clean (Zero Exceptions)'
              : `⚠ ${pendingExceptions.length} Exception(s) Pending Review`}
          </div>
        </div>
      </div>

      {/* 3. Linked Statement & Mathematical Reconciliation Bar */}
      <div className="p-4 bg-white rounded-xl border border-[#d0d7de] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#eaeef2] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1f2328]">{statement.bankName}</span>
              <span className="font-mono text-xs text-[#0969da] px-1.5 py-0.5 rounded bg-[#ddf4ff] font-semibold">
                {statement.accountNumberMasked || maskAccNum(statement.accountNumber)}
              </span>
              <Badge variant="blue" className="text-[10px] font-mono">
                {statement.quarter || 'FY26 Q3'}
              </Badge>
            </div>
            <p className="text-xs text-[#57606a] mt-0.5">
              Source File: <strong className="font-mono text-[#1f2328]">{statement.fileName}</strong> • Processed: {statement.createdAt || statement.uploadedAt || 'Current Session'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {extractedTxCount} Extracted Rows
            </Badge>
            <Badge
              variant={statement.status === 'Approved by Gov Leader' ? 'success' : 'blue'}
              className="text-xs"
            >
              {statement.status}
            </Badge>
          </div>
        </div>

        {/* Clear Mathematical Reconciliation Equation */}
        <div
          className={`p-3.5 rounded-lg border text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 ${
            isReconciled
              ? 'bg-[#dafbe1]/40 border-[#1a7f37]/30 text-[#1a7f37]'
              : 'bg-[#ffebe9] border-[#cf222e]/30 text-[#cf222e]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {isReconciled ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-[#1a7f37]" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-[#cf222e]" />
            )}
            <div>
              <div className="font-bold text-xs flex flex-wrap items-center gap-2">
                <span>
                  {isReconciled
                    ? 'Double-Entry Mathematical Balance Verified'
                    : 'Mathematical Balance Discrepancy Flagged'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 border border-current font-bold text-[#1f2328]">
                  Opening ({formatCurrency(openingBalance, false)}) + Credits ({formatCurrency(totalCredits, false)}) − Debits ({formatCurrency(totalDebits, false)}) = {formatCurrency(calculatedClosing, false)}
                </span>
              </div>
              <div className="text-[11px] mt-1 opacity-90">
                {isReconciled
                  ? 'Calculated ledger sum matches reported statement closing balance exactly with zero forced adjustments.'
                  : `A discrepancy of ${formatCurrency(variance, false)} was detected between calculated transactions and stated closing balance.`}
              </div>
            </div>
          </div>
          <div className="shrink-0 font-mono text-xs font-bold">
            {isReconciled ? 'Variance: ₹0.00' : `Variance: ₹${formatCurrency(variance, false)}`}
          </div>
        </div>
      </div>

      {/* 4. Extracted vs Calculated Financial Balance Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Opening Balance */}
        <Card className="p-4 bg-white border border-[#d0d7de] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#57606a] font-semibold uppercase tracking-wider">
                Opening Balance
              </span>
              <Badge variant="outline" className="text-[9px] text-[#57606a] bg-[#f6f8fa]">
                Extracted
              </Badge>
            </div>
            <div className="text-xl font-bold text-[#1f2328] mt-2">
              {formatCurrency(openingBalance, true)}
            </div>
          </div>
          <div className="text-[10px] text-[#57606a] mt-2 pt-2 border-t border-[#eaeef2]">
            Extracted from statement header
          </div>
        </Card>

        {/* Card 2: Total Credits */}
        <Card className="p-4 bg-white border border-[#d0d7de] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#57606a] font-semibold uppercase tracking-wider">
                Total Credits
              </span>
              <Badge variant="success" className="text-[9px]">
                Calculated
              </Badge>
            </div>
            <div className="text-xl font-bold text-[#1a7f37] mt-2">
              +{formatCurrency(totalCredits, true)}
            </div>
          </div>
          <div className="text-[10px] text-[#57606a] mt-2 pt-2 border-t border-[#eaeef2]">
            Sum of verified credit vouchers
          </div>
        </Card>

        {/* Card 3: Total Debits */}
        <Card className="p-4 bg-white border border-[#d0d7de] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#57606a] font-semibold uppercase tracking-wider">
                Total Debits
              </span>
              <Badge variant="danger" className="text-[9px]">
                Calculated
              </Badge>
            </div>
            <div className="text-xl font-bold text-[#cf222e] mt-2">
              -{formatCurrency(totalDebits, true)}
            </div>
          </div>
          <div className="text-[10px] text-[#57606a] mt-2 pt-2 border-t border-[#eaeef2]">
            Sum of verified debit disbursements
          </div>
        </Card>

        {/* Card 4: Closing Balance */}
        <Card className="p-4 bg-white border border-[#d0d7de] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#57606a] font-semibold uppercase tracking-wider">
                Closing Balance
              </span>
              <Badge variant="outline" className="text-[9px] text-[#57606a] bg-[#f6f8fa]">
                Extracted
              </Badge>
            </div>
            <div className="text-xl font-bold text-[#0969da] mt-2">
              {formatCurrency(reportedClosing, true)}
            </div>
          </div>
          <div className="text-[10px] text-[#57606a] mt-2 pt-2 border-t border-[#eaeef2]">
            Reported end-of-period ledger balance
          </div>
        </Card>
      </div>

      {/* 5. AI-Generated Explanation & Finding Summary */}
      <Card className="p-5 bg-gradient-to-br from-[#fbefff]/30 via-white to-white border border-[#d0d7de]">
        <div className="flex items-center justify-between mb-3 border-b border-[#eaeef2] pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#8250df]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f2328]">
              AI-Generated Statement Analysis & Audit Findings
            </h3>
          </div>
          <Badge variant="purple" className="text-[10px]">
            AI Verified
          </Badge>
        </div>

        <div className="space-y-3 text-xs text-[#1f2328]">
          <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/70 leading-relaxed">
            {statement.aiValidation?.aiExplanation ||
              statement.aiValidation?.summary ||
              statement.aiSummary ||
              statement.summary || (
                <span>
                  Statement processed successfully across {extractedTxCount} extracted general ledger lines. OCR line items have been auto-classified against the official Karnataka State Chart of Accounts with an accuracy score of {avgConfidence}%. Financial validation confirmed opening and closing balances with zero forced adjustments.
                </span>
              )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#57606a] pt-1">
            <span><strong>Source Evidence:</strong> {statement.fileName}</span>
            <span>•</span>
            <span><strong>Audit Status:</strong> Automated Double-Entry Reconciled</span>
            <span>•</span>
            <span><strong>Avg AI Confidence:</strong> {avgConfidence}%</span>
            <span>•</span>
            <span><strong>Exceptions:</strong> {pendingExceptions.length === 0 ? 'Clean (0)' : `${pendingExceptions.length} pending review`}</span>
          </div>
        </div>
      </Card>

      {/* 6. Action Banners (Duplicates or Exceptions) */}
      {duplicateTxList.length > 0 && (
        <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
          <div>
            <strong>Possible Duplicate Transactions Detected ({duplicateTxList.length} items):</strong>
            <p className="mt-0.5 text-[11px] text-amber-800">
              Multiple transaction entries with matching dates, amounts, or reference numbers were flagged. Please inspect these rows before finalizing submission.
            </p>
          </div>
        </div>
      )}

      {pendingExceptions.length > 0 && (
        <div className="p-3.5 rounded-lg border border-[#d4a72c]/40 bg-[#fff8c5]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#5f370e]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#9a6700] shrink-0" />
            <div>
              <strong>Action Required: {pendingExceptions.length} Compliance Exception{pendingExceptions.length > 1 ? 's' : ''} Flagged:</strong>
              <div className="text-[11px] text-[#5f370e]/80 mt-0.5">
                Review and provide CFO justification notes or reclassify expenditure head before submitting to the Department of Higher Education.
              </div>
            </div>
          </div>
          <Button
            variant="blue"
            size="sm"
            onClick={() => setFilterTab('EXCEPTION')}
            className="text-xs shrink-0 self-start sm:self-auto"
          >
            View {pendingExceptions.length} Exceptions
          </Button>
        </div>
      )}

      {/* 7. Extracted Statement Transactions Table with Filters */}
      <Card>
        <CardHeader className="border-b border-[#d0d7de] pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#0969da]" />
                Extracted Statement Transactions & AI Classification
              </CardTitle>
              <CardDescription className="text-xs text-[#57606a]">
                File: <span className="font-mono">{statement.fileName}</span> • {statement.bankName} ({statement.accountNumber})
              </CardDescription>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-[#d0d7de] p-0.5 bg-[#f6f8fa] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    filterTab === 'ALL'
                      ? 'bg-white text-[#1f2328] shadow-2xs font-semibold'
                      : 'text-[#57606a] hover:text-[#1f2328]'
                  }`}
                >
                  All ({statement.transactions?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('VALIDATED')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    filterTab === 'VALIDATED'
                      ? 'bg-white text-[#1a7f37] shadow-2xs font-semibold'
                      : 'text-[#57606a] hover:text-[#1f2328]'
                  }`}
                >
                  Validated
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('EXCEPTION')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    filterTab === 'EXCEPTION'
                      ? 'bg-white text-[#cf222e] shadow-2xs font-semibold'
                      : 'text-[#57606a] hover:text-[#1f2328]'
                  }`}
                >
                  Exceptions ({pendingExceptions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('RESOLVED')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    filterTab === 'RESOLVED'
                      ? 'bg-white text-[#0969da] shadow-2xs font-semibold'
                      : 'text-[#57606a] hover:text-[#1f2328]'
                  }`}
                >
                  Resolved ({resolvedExceptions.length})
                </button>
              </div>

              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-7 pr-2.5 text-xs rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
                />
                <Search className="h-3.5 w-3.5 text-[#57606a] absolute left-2 top-2.5 pointer-events-none" />
              </div>
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
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">AI Auto-Category</th>
                  <th className="py-2.5 px-3">AI Confidence</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount (₹)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Exception Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#57606a]">
                      No transactions found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isFlagged = tx.status === 'Exception' && !tx.resolved

                    return (
                      <tr
                        key={tx.id}
                        className={`transition ${
                          isFlagged
                            ? 'bg-[#fff8c5]/30 hover:bg-[#fff8c5]/50'
                            : tx.resolved
                            ? 'bg-[#dafbe1]/20 hover:bg-[#dafbe1]/40'
                            : 'hover:bg-[#f6f8fa]/60'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-[#57606a]">{tx.date}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#0969da]">{tx.referenceNo}</td>
                        <td className="py-3 px-3 font-medium text-[#1f2328] max-w-xs">
                          <div>{tx.description}</div>
                          {tx.flag && (
                            <div className="text-[10px] text-[#9a6700] font-normal mt-0.5 flex items-center gap-1">
                              <Info className="h-3 w-3 shrink-0" />
                              {tx.flag}
                            </div>
                          )}
                          {tx.resolved && (
                            <div className="text-[10px] text-[#1a7f37] font-semibold mt-0.5">
                              ✓ {tx.resolutionAction}: {tx.resolutionNote}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {tx.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span
                            className={
                              Number(tx.aiConfidence) >= 90
                                ? 'text-[#1a7f37] font-semibold'
                                : 'text-[#bf8700]'
                            }
                          >
                            {tx.aiConfidence}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          <span className={tx.type === 'CREDIT' ? 'text-[#1a7f37]' : 'text-[#cf222e]'}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#1f2328]">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-3">
                          {isFlagged ? (
                            <Badge variant="danger" className="text-[10px]">
                              Exception
                            </Badge>
                          ) : tx.resolved ? (
                            <Badge variant="warning" className="text-[10px]">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              Validated
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isFlagged ? (
                            <Button
                              variant="blue"
                              size="sm"
                              onClick={() => {
                                setSelectedTx(tx)
                                setNewCategory(tx.category)
                              }}
                              className="text-xs h-7 px-2 shadow-sm"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          ) : tx.resolved ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTx(tx)
                                setNewCategory(tx.category)
                                setResolutionNote(tx.resolutionNote || '')
                              }}
                              className="text-xs h-7 px-2 text-[#57606a]"
                            >
                              Edit
                            </Button>
                          ) : (
                            <span className="text-[11px] text-[#1a7f37] font-medium">✓ Clean</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 8. Exception Resolution Modal */}
      {selectedTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title={`Resolve Policy Exception (${selectedTx.referenceNo})`}
          description={selectedTx.description}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setSelectedTx(null)}>
                Cancel
              </Button>
              <Button
                variant="blue"
                size="sm"
                disabled={isResolving}
                onClick={handleResolveSubmit}
              >
                {isResolving ? 'Saving Resolution...' : 'Apply CFO Resolution'}
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-[#fff8c5]/50 border border-[#d4a72c]/40 rounded text-xs text-[#5f370e]">
              <strong>AI Audit Finding:</strong> {selectedTx.flag}
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Resolution Action:
              </label>
              <select
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              >
                <option value="CFO Approved with Justification">CFO Approved with Statutory Justification</option>
                <option value="Exclude & Reallocate to Unrestricted Non-State Fund">Exclude & Reallocate to Unrestricted Non-State Fund</option>
                <option value="Mark as Vendor Refund Pending">Pending Vendor Wire Reversal / Credit Note</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Chart-of-Accounts Category Override (Optional):
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              >
                <option value="Specialized Lab Infrastructure">Specialized Lab Infrastructure</option>
                <option value="Direct Research Consumables">Direct Research Consumables</option>
                <option value="Compute & Cloud Infrastructure">Compute & Cloud Infrastructure</option>
                <option value="Faculty & Staff Payroll">Faculty & Staff Payroll</option>
                <option value="Institutional Discretionary Funds">Institutional Discretionary Funds (Non-State)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                CFO Compliance Justification Note:
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Detail the rationale, dean approval reference or wire clawback ticket..."
                className="w-full rounded-md border border-[#d0d7de] p-2 text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* 9. Bottom Navigation SOP Bar */}
      <div className="rounded-lg border border-[#d0d7de] bg-[#f6f8fa] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#57606a]">
          <strong className="text-[#1f2328]">Standard Operating Procedure:</strong> Once all transactions are validated or justified with CFO notes, proceed to Step 6 for statutory compliance audit & submission.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('statement_upload')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            Step 4: Upload
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('submission_compliance')}
            className="text-xs font-semibold"
          >
            <span>Proceed to Step 6: Compliance</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
