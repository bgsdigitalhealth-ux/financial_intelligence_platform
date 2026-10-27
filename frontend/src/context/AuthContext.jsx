import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { ROLES } from '@/data/mockFinancialData'

export { ROLES }

// Default baseline role details (overwritten dynamically by MySQL on load)
export const ROLE_DETAILS = {
  [ROLES.GOV_LEADER]: {
    id: ROLES.GOV_LEADER,
    roleNumber: 1,
    title: '1. Government Admin',
    shortTitle: 'Government Admin',
    tag: 'Department of Higher Education (Principal Secretary)',
    badge: 'Government Admin (View Only)',
    badgeVariant: 'primary',
    scopeDescription: 'Statewide higher education oversight, view-only progress tracking of all 32 Karnataka colleges, comprehensive reports, multi-bank treasury, and statutory audit monitoring.',
    accentColor: '#0969da',
    iconName: 'Landmark',
  },
  [ROLES.UNIV_FINANCE]: {
    id: ROLES.UNIV_FINANCE,
    roleNumber: 2,
    title: '2. College/University Finance',
    shortTitle: 'College/University Finance',
    tag: 'Finance Officer & Comptroller (University Staff)',
    badge: 'University CFO',
    badgeVariant: 'success',
    scopeDescription: 'Institutional general ledger, bank accounts, quarterly statement upload, AI transaction validation, exception resolution, and compliance submission.',
    accentColor: '#1a7f37',
    iconName: 'Building2',
  },
  [ROLES.UNIV_ADMIN]: {
    id: ROLES.UNIV_ADMIN,
    roleNumber: 3,
    title: '3. College/University Admin',
    shortTitle: 'College/University Admin',
    tag: 'Institution Administrator & Campus Registrar',
    badge: 'University Admin',
    badgeVariant: 'purple',
    scopeDescription: 'Campus institution administration, staff & user RBAC directory, ERP gateway integration (Banner/SAP/Tally), immutable SHA-256 audit journal, and automated fiscal alert rules.',
    accentColor: '#8250df',
    iconName: 'ShieldCheck',
  },
  admin: {
    id: 'univ_admin',
    roleNumber: 3,
    title: '3. College/University Admin',
    shortTitle: 'College/University Admin',
    tag: 'Institution Administrator & Campus Registrar',
    badge: 'University Admin',
    badgeVariant: 'purple',
    scopeDescription: 'Campus institution administration, staff & user RBAC directory, ERP gateway integration (Banner/SAP/Tally), immutable SHA-256 audit journal, and automated fiscal alert rules.',
    accentColor: '#8250df',
    iconName: 'ShieldCheck',
  },
}

// Baseline Government Admin account used while backend initializes
export const REGISTERED_ACCOUNTS = [
  {
    id: 'usr-gov-01',
    email: 'sec-higheredu@karnataka.gov.in',
    password: 'password123',
    name: 'Sri. G. Kumar Naik, IAS',
    roleTitle: 'Principal Secretary to Government, Dept of Higher Education',
    organization: 'Department of Higher Education, Government of Karnataka',
    primaryRole: ROLES.GOV_LEADER,
    roleLabel: '1. Government Admin',
    authorizedRoles: [ROLES.GOV_LEADER],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    permissions: ['Statewide Progress Oversight (All Colleges)', 'All Reports & Filings (View Only)', 'Statutory Compliance Audit (Read-Only)'],
    badge: 'Government Admin (View Only)',
  },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Dynamic Roles & Users loaded directly from MySQL via REST API
  const [dynamicRoles, setDynamicRoles] = useState([])
  const [dynamicUsers, setDynamicUsers] = useState(REGISTERED_ACCOUNTS)
  const [isLoadingAuthData, setIsLoadingAuthData] = useState(true)

  // Load session from localStorage if present
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gfi_auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const saved = localStorage.getItem('gfi_auth_role')
      return saved || null
    } catch {
      return null
    }
  })

  // Synchronize Roles and Users from MySQL
  const refreshAuthData = useCallback(async () => {
    setIsLoadingAuthData(true)
    try {
      const [rolesRes, usersRes] = await Promise.allSettled([
        api.getRoles(),
        api.getUsers(),
      ])

      if (rolesRes.status === 'fulfilled' && rolesRes.value?.roles) {
        setDynamicRoles(rolesRes.value.roles)
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
        const formatted = usersRes.value.users.map((u) => ({
          id: u.id,
          email: u.email,
          password: 'password123',
          name: u.name,
          roleTitle: u.roleTitle,
          organization: u.organization,
          primaryRole: u.primaryRole,
          roleLabel: u.roleFullTitle || u.roleTitle,
          authorizedRoles: u.authorizedRoles || [u.primaryRole],
          avatar: u.avatar,
          badge: u.badge || 'Staff',
          badgeVariant: u.badgeVariant || 'primary',
          universityId: u.universityId,
        }))
        setDynamicUsers(formatted)
      }
    } catch (err) {
      console.warn('[AuthContext] Note loading MySQL auth records:', err)
    } finally {
      setIsLoadingAuthData(false)
    }
  }, [])

  useEffect(() => {
    refreshAuthData()
  }, [refreshAuthData])

  // Request 4-digit mock OTP for registered email
  const requestOtp = async (email, universityList = []) => {
    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' }
    }

    try {
      const res = await api.sendOtp(cleanEmail)
      if (res && res.success && res.otp) {
        return {
          success: true,
          otp: res.otp,
          message: res.message || `4-digit mock OTP sent to ${cleanEmail}`,
          recipientName: res.recipientName,
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Backend OTP send fallback:', err)
    }

    // Client-side fallback if backend API is offline
    const isKnownUser = dynamicUsers.some((u) => u.email.toLowerCase() === cleanEmail)
    const isKnownUniv = (universityList || []).some(
      (u) =>
        (u.financeEmail && u.financeEmail.toLowerCase() === cleanEmail) ||
        (u.officialEmail && u.officialEmail.toLowerCase() === cleanEmail)
    )
    const isGov = cleanEmail.includes('sec-higheredu') || cleanEmail.includes('karnataka.gov') || cleanEmail.includes('admin')

    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString()
    return {
      success: true,
      otp: mockOtp,
      message: `4-digit mock OTP generated for ${cleanEmail}`,
      isRecognized: isKnownUser || isKnownUniv || isGov,
    }
  }

  // Authenticate user via 4-digit OTP or credentials (no password required)
  const authenticate = async (email, otpOrPassword, universityList = []) => {
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanCode = (otpOrPassword || '').trim()

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Please enter your registered email address.',
      }
    }

    if (!cleanCode) {
      return {
        success: false,
        error: 'Please enter the 4-digit mock OTP sent to your registered email.',
      }
    }

    try {
      // Direct call to Backend REST API (verify OTP or login)
      const res = await api.verifyOtp(cleanEmail, cleanCode).catch(() => null)

      if (res && res.success && res.user) {
        return {
          success: true,
          user: res.user,
          authorizedRoles: res.user.authorizedRoles,
        }
      }

      // If backend returned explicit error
      if (res && res.error && !res.success) {
        return {
          success: false,
          error: res.error,
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Backend verifyOtp API fallback:', err)
    }

    // Client-side resilient fallback for seamless offline / instant test mode
    // 1. Check dynamicUsers / REGISTERED_ACCOUNTS
    const matchedUser = dynamicUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    )
    if (matchedUser) {
      return {
        success: true,
        user: matchedUser,
        authorizedRoles: matchedUser.authorizedRoles,
      }
    }

    // 2. Check registered colleges / universities
    const matchedUniv = (universityList || []).find(
      (u) =>
        (u.financeEmail && u.financeEmail.toLowerCase() === cleanEmail) ||
        (u.officialEmail && u.officialEmail.toLowerCase() === cleanEmail)
    )
    if (matchedUniv) {
      const univUser = {
        id: `usr-fin-${matchedUniv.id}`,
        email: matchedUniv.financeEmail || cleanEmail,
        name: `${matchedUniv.name} Finance Officer`,
        primaryRole: ROLES.UNIV_FINANCE,
        roleTitle: `Finance Officer & Comptroller, ${matchedUniv.name}`,
        organization: matchedUniv.name,
        universityId: matchedUniv.id,
        roleLabel: '2. College/University Finance',
        authorizedRoles: [ROLES.UNIV_FINANCE],
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        badge: 'University CFO',
        badgeVariant: 'success',
      }
      return {
        success: true,
        user: univUser,
        authorizedRoles: [ROLES.UNIV_FINANCE],
      }
    }

    // 3. Government Admin email fallback
    if (cleanEmail === 'sec-higheredu@karnataka.gov.in' || cleanEmail.includes('karnataka.gov.in') || cleanEmail.includes('gov')) {
      const govUser = REGISTERED_ACCOUNTS[0]
      return {
        success: true,
        user: govUser,
        authorizedRoles: govUser.authorizedRoles,
      }
    }

    // 4. Default registered college finance officer for any valid email provided
    return {
      success: true,
      user: {
        id: `usr-reg-${Date.now().toString().slice(-4)}`,
        email: cleanEmail,
        name: 'Registered College Finance Officer',
        primaryRole: ROLES.UNIV_FINANCE,
        roleTitle: 'Finance Officer & Comptroller',
        organization: 'Registered Karnataka Institution',
        roleLabel: '2. College/University Finance',
        authorizedRoles: [ROLES.UNIV_FINANCE],
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        badge: 'University CFO',
        badgeVariant: 'success',
      },
      authorizedRoles: [ROLES.UNIV_FINANCE],
    }
  }

  // Authorize and activate an operational role for the user
  const selectRole = async (user, roleKey) => {
    if (!user) {
      return { success: false, error: 'User is not authenticated.' }
    }

    // Verify authorized roles
    const authorized = user.authorizedRoles || [user.primaryRole]
    const normalizedRole = roleKey === 'admin' ? 'univ_admin' : roleKey

    if (!authorized.includes(roleKey) && !authorized.includes(normalizedRole)) {
      const roleName = ROLE_DETAILS[roleKey]?.title || roleKey
      return {
        success: false,
        error: `Authorization Denied (403): Your identity "${user.name}" does not hold clearance for the "${roleName}" operational console.`,
      }
    }

    // Call backend select-role endpoint if available
    try {
      await api.selectRole(user.id, roleKey)
    } catch (err) {
      console.warn('[AuthContext] Note on selectRole:', err)
    }

    // Persist session
    setCurrentUser(user)
    setCurrentRole(roleKey)
    try {
      localStorage.setItem('gfi_auth_user', JSON.stringify(user))
      localStorage.setItem('gfi_auth_role', roleKey)
      localStorage.setItem('gfi_auth_token', `gfi_token_${Date.now()}_${user.id}`)
    } catch (e) {
      console.error('Session persistence failed:', e)
    }

    return { success: true, role: roleKey }
  }

  // Switch role while logged in (only if authorized)
  const switchRole = (roleKey) => {
    if (!currentUser) return { success: false, error: 'Not logged in.' }

    const authorized = currentUser.authorizedRoles || [currentUser.primaryRole]
    const normalized = roleKey === 'admin' ? 'univ_admin' : roleKey

    if (!authorized.includes(roleKey) && !authorized.includes(normalized)) {
      return {
        success: false,
        error: `Access Denied: You are not authorized for ${ROLE_DETAILS[roleKey]?.title || roleKey}.`,
      }
    }

    setCurrentRole(roleKey)
    try {
      localStorage.setItem('gfi_auth_role', roleKey)
    } catch (e) {
      console.error(e)
    }
    return { success: true }
  }

  // Logout current user
  const logout = () => {
    setCurrentUser(null)
    setCurrentRole(null)
    try {
      localStorage.removeItem('gfi_auth_user')
      localStorage.removeItem('gfi_auth_role')
      localStorage.removeItem('gfi_auth_token')
    } catch (e) {
      console.error(e)
    }
  }

  const isAuthorized = (roleKey) => {
    if (!currentUser) return false
    const authorized = currentUser.authorizedRoles || [currentUser.primaryRole]
    const normalized = roleKey === 'admin' ? 'univ_admin' : roleKey
    return authorized.includes(roleKey) || authorized.includes(normalized)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!(currentUser && currentRole),
        currentUser,
        currentRole,
        dynamicRoles,
        dynamicUsers,
        requestOtp,
        authenticate,
        selectRole,
        switchRole,
        logout,
        isAuthorized,
        refreshAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
