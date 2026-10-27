require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysqlConfig = require('../config/mysql')

async function cleanDummyData() {
  const pool = await mysqlConfig.getPool()
  console.log('[Clean] Connecting to MySQL...')

  await pool.query('DELETE FROM transactions')
  await pool.query('DELETE FROM statements')
  await pool.query('DELETE FROM bank_accounts')
  await pool.query('DELETE FROM universities')
  await pool.query('DELETE FROM audit_logs')
  await pool.query("DELETE FROM users WHERE primary_role_id != 'gov_leader'")

  const [u] = await pool.query('SELECT count(*) as cnt FROM universities')
  const [b] = await pool.query('SELECT count(*) as cnt FROM bank_accounts')
  const [s] = await pool.query('SELECT count(*) as cnt FROM statements')
  const [t] = await pool.query('SELECT count(*) as cnt FROM transactions')
  const [users] = await pool.query('SELECT email, primary_role_id, name FROM users')

  console.log('--- CLEANUP COMPLETE ---')
  console.log('Universities count:', u[0].cnt)
  console.log('Bank Accounts count:', b[0].cnt)
  console.log('Statements count:', s[0].cnt)
  console.log('Transactions count:', t[0].cnt)
  console.log('Active Users:', users)

  process.exit(0)
}

cleanDummyData().catch((err) => {
  console.error('[Clean Error]', err)
  process.exit(1)
})
