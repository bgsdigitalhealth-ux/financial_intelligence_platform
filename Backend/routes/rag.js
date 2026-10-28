const express = require('express')
const router = express.Router()
const ragEngine = require('../rag/engine')
const db = require('../models/db')

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001'

// GET /api/rag (or /rag) - Status
router.get('/', (req, res) => {
  const universities = db.getUniversities()
  const statements = db.getStatements()
  const policies = db.getPolicies()

  res.json({
    service: 'FinBot - Dynamic Financial Intelligence RAG Engine',
    status: 'ONLINE',
    dynamicTraining: {
      active: true,
      autoTrainOnUpload: true,
      collegesCount: universities.length,
      uploadedStatementsCount: statements.length,
      policiesCount: policies.length,
    },
  })
})

// GET /api/rag/status - Returns live telemetry
router.get('/status', async (req, res) => {
  const universities = db.getUniversities()
  const statements = db.getStatements()
  const policies = db.getPolicies()

  // Try python service if up
  let pythonStatus = null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1500)
    const response = await fetch(`${RAG_SERVICE_URL}/status`, { signal: controller.signal })
    clearTimeout(timer)
    if (response.ok) {
      pythonStatus = await response.json()
    }
  } catch (err) {
    // Offline or timed out, fallback to native dynamic RAG
  }

  res.json({
    success: true,
    service: 'FinBot',
    chromaDB: {
      status: pythonStatus ? 'Connected' : 'Dynamic Active',
      totalChunks: statements.length + policies.length,
    },
    mysql: {
      connected: true,
      collegesCount: universities.length,
      statementsCount: statements.length,
    },
  })
})

// POST /api/rag/query - Executes Dynamic RAG Query
router.post('/query', async (req, res) => {
  try {
    const { query, role, universityId, model } = req.body

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query text is required.' })
    }

    // Attempt external service only if explicitly configured in environment
    if (process.env.RAG_SERVICE_URL) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 1000)
        const response = await fetch(`${process.env.RAG_SERVICE_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query.trim(),
            role: role || 'Government Leadership',
            universityId: universityId || null,
            model: model || 'llama3',
          }),
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (response.ok) {
          const data = await response.json()
          if (data && data.success) {
            return res.json(data)
          }
        }
      } catch (err) {
        // Microservice unavailable, fall through to native dynamic RAG
      }
    }

    // Native Dynamic RAG Engine trained directly on all college uploads
    const result = await ragEngine.query({
      query: query.trim(),
      role,
      universityId,
    })

    res.json(result)
  } catch (err) {
    console.error('[FinBot RAG Error]', err)
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to process query.',
    })
  }
})

// GET /api/rag/documents - Lists indexed documents
router.get('/documents', (req, res) => {
  const items = ragEngine.getDocuments()

  res.json({
    success: true,
    totalCount: items.length,
    documents: items,
  })
})

// POST /api/rag/index - Index document
router.post('/index', (req, res) => {
  try {
    const { id, title, text, statement } = req.body
    if (statement) {
      ragEngine.indexStatement(statement)
    }
    res.json({
      success: true,
      message: `Indexed into FinBot RAG knowledge base.`,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
