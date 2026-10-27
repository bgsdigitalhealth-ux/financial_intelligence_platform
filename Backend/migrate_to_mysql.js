const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const db = require('./models/db')

async function migrate(customPassword) {
  const host = process.env.DB_HOST || '127.0.0.1'
  const port = Number(process.env.DB_PORT) || 3306
  const user = process.env.DB_USER || 'root'
  const password = customPassword !== undefined ? customPassword : (process.env.DB_PASSWORD || '')
  const database = process.env.DB_NAME || 'gov_finance_intel'

  console.log(`[Migration] Connecting to MySQL at ${user}@${host}:${port}...`)

  try {
    // 1. Create database
    const rootConn = await mysql.createConnection({ host, port, user, password })
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await rootConn.end()
    console.log(`[Migration] Database '${database}' ready.`)

    // 2. Connect to database
    const conn = await mysql.createConnection({ host, port, user, password, database })

    // 3. Run schema creation
    const rawSql = fs.readFileSync(path.join(__dirname, 'models', 'schema.sql'), 'utf-8')
    const cleanedSql = rawSql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//gm, '')

    const statements = cleanedSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.toLowerCase().startsWith('use'))

    for (const sql of statements) {
      await conn.query(sql)
    }
    console.log('[Migration] Database tables created.')

    // 4. Seed universities
    const universities = db.getUniversities()
    console.log(`[Migration] Inserting ${universities.length} universities...`)
    for (const u of universities) {
      await conn.query(
        `INSERT INTO universities (id, code, name, region, category, allocation, spent, utilization, compliance_score, compliance_grade, status, warning_reason, patents, student_enrollment, bank_account_count, statement_status, last_audit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE allocation=VALUES(allocation), spent=VALUES(spent), utilization=VALUES(utilization), compliance_score=VALUES(compliance_score), compliance_grade=VALUES(compliance_grade), status=VALUES(status);`,
        [
          u.id, u.code, u.name, u.region, u.category, u.allocation, u.spent,
          u.utilization,
          u.complianceScore, u.complianceGrade, u.status, u.warningReason || null,
          u.patents, u.studentEnrollment, u.bankAccountCount, u.statementStatus, u.lastAudit || null
        ]
      )
    }

    // 5. Seed bank accounts
    const bankAccounts = db.getBankAccounts()
    console.log(`[Migration] Inserting ${bankAccounts.length} bank accounts...`)
    for (const a of bankAccounts) {
      await conn.query(
        `INSERT INTO bank_accounts (id, university_id, account_number, account_name, bank_name, account_type, branch, ifsc_code, current_balance, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE current_balance=VALUES(current_balance), status=VALUES(status);`,
        [
          a.id, a.universityId, a.accountNumber, a.accountName, a.bankName, a.accountType,
          a.branch || 'State Capital Branch', a.ifscCode, a.currentBalance, a.currency || 'INR', a.status || 'Active'
        ]
      )
    }

    // 6. Seed statements
    const stmts = db.getStatements()
    console.log(`[Migration] Inserting ${stmts.length} statements and transactions...`)
    for (const s of stmts) {
      await conn.query(
        `INSERT INTO statements (id, university_id, university_name, account_id, account_number, account_name, bank_name, quarter, financial_year, file_name, file_size, uploaded_at, uploaded_by, total_debits, total_credits, opening_balance, closing_balance, status, ai_confidence, reconciliation_match, variance_amount, ai_summary, submitted_at, submission_remarks, approved_at, reviewed_by, review_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), reviewed_by=VALUES(reviewed_by), approved_at=VALUES(approved_at), review_notes=VALUES(review_notes);`,
        [
          s.id, s.universityId, s.universityName, s.accountId, s.accountNumber, s.accountName, s.bankName,
          s.quarter, s.financialYear || '2025-2026', s.fileName, s.fileSize, s.uploadedAt, s.uploadedBy,
          s.totalDebits, s.totalCredits, s.openingBalance, s.closingBalance, s.status,
          s.aiValidation?.confidenceScore || 98.2, s.aiValidation?.reconciliationMatch ? 1 : 0, s.aiValidation?.varianceAmount || 0,
          s.aiValidation?.summary || '', s.submittedAt || null, s.submissionRemarks || null, s.approvedAt || null,
          s.reviewedBy || null, s.reviewNotes || null
        ]
      )

      if (s.transactions && s.transactions.length > 0) {
        for (const tx of s.transactions) {
          await conn.query(
            `INSERT INTO transactions (id, statement_id, account_id, transaction_date, reference_no, description, type, amount, balance, category, ai_confidence, status, flag, allowable, resolved, resolution_action, resolution_note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status=VALUES(status), resolved=VALUES(resolved), resolution_action=VALUES(resolution_action), resolution_note=VALUES(resolution_note);`,
            [
              tx.id, s.id, s.accountId, tx.date, tx.referenceNo || 'TX-REF', tx.description,
              tx.type, tx.amount, tx.balance || 0, tx.category, tx.aiConfidence || 95.0,
              tx.status, tx.flag || null, tx.allowable ? 1 : 0, tx.resolved ? 1 : 0,
              tx.resolutionAction || null, tx.resolutionNote || null
            ]
          )
        }
      }
    }

    // 7. Seed audit logs
    const logs = db.getAuditLogs()
    console.log(`[Migration] Inserting ${logs.length} audit logs...`)
    for (const l of logs) {
      await conn.query(
        `INSERT INTO audit_logs (id, hash, timestamp_str, user_name, action, details, ip_address, priority_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE action=VALUES(action);`,
        [l.id, l.hash, l.timestamp, l.user, l.action, l.details, l.ip || '127.0.0.1', l.level || 'Normal']
      )
    }

    await conn.end()
    console.log('[Migration] Migration to MySQL COMPLETED SUCCESSFULLY!')

    // Update .env with working password
    if (customPassword !== undefined) {
      const envPath = path.join(__dirname, '.env')
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : ''
      if (envContent.includes('DB_PASSWORD=')) {
        envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${customPassword}`)
      } else {
        envContent += `\nDB_PASSWORD=${customPassword}`
      }
      fs.writeFileSync(envPath, envContent)
    }

    return true
  } catch (err) {
    console.error('[Migration Error]', err.message)
    return false
  }
}

// Allow CLI execution: node migrate_to_mysql.js [password]
if (require.main === module) {
  const pwd = process.argv[2]
  migrate(pwd).then((ok) => {
    process.exit(ok ? 0 : 1)
  })
}

module.exports = { migrate }
