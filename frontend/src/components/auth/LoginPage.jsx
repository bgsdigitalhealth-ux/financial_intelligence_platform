import React, { useState, useMemo, useEffect } from 'react'
import {
  Landmark,
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  Key,
  Users,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  KeyRound,
  Copy,
  Check,
  Send,
  RefreshCw,
} from 'lucide-react'
import { useAuth, REGISTERED_ACCOUNTS, ROLE_DETAILS } from '@/context/AuthContext'
import { useFinancialData } from '@/context/FinancialDataContext'
import { ROLES } from '@/data/mockFinancialData'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KarnatakaGovLogo } from '@/components/shared/KarnatakaGovLogo'

export function LoginPage({ onLoginSuccess, onTriggerToast }) {
  const { authenticate, selectRole, dynamicRoles, dynamicUsers, requestOtp } = useAuth()
  const { colleges } = useFinancialData()

  // State Machine: 'LOGIN' | 'SELECT_ROLE'
  const [step, setStep] = useState('LOGIN')

  // Form Fields - Registered Email & 4-Digit Mock OTP (No Password)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sentOtp, setSentOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [copiedOtp, setCopiedOtp] = useState(false)

  // Error State matching flowchart: "Show error (Invalid credentials)"
  const [errorMessage, setErrorMessage] = useState('')

  // Authenticated User Identity & Role Selection State
  const [authenticatedUser, setAuthenticatedUser] = useState(null)
  const [selectedRoleKey, setSelectedRoleKey] = useState('')
  const [roleAuthError, setRoleAuthError] = useState('')

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCountdown])

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
            ? 'Statewide higher education oversight, view-only progress tracking of all Karnataka colleges, comprehensive reports, multi-bank treasury, and statutory audit monitoring.'
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

  // Registered Institutions & Department Emails for instant quick selection
  const quickAccounts = useMemo(() => {
    const list = [
      {
        name: 'Govt Admin (Dept Higher Ed)',
        email: 'sec-higheredu@karnataka.gov.in',
        role: 'Government Admin',
        badge: 'Govt Admin',
      },
    ]

    // Populate exclusively from active registered colleges list
    if (colleges && colleges.length > 0) {
      colleges.forEach((c) => {
        if (c.financeEmail) {
          list.push({
            name: c.name,
            email: c.financeEmail,
            role: 'College Finance Officer',
            badge: c.code || 'University',
          })
        }
      })
    }

    return list
  }, [colleges])

  // Handle Requesting / Sending 4-Digit Mock OTP to registered email
  const handleSendOtp = async (targetEmail = email) => {
    const clean = (targetEmail || '').trim()
    if (!clean) {
      setErrorMessage('Please enter your registered college or government email address.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clean)) {
      setErrorMessage('Please enter a valid email address (e.g. fo@bangaloreuniversity.ac.in).')
      return
    }

    setErrorMessage('')
    setIsSendingOtp(true)

    try {
      const res = await requestOtp(clean, colleges)
      setIsSendingOtp(false)

      if (res && res.success && res.otp) {
        setSentOtp(res.otp)
        setOtpSent(true)
        setOtp(res.otp) // Auto-fill for friction-free verification
        setOtpCountdown(60)

        if (onTriggerToast) {
          onTriggerToast(
            '4-Digit Mock OTP Sent',
            `Mock verification code for ${clean}: ${res.otp}`,
            'info'
          )
        }
      } else {
        setErrorMessage(res?.error || 'Failed to generate 4-digit OTP. Please verify your email.')
      }
    } catch (err) {
      setIsSendingOtp(false)
      const mock = Math.floor(1000 + Math.random() * 9000).toString()
      setSentOtp(mock)
      setOtpSent(true)
      setOtp(mock)
      setOtpCountdown(60)
      if (onTriggerToast) {
        onTriggerToast('4-Digit Mock OTP Sent', `Mock verification code: ${mock}`, 'info')
      }
    }
  }

  // Quick fill helper for effortless testing
  const handleQuickSelect = (accEmail) => {
    setEmail(accEmail)
    setErrorMessage('')
    handleSendOtp(accEmail)
  }

  // Copy OTP to clipboard
  const handleCopyOtp = (code) => {
    if (!code) return
    navigator.clipboard?.writeText(code)
    setCopiedOtp(true)
    setTimeout(() => setCopiedOtp(false), 2000)
    if (onTriggerToast) {
      onTriggerToast('Copied', `OTP ${code} copied to clipboard`, 'success')
    }
  }

  // Handle Step 1: Login Form Submission via 4-Digit OTP (No password needed)
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!otpSent) {
      return handleSendOtp()
    }

    if (!otp.trim()) {
      setErrorMessage('Please enter the 4-digit mock OTP sent to your registered email.')
      return
    }

    if (otp.trim().length !== 4) {
      setErrorMessage('OTP must be exactly 4 digits.')
      return
    }

    setIsLoading(true)

    try {
      const result = await authenticate(email, otp.trim(), colleges)
      setIsLoading(false)

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid 4-digit OTP. Please enter the verification code sent to your registered email.')
        if (onTriggerToast) {
          onTriggerToast('Authentication Failed', result.error || 'Invalid 4-digit OTP provided.', 'danger')
        }
        return
      }

      // Valid Identity -> Authenticate User -> Proceed to Select Role
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
                University Financial Intelligence Platform • Single Sign-On OTP Authentication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#57606a]">
            <Lock className="h-3.5 w-3.5 text-[#1a7f37]" />
            <span>K.S.U. Act 2000 & State Audit Portal</span>
          </div>
        </div>

        {/* Official Purpose Banner */}
        <div className="max-w-6xl mx-auto mt-2.5 pt-2 border-t border-[#eaeef2] flex items-center justify-between text-xs text-[#57606a]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0969da] uppercase tracking-wider text-[10px]">Purpose:</span>
            <span>Monitor, analyze, and ensure timely submission and compliance of quarterly financial statements for all registered government and public universities in Karnataka.</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Flow Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* STEP 1: LOGIN (Registered Email & 4-Digit Mock OTP - No Password) */}
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
                  Login with your registered College/University or Government email via 4-digit mock OTP
                </p>
              </div>

              {/* Error Alert Banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-md border border-[#cf222e]/40 bg-[#ffebe9] p-3 text-xs text-[#cf222e] flex items-start gap-2.5 animate-in fade-in-50 duration-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#cf222e]" />
                  <div className="flex-1">
                    <div className="font-semibold">Authentication Notice</div>
                    <div className="mt-0.5 leading-relaxed text-[#82071e]">{errorMessage}</div>
                  </div>
                </div>
              )}

              {/* Login Card */}
              <div className="bg-white border border-[#d0d7de] rounded-lg shadow-sm p-5 space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Registered Email Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="auth-email"
                        className="block text-xs font-semibold text-[#1f2328]"
                      >
                        Registered Email Address
                      </label>
                      {otpSent && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false)
                            setOtp('')
                            setErrorMessage('')
                          }}
                          className="text-[11px] text-[#0969da] hover:underline font-medium cursor-pointer"
                        >
                          Change Email
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                      <input
                        id="auth-email"
                        type="email"
                        required
                        disabled={otpSent}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setErrorMessage('')
                        }}
                        placeholder="e.g. fo@bangaloreuniversity.ac.in"
                        className={`w-full h-9 rounded-md border border-[#d0d7de] pl-9 pr-3 text-xs text-[#1f2328] placeholder:text-[#656d76] focus:border-[#0969da] focus:outline-none focus:ring-1 focus:ring-[#0969da] transition-colors ${
                          otpSent ? 'bg-[#f6f8fa] font-medium text-[#57606a]' : 'bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* High-Visibility Mock OTP Notification Banner */}
                  {otpSent && sentOtp && (
                    <div className="rounded-lg border border-[#0969da]/30 bg-[#ddf4ff] p-3 space-y-2 animate-in fade-in-50 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0969da]">
                          <Sparkles className="h-4 w-4 text-[#0969da]" />
                          <span>Mock OTP Sent to Registered Email</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#57606a]">
                          Valid for 10 mins
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-md p-2.5 border border-[#54aeff]/30">
                        <div>
                          <div className="text-[10px] text-[#57606a] uppercase font-semibold">
                            4-Digit Verification Code
                          </div>
                          <div className="font-mono text-xl font-extrabold tracking-[0.3em] text-[#0969da]">
                            {sentOtp}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyOtp(sentOtp)}
                            className="text-[11px] h-7 px-2 border-[#0969da]/30 text-[#0969da] hover:bg-[#ddf4ff]"
                          >
                            {copiedOtp ? (
                              <Check className="h-3 w-3 text-emerald-600 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            {copiedOtp ? 'Copied' : 'Copy'}
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setOtp(sentOtp)
                              setErrorMessage('')
                            }}
                            className="text-[11px] h-7 px-2 font-semibold"
                          >
                            Auto-fill OTP
                          </Button>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#57606a] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>Password is not required. Use the 4-digit code above to sign in.</span>
                      </div>
                    </div>
                  )}

                  {/* 4-Digit OTP Input Field (Shown once OTP is requested) */}
                  {otpSent ? (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="auth-otp"
                        className="block text-xs font-semibold text-[#1f2328]"
                      >
                        Enter 4-Digit OTP
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                        <input
                          id="auth-otp"
                          type="text"
                          maxLength={4}
                          autoFocus
                          required
                          value={otp}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            setOtp(val)
                            setErrorMessage('')
                          }}
                          placeholder="• • • •"
                          className="w-full h-10 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-center font-mono text-lg font-bold tracking-[0.4em] text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none focus:ring-1 focus:ring-[#0969da] transition-colors"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-[#57606a]">
                          {otpCountdown > 0 ? (
                            `Resend OTP in ${otpCountdown}s`
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendOtp(email)}
                              className="text-[#0969da] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Resend 4-digit OTP
                            </button>
                          )}
                        </span>

                        <span className="text-[10px] text-[#57606a] font-mono">
                          {otp.length}/4 digits
                        </span>
                      </div>

                      {/* Verify & Sign In Button */}
                      <Button
                        type="submit"
                        variant="blue"
                        size="md"
                        className="w-full justify-center h-9 text-xs font-semibold shadow-xs mt-3 cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Verifying OTP...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verify OTP & Sign In
                          </span>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Initial Button: Send 4-Digit Mock OTP */
                    <Button
                      type="submit"
                      variant="blue"
                      size="md"
                      className="w-full justify-center h-9 text-xs font-semibold shadow-xs cursor-pointer"
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Sending 4-Digit OTP...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5" />
                          Send 4-Digit Mock OTP
                        </span>
                      )}
                    </Button>
                  )}
                </form>

                {/* Quick Selection Helper for Registered Institutions */}
                <div className="pt-3 border-t border-[#eaeef2] space-y-2">
                  <div className="text-[11px] font-semibold text-[#57606a] flex items-center justify-between">
                    <span>Quick Select Registered Institutions:</span>
                    <span className="text-[10px] text-[#0969da]">Instant OTP</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {quickAccounts.slice(0, 5).map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleQuickSelect(acc.email)}
                        className={`w-full text-left p-2 rounded-md border text-xs transition-all flex items-center justify-between group cursor-pointer ${
                          email === acc.email
                            ? 'border-[#0969da] bg-[#ddf4ff]/40 text-[#0969da]'
                            : 'border-[#d0d7de]/70 bg-white hover:bg-[#f6f8fa] text-[#1f2328]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-semibold text-[11px] text-[#1f2328] group-hover:text-[#0969da] truncate">
                            {acc.name}
                          </div>
                          <div className="font-mono text-[10px] text-[#57606a] truncate">
                            {acc.email}
                          </div>
                        </div>
                        <Badge
                          variant={acc.role === 'Government Admin' ? 'primary' : 'outline'}
                          className="text-[9px] shrink-0"
                        >
                          {acc.badge}
                        </Badge>
                      </button>
                    ))}
                  </div>
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
                    setOtpSent(false)
                    setOtp('')
                    setRoleAuthError('')
                  }}
                  className="text-xs text-[#57606a] hover:text-[#1f2328] cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Switch Email
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
                  className="w-full justify-center h-9 text-xs font-semibold shadow-xs mt-2 cursor-pointer"
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
        GovFinanceIntel Platform • Password-Free 4-Digit Mock OTP Authentication Architecture
      </footer>
    </div>
  )
}
