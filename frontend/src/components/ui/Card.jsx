import React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md border border-[#d0d7de] bg-white text-[#1f2328] shadow-[0_1px_3px_rgba(27,31,36,0.06)] transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-4 border-b border-[#d0d7de]/50 bg-[#f6f8fa]/60 rounded-t-md', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-sm font-semibold leading-none tracking-tight text-[#1f2328] flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-xs text-[#656d76]', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('flex items-center p-4 pt-0 border-t border-[#d0d7de]/40 bg-[#f6f8fa]/30 rounded-b-md mt-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}
