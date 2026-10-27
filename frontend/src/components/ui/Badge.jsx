import React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-[#afb8c1]/20 text-[#24292f] border-[#d0d7de]',
    primary: 'bg-[#ddf4ff] text-[#0969da] border-[#54aeff]/40',
    success: 'bg-[#dafbe1] text-[#1a7f37] border-[#4ac26b]/40',
    warning: 'bg-[#fff8c5] text-[#9a6700] border-[#d4a72c]/40',
    danger: 'bg-[#ffebe9] text-[#cf222e] border-[#ff8182]/40',
    purple: 'bg-[#fbefff] text-[#8250df] border-[#c297ff]/40',
    outline: 'bg-transparent text-[#57606a] border-[#d0d7de]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight tracking-wide',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
