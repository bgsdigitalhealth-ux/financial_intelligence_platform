import React from 'react'

export function KarnatakaGovLogo({
  className = 'h-9 w-9',
  alt = 'Government of Karnataka - Vidhana Soudha',
}) {
  return (
    <img
      src="/karnataka-gov-badge.png"
      alt={alt}
      className={`inline-block object-contain drop-shadow-sm shrink-0 select-none ${className}`}
      loading="eager"
    />
  )
}
