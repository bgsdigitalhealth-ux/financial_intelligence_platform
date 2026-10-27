import React, { useState, useMemo, useEffect } from 'react'
import {
  Landmark,
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  Users,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  User,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'
import { useAuth, REGISTERED_ACCOUNTS, ROLE_DETAILS } from '@/context/AuthContext'
import { ROLES } from '@/data/mockFinancialData'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { KarnatakaGovLogo } from '@/components/shared/KarnatakaGovLogo'

export function LoginPage({ onLoginSuccess, onTriggerToast }) {
  const { authenticate, selectRole, dynamicRoles, dynamicUsers } = useAuth()

  // State Machine: 'LOGIN' | 'ACTIVATE' | 'SELECT_ROLE'
  const [step, setStep] = useState('LOGIN')

  // Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Activation Fields
  const [activationToken, setActivationToken] = useState('')
  const [activationPassword, setActivationPassword] = useState('')
  const [activationConfirmPassword, setActivationConfirmPassword] = useState('')
  const [activationSuccessMsg, setActivationSuccessMsg] = useState('')
  const [isActivating, setIsActivating] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    const actionParam = params.get('action')
    if (tokenParam || actionParam === 'activate') {
      setStep('ACTIVATE')
      if (tokenParam) {
        setActivationToken(tokenParam)
      }
    }
  }, [])

  // Error State matching flowchart: "Show error (Invalid credentials)"
  const [errorMessage, setErrorMessage] = useState('')

  // Authenticated User Identity & Role Selection State
  const [authenticatedUser, setAuthenticatedUser] = useState(null)
  const [selectedRoleKey, setSelectedRoleKey] = useState('')
  const [roleAuthError, setRoleAuthError] = useState('')

  // Dynamic 3 Roles (Loaded from MySQL /api/auth/roles)
  const rolesToDisplay = useMemo(() => {
    if (dynamicRoles && dynamicRoles.length >= 3) {
      return dynamicRoles.map((r) => ({
        id: r.id,
        roleNumber: r.roleNumber,
        title: r.id === 'gov_leader' ? '1. Government Admin' : r.title,
        shortTitle: r.id === 'gov_leader' ? 'Government Admin' : r.shortTitle,
        tag: r.id === 'gov_leader' ? 'Department of Higher Education (Principal Secretary)' : r.tag,
        badge: r.id === 'gov_leader' ? 'Government Admin (View Only)' : r.badge,
        badgeVariant: r.badgeVariant || (r.id === 'gov_leader' ? 'primary' : r.id === 'univ_finance' ? 'success' : 'purple'),
        scopeDescription:
          r.id === 'gov_leader'
            ? 'Statewide higher education oversight, view-only progress tracking of all 32 Karnataka colleges, comprehensive reports, multi-bank treasury, and statutory audit monitoring.'
            : r.scopeDescription,
        accentColor: r.accentColor,
        iconName: r.iconName,
      }))
    }
    return [
      ROLE_DETAILS[ROLES.GOV_LEADER],
      ROLE_DETAILS[ROLES.UNIV_FINANCE],
      ROLE_DETAILS[ROLES.UNIV_ADMIN],
    ]
  }, [dynamicRoles])

  // Dynamic user accounts (Loaded from MySQL /api/auth/users)
  const usersToDisplay = useMemo(() => {
    return dynamicUsers && dynamicUsers.length > 0 ? dynamicUsers : REGISTERED_ACCOUNTS
  }, [dynamicUsers])

  // Quick fill helper for effortless testing
  const handleAutofill = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password || 'password123')
    setErrorMessage('')
  }

  // Handle Account Activation (Sets password for authorized finance email using token)
  const handleActivationSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setActivationSuccessMsg('')

    if (!activationToken.trim()) {
      setErrorMessage('Please enter the secure activation token.')
      return
    }
    if (!activationPassword) {
      setErrorMessage('Please enter a secure password.')
      return
    }
    if (activationPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }
    if (activationPassword !== activationConfirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsActivating(true)
    try {
      const res = await api.activateAccount({
        token: activationToken.trim(),
        password: activationPassword.trim(),
      })
      setIsActivating(false)
      setActivationSuccessMsg(res.message || 'Account activated successfully! You may now sign in.')
      if (res.email) {
        setEmail(res.email)
      }
      setStep('LOGIN')
      if (onTriggerToast) {
        onTriggerToast('Account Activated', 'Your password has been established securely in MySQL. Please sign in.', 'success')
      }
    } catch (err) {
      setIsActivating(false)
      setErrorMessage(err.message || 'Activation failed. Token may be expired or invalid.')
    }
  }

  // Handle Step 1: Login Form Submission (Authenticates against MySQL)
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const result = await authenticate(email, password)
      setIsLoading(false)

      if (!result.success) {
        // Flowchart branch: Invalid -> Show error (Invalid credentials)
        setErrorMessage(result.error || 'Invalid credentials. Please verify your email and password.')
        if (onTriggerToast) {
          onTriggerToast('Authentication Failed', result.error || 'Invalid credentials provided.', 'danger')
        }
        return
      }

      // Flowchart branch: Valid -> Authenticate User -> Proceed to Select Role
      const user = result.user
      setAuthenticatedUser(user)
      setSelectedRoleKey(user.primaryRole || user.authorizedRoles?.[0] || 'gov_leader')
      setStep('SELECT_ROLE')

      if (onTriggerToast) {
        onTriggerToast(
          'Identity Verified',
          `Welcome, ${user.name}. Please select your operational role.`,
          'success'
        )
      }
    } catch (err) {
      setIsLoading(false)
      setErrorMessage('Server connection error. Please ensure the backend is running.')
    }
  }

  // Handle Step 2: Role Selection & Authorization Confirmation
  const handleRoleSubmit = async (e) => {
    e.preventDefault()
    setRoleAuthError('')

    if (!selectedRoleKey) {
      setRoleAuthError('Please select an operational role to continue.')
      return
    }

    const authResult = await selectRole(authenticatedUser, selectedRoleKey)

    if (!authResult.success) {
      setRoleAuthError(authResult.error)
      if (onTriggerToast) {
        onTriggerToast('Authorization Denied', authResult.error, 'danger')
      }
      return
    }

    if (onTriggerToast) {
      const roleTitle = ROLE_DETAILS[selectedRoleKey]?.shortTitle || selectedRoleKey
      onTriggerToast(
        `Authorized Session Active`,
        `Entered ${roleTitle} console with verified cryptographic claims.`,
        'success'
      )
    }

    if (onLoginSuccess) {
      onLoginSuccess(selectedRoleKey, authenticatedUser)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fa] flex flex-col justify-between text-[#1f2328]">
      {/* Top Karnataka Government Official Header */}
      <header className="border-b border-[#d0d7de] bg-white px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <KarnatakaGovLogo className="h-11 w-11 shrink-0" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#1f2328] leading-tight">
                  Karnataka Department of Higher Education
                </span>
                <span className="text-[10px] text-[#0969da] px-1.5 py-0.5 rounded border border-[#54aeff]/40 bg-[#ddf4ff] font-bold leading-none">
                  GOVT OF KARNATAKA
                </span>
              </div>
              <p className="text-xs text-[#57606a] mt-0.5 leading-tight">
                University Financial Intelligence Platform • System Flow Chart Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#57606a]">
            <Lock className="h-3.5 w-3.5 text-[#1a7f37]" />
            <span>K.S.U. Act 2000 & State Audit Portal</span>
          </div>
        </div>

        {/* Official Purpose Banner from Flowchart Mockup */}
        <div className="max-w-6xl mx-auto mt-2.5 pt-2 border-t border-[#eaeef2] flex items-center justify-between text-xs text-[#57606a]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0969da] uppercase tracking-wider text-[10px]">Purpose:</span>
            <span>Monitor, analyze, and ensure timely submission and compliance of quarterly financial statements for all 32 government and open universities in Karnataka.</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Flow Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* STEP 1: LOGIN (Email & Password Credentials) */}
          {step === 'LOGIN' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="flex justify-center mb-2.5">
                  <KarnatakaGovLogo className="h-14 w-14" />
                </div>
                <h1 className="text-xl font-bold text-[#1f2328] tracking-tight">
                  University Financial Portal Login
                </h1>
                <p className="text-xs text-[#57606a]">
                  Enter your official Government or University credentials (email / password)
                </p>
              </div>

              {/* Activation Success Banner */}
              {activationSuccessMsg && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                  <div className="font-semibold">{activationSuccessMsg}</div>
                </div>
              )}

              {/* FLOWCHART STEP: Show error (Invalid credentials) */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-md border border-[#cf222e]/40 bg-[#ffebe9] p-3 text-xs text-[#cf222e] flex items-start gap-2.5 animate-in fade-in-50 duration-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#cf222e]" />
                  <div className="flex-1">
                    <div className="font-semibold">Authentication Failed</div>
                    <div className="mt-0.5 leading-relaxed text-[#82071e]">{errorMessage}</div>
                  </div>
                </div>
              )}

              {/* Login Card */}
              <div className="bg-white border border-[#d0d7de] rounded-lg shadow-sm p-5 space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-xs font-semibold text-[#1f2328] mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                      <input
                        id="auth-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setErrorMessage('')
                        }}
                        placeholder="Authorized finance email (e.g. finance@university.edu)"
                        className="w-full h-9 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] placeholder:text-[#656d76] focus:bg-white focus:border-[#0969da] focus:outline-none focus:ring-1 focus:ring-[#0969da] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="auth-password"
                        className="block text-xs font-semibold text-[#1f2328]"
                      >
                        Password / Passphrase
                      </label>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setErrorMessage('')
                        }}
                        placeholder="Enter password"
                        className="w-full h-9 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-9 text-xs text-[#1f2328] placeholder:text-[#656d76] focus:bg-white focus:border-[#0969da] focus:outline-none focus:ring-1 focus:ring-[#0969da] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#57606a] hover:text-[#1f2328] cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    variant="blue"
                    size="md"
                    className="w-full justify-center h-9 text-xs font-semibold shadow-xs"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Authenticating User...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Authenticate & Continue
                      </span>
                    )}
                  </Button>
                </form>

                <div className="pt-2 text-center border-t border-[#eaeef2]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('ACTIVATE')
                      setErrorMessage('')
                      setActivationSuccessMsg('')
                    }}
                    className="text-xs text-[#0969da] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <KeyRound className="h-3 w-3" />
                    Have an activation token? Activate your account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: ACTIVATE ACCOUNT WITH SECURE TOKEN */}
          {step === 'ACTIVATE' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ddf4ff] border border-[#0969da]/30 text-[#0969da] mb-2 font-bold text-xl">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold text-[#1f2328] tracking-tight">
                  Activate College Finance Account
                </h1>
                <p className="text-xs text-[#57606a]">
                  Establish your secure password using the invitation token generated by Government Admin
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-md border border-[#cf222e]/40 bg-[#ffebe9] p-3 text-xs text-[#cf222e] flex items-start gap-2.5"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#cf222e]" />
                  <div className="flex-1 font-semibold">{errorMessage}</div>
                </div>
              )}

              <div className="bg-white border border-[#d0d7de] rounded-lg shadow-sm p-5 space-y-4">
                <form onSubmit={handleActivationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1f2328] mb-1.5">
                      Activation Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                      <input
                        type="text"
                        required
                        value={activationToken}
                        onChange={(e) => {
                          setActivationToken(e.target.value)
                          setErrorMessage('')
                        }}
                        placeholder="Paste your 64-character activation token"
                        className="w-full h-9 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs font-mono text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1f2328] mb-1.5">
                      Establish New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                      <input
                        type="password"
                        required
                        value={activationPassword}
                        onChange={(e) => {
                          setActivationPassword(e.target.value)
                          setErrorMessage('')
                        }}
                        placeholder="At least 6 characters"
                        className="w-full h-9 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1f2328] mb-1.5">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                      <input
                        type="password"
                        required
                        value={activationConfirmPassword}
                        onChange={(e) => {
                          setActivationConfirmPassword(e.target.value)
                          setErrorMessage('')
                        }}
                        placeholder="Re-enter password"
                        className="w-full h-9 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="blue"
                    size="md"
                    className="w-full justify-center h-9 text-xs font-semibold"
                    disabled={isActivating}
                  >
                    {isActivating ? 'Verifying & Activating...' : 'Activate & Establish Password'}
                  </Button>
                </form>

                <div className="pt-2 text-center border-t border-[#eaeef2]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('LOGIN')
                      setErrorMessage('')
                    }}
                    className="text-xs text-[#0969da] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Already activated? Sign In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT ROLE (Flowchart Step matching diagram "Select Role") */}
          {step === 'SELECT_ROLE' && authenticatedUser && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#dafbe1] border border-[#1a7f37]/40 text-[#1a7f37] mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold text-[#1f2328] tracking-tight">
                  Select Operational Role
                </h1>
                <p className="text-xs text-[#57606a]">
                  Choose an authorized persona console to access corresponding data ledgers
                </p>
              </div>

              {/* Authenticated Identity Pill */}
              <div className="rounded-md border border-[#d0d7de] bg-white p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={authenticatedUser.avatar}
                    alt={authenticatedUser.name}
                    className="h-9 w-9 rounded-full object-cover border border-[#d0d7de]"
                  />
                  <div>
                    <div className="font-semibold text-[#1f2328] flex items-center gap-1.5">
                      {authenticatedUser.name}
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#1a7f37]" />
                    </div>
                    <div className="text-[11px] text-[#57606a] font-mono">
                      {authenticatedUser.email}
                    </div>
                    <div className="text-[10px] text-[#656d76]">
                      {authenticatedUser.organization}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('LOGIN')
                    setRoleAuthError('')
                  }}
                  className="text-xs text-[#57606a] hover:text-[#1f2328]"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Switch User
                </Button>
              </div>

              {/* Authorization Error Banner (if unauthorized role clicked) */}
              {roleAuthError && (
                <div
                  role="alert"
                  className="rounded-md border border-[#cf222e]/40 bg-[#ffebe9] p-3 text-xs text-[#cf222e] flex items-start gap-2.5"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{roleAuthError}</div>
                </div>
              )}

              {/* Role Radio Selection Cards (3 Roles from MySQL) */}
              <form onSubmit={handleRoleSubmit} className="space-y-3">
                <div className="space-y-2.5">
                  {rolesToDisplay.map((roleItem) => {
                    const isAuthorized =
                      authenticatedUser.authorizedRoles?.includes(roleItem.id) ||
                      (roleItem.id === 'univ_admin' && authenticatedUser.authorizedRoles?.includes('admin')) ||
                      authenticatedUser.primaryRole === roleItem.id
                    const isSelected = selectedRoleKey === roleItem.id

                    return (
                      <label
                        key={roleItem.id}
                        onClick={() => {
                          if (isAuthorized) {
                            setSelectedRoleKey(roleItem.id)
                            setRoleAuthError('')
                          }
                        }}
                        className={`block rounded-lg border p-3.5 transition-all select-none ${
                          !isAuthorized
                            ? 'border-[#d0d7de]/70 bg-[#f6f8fa] opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'border-[#0969da] bg-white ring-2 ring-[#0969da]/20 shadow-xs cursor-pointer'
                            : 'border-[#d0d7de] bg-white hover:bg-[#f6f8fa]/60 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            {/* Custom Radio Circle */}
                            <div className="mt-0.5">
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#0969da] bg-[#0969da]'
                                    : 'border-[#d0d7de] bg-white'
                                }`}
                              >
                                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-[#1f2328]">
                                  {roleItem.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#57606a] leading-relaxed">
                                {roleItem.scopeDescription}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {isAuthorized ? (
                              <Badge variant={roleItem.badgeVariant} className="text-[10px]">
                                {roleItem.badge}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-[#cf222e] border-[#cf222e]/40">
                                <Lock className="h-2.5 w-2.5 mr-1" />
                                Unauthorized
                              </Badge>
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>

                {/* Confirm Role Launch Button */}
                <Button
                  type="submit"
                  variant="blue"
                  size="md"
                  className="w-full justify-center h-9 text-xs font-semibold shadow-xs mt-2"
                >
                  <span>Launch Platform Console</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d0d7de] bg-white py-3 px-4 text-center text-xs text-[#57606a]">
        GovFinanceIntel Platform • Role-Based Authentication & Authorization Architecture
      </footer>
    </div>
  )
}
