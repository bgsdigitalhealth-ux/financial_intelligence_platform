import React, { useState } from 'react'
import {
  Building,
  Network,
  RefreshCw,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Database,
  PlusCircle,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function InstitutionDirectory({ onTriggerToast }) {
  const { universities, addUniversity } = useFinancialData()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [instName, setInstName] = useState('')
  const [instCode, setInstCode] = useState('')
  const [erpType, setErpType] = useState('Workday Financial Management v2026')

  const handlePing = (inst) => {
    onTriggerToast(
      `Gateway Handshake: ${inst.name}`,
      `Connected to ERP gateway. Latency: 22ms. Mutual TLS verified.`
    )
  }

  const handleCreateInst = (e) => {
    e.preventDefault()
    if (!instName || !instCode) return
    addUniversity({
      name: instName,
      code: instCode,
      allocation: 0,
      spent: 0,
      complianceScore: 90,
      patents: 0,
    })
    setIsAddModalOpen(false)
    setInstName('')
    setInstCode('')
    onTriggerToast('Campus Gateway Enrolled', `Connected ${instName} (${erpType}).`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328]">
            Connected Higher Education Institutions & ERP Gateways
          </h2>
          <p className="text-xs text-[#656d76]">
            Statewide institutional tenant routing, REST webhook status, and automated journal reconciliation ({universities.length} Campuses)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Connect New Campus
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTriggerToast('Running Network Diagnostic', 'All campus nodes tested.')}
          >
            <RefreshCw className="h-3 w-3" />
            Poll All Gateways
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {universities.map((u) => {
          const isOptimal = u.complianceScore >= 85
          const isWarning = u.complianceScore < 85

          return (
            <Card key={u.id} className="flex flex-col justify-between">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-[#1f2328]">{u.name}</h3>
                    <p className="text-[11px] text-[#0969da] font-mono mt-0.5">
                      CODE: {u.code} • Workday / Banner Gateway
                    </p>
                  </div>
                  <Badge variant={isOptimal ? 'success' : isWarning ? 'danger' : 'warning'}>
                    {isOptimal ? 'Live & Synced' : 'Audit Notice'}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#d0d7de]/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#656d76]">State Allocation:</span>
                    <span className="font-semibold text-[#1f2328]">{formatCurrency(u.allocation, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656d76]">Drawdown (YTD):</span>
                    <span className="font-mono text-[#57606a]">{formatCurrency(u.spent, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656d76]">Compliance Score:</span>
                    <span className="font-mono text-[#0969da]">{u.complianceScore} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656d76]">Last Audit:</span>
                    <span className="text-[#57606a] font-mono">{u.lastAudit}</span>
                  </div>
                </div>
              </CardContent>

              <div className="p-3 bg-[#f6f8fa]/60 border-t border-[#d0d7de]/50 flex items-center justify-between rounded-b-md">
                <span className="text-[10px] text-[#57606a] flex items-center gap-1">
                  <Shield className="h-3 w-3 text-[#1a7f37]" />
                  TLS 1.3 / FIPS 140-3
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePing(u)}
                  className="text-[#0969da] text-xs h-6 px-1.5"
                >
                  Ping Gateway
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Connect Campus Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Connect University Campus ERP Gateway"
          description="Provision a tenant webhook endpoint to ingest university general ledgers"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleCreateInst}>
                Enroll Gateway
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateInst} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Campus Name</label>
              <input
                type="text"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="E.g., Pacific Coast Maritime Institute"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Campus Identifier Code</label>
              <input
                type="text"
                required
                value={instCode}
                onChange={(e) => setInstCode(e.target.value)}
                placeholder="PCMI"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs font-mono text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">ERP Connector Type</label>
              <select
                value={erpType}
                onChange={(e) => setErpType(e.target.value)}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              >
                <option value="Workday Financial Management v2026">Workday Financial Management</option>
                <option value="Ellucian Banner Finance 9.3">Ellucian Banner Finance</option>
                <option value="Oracle Cloud ERP">Oracle Cloud ERP</option>
                <option value="SAP S/4HANA Public Sector">SAP S/4HANA Public Sector</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
