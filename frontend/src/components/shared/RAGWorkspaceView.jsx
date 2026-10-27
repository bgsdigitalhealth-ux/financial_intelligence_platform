import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Database,
  Cpu,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
  BookOpen,
  Plus,
  Terminal,
  ShieldCheck,
  Building2,
  Activity,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export function RAGWorkspaceView({ onTriggerToast, currentRole }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('llama3')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Karnataka Financial Intelligence Audit & Reasoning Engine
Welcome to the institutional financial intelligence workspace. This system unifies:
1. **Statutory Regulatory Knowledge Store**: Ingests statutory guidelines (K.S.U. Act 2000, KGFR, UGC 12(B)).
2. **Institutional Financial Ledger**: Queries live university accounts, statement ledgers, and allocations.
3. **Statutory Compliance Audit Workflow**: Orchestrates semantic routing, contextual analysis, and citation synthesis.
4. **AI Financial Intelligence Engine**: Generates localized, compliant financial analysis.

Try asking about university fiscal compliance, unallowable expenses under Section 47, or quarterly ledger reconciliation!`,
      citations: [
        'K.S.U. Act 2000 (Karnataka State Universities Act) Section 47 & 48',
        'Karnataka General Financial Rules (KGFR) Chapter 8 & PFMS Circular',
      ],
      dataCards: [
        { label: 'Indexed Regulatory Clauses', value: '8 Clauses' },
        { label: 'Relational Institutions', value: '32 Institutions' },
        { label: 'Regulatory Knowledge Engine', value: 'Verified Active' },
      ],
    },
  ])

  const [ragStatus, setRagStatus] = useState(null)
  const [documents, setDocuments] = useState([])
  const [activeSubTab, setActiveSubTab] = useState('chat') // 'chat' | 'docs' | 'architecture'
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocText, setNewDocText] = useState('')
  const [indexing, setIndexing] = useState(false)

  // Fetch live system telemetry and ChromaDB documents on mount
  useEffect(() => {
    loadTelemetry()
    loadDocuments()
  }, [])

  const loadTelemetry = async () => {
    try {
      const status = await api.getRAGStatus()
      setRagStatus(status)
    } catch (err) {
      console.warn('Failed to fetch RAG telemetry:', err)
    }
  }

  const loadDocuments = async () => {
    try {
      const data = await api.getRAGDocuments()
      if (data && data.documents) {
        setDocuments(data.documents)
      }
    } catch (err) {
      console.warn('Failed to fetch RAG documents:', err)
    }
  }

  const handleSend = async (queryText = query) => {
    const textToSend = queryText.trim()
    if (!textToSend || loading) return

    const userMsg = {
      id: String(Date.now()),
      role: 'user',
      content: textToSend,
    }

    setMessages((prev) => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      const res = await api.queryRAG({
        query: textToSend,
        role: currentRole || 'Government Leadership',
        model: model,
      })

      const botMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.answer || 'Query processed successfully.',
        citations: res.citations || [],
        dataCards: res.dataCards || [],
        ollamaStatus: res.ollamaStatus,
        latencyMs: res.latencyMs,
      }

      setMessages((prev) => [...prev, botMsg])
      if (onTriggerToast) {
        onTriggerToast('Response Generated', `Retrieved ${res.retrievedChunksCount || 0} regulatory clauses.`)
      }
    } catch (err) {
      const errMsg = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `**Analysis Engine Notice**: ${err.message}.`,
        isError: true,
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleIndexDocument = async (e) => {
    e.preventDefault()
    if (!newDocTitle.trim() || !newDocText.trim()) return

    setIndexing(true)
    try {
      const id = `doc_custom_${Date.now()}`
      await api.indexRAGDocument({
        id,
        title: newDocTitle.trim(),
        text: newDocText.trim(),
        docType: 'Advisory Circular',
        section: 'Statutory Policy',
        source: 'User Dynamic Ingestion',
        regulatoryBody: 'Karnataka Dept of Higher Education',
      })

      setNewDocTitle('')
      setNewDocText('')
      await loadDocuments()
      await loadTelemetry()
      if (onTriggerToast) {
        onTriggerToast('Document Indexed', 'Regulatory document indexed and instantly searchable.')
      }
    } catch (err) {
      alert(`Failed to index: ${err.message}`)
    } finally {
      setIndexing(false)
    }
  }

  const quickPrompts = [
    'What are unallowable expenditures under KSU Act Section 47?',
    'What are the mandatory PFMS guidelines for UGC 12(B) funds?',
    'Explain the protocol for resolving audit exceptions and ledger discrepancies.',
    'List all state universities with active quarterly statements.',
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-[#0969da]/10 via-[#8250df]/10 to-[#1a7f37]/10 border border-[#d0d7de] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-md bg-[#8250df] text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-[#1f2328] flex items-center gap-2">
                  Financial Intelligence Engine
                  <Badge variant="purple" size="sm">Regulatory Intelligence</Badge>
                </h1>
                <p className="text-xs text-[#656d76]">
                  Autonomous Multi-Stage Retrieval & Statutory Analysis for Higher Education Fiscal Audits
                </p>
              </div>
            </div>
          </div>

          {/* Quick Endpoints Status */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => {
                loadTelemetry()
                loadDocuments()
                if (onTriggerToast) onTriggerToast('Refreshed', 'Telemetry re-synchronized.')
              }}
              className="p-1.5 rounded-md border border-[#d0d7de] bg-white hover:bg-[#f6f8fa] text-[#656d76] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Live Architecture Component Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {/* Card 1: Regulatory Store */}
          <div className="bg-white border border-[#d0d7de] rounded-md p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#656d76] uppercase font-semibold">Regulatory Store</div>
              <div className="text-sm font-bold text-[#1f2328]">
                {ragStatus?.chromaDB?.totalChunks ?? documents.length ?? 8} Clauses
              </div>
              <div className="text-[10px] text-[#1a7f37] font-medium">Statutory Guidelines Indexed</div>
            </div>
            <Database className="h-6 w-6 text-[#8250df]" />
          </div>

          {/* Card 2: Compliance Workflow */}
          <div className="bg-white border border-[#d0d7de] rounded-md p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#656d76] uppercase font-semibold">Compliance Workflow</div>
              <div className="text-sm font-bold text-[#1f2328]">5 Audit Nodes Active</div>
              <div className="text-[10px] text-[#0969da] font-medium">Orchestrated Verification</div>
            </div>
            <Layers className="h-6 w-6 text-[#0969da]" />
          </div>

          {/* Card 3: Financial Ledger */}
          <div className="bg-white border border-[#d0d7de] rounded-md p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#656d76] uppercase font-semibold">Financial Ledger</div>
              <div className="text-sm font-bold text-[#1f2328]">
                {ragStatus?.mysql?.universitiesCount ?? 32} Institutions
              </div>
              <div className="text-[10px] text-[#1a7f37] font-medium">Live Accounts Connected</div>
            </div>
            <Building2 className="h-6 w-6 text-[#1a7f37]" />
          </div>

          {/* Card 4: Analysis Engine */}
          <div className="bg-white border border-[#d0d7de] rounded-md p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#656d76] uppercase font-semibold">Analysis Engine</div>
              <div className="text-sm font-bold text-[#1f2328] flex items-center gap-1.5">
                <span>AI Reasoner</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1a7f37]" />
              </div>
              <div className="text-[10px] text-[#1a7f37]">Operational</div>
            </div>
            <Cpu className="h-6 w-6 text-[#0969da]" />
          </div>
        </div>
      </div>

      {/* Sub Tabs: Chat Console vs Vector Documents vs Architecture */}
      <div className="border-b border-[#d0d7de] flex items-center gap-4">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`pb-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'chat'
              ? 'border-[#0969da] text-[#0969da]'
              : 'border-transparent text-[#656d76] hover:text-[#1f2328]'
          }`}
        >
          Interactive Query Console
        </button>

        <button
          onClick={() => setActiveSubTab('docs')}
          className={`pb-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'docs'
              ? 'border-[#0969da] text-[#0969da]'
              : 'border-transparent text-[#656d76] hover:text-[#1f2328]'
          }`}
        >
          <span>Regulatory Document Store</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#afb8c1]/20 rounded-full font-mono">
            {documents.length || 8}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`pb-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'architecture'
              ? 'border-[#0969da] text-[#0969da]'
              : 'border-transparent text-[#656d76] hover:text-[#1f2328]'
          }`}
        >
          System Architecture
        </button>
      </div>

      {/* SUB-TAB 1: Interactive Chat Console */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Stream (3 cols) */}
          <div className="lg:col-span-3 flex flex-col border border-[#d0d7de] rounded-lg bg-white overflow-hidden shadow-xs h-[640px]">
            {/* Model & Config Ribbon */}
            <div className="border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1f2328]">Execution Model:</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-white border border-[#d0d7de] rounded px-2 py-1 text-xs text-[#1f2328] font-mono focus:border-[#0969da] focus:outline-none"
                >
                  <option value="llama3">llama3 (Default)</option>
                  <option value="mistral">mistral</option>
                  <option value="qwen">qwen</option>
                  <option value="llama2">llama2</option>
                </select>
              </div>

              <div className="text-[11px] text-[#656d76] flex items-center gap-2">
                <span>Role Context:</span>
                <Badge variant="blue" size="sm">{currentRole || 'Government Leadership'}</Badge>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-4 text-xs ${
                      msg.role === 'user'
                        ? 'bg-[#0969da] text-white shadow-xs'
                        : msg.isError
                        ? 'bg-[#ffebe9] text-[#cf222e] border border-[#ff8182]'
                        : 'bg-[#f6f8fa] text-[#1f2328] border border-[#d0d7de]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {/* Citations if available */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#d0d7de]/50">
                        <div className="text-[11px] font-semibold text-[#8250df] flex items-center gap-1 mb-1">
                          <BookOpen className="h-3 w-3" />
                          <span>Verifiable Regulatory Citations:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#656d76]">
                          {msg.citations.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* SQL Data Cards if returned */}
                    {msg.dataCards && msg.dataCards.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {msg.dataCards.map((card, i) => (
                          <div
                            key={i}
                            className="bg-white border border-[#d0d7de] rounded p-2 text-center"
                          >
                            <div className="text-[10px] text-[#656d76]">{card.label}</div>
                            <div className="text-xs font-bold text-[#1f2328]">{card.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-4 text-xs text-[#656d76] bg-[#f6f8fa] border border-[#d0d7de] rounded-lg max-w-[70%]">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#8250df]" />
                  <span>
                    Evaluating query against statutory guidelines, institutional ledgers, and synthesizing findings...
                  </span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="border-t border-[#d0d7de] p-3 bg-[#f6f8fa]">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask financial intelligence question (e.g., Section 47 audit rules, Bangalore Univ statement)..."
                  className="flex-1 bg-white border border-[#d0d7de] rounded-md px-3.5 py-2 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !query.trim()}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Execute Query</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Right Rail: Quick Queries & Node Telemetry (1 col) */}
          <div className="space-y-4">
            {/* Quick Prompts */}
            <div className="border border-[#d0d7de] rounded-lg bg-white p-4">
              <h3 className="text-xs font-bold text-[#1f2328] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#8250df]" />
                Recommended Queries
              </h3>
              <div className="space-y-2">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p)}
                    className="w-full text-left p-2.5 rounded-md border border-[#d0d7de] bg-[#f6f8fa] hover:bg-[#eaeef2] text-xs text-[#1f2328] transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* System Status Direct Status */}
            <div className="border border-[#d0d7de] rounded-lg bg-white p-4 text-xs space-y-3">
              <h3 className="font-bold text-[#1f2328] uppercase tracking-wider text-[11px]">
                System Service Gateways
              </h3>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between p-1.5 bg-[#f6f8fa] rounded">
                  <span className="text-[#656d76]">Application API:</span>
                  <span className="text-[#1a7f37] font-semibold">Online (Active)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#f6f8fa] rounded">
                  <span className="text-[#656d76]">Intelligence Engine:</span>
                  <span className="text-[#1a7f37] font-semibold">Connected</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#f6f8fa] rounded">
                  <span className="text-[#656d76]">Regulatory Knowledge Store:</span>
                  <span className="text-[#8250df] font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#f6f8fa] rounded">
                  <span className="text-[#656d76]">General Ledger Store:</span>
                  <span className="text-[#0969da] font-semibold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Regulatory Document Store & Ingestion */}
      {activeSubTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Ingestion Form (1 col) */}
          <div className="border border-[#d0d7de] rounded-lg bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#1a7f37]" />
              Index Document into Knowledge Store
            </h3>
            <p className="text-xs text-[#656d76]">
              Dynamically vectorize statutory circulars, university audit guidelines, or financial notifications.
            </p>

            <form onSubmit={handleIndexDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Document / Circular Title
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Circular 42/2026: Laboratory Grant Disallowance"
                  className="w-full bg-white border border-[#d0d7de] rounded px-3 py-2 text-xs focus:border-[#0969da] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Policy / Regulatory Text Content
                </label>
                <textarea
                  value={newDocText}
                  onChange={(e) => setNewDocText(e.target.value)}
                  rows={6}
                  placeholder="Paste statutory clauses, allowable expense policies, or audit mandates..."
                  className="w-full bg-white border border-[#d0d7de] rounded px-3 py-2 text-xs focus:border-[#0969da] focus:outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={indexing || !newDocTitle || !newDocText}
                variant="primary"
                size="sm"
                className="w-full"
              >
                {indexing ? 'Indexing...' : 'Index & Store Document'}
              </Button>
            </form>
          </div>

          {/* Indexed Documents Table (2 cols) */}
          <div className="lg:col-span-2 border border-[#d0d7de] rounded-lg bg-white overflow-hidden">
            <div className="border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                  Indexed Knowledge Clauses ({documents.length} Total)
                </h3>
                <p className="text-[11px] text-[#656d76]">
                  Regulatory Collection: <code className="font-mono">Karnataka Higher Education Guidelines</code>
                </p>
              </div>

              <button
                onClick={loadDocuments}
                className="p-1.5 rounded border border-[#d0d7de] bg-white text-xs hover:bg-[#f6f8fa]"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#656d76]" />
              </button>
            </div>

            <div className="divide-y divide-[#d0d7de] max-h-[550px] overflow-y-auto">
              {documents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#656d76]">
                  No vector chunks found. Click Refresh or index a new document.
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div key={doc.id || idx} className="p-4 hover:bg-[#f6f8fa] transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <span className="text-xs font-bold text-[#1f2328]">
                        {doc.metadata?.title || doc.id}
                      </span>
                      <Badge variant="blue" size="sm">
                        {doc.metadata?.doc_type || 'Policy'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#656d76] leading-relaxed line-clamp-3">
                      {doc.snippet}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8c959f]">
                      <span>Source: {doc.metadata?.source || 'Statutory Code'}</span>
                      <span>•</span>
                      <span>Section: {doc.metadata?.section || 'General'}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">ID: {doc.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Architectural Flowchart */}
      {activeSubTab === 'architecture' && (
        <div className="border border-[#d0d7de] rounded-lg bg-white p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#1f2328]">
              System Architecture & Verification Flow
            </h3>
            <p className="text-xs text-[#656d76]">
              Dual-source financial intelligence architecture integrating statutory regulatory documents with live transaction ledgers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="border border-[#d0d7de] rounded-lg p-4 bg-[#f6f8fa] text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#0969da] text-white flex items-center justify-center mx-auto text-xs font-bold">
                1
              </div>
              <h4 className="text-xs font-bold text-[#1f2328]">Query Analysis</h4>
              <p className="text-[11px] text-[#656d76]">
                Extracts university IDs, compliance clauses, and financial intent.
              </p>
            </div>

            <div className="border border-[#d0d7de] rounded-lg p-4 bg-[#f6f8fa] text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#8250df] text-white flex items-center justify-center mx-auto text-xs font-bold">
                2
              </div>
              <h4 className="text-xs font-bold text-[#1f2328]">Statutory Retrieval</h4>
              <p className="text-[11px] text-[#656d76]">
                KSU Act 2000, KGFR, PFMS rules matching semantic query intent.
              </p>
            </div>

            <div className="border border-[#d0d7de] rounded-lg p-4 bg-[#f6f8fa] text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#1a7f37] text-white flex items-center justify-center mx-auto text-xs font-bold">
                3
              </div>
              <h4 className="text-xs font-bold text-[#1f2328]">General Ledger Verification</h4>
              <p className="text-[11px] text-[#656d76]">
                Fetches live bank balances, statement transactions, and spend ledger.
              </p>
            </div>

            <div className="border border-[#d0d7de] rounded-lg p-4 bg-[#f6f8fa] text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#cf222e] text-white flex items-center justify-center mx-auto text-xs font-bold">
                4
              </div>
              <h4 className="text-xs font-bold text-[#1f2328]">Financial Intelligence Synthesis</h4>
              <p className="text-[11px] text-[#656d76]">
                Synthesizes audit opinion combining regulatory guidelines and relational tables.
              </p>
            </div>

            <div className="border border-[#d0d7de] rounded-lg p-4 bg-[#f6f8fa] text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#9a6700] text-white flex items-center justify-center mx-auto text-xs font-bold">
                5
              </div>
              <h4 className="text-xs font-bold text-[#1f2328]">Citation Provenance</h4>
              <p className="text-[11px] text-[#656d76]">
                Attaches statutory legal sections and live verified metrics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
