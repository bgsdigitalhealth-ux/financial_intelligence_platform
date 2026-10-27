import React, { useState } from 'react'
import {
  Cpu,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  PlusCircle,
  Bell,
  Clock,
  Shield,
  ToggleLeft,
  ToggleRight,
  Settings,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function AlertRuleEngine({ onTriggerToast }) {
  const { alertRules = [], toggleRule, updateRule, addRule } = useFinancialData()
  const [editingRule, setEditingRule] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New Rule Modal
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Allowable Costs')
  const [newCondition, setNewCondition] = useState('Single conference travel voucher > ₹5,00,000')
  const [newAction, setNewAction] = useState('Quarantine for Comptroller Review')

  const handleToggle = (ruleId) => {
    toggleRule(ruleId)
    onTriggerToast('Rule Policy Toggled', 'Dynamic tripwire state updated across all campuses.')
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingRule) return
    updateRule(editingRule.id, editingRule)
    setIsModalOpen(false)
    onTriggerToast('Rule Policy Saved', `Updated conditions for ${editingRule.title}.`)
    setEditingRule(null)
  }

  const handleCreateRule = (e) => {
    e.preventDefault()
    if (!newTitle) return
    const created = addRule({
      title: newTitle,
      category: newCategory,
      condition: newCondition,
      action: newAction,
    })
    setIsNewRuleModalOpen(false)
    setNewTitle('')
    onTriggerToast('Automated Rule Active', `Enrolled ${created.title} into enforcement engine.`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1f2328] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#0969da]" />
            Financial Intelligence Automated Rule & Anomaly Trigger Engine
          </h2>
          <p className="text-xs text-[#656d76]">
            Configures automated compliance tripwires, encumbrance ceilings, and real-time alerts dispatched across all campuses
          </p>
        </div>
        <Button
          variant="blue"
          size="sm"
          onClick={() => setIsNewRuleModalOpen(true)}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Create Alert Rule
        </Button>
      </div>

      <div className="space-y-4">
        {alertRules.map((rule) => {
          return (
            <Card
              key={rule.id}
              className={`transition-all ${
                rule.enabled ? 'border-[#d0d7de]' : 'border-[#d0d7de]/50 opacity-65 bg-[#f6f8fa]/40'
              }`}
            >
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-[#1f2328]">{rule.title}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {rule.category}
                    </Badge>
                    <Badge variant={rule.enabled ? 'success' : 'outline'} className="text-[10px]">
                      {rule.enabled ? 'Active Trigger' : 'Paused'}
                    </Badge>
                  </div>

                  <div className="text-xs text-[#1f2328] pt-1">
                    <span className="text-[#656d76]">Trigger Condition: </span>
                    <code className="bg-[#f6f8fa] px-1.5 py-0.5 rounded border border-[#d0d7de] font-mono text-[11px] text-[#0969da]">
                      {rule.condition}
                    </code>
                  </div>

                  <div className="text-xs text-[#1f2328]">
                    <span className="text-[#656d76]">Automated System Action: </span>
                    <span className="font-medium">{rule.action}</span>
                  </div>

                  <div className="text-[11px] text-[#656d76] flex items-center gap-1.5 pt-1">
                    <Clock className="h-3 w-3 text-[#57606a]" />
                    <span>Last Fired: {rule.lastTriggered}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingRule(rule)
                      setIsModalOpen(true)
                    }}
                    className="bg-white"
                  >
                    <Settings className="h-3 w-3" />
                    Configure
                  </Button>
                  <Button
                    variant={rule.enabled ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggle(rule.id)}
                    className="w-20"
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Configure Rule: ${editingRule.title}`}
          description={`Rule ID: ${editingRule.id} • Category: ${editingRule.category}`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Rule Display Name</label>
              <input
                type="text"
                value={editingRule.title}
                onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Trigger Condition Logic</label>
              <input
                type="text"
                value={editingRule.condition}
                onChange={(e) => setEditingRule({ ...editingRule, condition: e.target.value })}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs font-mono text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Automated Action Dispatch</label>
              <input
                type="text"
                value={editingRule.action}
                onChange={(e) => setEditingRule({ ...editingRule, action: e.target.value })}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div className="p-2.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-[#57606a] text-[11px]">
              Changes take effect instantaneously across all active campus ERP ingestion webhooks.
            </div>
          </div>
        </Modal>
      )}

      {/* Create Rule Modal */}
      {isNewRuleModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewRuleModalOpen(false)}
          title="Create Automated Financial Risk Rule"
          description="Sets up an active heuristic trigger that monitors general ledgers continuously"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsNewRuleModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" size="sm" onClick={handleCreateRule}>
                Activate Rule
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Rule Name</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="E.g., High-Value Subcontract Invoice Check"
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              >
                <option value="Allowable Costs">Allowable Costs</option>
                <option value="Budgetary Control">Budgetary Control</option>
                <option value="Research Grants">Research Grants</option>
                <option value="Fraud & Governance">Fraud & Governance</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Condition Expression</label>
              <input
                type="text"
                required
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs font-mono text-[#1f2328] focus:border-[#0969da]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2328] mb-1">Automated Action</label>
              <input
                type="text"
                required
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-white px-2.5 text-xs text-[#1f2328] focus:border-[#0969da]"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
