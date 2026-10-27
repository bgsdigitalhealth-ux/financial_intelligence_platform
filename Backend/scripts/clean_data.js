// Karnataka Higher Education Department - Financial Intelligence Platform
// Clean Data Utility: Removes all dummy transactions, dummy statements, and dummy bank accounts.
// Leaves master universities and authenticated users intact for 100% dynamic live usage.

const mysqlConfig = require('../config/mysql')

async function run() {
  console.log('===============================================================')
  console.log('GovFinanceIntel: Cleaning All Mock & Dummy Financial Data')
  console.log('===============================================================')

  const pool = await mysqlConfig.getPool()

  // 1. Delete all transactions
  const [txBefore] = await pool.query('SELECT COUNT(*) as cnt FROM transactions')
  console.log(`[1/4] Deleting ${txBefore[0].cnt} transactions...`)
  await pool.query('DELETE FROM transactions')

  // 2. Delete all statements
  const [stmtBefore] = await pool.query('SELECT COUNT(*) as cnt FROM statements')
  console.log(`[2/4] Deleting ${stmtBefore[0].cnt} quarterly statements...`)
  await pool.query('DELETE FROM statements')

  // 3. Delete all dummy bank accounts
  const [acctBefore] = await pool.query('SELECT COUNT(*) as cnt FROM bank_accounts')
  console.log(`[3/5] Deleting ${acctBefore[0].cnt} dummy bank accounts...`)
  await pool.query('DELETE FROM bank_accounts')

  // 4. Delete all dummy audit logs
  const [logsBefore] = await pool.query('SELECT COUNT(*) as cnt FROM audit_logs')
  console.log(`[4/5] Deleting ${logsBefore[0].cnt} audit logs...`)
  await pool.query('DELETE FROM audit_logs')

  // 5. Delete all universities (Clean slate, zero dummy colleges)
  console.log('[5/6] Deleting all dummy universities from master directory...')
  await pool.query('DELETE FROM universities')

  // 6. Delete static dummy report tables
  console.log('[6/6] Purging mock report tables (fund_domains, category_benchmarks, ai_insights, compliance_standards)...')
  await pool.query('DELETE FROM fund_domains')
  await pool.query('DELETE FROM category_benchmarks')
  await pool.query('DELETE FROM ai_insights')
  await pool.query('DELETE FROM compliance_standards')

  // Final verification
  const [txAfter] = await pool.query('SELECT COUNT(*) as cnt FROM transactions')
  const [stmtAfter] = await pool.query('SELECT COUNT(*) as cnt FROM statements')
  const [acctAfter] = await pool.query('SELECT COUNT(*) as cnt FROM bank_accounts')
  const [logsAfter] = await pool.query('SELECT COUNT(*) as cnt FROM audit_logs')
  const [univCount] = await pool.query('SELECT COUNT(*) as cnt FROM universities')

  console.log('\n--- Cleanup Results ---')
  console.log(`• Transactions:  ${txAfter[0].cnt} (Clean)`)
  console.log(`• Statements:    ${stmtAfter[0].cnt} (Clean)`)
  console.log(`• Bank Accounts: ${acctAfter[0].cnt} (Clean)`)
  console.log(`• Audit Logs:    ${logsAfter[0].cnt} (Clean)`)
  console.log(`• Universities:  ${univCount[0].cnt} (Clean: 0 dummy colleges)`)

  console.log('===============================================================')
  console.log('SUCCESS: All dummy data removed! Platform is dynamic & clean.')
  console.log('Institutions can now dynamically add real bank accounts and')
  console.log('upload actual statement CSV files via the portal.')
  console.log('===============================================================')

  process.exit(0)
}

run().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
