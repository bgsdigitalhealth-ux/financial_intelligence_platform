import React, { useState, useMemo } from 'react'
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Settings,
  Eye,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AddCollegeModal } from '@/components/shared/AddCollegeModal'

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

export function GovSettingsView({ onTriggerToast }) {
  const {
    universities = [],
    updateUniversity,
    deleteUniversity,
    refreshBackendData,
  } = useFinancialData()

  const { refreshAuthData } = useAuth()

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')

  // Copied State
  const [copiedKey, setCopiedKey] = useState('')

  // Add College Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // View College Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingCollege, setViewingCollege] = useState(null)

  // Edit College Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editingCollege, setEditingCollege] = useState(null)

  // Delete College Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)
  const [deletingCollege, setDeletingCollege] = useState(null)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    if (onTriggerToast) {
      onTriggerToast('Copied to Clipboard', text, 'info')
    }
    setTimeout(() => {
      setCopiedKey('')
    }, 2000)
  }

  // Open View Modal
  const handleOpenView = (college) => {
    setViewingCollege(college)
    setIsViewModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (college) => {
    setEditingCollege({
      ...college,
      name: college.name || '',
      code: college.code || '',
      institutionType: college.institutionType || 'State Public University',
      affiliatedUniversity: college.affiliatedUniversity || college.affiliated_university || '',
      state: college.state || 'Karnataka',
      district: college.district || 'Bengaluru Urban',
      address: college.address || '',
      officialEmail: college.officialEmail || college.email || '',
      financeEmail: college.financeEmail || '',
      allocatedAmount: college.allocation || college.allocatedAmount || 0,
      status: college.status || 'Optimal',
    })
    setIsEditModalOpen(true)
  }

  // Submit Edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    if (!editingCollege) return

    if (!editingCollege.name.trim() || !editingCollege.code.trim()) {
      if (onTriggerToast) {
        onTriggerToast('Validation Error', 'College name and code are required.', 'danger')
      }
      return
    }

    if (editingCollege.officialEmail && !emailRegex.test(editingCollege.officialEmail.trim())) {
      if (onTriggerToast) {
        onTriggerToast('Invalid Email', 'Please enter a valid official institutional email address.', 'danger')
      }
      return
    }

    if (editingCollege.financeEmail && !emailRegex.test(editingCollege.financeEmail.trim())) {
      if (onTriggerToast) {
        onTriggerToast('Invalid Email', 'Please enter a valid authorized finance email address.', 'danger')
      }
      return
    }

    setIsSubmittingEdit(true)
    try {
      const payload = {
        name: editingCollege.name.trim(),
        code: editingCollege.code.trim().toUpperCase(),
        institutionType: editingCollege.institutionType,
        affiliatedUniversity: (editingCollege.affiliatedUniversity || '').trim(),
        state: (editingCollege.state || 'Karnataka').trim(),
        district: editingCollege.district,
        address: (editingCollege.address || '').trim(),
        officialEmail: editingCollege.officialEmail.trim().toLowerCase(),
        financeEmail: (editingCollege.financeEmail || editingCollege.officialEmail).trim().toLowerCase(),
        allocatedAmount: Number(editingCollege.allocatedAmount) || 0,
        allocation: Number(editingCollege.allocatedAmount) || 0,
        status: editingCollege.status || 'Optimal',
      }

      await updateUniversity(editingCollege.id, payload)
      if (refreshAuthData) await refreshAuthData()

      setIsEditModalOpen(false)
      setEditingCollege(null)

      if (onTriggerToast) {
        onTriggerToast(
          'College Profile Updated',
          `${payload.name} details saved.`,
          'success'
        )
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Update Failed', err.message || 'Could not update college', 'danger')
      }
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Open Delete Modal
  const handleOpenDelete = (college) => {
    setDeletingCollege(college)
    setIsDeleteModalOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingCollege) return
    setIsSubmittingDelete(true)
    try {
      await deleteUniversity(deletingCollege.id)
      if (refreshAuthData) await refreshAuthData()

      setIsDeleteModalOpen(false)
      const collegeName = deletingCollege.name
      setDeletingCollege(null)

      if (onTriggerToast) {
        onTriggerToast('College Deleted', `${collegeName} removed from registry.`, 'info')
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Delete Failed', err.message || 'Could not delete college', 'danger')
      }
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Filtered colleges list
  const filteredColleges = useMemo(() => {
    return (universities || []).filter((college) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        college.name?.toLowerCase().includes(q) ||
        college.code?.toLowerCase().includes(q) ||
        college.officialEmail?.toLowerCase().includes(q) ||
        college.financeEmail?.toLowerCase().includes(q) ||
        college.district?.toLowerCase().includes(q) ||
        college.address?.toLowerCase().includes(q) ||
        college.affiliatedUniversity?.toLowerCase().includes(q)

      const matchesDistrict = selectedDistrict === 'ALL' || college.district === selectedDistrict
      const matchesType = selectedType === 'ALL' || college.institutionType === selectedType

      return matchesSearch && matchesDistrict && matchesType
    })
  }, [universities, searchQuery, selectedDistrict, selectedType])

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#d0d7de] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ddf4ff] text-[#0969da] rounded-lg border border-[#0969da]/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1f2328]">
                Government Institutional Profile Settings & Directory
              </h1>
              <p className="text-xs text-[#57606a] mt-0.5">
                Centralized registry of Colleges, Universities, and complete registration profile details
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshBackendData && refreshBackendData()}
            className="text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Register College / University
          </Button>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d0d7de] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
          <input
            type="text"
            placeholder="Search by college name, code, email, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da] focus:bg-white transition-all text-[#1f2328]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-2.5 py-1.5 text-[#1f2328] focus:outline-none focus:border-[#0969da]"
          >
            <option value="ALL">All Districts ({KARNATAKA_DISTRICTS.length})</option>
            {KARNATAKA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-2.5 py-1.5 text-[#1f2328] focus:outline-none focus:border-[#0969da]"
          >
            <option value="ALL">All Institution Types</option>
            {INSTITUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <Badge variant="blue" className="text-xs font-semibold px-2.5 py-1">
            {filteredColleges.length} Institutions
          </Badge>
        </div>
      </div>

      {/* 3. Complete College Profile Details Table (Profile Only - No Bank Accounts or Amounts) */}
      <div className="bg-white rounded-xl border border-[#d0d7de] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#57606a] uppercase tracking-wider">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-4">College / University Profile</th>
                <th className="py-3 px-2">Code</th>
                <th className="py-3 px-4">Authorized Login Emails</th>
                <th className="py-3 px-3">Campus Location & Address</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#57606a]">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-[#8c959f] opacity-50" />
                    <p className="font-medium text-[#1f2328]">No institutions found matching your filter</p>
                    <p className="text-[11px] mt-0.5 text-[#57606a]">Try clearing search or register a new college above.</p>
                  </td>
                </tr>
              ) : (
                filteredColleges.map((college, idx) => {
                  const officialEmail =
                    college.officialEmail || college.email || `${college.code?.toLowerCase() || 'college'}admin@gmail.com`
                  const financeEmail =
                    college.financeEmail ||
                    (officialEmail.includes('admin') ? officialEmail.replace('admin', 'finance') : 'bgsfinance@gmail.com')

                  const campusAddress =
                    college.address ||
                    `${college.district || 'Bengaluru Urban'}, Karnataka`

                  const affiliation =
                    college.affiliatedUniversity ||
                    college.affiliated_university ||
                    'Karnataka State Higher Education Council'

                  return (
                    <tr key={college.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-[#57606a] font-medium">{idx + 1}</td>

                      {/* College Name & Full Type & Affiliation */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="font-bold text-[#1f2328] text-[13px]">{college.name}</div>
                        <div className="text-[11px] text-[#57606a] flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1a7f37]"></span>
                          <span>{college.institutionType || 'State Public University'}</span>
                        </div>
                        <div className="text-[10px] text-[#57606a] mt-0.5 italic truncate max-w-xs">
                          Affiliation: {affiliation}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                          {college.code || 'COL'}
                        </span>
                      </td>

                      {/* Authorized Dual Emails (Admin & Finance) */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-semibold text-[#57606a] w-12 shrink-0">Admin:</span>
                            <span className="font-mono text-[#0969da] select-all font-medium truncate max-w-[150px]">
                              {officialEmail}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(officialEmail, `admin-${college.id}`)}
                              title="Copy Admin email"
                              className="p-1 text-[#57606a] hover:text-[#1f2328] rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {copiedKey === `admin-${college.id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-semibold text-[#1a7f37] w-12 shrink-0">Finance:</span>
                            <span className="font-mono text-[#1a7f37] select-all font-medium truncate max-w-[150px]">
                              {financeEmail}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(financeEmail, `fin-${college.id}`)}
                              title="Copy Finance Login email"
                              className="p-1 text-[#57606a] hover:text-[#1f2328] rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {copiedKey === `fin-${college.id}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Campus Location & Address */}
                      <td className="py-3 px-3 min-w-[170px]">
                        <div className="flex items-start gap-1 text-[11px] text-[#1f2328]">
                          <MapPin className="h-3.5 w-3.5 text-[#0969da] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold">{college.district || 'Bengaluru Urban'}, {college.state || 'Karnataka'}</div>
                            <div className="text-[10px] text-[#57606a] line-clamp-1" title={campusAddress}>
                              {campusAddress}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          {college.status || 'Optimal'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenView(college)}
                            className="p-1.5 text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                            title="View Complete Institutional Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(college)}
                            className="p-1.5 text-slate-600 hover:text-[#0969da] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Edit College Details & Emails"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(college)}
                            className="p-1.5 text-[#57606a] hover:text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors cursor-pointer"
                            title="Remove College"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Complete College/University Profile Modal (Profile Only) */}
      {isViewModalOpen && viewingCollege && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setViewingCollege(null)
          }}
          title={`Institutional Profile — ${viewingCollege.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 pt-1 text-xs">
            {/* Top Identity Banner */}
            <div className="p-4 bg-[#f6f8fa] rounded-xl border border-[#d0d7de] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white border border-[#d0d7de] rounded-lg text-[#0969da] shadow-2xs">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1f2328]">{viewingCollege.name}</h2>
                  <p className="text-xs text-[#57606a] font-medium">
                    Code: <span className="font-mono font-bold text-[#1f2328]">{viewingCollege.code}</span> • {viewingCollege.institutionType || 'State Public University'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {viewingCollege.status || 'Optimal / Active'}
                </span>
              </div>
            </div>

            {/* Profile Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Institutional Legal Information */}
              <div className="p-4 bg-white rounded-xl border border-[#d0d7de] shadow-2xs space-y-2.5">
                <div className="text-[11px] font-bold text-[#57606a] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#d0d7de]/50 pb-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#0969da]" />
                  Institutional Identity & Accreditation
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] text-[#57606a] block">Legal Registered Name</span>
                    <span className="font-semibold text-[#1f2328] text-xs">{viewingCollege.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-[#57606a] block">Institution Code</span>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-100 rounded border border-slate-200 inline-block mt-0.5">
                        {viewingCollege.code}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#57606a] block">Institution Type</span>
                      <span className="font-semibold text-[#1f2328] text-xs">{viewingCollege.institutionType || 'State Public University'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#57606a] block">Affiliated University / Body</span>
                    <span className="font-medium text-[#1f2328] text-xs">
                      {viewingCollege.affiliatedUniversity || viewingCollege.affiliated_university || 'Karnataka State Higher Education Council'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Dual Authorized Email Directory */}
              <div className="p-4 bg-white rounded-xl border border-[#d0d7de] shadow-2xs space-y-2.5">
                <div className="text-[11px] font-bold text-[#57606a] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#d0d7de]/50 pb-1.5">
                  <Mail className="h-4 w-4 text-[#0969da]" />
                  Authorized Login Email Directory
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#57606a]">Official Institutional Email (Admin)</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(viewingCollege.officialEmail || viewingCollege.email, 'modal-admin')}
                        className="text-[11px] text-[#0969da] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'modal-admin' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    </div>
                    <span className="font-mono text-xs text-[#0969da] font-medium block">
                      {viewingCollege.officialEmail || viewingCollege.email || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#57606a]">Authorized Finance Login Email (OTP Access)</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(viewingCollege.financeEmail || viewingCollege.officialEmail, 'modal-fin')}
                        className="text-[11px] text-[#1a7f37] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'modal-fin' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    </div>
                    <span className="font-mono text-xs text-[#1a7f37] font-semibold block">
                      {viewingCollege.financeEmail || viewingCollege.officialEmail || 'bgsfinance@gmail.com'}
                    </span>
                    <span className="text-[10px] text-[#57606a] mt-0.5 block">
                      Official portal sign-in and quarterly filing OTP delivered to this email.
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Campus Geographic Location */}
              <div className="p-4 bg-white rounded-xl border border-[#d0d7de] shadow-2xs space-y-2.5 md:col-span-2">
                <div className="text-[11px] font-bold text-[#57606a] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#d0d7de]/50 pb-1.5">
                  <MapPin className="h-4 w-4 text-[#0969da]" />
                  Campus Location & Address
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-[#57606a] block">State</span>
                      <span className="font-semibold text-[#1f2328] text-xs">{viewingCollege.state || 'Karnataka'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#57606a] block">District</span>
                      <span className="font-semibold text-[#1f2328] text-xs">{viewingCollege.district || 'Bengaluru Urban'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#57606a] block">Full Campus Street Address</span>
                    <span className="font-medium text-[#1f2328] text-xs block">
                      {viewingCollege.address || 'BGS Health & Education City, Uttarahalli Road, Kengeri, Bengaluru - 560060'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Policy Note */}
            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de] text-[11px] text-[#57606a] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0969da] shrink-0" />
              <span>
                <strong>Institutional Profile Only:</strong> Displays college identity, location, and authorized login email credentials.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleOpenEdit(viewingCollege)
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit Profile Details
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false)
                  setViewingCollege(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Add College Modal */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />

      {/* 6. Edit College Modal (Profile Fields Only) */}
      {isEditModalOpen && editingCollege && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit College Details — ${editingCollege.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-3.5 pt-1 text-xs">
            {/* Legal Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  College / University Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollege.name}
                  onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Institution Code *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollege.code}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, code: e.target.value.toUpperCase() })
                  }
                  className="w-full text-xs px-3 py-2 font-mono uppercase border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                />
              </div>
            </div>

            {/* Type & Affiliation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Institution Type *
                </label>
                <select
                  value={editingCollege.institutionType}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, institutionType: e.target.value })
                  }
                  className="w-full text-xs px-2.5 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                >
                  {INSTITUTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Affiliated University or Governing Body
                </label>
                <input
                  type="text"
                  value={editingCollege.affiliatedUniversity}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, affiliatedUniversity: e.target.value })
                  }
                  placeholder="e.g. VTU, RGUHS, State Council"
                  className="w-full text-xs px-3 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                />
              </div>
            </div>

            {/* Dual Email Directory */}
            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de] space-y-2.5">
              <div className="text-[11px] font-bold text-[#0969da] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Dual-Authorized Institutional Email Directory
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                    Official Institutional Email (Admin) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="registrar@college.ac.in"
                    value={editingCollege.officialEmail}
                    onChange={(e) =>
                      setEditingCollege({ ...editingCollege, officialEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                  />
                  <span className="text-[10px] text-[#57606a] mt-0.5 block">Official institutional correspondence</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                    Authorized Finance Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="finance@college.ac.in"
                    value={editingCollege.financeEmail}
                    onChange={(e) =>
                      setEditingCollege({ ...editingCollege, financeEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#0969da]/50 rounded-lg focus:outline-none focus:border-[#0969da]"
                  />
                  <span className="text-[10px] text-[#0969da] font-medium mt-0.5 block">Used for University Finance OTP Login</span>
                </div>
              </div>
            </div>

            {/* State & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">State</label>
                <input
                  type="text"
                  value={editingCollege.state}
                  onChange={(e) => setEditingCollege({ ...editingCollege, state: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">District *</label>
                <select
                  value={editingCollege.district}
                  onChange={(e) => setEditingCollege({ ...editingCollege, district: e.target.value })}
                  className="w-full text-xs px-2.5 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                >
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Full Campus Address */}
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">Campus Address</label>
              <input
                type="text"
                value={editingCollege.address}
                onChange={(e) => setEditingCollege({ ...editingCollege, address: e.target.value })}
                placeholder="Full campus street address, pin code"
                className="w-full text-xs px-3 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
              />
            </div>

            {/* Solvency / Standing */}
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Solvency / Operating Standing
              </label>
              <select
                value={editingCollege.status}
                onChange={(e) => setEditingCollege({ ...editingCollege, status: e.target.value })}
                className="w-full text-xs px-2.5 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
              >
                <option value="Optimal">Optimal</option>
                <option value="Compliant">Compliant</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="blue"
                size="sm"
                disabled={isSubmittingEdit}
              >
                {isSubmittingEdit ? 'Saving Details...' : 'Save Profile Details'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Delete College Confirmation Modal */}
      {isDeleteModalOpen && deletingCollege && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Remove College from Registry"
        >
          <div className="space-y-4 pt-1 text-xs">
            <p className="text-[#1f2328]">
              Are you sure you want to remove{' '}
              <strong className="text-red-600">{deletingCollege.name}</strong> ({deletingCollege.code}) from the institutional registry?
            </p>
            <div className="p-3 bg-[#ffebe9] border border-[#ff8182]/40 rounded-lg text-[#cf222e] text-[11px]">
              This will remove the college profile and registered login emails.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={isSubmittingDelete}
                onClick={handleConfirmDelete}
              >
                {isSubmittingDelete ? 'Removing...' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
