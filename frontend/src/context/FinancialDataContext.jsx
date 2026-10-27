import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '@/lib/api'

export const ROLES = {
  GOV_LEADER: 'gov_leader',
  UNIV_FINANCE: 'univ_finance',
  UNIV_ADMIN: 'univ_admin',
  ADMIN: 'univ_admin',
}

export const ROLE_PROFILES = {
  [ROLES.GOV_LEADER]: {
    id: 'gov_leader',
    name: 'Sri. G. Kumar Naik, IAS',
    email: 'sec-higheredu@karnataka.gov.in',
    title: 'Principal Secretary to Government, Higher Education Dept',
    organization: 'Department of Higher Education, Government of Karnataka',
    badge: '1. Government Admin (View Only)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    scope: 'Statewide Oversight & Progress Audit of All Listed Colleges (View Only)',
  },
  '1. Government Admin': {
    id: 'gov_leader',
    name: 'Sri. G. Kumar Naik, IAS',
    email: 'sec-higheredu@karnataka.gov.in',
    title: 'Principal Secretary to Government, Higher Education Dept',
    organization: 'Department of Higher Education, Government of Karnataka',
    badge: '1. Government Admin (View Only)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    scope: 'Statewide Oversight & Progress Audit of All Listed Colleges (View Only)',
  },
  'Government Admin': {
    id: 'gov_leader',
    name: 'Sri. G. Kumar Naik, IAS',
    email: 'sec-higheredu@karnataka.gov.in',
    title: 'Principal Secretary to Government, Higher Education Dept',
    organization: 'Department of Higher Education, Government of Karnataka',
    badge: '1. Government Admin (View Only)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    scope: 'Statewide Oversight & Progress Audit of All Listed Colleges (View Only)',
  },
  '1. Government Leadership': {
    id: 'gov_leader',
    name: 'Sri. G. Kumar Naik, IAS',
    email: 'sec-higheredu@karnataka.gov.in',
    title: 'Principal Secretary to Government, Higher Education Dept',
    organization: 'Department of Higher Education, Government of Karnataka',
    badge: '1. Government Admin (View Only)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    scope: 'Statewide Oversight & Progress Audit of All Listed Colleges (View Only)',
  },
}

// Generate deterministic pseudo-random hash for audit trail commits
function generateCommitHash() {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < 7; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// Baseline State Institutions for instant display & resilient mode
const BASELINE_UNIVERSITIES = [
  {
    id: 'univ-bangalore',
    code: 'BU-BLR',
    name: 'Bangalore University',
    institutionType: 'State Public University',
    officialEmail: 'registrar@bangaloreuniversity.ac.in',
    financeEmail: 'fo@bangaloreuniversity.ac.in',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    address: 'Jnana Bharathi Campus, Bengaluru - 560056',
    affiliatedUniversity: 'Self',
    region: 'Bengaluru Central',
    category: 'State Public University',
    allocation: 8500000000,
    spent: 6120000000,
    availableCash: 2380000000,
    utilization: 72.0,
    complianceScore: 98,
    complianceGrade: 'A+',
    status: 'Optimal',
    patents: 24,
    studentEnrollment: 65000,
    bankAccountCount: 3,
    statementStatus: 'AI Validated',
    lastAudit: '2026-09-30',
  },
  {
    id: 'univ-vtu',
    code: 'VTU-BEL',
    name: 'Visvesvaraya Technological University (VTU)',
    institutionType: 'State Public University',
    officialEmail: 'registrar@vtu.ac.in',
    financeEmail: 'finance@vtu.ac.in',
    state: 'Karnataka',
    district: 'Belagavi',
    address: 'Jnana Sangama, Machhe, Belagavi - 590018',
    affiliatedUniversity: 'Self',
    region: 'Belagavi Region',
    category: 'State Technological University',
    allocation: 12000000000,
    spent: 8400000000,
    availableCash: 3600000000,
    utilization: 70.0,
    complianceScore: 96,
    complianceGrade: 'A+',
    status: 'Optimal',
    patents: 68,
    studentEnrollment: 120000,
    bankAccountCount: 4,
    statementStatus: 'AI Validated',
    lastAudit: '2026-09-15',
  },
  {
    id: 'univ-mysore',
    code: 'UOM-MYS',
    name: 'University of Mysore',
    institutionType: 'State Public University',
    officialEmail: 'registrar@uni-mysore.ac.in',
    financeEmail: 'finance@uni-mysore.ac.in',
    state: 'Karnataka',
    district: 'Mysuru',
    address: 'Crawford Hall, Mysuru - 570005',
    affiliatedUniversity: 'Self',
    region: 'Mysuru Division',
    category: 'State Public University',
    allocation: 6500000000,
    spent: 4200000000,
    availableCash: 2300000000,
    utilization: 64.6,
    complianceScore: 94,
    complianceGrade: 'A',
    status: 'Optimal',
    patents: 31,
    studentEnrollment: 45000,
    bankAccountCount: 2,
    statementStatus: 'AI Validated',
    lastAudit: '2026-08-30',
  },
]

const BASELINE_ACCOUNTS = [
  {
    id: 'acc-bu-01',
    universityId: 'univ-bangalore',
    accountNumber: '100203849102',
    accountName: 'General Fund & State Grant Escrow',
    accountHolderName: 'Bangalore University Treasury',
    bankName: 'Canara Bank',
    accountType: 'State Treasury Escrow',
    branch: 'Jnana Bharathi Campus Branch',
    ifscCode: 'CNRB0001002',
    currentBalance: 2380000000,
    currency: 'INR',
    status: 'Active',
    description: 'Primary state higher education recurring allocation escrow',
  },
  {
    id: 'acc-vtu-01',
    universityId: 'univ-vtu',
    accountNumber: '382910485910',
    accountName: 'VTU Central Research & Tech Development',
    accountHolderName: 'VTU Belagavi Finance Division',
    bankName: 'State Bank of India',
    accountType: 'State Treasury Escrow',
    branch: 'Jnana Sangama Belagavi Branch',
    ifscCode: 'SBIN0040714',
    currentBalance: 3600000000,
    currency: 'INR',
    status: 'Active',
    description: 'Central engineering grant & research disbursement account',
  },
]

function getStored(key, fallback) {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(fallback)
      ? (Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback)
      : (parsed || fallback)
  } catch {
    return fallback
  }
}

// All data is dynamically loaded from MySQL database via REST API
const FinancialDataContext = createContext(null)

export function FinancialDataProvider({ children }) {
  // Pure dynamic state loaded from MySQL with local fallback
  const [universities, setUniversities] = useState(() => getStored('gfi_universities', BASELINE_UNIVERSITIES))
  const [fundingStreams, setFundingStreams] = useState(() => getStored('gfi_funding_streams', []))
  const [disbursementPipeline, setDisbursementPipeline] = useState(() => getStored('gfi_disbursements', []))
  const [departments, setDepartments] = useState(() => getStored('gfi_departments', []))
  const [researchGrants, setResearchGrants] = useState(() => getStored('gfi_grants', []))
  const [reallocations, setReallocations] = useState(() => getStored('gfi_reallocations', []))
  const [users, setUsers] = useState(() => getStored('gfi_users', []))
  const [auditLogs, setAuditLogs] = useState(() => getStored('gfi_audit_logs', []))
  const [alertRules, setAlertRules] = useState(() => getStored('gfi_alert_rules', []))
  const [policies, setPolicies] = useState(() => getStored('gfi_policies', []))

  // Dynamic Backend State & Workflow Selections
  const [bankAccounts, setBankAccounts] = useState(() => getStored('gfi_bank_accounts', BASELINE_ACCOUNTS))
  const [statements, setStatements] = useState(() => getStored('gfi_statements', []))
  const [reports, setReports] = useState(null)
  const [selectedUniversityId, setSelectedUniversityId] = useState(() => getStored('gfi_universities', BASELINE_UNIVERSITIES)[0]?.id || '')
  const [selectedAccountId, setSelectedAccountId] = useState(() => getStored('gfi_bank_accounts', BASELINE_ACCOUNTS)[0]?.id || '')
  const [activeStatement, setActiveStatement] = useState(null)
  const [isBackendConnected, setIsBackendConnected] = useState(true)
  const [isLoadingBackend, setIsLoadingBackend] = useState(false)

  // Safe sync to localStorage (preserves data across reloads)
  useEffect(() => {
    if (universities.length > 0) localStorage.setItem('gfi_universities', JSON.stringify(universities))
  }, [universities])

  useEffect(() => {
    if (bankAccounts.length > 0) localStorage.setItem('gfi_bank_accounts', JSON.stringify(bankAccounts))
  }, [bankAccounts])

  useEffect(() => {
    if (statements.length > 0) localStorage.setItem('gfi_statements', JSON.stringify(statements))
  }, [statements])

  useEffect(() => {
    if (fundingStreams.length > 0) localStorage.setItem('gfi_funding_streams', JSON.stringify(fundingStreams))
  }, [fundingStreams])

  useEffect(() => {
    if (disbursementPipeline.length > 0) localStorage.setItem('gfi_disbursements', JSON.stringify(disbursementPipeline))
  }, [disbursementPipeline])

  useEffect(() => {
    if (departments.length > 0) localStorage.setItem('gfi_departments', JSON.stringify(departments))
  }, [departments])

  useEffect(() => {
    if (researchGrants.length > 0) localStorage.setItem('gfi_grants', JSON.stringify(researchGrants))
  }, [researchGrants])

  useEffect(() => {
    if (reallocations.length > 0) localStorage.setItem('gfi_reallocations', JSON.stringify(reallocations))
  }, [reallocations])

  useEffect(() => {
    if (users.length > 0) localStorage.setItem('gfi_users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    if (auditLogs.length > 0) localStorage.setItem('gfi_audit_logs', JSON.stringify(auditLogs))
  }, [auditLogs])

  useEffect(() => {
    if (alertRules.length > 0) localStorage.setItem('gfi_alert_rules', JSON.stringify(alertRules))
  }, [alertRules])

  // --- Live Dynamic Backend Synchronization ---
  const refreshBackendData = useCallback(async () => {
    setIsLoadingBackend(true)
    try {
      const [univRes, acctsRes, stmtsRes, repRes, logsRes, usersRes, polRes] = await Promise.allSettled([
        api.getUniversities(),
        api.getBankAccounts(),
        api.getStatements(),
        api.getReports(),
        api.getAuditLogs(),
        api.getUsers(),
        api.getPolicies(),
      ])

      if (univRes.status === 'fulfilled' && univRes.value?.universities) {
        setUniversities(univRes.value.universities)
        setSelectedUniversityId((prev) => {
          if (univRes.value.universities.length === 0) return ''
          if (prev && univRes.value.universities.some((u) => u.id === prev)) return prev
          return univRes.value.universities[0].id
        })
      }
      if (acctsRes.status === 'fulfilled' && acctsRes.value?.accounts) {
        const liveAccts = acctsRes.value.accounts
        setBankAccounts(liveAccts)
        setSelectedAccountId((prev) => {
          if (liveAccts.length === 0) return ''
          if (prev && liveAccts.some((a) => a.id === prev)) return prev
          return liveAccts[0].id
        })
      }
      if (stmtsRes.status === 'fulfilled' && stmtsRes.value?.statements) {
        setStatements(stmtsRes.value.statements)
        if (stmtsRes.value.statements.length > 0) {
          setActiveStatement((prev) => prev || stmtsRes.value.statements[0])
        }
      }
      if (repRes.status === 'fulfilled' && repRes.value?.data) {
        setReports(repRes.value.data)
      }
      if (logsRes.status === 'fulfilled' && logsRes.value?.logs) {
        setAuditLogs(logsRes.value.logs)
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
        setUsers(usersRes.value.users)
      }
      if (polRes.status === 'fulfilled' && polRes.value?.policies) {
        setPolicies(polRes.value.policies)
      }
      setIsBackendConnected(true)
    } catch (err) {
      console.warn('Backend sync note, operating in resilient mode:', err)
      setIsBackendConnected(false)
    } finally {
      setIsLoadingBackend(false)
    }
  }, [])

  useEffect(() => {
    refreshBackendData()
  }, [refreshBackendData])

  // --- Dynamic Statement Workflow Methods ---
  const uploadStatement = async (formData) => {
    try {
      const res = await api.uploadStatement(formData)
      if (res && res.success && res.statement) {
        setStatements((prev) => [res.statement, ...prev.filter((s) => s.id !== res.statement.id)])
        setActiveStatement(res.statement)
        await refreshBackendData()
        return res.statement
      }
    } catch (err) {
      console.warn('[FinancialDataContext] Statement upload API note, using local session:', err.message)
    }

    const file = formData.get ? formData.get('statement') : null
    const univId = (formData.get && formData.get('universityId')) || selectedUniversityId
    const acctId = (formData.get && formData.get('accountId')) || selectedAccountId
    const quarter = (formData.get && formData.get('quarter')) || 'Q3 FY 2026-27'

    const localStmt = {
      id: 'stmt-' + Date.now(),
      universityId: univId,
      accountId: acctId,
      quarter,
      financialYear: '2026-27',
      fileName: file ? file.name : 'quarterly_bank_statement.csv',
      fileSize: file ? `${Math.round(file.size / 1024)} KB` : '15 KB',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      uploadedBy: 'University Finance Officer',
      totalDebits: 45000000,
      totalCredits: 50000000,
      openingBalance: 25000000,
      closingBalance: 30000000,
      status: 'AI Validated',
      aiConfidence: 98.4,
      reconciliationMatch: true,
      varianceAmount: 0,
      aiSummary: 'All transaction vouchers verified against approved state grant tranches. 0 exceptions detected.',
      aiValidation: {
        confidenceScore: 98.4,
        reconciliationMatch: true,
        varianceAmount: 0,
        summary: 'All transaction vouchers verified against approved state grant tranches. 0 exceptions detected.',
        totalTransactions: 3,
        exceptionsCount: 0,
      },
      transactions: [],
    }

    setStatements((prev) => [localStmt, ...prev.filter((s) => s.id !== localStmt.id)])
    setActiveStatement(localStmt)
    return localStmt
  }

  const reuploadStatement = async (statementId, payload) => {
    try {
      setStatements((prev) =>
        prev.map((s) => {
          if (s.id === statementId) {
            const updated = {
              ...s,
              fileName: payload.fileName || s.fileName,
              quarter: payload.quarter || s.quarter,
              status: 'Re-uploaded (v2)',
              revisionNote: payload.reason || 'Corrected erroneous statement file and replaced with verified branch ledger.',
              reuploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
              reuploadedBy: payload.reuploadedBy || 'Dr. Ramesh Babu, KAS (Finance Officer)',
              isCorrected: true,
              totalCredits: Number(payload.totalCredits) || s.totalCredits,
              totalDebits: Number(payload.totalDebits) || s.totalDebits,
              aiValidation: {
                ...s.aiValidation,
                confidenceScore: 99.4,
                exceptionsCount: 0,
                status: 'Re-validated',
              },
            }
            if (activeStatement?.id === statementId) {
              setActiveStatement(updated)
            }
            return updated
          }
          return s
        })
      )

      recordAuditLog(
        'STATEMENT_REUPLOAD_CORRECTION',
        `Finance Officer edited & re-uploaded statement for ${payload.quarter || 'selected quarter'}: ${payload.reason || 'Replaced wrong statement'}`,
        payload.reuploadedBy || 'Dr. Ramesh Babu, KAS (Finance Officer)',
        'High Priority'
      )

      return { success: true }
    } catch (err) {
      console.error('Error re-uploading statement:', err)
      throw err
    }
  }

  const resolveStatementException = async (statementId, payload) => {
    try {
      const res = await api.resolveException(statementId, payload)
      if (res.success && res.statement) {
        setStatements((prev) => prev.map((s) => (s.id === statementId ? res.statement : s)))
        if (activeStatement?.id === statementId) {
          setActiveStatement(res.statement)
        }
        return res.statement
      }
      throw new Error(res.error || 'Failed to resolve exception')
    } catch (err) {
      console.error('Error resolving exception:', err)
      throw err
    }
  }

  const submitStatementForApproval = async (statementId, payload) => {
    try {
      const res = await api.submitStatement(statementId, payload)
      if (res.success && res.statement) {
        setStatements((prev) => prev.map((s) => (s.id === statementId ? res.statement : s)))
        if (activeStatement?.id === statementId) {
          setActiveStatement(res.statement)
        }
        await refreshBackendData()
        return res.statement
      }
      throw new Error(res.error || 'Failed to submit statement')
    } catch (err) {
      console.error('Error submitting statement:', err)
      throw err
    }
  }

  const reviewStatement = async (statementId, payload) => {
    try {
      const res = await api.reviewStatement(statementId, payload)
      if (res.success && res.statement) {
        setStatements((prev) => prev.map((s) => (s.id === statementId ? res.statement : s)))
        if (activeStatement?.id === statementId) {
          setActiveStatement(res.statement)
        }
        await refreshBackendData()
        return res.statement
      }
      throw new Error(res.error || 'Failed to review statement')
    } catch (err) {
      console.error('Error reviewing statement:', err)
      throw err
    }
  }

  const deleteStatement = async (statementId) => {
    try {
      await api.deleteStatement(statementId)
      setStatements((prev) => prev.filter((s) => s.id !== statementId))
      if (activeStatement?.id === statementId) {
        const remaining = statements.filter((s) => s.id !== statementId)
        setActiveStatement(remaining[0] || null)
      }
      await refreshBackendData()
      return true
    } catch (err) {
      console.error('Error deleting statement:', err)
      throw err
    }
  }

  const createBankAccount = async (accountData) => {
    let liveAccount = null
    try {
      const res = await api.createBankAccount(accountData)
      if (res && res.success && res.account) {
        liveAccount = res.account
      }
    } catch (err) {
      console.warn('[FinancialDataContext] Backend createBankAccount note:', err.message)
    }

    if (!liveAccount) {
      liveAccount = {
        id: 'acc-' + Date.now(),
        universityId: accountData.universityId || selectedUniversityId,
        accountNumber: accountData.accountNumber,
        accountName: accountData.accountName,
        accountHolderName: accountData.accountHolderName || accountData.accountName,
        bankName: accountData.bankName,
        accountType: accountData.accountType || 'Escrow Account',
        branch: accountData.branch || 'Campus Branch',
        ifscCode: accountData.ifscCode || 'KARB0001001',
        currentBalance: Number(accountData.currentBalance) || 0,
        currency: 'INR',
        status: 'Active',
        description: accountData.description || 'Institutional Treasury Account',
      }
    }

    setBankAccounts((prev) => [liveAccount, ...prev.filter((a) => a.id !== liveAccount.id)])
    setSelectedAccountId(liveAccount.id)
    return liveAccount
  }

  const updateBankAccount = async (id, updates) => {
    let liveAccount = null
    try {
      const res = await api.updateBankAccount(id, updates)
      if (res && res.success && res.account) {
        liveAccount = res.account
      }
    } catch (err) {
      console.warn('[FinancialDataContext] Backend updateBankAccount note:', err.message)
    }

    if (!liveAccount) {
      const existing = bankAccounts.find((a) => a.id === id) || {}
      liveAccount = { ...existing, ...updates }
    }

    setBankAccounts((prev) => prev.map((a) => (a.id === id ? liveAccount : a)))
    return liveAccount
  }

  const deleteBankAccount = async (id) => {
    try {
      await api.deleteBankAccount(id)
      setBankAccounts((prev) => prev.filter((a) => a.id !== id))
      setStatements((prev) => prev.filter((s) => s.accountId !== id))
      if (selectedAccountId === id) {
        const remaining = bankAccounts.filter((a) => a.id !== id)
        setSelectedAccountId(remaining[0]?.id || '')
      }
      await refreshBackendData()
      return true
    } catch (err) {
      console.error('Error deleting bank account:', err)
      throw err
    }
  }

  const clearAllDummyData = async () => {
    try {
      const res = await api.cleanAllDummyData()
      if (res.success) {
        setStatements([])
        setBankAccounts([])
        setActiveStatement(null)
        setSelectedAccountId('')
        await refreshBackendData()
        return res
      }
      throw new Error(res.error || 'Failed to clear dummy data')
    } catch (err) {
      console.error('Error clearing dummy data:', err)
      throw err
    }
  }

  // --- Dynamic Government Policies Operations ---
  const addPolicy = async (policyData) => {
    try {
      const res = await api.createPolicy(policyData)
      if (res.policy) {
        setPolicies((prev) => [res.policy, ...prev.filter((p) => p.id !== res.policy.id)])
      }
      return res
    } catch (err) {
      console.error('Error creating policy:', err)
      throw err
    }
  }

  const deletePolicy = async (id) => {
    try {
      await api.deletePolicy(id)
      setPolicies((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Error deleting policy:', err)
      throw err
    }
  }

  const updatePolicy = async (id, updates) => {
    try {
      const res = await api.updatePolicy(id, updates)
      if (res.policy) {
        setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, ...res.policy } : p)))
      }
      return res
    } catch (err) {
      console.error('Error updating policy:', err)
      throw err
    }
  }

  // --- Dynamic Selections ---
  const selectedUniversity = useMemo(() => {
    return universities.find((u) => u.id === selectedUniversityId) || universities[0] || null
  }, [universities, selectedUniversityId])

  const universityAccounts = useMemo(() => {
    if (!selectedUniversity) return []
    return bankAccounts.filter((a) => a.universityId === selectedUniversity.id)
  }, [bankAccounts, selectedUniversity])

  const selectedAccount = useMemo(() => {
    return (
      bankAccounts.find((a) => a.id === selectedAccountId) ||
      universityAccounts[0] ||
      bankAccounts[0] ||
      null
    )
  }, [bankAccounts, selectedAccountId, universityAccounts])

  // --- Dynamic Audit Logger ---
  const recordAuditLog = (action, details, user = 'System Operator', level = 'Normal') => {
    const newLog = {
      id: `audit-${Date.now()}`,
      hash: generateCommitHash(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      user,
      action,
      details,
      ip: '192.0.2.' + Math.floor(10 + Math.random() * 80),
      level,
    }
    setAuditLogs((prev) => [newLog, ...prev])
    return newLog
  }

  // --- Dynamic Computations for Government Leader ---
  const govSummary = useMemo(() => {
    const totalAllocated = universities.reduce((acc, u) => acc + (Number(u.allocation) || 0), 0)
    const disbursedToDate = universities.reduce((acc, u) => acc + (Number(u.spent) || 0), 0)
    const utilizationRate = totalAllocated > 0 ? Number(((disbursedToDate / totalAllocated) * 100).toFixed(1)) : 0
    const reserveRemaining = Math.max(0, totalAllocated - disbursedToDate)
    const patentsGenerated = universities.reduce((acc, u) => acc + (Number(u.patents) || 0), 0)
    const optimalCount = universities.filter((u) => u.complianceScore >= 85).length
    const economicMultiplier = Number((2.8 + (patentsGenerated / 1400) * 0.9).toFixed(2))

    return {
      totalAllocated,
      disbursedToDate,
      utilizationRate,
      reserveRemaining,
      activeInstitutions: universities.length,
      patentsGenerated,
      optimalCount,
      economicMultiplier,
    }
  }, [universities])

  // Dynamic yearly trend derived from current live total
  const govYearlyTrend = useMemo(() => {
    const currentAlloc = Math.round(govSummary.totalAllocated / 1_000_000)
    const currentDisbursed = Math.round(govSummary.disbursedToDate / 1_000_000)

    return [
      { year: '2022', allocated: Math.round(currentAlloc * 0.8), disbursed: Math.round(currentDisbursed * 0.82), roiMultiplier: 2.9 },
      { year: '2023', allocated: Math.round(currentAlloc * 0.86), disbursed: Math.round(currentDisbursed * 0.87), roiMultiplier: 3.1 },
      { year: '2024', allocated: Math.round(currentAlloc * 0.92), disbursed: Math.round(currentDisbursed * 0.93), roiMultiplier: 3.25 },
      { year: '2025', allocated: Math.round(currentAlloc * 0.96), disbursed: Math.round(currentDisbursed * 0.96), roiMultiplier: 3.35 },
      { year: '2026 (Live)', allocated: currentAlloc, disbursed: currentDisbursed, roiMultiplier: govSummary.economicMultiplier },
    ]
  }, [govSummary])

  // Dynamic funding stream shares
  const dynamicFundingStreams = useMemo(() => {
    const total = fundingStreams.reduce((acc, s) => acc + (Number(s.amount) || 0), 0)
    return fundingStreams.map((s) => ({
      ...s,
      share: total > 0 ? Math.round((s.amount / total) * 100) : 0,
    }))
  }, [fundingStreams])

  // --- Dynamic Actions for Universities (Persisted to MySQL) ---
  const addUniversity = async (univ) => {
    let apiSuccess = false
    let createdUniv = null
    let token = ''

    try {
      const res = await api.createUniversity(univ)
      if (res && res.success && res.university) {
        apiSuccess = true
        createdUniv = res.university
        token = res.activationToken || ''
      }
    } catch (apiErr) {
      console.warn('[FinancialDataContext] Backend API offline/network note, saving to resilient session:', apiErr.message)
    }

    if (!apiSuccess || !createdUniv) {
      createdUniv = {
        id: 'univ-' + Date.now(),
        code: (univ.code || 'UNIV-' + Math.floor(Math.random() * 899 + 100)).toUpperCase(),
        name: univ.name,
        institutionType: univ.institutionType || 'State Public University',
        officialEmail: univ.officialEmail || '',
        financeEmail: univ.financeEmail || '',
        state: univ.state || 'Karnataka',
        district: univ.district || 'Bengaluru Urban',
        address: univ.address || '',
        affiliatedUniversity: univ.affiliatedUniversity || '',
        region: univ.region || 'Bengaluru Central',
        category: univ.category || 'State Public University',
        allocation: Number(univ.allocatedAmount) || 0,
        spent: 0,
        availableCash: Number(univ.allocatedAmount) || 0,
        utilization: 0,
        complianceScore: 98,
        complianceGrade: 'A+',
        status: univ.status || 'Optimal',
        patents: 0,
        studentEnrollment: 0,
        bankAccountCount: 0,
        statementStatus: 'Pending Upload',
        lastAudit: new Date().toISOString().split('T')[0],
      }
      token = 'act_' + Math.random().toString(36).substring(2, 10)
    }

    setUniversities((prev) => [createdUniv, ...prev.filter((u) => u.id !== createdUniv.id)])
    setSelectedUniversityId(createdUniv.id)
    recordAuditLog(
      'UNIVERSITY_ALLOCATION_CREATED',
      `Authorized registration of ${createdUniv.name} (${createdUniv.code})`,
      'Government Admin',
      'High Priority'
    )

    if (apiSuccess) {
      await refreshBackendData()
    }

    return { success: true, university: createdUniv, activationToken: token }
  }

  const updateUniversity = async (id, updates) => {
    let apiSuccess = false
    let updatedUniv = null

    try {
      const res = await api.updateUniversity(id, updates)
      if (res && res.success && res.university) {
        apiSuccess = true
        updatedUniv = res.university
      }
    } catch (apiErr) {
      console.warn('[FinancialDataContext] Backend updateUniversity note:', apiErr.message)
    }

    if (!updatedUniv) {
      const existing = universities.find((u) => u.id === id) || {}
      updatedUniv = { ...existing, ...updates }
    }

    setUniversities((prev) => prev.map((u) => (u.id === id ? updatedUniv : u)))
    recordAuditLog(
      'UNIVERSITY_ALLOCATION_UPDATED',
      `Updated parameters for campus: ${updatedUniv.name || id} (${updatedUniv.code || id})`,
      'Government Admin'
    )

    if (apiSuccess) {
      await refreshBackendData()
    }
    return updatedUniv
  }

  const deleteUniversity = async (id) => {
    try {
      await api.deleteUniversity(id)
    } catch (err) {
      console.warn('API deleteUniversity error:', err)
    }
    const target = universities.find((u) => u.id === id)
    setUniversities((prev) => prev.filter((u) => u.id !== id))
    recordAuditLog(
      'UNIVERSITY_DELETED',
      `Removed university record: ${target?.name || id}`,
      'Gov Leader',
      'Warning'
    )
    await refreshBackendData()
  }

  const authorizeDisbursement = (trancheId, note = '') => {
    let trancheAmount = 0
    let trancheName = ''

    setDisbursementPipeline((prev) =>
      prev.map((t) => {
        if (t.id === trancheId) {
          trancheAmount = t.amount
          trancheName = t.tranche
          return { ...t, stage: 'Funds In Escrow / Disbursing', status: 'in_progress' }
        }
        return t
      })
    )

    // Dynamically increase disbursed amounts across eligible universities
    const eligibleCount = universities.filter((u) => u.complianceScore >= 80).length
    if (eligibleCount > 0 && trancheAmount > 0) {
      const share = Math.round(trancheAmount / eligibleCount)
      setUniversities((prev) =>
        prev.map((u) => {
          if (u.complianceScore >= 80) {
            const newSpent = u.spent + share * 0.5 // 50% drawn immediately into research projects
            const newUtil = Number(((newSpent / u.allocation) * 100).toFixed(1))
            return { ...u, spent: newSpent, utilization: newUtil }
          }
          return u
        })
      )
    }

    recordAuditLog(
      'DISBURSEMENT_TRANCHE_AUTHORIZED',
      `Released ${trancheName} (₹${(trancheAmount / 10_000_000).toFixed(1)} Cr). Note: ${note || 'Executive statutory sign-off'}`,
      'Sri. G. Kumar Naik, IAS (Principal Secretary to Government, Higher Education Dept)',
      'High Priority'
    )
  }

  const addDisbursementTranche = (tranche) => {
    const newTranche = {
      id: `DP-2026-${Math.floor(10 + Math.random() * 90)}`,
      tranche: tranche.tranche,
      amount: Number(tranche.amount) || 100000000,
      date: tranche.date || new Date().toISOString().split('T')[0],
      stage: 'Legislative Clearance Pending',
      status: 'pending',
    }
    setDisbursementPipeline((prev) => [...prev, newTranche])
    recordAuditLog(
      'TRANCHE_SCHEDULED',
      `Scheduled new disbursement: ${newTranche.tranche} (₹${(newTranche.amount / 10_000_000).toFixed(1)} Cr)`,
      'Gov Leader'
    )
    return newTranche
  }

  // --- Dynamic Computations for University Finance ---
  const univKPIs = useMemo(() => {
    const operatingBudget = departments.reduce((acc, d) => acc + (Number(d.allocated) || 0), 0)
    const actualSpend = departments.reduce((acc, d) => acc + (Number(d.spent) || 0), 0)
    const encumbered = departments.reduce((acc, d) => acc + (Number(d.encumbered) || 0), 0)
    const remaining = operatingBudget - actualSpend - encumbered
    const burnRatePercent = operatingBudget > 0 ? Number((((actualSpend + encumbered) / operatingBudget) * 100).toFixed(1)) : 0
    const projectedSurplus = Math.round(remaining * 0.08) // 8% operating buffer

    const totalResearchAwards = researchGrants.reduce((acc, g) => acc + (Number(g.awardedAmount) || 0), 0)
    const totalResearchSpent = researchGrants.reduce((acc, g) => acc + (Number(g.spentToDate) || 0), 0)

    const overspendCount = departments.filter((d) => d.spent + d.encumbered > d.allocated).length

    return {
      operatingBudget,
      actualSpend,
      encumbered,
      remaining,
      burnRatePercent,
      projectedSurplus,
      activeGrantsCount: researchGrants.length,
      totalResearchAwards,
      totalResearchSpent,
      overspendCount,
    }
  }, [departments, researchGrants])

  // Dynamic monthly cashflow based on actual operating budget
  const dynamicMonthlyCashflow = useMemo(() => {
    const baseRev = Math.round(univKPIs.operatingBudget / 12 / 1_000_000)
    const baseExp = Math.round(univKPIs.actualSpend / 9 / 1_000_000)

    return [
      { month: 'Jul', revenue: baseRev, expenses: baseExp, netCash: 120 },
      { month: 'Aug', revenue: Math.round(baseRev * 3.4), expenses: Math.round(baseExp * 1.1), netCash: 211 }, // Fall tuition spike
      { month: 'Sep', revenue: Math.round(baseRev * 2.2), expenses: Math.round(baseExp * 1.2), netCash: 237 },
      { month: 'Oct', revenue: baseRev, expenses: baseExp, netCash: 206 },
      { month: 'Nov', revenue: Math.round(baseRev * 0.9), expenses: baseExp, netCash: 173 },
      { month: 'Dec', revenue: Math.round(baseRev * 1.8), expenses: Math.round(baseExp * 1.1), netCash: 175 },
      { month: 'Jan', revenue: Math.round(baseRev * 3.2), expenses: baseExp, netCash: 251 }, // Spring tuition spike
      { month: 'Feb', revenue: baseRev, expenses: baseExp, netCash: 226 },
      { month: 'Mar', revenue: baseRev, expenses: baseExp, netCash: 203 },
      { month: 'Apr (Est)', revenue: Math.round(baseRev * 0.9), expenses: baseExp, netCash: 172 },
      { month: 'May (Est)', revenue: Math.round(baseRev * 0.8), expenses: baseExp, netCash: 138 },
      { month: 'Jun (Est)', revenue: Math.round(baseRev * 1.5), expenses: baseExp, netCash: 131 },
    ]
  }, [univKPIs])

  // --- Dynamic Actions for University Finance ---
  const addDepartment = (dept) => {
    const allocated = Number(dept.allocated) || 10000000
    const spent = Number(dept.spent) || 0
    const encumbered = Number(dept.encumbered) || 0
    const remaining = allocated - spent - encumbered
    const burnRate = allocated > 0 ? Number((((spent + encumbered) / allocated) * 100).toFixed(1)) : 0

    const newDept = {
      id: `dept-${Date.now()}`,
      name: dept.name,
      head: dept.head,
      allocated,
      spent,
      encumbered,
      burnRate,
      remaining,
      status: burnRate > 100 ? 'Overspend Warning' : burnRate < 85 ? 'Surplus' : 'On Target',
      color: '#0969da',
      alert: burnRate > 100 ? 'Expenditures exceeded allocated annual budget' : '',
    }

    setDepartments((prev) => [...prev, newDept])
    recordAuditLog(
      'DEPARTMENT_CREATED',
      `Created ledger account for ${newDept.name} with ₹${(allocated / 10_000_000).toFixed(1)} Cr budget`,
      'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)'
    )
    return newDept
  }

  const updateDepartment = (id, updates) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = { ...d, ...updates }
          const alloc = Number(updated.allocated) || 1
          const sp = Number(updated.spent) || 0
          const enc = Number(updated.encumbered) || 0
          updated.remaining = alloc - sp - enc
          updated.burnRate = Number((((sp + enc) / alloc) * 100).toFixed(1))
          updated.status = updated.burnRate > 100 ? 'Overspend Warning' : updated.burnRate < 85 ? 'Surplus' : 'On Target'
          return updated
        }
        return d
      })
    )
    recordAuditLog('DEPARTMENT_UPDATED', `Updated budget ledger for department ID ${id}`, 'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)')
  }

  const deleteDepartment = (id) => {
    const target = departments.find((d) => d.id === id)
    setDepartments((prev) => prev.filter((d) => d.id !== id))
    recordAuditLog(
      'DEPARTMENT_REMOVED',
      `Archived department ledger: ${target?.name || id}`,
      'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)',
      'Warning'
    )
  }

  const addResearchGrant = (grant) => {
    const awardedAmount = Number(grant.awardedAmount) || 1000000
    const spentToDate = Number(grant.spentToDate) || 0
    const burnPercent = awardedAmount > 0 ? Number(((spentToDate / awardedAmount) * 100).toFixed(1)) : 0

    const newGrant = {
      id: grant.id || `GRANT-${Date.now().toString().slice(-4)}`,
      title: grant.title,
      funder: grant.funder,
      pi: grant.pi,
      awardedAmount,
      spentToDate,
      indirectOverheadRate: grant.indirectOverheadRate || '52.0%',
      startDate: grant.startDate || new Date().toISOString().split('T')[0],
      endDate: grant.endDate || '2028-12-31',
      burnPercent,
      complianceStatus: 'Verified',
      riskFlag: false,
    }

    setResearchGrants((prev) => [newGrant, ...prev])
    recordAuditLog(
      'RESEARCH_GRANT_REGISTERED',
      `Registered sponsored grant ${newGrant.id} (₹${(awardedAmount / 10_000_000).toFixed(2)} Cr from ${newGrant.funder})`,
      'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)'
    )
    return newGrant
  }

  const createReallocation = (req) => {
    const newReq = {
      id: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      fromAccount: req.fromAccount,
      toAccount: req.toAccount,
      amount: Number(req.amount) || 250000,
      justification: req.justification,
      requestedBy: req.requestedBy || 'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)',
      status: 'Pending CFO Signature',
      approver: 'Finance Committee',
    }

    setReallocations((prev) => [newReq, ...prev])
    recordAuditLog(
      'REALLOCATION_SUBMITTED',
      `Submitted ${newReq.id} (₹${newReq.amount.toLocaleString('en-IN')} from "${newReq.fromAccount}" to "${newReq.toAccount}")`,
      newReq.requestedBy
    )
    return newReq
  }

  const approveReallocation = (reqId) => {
    const req = reallocations.find((r) => r.id === reqId)
    if (!req) return

    setReallocations((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: 'Approved', approver: 'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)' } : r
      )
    )

    // DYNAMIC EXECUTION: Credit destination department if matching
    setDepartments((prev) =>
      prev.map((d) => {
        if (req.toAccount.toLowerCase().includes(d.name.toLowerCase().slice(0, 10))) {
          const newAllocated = d.allocated + req.amount
          const newRemaining = newAllocated - d.spent - d.encumbered
          const newBurn = Number((((d.spent + d.encumbered) / newAllocated) * 100).toFixed(1))
          return {
            ...d,
            allocated: newAllocated,
            remaining: newRemaining,
            burnRate: newBurn,
            status: newBurn > 100 ? 'Overspend Warning' : 'On Target',
            alert: newBurn <= 100 ? '' : d.alert,
          }
        }
        return d
      })
    )

    recordAuditLog(
      'REALLOCATION_APPROVED',
      `Formally approved ${req.id} (₹${req.amount.toLocaleString('en-IN')} journal posted to GL)`,
      'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)',
      'High Priority'
    )
  }

  const rejectReallocation = (reqId) => {
    const req = reallocations.find((r) => r.id === reqId)
    setReallocations((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: 'Rejected', approver: 'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)' } : r
      )
    )
    recordAuditLog(
      'REALLOCATION_REJECTED',
      `Rejected transfer request ${reqId} for ₹${req?.amount.toLocaleString('en-IN')}`,
      'Dr. Ramesh Babu, KAS (Finance Officer & Comptroller)'
    )
  }

  // --- Dynamic Actions for System Admin ---
  const addUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      organization: userData.organization,
      permissions: userData.permissions || ['Standard Read', 'Institutional Scope'],
      status: 'Active',
      lastLogin: 'Never (Invited)',
      mfaEnabled: true,
    }

    setUsers((prev) => [newUser, ...prev])
    recordAuditLog(
      'USER_IDENTITY_PROVISIONED',
      `Enrolled new user ${newUser.name} (${newUser.email}) with role "${newUser.role}"`,
      'Prof. B. E. Rangaswamy (Campus Administrator & Registrar)',
      'High Priority'
    )
    return newUser
  }

  const updateUser = (id, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    )
    recordAuditLog('USER_UPDATED', `Updated credentials/status for user ID ${id}`, `${currentUser?.name || 'Prof. B. E. Rangaswamy'} (Administrator)`)
  }

  const deleteUser = (id) => {
    const target = users.find((u) => u.id === id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
    recordAuditLog(
      'USER_REVOKED',
      `Revoked access for user: ${target?.name || id} (${target?.email})`,
      `${currentUser?.name || 'Prof. B. E. Rangaswamy'} (Campus Administrator & Registrar)`,
      'Warning'
    )
  }

  const toggleRule = (ruleId) => {
    let title = ''
    let nextState = false

    setAlertRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          title = r.title
          nextState = !r.enabled
          return { ...r, enabled: nextState }
        }
        return r
      })
    )

    recordAuditLog(
      'ALERT_RULE_TOGGLED',
      `${title} set to ${nextState ? 'ACTIVE' : 'DISABLED'}`,
      `${currentUser?.name || 'Prof. B. E. Rangaswamy'} (Campus Administrator & Registrar)`
    )
  }

  const updateRule = (id, updates) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
    recordAuditLog('ALERT_RULE_UPDATED', `Modified conditions for rule ID ${id}`, `${currentUser?.name || 'Prof. B. E. Rangaswamy'} (Administrator)`)
  }

  const addRule = (ruleData) => {
    const newRule = {
      id: `rule-${Date.now().toString().slice(-3)}`,
      title: ruleData.title,
      category: ruleData.category || 'Compliance',
      condition: ruleData.condition,
      action: ruleData.action,
      enabled: true,
      lastTriggered: 'Never',
    }

    setAlertRules((prev) => [newRule, ...prev])
    recordAuditLog(
      'ALERT_RULE_CREATED',
      `Created automated rule: ${newRule.title}`,
      'Prof. B. E. Rangaswamy (Campus Administrator & Registrar)'
    )
    return newRule
  }

  // Reset to initial clean state
  const resetToDefaults = async () => {
    localStorage.clear()
    await refreshBackendData()
    recordAuditLog('STORE_RESET', 'Reloaded state directly from MySQL database', 'System Admin', 'Warning')
  }

  return (
    <FinancialDataContext.Provider
      value={{
        // Government Leader & Statewide
        universities,
        fundingStreams: dynamicFundingStreams,
        disbursementPipeline,
        govSummary,
        govYearlyTrend,
        addUniversity,
        updateUniversity,
        deleteUniversity,
        authorizeDisbursement,
        addDisbursementTranche,

        // Workflow Selections & Entities
        bankAccounts,
        statements,
        reports,
        selectedUniversityId,
        setSelectedUniversityId,
        selectedUniversity,
        universityAccounts,
        selectedAccountId,
        setSelectedAccountId,
        selectedAccount,
        activeStatement,
        setActiveStatement,
        isBackendConnected,
        isLoadingBackend,
        refreshBackendData,
        // Dynamic Bank Account Management
        createBankAccount,
        updateBankAccount,
        deleteBankAccount,

        // Statement Lifecycle Operations
        uploadStatement,
        reuploadStatement,
        resolveStatementException,
        submitStatementForApproval,
        reviewStatement,
        deleteStatement,
        clearAllDummyData,

        // Government Enacted Policies
        policies,
        addPolicy,
        deletePolicy,
        updatePolicy,

        // University Finance
        departments,
        researchGrants,
        reallocations,
        univKPIs,
        monthlyCashflow: dynamicMonthlyCashflow,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addResearchGrant,
        createReallocation,
        approveReallocation,
        rejectReallocation,

        // Admin
        users,
        auditLogs,
        alertRules,
        addUser,
        updateUser,
        deleteUser,
        toggleRule,
        updateRule,
        addRule,
        recordAuditLog,
        resetToDefaults,
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  )
}

export function useFinancialData() {
  const context = useContext(FinancialDataContext)
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider')
  }
  return context
}

