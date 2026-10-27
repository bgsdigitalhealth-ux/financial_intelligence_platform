import React, { useState } from 'react'
import {
  Award,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Download,
  PlusCircle,
  FileText,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function ResearchGrantTracker({ onTriggerToast, onOpenReallocateModal }) {
  const { researchGrants, addResearchGrant } = useFinancialData()
  const [search, setSearch] = useState('')

  // New Grant modal
  const [isAddGrantModalOpen, setIsAddGrantModalOpen] = useState(false)
  const [grantId, setGrantId] = useState('')
  const [grantTitle, setGrantTitle] = useState('')
  const [grantFunder, setGrantFunder] = useState('National Science Foundation (NSF)')
  const [grantPI, setGrantPI] = useState('')
  const [grantAward, setGrantAward] = useState('5000000')
  const [grantOverhead, setGrantOverhead] = useState('54.5%')

  const filteredGrants = researchGrants.filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.funder.toLowerCase().includes(search.toLowerCase()) ||
      g.id.toLowerCase().includes(search.toLowerCase()) ||
      g.pi.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateGrant = (e) => {
    e.preventDefault()
    if (!grantTitle || !grantPI) return

    const created = addResearchGrant({
      id: grantId || `GRANT-${Date.now().toString().slice(-4)}`,
      title: grantTitle,
      funder: grantFunder,
      pi: grantPI,
      awardedAmount: grantAward,
      spentToDate: 0,
      indirectOverheadRate: grantOverhead,
    })

    setIsAddGrantModalOpen(false)
    setGrantTitle('')
    setGrantPI('')
    onTriggerToast(
      'Sponsored Project Enrolled',
      `Registered ${created.title} (${formatCurrency(created.awardedAmount, true)}).`
    )
  }

  // Find any grants expiring soon
  const expiringGrants = researchGrants.filter((g) => g.riskFlag)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328]">
            Sponsored Research Grants & Federal Compliance Ledger
          </h2>
          <p className="text-xs text-[#656d76]">
            Active portfolio of {researchGrants.length} extramural grants (NIH, NSF, DOE, DARPA, State Research Consortium)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsAddGrantModalOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Enroll Sponsored Grant
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTriggerToast('Exporting Grant Schedule', 'Federal Uniform Guidance 2 CFR 200 format CSV.')}
          >
            <Download className="h-3.5 w-3.5" />
            Export Schedule
          </Button>
        </div>
      </div>

      {/* Dynamic Expiration Risk Banner */}
      {expiringGrants.length > 0 && (
        <div className="rounded-md border border-[#d4a72c]/50 bg-[#fff8c5]/40 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#5f370e]">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-[#9a6700] shrink-0" />
            <span>
              <strong>Action Required:</strong> {expiringGrants.map((g) => `${g.id} (${g.title})`).join('; ')} has uncommitted funds approaching statutory close-out.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white shrink-0"
            onClick={() => onOpenReallocateModal()}
          >
            Allocate Credits
          </Button>
        </div>
      )}

      {/* Grants Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Principal Investigator & Sponsored Project Portfolio ({researchGrants.length} Active)</CardTitle>
            <CardDescription>
              Burn rates, overhead indirect cost recovery (F&A), and period of performance dates
            </CardDescription>
          </div>
          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#57606a]" />
            <input
              type="text"
              placeholder="Search grant ID, funder, or PI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-[#d0d7de] bg-white pl-8 pr-3 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">Grant Title & Code</th>
                <th className="py-2.5 px-3">Sponsor Agency</th>
                <th className="py-2.5 px-3">Principal Investigator</th>
                <th className="py-2.5 px-3">Award Total</th>
                <th className="py-2.5 px-3">Spent (YTD)</th>
                <th className="py-2.5 px-3">Burn %</th>
                <th className="py-2.5 px-3">F&A Overhead</th>
                <th className="py-2.5 px-3">Period End</th>
                <th className="py-2.5 px-4 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {filteredGrants.map((grant) => {
                const burn = grant.awardedAmount > 0 ? Math.round((grant.spentToDate / grant.awardedAmount) * 100) : 0
                return (
                  <tr key={grant.id} className="hover:bg-[#f6f8fa]/80">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1f2328]">{grant.title}</div>
                      <div className="text-[10px] font-mono text-[#0969da]">{grant.id}</div>
                    </td>
                    <td className="py-3 px-3 text-[#57606a]">{grant.funder}</td>
                    <td className="py-3 px-3">{grant.pi}</td>
                    <td className="py-3 px-3 font-semibold">
                      {formatCurrency(grant.awardedAmount, true)}
                    </td>
                    <td className="py-3 px-3 text-[#57606a]">
                      {formatCurrency(grant.spentToDate, true)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 h-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              burn > 90
                                ? 'bg-[#bf8700]'
                                : 'bg-[#1a7f37]'
                            }`}
                            style={{ width: `${Math.min(burn, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px]">{burn}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#57606a]">{grant.indirectOverheadRate}</td>
                    <td className="py-3 px-3 font-mono text-xs">{grant.endDate}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={grant.riskFlag ? 'warning' : 'success'}>
                        {grant.riskFlag ? 'Expiring Soon' : 'Verified'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Grant Modal */}
      {isAddGrantModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddGrantModalOpen(false)}
          title="Enroll Sponsored Research Grant"
          description="Registers a new federal or foundation research award into the compliance ledger"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsAddGrantModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleCreateGrant}>
                Save Grant
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateGrant} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Project Title</label>
              <input
                type="text"
                required
                value={grantTitle}
                onChange={(e) => setGrantTitle(e.target.value)}
                placeholder="E.g., Quantum Communication Networks in Superconducting Qubits"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Grant Award Number / Code</label>
                <input
                  type="text"
                  value={grantId}
                  onChange={(e) => setGrantId(e.target.value)}
                  placeholder="NSF-PHY-26019"
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs font-mono text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Funding Agency</label>
                <input
                  type="text"
                  value={grantFunder}
                  onChange={(e) => setGrantFunder(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Principal Investigator</label>
                <input
                  type="text"
                  required
                  value={grantPI}
                  onChange={(e) => setGrantPI(e.target.value)}
                  placeholder="Dr. Samuel Ortiz"
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Total Award (₹)</label>
                <input
                  type="number"
                  value={grantAward}
                  onChange={(e) => setGrantAward(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">F&A Overhead Rate</label>
                <input
                  type="text"
                  value={grantOverhead}
                  onChange={(e) => setGrantOverhead(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs font-mono text-[#1f2328] focus:border-[#0969da]"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
