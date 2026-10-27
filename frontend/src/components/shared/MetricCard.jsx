import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export function MetricCard({
  title,
  value,
  secondaryValue,
  change,
  changeDirection = 'up', // 'up' | 'down' | 'neutral'
  changeLabel,
  icon: Icon,
  badge,
  badgeVariant = 'default',
  progress,
  progressLabel,
  className,
}) {
  const isPositive = changeDirection === 'up'
  const isNegative = changeDirection === 'down'

  return (
    <Card className={cn('hover:border-[#afb8c1] transition-colors', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-[#656d76] tracking-tight">{title}</span>
          <div className="flex items-center gap-1.5">
            {badge && (
              <Badge variant={badgeVariant} className="text-[10px] py-0">
                {badge}
              </Badge>
            )}
            {Icon && (
              <div className="rounded p-1 text-[#57606a] bg-[#f6f8fa] border border-[#d0d7de]/50">
                <Icon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#1f2328]">{value}</span>
          {secondaryValue && (
            <span className="text-xs font-normal text-[#656d76]">{secondaryValue}</span>
          )}
        </div>

        {/* Change Indicator or Subtext */}
        {(change || changeLabel) && (
          <div className="mt-2 flex items-center gap-1 text-[11px]">
            {change && (
              <span
                className={`inline-flex items-center font-medium ${
                  isPositive
                    ? 'text-[#1a7f37]'
                    : isNegative
                    ? 'text-[#cf222e]'
                    : 'text-[#57606a]'
                }`}
              >
                {isPositive && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                {isNegative && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {changeDirection === 'neutral' && <Minus className="h-3 w-3 mr-0.5" />}
                {change}
              </span>
            )}
            {changeLabel && <span className="text-[#656d76]">{changeLabel}</span>}
          </div>
        )}

        {/* Optional Progress Bar */}
        {progress !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-[#656d76] mb-1">
              <span>{progressLabel || 'Utilization'}</span>
              <span className="font-semibold text-[#1f2328]">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#f6f8fa] rounded-full overflow-hidden border border-[#d0d7de]/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress > 95
                    ? 'bg-[#cf222e]'
                    : progress > 85
                    ? 'bg-[#1a7f37]'
                    : 'bg-[#0969da]'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
