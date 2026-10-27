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
} from 'lucide-react'
import { ROLES, useFinancialData } from '@/context/FinancialDataContext'

export function TabNav({ currentRole, activeTab, onSelectTab }) {
  const {
    universities,
    departments,
    researchGrants,
    reallocations,
    users,
    alertRules,
  } = useFinancialData()

  const flaggedCount = universities.filter((u) => u.complianceScore < 85).length
  const pendingReallocs = reallocations.filter((r) => r.status.includes('Pending') || r.status === 'Under Review').length
  const activeRules = alertRules.filter((r) => r.enabled).length

  const getTabsForRole = () => {
    switch (currentRole) {
      case ROLES.GOV_LEADER:
        return [
          { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
          { id: 'grants', label: 'University Grants & Allocations', icon: IndianRupee, badge: `${universities.length}` },
          {
            id: 'compliance',
            label: 'Compliance & Risk Map',
            icon: ShieldAlert,
            badge: flaggedCount > 0 ? `${flaggedCount} Flags` : 'Optimal',
            badgeVariant: flaggedCount > 0 ? 'danger' : 'default',
          },
          { id: 'simulator', label: 'Policy Budget Simulator', icon: Sliders },
          { id: 'reports', label: 'Legislative Reports', icon: FileSpreadsheet },
        ]
      case ROLES.UNIV_FINANCE:
        return [
          { id: 'overview', label: 'Financial Command Center', icon: Building2 },
          { id: 'departments', label: 'Department Budgets', icon: Layers, badge: `${departments.length}` },
          { id: 'research-grants', label: 'Research Grants (NIH/NSF)', icon: Award, badge: `${researchGrants.length}` },
          { id: 'cashflow', label: 'Cash Flow & Reserves', icon: TrendingUp },
          {
            id: 'reallocations',
            label: 'Fund Reallocations',
            icon: ArrowLeftRight,
            badge: `${pendingReallocs}`,
            badgeVariant: pendingReallocs > 0 ? 'warning' : 'default',
          },
        ]
      case ROLES.ADMIN:
        return [
          { id: 'overview', label: 'Telemetry & Health', icon: Activity },
          { id: 'users', label: 'User RBAC Directory', icon: Users, badge: `${users.length}` },
          { id: 'institutions', label: 'Campus ERP Gateways', icon: Network, badge: `${universities.length} Campuses` },
          { id: 'audit-log', label: 'Immutable Audit Trail', icon: GitCommit },
          { id: 'rule-engine', label: 'Alert Rule Engine', icon: Cpu, badge: `${activeRules} Active` },
        ]
      default:
        return []
    }
  }

  const tabs = getTabsForRole()

  return (
    <div className="border-b border-[#d0d7de] bg-[#ffffff] px-4 sm:px-6">
      <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 border-b-2 py-3 px-2 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'border-[#fd8c73] text-[#1f2328] font-semibold'
                  : 'border-transparent text-[#656d76] hover:border-[#d0d7de] hover:text-[#1f2328]'
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? 'text-[#1f2328]' : 'text-[#8c959f] group-hover:text-[#1f2328]'
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-medium leading-none ${
                    tab.badgeVariant === 'danger'
                      ? 'bg-[#ffebe9] text-[#cf222e]'
                      : tab.badgeVariant === 'warning'
                      ? 'bg-[#fff8c5] text-[#9a6700]'
                      : 'bg-[#afb8c1]/20 text-[#24292f]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
