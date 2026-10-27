import React, { useState } from 'react'
import { X, Plus, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function AddPolicyModal({ isOpen, onClose, onAddPolicy, onTriggerToast }) {
  const [formData, setFormData] = useState({
    policyCode: `POL-KA-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
    title: '',
    category: 'Statutory Compliance',
    scope: 'All Colleges',
    directive: '',
    thresholdValue: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Policy title is required.')
      return
    }
    if (!formData.directive.trim()) {
      setError('Policy directive guidelines are required.')
      return
    }

    try {
      setIsSubmitting(true)
      await onAddPolicy({
        ...formData,
        status: 'Active',
      })
      if (onTriggerToast) {
        onTriggerToast('Policy Enacted', `Policy [${formData.policyCode}] "${formData.title}" is now active and enforced across all colleges.`)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to enact policy.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-xl rounded-lg border border-[#d0d7de] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#d0d7de] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0969da]" />
            <h3 className="text-sm font-semibold text-[#1f2328]">
              Enact New State Government Policy
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#1f2328]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-md border border-[#ff8182] bg-[#ffebe9] p-3 text-xs text-[#cf222e] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Policy Code *
              </label>
              <input
                type="text"
                name="policyCode"
                value={formData.policyCode}
                onChange={handleChange}
                required
                className="w-full h-8 rounded-md border border-[#d0d7de] px-2.5 text-xs text-[#1f2328] font-mono focus:border-[#0969da] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Policy Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-8 rounded-md border border-[#d0d7de] px-2.5 text-xs text-[#1f2328] bg-white focus:border-[#0969da] focus:outline-none"
              >
                <option value="Statutory Compliance">Statutory Compliance</option>
                <option value="Grant Utilization">Grant Utilization</option>
                <option value="Allowable Cost">Allowable Cost</option>
                <option value="Audit & Procurement">Audit & Procurement</option>
                <option value="Fiscal Transparency">Fiscal Transparency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2328] mb-1">
              Policy Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Mandatory Quarterly PFMS Bank Statement Reconciliation"
              required
              className="w-full h-8 rounded-md border border-[#d0d7de] px-2.5 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Applicable Scope
              </label>
              <input
                type="text"
                name="scope"
                value={formData.scope}
                disabled
                className="w-full h-8 rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2.5 text-xs text-[#57606a] cursor-not-allowed"
              />
              <span className="text-[10px] text-[#656d76]">
                Enforced statewide across all colleges & universities
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Effective Date
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                className="w-full h-8 rounded-md border border-[#d0d7de] px-2.5 text-xs text-[#1f2328] bg-white focus:border-[#0969da] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2328] mb-1">
              Compliance Threshold / Benchmark
            </label>
            <input
              type="text"
              name="thresholdValue"
              value={formData.thresholdValue}
              onChange={handleChange}
              placeholder="e.g. 100% vouchers reconciled, max 5% budget variance"
              className="w-full h-8 rounded-md border border-[#d0d7de] px-2.5 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2328] mb-1">
              Mandatory Directive / Guidelines *
            </label>
            <textarea
              name="directive"
              value={formData.directive}
              onChange={handleChange}
              rows={3}
              placeholder="Specify the regulatory guidelines and statutory rules all colleges must follow..."
              required
              className="w-full rounded-md border border-[#d0d7de] p-2.5 text-xs text-[#1f2328] focus:border-[#0969da] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d0d7de]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="blue"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enacting Policy...' : 'Enact Policy Across All Colleges'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
