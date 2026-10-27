export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://127.0.0.1:5000/api')

export const api = {
  // Universities
  async getUniversities(params = {}) {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_BASE_URL}/universities${query ? `?${query}` : ''}`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async getUniversityById(id) {
    const res = await fetch(`${API_BASE_URL}/universities/${id}`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async createUniversity(univData) {
    const res = await fetch(`${API_BASE_URL}/universities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(univData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  async updateUniversity(id, updates) {
    const res = await fetch(`${API_BASE_URL}/universities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  async deleteUniversity(id) {
    const res = await fetch(`${API_BASE_URL}/universities/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  // Bank Accounts
  async getBankAccounts(universityId) {
    const query = universityId ? `?universityId=${universityId}` : ''
    const res = await fetch(`${API_BASE_URL}/bank-accounts${query}`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async getBankAccountById(id) {
    const res = await fetch(`${API_BASE_URL}/bank-accounts/${id}`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async createBankAccount(accountData) {
    const res = await fetch(`${API_BASE_URL}/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  async updateBankAccount(id, updates) {
    const res = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  async deleteBankAccount(id) {
    const res = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  // Statements
  async getStatements(params = {}) {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_BASE_URL}/statements${query ? `?${query}` : ''}`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async getStatementById(id) {
    const res = await fetch(`${API_BASE_URL}/statements/${id}`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async deleteStatement(id) {
    const res = await fetch(`${API_BASE_URL}/statements/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  async clearAllStatements() {
    const res = await fetch(`${API_BASE_URL}/statements/clear-all`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async uploadStatement(formData) {
    const res = await fetch(`${API_BASE_URL}/statements/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async resolveException(statementId, payload) {
    const res = await fetch(`${API_BASE_URL}/statements/${statementId}/resolve-exception`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async submitStatement(statementId, payload) {
    const res = await fetch(`${API_BASE_URL}/statements/${statementId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async reviewStatement(statementId, payload) {
    const res = await fetch(`${API_BASE_URL}/statements/${statementId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  // Reports
  async getReports() {
    const res = await fetch(`${API_BASE_URL}/reports`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  // Admin / Audit Logs
  async getAuditLogs() {
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async addAuditLog(entry) {
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE_URL}/admin/reset`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async cleanAllDummyData() {
    const res = await fetch(`${API_BASE_URL}/admin/clean-dummy-data`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  // Dynamic Auth & Roles from MySQL
  async getRoles() {
    const res = await fetch(`${API_BASE_URL}/auth/roles`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async getUsers() {
    const res = await fetch(`${API_BASE_URL}/auth/users`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async login(email, password, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, otp }),
    })
    return res.json()
  },

  async sendOtp(email) {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.json()
  },

  async verifyOtp(email, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })
    return res.json()
  },

  async activateAccount({ token, password }) {
    const res = await fetch(`${API_BASE_URL}/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    return res.json()
  },

  async getActivationInfo(email) {
    const res = await fetch(`${API_BASE_URL}/auth/activation-info/${encodeURIComponent(email)}`)
    return res.json()
  },

  async selectRole(userId, roleKey) {
    const res = await fetch(`${API_BASE_URL}/auth/select-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roleKey }),
    })
    return res.json()
  },

  // Dynamic RAG Pipeline (LangGraph + ChromaDB + Ollama + MySQL)
  async queryRAG(payload) {
    const res = await fetch(`${API_BASE_URL}/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`RAG API error: ${res.status}`)
    return res.json()
  },

  async getRAGStatus() {
    const res = await fetch(`${API_BASE_URL}/rag/status`)
    if (!res.ok) throw new Error(`RAG status error: ${res.status}`)
    return res.json()
  },

  async getRAGDocuments() {
    const res = await fetch(`${API_BASE_URL}/rag/documents`)
    if (!res.ok) throw new Error(`RAG documents error: ${res.status}`)
    return res.json()
  },

  async indexRAGDocument(doc) {
    const res = await fetch(`${API_BASE_URL}/rag/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    })
    if (!res.ok) throw new Error(`RAG index error: ${res.status}`)
    return res.json()
  },

  // Dynamic Government Policies
  async getPolicies() {
    const res = await fetch(`${API_BASE_URL}/policies`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return res.json()
  },

  async createPolicy(policyData) {
    const res = await fetch(`${API_BASE_URL}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  async updatePolicy(id, updates) {
    const res = await fetch(`${API_BASE_URL}/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },

  async deletePolicy(id) {
    const res = await fetch(`${API_BASE_URL}/policies/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP error ${res.status}`)
    }
    return res.json()
  },
}

export default api
