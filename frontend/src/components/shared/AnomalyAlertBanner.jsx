import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function AnomalyAlertBanner({
  title,
  message,
  type = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  actionLabel,
  onAction,
  onDismiss,
  tag,
}) {
  const styles = {
    warning: {
      bg: 'bg-[#fff8c5]/70',
      border: 'border-[#d4a72c]/50',
      icon: AlertTriangle,
      iconColor: 'text-[#9a6700]',
      textColor: 'text-[#5f370e]',
    },
    danger: {
      bg: 'bg-[#ffebe9]/70',
      border: 'border-[#ff8182]/50',
      icon: AlertCircle,
      iconColor: 'text-[#cf222e]',
      textColor: 'text-[#6e0114]',
    },
    info: {
      bg: 'bg-[#ddf4ff]/70',
      border: 'border-[#54aeff]/50',
      icon: AlertCircle,
      iconColor: 'text-[#0969da]',
      textColor: 'text-[#053d7a]',
    },
    success: {
      bg: 'bg-[#dafbe1]/70',
      border: 'border-[#4ac26b]/50',
      icon: CheckCircle2,
      iconColor: 'text-[#1a7f37]',
      textColor: 'text-[#114b24]',
    },
  }

  const current = styles[type] || styles.warning
  const Icon = current.icon

  return (
    <div
      className={`rounded-md border p-3 ${current.bg} ${current.border} transition-all shadow-2xs mb-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${current.iconColor}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${current.textColor}`}>{title}</span>
              {tag && (
                <Badge variant="outline" className="text-[10px] bg-white py-0">
                  {tag}
                </Badge>
              )}
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed ${current.textColor} opacity-90`}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actionLabel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onAction}
              className="bg-white hover:bg-white/90 text-xs shadow-2xs"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-[#57606a] hover:text-[#1f2328] p-1 rounded hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
