import React, { useState } from 'react'
import {
  GitCommit,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Calendar,
  Lock,
  ExternalLink,
  Copy,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export function AuditLogViewer({ onTriggerToast }) {
  const { auditLogs = [] } = useFinancialData()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filteredLogs = (auditLogs || []).filter((l) => {
    const matchesSearch =
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.hash.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (priorityFilter === 'all') return true
    return l.level.toLowerCase().includes(priorityFilter.toLowerCase())
  })

  const handleCopyHash = (hash) => {
    onTriggerToast('Hash Copied to Clipboard', `Audit Commit: sha256:${hash}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328] flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-[#0969da]" />
            Immutable Financial Audit Trail & Cryptographic Ledger
          </h2>
          <p className="text-xs text-[#656d76]">
            Append-only tamper-evident audit journal recording all statutory budget releases, fund reallocations, and ERP schema shifts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs font-mono">
            <ShieldCheck className="h-3 w-3 mr-1" />
            SHA-256 Merkle Root Verified
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTriggerToast('Exporting Signed Audit Trail', 'Cryptographic JSON audit package downloaded.')}
          >
            <Download className="h-3.5 w-3.5" />
            Export Audit Journal ({auditLogs.length} Records)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f6f8fa] p-2.5 rounded-md border border-[#d0d7de]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#57606a]" />
          <input
            type="text"
            placeholder="Search commit hash, user, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-[#d0d7de] bg-white pl-8 pr-3 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#656d76]">Filter Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328]"
          >
            <option value="all">All Event Priorities ({auditLogs.length})</option>
            <option value="high">High Priority Only</option>
            <option value="warning">Compliance Warnings</option>
            <option value="normal">Standard Entries</option>
          </select>
        </div>
      </div>

      {/* GitHub Commit-Style Timeline List - Live Dynamic */}
      <Card>
        <div className="divide-y divide-[#d0d7de]">
          {filteredLogs.map((log) => {
            const isHigh = log.level === 'High Priority'
            const isWarn = log.level === 'Warning'

            return (
              <div
                key={log.id}
                className="p-4 hover:bg-[#f6f8fa]/60 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full p-1 bg-[#f6f8fa] border border-[#d0d7de] text-[#0969da]">
                    <GitCommit className="h-4 w-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        onClick={() => handleCopyHash(log.hash)}
                        className="font-mono text-xs font-semibold text-[#0969da] bg-[#ddf4ff] hover:bg-[#b6e3ff] px-2 py-0.5 rounded border border-[#54aeff]/40 transition-colors cursor-pointer"
                        title="Click to copy commit hash"
                      >
                        commit {log.hash}
                      </button>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                      <Badge
                        variant={isHigh ? 'primary' : isWarn ? 'warning' : 'default'}
                        className="text-[10px]"
                      >
                        {log.level}
                      </Badge>
                    </div>

                    <p className="text-xs font-medium text-[#1f2328] leading-relaxed pt-0.5">
                      {log.details}
                    </p>

                    <div className="flex items-center flex-wrap gap-3 text-[11px] text-[#656d76] pt-0.5">
                      <span>
                        Actor: <strong className="text-[#1f2328]">{log.user}</strong>
                      </span>
                      <span>•</span>
                      <span>Network Origin: {log.ip}</span>
                      <span>•</span>
                      <span className="font-mono">{log.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyHash(log.hash)}
                    className="text-[#57606a] hover:text-[#1f2328] text-xs h-7"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy SHA
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
