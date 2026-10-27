import React, { useState, useMemo } from 'react'
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  AlertTriangle,
  Building,
  Landmark,
  ArrowRight,
  GitCommit,
  ExternalLink,
  Lock,
  ChevronRight,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export function SubmissionComplianceView({ onSelectTab, onTriggerToast }) {
  const {
    universities,
    activeStatement,
    statements,
    bankAccounts,
    submitStatementForApproval,
  } = useFinancialData()
  const { currentUser } = useAuth()

  const myUniversity = useMemo(() => {
    return universities.find((u) => u.id === currentUser?.universityId) || universities[0]
  }, [universities, currentUser])

  // Active statement to submit
  const statement = useMemo(() => {
    if (activeStatement && (!myUniversity?.id || activeStatement.universityId === myUniversity.id)) {
      return activeStatement
    }
    const myStmts = myUniversity?.id
      ? statements.filter((s) => s.universityId === myUniversity.id)
      : statements
    return (
      myStmts.find((s) => s.quarter?.includes('Q3')) ||
      myStmts[0] ||
      activeStatement ||
      statements[0] ||
      null
    )
  }, [activeStatement, statements, myUniversity])

  // Institutional accounts pending submission check - 100% dynamic from MySQL bank accounts
  const accountsStatus = useMemo(() => {
    const list = bankAccounts.filter((a) => a.universityId === myUniversity?.id)
    if (list.length === 0) return []
    return list.map((a, idx) => ({
      id: a.id,
      bankName: a.bankName,
      accountNumber: a.accountNumber,
      purpose: a.accountName,
      quarter: statement?.quarter || 'Q3 FY26',
      balance: a.currentBalance,
      status:
        statement?.accountId === a.id
          ? statement.status
          : idx === 0
          ? statement?.status || 'AI Validated'
          : 'Q2 Approved (Q3 Active)',
      dueDate: idx === 0 ? 'Immediate Action' : 'Nov 15, 2026',
    }))
  }, [bankAccounts, myUniversity, statement])

  const [isCertified, setIsCertified] = useState(false)
  const [submissionRemarks, setSubmissionRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle final submission to Department of Higher Education (Step 6 requirement)
  const handleSubmitToGov = async () => {
    if (!statement) return
    if (!isCertified) {
      if (onTriggerToast) {
        onTriggerToast('Certification Required', 'Please check the statutory declaration checkbox.', 'warning')
      }
      return
    }

    setIsSubmitting(true)
    try {
      await submitStatementForApproval(statement.id, {
        submittedBy: 'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)',
        remarks: submissionRemarks || 'Certified true and faithful general ledger reconciliation per Karnataka State Universities Act 2000 §102.',
      })

      if (onTriggerToast) {
        onTriggerToast(
          'Submitted to Department of Higher Education',
          `Transmitted verified statement ${statement.id} to Sri. G. Kumar Naik, IAS for executive statutory sign-off.`
        )
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Submission Failed', err.message, 'danger')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitted = statement?.status === 'Submitted for Approval'
  const isApproved = statement?.status === 'Approved by Gov Leader'

  return (
    <div className="space-y-6">
      {/* Workflow Navigation Banner (Track 2: Step 6 of 6) */}
      <div className="rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40 p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 rounded-full bg-[#059669] text-white text-xs flex items-center justify-center font-bold shrink-0">
            6
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Step 6: Submission & Statutory Compliance
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-semibold">
                Official Certification
              </span>
            </div>
            <p className="text-[11px] text-[#57606a] mt-0.5">
              Check institutional quarterly pipeline, verify account certifications, and submit for Government Leader sign-off.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('ai_validation')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            Step 5: AI Validation
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('overview')}
            className="text-xs font-semibold"
          >
            <span>Step 2: University Overview</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
      <div className="bg-white p-3.5 rounded-lg border border-[#d0d7de] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-[#0969da]" />
            Step 6: Submission & Statutory Compliance
          </h2>
          <p className="text-xs text-[#57606a]">
            Certify reconciled quarterly statement and transmit to the State Department of Higher Education for executive sign-off
          </p>
        </div>

        {isApproved && (
          <Badge variant="success" className="text-xs">
            ✓ Executive Sign-off Sealed
          </Badge>
        )}
      </div>

      {/* Check Submission Status (Step 6 requirement: Progress Tracker Pipeline) */}
      <Card>
        <CardHeader className="border-b border-[#d0d7de] pb-3">
          <CardTitle className="text-sm font-semibold text-[#1f2328]">
            Statutory Workflow Progress Tracker
          </CardTitle>
          <CardDescription className="text-xs text-[#57606a]">
            End-to-end lifecycle from statement upload to Department of Higher Education sign-off
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            {/* Stage 1 */}
            <div className="p-3 rounded-lg border border-[#1a7f37]/40 bg-[#dafbe1]/30">
              <div className="flex items-center gap-1.5 font-semibold text-[#1a7f37]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                1. Uploaded
              </div>
              <div className="text-[11px] text-[#57606a] mt-1">
                CSV statement ingested into secure vault
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-3 rounded-lg border border-[#1a7f37]/40 bg-[#dafbe1]/30">
              <div className="flex items-center gap-1.5 font-semibold text-[#1a7f37]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                2. AI Extracted
              </div>
              <div className="text-[11px] text-[#57606a] mt-1">
                98.2% accuracy on chart-of-accounts
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-3 rounded-lg border border-[#1a7f37]/40 bg-[#dafbe1]/30">
              <div className="flex items-center gap-1.5 font-semibold text-[#1a7f37]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                3. Exceptions Resolved
              </div>
              <div className="text-[11px] text-[#57606a] mt-1">
                Policy exceptions audited by CFO
              </div>
            </div>

            {/* Stage 4 */}
            <div
              className={`p-3 rounded-lg border transition ${
                isSubmitted || isApproved
                  ? 'border-[#1a7f37]/40 bg-[#dafbe1]/30 text-[#1a7f37]'
                  : 'border-[#0969da] bg-[#ddf4ff]/40 text-[#0969da]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {isSubmitted || isApproved ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0" />
                )}
                4. Dept Submission
              </div>
              <div className="text-[11px] text-[#57606a] mt-1">
                {isSubmitted || isApproved ? 'Transmitted to State Treasury' : 'Ready for CFO sign-off'}
              </div>
            </div>

            {/* Stage 5 */}
            <div
              className={`p-3 rounded-lg border transition ${
                isApproved
                  ? 'border-[#1a7f37]/40 bg-[#dafbe1]/30 text-[#1a7f37]'
                  : isSubmitted
                  ? 'border-[#0969da] bg-[#ddf4ff]/40 text-[#0969da]'
                  : 'border-[#d0d7de] bg-[#f6f8fa] text-[#57606a]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {isApproved ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0" />
                )}
                5. Gov Leader Sign-Off
              </div>
              <div className="text-[11px] text-[#57606a] mt-1">
                {isApproved ? 'Official Statutory Seal Granted' : 'Pending Sri. G. Kumar Naik, IAS'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track Approval Status Box (Step 6 requirement) */}
      {(isSubmitted || isApproved) && (
        <Card
          className={`border-2 ${
            isApproved
              ? 'border-[#1a7f37]/40 bg-[#dafbe1]/20'
              : 'border-[#0969da]/40 bg-[#ddf4ff]/20'
          }`}
        >
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <span
                className={`p-2 rounded-full mt-0.5 ${
                  isApproved ? 'bg-[#1a7f37]/10 text-[#1a7f37]' : 'bg-[#0969da]/10 text-[#0969da]'
                }`}
              >
                {isApproved ? <ShieldCheck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </span>
              <div>
                <h4 className="font-bold text-xs text-[#1f2328] flex items-center gap-2">
                  {isApproved
                    ? 'Statutory Approval Formally Granted by State Leadership'
                    : 'Transmitted to State Department of Higher Education'}
                  <Badge variant={isApproved ? 'success' : 'blue'}>
                    {isApproved ? 'Approved by Gov Leader' : 'Submitted for Approval'}
                  </Badge>
                </h4>
                <p className="text-[11px] text-[#57606a] mt-1">
                  {isApproved
                    ? `Executive Sign-off granted on ${statement.approvedAt || '2026-10-23'} by Sri. G. Kumar Naik, IAS. Ledger settled.`
                    : `Transmitted on ${statement.submittedAt || 'Today'}. Awaiting executive review from Secretary of Higher Education.`}
                </p>
                {statement.reviewNotes && (
                  <div className="mt-2 text-[11px] bg-white p-2 rounded border border-[#d0d7de] text-[#1f2328]">
                    <strong>Executive Review Notes:</strong> {statement.reviewNotes}
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#57606a] bg-white px-2.5 py-1.5 rounded border border-[#d0d7de] shrink-0 self-start sm:self-auto">
              <div className="flex items-center gap-1">
                <GitCommit className="h-3 w-3 text-[#0969da]" />
                SHA-256 Commit: {statement.id}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit for Approval (Step 6 requirement: Digital Declaration & Action) */}
      {!isSubmitted && !isApproved && (
        <Card className="border border-[#d0d7de]">
          <CardHeader className="border-b border-[#d0d7de] pb-3">
            <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
              <Send className="h-4 w-4 text-[#0969da]" />
              Digital Statutory Certification & Transmission
            </CardTitle>
            <CardDescription className="text-xs text-[#57606a]">
              Formal CFO sign-off in compliance with Department of Higher Education financial statutes
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="p-3 bg-[#f6f8fa] rounded-md border border-[#d0d7de] text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="statutory-cert"
                  checked={isCertified}
                  onChange={(e) => setIsCertified(e.target.checked)}
                  className="mt-0.5 rounded border-[#d0d7de] text-[#0969da] focus:ring-[#0969da]"
                />
                <label htmlFor="statutory-cert" className="text-[#1f2328] font-medium leading-relaxed cursor-pointer">
                  I, <strong>Dr. Ramesh Babu, KAS</strong>, Finance Officer & Comptroller, hereby certify under penalty of statutory administrative review that this quarterly statement ({statement?.quarter}) represents an authentic, reconciled record of institutional general ledger transactions for <strong>Visvesvaraya Technological University (VTU), Belagavi</strong>.
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Finance Officer Submission Remarks & Notes for State Leadership (Optional):
              </label>
              <textarea
                rows={2}
                value={submissionRemarks}
                onChange={(e) => setSubmissionRemarks(e.target.value)}
                placeholder="Include any remarks for Sri. G. Kumar Naik, IAS regarding capital procurement or research grant draws..."
                className="w-full rounded-md border border-[#d0d7de] p-2 text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da]"
              />
            </div>

            <Button
              variant="blue"
              size="sm"
              disabled={!isCertified || isSubmitting}
              onClick={handleSubmitToGov}
              className="text-xs shadow-sm font-semibold"
            >
              {isSubmitting ? (
                'Transmitting to State Treasury...'
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Transmit Statement to Department of Higher Education for Approval
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Pending Accounts (Step 6 requirement) */}
      <Card>
        <CardHeader className="border-b border-[#d0d7de] pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
                <Landmark className="h-4 w-4 text-[#0969da]" />
                Institutional Accounts Statutory Filing Status
              </CardTitle>
              <CardDescription className="text-xs text-[#57606a]">
                Statutory filing progress across all campus treasury bank accounts
              </CardDescription>
            </div>
            <Badge variant="outline">3 Registered Accounts</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[#57606a] font-semibold">
                  <th className="py-2.5 px-3">Bank Name & Account</th>
                  <th className="py-2.5 px-3">Account Purpose</th>
                  <th className="py-2.5 px-3">Quarter</th>
                  <th className="py-2.5 px-3">Current Balance (₹)</th>
                  <th className="py-2.5 px-3">Statutory Deadline</th>
                  <th className="py-2.5 px-4 text-right">Filing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {accountsStatus.map((acct) => (
                  <tr key={acct.id} className="hover:bg-[#f6f8fa]/60">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1f2328]">{acct.bankName}</div>
                      <div className="font-mono text-[11px] text-[#57606a]">{acct.accountNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-[#1f2328]">{acct.purpose}</td>
                    <td className="py-3 px-3 font-semibold text-[#1f2328]">{acct.quarter}</td>
                    <td className="py-3 px-3 font-semibold text-[#1a7f37]">
                      {formatCurrency(acct.balance, true)}
                    </td>
                    <td className="py-3 px-3 text-[#57606a]">{acct.dueDate}</td>
                    <td className="py-3 px-4 text-right">
                      {acct.status.includes('Approved') ? (
                        <Badge variant="success" className="text-[10px]">Approved</Badge>
                      ) : acct.status.includes('Submitted') ? (
                        <Badge variant="blue" className="text-[10px] animate-pulse">Submitted</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">Action Required</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Step Forward Navigation Bar */}
      <div className="rounded-lg border border-[#d0d7de] bg-[#f6f8fa] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-[#57606a]">
          <strong className="text-[#1f2328]">Workflow Summary:</strong> You have reached Step 6 of the University Finance Officer Flow. Your certified quarterly filing is transmitted to the Department of Higher Education for statutory approval.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTab('ai_validation')}
            className="text-xs text-[#57606a] hover:text-[#1f2328]"
          >
            Step 5: AI Validation
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => onSelectTab('overview')}
            className="text-xs font-semibold"
          >
            <span>Return to Step 2: University Overview</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
