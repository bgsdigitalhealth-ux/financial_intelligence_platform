import React, { useState, useMemo } from 'react'
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Key,
  Copy,
  Check,
  AlertCircle,
  MapPin,
  RefreshCw,
  Landmark,
  ShieldCheck,
  IndianRupee,
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

export function UnivSettingsView({ onSelectTab, onTriggerToast }) {
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
      allocatedAmount: college.allocation || 0,
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
          'College Updated Successfully',
          `${payload.name} details and official email saved.`,
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
      const matchesSearch =
        searchQuery === '' ||
        college.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        college.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        college.officialEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        college.district?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDistrict = selectedDistrict === 'ALL' || college.district === selectedDistrict
      const matchesType = selectedType === 'ALL' || college.institutionType === selectedType

      return matchesSearch && matchesDistrict && matchesType
    })
  }, [universities, searchQuery, selectedDistrict, selectedType])

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <div className="bg-white p-5 rounded-xl border border-[#d0d7de] shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#1a7f37] rounded-lg border border-emerald-200">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1f2328]">Colleges & Institutional Registry</h1>
              <p className="text-xs text-[#57606a] mt-0.5">
                Directory of all registered colleges & universities with official login emails, approved allocations, and accounts
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
            className="text-xs font-semibold shadow-2xs bg-[#1a7f37] hover:bg-[#15662c] text-white border-none"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Register New College
          </Button>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d0d7de] shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
          <input
            type="text"
            placeholder="Search by college name, code, email or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37] focus:bg-white transition-all text-[#1f2328]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-2.5 py-1.5 text-[#1f2328] focus:outline-none focus:border-[#1a7f37]"
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
            className="text-xs bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-2.5 py-1.5 text-[#1f2328] focus:outline-none focus:border-[#1a7f37]"
          >
            <option value="ALL">All Institution Types</option>
            {INSTITUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 text-[#57606a]">
            {filteredColleges.length} Colleges
          </Badge>
        </div>
      </div>

      {/* 3. Colleges Directory Table */}
      <div className="bg-white rounded-xl border border-[#d0d7de] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#57606a] uppercase tracking-wider">
                <th className="py-3 px-4">College / University</th>
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-4">Official Registered Login Email</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3 text-right">Allocation</th>
                <th className="py-3 px-3 text-center">Bank Accounts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60 text-xs">
              {filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#57606a]">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-[#8c959f] opacity-50" />
                    <p className="font-medium">No colleges found matching your criteria</p>
                    <p className="text-[11px] mt-0.5">Try clearing filters or register a new college</p>
                  </td>
                </tr>
              ) : (
                filteredColleges.map((college) => {
                  const collegeAccounts = bankAccounts.filter((a) => a.universityId === college.id)
                  const registeredEmail =
                    college.officialEmail || college.email || college.financeEmail || `${college.code?.toLowerCase() || 'college'}@karnataka.gov.in`

                  return (
                    <tr key={college.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      {/* Name & Type */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1f2328]">{college.name}</div>
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

                      {/* Official Login Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-[#1a7f37] shrink-0" />
                          <span className="font-mono text-xs text-[#0969da] select-all font-medium">
                            {registeredEmail}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(registeredEmail, `email-${college.id}`)}
                            title="Copy registered login email"
                            className="p-1 text-[#57606a] hover:text-[#1f2328] rounded hover:bg-slate-100 transition-colors ml-1"
                          >
                            {copiedKey === `email-${college.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-[#57606a] mt-0.5">
                          Use this email to sign in via 4-digit OTP
                        </div>
                      </td>

                      {/* District */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[#57606a]">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{college.district || 'Bengaluru Urban'}</span>
                        </div>
                      </td>

                      {/* Allocation */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-semibold text-[#1f2328]">
                          {formatCurrency(Number(college.allocation) || 0, true)}
                        </span>
                      </td>

                      {/* Bank Accounts */}
                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                          <Landmark className="h-3 w-3 mr-1 text-[#0969da]" />
                          {collegeAccounts.length} A/C
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(college)}
                            className="p-1.5 text-slate-600 hover:text-[#0969da] hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit College Details & Email"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(college)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete College"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* 4. Edit College Modal */}
      {isEditModalOpen && editingCollege && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit College Details & Official Email"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                College / University Name *
              </label>
              <input
                type="text"
                required
                value={editingCollege.name}
                onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37]"
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
                  className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37]"
                />
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
                  className="w-full px-3 py-2 text-xs border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37]"
                >
                  {INSTITUTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Official Registered Login Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
                <input
                  type="email"
                  required
                  placeholder="e.g. fo@university.ac.in"
                  value={editingCollege.officialEmail}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, officialEmail: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37]"
                />
              </div>
              <p className="text-[10px] text-[#57606a] mt-1">
                This email is used by the College Finance Officer to log into the portal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  District
                </label>
                <select
                  value={editingCollege.district}
                  onChange={(e) =>
                    setEditingCollege({ ...editingCollege, district: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37]"
                >
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Approved Annual Allocation (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={editingCollege.allocatedAmount}
                  onChange={(e) =>
                    setEditingCollege({
                      ...editingCollege,
                      allocatedAmount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-[#d0d7de] rounded-lg focus:outline-none focus:border-[#1a7f37]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d0d7de]">
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
                className="bg-[#1a7f37] hover:bg-[#15662c] text-white border-none"
              >
                {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. Delete College Confirmation Modal */}
      {isDeleteModalOpen && deletingCollege && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm College Deletion"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <p className="font-semibold">Are you sure you want to delete this college?</p>
                <p className="mt-1">
                  You are about to remove <strong>{deletingCollege.name}</strong> ({deletingCollege.code}).
                  All linked records will be archived.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                {isSubmittingDelete ? 'Deleting...' : 'Yes, Delete College'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Shared Add College Modal */}
      {isAddModalOpen && (
        <AddCollegeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onTriggerToast={onTriggerToast}
        />
      )}
    </div>
  )
}
