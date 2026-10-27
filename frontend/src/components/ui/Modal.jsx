import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Modal({ isOpen, onClose, title, description, children, footer, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className={cn(
          'relative w-full rounded-lg border border-[#d0d7de] bg-white text-[#1f2328] shadow-2xl animate-in zoom-in-95 duration-150',
          maxWidth
        )}
      >
        <div className="flex items-center justify-between border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-3 rounded-t-lg">
          <div>
            <h3 className="text-sm font-semibold text-[#1f2328]">{title}</h3>
            {description && <p className="text-xs text-[#656d76] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#57606a] hover:bg-[#eaeef2] hover:text-[#1f2328] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[#d0d7de] bg-[#f6f8fa] px-4 py-3 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
