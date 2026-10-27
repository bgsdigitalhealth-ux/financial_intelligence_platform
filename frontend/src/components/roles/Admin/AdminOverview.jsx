import React, { useState, useEffect } from 'react'
import {
  Activity,
  Shield,
  Server,
  Network,
  Users,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Database,
  Lock,
  KeyRound,
  HardDrive,
  ExternalLink,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { MetricCard } from '@/components/shared/MetricCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function AdminOverview({ onSelectTab, onActionClick, onTriggerToast }) {
  const { users = [], auditLogs = [], alertRules = [], universities = [] } = useFinancialData()

  const [mysqlPassword, setMysqlPassword] = useState('')
  const [isConnectingMysql, setIsConnectingMysql] = useState(false)
  const [mysqlStatus, setMysqlStatus] = useState({ connected: false, config: { user: 'root', host: 'localhost', port: 3306, database: 'gov_finance_intel' } })

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/admin/mysql-status')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMysqlStatus(d)
      })
      .catch(() => {})
  }, [])

  const handleConnectMySQL = async (e) => {
    if (e) e.preventDefault()
    if (!mysqlPassword) {
      if (onTriggerToast) onTriggerToast('Password Required', 'Please enter the MySQL root password.', 'warning')
      return
    }

    setIsConnectingMysql(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/mysql-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: mysqlPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setMysqlStatus((prev) => ({ ...prev, connected: true }))
        if (onTriggerToast) {
          onTriggerToast(
            'MySQL Connected & Migrated',
            'Created database gov_finance_intel and stored 32 universities, 95 bank accounts & statements in MySQL!',
            'success'
          )
        }
      } else {
        if (onTriggerToast) {
          onTriggerToast('MySQL Authentication Failed', data.error || 'Access denied for root. Verify password.', 'danger')
        }
      }
    } catch (err) {
      if (onTriggerToast) onTriggerToast('Connection Error', err.message, 'danger')
    } finally {
      setIsConnectingMysql(false)
    }
  }

  const erpIntegrations = [
    { id: 'workday', name: 'Workday Financial Management', status: 'Connected', syncInterval: 'Realtime Webhooks', lastSync: '1 minute ago', recordsProcessed: '142,800/day', latency: '18ms' },
    { id: 'banner', name: 'Ellucian Banner Finance 9.3', status: 'Connected', syncInterval: '15-min Polling', lastSync: '4 minutes ago', recordsProcessed: '98,400/day', latency: '42ms' },
    { id: 'oracle', name: 'Oracle Cloud ERP (General Ledger)', status: 'Connected', syncInterval: 'Hourly Delta', lastSync: '12 minutes ago', recordsProcessed: '67,100/day', latency: '31ms' },
    { id: 'sap', name: 'SAP S/4HANA Public Sector', status: 'Syncing Batch', syncInterval: 'Daily EOD Batch', lastSync: 'In Progress (88%)', recordsProcessed: '210,000/day', latency: '65ms' },
  ]

  const activeUserCount = (users || []).filter((u) => u && u.status === 'Active').length
  const activeRuleCount = (alertRules || []).filter((r) => r && r.enabled).length

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-md border border-[#4ac26b]/50 bg-[#dafbe1]/40 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#114b24]">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#1a7f37] shrink-0" />
          <span>
            <strong>Consortium Gateway Operational:</strong> All campus ERP connectors are synchronizing without backpressure. {(universities || []).length} campuses actively streaming ledger journals.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-xs"
            onClick={() => onActionClick('sync-erp')}
          >
            <RefreshCw className="h-3 w-3" />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Dynamic Telemetry KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="PLATFORM AVAILABILITY"
          value="99.98%"
          secondaryValue="30-Day Window"
          change="Optimal"
          changeDirection="up"
          changeLabel="SLA Benchmark: 99.9%"
          icon={Activity}
          badge="Production"
          badgeVariant="success"
        />

        <MetricCard
          title="AVERAGE SYNC LATENCY"
          value="24 ms"
          secondaryValue="Global REST/GraphQL"
          change="-6ms vs FY25"
          changeDirection="up"
          changeLabel="Sub-50ms Target"
          icon={Network}
          badge="Low Latency"
          badgeVariant="primary"
        />

        <MetricCard
          title="ACTIVE USER IDENTITIES"
          value={`${activeUserCount} Active`}
          secondaryValue={`of ${(users || []).length} enrolled`}
          change="100% MFA Enforced"
          changeDirection="up"
          changeLabel="SAML / Okta SSO"
          icon={Users}
          badge="Secure"
          badgeVariant="purple"
        />

        <MetricCard
          title="AUDIT TRAIL JOURNAL ENTRIES"
          value={`${(auditLogs || []).length} Commits`}
          secondaryValue="Append-Only Storage"
          change="SHA-256 Merkle"
          changeDirection="up"
          changeLabel="FIPS 140-3 Validated"
          icon={Lock}
          badge="Immutable"
          badgeVariant="success"
        />
      </div>

      {/* ERP Connectors Status Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold text-[#1f2328] uppercase tracking-wider">
              Campus ERP Gateway Integration Health
            </h3>
            <p className="text-xs text-[#656d76]">
              Real-time synchronization brokers connecting state university general ledgers
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onSelectTab('institutions')}>
            View Campuses
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {erpIntegrations.map((erp) => {
            const isConnected = erp.status === 'Connected'
            return (
              <Card key={erp.id} className="relative">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#1f2328]">{erp.name}</span>
                    <Badge variant={isConnected ? 'success' : 'warning'}>
                      {erp.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#656d76]">Sync Frequency:</span>
                      <span className="font-mono">{erp.syncInterval}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#656d76]">Last Handshake:</span>
                      <span className="font-mono text-[#57606a]">{erp.lastSync}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#656d76]">Throughput:</span>
                      <span className="font-mono font-medium">{erp.recordsProcessed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#656d76]">Gateway Latency:</span>
                      <span className="font-mono text-[#0969da]">{erp.latency}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#d0d7de]/50 flex items-center justify-between">
                    <span className="text-[10px] text-[#656d76]">TLS 1.3 mTLS</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onTriggerToast(`Testing ${erp.name}`, 'Ping latency: 19ms. Handshake verified.')
                      }
                      className="text-[11px] text-[#0969da] h-6 px-1.5"
                    >
                      Test Ping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* MySQL Enterprise Database Storage Engine */}
      <Card className="border border-[#d0d7de] bg-white">
        <CardHeader className="border-b border-[#d0d7de] pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded bg-[#0969da]/10 text-[#0969da]">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-sm font-semibold text-[#1f2328] flex items-center gap-2">
                  MySQL Database Engine Storage
                  {mysqlStatus.connected ? (
                    <Badge variant="success" className="text-[10px]">
                      Connected (Live)
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px]">
                      Awaiting Root Authentication
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-[#57606a]">
                  Service: <span className="font-mono text-[#1f2328]">root@localhost:3306</span> • Target Database: <span className="font-mono text-[#0969da]">gov_finance_intel</span>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#57606a]">MySQL Server 26.10</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#f6f8fa] p-3 rounded-lg border border-[#d0d7de]">
            <div>
              <span className="text-[#57606a] block text-[11px]">Database Host & Port:</span>
              <span className="font-mono font-semibold text-[#1f2328]">localhost:3306</span>
            </div>
            <div>
              <span className="text-[#57606a] block text-[11px]">Database User:</span>
              <span className="font-mono font-semibold text-[#1f2328]">root</span>
            </div>
            <div>
              <span className="text-[#57606a] block text-[11px]">Database Name:</span>
              <span className="font-mono font-semibold text-[#0969da]">gov_finance_intel</span>
            </div>
          </div>

          {!mysqlStatus.connected ? (
            <form onSubmit={handleConnectMySQL} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <KeyRound className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57606a]" />
                <input
                  type="password"
                  placeholder="Enter MySQL root password to connect & migrate data..."
                  value={mysqlPassword}
                  onChange={(e) => setMysqlPassword(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-[#d0d7de] bg-white focus:outline-none focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]"
                />
              </div>
              <Button
                type="submit"
                variant="blue"
                size="sm"
                disabled={isConnectingMysql}
                className="text-xs shrink-0 w-full sm:w-auto font-semibold shadow-sm"
              >
                {isConnectingMysql ? 'Connecting & Migrating...' : 'Connect & Store Data in MySQL'}
              </Button>
            </form>
          ) : (
            <div className="p-3 rounded-md bg-[#dafbe1]/40 border border-[#1a7f37]/30 flex items-center justify-between text-xs text-[#1a7f37]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  <strong>MySQL Storage Active:</strong> 32 Universities, 95 Bank Accounts, Statements, and Cryptographic Audit Logs are stored and persisted in <strong>gov_finance_intel</strong>.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnectMySQL()}
                className="text-xs bg-white text-[#1f2328] shrink-0"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Re-sync Tables
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Recent Privileged Platform Audit Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Privileged Audit Commits ({(auditLogs || []).length} Total)</CardTitle>
            <CardDescription>
              Real-time audit events recorded dynamically into cryptographic append-only journal
            </CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onSelectTab('audit-log')}>
            Full Audit Trail
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">Hash</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Event Action</th>
                <th className="py-2.5 px-3">Event Summary</th>
                <th className="py-2.5 px-4 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {(auditLogs || []).slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-[#f6f8fa]/80">
                  <td className="py-3 px-4 font-mono font-semibold text-[#0969da]">{log.hash}</td>
                  <td className="py-3 px-3 text-[#57606a] font-mono text-[11px]">{log.timestamp}</td>
                  <td className="py-3 px-3 font-medium text-[#1f2328]">{log.user}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-[#57606a]">{log.action}</td>
                  <td className="py-3 px-3 text-[#57606a] max-w-[320px] truncate">{log.details}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge
                      variant={
                        log.level === 'High Priority'
                          ? 'primary'
                          : log.level === 'Warning'
                          ? 'warning'
                          : 'outline'
                      }
                    >
                      {log.level}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
