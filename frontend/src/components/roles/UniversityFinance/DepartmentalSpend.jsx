import React, { useState } from 'react'
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Download,
  Building,
  Trash2,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function DepartmentalSpend({ onSelectTab, onOpenReallocateModal, onTriggerToast }) {
  const { departments, addDepartment, deleteDepartment } = useFinancialData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // New Department Modal
  const [isNewDeptModalOpen, setIsNewDeptModalOpen] = useState(false)
  const [deptName, setDeptName] = useState('')
  const [deptHead, setDeptHead] = useState('')
  const [deptAlloc, setDeptAlloc] = useState('45000000')
  const [deptSpent, setDeptSpent] = useState('32000000')
  const [deptEnc, setDeptEnc] = useState('4000000')

  const filtered = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.head.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (statusFilter === 'all') return true
    if (statusFilter === 'overspend') return d.remaining < 0
    if (statusFilter === 'surplus') return d.status === 'Surplus'
    return true
  })

  const handleCreateDept = (e) => {
    e.preventDefault()
    if (!deptName || !deptHead) return
    const created = addDepartment({
      name: deptName,
      head: deptHead,
      allocated: deptAlloc,
      spent: deptSpent,
      encumbered: deptEnc,
    })
    setIsNewDeptModalOpen(false)
    setDeptName('')
    setDeptHead('')
    onTriggerToast(
      'Department Ledger Enrolled',
      `Created ${created.name} with ${formatCurrency(created.allocated, true)} budget.`
    )
  }

  const handleDelete = (id, name) => {
    deleteDepartment(id)
    onTriggerToast('Department Archived', `Archived ledger for ${name}.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328]">
            Departmental & Academic Division Ledger Breakdown
          </h2>
          <p className="text-xs text-[#656d76]">
            Operating expenditure, encumbrances, and burn rate trajectories across university faculties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsNewDeptModalOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Division / Dept
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTriggerToast('Exporting Department Ledger', 'Live CSV generated.')}
          >
            <Download className="h-3 w-3" />
            Export Ledger
          </Button>
          <Button variant="default" size="sm" onClick={() => onOpenReallocateModal()}>
            New Fund Reallocation
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f6f8fa] p-2.5 rounded-md border border-[#d0d7de]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#57606a]" />
          <input
            type="text"
            placeholder="Search college, department, or dean..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full rounded-md border border-[#d0d7de] bg-white pl-8 pr-3 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#656d76]">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328]"
          >
            <option value="all">All Divisions ({departments.length})</option>
            <option value="overspend">Overspend Alerts ({departments.filter((d) => d.remaining < 0).length})</option>
            <option value="surplus">Surplus Reserves ({departments.filter((d) => d.status === 'Surplus').length})</option>
          </select>
        </div>
      </div>

      {/* Department Cards Grid - Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept) => {
          const isOver = dept.remaining < 0
          return (
            <Card
              key={dept.id}
              className={`flex flex-col justify-between ${
                isOver ? 'border-[#ff8182] bg-[#fff5f5]/30' : ''
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-[#1f2328]">{dept.name}</h3>
                    <p className="text-[11px] text-[#656d76] mt-0.5">Lead: {dept.head}</p>
                  </div>
                  <Badge variant={isOver ? 'danger' : dept.status === 'Surplus' ? 'success' : 'primary'}>
                    {dept.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#d0d7de]/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#656d76]">Allocated Budget:</span>
                    <span className="font-semibold">{formatCurrency(dept.allocated, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656d76]">Actual Spend:</span>
                    <span className="font-medium text-[#1f2328]">{formatCurrency(dept.spent, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#656d76]">Open Encumbrances (POs):</span>
                    <span className="font-medium text-[#57606a]">{formatCurrency(dept.encumbered, true)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#d0d7de]/40 pt-1">
                    <span className="font-semibold text-[#1f2328]">Remaining Balance:</span>
                    <span className={`font-bold ${isOver ? 'text-[#cf222e]' : 'text-[#1a7f37]'}`}>
                      {isOver ? `-${formatCurrency(Math.abs(dept.remaining), true)}` : formatCurrency(dept.remaining, true)}
                    </span>
                  </div>
                </div>

                {/* Burn rate bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#656d76]">
                    <span>Burn Rate Trajectory</span>
                    <span className={`font-bold ${isOver ? 'text-[#cf222e]' : 'text-[#1f2328]'}`}>
                      {dept.burnRate}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isOver ? 'bg-[#cf222e]' : dept.burnRate > 85 ? 'bg-[#1a7f37]' : 'bg-[#0969da]'}`}
                      style={{ width: `${Math.min(dept.burnRate, 100)}%` }}
                    />
                  </div>
                </div>

                {dept.alert && (
                  <div className="p-2 bg-[#ffebe9] border border-[#ff8182]/50 rounded text-[11px] text-[#cf222e]">
                    {dept.alert}
                  </div>
                )}
              </CardContent>

              <div className="p-3 bg-[#f6f8fa]/60 border-t border-[#d0d7de]/50 flex items-center justify-between rounded-b-md">
                <button
                  onClick={() => handleDelete(dept.id, dept.name)}
                  className="text-[#656d76] hover:text-[#cf222e] text-[11px] flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenReallocateModal(dept)}
                  className="text-[#0969da] hover:text-[#0854ad] text-[11px]"
                >
                  Transfer Funds <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Department Modal */}
      {isNewDeptModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewDeptModalOpen(false)}
          title="Enroll Academic Division / Department"
          description="Sets up a new departmental chart of accounts in the institutional ledger"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsNewDeptModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleCreateDept}>
                Create Department
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Division / Faculty Name</label>
              <input
                type="text"
                required
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="E.g., School of Public Health & Epidemiology"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Dean / Department Head</label>
              <input
                type="text"
                required
                value={deptHead}
                onChange={(e) => setDeptHead(e.target.value)}
                placeholder="Dr. Katherine Zhao, Dean"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Allocation (₹)</label>
                <input
                  type="number"
                  value={deptAlloc}
                  onChange={(e) => setDeptAlloc(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Actual Spend (₹)</label>
                <input
                  type="number"
                  value={deptSpent}
                  onChange={(e) => setDeptSpent(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Encumbered (₹)</label>
                <input
                  type="number"
                  value={deptEnc}
                  onChange={(e) => setDeptEnc(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
