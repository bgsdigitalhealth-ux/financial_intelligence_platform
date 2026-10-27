import React, { useState } from 'react'
import {
  Users,
  Search,
  PlusCircle,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  MoreVertical,
  Download,
  Trash2,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function UserManagement({ onTriggerToast, isOpenModal, onCloseModal }) {
  const { users = [], addUser, updateUser, deleteUser, universities = [] } = useFinancialData()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)

  // Form states
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('University Finance')
  const [newOrg, setNewOrg] = useState((universities || [])[0]?.name || 'Visvesvaraya Technological University (VTU)')

  const filteredUsers = (users || []).filter((u) => {
    if (!u) return false
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.organization || '').toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (roleFilter === 'all') return true
    return (u.role || '').toLowerCase() === roleFilter.toLowerCase()
  })

  const handleCreateUser = (e) => {
    e.preventDefault()
    if (!newName || !newEmail) return

    const created = addUser({
      name: newName,
      email: newEmail,
      role: newRole,
      organization: newOrg,
      permissions:
        newRole === 'Government Leader'
          ? ['Statewide Read', 'Grant Allocation Sign-off']
          : newRole === 'University Finance'
          ? ['Institutional GL Write', 'Grant Reallocation Approver']
          : ['Root Admin', 'RBAC Configuration'],
    })

    setIsNewUserModalOpen(false)
    if (onCloseModal) onCloseModal()
    setNewName('')
    setNewEmail('')
    onTriggerToast(
      'User Provisioned & Enrolled',
      `Identity created for ${created.name} (${created.role}). SAML claims issued.`
    )
  }

  const handleToggleStatus = (userId, currentStatus) => {
    const next = currentStatus === 'Active' ? 'Suspended' : 'Active'
    updateUser(userId, { status: next })
    onTriggerToast('User Status Updated', `User status changed to ${next}.`)
  }

  const handleDelete = (userId, name) => {
    deleteUser(userId)
    onTriggerToast('User Revoked', `Revoked identity for ${name}.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328]">
            Role-Based Access Control (RBAC) & Identity Directory
          </h2>
          <p className="text-xs text-[#656d76]">
            Manage identities, institutional scope, and statutory delegation authority across all campuses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTriggerToast('Exporting User Directory', 'RBAC audit list downloaded.')}
          >
            <Download className="h-3 w-3" />
            Export Directory
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={() => setIsNewUserModalOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Provision New User
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f6f8fa] p-2.5 rounded-md border border-[#d0d7de]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#57606a]" />
          <input
            type="text"
            placeholder="Search user name, email, or campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-[#d0d7de] bg-white pl-8 pr-3 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#656d76]">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328]"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="Government Leader">Government Leader</option>
            <option value="University Finance">University Finance</option>
            <option value="System Administrator">System Administrator</option>
            <option value="Government Auditor">Government Auditor</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[11px] font-semibold text-[#656d76]">
              <tr>
                <th className="py-2.5 px-4">User Name</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Institution / Affiliation</th>
                <th className="py-2.5 px-3">Delegated Permissions</th>
                <th className="py-2.5 px-3">MFA Status</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60">
              {filteredUsers.map((u) => {
                const isActive = u.status === 'Active'
                const userPermissions = Array.isArray(u.permissions)
                  ? u.permissions
                  : (typeof u.permissions === 'string' && u.permissions.trim() ? [u.permissions] : ['Standard Access'])
                return (
                  <tr key={u.id} className="hover:bg-[#f6f8fa]/80">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1f2328]">{u.name || 'User'}</div>
                      <div className="text-[10px] text-[#57606a] font-mono">{u.email || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          u.role === 'Government Leader'
                            ? 'primary'
                            : u.role === 'University Finance'
                            ? 'success'
                            : u.role === 'System Administrator'
                            ? 'purple'
                            : 'default'
                        }
                      >
                        {u.role || 'User'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-[#1f2328] font-medium">{u.organization || 'Higher Education Dept'}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {userPermissions.slice(0, 2).map((perm, idx) => (
                          <span
                            key={idx}
                            className="bg-[#f6f8fa] border border-[#d0d7de] rounded px-1.5 py-0.2 text-[10px] text-[#57606a]"
                          >
                            {perm}
                          </span>
                        ))}
                        {userPermissions.length > 2 && (
                          <span className="text-[10px] text-[#0969da] self-center">
                            +{userPermissions.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[#1a7f37] font-medium text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        MFA Enforced
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#656d76] text-[11px]">{u.lastLogin || 'Recent'}</td>
                    <td className="py-3 px-3">
                      <Badge variant={isActive ? 'success' : 'danger'}>
                        {u.status || 'Active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant={isActive ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className="h-6 px-2 text-[10px]"
                        >
                          {isActive ? 'Suspend' : 'Activate'}
                        </Button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1 text-[#57606a] hover:text-[#cf222e] rounded hover:bg-[#ffebe9]"
                          title="Delete User"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Provision User Modal */}
      {(isNewUserModalOpen || isOpenModal) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsNewUserModalOpen(false)
            if (onCloseModal) onCloseModal()
          }}
          title="Provision New Financial Identity & RBAC Policy"
          description="Enrolls account into State Higher Ed Identity Broker with SAML/SCIM claims"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsNewUserModalOpen(false)
                  if (onCloseModal) onCloseModal()
                }}
              >
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleCreateUser}>
                <PlusCircle className="h-3.5 w-3.5" />
                Issue Credential & Invite
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Dr. Samantha Ward, Ph.D."
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Official Institutional Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="officer@vtu.ac.in"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Platform Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                >
                  <option value="Government Leader">Government Leader</option>
                  <option value="University Finance">University Finance</option>
                  <option value="System Administrator">System Administrator</option>
                  <option value="Government Auditor">Government Auditor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2328] mb-1">Institution</label>
                <select
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2 text-xs text-[#1f2328] focus:border-[#0969da]"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                  <option value="State Dept of Higher Education">State Dept of Higher Education</option>
                  <option value="State Consortium IT">State Consortium IT</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md space-y-1.5">
              <span className="font-semibold text-[#1f2328] block">Mandatory Security Policies</span>
              <div className="flex items-center gap-2 text-[#57606a]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1a7f37]" />
                <span>FIDO2 WebAuthn / Hardware token MFA enforced</span>
              </div>
              <div className="flex items-center gap-2 text-[#57606a]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1a7f37]" />
                <span>Segregation-of-Duties (SoD) dual-control rules applied</span>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
