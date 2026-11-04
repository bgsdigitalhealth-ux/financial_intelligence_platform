import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Eye,
  Search,
  Filter,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useFinancialData } from '@/context/FinancialDataContext'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

export function AdditionalReportsView({ onSelectTab, onTriggerToast }) {
  const {
    universities = [],
    statements = [],
    bankAccounts = [],
    selectedFinancialYear,
  } = useFinancialData()

  // Sub-tabs: 'generate' | 'history'
  const [activeSubTab, setActiveSubTab] = useState('generate')

  // Form State
  const [reportType, setReportType] = useState('University Financial Summary')
  const [selectedUniversity, setSelectedUniversity] = useState('ALL')
  const [financialYear, setFinancialYear] = useState(selectedFinancialYear || 'FY 2025 - 2026')
  const [period, setPeriod] = useState('Apr 2025 - Sep 2025')

  // Preview Modal State
  const [previewReport, setPreviewReport] = useState(null)

  // Report History list
  const [reportHistory, setReportHistory] = useState([
    {
      id: 'rep-01',
      title: 'Overall Financial Summary',
      type: 'Consolidated Government Financial Summary',
      university: 'All Universities',
      period: 'Apr 2025 - Sep 2025',
      generatedOn: '2026-11-04',
      status: 'Ready',
      format: 'PDF',
    },
    {
      id: 'rep-02',
      title: 'University-wise Expenditure',
      type: 'University-wise Expenditure',
      university: 'All Universities',
      period: 'FY 2025 - 2026',
      generatedOn: '2026-11-04',
      status: 'Ready',
      format: 'PDF',
    },
    {
      id: 'rep-03',
      title: 'Compliance Report',
      type: 'Compliance Report',
      university: 'All Universities',
      period: 'FY 2025 - 2026',
      generatedOn: '2026-11-03',
      status: 'Ready',
      format: 'PDF',
    },
    {
      id: 'rep-04',
      title: 'Anomaly Analysis Report',
      type: 'AI Financial Analysis Report',
      university: 'All Universities',
      period: 'Apr 2025 - Jun 2025',
      generatedOn: '2026-11-02',
      status: 'Ready',
      format: 'PDF',
    },
  ])

  // Aggregate computations for the selected scope
  const targetUniversities = useMemo(() => {
    if (selectedUniversity === 'ALL') return universities
    return universities.filter((u) => u.id === selectedUniversity || u.code === selectedUniversity)
  }, [universities, selectedUniversity])

  const targetStatements = useMemo(() => {
    if (selectedUniversity === 'ALL') return statements
    return statements.filter(
      (s) => s.universityId === selectedUniversity || s.universityName === targetUniversities[0]?.name
    )
  }, [statements, selectedUniversity, targetUniversities])

  const totalCredits = useMemo(() => {
    return targetStatements.reduce((sum, s) => sum + (Number(s.totalCredits) || 0), 0)
  }, [targetStatements])

  const totalDebits = useMemo(() => {
    return targetStatements.reduce((sum, s) => sum + (Number(s.totalDebits) || 0), 0)
  }, [targetStatements])

  // Generate Report Handler
  const handleGenerateReport = (e) => {
    e.preventDefault()

    if (selectedUniversity !== 'ALL' && targetStatements.length === 0) {
      if (onTriggerToast) {
        onTriggerToast(
          'No Data Available',
          'No financial statement uploaded for this university. Cannot generate report.',
          'warning'
        )
      }
      return
    }

    const univName = selectedUniversity === 'ALL'
      ? 'All Universities'
      : (targetUniversities[0]?.name || 'Selected University')

    const newReport = {
      id: `rep-${Date.now()}`,
      title: `${reportType} — ${univName}`,
      type: reportType,
      university: univName,
      period: `${period} (${financialYear})`,
      generatedOn: new Date().toISOString().split('T')[0],
      status: 'Ready',
      format: 'PDF',
      data: {
        totalCredits,
        totalDebits,
        universityCount: targetUniversities.length,
        statementsCount: targetStatements.length,
      },
    }

    setReportHistory([newReport, ...reportHistory])
    setPreviewReport(newReport)

    if (onTriggerToast) {
      onTriggerToast('Report Generated', `${reportType} generated successfully.`, 'success')
    }
  }

  // Download Handler (PDF / CSV)
  const handleDownload = (rep) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Report Title', rep.title],
        ['Report Type', rep.type],
        ['University Scope', rep.university],
        ['Reporting Period', rep.period],
        ['Generation Date', rep.generatedOn],
        ['Status', rep.status],
        ['Total Credits (INR)', totalCredits],
        ['Total Expenditure (INR)', totalDebits],
      ]
        .map((e) => e.join(','))
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${rep.title.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (onTriggerToast) {
      onTriggerToast('Downloaded', `Downloaded ${rep.title}.`, 'success')
    }
  }

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Bar (Matching Panel 6 Mockup) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1f2328]">
            Reports
          </h1>
          <p className="text-xs text-[#57606a] mt-0.5">
            Generate, view and download financial reports
          </p>
        </div>
      </div>

      {/* 2. Sub-Tabs Bar: Generate Report | Report History */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#d0d7de] shadow-xs">
        <button
          onClick={() => setActiveSubTab('generate')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'generate'
              ? 'bg-[#0969da] text-white shadow-2xs'
              : 'text-[#57606a] hover:text-[#1f2328]'
          }`}
        >
          Generate Report
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-[#0969da] text-white shadow-2xs'
              : 'text-[#57606a] hover:text-[#1f2328]'
          }`}
        >
          Report History ({reportHistory.length})
        </button>
      </div>

      {/* 3. Sub-Tab 1: Generate Report 2-Column Layout (Matching Panel 6 Exactly) */}
      {activeSubTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Generate Report Form Card */}
          <div className="lg:col-span-5 rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328]">
                Generate New Report
              </h2>
              <p className="text-xs text-[#57606a] mt-0.5">
                Configure report parameters using verified database filings
              </p>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-3.5 text-xs">
              {/* Field 1: Report Type */}
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                >
                  <option value="University Financial Summary">University Financial Summary</option>
                  <option value="Consolidated Government Financial Summary">Consolidated Government Financial Summary</option>
                  <option value="University-wise Expenditure">University-wise Expenditure</option>
                  <option value="Category-wise Expenditure">Category-wise Expenditure</option>
                  <option value="Compliance Report">Compliance Report</option>
                  <option value="AI Financial Analysis Report">AI Financial Analysis Report</option>
                  <option value="Transaction Details Report">Transaction Details Report</option>
                </select>
              </div>

              {/* Field 2: University */}
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  University
                </label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                >
                  <option value="ALL">All Universities</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: Financial Year */}
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Financial Year
                </label>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                >
                  <option value="FY 2025 - 2026">FY 2025 - 2026</option>
                  <option value="FY 2024 - 2025">FY 2024 - 2025</option>
                  <option value="FY 2023 - 2024">FY 2023 - 2024</option>
                </select>
              </div>

              {/* Field 4: Period */}
              <div>
                <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                  Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] px-3 text-xs text-[#1f2328] focus:bg-white focus:border-[#0969da] focus:outline-none"
                >
                  <option value="Apr 2025 - Sep 2025">Apr 2025 - Sep 2025</option>
                  <option value="Apr 2025 - Jun 2025 (Q1)">Apr 2025 - Jun 2025 (Q1)</option>
                  <option value="Jul 2025 - Sep 2025 (Q2)">Jul 2025 - Sep 2025 (Q2)</option>
                  <option value="Oct 2025 - Dec 2025 (Q3)">Oct 2025 - Dec 2025 (Q3)</option>
                  <option value="Jan 2026 - Mar 2026 (Q4)">Jan 2026 - Mar 2026 (Q4)</option>
                  <option value="Full Financial Year">Full Financial Year</option>
                </select>
              </div>

              {/* Generate Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-9 text-xs flex items-center justify-center gap-2 bg-[#0969da] text-white hover:bg-[#085ec4] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Generate Report
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Available Reports Card (Matching Panel 6 Exactly) */}
          <div className="lg:col-span-7 rounded-xl border border-[#d0d7de] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1f2328]">
                  Available Reports
                </h2>
                <p className="text-xs text-[#57606a] mt-0.5">
                  Pre-compiled statutory reports and analysis summaries
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('history')}
                className="text-xs text-[#0969da] hover:underline font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {reportHistory.slice(0, 4).map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 rounded-xl border border-[#d0d7de] bg-[#f6f8fa]/60 hover:bg-[#f6f8fa] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-xs font-mono shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1f2328] truncate">
                        {rep.title}
                      </div>
                      <div className="text-[10px] text-[#57606a] mt-0.5">
                        {rep.period} • Generated {rep.generatedOn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPreviewReport(rep)}
                      className="p-1.5 text-[#57606a] hover:text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                      title="Preview Report"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(rep)}
                      className="p-1.5 text-[#57606a] hover:text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab 2: Report History Table */}
      {activeSubTab === 'history' && (
        <div className="overflow-x-auto rounded-xl border border-[#d0d7de] bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] font-semibold">
              <tr>
                <th className="py-3 px-3.5">Report Title</th>
                <th className="py-3 px-3.5">University</th>
                <th className="py-3 px-3.5">Period</th>
                <th className="py-3 px-3.5">Generated On</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {reportHistory.map((rep) => (
                <tr key={rep.id} className="hover:bg-[#f6f8fa]/80 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-[#1f2328]">{rep.title}</div>
                    <div className="text-[10px] text-[#57606a]">{rep.type}</div>
                  </td>
                  <td className="py-3 px-3.5 text-[#1f2328] font-medium">{rep.university}</td>
                  <td className="py-3 px-3.5 text-[#57606a]">{rep.period}</td>
                  <td className="py-3 px-3.5 font-mono text-[#57606a]">{rep.generatedOn}</td>
                  <td className="py-3 px-3.5 text-center">
                    <Badge variant="success" className="text-[10px]">
                      {rep.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewReport(rep)}
                        className="p-1.5 text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(rep)}
                        className="p-1.5 text-[#57606a] hover:text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors cursor-pointer"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <Modal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={previewReport.title}
          className="max-w-2xl"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 bg-[#f6f8fa] rounded-xl border border-[#d0d7de] space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-[#57606a]">Scope:</span>
                <span className="font-bold text-[#1f2328]">{previewReport.university}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#57606a]">Period:</span>
                <span className="font-bold text-[#1f2328]">{previewReport.period}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#57606a]">Generation Date:</span>
                <span className="font-bold text-[#1f2328]">{previewReport.generatedOn}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#57606a]">Total Verified Credits:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(totalCredits)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[#57606a]">Total Verified Expenditure:</span>
                <span className="font-bold text-rose-700">{formatCurrency(totalDebits)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#d0d7de]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewReport(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownload(previewReport)}
                className="text-xs bg-[#0969da] text-white hover:bg-[#085ec4]"
              >
                Download CSV
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
