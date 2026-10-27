// GovFinanceIntel Direct MySQL Database Layer
// All data is stored and persisted in MySQL database: gov_finance_intel
// No static or hardcoded seed data in this file.

const mysqlConfig = require('../config/mysql')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

function maskAccountNumber(acc) {
  if (!acc) return ''
  const str = String(acc).trim()
  if (str.length <= 4) return str
  return '••••••••' + str.slice(-4)
}

class MySQLDatabase {
  constructor() {
    this.cache = {
      universities: [],
      bankAccounts: [],
      statements: [],
      policies: [],
      reports: null,
      auditLogs: [],
    }
    this.isReady = false
    this.initFromMySQL()
  }

  // Load all live records directly from MySQL tables
  async initFromMySQL() {
    try {
      const pool = await mysqlConfig.getPool()

      const [univRows] = await pool.query(`
        SELECT id, code, official_email AS officialEmail, finance_email AS financeEmail,
               name, institution_type AS institutionType, state, district, address,
               affiliated_university AS affiliatedUniversity,
               region, category,
               CAST(allocation AS SIGNED) AS allocation,
               CAST(spent AS SIGNED) AS spent,
               CAST(available_cash AS SIGNED) AS availableCash,
               CAST(utilization AS FLOAT) AS utilization,
               compliance_score AS complianceScore,
               compliance_grade AS complianceGrade,
               status, warning_reason AS warningReason,
               patents, student_enrollment AS studentEnrollment,
               bank_account_count AS bankAccountCount,
               statement_status AS statementStatus,
               last_audit AS lastAudit
        FROM universities
        ORDER BY created_at DESC
      `)
      this.cache.universities = univRows.filter(
        (u) =>
          u.id !== 'univ-bangalore' &&
          u.id !== 'univ-vtu' &&
          u.id !== 'univ-mysore' &&
          u.code !== 'BU-BLR' &&
          u.code !== 'VTU-BEL' &&
          u.code !== 'UOM-MYS'
      )

      const [acctRows] = await pool.query(`
        SELECT id, university_id AS universityId, account_number AS accountNumber,
               account_name AS accountName, account_holder_name AS accountHolderName,
               bank_name AS bankName, account_type AS accountType, branch, ifsc_code AS ifscCode,
               CAST(current_balance AS DOUBLE) AS currentBalance,
               currency, status, description
        FROM bank_accounts
        ORDER BY current_balance DESC
      `)
      this.cache.bankAccounts = acctRows.filter(
        (a) => a.id !== 'acc-bu-01' && a.id !== 'acc-vtu-01'
      )

      const [stmtRows] = await pool.query(`
        SELECT id, university_id AS universityId, university_name AS universityName,
               account_id AS accountId, account_number AS accountNumber,
               account_name AS accountName, bank_name AS bankName,
               quarter, financial_year AS financialYear, file_name AS fileName,
               file_size AS fileSize, uploaded_at AS uploadedAt, uploaded_by AS uploadedBy,
               CAST(total_debits AS DOUBLE) AS totalDebits,
               CAST(total_credits AS DOUBLE) AS totalCredits,
               CAST(opening_balance AS DOUBLE) AS openingBalance,
               CAST(closing_balance AS DOUBLE) AS closingBalance,
               status, CAST(ai_confidence AS FLOAT) AS aiConfidence,
               reconciliation_match AS reconciliationMatch,
               CAST(variance_amount AS DOUBLE) AS varianceAmount,
               ai_summary AS aiSummary, submitted_at AS submittedAt,
               submission_remarks AS submissionRemarks,
               approved_at AS approvedAt, reviewed_by AS reviewedBy,
               review_notes AS reviewNotes
        FROM statements
        ORDER BY created_at DESC
      `)

      const [txRows] = await pool.query(`
        SELECT id, statement_id AS statementId, account_id AS accountId,
               DATE_FORMAT(transaction_date, '%Y-%m-%d') AS date,
               reference_no AS referenceNo, description, type,
               CAST(amount AS DOUBLE) AS amount,
               CAST(balance AS DOUBLE) AS balance,
               category, CAST(ai_confidence AS FLOAT) AS aiConfidence,
               status, flag, allowable, resolved,
               resolution_action AS resolutionAction,
               resolution_note AS resolutionNote
        FROM transactions
      `)

      // Attach transactions to statements
      this.cache.statements = stmtRows.map((stmt) => {
        const txs = txRows.filter((t) => t.statementId === stmt.id)
        return {
          ...stmt,
          aiValidation: {
            confidenceScore: stmt.aiConfidence || 98.2,
            reconciliationMatch: Boolean(stmt.reconciliationMatch),
            varianceAmount: stmt.varianceAmount || 0,
            summary: stmt.aiSummary || '',
            totalTransactions: txs.length,
            exceptionsCount: txs.filter((t) => t.status === 'Exception' && !t.resolved).length,
          },
          transactions: txs,
        }
      })

      const [logRows] = await pool.query(`
        SELECT id, hash, timestamp_str AS timestamp, user_name AS user,
               action, details, ip_address AS ip, priority_level AS level
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 100
      `)
      this.cache.auditLogs = logRows

      // Fetch dynamic reports data from MySQL tables
      const [fundRows] = await pool.query(`
        SELECT domain_name AS domain,
               CAST(allocation AS SIGNED) AS allocation,
               CAST(disbursed AS SIGNED) AS disbursed,
               share_percent AS share,
               color_code AS color
        FROM fund_domains
        ORDER BY allocation DESC
      `)

      const [catRows] = await pool.query(`
        SELECT category_name AS category,
               CAST(amount AS SIGNED) AS amount,
               CAST(actual_percent AS FLOAT) AS percent,
               CAST(benchmark_percent AS FLOAT) AS benchmark,
               variance_status AS status
        FROM category_benchmarks
        ORDER BY amount DESC
      `)

      const [insightRows] = await pool.query(`
        SELECT id, title, severity, insight_type AS type, description, recommendation
        FROM ai_insights
        ORDER BY created_at ASC
      `)

      const [compRows] = await pool.query(`
        SELECT standard_name AS standard,
               status_badge AS status,
               compliant_institutions AS institutionsCompliant,
               auditor_notes AS note
        FROM compliance_standards
      `)

      this.cache.reports = {
        fundDistribution: fundRows,
        categoryAnalysis: catRows,
        aiInsights: insightRows,
        complianceMatrix: compRows,
      }

      try {
        const [policyRows] = await pool.query(`
          SELECT id, policy_code AS policyCode, title, category, scope, directive,
                 threshold_value AS thresholdValue, effective_date AS effectiveDate,
                 status, created_at AS createdAt
          FROM policies
          ORDER BY created_at DESC
        `)
        this.cache.policies = policyRows
      } catch (e) {
        this.cache.policies = []
      }

      this.isReady = true
      console.log(`[MySQL DB] Synced ${this.cache.universities.length} universities, ${this.cache.bankAccounts.length} accounts, ${this.cache.statements.length} statements, ${this.cache.policies.length} policies, and reports from MySQL.`)
    } catch (err) {
      console.warn('[MySQL DB] Warning reading from MySQL:', err.message)
    }
  }

  // --- Universities ---
  getUniversities() {
    return this.cache.universities
  }

  getUniversityById(id) {
    return this.cache.universities.find((u) => u.id === id)
  }

  async createUniversity(univ) {
    const id = univ.id || `univ-${Date.now().toString().slice(-4)}`
    const code = (univ.code || '').trim().toUpperCase()
    const name = (univ.name || '').trim()
    const officialEmail = (univ.officialEmail || univ.email || '').trim().toLowerCase()
    const financeEmail = (univ.financeEmail || univ.finance_email || '').trim().toLowerCase()
    const institutionType = (univ.institutionType || univ.institution_type || 'State Public University').trim()
    const state = (univ.state || 'Karnataka').trim()
    const district = (univ.district || '').trim()
    const address = (univ.address || '').trim()
    const affiliatedUniversity = (univ.affiliatedUniversity || univ.affiliated_university || '').trim()
    const region = univ.region || 'Bengaluru Central'
    const category = univ.category || 'State University'
    const allocation = Number(univ.allocation) || 0
    const spent = Number(univ.spent) || 0
    const availableCash = Math.max(0, allocation - spent)
    const utilization = allocation > 0 ? Number(((spent / allocation) * 100).toFixed(2)) : 0
    const complianceScore = Number(univ.complianceScore) || 90
    const complianceGrade = univ.complianceGrade || 'A'
    const status = univ.status || 'Optimal'
    const patents = Number(univ.patents) || 0
    const studentEnrollment = Number(univ.studentEnrollment) || 0
    const bankAccountCount = Number(univ.bankAccountCount) || 0
    const statementStatus = univ.statementStatus || 'Pending Upload'

    // Server-side validation
    if (!name || !code) {
      throw new Error('Official institution name and institution code are required.')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!officialEmail || !emailRegex.test(officialEmail)) {
      throw new Error('A valid official institutional email address is required.')
    }
    if (!financeEmail || !emailRegex.test(financeEmail)) {
      throw new Error('A valid authorized finance email address is required.')
    }

    const pool = await mysqlConfig.getPool()

    // Prevent duplicate codes and duplicate emails
    const [existingCode] = await pool.query('SELECT id, name FROM universities WHERE code = ? AND id != ? LIMIT 1', [code, id])
    if (existingCode.length > 0) {
      throw new Error(`Institution code "${code}" is already registered by "${existingCode[0].name}".`)
    }

    const [existingOfficial] = await pool.query('SELECT id, name FROM universities WHERE official_email = ? AND id != ? LIMIT 1', [officialEmail, id])
    if (existingOfficial.length > 0) {
      throw new Error(`Official email "${officialEmail}" is already registered for "${existingOfficial[0].name}".`)
    }

    const [existingFinance] = await pool.query('SELECT id, name FROM universities WHERE finance_email = ? AND id != ? LIMIT 1', [financeEmail, id])
    if (existingFinance.length > 0) {
      throw new Error(`Finance email "${financeEmail}" is already assigned to "${existingFinance[0].name}".`)
    }

    const [existingUser] = await pool.query('SELECT id, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [financeEmail])
    if (existingUser.length > 0 && !univ.allowExistingUser) {
      // Check if user already exists
      const [uRows] = await pool.query('SELECT id, university_id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [financeEmail])
      if (uRows.length > 0 && uRows[0].university_id && uRows[0].university_id !== id) {
        throw new Error(`The finance user email "${financeEmail}" is already linked to another institution account.`)
      }
    }

    const newUniv = {
      id,
      code,
      name,
      institutionType,
      officialEmail,
      financeEmail,
      state,
      district,
      address,
      affiliatedUniversity,
      region,
      category,
      allocation,
      spent,
      availableCash,
      utilization,
      complianceScore,
      complianceGrade,
      status,
      patents,
      studentEnrollment,
      bankAccountCount,
      statementStatus,
      lastAudit: null,
      warningReason: null,
    }

    try {
      await pool.query(
        `INSERT INTO universities 
         (id, code, official_email, finance_email, name, institution_type, state, district, address, affiliated_university,
          region, category, allocation, spent, utilization, 
          compliance_score, compliance_grade, status, patents, student_enrollment, bank_account_count, statement_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         name=VALUES(name), code=VALUES(code), official_email=VALUES(official_email), finance_email=VALUES(finance_email),
         institution_type=VALUES(institution_type), state=VALUES(state), district=VALUES(district),
         address=VALUES(address), affiliated_university=VALUES(affiliated_university),
         status=VALUES(status)`,
        [
          id, code, officialEmail, financeEmail, name, institutionType, state, district, address, affiliatedUniversity,
          region, category, allocation, spent, utilization,
          complianceScore, complianceGrade, status, patents, studentEnrollment, bankAccountCount, statementStatus
        ]
      )

      // Register the College Finance User (Role 2: univ_finance)
      // Login identity matches the registered financeEmail
      const userId = `usr-fin-${Date.now().toString().slice(-6)}`
      const rawPassword = (univ.password || univ.initialPassword || univ.tempPassword || 'password123').trim()
      let passwordHash = ''
      let userStatus = 'Active'
      let activationToken = null
      let activationExpires = null

      if (rawPassword) {
        passwordHash = await bcrypt.hash(rawPassword, 10)
        userStatus = 'Active'
      } else {
        // Secure activation token for admin-controlled activation
        activationToken = crypto.randomBytes(32).toString('hex')
        activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        passwordHash = ''
        userStatus = 'Pending'
      }

      const officerName = (univ.officerName || '').trim() || `${name} Finance Officer`
      const roleTitle = `Finance Officer & Comptroller, ${name}`
      const authorizedRoles = JSON.stringify(['univ_finance'])

      await pool.query(
        `INSERT INTO users (id, email, password_hash, name, primary_role_id, role_title, organization, university_id, designation, avatar_url, authorized_roles, status, activation_token, activation_token_expires_at)
         VALUES (?, ?, ?, ?, 'univ_finance', ?, ?, ?, 'Finance Officer & Comptroller', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           organization = VALUES(organization),
           university_id = VALUES(university_id),
           authorized_roles = VALUES(authorized_roles),
           password_hash = IF(VALUES(password_hash) != '', VALUES(password_hash), password_hash),
           activation_token = VALUES(activation_token),
           activation_token_expires_at = VALUES(activation_token_expires_at),
           status = VALUES(status),
           name = VALUES(name);`,
        [userId, financeEmail, passwordHash, officerName, roleTitle, name, id, authorizedRoles, userStatus, activationToken, activationExpires]
      )

      newUniv.activationToken = activationToken
      newUniv.userStatus = userStatus
    } catch (err) {
      console.error('[MySQL Error] createUniversity:', err.message)
      throw err
    }

    const existingIdx = this.cache.universities.findIndex((u) => u.id === id)
    if (existingIdx !== -1) {
      this.cache.universities[existingIdx] = newUniv
    } else {
      this.cache.universities.unshift(newUniv)
    }

    return newUniv
  }

  async deleteUniversity(id) {
    try {
      const cleanId = String(id || '').trim()
      const pool = await mysqlConfig.getPool()
      await pool.query('DELETE FROM transactions WHERE statement_id IN (SELECT id FROM statements WHERE university_id = ? OR university_id IN (SELECT id FROM universities WHERE code = ?))', [cleanId, cleanId])
      await pool.query('DELETE FROM statements WHERE university_id = ? OR university_id IN (SELECT id FROM universities WHERE code = ?)', [cleanId, cleanId])
      await pool.query('DELETE FROM bank_accounts WHERE university_id = ? OR university_id IN (SELECT id FROM universities WHERE code = ?)', [cleanId, cleanId])
      await pool.query('DELETE FROM users WHERE university_id = ? OR university_id IN (SELECT id FROM universities WHERE code = ?)', [cleanId, cleanId])
      await pool.query('DELETE FROM universities WHERE id = ? OR code = ?', [cleanId, cleanId])
      this.cache.universities = this.cache.universities.filter((u) => u.id !== cleanId && u.code !== cleanId)
      this.cache.bankAccounts = this.cache.bankAccounts.filter((a) => a.universityId !== cleanId)
      this.cache.statements = this.cache.statements.filter((s) => s.universityId !== cleanId)
      return true
    } catch (err) {
      console.error('[MySQL Error] deleteUniversity:', err.message)
      // Clean from cache regardless so in-memory state is accurate
      const cleanId = String(id || '').trim()
      this.cache.universities = this.cache.universities.filter((u) => u.id !== cleanId && u.code !== cleanId)
      this.cache.bankAccounts = this.cache.bankAccounts.filter((a) => a.universityId !== cleanId)
      this.cache.statements = this.cache.statements.filter((s) => s.universityId !== cleanId)
      return true
    }
  }

  async updateUniversity(id, updates) {
    const idx = this.cache.universities.findIndex((u) => u.id === id)
    if (idx !== -1) {
      const current = this.cache.universities[idx]
      const updated = { ...current, ...updates }
      this.cache.universities[idx] = updated

      try {
        const pool = await mysqlConfig.getPool()
        const fields = []
        const values = []

        if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name.trim()); }
        if (updates.code !== undefined) { fields.push('code = ?'); values.push(updates.code.trim().toUpperCase()); }
        if (updates.institutionType !== undefined) { fields.push('institution_type = ?'); values.push(updates.institutionType.trim()); }
        if (updates.officialEmail !== undefined) { fields.push('official_email = ?'); values.push(updates.officialEmail.trim().toLowerCase()); }
        if (updates.financeEmail !== undefined) { fields.push('finance_email = ?'); values.push(updates.financeEmail.trim().toLowerCase()); }
        if (updates.state !== undefined) { fields.push('state = ?'); values.push(updates.state.trim()); }
        if (updates.district !== undefined) { fields.push('district = ?'); values.push(updates.district.trim()); }
        if (updates.address !== undefined) { fields.push('address = ?'); values.push(updates.address.trim()); }
        if (updates.affiliatedUniversity !== undefined) { fields.push('affiliated_university = ?'); values.push(updates.affiliatedUniversity.trim()); }
        if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
        if (updates.statementStatus !== undefined) { fields.push('statement_status = ?'); values.push(updates.statementStatus); }
        if (updates.allocation !== undefined) { fields.push('allocation = ?'); values.push(Number(updates.allocation)); }
        if (updates.spent !== undefined) { fields.push('spent = ?'); values.push(Number(updates.spent)); }

        if (fields.length > 0) {
          values.push(id)
          await pool.query(`UPDATE universities SET ${fields.join(', ')} WHERE id = ?`, values)
        }

        // If financeEmail was updated, also update the linked user record
        if (updates.financeEmail) {
          await pool.query(
            `UPDATE users SET email = ? WHERE university_id = ? AND primary_role_id = 'univ_finance'`,
            [updates.financeEmail.trim().toLowerCase(), id]
          )
        }
      } catch (err) {
        console.error('[MySQL Error] updateUniversity:', err.message)
        throw err
      }

      return this.cache.universities[idx]
    }
    return null
  }

  // --- Bank Accounts ---
  getBankAccounts(universityId) {
    let list = this.cache.bankAccounts || []
    if (universityId) {
      list = list.filter((a) => a.universityId === universityId)
    }
    return list.map((a) => ({
      ...a,
      accountNumberMasked: maskAccountNumber(a.accountNumber),
    }))
  }

  getBankAccountById(id) {
    const acct = this.cache.bankAccounts.find((a) => a.id === id)
    if (!acct) return null
    return {
      ...acct,
      accountNumberMasked: maskAccountNumber(acct.accountNumber),
    }
  }

  async createBankAccount(account) {
    const id = account.id || `acct-${account.universityId || 'univ'}-${Date.now().toString().slice(-6)}`
    const bankName = (account.bankName || '').trim()
    const accountHolderName = (account.accountHolderName || account.accountName || '').trim()
    const accountName = (account.accountName || account.accountHolderName || '').trim()
    const accountNumber = (account.accountNumber || '').trim()
    const accountType = (account.accountType || 'Operating Account').trim()
    const branch = (account.branch || 'Campus Branch').trim()
    const ifscCode = (account.ifscCode || '').trim().toUpperCase()
    const currentBalance = Number(account.currentBalance) || 0
    const currency = (account.currency || 'INR').trim()
    const status = (account.status || 'Active').trim()
    const description = (account.description || '').trim()

    // Validation
    if (!account.universityId) {
      throw new Error('Bank account must be associated with an authorized institution ID.')
    }
    if (!bankName) {
      throw new Error('Bank name is required.')
    }
    if (!accountHolderName) {
      throw new Error('Account holder name is required.')
    }
    if (!accountNumber || accountNumber.length < 6) {
      throw new Error('Valid bank account number (minimum 6 digits) is required.')
    }

    const pool = await mysqlConfig.getPool()

    // Prevent duplicate account numbers
    const [existing] = await pool.query(
      'SELECT id, bank_name FROM bank_accounts WHERE account_number = ? LIMIT 1',
      [accountNumber]
    )
    if (existing.length > 0) {
      throw new Error(`Bank account number ending in ${accountNumber.slice(-4)} is already registered with ${existing[0].bank_name}.`)
    }

    const newAcct = {
      id,
      universityId: account.universityId,
      accountNumber,
      accountNumberMasked: maskAccountNumber(accountNumber),
      accountName,
      accountHolderName,
      bankName,
      accountType,
      branch,
      ifscCode,
      currentBalance,
      currency,
      status,
      description,
    }

    try {
      await pool.query(
        `INSERT INTO bank_accounts 
         (id, university_id, account_number, account_name, account_holder_name, bank_name, account_type, branch, ifsc_code, current_balance, currency, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           current_balance = VALUES(current_balance),
           account_name = VALUES(account_name),
           account_holder_name = VALUES(account_holder_name),
           bank_name = VALUES(bank_name),
           description = VALUES(description)`,
        [
          newAcct.id, newAcct.universityId, newAcct.accountNumber, newAcct.accountName,
          newAcct.accountHolderName, newAcct.bankName, newAcct.accountType, newAcct.branch, newAcct.ifscCode,
          newAcct.currentBalance, newAcct.currency, newAcct.status, newAcct.description
        ]
      )

      this.cache.bankAccounts.unshift(newAcct)

      // Update university bank account count
      const count = this.cache.bankAccounts.filter((a) => a.universityId === newAcct.universityId).length
      await pool.query('UPDATE universities SET bank_account_count = ? WHERE id = ?', [count, newAcct.universityId])
      const uIdx = this.cache.universities.findIndex((u) => u.id === newAcct.universityId)
      if (uIdx !== -1) {
        this.cache.universities[uIdx].bankAccountCount = count
      }
    } catch (err) {
      console.error('[MySQL Error] createBankAccount:', err.message)
      throw err
    }

    return newAcct
  }

  async updateBankAccount(id, updates) {
    const idx = this.cache.bankAccounts.findIndex((a) => a.id === id)
    if (idx !== -1) {
      this.cache.bankAccounts[idx] = { ...this.cache.bankAccounts[idx], ...updates }

      try {
        const pool = await mysqlConfig.getPool()
        const fields = []
        const values = []

        if (updates.accountName !== undefined) { fields.push('account_name = ?'); values.push(updates.accountName); }
        if (updates.bankName !== undefined) { fields.push('bank_name = ?'); values.push(updates.bankName); }
        if (updates.accountType !== undefined) { fields.push('account_type = ?'); values.push(updates.accountType); }
        if (updates.branch !== undefined) { fields.push('branch = ?'); values.push(updates.branch); }
        if (updates.ifscCode !== undefined) { fields.push('ifsc_code = ?'); values.push(updates.ifscCode); }
        if (updates.currentBalance !== undefined) { fields.push('current_balance = ?'); values.push(Number(updates.currentBalance)); }
        if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

        if (fields.length > 0) {
          values.push(id)
          await pool.query(`UPDATE bank_accounts SET ${fields.join(', ')} WHERE id = ?`, values)
        }
      } catch (err) {
        console.error('[MySQL Error] updateBankAccount:', err.message)
        throw err
      }

      return this.cache.bankAccounts[idx]
    }
    return null
  }

  async deleteBankAccount(id) {
    const target = this.cache.bankAccounts.find((a) => a.id === id)
    this.cache.bankAccounts = this.cache.bankAccounts.filter((a) => a.id !== id)

    // Remove statements & transactions associated with this account
    const stmtsToRemove = this.cache.statements.filter((s) => s.accountId === id)
    this.cache.statements = this.cache.statements.filter((s) => s.accountId !== id)

    try {
      const pool = await mysqlConfig.getPool()
      for (const s of stmtsToRemove) {
        await pool.query('DELETE FROM transactions WHERE statement_id = ?', [s.id])
        await pool.query('DELETE FROM statements WHERE id = ?', [s.id])
      }
      await pool.query('DELETE FROM bank_accounts WHERE id = ?', [id])

      if (target?.universityId) {
        const count = this.cache.bankAccounts.filter((a) => a.universityId === target.universityId).length
        await pool.query('UPDATE universities SET bank_account_count = ? WHERE id = ?', [count, target.universityId])
        const uIdx = this.cache.universities.findIndex((u) => u.id === target.universityId)
        if (uIdx !== -1) {
          this.cache.universities[uIdx].bankAccountCount = count
        }
      }
    } catch (err) {
      console.error('[MySQL Error] deleteBankAccount:', err.message)
      throw err
    }

    return true
  }


  // --- Statements ---
  getStatements(filter = {}) {
    let list = this.cache.statements || []
    if (filter.universityId) {
      list = list.filter((s) => s.universityId === filter.universityId)
    }
    if (filter.status) {
      list = list.filter((s) => s.status === filter.status)
    }
    return list
  }

  getStatementById(id) {
    return this.cache.statements.find((s) => s.id === id)
  }

  async createStatement(stmt) {
    if (!stmt.id) {
      stmt.id = `stmt-${stmt.universityId || 'univ'}-${Date.now()}`
    }
    this.cache.statements.unshift(stmt)

    try {
      const pool = await mysqlConfig.getPool()
      await pool.query(
        `INSERT INTO statements (id, university_id, university_name, account_id, account_number, account_name, bank_name, quarter, financial_year, file_name, file_size, uploaded_at, uploaded_by, total_debits, total_credits, opening_balance, closing_balance, status, ai_confidence, reconciliation_match, variance_amount, ai_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status);`,
        [
          stmt.id, stmt.universityId, stmt.universityName, stmt.accountId, stmt.accountNumber,
          stmt.accountName, stmt.bankName, stmt.quarter, stmt.financialYear || '2025-2026',
          stmt.fileName, stmt.fileSize, stmt.uploadedAt, stmt.uploadedBy,
          stmt.totalDebits, stmt.totalCredits, stmt.openingBalance, stmt.closingBalance,
          stmt.status, stmt.aiValidation?.confidenceScore || 98.2,
          stmt.aiValidation?.reconciliationMatch ? 1 : 0, stmt.aiValidation?.varianceAmount || 0,
          stmt.aiValidation?.summary || ''
        ]
      )

      if (stmt.transactions && stmt.transactions.length > 0) {
        for (let idx = 0; idx < stmt.transactions.length; idx++) {
          const tx = stmt.transactions[idx]
          const txId = tx.id || `tx-${stmt.id}-${idx + 1}-${Date.now().toString().slice(-4)}`
          tx.id = txId

          let validDate = new Date().toISOString().slice(0, 10)
          if (tx.date) {
            const cleanDateStr = String(tx.date).replace(/[^0-9/-]/g, '')
            const parts = cleanDateStr.replace(/\//g, '-').split('-')
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                validDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
              } else if (parts[2].length === 4) {
                validDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
              }
            }
          }

          await pool.query(
            `INSERT INTO transactions (id, statement_id, account_id, transaction_date, reference_no, description, type, amount, balance, category, ai_confidence, status, flag, allowable, resolved, resolution_action, resolution_note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status=VALUES(status);`,
            [
              txId, stmt.id, stmt.accountId, validDate, tx.referenceNo || `REF-${idx + 1}`,
              tx.description || 'Transaction', tx.type || 'DEBIT', Number(tx.amount) || 0, Number(tx.balance) || 0, tx.category || 'Institutional Operating',
              tx.aiConfidence || 95.0, tx.status || 'Validated', tx.flag || null,
              tx.allowable ? 1 : 0, tx.resolved ? 1 : 0, tx.resolutionAction || null,
              tx.resolutionNote || null
            ]
          )
        }
      }

      // Dynamically update the bank account's live balance
      if (stmt.accountId && stmt.closingBalance !== undefined) {
        await pool.query('UPDATE bank_accounts SET current_balance = ? WHERE id = ?', [stmt.closingBalance, stmt.accountId])
        const aIdx = this.cache.bankAccounts.findIndex((a) => a.id === stmt.accountId)
        if (aIdx !== -1) {
          this.cache.bankAccounts[aIdx].currentBalance = stmt.closingBalance
        }
      }

      // Dynamically update university's spent, available cash, status and compliance score
      if (stmt.universityId) {
        const uIdx = this.cache.universities.findIndex((u) => u.id === stmt.universityId)
        if (uIdx !== -1) {
          const currentSpent = Number(stmt.totalDebits) || 0
          const alloc = Number(this.cache.universities[uIdx].allocation) || 1
          const availCash = Math.max(0, alloc - currentSpent)
          const util = Number(((currentSpent / alloc) * 100).toFixed(2))
          const exceptions = stmt.aiValidation?.exceptionsCount || 0
          const score = Math.max(65, 98 - exceptions * 12)
          const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : 'B'
          const status = score >= 90 ? 'Optimal' : score >= 80 ? 'Normal' : 'Audit Warning'
          const today = new Date().toISOString().slice(0, 10)

          await pool.query(
            "UPDATE universities SET spent = ?, utilization = ?, statement_status = 'AI Validated', compliance_score = ?, compliance_grade = ?, status = ?, last_audit = ? WHERE id = ?",
            [currentSpent, util, score, grade, status, today, stmt.universityId]
          )
          this.cache.universities[uIdx].spent = currentSpent
          this.cache.universities[uIdx].availableCash = availCash
          this.cache.universities[uIdx].utilization = util
          this.cache.universities[uIdx].statementStatus = 'AI Validated'
          this.cache.universities[uIdx].complianceScore = score
          this.cache.universities[uIdx].complianceGrade = grade
          this.cache.universities[uIdx].status = status
          this.cache.universities[uIdx].lastAudit = today
        }
      }
    } catch (err) {
      console.error('[MySQL Error] createStatement:', err.message)
    }

    return stmt
  }

  async updateStatement(id, updates) {
    const idx = this.cache.statements.findIndex((s) => s.id === id)
    if (idx !== -1) {
      this.cache.statements[idx] = { ...this.cache.statements[idx], ...updates }

      try {
        const pool = await mysqlConfig.getPool()
        const fields = []
        const values = []

        if (updates.status !== undefined) {
          fields.push('status = ?')
          values.push(updates.status)
        }
        if (updates.submittedAt !== undefined) {
          fields.push('submitted_at = ?')
          values.push(updates.submittedAt)
        }
        if (updates.submissionRemarks !== undefined) {
          fields.push('submission_remarks = ?')
          values.push(updates.submissionRemarks)
        }
        if (updates.approvedAt !== undefined) {
          fields.push('approved_at = ?')
          values.push(updates.approvedAt)
        }
        if (updates.reviewedBy !== undefined) {
          fields.push('reviewed_by = ?')
          values.push(updates.reviewedBy)
        }
        if (updates.reviewNotes !== undefined) {
          fields.push('review_notes = ?')
          values.push(updates.reviewNotes)
        }

        if (fields.length > 0) {
          values.push(id)
          await pool.query(`UPDATE statements SET ${fields.join(', ')} WHERE id = ?`, values)
        }

        // If transactions were updated (e.g. exception resolved)
        if (updates.transactions) {
          for (const tx of updates.transactions) {
            await pool.query(
              `UPDATE transactions
               SET status = ?, resolved = ?, resolution_action = ?, resolution_note = ?, category = ?
               WHERE id = ? AND statement_id = ?`,
              [tx.status, tx.resolved ? 1 : 0, tx.resolutionAction || null, tx.resolutionNote || null, tx.category, tx.id, id]
            )
          }
        }
      } catch (err) {
        console.error('[MySQL Error] updateStatement:', err.message)
      }

      return this.cache.statements[idx]
    }
    return null
  }

  async deleteStatement(id) {
    this.cache.statements = this.cache.statements.filter((s) => s.id !== id)
    try {
      const pool = await mysqlConfig.getPool()
      await pool.query('DELETE FROM transactions WHERE statement_id = ?', [id])
      await pool.query('DELETE FROM statements WHERE id = ?', [id])
    } catch (err) {
      console.error('[MySQL Error] deleteStatement:', err.message)
      throw err
    }
    return true
  }

  async clearAllDummyData() {
    try {
      const pool = await mysqlConfig.getPool()
      await pool.query('DELETE FROM transactions')
      await pool.query('DELETE FROM statements')
      await pool.query('DELETE FROM bank_accounts')
      await pool.query('DELETE FROM audit_logs')
      await pool.query('DELETE FROM fund_domains')
      await pool.query('DELETE FROM category_benchmarks')
      await pool.query('DELETE FROM ai_insights')
      await pool.query('DELETE FROM compliance_standards')
      await pool.query('DELETE FROM universities')
      await this.initFromMySQL()
      return {
        success: true,
        message: 'All dummy transactions, statements, bank details, colleges list, and audit logs cleared successfully. Platform is clean and dynamic.',
      }
    } catch (err) {
      console.error('[MySQL Error] clearAllDummyData:', err.message)
      throw err
    }
  }

  // --- Reports (Queried directly from MySQL tables) ---
  getReports() {
    return this.cache.reports || {
      fundDistribution: [],
      categoryAnalysis: [],
      aiInsights: [],
      complianceMatrix: [],
    }
  }

  // --- Government Policies (Dynamic Statewide Scope) ---
  getPolicies() {
    return this.cache.policies || []
  }

  getPolicyById(id) {
    return (this.cache.policies || []).find((p) => p.id === id || p.policyCode === id)
  }

  async createPolicy(policyData) {
    const id = policyData.id || `pol-${Date.now().toString().slice(-6)}`
    const policyCode = (policyData.policyCode || policyData.policy_code || `POL-KA-${Date.now().toString().slice(-4)}`).trim().toUpperCase()
    const title = (policyData.title || '').trim()
    const category = (policyData.category || 'Statutory Compliance').trim()
    const scope = (policyData.scope || 'All Colleges').trim()
    const directive = (policyData.directive || '').trim()
    const thresholdValue = (policyData.thresholdValue || policyData.threshold_value || '').trim()
    const effectiveDate = policyData.effectiveDate || policyData.effective_date || new Date().toISOString().slice(0, 10)
    const status = policyData.status || 'Active'

    if (!title || !directive) {
      throw new Error('Policy title and mandatory directive guidelines are required.')
    }

    const newPolicy = {
      id,
      policyCode,
      title,
      category,
      scope,
      directive,
      thresholdValue,
      effectiveDate,
      status,
      createdAt: new Date().toISOString(),
    }

    try {
      const pool = await mysqlConfig.getPool()
      await pool.query(
        `INSERT INTO policies (id, policy_code, title, category, scope, directive, threshold_value, effective_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           category = VALUES(category),
           directive = VALUES(directive),
           threshold_value = VALUES(threshold_value),
           effective_date = VALUES(effective_date),
           status = VALUES(status)`,
        [id, policyCode, title, category, scope, directive, thresholdValue, effectiveDate, status]
      )
    } catch (err) {
      console.error('[MySQL Error] createPolicy:', err.message)
    }

    const existingIndex = (this.cache.policies || []).findIndex((p) => p.id === id || p.policyCode === policyCode)
    if (existingIndex >= 0) {
      this.cache.policies[existingIndex] = newPolicy
    } else {
      this.cache.policies.unshift(newPolicy)
    }

    return newPolicy
  }

  async updatePolicy(id, updates) {
    const policy = (this.cache.policies || []).find((p) => p.id === id)
    if (!policy) {
      throw new Error('Policy not found')
    }

    Object.assign(policy, updates)

    try {
      const pool = await mysqlConfig.getPool()
      await pool.query(
        `UPDATE policies
         SET title = COALESCE(?, title),
             category = COALESCE(?, category),
             directive = COALESCE(?, directive),
             threshold_value = COALESCE(?, threshold_value),
             status = COALESCE(?, status)
         WHERE id = ?`,
        [updates.title, updates.category, updates.directive, updates.thresholdValue, updates.status, id]
      )
    } catch (err) {
      console.error('[MySQL Error] updatePolicy:', err.message)
    }

    return policy
  }

  async deletePolicy(id) {
    const index = (this.cache.policies || []).findIndex((p) => p.id === id)
    if (index === -1) {
      throw new Error('Policy not found')
    }

    const deleted = this.cache.policies.splice(index, 1)[0]

    try {
      const pool = await mysqlConfig.getPool()
      await pool.query('DELETE FROM policies WHERE id = ?', [id])
    } catch (err) {
      console.error('[MySQL Error] deletePolicy:', err.message)
    }

    return deleted
  }

  // --- Audit Logs ---
  getAuditLogs() {
    return this.cache.auditLogs
  }

  async addAuditLog(entry) {
    const newEntry = {
      id: `audit-${Date.now()}`,
      hash: Math.random().toString(16).substring(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      ...entry,
    }

    this.cache.auditLogs.unshift(newEntry)

    try {
      const pool = await mysqlConfig.getPool()
      await pool.query(
        `INSERT INTO audit_logs (id, hash, timestamp_str, user_name, action, details, ip_address, priority_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newEntry.id, newEntry.hash, newEntry.timestamp, newEntry.user || 'System',
          newEntry.action, newEntry.details, newEntry.ip || '127.0.0.1', newEntry.level || 'Normal'
        ]
      )
    } catch (err) {
      console.error('[MySQL Error] addAuditLog:', err.message)
    }

    return newEntry
  }

  // Re-sync directly from MySQL
  async reset() {
    await this.initFromMySQL()
    return this.cache
  }
}

const db = new MySQLDatabase()
module.exports = db
