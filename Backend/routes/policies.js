const express = require('express')
const router = express.Router()
const db = require('../models/db')

// GET /api/policies - List all dynamic policies
router.get('/', (req, res) => {
  try {
    const policies = db.getPolicies()
    res.json({
      success: true,
      count: policies.length,
      policies,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/policies/:id - Single policy
router.get('/:id', (req, res) => {
  try {
    const policy = db.getPolicyById(req.params.id)
    if (!policy) {
      return res.status(404).json({ success: false, error: 'Policy not found' })
    }
    res.json({ success: true, policy })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/policies - Government Admin adds a new policy
router.post('/', async (req, res) => {
  try {
    const { policyCode, title, category, scope, directive, thresholdValue, effectiveDate, status } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Policy title is required.' })
    }
    if (!directive || !directive.trim()) {
      return res.status(400).json({ success: false, error: 'Policy directive guidelines are required.' })
    }

    const newPolicy = await db.createPolicy({
      policyCode,
      title,
      category,
      scope: scope || 'All Colleges',
      directive,
      thresholdValue,
      effectiveDate,
      status: status || 'Active',
    })

    await db.addAuditLog({
      user: 'Sri. G. Kumar Naik, IAS',
      action: 'POLICY_ENACTED',
      details: `Enacted statewide policy [${newPolicy.policyCode}] "${newPolicy.title}" across all colleges.`,
      level: 'High',
    })

    res.status(201).json({
      success: true,
      message: 'Statewide policy enacted successfully across all institutions.',
      policy: newPolicy,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/policies/:id - Update policy
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.updatePolicy(req.params.id, req.body)
    res.json({
      success: true,
      message: 'Policy updated successfully.',
      policy: updated,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/policies/:id - Remove policy
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deletePolicy(req.params.id)
    res.json({
      success: true,
      message: 'Policy removed successfully.',
      policy: deleted,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
