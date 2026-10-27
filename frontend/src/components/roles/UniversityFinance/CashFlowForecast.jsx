import React from 'react'
import {
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Download,
  IndianRupee,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { MetricCard } from '@/components/shared/MetricCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

export function CashFlowForecast({ onTriggerToast }) {
  const { monthlyCashflow, univKPIs } = useFinancialData()

  // Dynamic calculations from cashflow curve
  const minCash = Math.min(...monthlyCashflow.map((m) => m.netCash))
  const maxCash = Math.max(...monthlyCashflow.map((m) => m.netCash))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328]">
            12-Month Liquidity Curve & Debt Service Covenant Forecast
          </h2>
          <p className="text-xs text-[#656d76]">
            Operating cash positions, bond amortization obligations, and tuition receivable settlement cycles
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTriggerToast('Exporting Treasury Cash Flow', '12-Month dynamic model exported.')}
        >
          <Download className="h-3 w-3" />
          Export Cash Model
        </Button>
      </div>

      {/* Dynamic Liquidity KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="MINIMUM LIQUID CASH CUSHION"
          value={`₹${minCash}.0 Cr`}
          secondaryValue="Projected Low Point"
          change="Safe Cushion"
          changeDirection="up"
          changeLabel="Statutory Floor: ₹85 Cr"
          icon={TrendingUp}
          badge="Covenant Met"
          badgeVariant="success"
        />

        <MetricCard
          title="PEAK LIQUIDITY (ENROLLMENT SPIKE)"
          value={`₹${maxCash}.0 Cr`}
          secondaryValue="Fall / Spring Influx"
          change="+8.2% vs FY25"
          changeDirection="up"
          changeLabel="Tuition Receipts Cycle"
          icon={IndianRupee}
          badge="Treasury Sweep"
          badgeVariant="primary"
        />

        <MetricCard
          title="ANNUAL DEBT SERVICE COVERAGE"
          value="2.84x"
          secondaryValue="Bond Resolution Covenant"
          change="Required: 1.25x"
          changeDirection="up"
          changeLabel="Moody’s Aa2 Rating"
          icon={CreditCard}
          badge="Low Risk"
          badgeVariant="success"
        />

        <MetricCard
          title="OPERATING SURPLUS PROJECTED"
          value={formatCurrency(univKPIs.projectedSurplus, true)}
          secondaryValue="Net Operating Reserve"
          change={univKPIs.burnRatePercent <= 75 ? 'Optimal Standing' : 'Tight Margin'}
          changeDirection={univKPIs.burnRatePercent <= 75 ? 'up' : 'neutral'}
          changeLabel={`Burn Rate: ${univKPIs.burnRatePercent}%`}
          icon={ShieldCheck}
          badge="Live Model"
          badgeVariant="outline"
        />
      </div>

      {/* Main Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net Treasury Cash Balance by Month (₹ Crores)</CardTitle>
          <CardDescription>
            Dynamic 12-month trajectory derived from real operating budget of {formatCurrency(univKPIs.operatingBudget, true)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyCashflow}
                margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
              >
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
                <Line
                  type="monotone"
                  dataKey="netCash"
                  name="Operating Cash Balance (₹ Cr)"
                  stroke="#0969da"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0969da', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3 bg-[#f6f8fa] rounded-md border border-[#d0d7de] text-xs text-[#57606a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              <strong>Treasury Note:</strong> Lowest projected liquid balance is <strong>₹${minCash}.0 Cr</strong>, remaining <strong>{Math.round(((minCash - 85) / 85) * 100)}% above</strong> the statutory minimum liquidity threshold (₹85.0 Cr).
            </span>
            <Badge variant="success" className="shrink-0">
              Covenants In Full Compliance
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
