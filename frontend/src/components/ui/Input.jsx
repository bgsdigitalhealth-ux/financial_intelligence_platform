import React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-8 w-full rounded-md border border-[#d0d7de] bg-white px-2.5 py-1 text-xs text-[#1f2328] placeholder:text-[#656d76] shadow-xs focus:border-[#0969da] focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 disabled:cursor-not-allowed disabled:bg-[#f6f8fa] disabled:opacity-75 transition-all',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        'flex h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 py-1 text-xs text-[#1f2328] shadow-xs focus:border-[#0969da] focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 disabled:cursor-not-allowed disabled:bg-[#f6f8fa] cursor-pointer transition-all',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = 'Select'
