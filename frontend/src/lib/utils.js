import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, compact = false) {
  if (amount === undefined || amount === null) return '₹0'
  const num = Number(amount) || 0

  if (compact) {
    if (Math.abs(num) >= 10_000_000) {
      return `₹${(num / 10_000_000).toFixed(2)} Cr`
    }
    if (Math.abs(num) >= 100_000) {
      return `₹${(num / 100_000).toFixed(2)} L`
    }
    if (Math.abs(num) >= 1_000) {
      return `₹${(num / 1_000).toFixed(0)}K`
    }
    return `₹${num}`
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatPercent(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}
