import React, { useState } from 'react'
import {
  Landmark,
  TrendingUp,
  Award,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  Download,
  Trash2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFinancialData } from '@/context/FinancialDataContext'
import { MetricCard } from '@/components/shared/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function GovOverview({ onSelectTab, onOpenDisburseModal, onTriggerToast }) {
  const {
    universities,
    fundingStreams,
    govSummary,
    govYearlyTrend,
    addUniversity,
    deleteUniversity,
  } = useFinancialData()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newUnivName, setNewUnivName] = useState('')
  const [newUnivCode, setNewUnivCode] = useState('')
  const [newUnivAlloc, setNewUnivAlloc] = useState('500000000')
  const [newUnivSpent, setNewUnivSpent] = useState('410000000')
  const [newUnivScore, setNewUnivScore] = useState('92')
  const [newUnivPatents, setNewUnivPatents] = useState('45')

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!newUnivName || !newUnivCode) return
    const created = addUniversity({
      name: newUnivName,
      code: newUnivCode,
      allocation: newUnivAlloc,
      spent: newUnivSpent,
      complianceScore: newUnivScore,
      patents: newUnivPatents,
    })
    setIsAddModalOpen(false)
    setNewUnivName('')
    setNewUnivCode('')
    onTriggerToast(
      'University Added to State Ledger',
      `Allocated ${formatCurrency(created.allocation, true)} to ${created.name}. All statewide charts updated.`
    )
  }

  const handleDelete = (id, name) => {
    deleteUniversity(id)
    onTriggerToast('Institution Removed', `Removed ${name} from state oversight portfolio.`)
  }

  // Find any warned institutions dynamically
  const flaggedInstitutions = universities.filter((u) => u.complianceScore < 85)

  return (
    <div className="space-y-6">
      {/* Dynamic Alert Banner */}
      {flaggedInstitutions.length > 0 && (
        <div className="rounded-md border border-[#d4a72c]/40 bg-[#fff8c5]/50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#5f370e]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#9a6700] shrink-0" />
            <span>
              <strong>Legislative Notice:</strong> {flaggedInstitutions.map((f) => f.name).join(', ')} currently flagged for compliance review.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 bg-white"
            onClick={() => onSelectTab('compliance')}
          >
            View Risk Map
          </Button>
        </div>
      )}

      {/* KPI Stat Cards (100% Dynamically Computed) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="TOTAL PUBLIC APPROPRIATION"
          value={formatCurrency(govSummary.totalAllocated, true)}
          secondaryValue={`across ${govSummary.activeInstitutions} campuses`}
          change="+6.4% YoY"
          changeDirection="up"
          changeLabel="FY26 State Budget"
          icon={Landmark}
          badge="Legislative FY26"
          badgeVariant="primary"
          progress={govSummary.utilizationRate}
          progressLabel="Fund Deployment Rate"
        />

        <MetricCard
          title="DISBURSED TO CAMPUSES"
          value={formatCurrency(govSummary.disbursedToDate, true)}
          secondaryValue={`${formatCurrency(govSummary.reserveRemaining, true)} in reserve`}
          change={`${govSummary.utilizationRate}% Deployed`}
          changeDirection="up"
          changeLabel="Target: 85.0%"
          icon={TrendingUp}
          badge={`${govSummary.activeInstitutions} Campuses`}
          badgeVariant="success"
        />

        <MetricCard
          title="ECONOMIC RETURN (ROI MULTIPLIER)"
          value={`${govSummary.economicMultiplier}x`}
          secondaryValue="per ₹1 grant invested"
          change={`${govSummary.patentsGenerated} Patents Filed`}
          changeDirection="up"
          changeLabel="Technology Commercialization"
          icon={Award}
          badge="High Impact"
          badgeVariant="purple"
        />

        <MetricCard
          title="CAMPUS COMPLIANCE HEALTH"
          value={`${govSummary.optimalCount} / ${govSummary.activeInstitutions}`}
          secondaryValue="Optimal Standing"
          change={`${govSummary.activeInstitutions - govSummary.optimalCount} Need Review`}
          changeDirection="neutral"
          changeLabel="Audit Criteria §42"
          icon={CheckCircle2}
          badge="Audited Q3"
          badgeVariant="warning"
        />
      </div>

      {/* Charts Section: Dynamic Area Trend & Funding Streams Pie Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: 5-Year Public Investment Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>State Higher Education Appropriation Trajectory</CardTitle>
              <CardDescription>
                Dynamic trajectory of statutory allocations vs actual campus drawdowns (in ₹ Crores)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Live Realtime Feed
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={govYearlyTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0969da" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0969da" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a7f37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a7f37" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" vertical={false} />
                  <XAxis
                    dataKey="year"
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
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="allocated"
                    name="Authorized Appropriation (₹ Cr)"
                    stroke="#0969da"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAllocated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="disbursed"
                    name="Actual University Disbursement (₹ Cr)"
                    stroke="#1a7f37"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDisbursed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Funding Streams Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>FY26 Strategic Pillars</CardTitle>
            <CardDescription>Target distribution of state research grants</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundingStreams}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {fundingStreams.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#d0d7de',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [formatCurrency(val, true), 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              {fundingStreams.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-[#1f2328]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-[#57606a] shrink-0">
                    {formatCurrency(item.amount, true)} ({item.share}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic University Table with Add / Delete Functionality */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>State University Performance & Grant Execution ({universities.length} Campuses)</CardTitle>
            <CardDescription>
              Dynamic audit scorecard across all participating state universities
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="blue"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add University
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onTriggerToast('Exporting Campus Ledger...', 'CSV generated from live dataset.')}
            >
              <Download className="h-3 w-3" />
              Export Matrix
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Institution Name</th>
                <th className="py-2.5 px-3">State Allocation</th>
                <th className="py-2.5 px-3">Disbursed (YTD)</th>
                <th className="py-2.5 px-3">Utilization</th>
                <th className="py-2.5 px-3">Compliance</th>
                <th className="py-2.5 px-3">Patents / IP</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {universities.map((univ) => (
                <tr key={univ.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#1f2328]">{univ.name}</div>
                    <div className="text-[10px] text-[#656d76] font-mono">
                      CODE: {univ.code} • Last Audit: {univ.lastAudit}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {formatCurrency(univ.allocation, true)}
                  </td>
                  <td className="py-3 px-3 text-[#57606a]">
                    {formatCurrency(univ.spent, true)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            univ.utilization > 95
                              ? 'bg-[#cf222e]'
                              : univ.utilization < 80
                              ? 'bg-[#bf8700]'
                              : 'bg-[#1a7f37]'
                          }`}
                          style={{ width: `${Math.min(univ.utilization, 100)}%` }}
                        />
                      </div>
                      <span className="font-medium text-[11px]">{univ.utilization}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          univ.complianceScore >= 95
                            ? 'bg-[#1a7f37]'
                            : univ.complianceScore >= 85
                            ? 'bg-[#0969da]'
                            : 'bg-[#cf222e]'
                        }`}
                      />
                      {univ.complianceGrade} ({univ.complianceScore}/100)
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-[#0969da]">
                    {univ.patents} patents
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        univ.status === 'Optimal'
                          ? 'success'
                          : univ.status === 'Audit Warning'
                          ? 'danger'
                          : univ.status === 'Under Review'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {univ.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectTab('compliance')}
                        className="text-[#0969da] h-7 px-2"
                      >
                        Audit
                      </Button>
                      <button
                        onClick={() => handleDelete(univ.id, univ.name)}
                        className="p-1 text-[#57606a] hover:text-[#cf222e] rounded hover:bg-[#ffebe9]"
                        title="Remove University"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add University Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Add University Allocation"
          description="Enrolls a higher education campus into the state appropriation grant ledger"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleAddSubmit}>
                Save Institution
              </Button>
            </>
          }
        >
          <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Institution Legal Name</label>
              <input
                type="text"
                required
                value={newUnivName}
                onChange={(e) => setNewUnivName(e.target.value)}
                placeholder="E.g., Central Valley State Institute"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Campus Code</label>
                <input
                  type="text"
                  required
                  value={newUnivCode}
                  onChange={(e) => setNewUnivCode(e.target.value)}
                  placeholder="CVSI"
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs font-mono text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">State Allocation (₹)</label>
                <input
                  type="number"
                  value={newUnivAlloc}
                  onChange={(e) => setNewUnivAlloc(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Initial Disbursed (₹)</label>
                <input
                  type="number"
                  value={newUnivSpent}
                  onChange={(e) => setNewUnivSpent(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Compliance Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newUnivScore}
                  onChange={(e) => setNewUnivScore(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Patents Filed</label>
                <input
                  type="number"
                  value={newUnivPatents}
                  onChange={(e) => setNewUnivPatents(e.target.value)}
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
