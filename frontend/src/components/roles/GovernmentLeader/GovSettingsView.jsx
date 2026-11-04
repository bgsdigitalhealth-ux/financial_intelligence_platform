import React, { useState, useMemo } from 'react'
import {
  Settings,
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Check,
  Building2,
  Server,
  Layers,
  Database,
  Cpu,
  MoreVertical,
  Edit,
  Clock,
  Key,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function GovSettingsView({ onSelectTab, onTriggerToast }) {
  const {
    users = [],
    universities = [],
    auditLogs = [],
    refreshBackendData,
  } = useFinancialData()

  // 4 Sub-Tabs matching Panel 7
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'categories' | 'policies' | 'system'

  // User Management State
  const [userList, setUserList] = useState([
    {
      id: 'usr-1',
      name: 'Admin User',
      role: 'Super Admin',
      email: 'admin@gov.in',
      status: 'Active',
    },
    {
      id: 'usr-2',
      name: 'Finance Officer',
      role: 'Government Admin',
      email: 'finance@gov.in',
      status: 'Active',
    },
    {
      id: 'usr-3',
      name: 'Analyst',
      role: 'Viewer',
      email: 'analyst@gov.in',
      status: 'Active',
    },
    {
      id: 'usr-4',
      name: 'Auditor General',
      role: 'Statutory Auditor',
      email: 'auditor.general@gov.in',
      status: 'Active',
    },
    {
      id: 'usr-5',
      name: 'Technical Officer',
      role: 'System Administrator',
      email: 'sysadmin@gov.in',
      status: 'Active',
    },
  ])

  // Combine with backend users if available
  const combinedUsers = useMemo(() => {
    if (!users || users.length === 0) return userList
    const map = new Map()
    userList.forEach((u) => map.set(u.email, u))
    users.forEach((u, idx) => {
      map.set(u.email || `usr-db-${idx}`, {
        id: u.id || `usr-db-${idx}`,
        name: u.name || u.email?.split('@')[0] || 'System User',
        role: u.role || 'Government Admin',
        email: u.email || 'user@gov.in',
        status: u.status || 'Active',
      })
    })
    return Array.from(map.values())
  }, [userList, users])

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'Government Admin',
  })

  // Categories State
  const [categories, setCategories] = useState([
    { id: 'cat-1', name: 'Salaries & Wages', code: 'SAL', cap: '₹ 2,500 Cr', mapping: 'Direct Payroll / Vouchers' },
    { id: 'cat-2', name: 'Infrastructure', code: 'INF', cap: '₹ 800 Cr', mapping: 'Capital Works / PWD' },
    { id: 'cat-3', name: 'Utilities', code: 'UTL', cap: '₹ 400 Cr', mapping: 'Electricity, Water, Campus' },
    { id: 'cat-4', name: 'Academic Resources', code: 'ACD', cap: '₹ 350 Cr', mapping: 'Library, Lab Supplies' },
    { id: 'cat-5', name: 'Administrative', code: 'ADM', cap: '₹ 500 Cr', mapping: 'Operations, Legal, Postage' },
    { id: 'cat-6', name: 'R&D & Others', code: 'RND', cap: '₹ 600 Cr', mapping: 'Research Grants, Innovations' },
  ])

  // Policy Rules State
  const [policies, setPolicies] = useState([
    {
      id: 'pol-1',
      title: 'KGFR Rule 149 - Single Purchase Ceiling',
      limit: '₹ 5,00,000',
      description: 'Competitive public tendering mandatory for procurements > ₹ 5 Lakh.',
      status: 'Enforced',
    },
    {
      id: 'pol-2',
      title: 'K.S.U. Act 2000 § 102 - Statutory Voucher Validation',
      limit: '100% Statements',
      description: 'Quarterly filing within 30 days of quarter close.',
      status: 'Enforced',
    },
    {
      id: 'pol-3',
      title: 'Dual Control High-Value Threshold',
      limit: '₹ 20,00,000',
      description: 'Secondary sign-off required for outflows exceeding ₹ 20 Lakh.',
      status: 'Enforced',
    },
  ])

  // Handlers
  const handleAddUser = (e) => {
    e.preventDefault()
    if (!newUserData.name || !newUserData.email) return
    const user = {
      id: `usr-${Date.now()}`,
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
      status: 'Active',
    }
    setUserList([user, ...userList])
    setIsAddUserModalOpen(false)
    setNewUserData({ name: '', email: '', role: 'Government Admin' })
    if (onTriggerToast) {
      onTriggerToast('User Created', `Added ${user.name} (${user.role}).`, 'success')
    }
  }

  const handleDeleteUser = (id) => {
    setUserList(userList.filter((u) => u.id !== id))
    if (onTriggerToast) {
      onTriggerToast('User Removed', 'User deactivated from registry.', 'success')
    }
  }

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Bar (Matching Panel 7 Mockup) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
            Settings
          </h1>
          <p className="text-xs text-[#57606a] mt-0.5">
            Manage users, roles, categories and system preferences
          </p>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar: User Management | Categories | Policy Rules | System */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#d0d7de] shadow-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#0969da] text-white shadow-2xs'
              : 'text-[#57606a] hover:text-[#1f2328]'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-[#0969da] text-white shadow-2xs'
              : 'text-[#57606a] hover:text-[#1f2328]'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-[#0969da] text-white shadow-2xs'
              : 'text-[#57606a] hover:text-[#1f2328]'
          }`}
        >
          Policy Rules
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[#0969da] text-white shadow-2xs'
              : 'text-[#57606a] hover:text-[#1f2328]'
          }`}
        >
          System
        </button>
      </div>

      {/* 3. Sub-Tab 1: User Management (Matching Panel 7 Mockup Exactly) */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-[#d0d7de] bg-white shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#d0d7de]/70 pb-3">
            <h2 className="text-sm font-bold text-[#1f2328]">
              Users ({combinedUsers.length})
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddUserModalOpen(true)}
              className="h-8.5 text-xs flex items-center gap-1.5 bg-[#0969da] text-white hover:bg-[#085ec4] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5">Name</th>
                  <th className="py-3 px-3.5">Role</th>
                  <th className="py-3 px-3.5">Email</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {combinedUsers.map((u, idx) => (
                  <tr key={u.id || idx} className="hover:bg-[#f6f8fa]/80 transition-colors">
                    <td className="py-3 px-3.5 text-center font-mono text-[#57606a] font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-[#1f2328]">
                      {u.name}
                    </td>
                    <td className="py-3 px-3.5 text-[#57606a] font-medium">
                      {u.role}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#0969da]">
                      {u.email}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-[#57606a] hover:text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="rounded-xl border border-[#d0d7de] bg-white shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#d0d7de]/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328]">
                Expenditure Categories ({categories.length})
              </h2>
              <p className="text-xs text-[#57606a] mt-0.5">
                Statutory general ledger account codes and sanctioned ceiling caps
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#d0d7de]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Category Name</th>
                  <th className="py-3 px-3.5">Code</th>
                  <th className="py-3 px-3.5">Budget Ceiling</th>
                  <th className="py-3 px-3.5">Mapping Specification</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#1f2328]">{c.name}</td>
                    <td className="py-3 px-3.5 font-mono text-[#57606a]">{c.code}</td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-[#1f2328]">{c.cap}</td>
                    <td className="py-3 px-3.5 text-[#57606a]">{c.mapping}</td>
                    <td className="py-3 px-3.5 text-center">
                      <Badge variant="success" className="text-[10px]">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Sub-Tab 3: Policy Rules */}
      {activeTab === 'policies' && (
        <div className="rounded-xl border border-[#d0d7de] bg-white shadow-xs p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#1f2328]">
              Statutory Policy Engine Rules
            </h2>
            <p className="text-xs text-[#57606a] mt-0.5">
              Automated compliance threshold checks executed against university transactions
            </p>
          </div>

          <div className="space-y-3">
            {policies.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-[#d0d7de] bg-[#f6f8fa] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1f2328]">{p.title}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#57606a]">{p.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#57606a] block">Threshold</span>
                  <span className="font-mono font-bold text-xs text-[#0969da]">{p.limit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Sub-Tab 4: System Configuration */}
      {activeTab === 'system' && (
        <div className="rounded-xl border border-[#d0d7de] bg-white shadow-xs p-5 space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-bold text-[#1f2328]">
              System & Architecture Configuration
            </h2>
            <p className="text-xs text-[#57606a] mt-0.5">
              Service status, vector database, and inference endpoints
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#d0d7de] bg-[#f6f8fa] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1f2328] flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#8b5cf6]" />
                  Ollama Local Inference
                </span>
                <Badge variant="success" className="text-[10px]">Online</Badge>
              </div>
              <div className="font-mono text-[#57606a]">Endpoint: http://localhost:11434</div>
              <div className="text-[#57606a]">Model: mistral / llama3.2 (Autonomous Statement Analysis)</div>
            </div>

            <div className="p-4 rounded-xl border border-[#d0d7de] bg-[#f6f8fa] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1f2328] flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#0969da]" />
                  ChromaDB Vector Store
                </span>
                <Badge variant="success" className="text-[10px]">Connected</Badge>
              </div>
              <div className="font-mono text-[#57606a]">Collection: university_financial_rag</div>
              <div className="text-[#57606a]">Embeddings: nomic-embed-text / all-minilm</div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <Modal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          title="Add Government Admin User"
          className="max-w-md"
        >
          <form onSubmit={handleAddUser} className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                required
                placeholder="e.g. Finance Officer"
                className="w-full h-8.5 rounded-lg border border-[#d0d7de] px-2.5 text-xs text-[#1f2328]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                required
                placeholder="e.g. officer@gov.in"
                className="w-full h-8.5 rounded-lg border border-[#d0d7de] px-2.5 text-xs text-[#1f2328]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Role *
              </label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="w-full h-8.5 rounded-lg border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328]"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Government Admin">Government Admin</option>
                <option value="Viewer">Viewer</option>
                <option value="Finance Officer">Finance Officer</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#d0d7de]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="text-xs bg-[#0969da] text-white hover:bg-[#085ec4]"
              >
                Save User
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
