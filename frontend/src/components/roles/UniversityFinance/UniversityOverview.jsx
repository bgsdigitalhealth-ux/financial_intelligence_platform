import React from 'react'
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ShieldCheck,
  CreditCard,
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
import { formatCurrency } from '@/lib/utils'

export function UniversityOverview({ onSelectTab, onOpenReallocateModal, onTriggerToast }) {
  const { departments, univKPIs, monthlyCashflow, researchGrants, reallocations } = useFinancialData()

  // Find any active overspend warnings dynamically
  const overspentDepts = departments.filter((d) => d.spent + d.encumbered > d.allocated)

  // Dynamic revenue structure derived from operating budget
  const revenueSources = [
    { category: 'Tuition & Academic Fees', actual: Math.round(univKPIs.operatingBudget * 0.41), percent: 41, color: '#0969da' },
    { category: 'State Appropriations Grant', actual: Math.round(univKPIs.operatingBudget * 0.34), percent: 34, color: '#1a7f37' },
    { category: 'Sponsored Research Portfolio', actual: Math.round(univKPIs.operatingBudget * 0.17), percent: 17, color: '#8250df' },
    { category: 'Endowment Payout Yield', actual: Math.round(univKPIs.operatingBudget * 0.06), percent: 6, color: '#bf8700' },
    { category: 'Auxiliary Campus Enterprises', actual: Math.round(univKPIs.operatingBudget * 0.02), percent: 2, color: '#57606a' },
  ]

  return (
    <div className="space-y-6">
      {/* Dynamic Overspend Alert Banner */}
      {overspentDepts.length > 0 && (
        <div className="rounded-md border border-[#ff8182]/50 bg-[#ffebe9]/40 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#6e0114]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#cf222e] shrink-0" />
            <span>
              <strong>Departmental Overspend Alert:</strong>{' '}
              {overspentDepts.map((d) => `${d.name} (${d.burnRate}% burn rate, ${formatCurrency(Math.abs(d.remaining), true)} deficit)`).join(', ')}.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onSelectTab('reallocations')}
            >
              Review Reallocations
            </Button>
          </div>
        </div>
      )}

      {/* Institutional KPI Cards - Dynamically Computed */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="ANNUAL OPERATING BUDGET"
          value={formatCurrency(univKPIs.operatingBudget, true)}
          secondaryValue={`across ${departments.length} divisions`}
          change={`${univKPIs.burnRatePercent}% Spent`}
          changeDirection="neutral"
          changeLabel="Month 9 Benchmark: 75.0%"
          icon={Building2}
          badge="Live Ledger"
          badgeVariant="primary"
          progress={univKPIs.burnRatePercent}
          progressLabel="Annual Budget Burn Rate"
        />

        <MetricCard
          title="PROJECTED FISCAL NET SURPLUS"
          value={formatCurrency(univKPIs.projectedSurplus, true)}
          secondaryValue="Operating Margin Buffer"
          change={univKPIs.remaining >= 0 ? 'Surplus Reserve' : 'Deficit Watch'}
          changeDirection={univKPIs.remaining >= 0 ? 'up' : 'down'}
          changeLabel="Tuition & Endowments"
          icon={TrendingUp}
          badge="Audited"
          badgeVariant="success"
        />

        <MetricCard
          title="SPONSORED RESEARCH AWARDS"
          value={formatCurrency(univKPIs.totalResearchAwards, true)}
          secondaryValue={`${researchGrants.length} Active Grants`}
          change="54.5% F&A Rate"
          changeDirection="up"
          changeLabel="NIH / NSF / DOE / State"
          icon={Award}
          badge="High Velocity"
          badgeVariant="purple"
        />

        <MetricCard
          title="PENDING REALLOCATIONS"
          value={`${reallocations.filter((r) => r.status.includes('Pending') || r.status === 'Under Review').length} Requests`}
          secondaryValue="Requiring CFO Review"
          change="Board Rule §14"
          changeDirection="neutral"
          changeLabel="Inter-Account Transfers"
          icon={CreditCard}
          badge="Queue Active"
          badgeVariant="warning"
        />
      </div>

      {/* Charts Section: Monthly Cash Inflow vs Expenses & Revenue Streams Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Monthly Cashflow Dynamics */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>FY26 Monthly Operating Cash Flow Dynamics</CardTitle>
              <CardDescription>
                Tuition payment spikes (August & January) vs steady monthly payroll and operational disbursements (₹ Cr)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Dynamic 12-Month Curve
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyCashflow}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a7f37" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1a7f37" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cf222e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#cf222e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" vertical={false} />
                  <XAxis
                    dataKey="month"
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
                    formatter={(val) => [`₹${val} Cr`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Operating Inflow (₹ Cr)"
                    stroke="#1a7f37"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenditures & Payroll (₹ Cr)"
                    stroke="#cf222e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right 1 Col: Revenue Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Institutional Revenue Mix</CardTitle>
            <CardDescription>
              {formatCurrency(univKPIs.operatingBudget, true)} Total Operating Portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="actual"
                  >
                    {revenueSources.map((entry, index) => (
                      <Cell key={`rev-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#d0d7de',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [formatCurrency(val, true), 'Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 space-y-1.5 text-xs">
              {revenueSources.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-[#1f2328]">{item.category}</span>
                  </div>
                  <span className="font-semibold text-[#57606a] shrink-0">
                    {formatCurrency(item.actual, true)} ({item.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Summary Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Academic & Research Unit Budgets ({departments.length} Divisions)</CardTitle>
            <CardDescription>
              Real-time ledger postings across major colleges and operational divisions
            </CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onSelectTab('departments')}>
            View All Department Ledgers <ChevronRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">Academic Division / Faculty</th>
                <th className="py-2.5 px-3">Dean / Lead</th>
                <th className="py-2.5 px-3">FY26 Budget</th>
                <th className="py-2.5 px-3">Actual Spent</th>
                <th className="py-2.5 px-3">Burn Rate</th>
                <th className="py-2.5 px-3">Remaining Balance</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {(departments || []).slice(0, 5).map((dept) => {
                const isOver = dept.remaining < 0
                return (
                  <tr key={dept.id} className="hover:bg-[#f6f8fa]/80">
                    <td className="py-3 px-4 font-semibold text-[#1f2328]">{dept.name}</td>
                    <td className="py-3 px-3 text-[#57606a]">{dept.head}</td>
                    <td className="py-3 px-3">{formatCurrency(dept.allocated, true)}</td>
                    <td className="py-3 px-3 font-medium text-[#1f2328]">
                      {formatCurrency(dept.spent, true)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-mono font-semibold ${isOver ? 'text-[#cf222e]' : 'text-[#1a7f37]'}`}>
                        {dept.burnRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">
                      <span className={isOver ? 'text-[#cf222e]' : 'text-[#1a7f37]'}>
                        {isOver ? `-${formatCurrency(Math.abs(dept.remaining), true)}` : formatCurrency(dept.remaining, true)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={isOver ? 'danger' : dept.status === 'Surplus' ? 'success' : 'primary'}>
                        {dept.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
