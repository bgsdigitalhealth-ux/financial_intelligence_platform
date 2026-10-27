import React from 'react'
import { cn } from '@/lib/utils'

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-xs active:scale-[0.99]'

    const variants = {
      default:
        'bg-[#1f883d] text-white hover:bg-[#1a7f37] border border-[#1b1f2426] shadow-sm', // GitHub primary green button
      blue: 'bg-[#0969da] text-white hover:bg-[#0854ad] border border-[#0969da] shadow-sm',
      secondary:
        'bg-[#f6f8fa] text-[#24292f] hover:bg-[#eaeef2] border border-[#d0d7de] hover:border-[#afb8c1] shadow-xs', // GitHub standard button
      outline:
        'bg-white text-[#24292f] hover:bg-[#f6f8fa] border border-[#d0d7de] hover:border-[#afb8c1]',
      destructive:
        'bg-[#cf222e] text-white hover:bg-[#b62324] border border-[#1b1f2426] shadow-sm',
      ghost: 'text-[#24292f] hover:bg-[#f6f8fa] border border-transparent shadow-none',
      link: 'text-[#0969da] hover:underline shadow-none p-0 h-auto font-medium',
    }

    const sizes = {
      default: 'h-8 px-3 py-1.5',
      sm: 'h-7 px-2.5 text-xs',
      lg: 'h-9 px-4 text-sm',
      icon: 'h-8 w-8 p-0',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
