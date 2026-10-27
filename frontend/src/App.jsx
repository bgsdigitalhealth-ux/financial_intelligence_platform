import React, { useState } from 'react'
import { ROLES, ROLE_PROFILES, useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/components/auth/LoginPage'
import { GitHubNavbar } from '@/components/layout/GitHubNavbar'
import { SubHeader } from '@/components/layout/SubHeader'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastNotification } from '@/components/shared/ToastNotification'
import { AIIntelligenceModal } from '@/components/shared/AIIntelligenceModal'
import { SystemFlowchartBar } from '@/components/layout/SystemFlowchartBar'
import { SystemFlowchartModal } from '@/components/shared/SystemFlowchartModal'
import { RAGWorkspaceView } from '@/components/shared/RAGWorkspaceView'
import { Sparkles, Bot } from 'lucide-react'

// Role 1: Government Leader Components
import { GovDashboardView } from '@/components/roles/GovernmentLeader/GovDashboardView'
import { GovSettingsView } from '@/components/roles/GovernmentLeader/GovSettingsView'
import { LeadershipDashboardView } from '@/components/roles/GovernmentLeader/LeadershipDashboardView'
import { UniversityOverviewView } from '@/components/roles/GovernmentLeader/UniversityOverviewView'
import { AdditionalReportsView } from '@/components/roles/GovernmentLeader/AdditionalReportsView'
import { GovOverview } from '@/components/roles/GovernmentLeader/GovOverview'
import { StateGrantTracker } from '@/components/roles/GovernmentLeader/StateGrantTracker'
import { ComplianceRiskMap } from '@/components/roles/GovernmentLeader/ComplianceRiskMap'
import { GovAIInsightsView } from '@/components/roles/GovernmentLeader/GovAIInsightsView'
import { PolicyBudgetSimulator } from '@/components/roles/GovernmentLeader/PolicyBudgetSimulator'
import { LegislativeReports } from '@/components/roles/GovernmentLeader/LegislativeReports'

// Role 2: University Finance Components
import { UnivOverviewView } from '@/components/roles/UniversityFinance/UnivOverviewView'
import { UnivBankAccountView } from '@/components/roles/UniversityFinance/UnivBankAccountView'
import { SelectBankAccountView } from '@/components/roles/UniversityFinance/SelectBankAccountView'
import { QuarterlyStatementUploadView } from '@/components/roles/UniversityFinance/QuarterlyStatementUploadView'
import { AIAnalysisValidationView } from '@/components/roles/UniversityFinance/AIAnalysisValidationView'
import { UnivComplianceView } from '@/components/roles/UniversityFinance/UnivComplianceView'
import { UnivAIInsightsView } from '@/components/roles/UniversityFinance/UnivAIInsightsView'
import { UnivReportsView } from '@/components/roles/UniversityFinance/UnivReportsView'
import { SubmissionComplianceView } from '@/components/roles/UniversityFinance/SubmissionComplianceView'
import { UniversityOverview } from '@/components/roles/UniversityFinance/UniversityOverview'
import { DepartmentalSpend } from '@/components/roles/UniversityFinance/DepartmentalSpend'
import { ResearchGrantTracker } from '@/components/roles/UniversityFinance/ResearchGrantTracker'
import { CashFlowForecast } from '@/components/roles/UniversityFinance/CashFlowForecast'
import { ReallocationWorkflow } from '@/components/roles/UniversityFinance/ReallocationWorkflow'

// Role 3: Admin Components
import { AdminOverview } from '@/components/roles/Admin/AdminOverview'
import { UserManagement } from '@/components/roles/Admin/UserManagement'
import { InstitutionDirectory } from '@/components/roles/Admin/InstitutionDirectory'
import { AuditLogViewer } from '@/components/roles/Admin/AuditLogViewer'
import { AlertRuleEngine } from '@/components/roles/Admin/AlertRuleEngine'

export default function App() {
  const { resetToDefaults, recordAuditLog } = useFinancialData()
  const {
    isAuthenticated,
    currentUser,
    currentRole,
    logout,
  } = useAuth()

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const role = localStorage.getItem('gfi_auth_role')
      if (role === ROLES.GOV_LEADER) return 'dashboard'
      return 'overview'
    } catch {
      return 'dashboard'
    }
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isFlowchartModalOpen, setIsFlowchartModalOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Sub-modal triggers
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false)
  const [isProvisionUserModalOpen, setIsProvisionUserModalOpen] = useState(false)

  const triggerToast = (title, message, type = 'success') => {
    setToast({ title, message, type })
  }

  const handleLogout = () => {
    const userName = currentUser?.name || 'User'
    recordAuditLog('USER_LOGOUT', `Terminated secure session for ${userName}`, userName)
    logout()
    triggerToast('Session Terminated', 'You have been securely signed out.', 'success')
  }

  const handleActionClick = (action) => {
    if (action === 'reallocate') {
      setIsReallocateModalOpen(true)
    } else if (action === 'add-user') {
      setIsProvisionUserModalOpen(true)
    } else if (action === 'sync-erp') {
      triggerToast('ERP Synchronization Started', 'Triggering webhook delta pull for all 12 campuses...')
      setTimeout(() => {
        triggerToast('ERP Sync Completed', 'Reconciled 538,000 journal records with zero errors.')
      }, 1500)
    } else if (action === 'disburse') {
      setActiveTab('grants')
      triggerToast('Disbursement Schedule Opened', 'Select a pending tranche to authorize release.')
    }
  }

  const handleExportReport = (reportName) => {
    triggerToast(
      `Exporting ${reportName}`,
      'Cryptographically signed PDF & CSV generated in compliance with state auditing standards.'
    )
  }

  // If user is not authenticated or has not selected a role, show Login & Role Selection Flow
  if (!isAuthenticated || !currentRole) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(role, user) => {
            const userName = user?.name || 'Authorized Official'
            const userEmail = user?.email || 'N/A'
            recordAuditLog(
              'USER_LOGIN_SUCCESS',
              `User ${userName} (${userEmail}) authenticated and assumed role: ${role}`,
              userName
            )
            if (role === ROLES.GOV_LEADER) {
              setActiveTab('dashboard')
            } else {
              setActiveTab('overview')
            }
          }}
          onTriggerToast={triggerToast}
        />
        <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      </>
    )
  }

  // Render current tab content based on active role
  const renderContent = () => {
    // Dedicated Full-Page RAG Engine & Studio for all roles
    if (activeTab === 'rag') {
      return (
        <RAGWorkspaceView
          onTriggerToast={triggerToast}
          currentRole={currentRole}
        />
      )
    }

    // Government Leader (Dashboard, All College, Reports, Compliance, Policy, Settings)
    if (currentRole === ROLES.GOV_LEADER) {
      switch (activeTab) {
        case 'dashboard':
          return (
            <GovDashboardView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'all_colleges':
        case 'overview':
          return (
            <LeadershipDashboardView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'university_overview':
          return (
            <UniversityOverviewView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'reports':
          return (
            <AdditionalReportsView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'compliance':
          return <ComplianceRiskMap onTriggerToast={triggerToast} />
        case 'ai_insights':
          return (
            <GovAIInsightsView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'policy':
        case 'simulator':
          return <PolicyBudgetSimulator onTriggerToast={triggerToast} />
        case 'settings':
          return (
            <GovSettingsView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'grants':
          return <StateGrantTracker onTriggerToast={triggerToast} />
        default:
          return (
            <GovDashboardView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
      }
    }

    // Role 2 & 3: College/University Finance & College/University Admin (Identical views, Admin cannot edit/reupload statement)
    const isCollegeAdmin =
      currentRole === ROLES.UNIV_ADMIN ||
      currentRole === ROLES.ADMIN ||
      currentRole === 'univ_admin' ||
      currentRole === 'admin'
    const isCollegeFinance = currentRole === ROLES.UNIV_FINANCE

    if (isCollegeFinance || isCollegeAdmin) {
      const canEditReupload = !isCollegeAdmin

      switch (activeTab) {
        case 'overview':
          return (
            <UnivOverviewView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
              canEditReupload={canEditReupload}
            />
          )
        case 'bank_accounts':
        case 'select_account':
          return (
            <UnivBankAccountView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
              canEditReupload={canEditReupload}
            />
          )
        case 'statement_upload':
          return (
            <UnivBankAccountView
              initialOpenUpload={canEditReupload}
              canEditReupload={canEditReupload}
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'ai_validation':
          return (
            <AIAnalysisValidationView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'compliance':
        case 'submission_compliance':
          return (
            <UnivComplianceView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'ai_insights':
          return (
            <UnivAIInsightsView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'reports':
          return (
            <UnivReportsView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
            />
          )
        case 'departments':
          return (
            <DepartmentalSpend
              onSelectTab={setActiveTab}
              onOpenReallocateModal={() => setIsReallocateModalOpen(true)}
              onTriggerToast={triggerToast}
            />
          )
        case 'research-grants':
          return <ResearchGrantTracker onTriggerToast={triggerToast} />
        case 'cashflow':
          return <CashFlowForecast onTriggerToast={triggerToast} />
        case 'reallocations':
          return <ReallocationWorkflow onTriggerToast={triggerToast} />
        default:
          return (
            <UnivOverviewView
              onSelectTab={setActiveTab}
              onTriggerToast={triggerToast}
              canEditReupload={canEditReupload}
            />
          )
      }
    }

    // Fallback default view
    return (
      <LeadershipDashboardView
        onSelectTab={setActiveTab}
        onTriggerToast={triggerToast}
      />
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-white text-[#1f2328] flex flex-col font-sans selection:bg-[#ddf4ff] selection:text-[#0969da]">
      {/* 1. Karnataka Dept of Higher Education Header (Fixed at top) */}
      <GitHubNavbar
        currentRole={currentRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onOpenFlowchart={() => setIsFlowchartModalOpen(true)}
        onOpenRAG={() => setIsAIModalOpen(true)}
      />

      {/* 2. Main Two-Column Structure: Independent Left Sidebar + Independent Right Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Role-Based Sidebar Navigation (Separately Scrollable) */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Right Content Area (Separately Scrollable) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white h-full overflow-y-auto">
          {/* SubHeader Actions */}
          <SubHeader
            currentRole={currentRole}
            onActionClick={handleActionClick}
            onExportReport={handleExportReport}
          />



          {/* Main Dashboard Workspace */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {renderContent()}
          </main>

          {/* Karnataka Higher Education Consortium Footer */}
          <footer className="border-t border-[#d0d7de] bg-[#ffffff] py-5 px-4 sm:px-6 mt-12 text-xs text-[#656d76]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1f2328]">Karnataka Department of Higher Education</span>
                <span>•</span>
                <span>32 State & Open Universities</span>
                <span>•</span>
                <span className="text-[#1a7f37] font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1a7f37]" />
                  K.S.U. Act 2000 Statutory Compliance
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="hover:text-[#0969da] transition-colors cursor-pointer"
                >
                  AI Copilot
                </button>
                <button
                  onClick={() => handleExportReport('Statutory Compliance Summary')}
                  className="hover:text-[#0969da] transition-colors cursor-pointer"
                >
                  Audit Reports
                </button>
                <button
                  onClick={() => {
                    resetToDefaults()
                    triggerToast('Store Reset to Default', 'Cleared local storage cache and reloaded clean seed baseline.')
                  }}
                  className="text-[#cf222e] hover:underline transition-colors cursor-pointer"
                >
                  Reset Live Store
                </button>
                <span className="text-[#8c959f]">GASB 34 / 2 CFR 200</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* AI Financial Copilot Modal */}
      <AIIntelligenceModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        currentRole={currentRole}
        onTriggerToast={triggerToast}
      />

      {/* Interactive System Flow Chart Architecture Modal */}
      <SystemFlowchartModal
        isOpen={isFlowchartModalOpen}
        onClose={() => setIsFlowchartModalOpen(false)}
        onSelectTab={setActiveTab}
      />

      {/* Quick Action Modals (when triggered from subheader) */}
      {isReallocateModalOpen && currentRole === ROLES.UNIV_FINANCE && activeTab !== 'reallocations' && (
        <ReallocationWorkflow
          onTriggerToast={triggerToast}
          isOpenModal={isReallocateModalOpen}
          onCloseModal={() => setIsReallocateModalOpen(false)}
        />
      )}

      {isProvisionUserModalOpen && currentRole === ROLES.ADMIN && activeTab !== 'users' && (
        <UserManagement
          onTriggerToast={triggerToast}
          isOpenModal={isProvisionUserModalOpen}
          onCloseModal={() => setIsProvisionUserModalOpen(false)}
        />
      )}

      {/* Floating Quick Launcher: FinBot */}
      <button
        onClick={() => setIsAIModalOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0969da] hover:bg-[#085ac5] text-white shadow-lg transition-transform hover:scale-105 cursor-pointer text-xs font-semibold select-none"
        title="Open FinBot"
      >
        <Bot className="h-4 w-4" />
        <span>FinBot</span>
      </button>

      {/* Global Toast Notifications */}
      <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
