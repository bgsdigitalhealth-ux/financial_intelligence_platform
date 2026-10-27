const express = require('express')
const router = express.Router()
const db = require('../models/db')

// GET /api/admin/audit-logs
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.getAuditLogs()
    res.json({ success: true, count: logs.length, logs })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/admin/audit-logs
router.post('/audit-logs', (req, res) => {
  try {
    const { action, details, user, level } = req.body
    const entry = db.addAuditLog({ action, details, user, level })
    res.json({ success: true, entry })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/admin/reset
router.post('/reset', async (req, res) => {
  try {
    const resetData = await db.reset()
    res.json({
      success: true,
      message: 'Platform database restored to clean dynamic baseline',
      universitiesCount: resetData.universities.length,
      bankAccountsCount: resetData.bankAccounts.length,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/admin/clean-dummy-data (Wipe all mock/dummy transactions, statements, and bank accounts)
router.post('/clean-dummy-data', async (req, res) => {
  try {
    const result = await db.clearAllDummyData()
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


// GET /api/admin/mysql-status
router.get('/mysql-status', (req, res) => {
  const mysqlConfig = require('../config/mysql')
  res.json({
    success: true,
    connected: mysqlConfig.isMySQLConnected(),
    config: {
      host: mysqlConfig.config.host,
      port: mysqlConfig.config.port,
      user: mysqlConfig.config.user,
      database: mysqlConfig.config.database,
    },
  })
})

// POST /api/admin/mysql-connect
router.post('/mysql-connect', async (req, res) => {
  try {
    const { password } = req.body
    const { migrate } = require('../migrate_to_mysql')
    const ok = await migrate(password)

    if (ok) {
      const mysqlConfig = require('../config/mysql')
      await mysqlConfig.initMySQL(db.data)
      res.json({
        success: true,
        message: 'Successfully connected and migrated to MySQL database gov_finance_intel!',
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to connect to MySQL with provided credentials. Please verify root password.',
      })
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
