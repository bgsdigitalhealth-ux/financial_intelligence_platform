import React, { useState } from 'react'
import {
  Landmark,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Menu,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { ROLES, ROLE_PROFILES, useFinancialData } from '@/context/FinancialDataContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KarnatakaGovLogo } from '@/components/shared/KarnatakaGovLogo'

export function GitHubNavbar({
  currentRole,
  currentUser,
  onLogout,
  onToggleSidebar,
  onOpenFlowchart,
  onOpenRAG,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const [searchQuery, setSearchQuery] = useState('')
  const { universities = [], clearAllDummyData } = useFinancialData()

  const activeProfile = ROLE_PROFILES[currentRole] || ROLE_PROFILES[ROLES.GOV_LEADER] || {}
  const displayUser = currentUser || {
    name: activeProfile?.name || 'Authorized Official',
    email: activeProfile?.email || 'official@karnataka.gov.in',
    organization: activeProfile?.organization || 'Department of Higher Education',
    avatar: activeProfile?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    authorizedRoles: [currentRole || 'gov_leader'],
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#d0d7de] bg-[#ffffff] text-[#1f2328] select-none">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Karnataka Crest */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa] md:hidden cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <KarnatakaGovLogo className="h-10 w-10 shrink-0" />
            <div className="hidden md:flex md:flex-col md:justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#1f2328] leading-tight">
                  Higher Education Financial Intelligence Platform
                </span>
              </div>
              <p className="text-[11px] text-[#656d76] leading-tight mt-0.5">
                Government of Karnataka • Department of Higher Education
              </p>
            </div>
          </div>
        </div>

        {/* Center-Right Controls: FY, Quarter, Search */}
        <div className="flex items-center gap-2.5">
          {/* FY Dropdown */}
          <div className="hidden sm:flex items-center">
            <select
              aria-label="Financial Year"
              className="h-8 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2.5 text-xs text-[#1f2328] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da]"
            >
              <option value="FY 2024-25">FY 2024-25</option>
              <option value="FY 2025-26">FY 2025-26</option>
            </select>
          </div>

          {/* Quarter Dropdown */}
          <div className="hidden sm:flex items-center">
            <select
              aria-label="Quarter"
              className="h-8 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2.5 text-xs text-[#1f2328] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0969da]"
            >
              <option value="Q2 (Jul – Sep)">Q2 (Jul – Sep)</option>
              <option value="Q1 (Apr – Jun)">Q1 (Apr – Jun)</option>
              <option value="Q3 (Oct – Dec)">Q3 (Oct – Dec)</option>
              <option value="Q4 (Jan – Mar)">Q4 (Jan – Mar)</option>
            </select>
          </div>

          {/* Search Universities */}
          <div className="hidden lg:flex items-center w-52">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#57606a]" />
              <input
                type="text"
                placeholder="Search universities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-8 pr-3 text-xs text-[#1f2328] placeholder:text-[#656d76] focus:bg-white focus:border-[#0969da] focus:outline-none focus:ring-1 focus:ring-[#0969da]"
              />
            </div>
          </div>
        </div>

        {/* Right: Actions & Profile with Logout */}
        <div className="flex items-center gap-2">

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationCount(0)}
              className="relative rounded-md p-1.5 text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#1f2328] transition-colors cursor-pointer border border-transparent hover:border-[#d0d7de]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#cf222e] px-1 text-[10px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>

          <div className="h-5 w-[1px] bg-[#d0d7de] mx-1 hidden sm:block" />

          {/* User Profile Menu with Sign Out */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-[#f6f8fa] border border-transparent hover:border-[#d0d7de] transition-colors cursor-pointer"
            >
              <img
                src={displayUser.avatar || activeProfile?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                alt={displayUser.name || 'User'}
                className="h-7 w-7 rounded-full object-cover border border-[#d0d7de]"
              />
              <div className="hidden xl:block text-left leading-tight">
                <div className="text-xs font-semibold text-[#1f2328] leading-none">{displayUser.name}</div>
                <div className="text-[10px] text-[#656d76] truncate max-w-[130px] font-mono">{displayUser.email}</div>
              </div>
              <ChevronDown className="h-3 w-3 text-[#57606a] hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-72 rounded-md border border-[#d0d7de] bg-white p-2.5 shadow-lg z-40 animate-in fade-in-50 zoom-in-95 text-xs">
                  <div className="px-2 py-2 border-b border-[#d0d7de]/60 space-y-1">
                    <div className="font-semibold text-[#1f2328]">{displayUser.name}</div>
                    <div className="text-[11px] text-[#57606a] font-mono">{displayUser.email}</div>
                    <div className="text-[10px] text-[#656d76]">{displayUser.organization}</div>
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-[#57606a]">Role:</span>
                      <span className="font-semibold text-[11px] text-[#0969da]">{activeProfile?.badge || 'State Leadership'}</span>
                    </div>
                  </div>

                  <div className="p-2 my-1 bg-[#f6f8fa] rounded border border-[#d0d7de]/60 text-[10px] text-[#57606a] leading-tight">
                    To change your active operational role, please sign out and choose a role upon re-authentication.
                  </div>

                  <div className="pt-1 border-t border-[#d0d7de]/50 space-y-1">
                    <button
                      onClick={async () => {
                        if (window.confirm('Wipe all test statements, transactions, and bank accounts to ensure project is 100% clean and dynamic?')) {
                          setIsUserMenuOpen(false)
                          try {
                            await clearAllDummyData()
                            alert('All test statements, transactions, and bank accounts have been purged. The platform is now dynamic and clean.')
                          } catch (err) {
                            alert('Cleanup error: ' + err.message)
                          }
                        }
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                        Purge All Mock / Dummy Data
                      </span>
                      <span className="text-[10px] text-[#cf222e]/80">Purge Data</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        if (onLogout) onLogout()
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#1f2328] rounded-md transition-colors cursor-pointer font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="h-3.5 w-3.5" />
                        Log Out (Change Role)
                      </span>
                      <span className="text-[10px] text-[#57606a]">End Session</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
