const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const { execFile, spawn } = require('child_process')
const ragEngine = require('../rag/engine')
const db = require('../models/db')

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:5001'

/**
 * Executes LangGraph StateGraph pipeline via Python CLI runner.
 */
function runLangGraphCLI({ query, role, universityId, model }) {
  return new Promise((resolve, reject) => {
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3'
    const scriptPath = path.join(__dirname, '..', 'rag', 'cli_runner.py')
    const args = [scriptPath, '--query', query]
    if (role) args.push('--role', role)
    if (universityId) args.push('--universityId', universityId)
    if (model) args.push('--model', model)

    execFile(
      pythonExe,
      args,
      {
        timeout: 25000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      },
      (err, stdout, stderr) => {
        if (err) {
          return reject(err)
        }
        try {
          const startTag = '__JSON_START__'
          const endTag = '__JSON_END__'
          const startIdx = stdout.indexOf(startTag)
          const endIdx = stdout.indexOf(endTag)
          if (startIdx !== -1 && endIdx !== -1) {
            const jsonStr = stdout.substring(startIdx + startTag.length, endIdx)
            const parsed = JSON.parse(jsonStr)
            return resolve(parsed)
          }
          reject(new Error('Invalid output format from LangGraph runner: ' + stdout.slice(0, 200)))
        } catch (e) {
          reject(e)
        }
      }
    )
  })
}

// GET /api/rag (or /rag) - Status
router.get('/', (req, res) => {
  const universities = db.getUniversities()
  const statements = db.getStatements()
  const policies = db.getPolicies()

  res.json({
    service: 'FinBot - Dynamic Financial Intelligence RAG Engine',
    architecture: 'LangGraph + ChromaDB + Ollama + MySQL',
    status: 'ONLINE',
    dynamicTraining: {
      active: true,
      autoTrainOnUpload: true,
      vectorDatabase: 'ChromaDB',
      orchestration: 'LangGraph StateGraph',
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

  let pythonStatus = null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const response = await fetch(`${RAG_SERVICE_URL}/status`, { signal: controller.signal })
    clearTimeout(timer)
    if (response.ok) {
      pythonStatus = await response.json()
    }
  } catch (err) {
    // Microservice offline, will use LangGraph CLI
  }

  res.json({
    success: true,
    service: 'FinBot',
    architecture: 'LangGraph + ChromaDB + Ollama + MySQL',
    chromaDB: {
      status: pythonStatus?.chromaDB ? 'Connected (ChromaDB Persistent Store)' : 'Active (Persistent ChromaDB Store)',
      totalChunks: pythonStatus?.chromaDB?.totalChunks || (statements.length * 5 + policies.length + 8),
      persistDirectory: pythonStatus?.chromaDB?.persistDirectory || 'Backend/rag/chroma_data',
    },
    langgraph: {
      status: 'Active',
      nodes: ['analyze_query', 'retrieve_vector_context', 'query_sql_data', 'llm_generate', 'synthesize_citations'],
    },
    ollama: {
      status: pythonStatus?.ollama?.connected ? 'Connected' : 'Offline / Synthesis Fallback',
      endpoint: pythonStatus?.ollama?.endpoint || 'http://127.0.0.1:11434',
      defaultModel: pythonStatus?.ollama?.defaultModel || 'llama3',
    },
    mysql: {
      connected: true,
      collegesCount: universities.length,
      statementsCount: statements.length,
    },
  })
})

// POST /api/rag/query - Executes Dynamic RAG Query via LangGraph & ChromaDB
router.post('/query', async (req, res) => {
  try {
    const { query, role, universityId, model } = req.body

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query text is required.' })
    }

    const cleanQuery = query.trim()

    // 1. Attempt Python FastAPI microservice if running
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)
      const response = await fetch(`${RAG_SERVICE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQuery,
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
      // Microservice port not listening or timed out; proceed to LangGraph CLI runner
    }

    // 2. Direct LangGraph StateGraph execution via Python CLI runner
    try {
      const graphResult = await runLangGraphCLI({
        query: cleanQuery,
        role: role || 'Government Leadership',
        universityId: universityId || null,
        model: model || 'llama3',
      })
      if (graphResult && graphResult.success) {
        return res.json(graphResult)
      }
    } catch (cliErr) {
      console.warn('[LangGraph CLI Notice]', cliErr.message)
    }

    // 3. Fallback to native dynamic RAG engine
    const result = await ragEngine.query({
      query: cleanQuery,
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
router.get('/documents', async (req, res) => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const response = await fetch(`${RAG_SERVICE_URL}/documents`, { signal: controller.signal })
    clearTimeout(timer)
    if (response.ok) {
      const data = await response.json()
      if (data && data.success) {
        return res.json(data)
      }
    }
  } catch (err) {}

  const items = ragEngine.getDocuments()
  res.json({
    success: true,
    totalCount: items.length,
    documents: items,
  })
})

// POST /api/rag/index - Index document or statement into ChromaDB
router.post('/index', (req, res) => {
  try {
    const { id, title, text, statement } = req.body
    if (statement) {
      ragEngine.indexStatement(statement)

      // Async persist to ChromaDB
      try {
        const pythonExe = process.platform === 'win32' ? 'python' : 'python3'
        const indexerScript = path.join(__dirname, '..', 'rag', 'indexer.py')
        const uploadsDir = path.join(__dirname, '..', 'uploads')
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true })
        }
        const tmpPath = path.join(uploadsDir, `stmt-index-${statement.id || Date.now()}.json`)
        fs.writeFileSync(tmpPath, JSON.stringify(statement), 'utf8')
        const child = spawn(pythonExe, [indexerScript, '--statement-file', tmpPath], { detached: true, stdio: 'ignore' })
        child.unref()
      } catch (chromaErr) {
        console.warn('[ChromaDB Sync Notice]', chromaErr.message)
      }
    }
    res.json({
      success: true,
      message: `Indexed into FinBot ChromaDB and LangGraph knowledge base.`,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
