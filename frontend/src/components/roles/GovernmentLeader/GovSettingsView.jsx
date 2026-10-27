import React, { useState, useMemo } from 'react'
import {
  Settings,
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

export function GovSettingsView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    updateUniversity,
    deleteUniversity,
    refreshBackendData,
  } = useFinancialData()

  const { refreshAuthData } = useAuth()

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Copied State
  const [copiedKey, setCopiedKey] = useState('')

  // Add College Modal State (uses shared AddCollegeModal)
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

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2500)
    if (onTriggerToast) {
      onTriggerToast('Copied', text, 'success')
    }
  }

  // Filtered universities
  const filteredUniversities = useMemo(() => {
    return universities.filter((u) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.code && u.code.toLowerCase().includes(q)) ||
        (u.officialEmail && u.officialEmail.toLowerCase().includes(q)) ||
        (u.financeEmail && u.financeEmail.toLowerCase().includes(q)) ||
        (u.district && u.district.toLowerCase().includes(q)) ||
        (u.institutionType && u.institutionType.toLowerCase().includes(q))

      const matchesType = selectedType === 'ALL' || u.institutionType === selectedType
      const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [universities, searchQuery, selectedType, selectedStatus])

  // Total allocation
  const totalAllocated = useMemo(() => {
    return universities.reduce((acc, u) => acc + (Number(u.allocatedAmount) || 0), 0)
  }, [universities])

  // Handle Edit Open
  const handleOpenEdit = (college) => {
    setEditingCollege({
      ...college,
      allocatedAmount: college.allocatedAmount ? String(college.allocatedAmount) : '0',
    })
    setIsEditModalOpen(true)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingCollege) return

    if (!editingCollege.name.trim()) {
      if (onTriggerToast) onTriggerToast('Missing Name', 'Official college legal name is required.', 'danger')
      return
    }
    if (!editingCollege.officialEmail.trim() || !emailRegex.test(editingCollege.officialEmail.trim())) {
      if (onTriggerToast) onTriggerToast('Invalid Email', 'A valid official institutional email is required.', 'danger')
      return
    }
    if (!editingCollege.financeEmail.trim() || !emailRegex.test(editingCollege.financeEmail.trim())) {
      if (onTriggerToast) onTriggerToast('Invalid Email', 'A valid authorized finance email is required.', 'danger')
      return
    }

    setIsSubmittingEdit(true)
    try {
      await updateUniversity(editingCollege.id, {
        name: editingCollege.name.trim(),
        code: editingCollege.code.trim().toUpperCase(),
        institutionType: editingCollege.institutionType,
        officialEmail: editingCollege.officialEmail.trim().toLowerCase(),
        financeEmail: editingCollege.financeEmail.trim().toLowerCase(),
        state: editingCollege.state || 'Karnataka',
        district: editingCollege.district,
        address: editingCollege.address,
        affiliatedUniversity: editingCollege.affiliatedUniversity,
        allocatedAmount: Number(editingCollege.allocatedAmount) || 0,
        status: editingCollege.status || 'Optimal',
      })

      if (refreshAuthData) await refreshAuthData()

      setIsSubmittingEdit(false)
      setIsEditModalOpen(false)
      setEditingCollege(null)

      if (onTriggerToast) {
        onTriggerToast('College Updated', `Records for ${editingCollege.name} updated!`, 'success')
      }
    } catch (err) {
      setIsSubmittingEdit(false)
      if (onTriggerToast) {
        onTriggerToast('Update Failed', err.message || 'Could not update college data.', 'danger')
      }
    }
  }

  // Handle Delete Open
  const handleOpenDelete = (college) => {
    setDeletingCollege(college)
    setIsDeleteModalOpen(true)
  }

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deletingCollege) return
    setIsSubmittingDelete(true)
    try {
      await deleteUniversity(deletingCollege.id)
      if (refreshAuthData) await refreshAuthData()

      setIsSubmittingDelete(false)
      setIsDeleteModalOpen(false)
      const collegeName = deletingCollege.name
      setDeletingCollege(null)

      if (onTriggerToast) {
        onTriggerToast('College Deleted', `${collegeName} removed from registry.`, 'success')
      }
    } catch (err) {
      setIsSubmittingDelete(false)
      if (onTriggerToast) {
        onTriggerToast('Delete Failed', err.message || 'Could not delete college.', 'danger')
      }
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner (Clean, Zero Description Clutter) */}
      <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-bold tracking-tight text-[#1f2328] flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#0969da]" />
            College Registry & Administration Settings
          </h1>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBackendData}
              className="flex items-center gap-1.5 text-xs text-[#24292f]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#57606a]" />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 text-xs shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add New College
            </Button>
          </div>
        </div>

        {/* Dynamic Registry Stats Ribbon (Numbers Only) */}
        <div className="mt-4 pt-4 border-t border-[#d0d7de]/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              Total Listed Colleges
            </div>
            <div className="text-xl font-bold text-[#1f2328] mt-1 font-mono">
              {universities.length}
            </div>
          </div>

          <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              Total State Budget
            </div>
            <div className="text-xl font-bold text-[#1f2328] mt-1 font-mono">
              {formatCurrency(totalAllocated)}
            </div>
          </div>

          <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              Dual Auth Accounts
            </div>
            <div className="text-xl font-bold text-[#1f2328] mt-1 font-mono">
              {universities.length * 2}
            </div>
          </div>

          <div className="p-3 bg-[#f6f8fa] rounded-lg border border-[#d0d7de]/50">
            <div className="text-[11px] font-medium text-[#57606a] uppercase tracking-wider">
              Optimal Campuses
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
              {universities.filter((u) => u.status === 'Optimal').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Listed Colleges Data Table */}
      <div className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#57606a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by college name, code, email, or district..."
              className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] pl-9 pr-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              {INSTITUTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Optimal">Optimal</option>
              <option value="Watch">Watch</option>
              <option value="Critical">Critical</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add College
            </Button>
          </div>
        </div>

        {/* Table View */}
        {filteredUniversities.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#d0d7de] rounded-lg">
            <Building2 className="h-8 w-8 text-[#57606a] mx-auto mb-2 opacity-40" />
            <div className="text-xs font-semibold text-[#1f2328]">No Colleges Found</div>
            {universities.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 text-xs"
              >
                + Add College
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">College Legal Name & Code</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Official Email</th>
                  <th className="py-2.5 px-3">Authorized Finance Email</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">State Budget</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {filteredUniversities.map((college) => {
                  const alloc = Number(college.allocatedAmount) || 0
                  const isCopiedOfficial = copiedKey === `off-${college.id}`
                  const isCopiedFinance = copiedKey === `fin-${college.id}`

                  return (
                    <tr key={college.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-xs text-[#1f2328]">{college.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-[#57606a] bg-[#eaeef2] px-1.5 py-0.2 rounded">
                            {college.code}
                          </span>
                          {college.affiliatedUniversity && (
                            <span className="text-[10px] text-[#656d76]">
                              • Affil: {college.affiliatedUniversity}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px]">
                          {college.institutionType || 'State Public'}
                        </Badge>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-[#1f2328]">
                            {college.officialEmail || 'N/A'}
                          </span>
                          {college.officialEmail && (
                            <button
                              onClick={() => handleCopy(college.officialEmail, `off-${college.id}`)}
                              className="text-[#57606a] hover:text-[#0969da] cursor-pointer"
                              title="Copy official email"
                            >
                              {isCopiedOfficial ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-[#0969da]">
                            {college.financeEmail || 'N/A'}
                          </span>
                          {college.financeEmail && (
                            <button
                              onClick={() => handleCopy(college.financeEmail, `fin-${college.id}`)}
                              className="text-[#57606a] hover:text-[#0969da] cursor-pointer"
                              title="Copy finance email"
                            >
                              {isCopiedFinance ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-[#57606a]">
                        <div className="flex items-center gap-1 text-xs text-[#1f2328]">
                          <MapPin className="h-3 w-3 text-[#57606a]" />
                          <span>{college.district || 'Karnataka'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-semibold text-[#1f2328]">
                        {formatCurrency(alloc)}
                      </td>

                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            college.status === 'Optimal'
                              ? 'success'
                              : college.status === 'Watch'
                              ? 'warning'
                              : 'danger'
                          }
                          className="text-[10px]"
                        >
                          {college.status || 'Optimal'}
                        </Badge>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(college)}
                            className="p-1.5 text-[#57606a] hover:text-[#0969da] hover:bg-[#f6f8fa] rounded cursor-pointer transition-colors"
                            title="Update college data"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(college)}
                            className="p-1.5 text-[#57606a] hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete college"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shared Add College Modal (100% Identical to All College Modal) */}
      <AddCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTriggerToast={onTriggerToast}
      />

      {/* UPDATE COLLEGE MODAL */}
      {editingCollege && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => !isSubmittingEdit && setIsEditModalOpen(false)}
          title={`Update College: ${editingCollege.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-3.5 pt-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Official Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCollege.name}
                  onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
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
                  value={editingCollege.code}
                  onChange={(e) => setEditingCollege({ ...editingCollege, code: e.target.value.toUpperCase() })}
                  className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 font-mono text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Institution Type</label>
                <select
                  value={editingCollege.institutionType || 'State Public University'}
                  onChange={(e) => setEditingCollege({ ...editingCollege, institutionType: e.target.value })}
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
                <label className="block font-semibold text-[#1f2328] mb-1">Affiliated University</label>
                <input
                  type="text"
                  value={editingCollege.affiliatedUniversity || ''}
                  onChange={(e) => setEditingCollege({ ...editingCollege, affiliatedUniversity: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Official Institutional Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editingCollege.officialEmail || ''}
                  onChange={(e) => setEditingCollege({ ...editingCollege, officialEmail: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 font-mono text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">
                  Authorized Finance Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editingCollege.financeEmail || ''}
                  onChange={(e) => setEditingCollege({ ...editingCollege, financeEmail: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-[#0969da]/50 bg-white px-3 font-mono text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">District</label>
                <select
                  value={editingCollege.district || 'Bengaluru Urban'}
                  onChange={(e) => setEditingCollege({ ...editingCollege, district: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
                >
                  {KARNATAKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Status</label>
                <select
                  value={editingCollege.status || 'Optimal'}
                  onChange={(e) => setEditingCollege({ ...editingCollege, status: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
                >
                  <option value="Optimal">Optimal</option>
                  <option value="Watch">Watch</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Campus Address</label>
              <input
                type="text"
                value={editingCollege.address || ''}
                onChange={(e) => setEditingCollege({ ...editingCollege, address: e.target.value })}
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">
                Allocated State Budget (₹)
              </label>
              <input
                type="number"
                value={editingCollege.allocatedAmount || '0'}
                onChange={(e) => setEditingCollege({ ...editingCollege, allocatedAmount: e.target.value })}
                className="w-full h-8.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-3 font-mono text-xs text-[#1f2328] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmittingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingEdit}
              >
                {isSubmittingEdit ? 'Saving...' : 'Save Updates'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE COLLEGE CONFIRMATION */}
      {deletingCollege && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isSubmittingDelete && setIsDeleteModalOpen(false)}
          title="Delete College"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Are you sure?
              </div>
              <p className="text-[11px] leading-relaxed text-red-700">
                You are about to delete <strong>{deletingCollege.name}</strong> ({deletingCollege.code}).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmittingDelete}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDeleteSubmit}
                disabled={isSubmittingDelete}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isSubmittingDelete ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
