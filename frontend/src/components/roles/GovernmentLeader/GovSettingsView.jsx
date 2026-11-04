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
  Landmark,
  Settings,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
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
    bankAccounts = [],
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
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    if (onTriggerToast) {
      onTriggerToast('Copied to Clipboard', text, 'info')
    }
    setTimeout(() => {
      setCopiedKey('')
    }, 2000)
  }

  // Open Edit Modal
  const handleOpenEdit = (college) => {
    setEditingCollege({
      ...college,
      name: college.name || '',
      code: college.code || '',
      institutionType: college.institutionType || 'State Public University',
      district: college.district || 'Bengaluru Urban',
      officialEmail: college.officialEmail || college.email || college.financeEmail || '',
      allocatedAmount: college.allocation || college.allocatedAmount || 0,
      spent: college.spent || 0,
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
        onTriggerToast('Invalid Email', 'Please enter a valid official login email address.', 'danger')
      }
      return
    }

    setIsSubmittingEdit(true)
    try {
      const payload = {
        name: editingCollege.name.trim(),
        code: editingCollege.code.trim().toUpperCase(),
        institutionType: editingCollege.institutionType,
        district: editingCollege.district,
        officialEmail: editingCollege.officialEmail.trim().toLowerCase(),
        financeEmail: editingCollege.officialEmail.trim().toLowerCase(),
        allocatedAmount: Number(editingCollege.allocatedAmount) || 0,
        allocation: Number(editingCollege.allocatedAmount) || 0,
      }

      await updateUniversity(editingCollege.id, payload)
      if (refreshAuthData) await refreshAuthData()

      setIsEditModalOpen(false)
      setEditingCollege(null)

      if (onTriggerToast) {
        onTriggerToast(
          'College Details Updated',
          `${payload.name} and admin/finance email updated successfully.`,
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
        onTriggerToast('College Removed', `${collegeName} removed from registry.`, 'info')
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
      const regEmail = (college.officialEmail || college.email || college.financeEmail || '').toLowerCase()
      const matchesSearch =
        !q ||
        (college.name && college.name.toLowerCase().includes(q)) ||
        (college.code && college.code.toLowerCase().includes(q)) ||
        regEmail.includes(q) ||
        (college.district && college.district.toLowerCase().includes(q))

      const matchesDistrict = selectedDistrict === 'ALL' || college.district === selectedDistrict
      const matchesType = selectedType === 'ALL' || college.institutionType === selectedType

      return matchesSearch && matchesDistrict && matchesType
    })
  }, [universities, searchQuery, selectedDistrict, selectedType])

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <div className="bg-white p-5 rounded-xl border border-[#d0d7de] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ddf4ff] text-[#0969da] rounded-lg border border-[#54aeff]/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1f2328]">Government Settings & College Directory</h1>
              <p className="text-xs text-[#57606a] mt-0.5">
                Centralized registry of Colleges, Universities, and their Authorized Admin & Finance Login Emails
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshBackendData && refreshBackendData()}
            className="text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-semibold shadow-xs bg-[#0969da] hover:bg-[#085ec4] text-white cursor-pointer"
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
            placeholder="Search by college name, code, admin/finance email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da] focus:bg-white transition-all text-[#1f2328]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-2.5 py-1.5 text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
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
            className="text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-2.5 py-1.5 text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
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

      {/* 3. Colleges Directory Table */}
      <div className="bg-white rounded-xl border border-[#d0d7de] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#57606a] uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">College / University Name</th>
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-4">Admin / Finance Login Email</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">Primary Bank Account</th>
                <th className="py-3 px-3 text-right">Sanctioned Allocation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#57606a]">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-[#8c959f] opacity-50" />
                    <p className="font-medium text-[#1f2328]">No institutions found matching your filter</p>
                    <p className="text-[11px] mt-0.5 text-[#57606a]">Try clearing search or register a new college above.</p>
                  </td>
                </tr>
              ) : (
                filteredColleges.map((college, idx) => {
                  const collegeAccounts = bankAccounts.filter((a) => a.universityId === college.id)
                  const primaryAcc = collegeAccounts[0] || null
                  const registeredEmail =
                    college.officialEmail ||
                    college.email ||
                    college.financeEmail ||
                    `${college.code?.toLowerCase() || 'college'}@karnataka.gov.in`

                  return (
                    <tr key={college.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#57606a] font-medium">{idx + 1}</td>

                      {/* Name & Type */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1f2328]">{college.name}</div>
                        <div className="text-[11px] text-[#57606a] flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1a7f37]"></span>
                          {college.institutionType || 'State Public University'}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                          {college.code || 'COL'}
                        </span>
                      </td>

                      {/* Admin / Finance Login Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-[#0969da] shrink-0" />
                          <span className="font-mono text-xs text-[#0969da] select-all font-semibold">
                            {registeredEmail}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(registeredEmail, `email-${college.id}`)}
                            title="Copy admin/finance login email"
                            className="p-1 text-[#57606a] hover:text-[#1f2328] rounded hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                          >
                            {copiedKey === `email-${college.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* District */}
                      <td className="py-3 px-3 text-[#57606a] font-medium">
                        {college.district || 'Bengaluru Urban'}
                      </td>

                      {/* Bank Account */}
                      <td className="py-3 px-3">
                        {primaryAcc ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#1f2328]">
                            <Landmark className="h-3.5 w-3.5 text-[#0969da] shrink-0" />
                            <span className="font-medium">{primaryAcc.bankName}</span>
                            <span className="font-mono text-[11px] text-[#57606a]">
                              (••••{String(primaryAcc.accountNumber || '').slice(-4)})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#57606a]">Canara Bank (••••7552)</span>
                        )}
                      </td>

                      {/* Allocation */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-[#1f2328]">
                        {formatCurrency(Number(college.allocation || college.allocatedAmount) || 50000000)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(college)}
                            className="p-1.5 text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                            title="Edit College & Email Details"
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

      {/* 4. Add College Modal */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />

      {/* 5. Edit College & Admin/Finance Email Modal */}
      {editingCollege && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => !isSubmittingEdit && setIsEditModalOpen(false)}
          title={`Edit ${editingCollege.name}`}
          description="Update institution registration details, authorized admin/finance email, and budget allocation."
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                College / University Name *
              </label>
              <input
                type="text"
                required
                value={editingCollege.name}
                onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">District</label>
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

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Institution Type
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

            {/* Official Admin / Finance Email Field */}
            <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de] space-y-2">
              <label className="block text-xs font-bold text-[#1f2328]">
                Authorized Admin / Finance Login Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#0969da]" />
                <input
                  type="email"
                  required
                  placeholder="e.g. bgsfinance@gmail.com"
                  value={editingCollege.officialEmail}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, officialEmail: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
                />
              </div>
              <p className="text-[11px] text-[#57606a]">
                This email receives the secure 4-digit OTP to access the University Financial Portal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Sanctioned Budget Allocation (₹)
              </label>
              <input
                type="number"
                min="0"
                value={editingCollege.allocatedAmount}
                onChange={(e) =>
                  setEditingCollege({ ...editingCollege, allocatedAmount: e.target.value })
                }
                className="w-full text-xs font-mono px-3 py-2 border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#0969da]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmittingEdit}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="blue"
                size="sm"
                disabled={isSubmittingEdit}
                className="bg-[#0969da] hover:bg-[#085ec4] text-white cursor-pointer"
              >
                {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingCollege && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isSubmittingDelete && setIsDeleteModalOpen(false)}
          title={`Remove ${deletingCollege.name}?`}
          description="Are you sure you want to remove this institution? This will permanently archive all linked login access."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <strong>Warning:</strong> Removing this college will revoke login privileges for{' '}
              <span className="font-mono font-bold">
                {deletingCollege.officialEmail || deletingCollege.email || deletingCollege.financeEmail || 'registered email'}
              </span>.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmittingDelete}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="bg-[#cf222e] hover:bg-[#a40e26] text-white cursor-pointer"
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
