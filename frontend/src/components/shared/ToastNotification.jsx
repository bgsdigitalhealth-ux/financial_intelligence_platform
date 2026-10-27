import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function ToastNotification({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onDismiss()
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-[#1a7f37]" />,
    error: <AlertCircle className="h-4 w-4 text-[#cf222e]" />,
    info: <Info className="h-4 w-4 text-[#0969da]" />,
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-md border border-[#d0d7de] bg-white p-3.5 shadow-xl text-xs text-[#1f2328] animate-in slide-in-from-bottom-5 duration-200 max-w-md">
      <div className="shrink-0">{icons[toast.type || 'success']}</div>
      <div className="flex-1">
        <div className="font-semibold text-xs text-[#1f2328]">{toast.title}</div>
        {toast.message && <div className="text-[11px] text-[#656d76] mt-0.5">{toast.message}</div>}
      </div>
      <button
        onClick={onDismiss}
        className="rounded p-1 text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#1f2328]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
