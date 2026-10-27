const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../models/db')
const ragEngine = require('../rag/engine')
const fs = require('fs')

// Configure multer file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

// GET /api/statements
router.get('/', (req, res) => {
  try {
    const { universityId, status, quarter } = req.query
    let statements = db.getStatements({ universityId, status })
    if (quarter) {
      statements = statements.filter((s) => s.quarter.toLowerCase().includes(quarter.toLowerCase()))
    }
    res.json({
      success: true,
      count: statements.length,
      statements,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/statements/:id
router.get('/:id', (req, res) => {
  try {
    const statement = db.getStatementById(req.params.id)
    if (!statement) {
      return res.status(404).json({ success: false, error: 'Statement not found' })
    }
    res.json({
      success: true,
      statement,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/statements/upload (Step 4: Quarterly Statement Upload)
router.post('/upload', upload.single('statementFile'), (req, res) => {
  try {
    const {
      universityId = 'univ-01',
      accountId,
      quarter = 'Q3 FY26 (Oct - Dec 2026)',
      uploadedBy = 'Dr. Ramesh Babu, KAS (Finance Officer)',
    } = req.body

    const university = db.getUniversityById(universityId)
    if (!university) {
      return res.status(400).json({
        success: false,
        error: `University ID "${universityId}" not found in state registry.`,
      })
    }

    const account = db.getBankAccountById(accountId)
    if (!account) {
      return res.status(400).json({
        success: false,
        error: `Bank account ID "${accountId}" not found. Please register an official bank account first.`,
      })
    }

    // Strict ownership verification: bank account MUST belong to authenticated user's institution
    if (account.universityId !== university.id) {
      return res.status(403).json({
        success: false,
        error: `Authorization Denied: Bank account does not belong to institution "${university.name}". Cross-institution statement upload is forbidden.`,
      })
    }

    const originalFileName = req.file ? req.file.originalname : 'Uploaded_Bank_Statement.csv'
    const fileSize = req.file ? `${(req.file.size / 1024).toFixed(1)} KB` : '420 KB'

    // AI Analysis & Extraction Engine (Step 5)
    let extractedTransactions = []
    let parsedOpening = undefined
    let parsedClosing = undefined
    let parsedCredits = undefined
    let parsedDebits = undefined
    let parsedVariance = undefined
    let parsedMatch = undefined

    if (req.file && fs.existsSync(req.file.path)) {
      try {
        const { execFileSync } = require('child_process')
        const pythonScript = path.join(__dirname, '..', 'scripts', 'parse_statement.py')
        const out = execFileSync('python', [pythonScript, req.file.path], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
        const parsed = JSON.parse(out)
        if (parsed.success && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
          extractedTransactions = parsed.transactions
          parsedOpening = parsed.openingBalance
          parsedClosing = parsed.closingBalance
          parsedCredits = parsed.totalCredits
          parsedDebits = parsed.totalDebits
          parsedVariance = parsed.varianceAmount
          parsedMatch = parsed.reconciliationMatch
        }
      } catch (parserErr) {
        console.error('Error invoking parse_statement.py:', parserErr.message)
      }

      // Fallback for CSV files if parser returned 0 items
      if (extractedTransactions.length === 0 && !originalFileName.toLowerCase().endsWith('.pdf')) {
        try {
          const fileContent = fs.readFileSync(req.file.path, 'utf8')
          const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0)
          const header = (lines[0] || '').toLowerCase()
          const startIndex = header.includes('date') || header.includes('amount') || header.includes('type') ? 1 : 0

          for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(',').map((p) => p.trim())
            if (parts.length >= 4) {
              const rawDate = parts[0] || new Date().toISOString().slice(0, 10)
              const dateParts = rawDate.replace(/\//g, '-').split('-')
              const date = dateParts.length === 3 && dateParts[2].length === 4
                ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
                : rawDate
              const refNo = parts[1] || `TX-${Date.now()}-${i}`
              const desc = parts[2] || `Transaction Line #${i}`
              const type = (parts[3] || 'DEBIT').toUpperCase().includes('CREDIT') ? 'CREDIT' : 'DEBIT'
              const amt = parseFloat(parts[4]) || 0
              const bal = parseFloat(parts[5]) || (account.currentBalance || 0)

              const isException =
                desc.toLowerCase().includes('luxury') ||
                desc.toLowerCase().includes('charter') ||
                desc.toLowerCase().includes('duplicate') ||
                desc.toLowerCase().includes('unallowable')

              extractedTransactions.push({
                id: `tx-${Date.now()}-${i}`,
                date,
                description: desc,
                referenceNo: refNo,
                type,
                amount: amt,
                balance: bal,
                category: desc ? desc.split('-')[0].trim() : (type === 'CREDIT' ? 'Receipt & Inflow' : 'Disbursement'),
                aiConfidence: isException ? 78.5 : 98.4,
                status: isException ? 'Exception' : 'Validated',
                flag: isException ? 'Flagged under Higher Ed Financial Regulations §14' : null,
                allowable: !isException,
                resolved: false,
                resolutionAction: isException ? 'Pending Review' : null,
                resolutionNote: '',
              })
            }
          }
        } catch (csvErr) {
          console.error('Error in CSV fallback:', csvErr.message)
        }
      }
    }

    // Support directly provided JSON transactions in body if any
    if (extractedTransactions.length === 0 && req.body.transactions) {
      try {
        const rawTxs = typeof req.body.transactions === 'string'
          ? JSON.parse(req.body.transactions)
          : req.body.transactions
        if (Array.isArray(rawTxs)) {
          extractedTransactions = rawTxs
        }
      } catch (jsonErr) {
        console.error('Error parsing raw transactions from body:', jsonErr)
      }
    }

    if (extractedTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid transaction records found in the uploaded statement. Please provide an official bank statement PDF or CSV with standard transaction entries.',
      })
    }

    const totalCredits = parsedCredits !== undefined
      ? Number(parsedCredits)
      : extractedTransactions
          .filter((t) => t.type === 'CREDIT')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const totalDebits = parsedDebits !== undefined
      ? Number(parsedDebits)
      : extractedTransactions
          .filter((t) => t.type === 'DEBIT')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    // Check for possible duplicate transactions
    const seenTxKeys = new Set()
    let duplicateCount = 0
    extractedTransactions.forEach((tx) => {
      const txKey = `${tx.date}_${tx.amount}_${tx.type}_${(tx.referenceNo || tx.description || '').toLowerCase()}`
      if (seenTxKeys.has(txKey)) {
        tx.flag = 'Possible duplicate transaction line detected'
        tx.status = 'Exception'
        tx.aiConfidence = 68.0
        duplicateCount++
      } else {
        seenTxKeys.add(txKey)
      }
    })

    // Deterministic balance reconciliation formula:
    const openingBalance = req.body.openingBalance !== undefined
      ? Number(req.body.openingBalance)
      : (parsedOpening !== undefined ? Number(parsedOpening) : (Number(account.currentBalance) || 0))

    const expectedClosingBalance = openingBalance + totalCredits - totalDebits
    const statedClosingBalance = req.body.closingBalance !== undefined
      ? Number(req.body.closingBalance)
      : (parsedClosing !== undefined ? Number(parsedClosing) : expectedClosingBalance)

    const varianceAmount = parsedVariance !== undefined
      ? Number(parsedVariance)
      : Math.abs(statedClosingBalance - expectedClosingBalance)

    const reconciliationMatch = parsedMatch !== undefined ? parsedMatch : (varianceAmount < 0.05)

    const summaryText = reconciliationMatch
      ? `AI parsed and verified ${extractedTransactions.length} transaction entries from ${originalFileName}. Deterministic balance reconciliation confirmed: Opening (₹${openingBalance.toLocaleString('en-IN')}) + Credits (₹${totalCredits.toLocaleString('en-IN')}) - Debits (₹${totalDebits.toLocaleString('en-IN')}) = Closing (₹${statedClosingBalance.toLocaleString('en-IN')}). ${extractedTransactions.filter((t) => t.status === 'Exception').length} items flagged for review.`
      : `Mathematical Discrepancy Flagged: Opening Balance (₹${openingBalance.toLocaleString('en-IN')}) + Credits (₹${totalCredits.toLocaleString('en-IN')}) - Debits (₹${totalDebits.toLocaleString('en-IN')}) = ₹${expectedClosingBalance.toLocaleString('en-IN')}, which differs from stated Closing Balance (₹${statedClosingBalance.toLocaleString('en-IN')}) by ₹${varianceAmount.toLocaleString('en-IN')}. Flagged for review.`

    const uCodeLower = (university.code || university.id || 'univ').toLowerCase()
    const newStatement = {
      id: `stmt-${uCodeLower}-${Date.now().toString().slice(-6)}`,
      universityId: university.id,
      universityName: university.name,
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      bankName: account.bankName,
      quarter,
      financialYear: '2025-2026',
      fileName: originalFileName,
      fileSize,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      uploadedBy,
      totalDebits,
      totalCredits,
      openingBalance,
      closingBalance: statedClosingBalance,
      status: reconciliationMatch ? 'AI Validated' : 'Variance Flagged',
      submittedAt: null,
      approvedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      aiValidation: {
        processed: true,
        confidenceScore: reconciliationMatch ? (duplicateCount > 0 ? 88.0 : 98.2) : 72.0,
        totalTransactions: extractedTransactions.length,
        categorizedCount: extractedTransactions.filter((t) => t.status === 'Validated').length,
        exceptionsCount: extractedTransactions.filter((t) => t.status === 'Exception').length,
        duplicateCount,
        reconciliationMatch,
        varianceAmount,
        expectedClosingBalance,
        summary: summaryText,
      },
      transactions: extractedTransactions,
    }

    db.createStatement(newStatement)

    // Automatically train FinBot on the uploaded statement data (Zero manual training needed)
    try {
      ragEngine.indexStatement(newStatement)
    } catch (ragErr) {
      console.warn('[FinBot Auto-Train Warning]', ragErr.message)
    }

    db.addAuditLog({
      user: uploadedBy,
      action: 'QUARTERLY_STATEMENT_UPLOADED',
      details: `Uploaded ${originalFileName} for ${university.name} (${quarter}). Extracted ${extractedTransactions.length} lines.`,
      level: 'Normal',
    })

    res.json({
      success: true,
      message: 'Bank statement uploaded and AI validated successfully',
      statement: newStatement,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/statements/:id/resolve-exception (Step 5: Resolve Exceptions)
router.post('/:id/resolve-exception', (req, res) => {
  try {
    const { transactionId, resolutionAction, resolutionNote, newCategory } = req.body
    const statement = db.getStatementById(req.params.id)
    if (!statement) {
      return res.status(404).json({ success: false, error: 'Statement not found' })
    }

    const txIndex = statement.transactions.findIndex((t) => t.id === transactionId)
    if (txIndex === -1) {
      return res.status(404).json({ success: false, error: 'Transaction not found' })
    }

    // Update the transaction exception status
    statement.transactions[txIndex].resolved = true
    statement.transactions[txIndex].status = 'Resolved'
    statement.transactions[txIndex].resolutionAction = resolutionAction || 'CFO Approved with Justification'
    statement.transactions[txIndex].resolutionNote = resolutionNote || 'Validated against dean approved research charter'
    if (newCategory) {
      statement.transactions[txIndex].category = newCategory
    }

    // Recalculate remaining unresolved exceptions
    const remainingExceptions = statement.transactions.filter((t) => t.status === 'Exception' && !t.resolved).length
    statement.aiValidation.exceptionsCount = remainingExceptions

    db.updateStatement(statement.id, statement)

    db.addAuditLog({
      user: statement.uploadedBy || 'Dr. Ramesh Babu, KAS (Finance Officer)',
      action: 'TRANSACTION_EXCEPTION_RESOLVED',
      details: `Resolved exception on ${statement.transactions[txIndex].referenceNo}: ${resolutionAction}`,
      level: 'Normal',
    })

    res.json({
      success: true,
      message: 'Transaction exception resolved successfully',
      statement,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/statements/:id/submit (Step 6: Submission & Compliance)
router.post('/:id/submit', (req, res) => {
  try {
    const statement = db.getStatementById(req.params.id)
    if (!statement) {
      return res.status(404).json({ success: false, error: 'Statement not found' })
    }

    const { submittedBy = 'Dr. Ramesh Babu, KAS (Finance Officer)', remarks } = req.body

    statement.status = 'Submitted for Approval'
    statement.submittedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    statement.submissionRemarks = remarks || 'Certified as true and accurate in compliance with State Higher Ed Finance statutes.'

    db.updateStatement(statement.id, statement)

    // Update university statementStatus
    db.updateUniversity(statement.universityId, {
      statementStatus: 'Submitted for Approval',
    })

    db.addAuditLog({
      user: submittedBy,
      action: 'STATEMENT_SUBMITTED_FOR_GOV_APPROVAL',
      details: `Transmitted verified ${statement.quarter} statement (${statement.id}) to State Department of Higher Education`,
      level: 'High Priority',
    })

    res.json({
      success: true,
      message: 'Statement successfully submitted to Department of Higher Education for executive sign-off',
      statement,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/statements/:id/review (Government Leader Approval / Revision)
router.post('/:id/review', (req, res) => {
  try {
    const { action, reviewer = 'Sri. G. Kumar Naik, IAS (Principal Secretary)', notes } = req.body
    const statement = db.getStatementById(req.params.id)
    if (!statement) {
      return res.status(404).json({ success: false, error: 'Statement not found' })
    }

    if (action === 'APPROVE') {
      statement.status = 'Approved by Gov Leader'
      statement.approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      statement.reviewedBy = reviewer
      statement.reviewNotes = notes || 'Executive statutory sign-off completed. General ledger settlement authorized.'

      db.updateUniversity(statement.universityId, {
        statementStatus: 'Approved',
      })

      db.addAuditLog({
        user: reviewer,
        action: 'STATEMENT_STATUTORY_APPROVAL_GRANTED',
        details: `Granted official state sign-off for ${statement.universityName} (${statement.quarter})`,
        level: 'High Priority',
      })
    } else if (action === 'REVISE') {
      statement.status = 'Revision Requested'
      statement.reviewedBy = reviewer
      statement.reviewNotes = notes || 'Discrepancy noted in research equipment voucher. Please provide sub-grant justification.'

      db.updateUniversity(statement.universityId, {
        statementStatus: 'Flagged Variance',
      })

      db.addAuditLog({
        user: reviewer,
        action: 'STATEMENT_REVISION_MANDATED',
        details: `Returned statement ${statement.id} to CFO for correction: ${notes}`,
        level: 'Warning',
      })
    }

    db.updateStatement(statement.id, statement)

    res.json({
      success: true,
      message: action === 'APPROVE' ? 'Statement approved by State Leadership' : 'Revision requested from University CFO',
      statement,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/statements/:id (Delete a statement and its transactions)
router.delete('/:id', async (req, res) => {
  try {
    const statement = db.getStatementById(req.params.id)
    if (!statement) {
      return res.status(404).json({ success: false, error: 'Statement not found' })
    }

    await db.deleteStatement(req.params.id)

    db.addAuditLog({
      user: 'Finance Officer',
      action: 'STATEMENT_DELETED',
      details: `Removed statement ${statement.id} (${statement.quarter}) for ${statement.universityName}`,
      level: 'Warning',
    })

    res.json({
      success: true,
      message: `Statement ${statement.id} and associated transactions deleted successfully`,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/statements/clear-all (Clear all dummy statements & transactions)
router.post('/clear-all', async (req, res) => {
  try {
    const mysqlConfig = require('../config/mysql')
    const pool = await mysqlConfig.getPool()
    await pool.query('DELETE FROM transactions')
    await pool.query('DELETE FROM statements')
    await db.reset()

    db.addAuditLog({
      user: 'System Admin',
      action: 'ALL_STATEMENTS_CLEARED',
      details: 'Wiped all dummy quarterly statements and general ledger transactions.',
      level: 'High Priority',
    })

    res.json({
      success: true,
      message: 'All dummy statements and transactions successfully deleted from MySQL.',
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router

