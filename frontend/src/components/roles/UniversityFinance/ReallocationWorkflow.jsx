import React, { useState } from 'react'
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  FileText,
  AlertTriangle,
  Send,
  Building,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function ReallocationWorkflow({ onTriggerToast, isOpenModal, onCloseModal, initialData }) {
  const {
    currentUser,
    reallocations,
    createReallocation,
    approveReallocation,
    rejectReallocation,
    departments,
  } = useFinancialData()

  const [isModalOpen, setIsModalOpen] = useState(false)

  // Dynamic Form states
  const [fromAccount, setFromAccount] = useState('Campus Central Contingency (Acct #900-01)')
  const [toAccount, setToAccount] = useState(
    departments[1] ? `${departments[1].name} (Acct #220-44)` : 'Bio-Engineering'
  )
  const [amount, setAmount] = useState('1200000')
  const [justification, setJustification] = useState(
    'Emergency allocation to offset specialized lab maintenance and prevent research shutdown.'
  )

  const handleApprove = (reqId) => {
    approveReallocation(reqId)
    onTriggerToast(
      'Reallocation Approved & Posted to GL',
      `Request ${reqId} has been executed. Ledger balances and departmental burn rates updated.`
    )
  }

  const handleReject = (reqId) => {
    rejectReallocation(reqId)
    onTriggerToast('Reallocation Rejected', `Request ${reqId} has been declined.`)
  }

  const handleSubmitNew = (e) => {
    e.preventDefault()
    const newReq = createReallocation({
      fromAccount,
      toAccount,
      amount: Number(amount) || 500000,
      justification,
      requestedBy: `${currentUser?.name || 'Dr. Ramesh Babu, KAS'} (Finance Officer)`,
    })

    setIsModalOpen(false)
    if (onCloseModal) onCloseModal()
    onTriggerToast(
      'Fund Transfer Submitted',
      `Reallocation ${newReq.id} for ${formatCurrency(newReq.amount)} dispatched for governance review.`
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328]">
            Inter-Account Fund Reallocations & Approvals Ledger
          </h2>
          <p className="text-xs text-[#656d76]">
            Formal budget transfer requisitions between departmental chart-of-accounts and research project grants
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5" />
          Create Reallocation Request
        </Button>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reallocation Queue ({reallocations.length} Requests)</CardTitle>
          <CardDescription>
            Audit log of intra-institutional fund adjustments requiring CFO / Provost authorization
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">Request ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Source Account (Debit)</th>
                <th className="py-2.5 px-3">Destination Account (Credit)</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Requested By</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {reallocations.map((req) => {
                const isPending = req.status.includes('Pending') || req.status === 'Under Review'
                const isApproved = req.status === 'Approved'
                const isRejected = req.status === 'Rejected'

                return (
                  <tr key={req.id} className="hover:bg-[#f6f8fa]/80">
                    <td className="py-3 px-4 font-mono font-semibold text-[#0969da]">{req.id}</td>
                    <td className="py-3 px-3 text-[#57606a] font-mono">{req.date}</td>
                    <td className="py-3 px-3 max-w-[200px] truncate text-[#1f2328]">
                      {req.fromAccount}
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate font-medium text-[#1f2328]">
                      {req.toAccount}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1f2328]">
                      {formatCurrency(req.amount)}
                    </td>
                    <td className="py-3 px-3 text-[#57606a]">{req.requestedBy}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          isApproved ? 'success' : isRejected ? 'danger' : 'warning'
                        }
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(req.id)}
                            className="h-6 px-2 text-[11px]"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(req.id)}
                            className="h-6 px-2 text-[11px]"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#57606a]">
                          By {req.approver}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Justification details */}
      <Card className="bg-[#f6f8fa]/60">
        <CardContent className="p-4 space-y-2">
          <div className="font-semibold text-xs text-[#1f2328] flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#57606a]" />
            Regulatory Requirement: Board of Regents Reallocation Rule §14
          </div>
          <p className="text-xs text-[#57606a] leading-relaxed">
            Approving a transfer automatically executes real-time journal entries, updates the live operating allocation of the target department, recalculates burn-rate indicators, and appends a cryptographically hashed commit record to the platform audit trail.
          </p>
        </CardContent>
      </Card>

      {/* New Reallocation Modal */}
      {(isModalOpen || isOpenModal) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsModalOpen(false)
            if (onCloseModal) onCloseModal()
          }}
          title="Initiate Inter-Account Fund Transfer"
          description="Submit a formal journal transfer between institutional budget centers"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false)
                  if (onCloseModal) onCloseModal()
                }}
              >
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSubmitNew}>
                <Send className="h-3.5 w-3.5" />
                Submit Transfer Requisition
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmitNew} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Source Account (Funds Deducted From)
              </label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              >
                <option value="Campus Central Contingency (Acct #900-01)">
                  Campus Central Contingency (Acct #900-01) - Balance: ₹18.4 Cr
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={`${d.name} (Acct #${d.id})`}>
                    {d.name} - Available: {formatCurrency(Math.max(0, d.remaining), true)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Destination Account (Funds Credited To)
              </label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={`${d.name} (Acct #${d.id})`}>
                    {d.name} ({d.remaining < 0 ? `Deficit: -${formatCurrency(Math.abs(d.remaining), true)}` : 'Operational'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Transfer Amount (₹ INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1200000"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Justification & Audit Rationale
              </label>
              <textarea
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="State the institutional necessity, source of funds, and compliance impact..."
                className="w-full rounded-md border border-[#d0d7de] bg-white p-2 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
