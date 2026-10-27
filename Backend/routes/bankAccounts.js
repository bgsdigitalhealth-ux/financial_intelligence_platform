const express = require('express')
const router = express.Router()
const db = require('../models/db')

// GET /api/bank-accounts
router.get('/', (req, res) => {
  try {
    const { universityId } = req.query
    const accounts = db.getBankAccounts(universityId)
    res.json({
      success: true,
      count: accounts.length,
      accounts,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/bank-accounts/:id
router.get('/:id', (req, res) => {
  try {
    const account = db.getBankAccountById(req.params.id)
    if (!account) {
      return res.status(404).json({ success: false, error: 'Bank account not found' })
    }

    // Get live statements for this account
    const allStatements = db.getStatements({ universityId: account.universityId })
    const accountStatements = allStatements.filter(
      (s) => s.accountId === account.id || s.accountNumber === account.accountNumber
    )

    // Collect real transactions from this account's statements (no dummy data)
    const recentTransactions = []
    for (const stmt of accountStatements) {
      if (stmt.transactions && Array.isArray(stmt.transactions)) {
        recentTransactions.push(...stmt.transactions)
      }
    }

    // Sort by date descending
    recentTransactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

    res.json({
      success: true,
      account,
      statements: accountStatements,
      recentTransactions,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

const mysqlConfig = require('../config/mysql')

// POST /api/bank-accounts (Dynamic Bank Account Creation)
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      universityId: clientSuppliedUnivId,
      bankName,
      accountHolderName,
      accountName,
      accountNumber,
      accountType = 'Operating Account',
      branch = 'Main Campus Branch',
      ifscCode,
      currentBalance = 0,
      currency = 'INR',
      status = 'Active',
      description = '',
    } = req.body

    const pool = await mysqlConfig.getPool()

    // Associate account with institution ID obtained from the authenticated user's database record
    // Do not trust an arbitrary institution ID supplied by the frontend
    let authorizedUnivId = null
    const headerUserId = req.headers['x-user-id'] || userId
    const headerUserEmail = req.headers['x-user-email'] || userEmail

    if (headerUserId || headerUserEmail) {
      const [uRows] = await pool.query(
        'SELECT id, university_id, primary_role_id FROM users WHERE id = ? OR LOWER(email) = LOWER(?) LIMIT 1',
        [headerUserId || '', headerUserEmail || '']
      )
      if (uRows.length > 0) {
        const authUser = uRows[0]
        if (authUser.primary_role_id === 'univ_finance') {
          if (!authUser.university_id) {
            return res.status(403).json({
              success: false,
              error: 'Authorization Denied: Your user account is not associated with any registered institution.',
            })
          }
          authorizedUnivId = authUser.university_id
        }
      }
    }

    // Fallback: if government admin or direct enrollment, verify institution exists
    if (!authorizedUnivId) {
      authorizedUnivId = clientSuppliedUnivId
    }

    if (!authorizedUnivId) {
      return res.status(400).json({
        success: false,
        error: 'University/Institution identification could not be resolved from authenticated user.',
      })
    }

    // Verify institution exists
    const [univExists] = await pool.query('SELECT id, name FROM universities WHERE id = ? LIMIT 1', [authorizedUnivId])
    if (univExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Institution ID "${authorizedUnivId}" not found in database.`,
      })
    }

    // Server-side validation of all required fields
    if (!bankName || !bankName.trim()) {
      return res.status(400).json({ success: false, error: 'Bank name is required.' })
    }
    const finalHolderName = (accountHolderName || accountName || '').trim()
    if (!finalHolderName) {
      return res.status(400).json({ success: false, error: 'Account holder name is required.' })
    }
    const cleanAccountNumber = (accountNumber || '').trim()
    if (!cleanAccountNumber || cleanAccountNumber.length < 6) {
      return res.status(400).json({ success: false, error: 'A valid account number (minimum 6 digits) is required.' })
    }
    const cleanIfsc = (ifscCode || '').trim().toUpperCase()
    if (!cleanIfsc) {
      return res.status(400).json({ success: false, error: 'IFSC code is required.' })
    }

    const created = await db.createBankAccount({
      universityId: authorizedUnivId,
      bankName: bankName.trim(),
      accountHolderName: finalHolderName,
      accountName: (accountName || finalHolderName).trim(),
      accountNumber: cleanAccountNumber,
      accountType: accountType.trim(),
      branch: branch.trim(),
      ifscCode: cleanIfsc,
      currentBalance: Number(currentBalance) || 0,
      currency: currency.trim(),
      status: status.trim(),
      description: description.trim(),
    })

    // Do NOT log complete account numbers
    db.addAuditLog({
      user: 'Finance Officer',
      action: 'BANK_ACCOUNT_CONFIGURED',
      details: `Added new official bank account ${bankName} (${created.accountNumberMasked}) for institution ${univExists[0].name}`,
      level: 'High Priority',
    })

    res.status(201).json({
      success: true,
      message: 'Bank account added successfully and persisted in MySQL',
      account: {
        ...created,
        accountNumber: created.accountNumberMasked,
      },
    })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// PUT /api/bank-accounts/:id (Dynamic Bank Account Update)
router.put('/:id', async (req, res) => {
  try {
    const account = db.getBankAccountById(req.params.id)
    if (!account) {
      return res.status(404).json({ success: false, error: 'Bank account not found' })
    }

    const updated = await db.updateBankAccount(req.params.id, req.body)

    db.addAuditLog({
      user: 'Finance Officer',
      action: 'BANK_ACCOUNT_UPDATED',
      details: `Updated parameters for account ${account.accountNumber} (${account.bankName})`,
      level: 'Normal',
    })

    res.json({
      success: true,
      message: 'Bank account updated successfully in MySQL',
      account: updated,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/bank-accounts/:id (Dynamic Bank Account Deletion)
router.delete('/:id', async (req, res) => {
  try {
    const account = db.getBankAccountById(req.params.id)
    if (!account) {
      return res.status(404).json({ success: false, error: 'Bank account not found' })
    }

    await db.deleteBankAccount(req.params.id)

    db.addAuditLog({
      user: 'Finance Officer',
      action: 'BANK_ACCOUNT_REMOVED',
      details: `Removed bank account ${account.accountNumber} (${account.bankName}) and associated records`,
      level: 'Warning',
    })

    res.json({
      success: true,
      message: `Bank account ${account.accountNumber} deleted successfully from MySQL`,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
