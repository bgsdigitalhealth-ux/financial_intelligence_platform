require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const db = require('./models/db')
const mysqlConfig = require('./config/mysql')

const app = express()
const PORT = process.env.PORT || 5000

// Initialize MySQL asynchronously
mysqlConfig.initMySQL().then((connected) => {
  if (connected) {
    console.log('[MySQL] Engine connected and synchronized with live schema.')
  } else {
    console.log('[MySQL] Running in resilient mode. Awaiting DB credentials.')
  }
})

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Root API Directory & Health Check
app.get('/', (req, res) => {
  res.json({
    platform: 'Karnataka Department of Higher Education - University Financial Intelligence Platform',
    status: 'ONLINE',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    mysql: {
      connected: mysqlConfig.isMySQLConnected(),
      database: mysqlConfig.config.database,
      universitiesCount: db.getUniversities().length,
      bankAccountsCount: db.getBankAccounts().length,
    },
    ragArchitecture: {
      framework: 'LangGraph StateGraph + ChromaDB + Ollama + MySQL',
      serviceUrl: 'http://127.0.0.1:5001',
      vectorDb: 'ChromaDB Persistent Store',
      endpoints: ['/api/rag', '/api/rag/status', '/api/rag/query', '/api/rag/documents', '/rag'],
    },
    availableRoutes: {
      frontendApp: 'http://127.0.0.1:5173',
      health: '/api/health',
      ragPipeline: '/api/rag',
      ragStatus: '/api/rag/status',
      universities: '/api/universities',
      bankAccounts: '/api/bank-accounts',
      statements: '/api/statements',
      reports: '/api/reports',
      authRoles: '/api/auth/roles',
      authUsers: '/api/auth/users',
    },
  })
})

// Health & System Info
app.get('/api/health', (req, res) => {
  const universities = db.getUniversities()
  const accounts = db.getBankAccounts()
  const statements = db.getStatements()

  res.json({
    status: 'ONLINE',
    service: 'GovFinanceIntel Public Sector & Higher Education Financial Engine',
    timestamp: new Date().toISOString(),
    mysql: {
      connected: mysqlConfig.isMySQLConnected(),
      host: mysqlConfig.config.host,
      port: mysqlConfig.config.port,
      user: mysqlConfig.config.user,
      database: mysqlConfig.config.database,
    },
    metrics: {
      universitiesCount: universities.length,
      bankAccountsCount: accounts.length,
      statementsCount: statements.length,
      currency: 'INR (₹)',
      fipsCompliant: true,
    },
  })
})

// Mount API Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/rag', require('./routes/rag'))
app.use('/rag', require('./routes/rag'))
app.use('/api/universities', require('./routes/universities'))
app.use('/api/bank-accounts', require('./routes/bankAccounts'))
app.use('/api/statements', require('./routes/statements'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/policies', require('./routes/policies'))
app.use('/api/admin', require('./routes/admin'))

// Serve built frontend assets if present in production/deployment
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/rag') || req.path.startsWith('/uploads')) {
      return next()
    }
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      '/',
      '/api/health',
      '/api/rag',
      '/api/rag/status',
      '/api/universities',
      '/api/bank-accounts',
      '/api/statements',
      '/api/reports',
      '/api/auth/roles',
      '/api/auth/users',
    ],
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err)
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error occurred',
  })
})

// Start Server on all interfaces (0.0.0.0) so localhost and 127.0.0.1 both work
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`)
  console.log(`GovFinanceIntel Dynamic Backend Server Running`)
  console.log(`URL: http://localhost:${PORT} (and http://127.0.0.1:${PORT})`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
  console.log(`RAG API: http://localhost:${PORT}/api/rag`)
  console.log(`Clean Dynamic Engine: Ready for Manual College Onboarding`)
  console.log(`=======================================================`)
})
