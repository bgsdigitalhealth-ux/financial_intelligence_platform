import React, { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Send,
  Building,
  ShieldCheck,
  Download,
  PlusCircle,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function StateGrantTracker({ onTriggerToast }) {
  const {
    disbursementPipeline,
    universities,
    authorizeDisbursement,
    addDisbursementTranche,
  } = useFinancialData()

  const [selectedTranche, setSelectedTranche] = useState(null)
  const [isAuthorizeModalOpen, setIsAuthorizeModalOpen] = useState(false)
  const [authorizerNote, setAuthorizerNote] = useState('')

  // New Tranche modal
  const [isNewTrancheModalOpen, setIsNewTrancheModalOpen] = useState(false)
  const [newTrancheName, setNewTrancheName] = useState('')
  const [newTrancheAmount, setNewTrancheAmount] = useState('500000000')

  const handleAuthorizeRelease = () => {
    if (!selectedTranche) return
    authorizeDisbursement(selectedTranche.id, authorizerNote)
    setIsAuthorizeModalOpen(false)
    onTriggerToast(
      'Disbursement Tranche Authorized',
      `Released ${formatCurrency(selectedTranche.amount, true)} to campus accounts. Real ledger balances updated.`
    )
    setSelectedTranche(null)
  }

  const handleCreateTranche = (e) => {
    e.preventDefault()
    if (!newTrancheName) return
    addDisbursementTranche({
      tranche: newTrancheName,
      amount: newTrancheAmount,
    })
    setIsNewTrancheModalOpen(false)
    setNewTrancheName('')
    onTriggerToast('Tranche Scheduled', `Added ${newTrancheName} to statutory pipeline.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328]">
            State Grant Disbursement Pipeline & Treasury Schedule
          </h2>
          <p className="text-xs text-[#656d76]">
            Four-stage statutory drawdown schedule from State General Fund into University Research Escrow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsNewTrancheModalOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Schedule New Tranche
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTriggerToast('Exporting Pipeline Schedule', 'Live schedule exported to CSV.')}
          >
            <Download className="h-3.5 w-3.5" />
            Export Schedule
          </Button>
        </div>
      </div>

      {/* Tranches Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {disbursementPipeline.map((item) => {
          const isDone = item.status === 'completed'
          const isInProgress = item.status === 'in_progress'
          const isPending = item.status === 'pending'

          return (
            <Card
              key={item.id}
              className={`relative overflow-hidden transition-all ${
                isInProgress ? 'border-[#0969da] ring-1 ring-[#0969da]/30' : ''
              }`}
            >
              <div
                className={`h-1.5 w-full ${
                  isDone ? 'bg-[#1a7f37]' : isInProgress ? 'bg-[#0969da]' : 'bg-[#d0d7de]'
                }`}
              />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#57606a]">{item.id}</span>
                  <Badge
                    variant={isDone ? 'success' : isInProgress ? 'primary' : 'outline'}
                    className="text-[10px]"
                  >
                    {isDone && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {isInProgress && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                    {isPending && <Clock className="h-3 w-3 mr-1" />}
                    {item.stage}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-xs text-[#1f2328]">{item.tranche}</h4>
                  <div className="text-xl font-bold text-[#1f2328] mt-1">
                    {formatCurrency(item.amount, true)}
                  </div>
                  <div className="text-[11px] text-[#656d76] mt-0.5">Scheduled: {item.date}</div>
                </div>

                <div className="pt-2 border-t border-[#d0d7de]/60 flex items-center justify-between">
                  <span className="text-[10px] text-[#57606a]">
                    {isDone ? 'Audited & Reconciled' : isInProgress ? 'Transferring 88%' : 'Action Required'}
                  </span>
                  {isPending && (
                    <Button
                      variant="blue"
                      size="sm"
                      onClick={() => {
                        setSelectedTranche(item)
                        setIsAuthorizeModalOpen(true)
                      }}
                    >
                      Authorize
                    </Button>
                  )}
                  {isInProgress && (
                    <span className="text-[11px] font-medium text-[#0969da] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0969da] animate-ping" />
                      Live Escrow
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[11px] font-medium text-[#1a7f37] flex items-center gap-1">
                      <FileCheck className="h-3 w-3" />
                      Signed Off
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Campus Drawdown Allocation Detail - Dynamic */}
      <Card>
        <CardHeader>
          <CardTitle>Campus Milestone Clearing Status ({universities.length} Institutions)</CardTitle>
          <CardDescription>
            Institutional eligibility for statutory quarterly drawdowns calculated from live compliance scores
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">Campus</th>
                <th className="py-2.5 px-3">State Allocation</th>
                <th className="py-2.5 px-3">Total Disbursed</th>
                <th className="py-2.5 px-3">Milestone Progress</th>
                <th className="py-2.5 px-3">Comptroller Audit</th>
                <th className="py-2.5 px-4 text-right">Hold / Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {universities.map((u) => {
                const isCleared = u.complianceScore >= 80

                return (
                  <tr key={u.id} className="hover:bg-[#f6f8fa]/80">
                    <td className="py-3 px-4 font-semibold text-[#1f2328]">{u.name}</td>
                    <td className="py-3 px-3 text-[#57606a]">
                      {formatCurrency(u.allocation, true)}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#0969da]">
                      {formatCurrency(u.spent, true)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isCleared ? 'bg-[#1a7f37]' : 'bg-[#bf8700]'}`}
                            style={{ width: `${Math.min(u.utilization, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono">{u.utilization}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={isCleared ? 'success' : 'warning'}>
                        {isCleared ? 'Cleared for Drawdown' : 'Hold: Audit Required'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isCleared ? (
                        <span className="text-[#1a7f37] font-medium text-xs flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Certified
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            onTriggerToast(
                              `Notice Dispatched to ${u.name}`,
                              '30-Day corrective compliance notification sent.'
                            )
                          }
                        >
                          Request Audit
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Authorize Release Modal */}
      {selectedTranche && (
        <Modal
          isOpen={isAuthorizeModalOpen}
          onClose={() => setIsAuthorizeModalOpen(false)}
          title={`Authorize Legislative Release: ${selectedTranche.tranche}`}
          description={`Tranche ID: ${selectedTranche.id} • Total Sum: ${formatCurrency(selectedTranche.amount, true)}`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsAuthorizeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleAuthorizeRelease}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Affix Electronic Signature & Release
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#f6f8fa] rounded-md border border-[#d0d7de] text-[#1f2328] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#656d76]">Statutory Authority:</span>
                <span className="font-semibold">State Higher Ed Innovation Act §42-B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656d76]">Escrow Custodian Bank:</span>
                <span className="font-semibold">State Depository Trust Co.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656d76]">Beneficiary Institutions:</span>
                <span className="font-semibold">{universities.filter((u) => u.complianceScore >= 80).length} Cleared Campuses</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Executive Authorization Note / Legislative Memo
              </label>
              <textarea
                rows={3}
                value={authorizerNote}
                onChange={(e) => setAuthorizerNote(e.target.value)}
                placeholder="E.g., Authorized in compliance with statutory milestone audit checks..."
                className="w-full rounded-md border border-[#d0d7de] p-2 text-xs focus:border-[#0969da] focus:outline-none"
              />
            </div>

            <div className="rounded-md border border-[#4ac26b]/40 bg-[#dafbe1]/40 p-2.5 text-[11px] text-[#114b24] flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1a7f37] mt-0.5" />
              <span>
                Affixing signature executes dynamic live transfer and registers an immutable SHA-256 commit in the consortium audit trail.
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Tranche Modal */}
      {isNewTrancheModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewTrancheModalOpen(false)}
          title="Schedule New Appropriation Tranche"
          description="Enrolls a new milestone release tranche into the Treasury schedule"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsNewTrancheModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleCreateTranche}>
                Schedule Tranche
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateTranche} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Tranche Name</label>
              <input
                type="text"
                required
                value={newTrancheName}
                onChange={(e) => setNewTrancheName(e.target.value)}
                placeholder="E.g., Q1 FY27 High-Tech Innovation Tranche"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Release Sum (₹ INR)</label>
              <input
                type="number"
                value={newTrancheAmount}
                onChange={(e) => setNewTrancheAmount(e.target.value)}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
