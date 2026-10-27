import React, { useState } from 'react'
import {
  Mail,
  Building2,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Plus,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'

const KARNATAKA_DISTRICTS = [
  'Bagalkot',
  'Ballari',
  'Belagavi',
  'Bengaluru Rural',
  'Bengaluru Urban',
  'Bidar',
  'Chamarajanagar',
  'Chikkaballapur',
  'Chikkamagaluru',
  'Chitradurga',
  'Dakshina Kannada',
  'Davanagere',
  'Dharwad',
  'Gadag',
  'Hassan',
  'Haveri',
  'Kalaburagi',
  'Kodagu',
  'Kolar',
  'Koppal',
  'Mandya',
  'Mysuru',
  'Raichur',
  'Ramanagara',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Uttara Kannada',
  'Vijayanagara',
  'Yadgir',
]

const INSTITUTION_TYPES = [
  'State Public University',
  'Deemed University',
  'Autonomous College',
  'Affiliated College',
  'Institute of National Importance',
  'Private State University',
]

const INITIAL_FORM = {
  name: '',
  code: '',
  institutionType: 'State Public University',
  officialEmail: '',
  financeEmail: '',
  state: 'Karnataka',
  district: 'Bengaluru Urban',
  address: '',
  affiliatedUniversity: '',
  allocatedAmount: '',
  status: 'Optimal',
  credentialMode: 'password', // 'password' or 'token'
  tempPassword: 'password123',
}

export function AddCollegeModal({ isOpen, onClose, onTriggerToast }) {
  const { addUniversity } = useFinancialData()
  const { refreshAuthData } = useAuth()

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [copiedKey, setCopiedKey] = useState('')

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2500)
    if (onTriggerToast) {
      onTriggerToast('Copied', text, 'success')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      if (onTriggerToast) onTriggerToast('Missing Name', 'Official college legal name is required.', 'danger')
      return
    }
    if (!formData.code.trim()) {
      if (onTriggerToast) onTriggerToast('Missing Code', 'College code is required.', 'danger')
      return
    }
    if (!formData.officialEmail.trim() || !emailRegex.test(formData.officialEmail.trim())) {
      if (onTriggerToast) onTriggerToast('Invalid Email', 'Valid official institutional email is required.', 'danger')
      return
    }
    if (!formData.financeEmail.trim() || !emailRegex.test(formData.financeEmail.trim())) {
      if (onTriggerToast) onTriggerToast('Invalid Email', 'Valid authorized finance email is required.', 'danger')
      return
    }
    if (formData.officialEmail.trim().toLowerCase() === formData.financeEmail.trim().toLowerCase()) {
      if (onTriggerToast) onTriggerToast('Duplicate Emails', 'Official email and finance email must be distinct for dual control.', 'danger')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await addUniversity({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        institutionType: formData.institutionType,
        officialEmail: formData.officialEmail.trim().toLowerCase(),
        financeEmail: formData.financeEmail.trim().toLowerCase(),
        state: formData.state.trim() || 'Karnataka',
        district: formData.district.trim(),
        address: formData.address.trim(),
        affiliatedUniversity: formData.affiliatedUniversity.trim(),
        allocatedAmount: Number(formData.allocatedAmount) || 0,
        status: formData.status || 'Optimal',
        credentialMode: formData.credentialMode,
        tempPassword: formData.tempPassword || 'password123',
      })

      if (refreshAuthData) await refreshAuthData()

      setIsSubmitting(false)
      setCreatedCredentials({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        financeEmail: formData.financeEmail.trim().toLowerCase(),
        officialEmail: formData.officialEmail.trim().toLowerCase(),
        credentialMode: formData.credentialMode,
        tempPassword: formData.tempPassword || 'password123',
        activationToken: created?.activationToken || '',
      })

      setFormData(INITIAL_FORM)

      if (onTriggerToast) {
        onTriggerToast('College Registered', `${formData.name} added successfully!`, 'success')
      }
    } catch (err) {
      setIsSubmitting(false)
      if (onTriggerToast) {
        onTriggerToast('Registration Failed', err.message || 'Could not register college.', 'danger')
      }
    }
  }

  const handleModalClose = () => {
    if (isSubmitting) return
    setCreatedCredentials(null)
    onClose()
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !createdCredentials}
        onClose={handleModalClose}
        title="Add New College"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-xs">
          {/* Official Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1f2328] mb-1">
                Official College Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bangalore University"
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                College Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BU"
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 font-mono text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
              />
            </div>
          </div>

          {/* Type & Affiliation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Institution Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.institutionType}
                onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Affiliated University or Body
              </label>
              <input
                type="text"
                value={formData.affiliatedUniversity}
                onChange={(e) => setFormData({ ...formData, affiliatedUniversity: e.target.value })}
                placeholder="e.g. VTU, State Higher Education Council"
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
              />
            </div>
          </div>

          {/* Dual Email Directory */}
          <div className="p-3 bg-[#ddf4ff]/40 rounded-lg border border-[#0969da]/20 space-y-2.5">
            <div className="text-[11px] font-semibold text-[#0969da] uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Dual-Authorized Institutional Email Directory
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Official Institutional Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.officialEmail}
                  onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                  placeholder="registrar@college.ac.in"
                  className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-white px-3 font-mono text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
                />
                <span className="text-[10px] text-[#57606a]">Official communications</span>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Second Authorized Finance Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.financeEmail}
                  onChange={(e) => setFormData({ ...formData, financeEmail: e.target.value })}
                  placeholder="finance@college.ac.in"
                  className="w-full h-8.5 rounded-md border border-[#0969da]/50 bg-white px-3 font-mono text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
                />
                <span className="text-[10px] text-[#0969da] font-medium">Used for College Finance Login</span>
              </div>
            </div>
          </div>

          {/* State & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
              >
                {KARNATAKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block font-semibold text-[#1f2328] mb-1">Campus Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full campus street address"
              className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
            />
          </div>

          {/* Budget & Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Initial Budget Allocation (₹)
              </label>
              <input
                type="number"
                value={formData.allocatedAmount}
                onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                placeholder="e.g. 5000000"
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 font-mono text-xs text-[#1f2328] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Finance Login Credential Method
              </label>
              <select
                value={formData.credentialMode}
                onChange={(e) => setFormData({ ...formData, credentialMode: e.target.value })}
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
              >
                <option value="password">Direct Temporary Password</option>
                <option value="token">Secure 64-char Activation Token</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d0d7de]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleModalClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmitting ? 'Registering...' : 'Register College'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUCCESS CREDENTIALS MODAL */}
      {createdCredentials && (
        <Modal
          isOpen={true}
          onClose={handleModalClose}
          title="College Registered Successfully"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {createdCredentials.name} ({createdCredentials.code}) is registered!
              </div>
              <p className="text-[11px] text-emerald-800">
                The authorized finance user can now log in using this registered email and instant 4-digit mock OTP (no password needed).
              </p>
            </div>

            <div className="bg-[#f6f8fa] p-3.5 rounded-lg border border-[#d0d7de] space-y-2.5">
              <div>
                <div className="text-[10px] font-semibold text-[#57606a] uppercase">Registered Login Email</div>
                <div className="flex items-center justify-between font-mono font-bold text-xs text-[#1f2328] mt-0.5">
                  <span>{createdCredentials.financeEmail}</span>
                  <button
                    onClick={() => handleCopy(createdCredentials.financeEmail, 'cred-email')}
                    className="text-[#0969da] hover:underline cursor-pointer text-[11px]"
                  >
                    {copiedKey === 'cred-email' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#57606a] uppercase">Login Authentication Method</div>
                <div className="flex items-center justify-between font-bold text-xs text-[#0969da] mt-0.5">
                  <span>4-Digit Mock OTP (Sent on Login)</span>
                  <span className="text-[10px] font-semibold bg-[#ddf4ff] text-[#0969da] px-1.5 py-0.5 rounded border border-[#54aeff]/30">
                    Password-Free
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#d0d7de]">
              <Button
                variant="primary"
                size="sm"
                onClick={handleModalClose}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
