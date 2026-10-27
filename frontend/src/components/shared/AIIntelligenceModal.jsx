import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Bot,
  User,
  Database,
  ShieldCheck,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { useAuth } from '@/context/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'

export function AIIntelligenceModal({ isOpen, onClose, currentRole, onTriggerToast }) {
  const { recordAuditLog, selectedUniversityId } = useFinancialData()
  const { currentUser } = useAuth()
  const messagesEndRef = useRef(null)

  // Conversation Thread
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello! I am **FinBot**, your financial intelligence assistant.

I analyze all bank statements, accounts, transactions, and statutory policies uploaded by colleges in real time.

Ask me anything about college expenditures, uploaded statements, account balances, or compliance.`,
      timestamp: 'Online',
      dataCards: [],
      citations: [],
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isThinking])

  // Send query to Dynamic RAG Pipeline
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue
    if (!query.trim()) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsThinking(true)

    if (recordAuditLog) {
      recordAuditLog('FINBOT_QUERY', `FinBot Query: "${query.substring(0, 50)}..."`, currentRole)
    }

    try {
      const response = await api.queryRAG({
        query: query.trim(),
        role: currentRole,
        universityId: selectedUniversityId || currentUser?.universityId || null,
      })

      if (response && response.success) {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: response.answer || 'Statement and financial data analyzed successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dataCards: response.dataCards || [],
          citations: response.citations || [],
          latencyMs: response.latencyMs,
        }
        setMessages((prev) => [...prev, aiMsg])
      } else {
        throw new Error(response?.error || 'Failed to process financial query.')
      }
    } catch (err) {
      console.error('[FinBot Execution Error]', err)
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Unable to process query: ${err.message}. Please verify uploaded college statements.`,
        timestamp: 'Error',
        dataCards: [],
        citations: [],
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0969da] text-white shadow-2xs">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
              FinBot
              <Badge variant="success" className="text-[10px]">Online</Badge>
            </div>
            <div className="text-[10px] text-[#57606a]">
              Financial Intelligence Assistant
            </div>
          </div>
        </div>
      }
      size="xl"
    >
      <div className="flex flex-col h-[70vh] -mx-4 -my-4 bg-white">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0969da] text-white shadow-2xs mt-0.5">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-lg p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#0969da] text-white shadow-2xs'
                    : 'bg-[#f6f8fa] border border-[#d0d7de] text-[#1f2328]'
                }`}
              >
                {/* Message Text with basic markdown rendering */}
                <div className="space-y-2 whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Structured Live SQL Data Cards if attached */}
                {msg.dataCards && msg.dataCards.length > 0 && (
                  <div className="mt-3.5 space-y-2 pt-2 border-t border-[#d0d7de]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#0969da] flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Live Statement & Ledger Data
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.dataCards.map((card, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded border border-[#d0d7de] shadow-2xs space-y-1.5">
                          <div className="font-semibold text-xs text-[#1f2328]">{card.title}</div>
                          {card.subtitle && (
                            <div className="text-[10px] text-[#656d76]">{card.subtitle}</div>
                          )}
                          {card.metrics && (
                            <div className="grid grid-cols-2 gap-1 pt-1">
                              {card.metrics.map((m, mIdx) => (
                                <div key={mIdx} className="bg-[#f6f8fa] p-1.5 rounded">
                                  <div className="text-[9px] text-[#656d76]">{m.label}</div>
                                  <div className="font-bold text-[11px] text-[#1f2328]">{m.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {card.items && (
                            <div className="space-y-1 pt-1">
                              {card.items.map((it, itIdx) => (
                                <div key={itIdx} className="text-[10px] border-b border-[#f0f2f4] pb-1 last:border-0 flex items-center justify-between">
                                  <span className="font-medium truncate max-w-[170px]">{it.name || it.ref || it.description}</span>
                                  <span className="font-mono font-bold text-[#0969da]">{it.balance || it.amount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verifiable Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#d0d7de]/70 space-y-1 text-[10px]">
                    <div className="font-bold text-[#57606a] flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-[#1a7f37]" />
                      Verifiable Statement Citations
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {msg.citations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#d0d7de] text-[#57606a]"
                        >
                          <span className="font-semibold text-[#1f2328]">{c.title}</span>
                          {c.section && <span className="text-[#0969da]">({c.section})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Timestamp */}
                <div className="mt-2 flex items-center justify-between text-[10px] opacity-75">
                  <span>{msg.timestamp}</span>
                  {msg.latencyMs && (
                    <span className="font-mono">⚡ {msg.latencyMs}ms</span>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f2328] text-white shadow-2xs mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3 justify-start items-center text-xs text-[#57606a] p-2.5 bg-[#f6f8fa] rounded-md border border-[#d0d7de] animate-pulse max-w-md">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0969da] text-white shrink-0">
                <Sparkles className="h-3 w-3 animate-spin" />
              </div>
              <div>
                <span className="font-semibold text-[#1f2328]">FinBot Analyzing:</span> Searching uploaded college statements & ledgers...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Clean Input Bar */}
        <div className="p-3 border-t border-[#d0d7de] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask FinBot about uploaded college statements, balances, or compliance..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isThinking}
              className="flex-1 text-xs border border-[#d0d7de] rounded-md px-3 py-2 bg-[#f6f8fa] focus:bg-white focus:border-[#0969da] focus:outline-none focus:ring-1 focus:ring-[#0969da]"
            />
            <Button
              type="submit"
              variant="blue"
              size="sm"
              disabled={isThinking || !inputValue.trim()}
              className="shrink-0"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Ask FinBot
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  )
}
