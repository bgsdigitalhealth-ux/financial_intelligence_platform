/**
 * Deterministic Financial Transaction Dataset Generator
 * Generates exactly 1,248 realistic university general ledger transactions
 * reconciling mathematically:
 *   Opening Balance (₹ 2,50,00,000)
 *   + Total Credits  (₹ 5,00,00,000) [148 credits]
 *   - Total Debits   (₹ 4,50,00,000) [1100 debits]
 *   = Closing Balance(₹ 3,00,00,000)
 */

export function build1248Transactions(
  openingBal = 25000000,
  targetCredits = 50000000,
  targetDebits = 45000000,
  startDate = '2026-10-01'
) {
  const numCredits = 148
  const numDebits = 1100
  const totalCount = 1248

  const creditTemplates = [
    { desc: 'State Government Higher Education Grant Tranche', cat: 'Government Grant Tranche', refPrefix: 'TR-GOV', weight: 15 },
    { desc: 'DST Research Scheme Project Grant Tranche', cat: 'Research Grant Inflow', refPrefix: 'DST-RES', weight: 8 },
    { desc: 'UGC Institutional Development Capital Grant', cat: 'UGC Grant', refPrefix: 'UGC-DEV', weight: 6 },
    { desc: 'Postgraduate & Doctoral Semester Fee Remittance', cat: 'Student Academic Fees', refPrefix: 'FEE-PG', weight: 3 },
    { desc: 'Undergraduate Engineering Semester Fee Batch Receipt', cat: 'Student Academic Fees', refPrefix: 'FEE-UG', weight: 2.5 },
    { desc: 'University Examination & Degree Convocation Fees', cat: 'Examination Receipts', refPrefix: 'EXAM-FEE', weight: 1.8 },
    { desc: 'Hostel Accommodation & Student Mess Inflow', cat: 'Student Services', refPrefix: 'HST-REC', weight: 1.2 },
    { desc: 'Corporate CSR Research Endowment — Bio-Sciences', cat: 'Endowment Fund', refPrefix: 'CSR-RES', weight: 4 },
    { desc: 'Scheduled Bank Quarterly Treasury Savings Interest', cat: 'Treasury Interest', refPrefix: 'INT-CR', weight: 0.8 },
    { desc: 'Campus Sports & Cultural Registration Receipts', cat: 'Student Services', refPrefix: 'SPT-REC', weight: 0.5 },
  ]

  const debitTemplates = [
    { desc: 'Faculty, Academic Staff & Non-Teaching Monthly Payroll', cat: 'Salaries & Wages', refPrefix: 'SAL-PFMS', weight: 12 },
    { desc: 'Ad-hoc Guest Faculty Monthly Honorarium & Allowances', cat: 'Salaries & Wages', refPrefix: 'HON-FAC', weight: 1.5 },
    { desc: 'Campus STEM Laboratory High-Precision Equipment', cat: 'Infrastructure', refPrefix: 'INF-KGFR', weight: 4.5 },
    { desc: 'Central Computing Server Maintenance & Campus Network', cat: 'Infrastructure', refPrefix: 'INF-IT', weight: 2.2 },
    { desc: 'Civil Maintenance, Classroom Renovation & PWD Works', cat: 'Infrastructure', refPrefix: 'INF-CIV', weight: 3.8 },
    { desc: 'BESCOM High-Tension Monthly Campus Electricity Tariff', cat: 'Utilities', refPrefix: 'UTL-ELE', weight: 1.8 },
    { desc: 'BWSSB Municipal Water Supply & Campus Sewage Utilities', cat: 'Utilities', refPrefix: 'UTL-WTR', weight: 0.9 },
    { desc: 'High-Speed NKN Optical Fiber Internet Bandwidth', cat: 'Utilities', refPrefix: 'UTL-NET', weight: 0.7 },
    { desc: 'International Digital Library & IEEE Journal Subscriptions', cat: 'Academic Resources', refPrefix: 'ACD-LIB', weight: 1.6 },
    { desc: 'Chemical Reagents, Glassware & Biological Consumables', cat: 'Academic Resources', refPrefix: 'ACD-LAB', weight: 1.1 },
    { desc: 'Printing, University Answer Booklets & Examination Stationery', cat: 'Administrative', refPrefix: 'ADM-PRT', weight: 0.8 },
    { desc: 'Statutory External Audit & CAG Compliance Verification Fees', cat: 'Administrative', refPrefix: 'ADM-AUD', weight: 1.4 },
    { desc: 'Campus 24x7 Security Watch & Ward Contractual Services', cat: 'Administrative', refPrefix: 'ADM-SEC', weight: 1.5 },
    { desc: 'Student Innovation Incubation & Patent Filing Assistance', cat: 'R&D & Others', refPrefix: 'RND-PAT', weight: 1.2 },
    { desc: 'Inter-Collegiate Sports Tournament & Student Travel Bursary', cat: 'R&D & Others', refPrefix: 'RND-TRA', weight: 0.6 },
  ]

  // Exceptions list (reviewed in AI Validation)
  const exceptions = [
    {
      desc: 'Executive Luxury Travel & Private Vehicle Hire (Unbudgeted)',
      cat: 'Policy Review Exception',
      refPrefix: 'EXP-UNB',
      flag: 'Flagged under Higher Ed Financial Regulations §14: Prior cabinet approval required for non-budgeted luxury transport.',
      amount: 580000,
      idx: 84,
    },
    {
      desc: 'High-End Computational Workstations Procured without GeM Tender',
      cat: 'Policy Review Exception',
      refPrefix: 'EXP-GEM',
      flag: 'KGFR Rule 149 Exception: Procurement > ₹5,00,000 without mandatory GeM portal tender bidding.',
      amount: 720000,
      idx: 215,
    },
    {
      desc: 'Candidate Duplicate Payment Voucher for Chemical Supplies',
      cat: 'Duplicate Candidate',
      refPrefix: 'EXP-DUP',
      flag: 'Duplicate candidate detected: Identical amount and vendor reference matching voucher TX-312.',
      amount: 245000,
      idx: 430,
    },
    {
      desc: 'International Conference Travel Sponsorship Exceeding Allowance Limit',
      cat: 'Policy Review Exception',
      refPrefix: 'EXP-TRV',
      flag: 'Exceeds UGC international travel allowance maximum threshold per faculty applicant.',
      amount: 310000,
      idx: 760,
    },
  ]

  // 1. Distribute credits with proportional scaling
  const totalCredWeight = creditTemplates.reduce((s, t) => s + t.weight, 0)
  const avgCredWeight = totalCredWeight / creditTemplates.length
  let credAllocated = 0
  const rawCredits = []

  for (let i = 0; i < numCredits; i++) {
    const tmpl = creditTemplates[i % creditTemplates.length]
    const weightFactor = tmpl.weight / avgCredWeight
    const variance = 0.85 + ((i * 17) % 31) / 100
    const amt = Math.max(5000, Math.round((targetCredits / numCredits) * weightFactor * variance))
    rawCredits.push({ tmpl, amt })
    credAllocated += amt
  }

  const credRatio = targetCredits / credAllocated
  let reAllocCred = 0
  for (let i = 0; i < numCredits; i++) {
    rawCredits[i].amt = Math.max(1000, Math.round(rawCredits[i].amt * credRatio))
    reAllocCred += rawCredits[i].amt
  }
  rawCredits[numCredits - 1].amt += targetCredits - reAllocCred

  // 2. Distribute debits with proportional scaling
  const exceptionSum = exceptions.reduce((s, e) => s + e.amount, 0)
  const remainingDebitTarget = targetDebits - exceptionSum
  const normalDebitCount = numDebits - exceptions.length
  const totalDebWeight = debitTemplates.reduce((s, t) => s + t.weight, 0)
  const avgDebWeight = totalDebWeight / debitTemplates.length
  let debAllocated = 0
  const rawDebits = []

  for (let i = 0; i < normalDebitCount; i++) {
    const tmpl = debitTemplates[i % debitTemplates.length]
    const weightFactor = tmpl.weight / avgDebWeight
    const variance = 0.80 + ((i * 23) % 41) / 100
    const amt = Math.max(1000, Math.round((remainingDebitTarget / normalDebitCount) * weightFactor * variance))
    rawDebits.push({ tmpl, amt })
    debAllocated += amt
  }

  const debRatio = remainingDebitTarget / debAllocated
  let reAllocDeb = 0
  for (let i = 0; i < normalDebitCount; i++) {
    rawDebits[i].amt = Math.max(500, Math.round(rawDebits[i].amt * debRatio))
    reAllocDeb += rawDebits[i].amt
  }
  rawDebits[normalDebitCount - 1].amt += remainingDebitTarget - reAllocDeb

  // 3. Assemble interleaved 1,248 transactions with accurate running balance
  const transactions = []
  let runningBal = openingBal
  let cPtr = 0
  let dPtr = 0
  const baseEpoch = new Date(startDate).getTime()

  for (let i = 0; i < totalCount; i++) {
    const isException = exceptions.find((e) => e.idx === i)
    const dayOffset = Math.floor((i / totalCount) * 85)
    const txDate = new Date(baseEpoch + dayOffset * 86400000).toISOString().slice(0, 10)

    if (isException) {
      runningBal -= isException.amount
      transactions.push({
        id: `tx-${i + 1}`,
        date: txDate,
        referenceNo: `${isException.refPrefix}-${100000 + i}`,
        description: isException.desc,
        category: isException.cat,
        type: 'DEBIT',
        amount: isException.amount,
        balance: runningBal,
        aiConfidence: 78.4,
        status: 'Exception',
        flag: isException.flag,
        allowable: false,
        resolved: false,
      })
      continue
    }

    const shouldCredit = (i % 8 === 0 && cPtr < numCredits) || dPtr >= rawDebits.length

    if (shouldCredit && cPtr < numCredits) {
      const item = rawCredits[cPtr++]
      runningBal += item.amt
      transactions.push({
        id: `tx-${i + 1}`,
        date: txDate,
        referenceNo: `${item.tmpl.refPrefix}-${200000 + i}`,
        description: `${item.tmpl.desc} — Batch #${cPtr}`,
        category: item.tmpl.cat,
        type: 'CREDIT',
        amount: item.amt,
        balance: runningBal,
        aiConfidence: Number((98.4 + (i % 10) / 10).toFixed(1)),
        status: 'Validated',
        flag: null,
        allowable: true,
        resolved: false,
      })
    } else if (dPtr < rawDebits.length) {
      const item = rawDebits[dPtr++]
      runningBal -= item.amt
      transactions.push({
        id: `tx-${i + 1}`,
        date: txDate,
        referenceNo: `${item.tmpl.refPrefix}-${300000 + i}`,
        description: `${item.tmpl.desc} — Line #${dPtr}`,
        category: item.tmpl.cat,
        type: 'DEBIT',
        amount: item.amt,
        balance: runningBal,
        aiConfidence: Number((97.2 + (i % 15) / 10).toFixed(1)),
        status: 'Validated',
        flag: null,
        allowable: true,
        resolved: false,
      })
    }
  }

  return transactions
}
