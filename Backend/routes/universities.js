const express = require('express')
const router = express.Router()
const db = require('../models/db')

// GET /api/universities
router.get('/', (req, res) => {
  try {
    let universities = db.getUniversities()
    const { search, region, category, status, sortBy, sortOrder } = req.query

    // Filter by search
    if (search) {
      const q = search.toLowerCase().trim()
      universities = universities.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q) ||
          u.category.toLowerCase().includes(q)
      )
    }

    // Filter by region
    if (region && region !== 'All') {
      universities = universities.filter((u) => u.region.toLowerCase() === region.toLowerCase())
    }

    // Filter by category
    if (category && category !== 'All') {
      universities = universities.filter((u) => u.category === category)
    }

    // Filter by compliance status
    if (status && status !== 'All') {
      universities = universities.filter((u) => u.status === status)
    }

    // Sort
    if (sortBy) {
      universities.sort((a, b) => {
        let valA = a[sortBy]
        let valB = b[sortBy]
        if (typeof valA === 'string') valA = valA.toLowerCase()
        if (typeof valB === 'string') valB = valB.toLowerCase()
        if (valA < valB) return sortOrder === 'desc' ? 1 : -1
        if (valA > valB) return sortOrder === 'desc' ? -1 : 1
        return 0
      })
    }

    // Dynamic Statewide Summary computation
    const totalAllocated = universities.reduce((acc, u) => acc + (Number(u.allocation) || 0), 0)
    const disbursedToDate = universities.reduce((acc, u) => acc + (Number(u.spent) || 0), 0)
    const reserveRemaining = Math.max(0, totalAllocated - disbursedToDate)
    const utilizationRate = totalAllocated > 0 ? Number(((disbursedToDate / totalAllocated) * 100).toFixed(1)) : 0
    const totalPatents = universities.reduce((acc, u) => acc + (Number(u.patents) || 0), 0)
    const totalStudents = universities.reduce((acc, u) => acc + (Number(u.studentEnrollment) || 0), 0)
    const flaggedCount = universities.filter((u) => u.status !== 'Optimal').length

    res.json({
      success: true,
      count: universities.length,
      summary: {
        totalAllocated,
        disbursedToDate,
        reserveRemaining,
        utilizationRate,
        totalPatents,
        totalStudents,
        activeInstitutions: universities.length,
        flaggedCount,
        economicMultiplier: Number((2.8 + (totalPatents / 1400) * 0.9).toFixed(2)),
      },
      universities,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/universities/:id
router.get('/:id', (req, res) => {
  try {
    const university = db.getUniversityById(req.params.id)
    if (!university) {
      return res.status(404).json({ success: false, error: 'University not found' })
    }

    const bankAccounts = db.getBankAccounts(university.id)
    const statements = db.getStatements({ universityId: university.id })

    res.json({
      success: true,
      university,
      bankAccounts,
      statements,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/universities (Register / Add College Details by Government Admin)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      code,
      institutionType = 'State Public University',
      officialEmail,
      financeEmail,
      state = 'Karnataka',
      district = '',
      address = '',
      affiliatedUniversity = '',
      status = 'Optimal',
      password,
      initialPassword,
      officerName,
      allocation,
      region = 'Bengaluru Central',
      category = 'State University',
      studentEnrollment,
      id,
    } = req.body

    // Server-side validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Official college/university name is required.' })
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: 'Institution code / registration number is required.' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const primaryEmail = (officialEmail || req.body.email || '').trim().toLowerCase()
    const secondaryEmail = (financeEmail || '').trim().toLowerCase()

    if (!primaryEmail || !emailRegex.test(primaryEmail)) {
      return res.status(400).json({
        success: false,
        error: 'A valid primary official institutional email is required.',
      })
    }

    if (!secondaryEmail || !emailRegex.test(secondaryEmail)) {
      return res.status(400).json({
        success: false,
        error: 'A valid second authorized finance email is required for the college finance user.',
      })
    }

    const created = await db.createUniversity({
      id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      institutionType: institutionType.trim(),
      officialEmail: primaryEmail,
      financeEmail: secondaryEmail,
      state: state.trim(),
      district: district.trim(),
      address: address.trim(),
      affiliatedUniversity: affiliatedUniversity.trim(),
      status: (status || 'Optimal').trim(),
      password: (password || initialPassword || req.body.tempPassword || 'password123').trim(),
      officerName: (officerName || '').trim(),
      allocation: Number(allocation || req.body.allocatedAmount) || 0,
      region: region.trim(),
      category: category.trim(),
      studentEnrollment: Number(studentEnrollment) || 0,
    })

    db.addAuditLog({
      user: 'Government Admin (Sri. G. Kumar Naik, IAS)',
      action: 'COLLEGE_ONBOARDED',
      details: `Enrolled ${created.name} (${created.code}) into State Ledger. Primary Contact: ${created.officialEmail}, Authorized Finance: ${created.financeEmail}`,
      level: 'High',
    })

    res.status(201).json({
      success: true,
      message: `College "${created.name}" registered successfully in MySQL. Finance credentials created for ${created.financeEmail}.`,
      university: created,
      activationToken: created.activationToken,
      userStatus: created.userStatus,
    })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// PUT /api/universities/:id (Update College Details by Government Admin)
router.put('/:id', async (req, res) => {
  try {
    const university = db.getUniversityById(req.params.id)
    if (!university) {
      return res.status(404).json({ success: false, error: 'University not found in registry.' })
    }

    const {
      name,
      code,
      institutionType,
      officialEmail,
      financeEmail,
      state,
      district,
      address,
      affiliatedUniversity,
      status,
      statementStatus,
      allocation,
      spent,
    } = req.body

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (officialEmail && !emailRegex.test(officialEmail.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid official institutional email format.' })
    }
    if (financeEmail && !emailRegex.test(financeEmail.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid authorized finance email format.' })
    }

    const updated = await db.updateUniversity(req.params.id, {
      name,
      code,
      institutionType,
      officialEmail,
      financeEmail,
      state,
      district,
      address,
      affiliatedUniversity,
      status,
      statementStatus,
      allocation,
      spent,
    })

    db.addAuditLog({
      user: 'Government Admin (Sri. G. Kumar Naik, IAS)',
      action: 'COLLEGE_UPDATED',
      details: `Updated details for ${updated.name} (${updated.code})`,
      level: 'Normal',
    })

    res.json({
      success: true,
      message: `College "${updated.name}" updated successfully in MySQL.`,
      university: updated,
    })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// DELETE /api/universities/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteUniversity(req.params.id)
    res.json({ success: true, message: 'University removed successfully from MySQL' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router

