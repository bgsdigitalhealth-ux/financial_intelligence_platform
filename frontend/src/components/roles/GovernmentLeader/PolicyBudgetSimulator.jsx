import React, { useState, useMemo } from 'react'
import {
  Sliders,
  Sparkles,
  RefreshCw,
  Save,
  Plus,
  ShieldCheck,
  Building2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AddPolicyModal } from './AddPolicyModal'

export function PolicyBudgetSimulator({ onTriggerToast }) {
  const {
    fundingStreams,
    govSummary,
    recordAuditLog,
    policies,
    addPolicy,
    deletePolicy,
    universities,
  } = useFinancialData()

  const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false)

  // Dynamic slider offsets (-20% to +30%) for each live stream
  const [adjustments, setAdjustments] = useState({
    'fs-1': 15,
    'fs-2': 5,
    'fs-3': 10,
    'fs-4': 0,
    'fs-5': -5,
  })

  const handleSliderChange = (streamId, val) => {
    setAdjustments((prev) => ({ ...prev, [streamId]: Number(val) }))
  }

  // Dynamic calculations derived from live funding streams (in Crores)
  const { simulatedStreams, totalBaseline, totalSimulated, budgetDelta } = useMemo(() => {
    let baselineSum = 0
    let simSum = 0

    const list = fundingStreams.map((s) => {
      const deltaPercent = adjustments[s.id] ?? 0
      const baselineCrores = Math.round(s.amount / 10_000_000)
      const simCrores = Math.round(baselineCrores * (1 + deltaPercent / 100))

      baselineSum += baselineCrores
      simSum += simCrores

      return {
        id: s.id,
        name: s.name,
        deltaPercent,
        baselineCrores,
        simCrores,
      }
    })

    return {
      simulatedStreams: list,
      totalBaseline: baselineSum,
      totalSimulated: simSum,
      budgetDelta: simSum - baselineSum,
    }
  }, [fundingStreams, adjustments])

  const averageDelta = useMemo(() => {
    const values = Object.values(adjustments)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }, [adjustments])

  const baselineJobs = Math.round(totalBaseline * 42)
  const simulatedJobs = Math.round(baselineJobs * (1 + (averageDelta * 0.6) / 100))
  const baselinePatents = govSummary.patentsGenerated || 0
  const simulatedPatents = Math.round(baselinePatents * (1 + (averageDelta * 0.8) / 100))

  const chartData = simulatedStreams.map((s) => ({
    domain: s.name.split('&')[0].trim().slice(0, 14),
    Baseline: s.baselineCrores,
    Simulated: s.simCrores,
  }))

  const handleReset = () => {
    const clean = {}
    fundingStreams.forEach((s) => {
      clean[s.id] = 0
    })
    setAdjustments(clean)
    onTriggerToast('Simulator Reset', 'Reset all funding multipliers to active statutory baseline.')
  }

  const handleSaveScenario = () => {
    recordAuditLog(
      'POLICY_SIMULATION_SAVED',
      `Saved policy scenario with net impact: ₹${budgetDelta} Cr`,
      'Gov Leader'
    )
    onTriggerToast(
      'Policy Scenario Saved',
      `Proposal saved with net impact: ₹${budgetDelta >= 0 ? `+${budgetDelta}` : budgetDelta} Cr.`
    )
  }

  const handleDeletePolicy = async (policyId, policyCode) => {
    if (window.confirm(`Are you sure you want to remove policy [${policyCode}]?`)) {
      try {
        await deletePolicy(policyId)
        onTriggerToast('Policy Removed', `Policy [${policyCode}] has been removed.`)
      } catch (err) {
        alert(err.message || 'Failed to delete policy.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328] flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#0969da]" />
            Legislative Budget & Policy Management
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsAddPolicyOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Policy
          </Button>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RefreshCw className="h-3 w-3" />
            Reset Baseline
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSaveScenario}>
            <Save className="h-3.5 w-3.5" />
            Save Proposal
          </Button>
        </div>
      </div>

      {/* Dynamic Summary Cards (Clean & numeric, mock ROI card removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#0969da]/40 bg-[#ddf4ff]/20">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#0969da]">TOTAL STATE APPROPRIATION</span>
            <div className="mt-1 text-2xl font-bold text-[#1f2328]">
              ₹{totalSimulated.toLocaleString('en-IN')} Cr
            </div>
            <div className="mt-1 text-xs text-[#656d76]">
              {budgetDelta >= 0 ? `+₹${budgetDelta} Cr` : `-₹${Math.abs(budgetDelta)} Cr`} vs enacted
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1a7f37]/40 bg-[#dafbe1]/20">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#1a7f37]">ACTIVE STATE POLICIES</span>
            <div className="mt-1 text-2xl font-bold text-[#1a7f37]">{policies.length}</div>
            <div className="mt-1 text-xs text-[#1a7f37]">Enforced across all colleges</div>
          </CardContent>
        </Card>

        <Card className="border-[#8250df]/40 bg-[#fbefff]/20">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#8250df]">COLLEGES BOUND BY POLICY</span>
            <div className="mt-1 text-2xl font-bold text-[#1f2328]">{universities.length}</div>
            <div className="mt-1 text-xs text-[#656d76]">100% dynamic scope</div>
          </CardContent>
        </Card>

        <Card className="border-[#bf8700]/40 bg-[#fff8c5]/20">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#9a6700]">PROJECTED PATENT OUTPUT</span>
            <div className="mt-1 text-2xl font-bold text-[#1f2328]">
              {simulatedPatents.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-[#9a6700]">Statewide IP filings</div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: Active Government Policies (Admin Add Policy & Management) */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#d0d7de] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0969da]" />
              State Government Mandated Policies ({policies.length})
            </CardTitle>
          </div>
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsAddPolicyOpen(true)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Policy
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">Policy Code & Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Enforced Scope</th>
                <th className="py-2.5 px-3">Mandatory Directive</th>
                <th className="py-2.5 px-3">Threshold / Benchmark</th>
                <th className="py-2.5 px-3">Effective Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#656d76]">
                    No policies enacted yet. Click "Add Policy" to establish statewide directives.
                  </td>
                </tr>
              ) : (
                policies.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1f2328]">{p.title}</div>
                      <div className="text-[10px] font-mono text-[#0969da]">{p.policyCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline">{p.category}</Badge>
                    </td>
                    <td className="py-3 px-3 font-medium text-[#1a7f37]">
                      {p.scope || 'All Colleges'}
                    </td>
                    <td className="py-3 px-3 text-[#57606a] max-w-xs truncate" title={p.directive}>
                      {p.directive}
                    </td>
                    <td className="py-3 px-3 text-[#1f2328] font-mono">
                      {p.thresholdValue || 'Mandatory'}
                    </td>
                    <td className="py-3 px-3 text-[#57606a]">
                      {p.effectiveDate
                        ? new Date(p.effectiveDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Immediate'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePolicy(p.id, p.policyCode)}
                        className="text-[#cf222e] hover:bg-[#ffebe9] h-7 w-7 p-0"
                        title="Remove Policy"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 2: College-Wise Policy Adherence (Every College Follows All Policies) */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#d0d7de]">
          <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#1a7f37]" />
            College-Wise Policy Adherence ({universities.length} Institutions)
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">College / University</th>
                <th className="py-2.5 px-3">Institution Type</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Enforced Policies</th>
                <th className="py-2.5 px-3">Adherence Status</th>
                <th className="py-2.5 px-3">Compliance Score</th>
                <th className="py-2.5 px-4 text-right">Statutory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {universities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#656d76]">
                    No colleges registered yet. Once added, all colleges will be bound to follow enacted state policies.
                  </td>
                </tr>
              ) : (
                universities.map((u) => {
                  const isPending = (u.statementStatus || '').toLowerCase().includes('pending')
                  const isCompliant = (u.complianceScore || 100) >= 85

                  return (
                    <tr key={u.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1f2328]">{u.name}</div>
                        <div className="text-[10px] font-mono text-[#656d76]">{u.code}</div>
                      </td>
                      <td className="py-3 px-3 text-[#57606a]">
                        {u.institutionType || 'State Public University'}
                      </td>
                      <td className="py-3 px-3 text-[#57606a]">
                        {u.district || 'Karnataka'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="blue">
                          All {policies.length} Policies Enforced
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            isPending
                              ? 'outline'
                              : isCompliant
                              ? 'success'
                              : 'danger'
                          }
                        >
                          {isPending
                            ? 'Awaiting Quarterly Filing'
                            : isCompliant
                            ? 'Fully Compliant'
                            : 'Policy Variance Flagged'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-xs">
                          {isPending ? '—' : `${u.complianceScore}/100`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onTriggerToast(
                              `Policy Audit: ${u.code}`,
                              `${u.name} is synchronized with all ${policies.length} active state policies.`
                            )
                          }
                          className="text-[#0969da] h-7 px-2"
                        >
                          <FileCheck className="h-3.5 w-3.5 mr-1" />
                          Verify
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Simulator Control Sliders & Real-Time Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Adjust Strategic Funding Subsidies</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {simulatedStreams.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[#1f2328] truncate max-w-[200px]">{s.name}</span>
                  <span className="font-mono text-[#0969da] font-semibold">
                    {s.deltaPercent > 0 ? `+${s.deltaPercent}%` : `${s.deltaPercent}%`} (₹{s.simCrores} Cr)
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="30"
                  step="5"
                  value={s.deltaPercent}
                  onChange={(e) => handleSliderChange(s.id, e.target.value)}
                  className="w-full accent-[#0969da] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#656d76]">
                  <span>-20%</span>
                  <span>Enacted Baseline (₹{s.baselineCrores} Cr)</span>
                  <span>+30%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Baseline vs Simulated Allocation Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" vertical={false} />
                  <XAxis
                    dataKey="domain"
                    tick={{ fontSize: 11, fill: '#656d76' }}
                    axisLine={{ stroke: '#d0d7de' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#656d76' }}
                    axisLine={{ stroke: '#d0d7de' }}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val} Cr`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#d0d7de',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`₹${val} Crore`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Baseline" fill="#afb8c1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Simulated" fill="#0969da" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Policy Modal */}
      <AddPolicyModal
        isOpen={isAddPolicyOpen}
        onClose={() => setIsAddPolicyOpen(false)}
        onAddPolicy={addPolicy}
        onTriggerToast={onTriggerToast}
      />
    </div>
  )
}
