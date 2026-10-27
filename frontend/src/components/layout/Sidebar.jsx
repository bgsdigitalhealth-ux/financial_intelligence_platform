import React from 'react'
import {
  LayoutDashboard,
  IndianRupee,
  ShieldAlert,
  Sliders,
  FileSpreadsheet,
  Building2,
  Layers,
  Award,
  TrendingUp,
  ArrowLeftRight,
  Activity,
  Users,
  Network,
  GitCommit,
  Cpu,
  Landmark,
  ShieldCheck,
  LogOut,
  ChevronRight,
  X,
  UploadCloud,
  FileCheck2,
  Sparkles,
  Send,
  Settings,
  PanelLeftClose,
} from 'lucide-react'
import { ROLES, ROLE_PROFILES, useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KarnatakaGovLogo } from '@/components/shared/KarnatakaGovLogo'

export function Sidebar({
  currentRole,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onLogout,
}) {
  const {
    universities = [],
    departments = [],
    researchGrants = [],
    reallocations = [],
    users = [],
    alertRules = [],
    bankAccounts = [],
    auditLogs = [],
  } = useFinancialData()

  const { currentUser } = useAuth()
  const activeProfile = ROLE_PROFILES[currentRole] || ROLE_PROFILES[ROLES.GOV_LEADER] || {}

  const myUniversity = React.useMemo(() => {
    if (currentUser?.universityId) {
      const u = (universities || []).find((x) => x.id === currentUser.universityId)
      if (u) return u
    }
    if (currentUser?.universityName) {
      const u = (universities || []).find((x) => x.name.toLowerCase().includes(currentUser.universityName.toLowerCase()))
      if (u) return u
    }
    if (currentUser?.organization) {
      const org = currentUser.organization.toLowerCase()
      const u = (universities || []).find((x) => org.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(org) || (x.code && org.includes(x.code.toLowerCase())))
      if (u) return u
    }
    return (
      (universities || []).find((u) => u.id === 'univ-01' || u.code === 'VTU') ||
      (universities || [])[0] ||
      { id: 'univ-01', name: 'Visvesvaraya Technological University', code: 'VTU' }
    )
  }, [universities, currentUser])

  const ownAccounts = React.useMemo(() => {
    return (bankAccounts || []).filter((a) => a.universityId === myUniversity?.id)
  }, [bankAccounts, myUniversity])

  const flaggedCount = (universities || []).filter((u) => u && typeof u.complianceScore === 'number' && u.complianceScore < 85).length
  const pendingReallocs = (reallocations || []).filter(
    (r) => r && typeof r.status === 'string' && (r.status.includes('Pending') || r.status === 'Under Review')
  ).length
  const activeRules = (alertRules || []).filter((r) => r && r.enabled).length

  const getMenuItems = () => {
    switch (currentRole) {
      case ROLES.GOV_LEADER:
        return [
          {
            id: 'dashboard',
            label: 'Overview',
            icon: LayoutDashboard,
            description: 'Executive command overview & operational cards',
          },
          {
            id: 'all_colleges',
            label: 'Universities',
            icon: Building2,
            badge: (universities || []).length > 0 ? `${(universities || []).length}` : undefined,
            description: 'Institutional financial progress & drill-downs',
          },
          {
            id: 'bank_accounts',
            label: 'Bank Accounts',
            icon: Landmark,
            description: 'Statewide bank accounts & statements',
          },
          {
            id: 'compliance',
            label: 'Compliance',
            icon: ShieldCheck,
            badge: flaggedCount > 0 ? `${flaggedCount}` : undefined,
            badgeVariant: flaggedCount > 0 ? 'danger' : 'default',
            description: 'Statutory compliance & submission trend',
          },
          {
            id: 'ai_insights',
            label: 'AI Insights',
            icon: Sparkles,
            description: 'Autonomous financial intelligence & reasoning',
          },
          {
            id: 'reports',
            label: 'Reports',
            icon: FileSpreadsheet,
            description: 'Statutory legislative reports & filings',
          },
        ]
      case ROLES.UNIV_FINANCE:
      case ROLES.UNIV_ADMIN:
      case ROLES.ADMIN:
        return [
          {
            id: 'overview',
            label: 'Dashboard',
            icon: LayoutDashboard,
            badge: `${myUniversity?.code || 'VTU'}`,
            badgeVariant: 'primary',
            description: 'Login-based university KPIs & budget',
          },
          {
            id: 'bank_accounts',
            label: 'Bank Account',
            icon: Landmark,
            badge: `${(ownAccounts || []).length} Accounts`,
            description: 'Cards view, account details & statements',
          },
          {
            id: 'ai_validation',
            label: 'Ai validation',
            icon: Sparkles,
            description: 'AI extraction & exception resolution',
          },
          {
            id: 'compliance',
            label: 'compliance',
            icon: ShieldCheck,
            description: 'Statutory compliance & audit',
          },
          {
            id: 'ai_insights',
            label: 'AI Insights',
            icon: Cpu,
            description: 'Autonomous financial intelligence & reasoning',
          },
          {
            id: 'reports',
            label: 'Report',
            icon: FileSpreadsheet,
            description: 'Quarterly statement, reconciliation & Form 19-A',
          },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-[#1f2328]/30 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:w-60 lg:w-64 bg-[#0c192c] text-slate-100 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:h-full md:shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Official Karnataka Admin Brand Header */}
        <div className="p-3.5 border-b border-slate-800/80 bg-[#0f1d32]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <KarnatakaGovLogo className="h-10 w-10 shrink-0" />
              <div className="flex flex-col justify-center min-w-0 leading-tight">
                <div className="text-xs font-bold text-white tracking-tight truncate">
                  Dept. of Higher Education
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5 truncate">
                  Government of Karnataka
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-white md:hidden cursor-pointer rounded hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Middle: Navigation Items (Scrolls independently) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
          <div>
            <div className="px-2.5 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Operational Navigation
            </div>

            <nav className="space-y-1.5" aria-label="Sidebar Navigation">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'all_colleges' && (activeTab === 'university_overview' || activeTab === 'overview')) ||
                  (item.id === 'policy' && activeTab === 'simulator') ||
                  (item.id === 'dashboard' && activeTab === 'dashboard')

                const activeBg =
                  currentRole === ROLES.GOV_LEADER
                    ? 'bg-[#0969da] text-white shadow-xs font-semibold'
                    : currentRole === ROLES.UNIV_FINANCE
                    ? 'bg-[#16a34a] text-white shadow-xs font-semibold'
                    : 'bg-[#7c3aed] text-white shadow-xs font-semibold'

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id)
                      if (onCloseMobile) onCloseMobile()
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer text-left ${
                      isActive
                        ? activeBg
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeVariant === 'danger'
                            ? 'bg-rose-950/90 text-rose-300 border border-rose-800/60'
                            : item.badgeVariant === 'warning'
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-300 border border-slate-700/70'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Karnataka Vidhana Soudha Card & User Controls */}
        <div className="pt-2">
          {/* Karnataka Vidhana Soudha (Vidhan Sabha) Card */}
          <div className="px-3 pb-3">
            <div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-lg group">
              <img
                src="/vidhana_soudha.jpg"
                alt="Karnataka Vidhana Soudha (Vidhan Sabha)"
                className="h-28 w-full object-cover object-[center_32%] group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col justify-end p-2.5">
                <div className="text-[11px] font-bold text-white leading-tight drop-shadow-md">
                  Knowledge<br />Empowers<br />Karnataka
                </div>
              </div>
            </div>
          </div>

          {/* User Profile & Sign Out Bar */}
          <div className="p-3 border-t border-slate-800/90 bg-[#0f1d32]/90 space-y-2.5">
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile()
              }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer w-full py-1 px-1"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
              <span>Collapse menu</span>
            </button>

            <div className="flex items-center gap-2.5 pt-1">
              <img
                src={currentUser?.avatar || activeProfile?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                alt={currentUser?.name || activeProfile?.name || 'User'}
                className="h-8 w-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  {currentUser?.name || activeProfile?.name || 'Authenticated User'}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                  {currentUser?.email || activeProfile?.email || 'official@karnataka.gov.in'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-slate-700/80 bg-slate-800/90 text-xs font-medium text-rose-400 hover:bg-rose-950/50 hover:text-rose-200 hover:border-rose-700/60 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
