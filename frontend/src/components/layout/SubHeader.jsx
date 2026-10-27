import React from 'react'
import {
  Download,
  RefreshCw,
  PlusCircle,
} from 'lucide-react'
import { ROLES } from '@/context/FinancialDataContext'
import { Button } from '@/components/ui/Button'

export function SubHeader({ currentRole, onActionClick, onExportReport }) {
  if (currentRole === ROLES.GOV_LEADER) {
    return null
  }

  return (
    <div className="border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-2.5 sm:px-6">
      <div className="flex items-center justify-end">
        {/* Quick Contextual Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">

          {currentRole === ROLES.UNIV_FINANCE && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onExportReport('Institutional FY26 Ledger')}
              >
                <Download className="h-3.5 w-3.5 text-[#57606a]" />
                Export Ledger
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onActionClick('reallocate')}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New Fund Reallocation
              </Button>
            </>
          )}

          {(currentRole === ROLES.ADMIN || currentRole === ROLES.UNIV_ADMIN || currentRole === 'univ_admin') && (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f6f8fa] border border-[#d0d7de] text-[#57606a] text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>College Admin (Read-Only Mode)</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onExportReport('Institutional FY26 Ledger')}
              >
                <Download className="h-3.5 w-3.5 text-[#57606a]" />
                Export Ledger
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
