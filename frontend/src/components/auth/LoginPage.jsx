import React, { useState, useMemo, useEffect } from 'react'
import {
  Lock,
  Mail,
  Users,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  X,
  Send,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react'
import { useAuth, ROLE_DETAILS } from '@/context/AuthContext'
import { useFinancialData } from '@/context/FinancialDataContext'
import { ROLES } from '@/data/mockFinancialData'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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
  const [showOtpPopup, setShowOtpPopup] = useState(false)

  // Error State matching flowchart: "Show error (Invalid credentials)"
  const [errorMessage, setErrorMessage] = useState('')

  // Authenticated User Identity & Role Selection State
  const [authenticatedUser, setAuthenticatedUser] = useState(null)
  const [selectedRoleKey, setSelectedRoleKey] = useState('')
  const [roleAuthError, setRoleAuthError] = useState('')

  // Countdown timer for OTP resend and auto-closing popup after 30 seconds
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    } else if (otpCountdown === 0 && showOtpPopup) {
      setShowOtpPopup(false)
    }
  }, [otpCountdown, showOtpPopup])

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
        setOtpCountdown(30)
        setShowOtpPopup(true)

        if (onTriggerToast) {
          onTriggerToast(
            '4-Digit Mock OTP Sent',
            `Mock verification code: ${res.otp} (Valid for 30s)`,
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
      setOtpCountdown(30)
      setShowOtpPopup(true)
      if (onTriggerToast) {
        onTriggerToast('4-Digit Mock OTP Sent', `Mock verification code: ${mock} (Valid for 30s)`, 'info')
      }
    }
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
      {/* Main Authentication Flow Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* STEP 1: LOGIN (Registered Email & 4-Digit Mock OTP - No Password) */}
          {step === 'LOGIN' && (
            <div className="space-y-5">
              <div className="text-center mb-5">
                <h1 className="text-2xl font-bold text-[#1f2328] tracking-tight">
                  University Financial Portal Login
                </h1>
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
                        <div className="text-[11px] text-[#57606a]">
                          {otpCountdown > 0 ? (
                            <div className="flex items-center gap-2">
                              <span>Resend in {otpCountdown}s</span>
                              {!showOtpPopup && sentOtp && (
                                <button
                                  type="button"
                                  onClick={() => setShowOtpPopup(true)}
                                  className="text-[#0969da] hover:underline font-medium cursor-pointer"
                                >
                                  View Mock OTP ({otpCountdown}s)
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendOtp(email)}
                              className="text-[#0969da] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Send again
                            </button>
                          )}
                        </div>

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
              </div>
            </div>
          )}

          {/* STEP 2: SELECT ROLE (Flowchart Step matching diagram "Select Role") */}
          {step === 'SELECT_ROLE' && authenticatedUser && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#dafbe1] border border-[#1a7f37]/40 text-[#1a7f37] mb-2">
                  <Users className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold text-[#1f2328] tracking-tight">
                  Select Operational Role
                </h1>
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
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {/* Custom Radio Circle */}
                            <div>
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

                            <span className="font-semibold text-xs text-[#1f2328]">
                              {roleItem.title}
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
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

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('LOGIN')
                      setOtpSent(false)
                      setOtp('')
                      setRoleAuthError('')
                    }}
                    className="text-xs text-[#57606a] hover:text-[#0969da] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Switch Email / Back to Login</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 30-Second Mock OTP Popup Modal */}
        {showOtpPopup && otpCountdown > 0 && sentOtp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150">
            <div className="relative w-full max-w-sm rounded-lg border border-[#d0d7de] bg-white p-5 text-[#1f2328] shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#eaeef2] pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ddf4ff] text-[#0969da]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1f2328]">Mock Verification Code</h3>
                    <p className="text-[10px] text-[#57606a]">Valid for 30 seconds</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#0969da] bg-[#ddf4ff] border border-[#54aeff]/30 px-2 py-0.5 rounded-full">
                    {otpCountdown}s
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOtpPopup(false)}
                    className="rounded-md p-1 text-[#57606a] hover:bg-[#eaeef2] hover:text-[#1f2328] transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body: 4-digit code */}
              <div className="text-center space-y-2">
                <div className="text-[11px] text-[#57606a]">
                  Your 4-digit mock sign-in OTP for <span className="font-semibold text-[#1f2328]">{email}</span>:
                </div>
                <div className="font-mono text-3xl font-extrabold tracking-[0.35em] text-[#0969da] bg-[#ddf4ff]/50 py-3 px-4 rounded-lg border border-[#54aeff]/40 text-center select-all">
                  {sentOtp}
                </div>

                {/* 30s Countdown Progress Bar */}
                <div className="w-full bg-[#eaeef2] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0969da] h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(otpCountdown / 30) * 100}%` }}
                  />
                </div>

                <p className="text-[10px] text-[#57606a]">
                  Popup will auto-close in <span className="font-bold text-[#0969da]">{otpCountdown}s</span>.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeef2]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyOtp(sentOtp)}
                  className="text-xs h-8 px-3 border-[#d0d7de] text-[#1f2328] hover:bg-[#f6f8fa] cursor-pointer"
                >
                  {copiedOtp ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  {copiedOtp ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  type="button"
                  variant="blue"
                  size="sm"
                  onClick={() => {
                    setOtp(sentOtp)
                    setErrorMessage('')
                    setShowOtpPopup(false)
                  }}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                >
                  Auto-fill OTP
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d0d7de] bg-white py-3 px-4 text-center text-xs text-[#57606a]">
        GovFinanceIntel Platform • Karnataka State Higher Education
      </footer>
    </div>
  )
}
