const express = require('express')
const router = express.Router()
const db = require('../models/db')

// GET /api/reports
router.get('/', (req, res) => {
  try {
    const reports = db.getReports()
    const universities = db.getUniversities()
    const statements = db.getStatements()

    // Dynamically calculate compliance summary from live universities
    const totalUniversities = universities.length
    const optimal = universities.filter((u) => u.status === 'Optimal').length
    const notice = universities.filter((u) => u.status === 'Notice').length
    const flagged = universities.filter((u) => u.status === 'Audit Flag').length
    const totalAllocation = universities.reduce((acc, u) => acc + u.allocation, 0)
    const totalDisbursed = universities.reduce((acc, u) => acc + u.spent, 0)

    res.json({
      success: true,
      data: {
        ...reports,
        liveMetrics: {
          totalUniversities,
          optimalCount: optimal,
          noticeCount: notice,
          flaggedCount: flagged,
          totalAllocation,
          totalDisbursed,
          aggregateUtilization: totalAllocation > 0 ? Number(((totalDisbursed / totalAllocation) * 100).toFixed(1)) : 0,
          pendingStatementApprovals: statements.filter((s) => s.status === 'Submitted for Approval').length,
        },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
