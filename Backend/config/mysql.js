const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const isRemote = (process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost')

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gov_finance_intel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {})
}

let pool = null
let isConnected = false

async function getPool() {
  if (pool) return pool
  pool = mysql.createPool(DB_CONFIG)
  return pool
}

// Initialize MySQL schema and seed data
async function initMySQL(seedData) {
  try {
    // 1. Connect without database to ensure database exists (local only)
    if (!isRemote) {
      try {
        const rootConn = await mysql.createConnection({
          host: DB_CONFIG.host,
          port: DB_CONFIG.port,
          user: DB_CONFIG.user,
          password: DB_CONFIG.password,
        })
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
        await rootConn.end()
      } catch (e) {
        console.warn('[MySQL] Notice during root DB check:', e.message)
      }
    }

    // 2. Connect to the database and initialize tables
    const dbPool = await getPool()
    const conn = await dbPool.getConnection()

    console.log(`[MySQL] Connected successfully to ${DB_CONFIG.user}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`)
    isConnected = true

    // Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id VARCHAR(32) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        institution_type VARCHAR(128) NOT NULL DEFAULT 'State Public University',
        official_email VARCHAR(128) NOT NULL,
        finance_email VARCHAR(128) NOT NULL,
        state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
        district VARCHAR(100) NULL,
        address TEXT NULL,
        affiliated_university VARCHAR(255) NULL,
        region VARCHAR(64) NOT NULL DEFAULT 'Bengaluru Central',
        category VARCHAR(128) NOT NULL DEFAULT 'State University',
        allocation BIGINT NOT NULL DEFAULT 0,
        spent BIGINT NOT NULL DEFAULT 0,
        available_cash BIGINT GENERATED ALWAYS AS (allocation - spent) STORED,
        utilization DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        compliance_score INT NOT NULL DEFAULT 90,
        compliance_grade VARCHAR(8) NOT NULL DEFAULT 'A',
        status VARCHAR(64) NOT NULL DEFAULT 'Optimal',
        warning_reason TEXT NULL,
        patents INT NOT NULL DEFAULT 0,
        student_enrollment INT NOT NULL DEFAULT 0,
        bank_account_count INT NOT NULL DEFAULT 0,
        statement_status VARCHAR(64) NOT NULL DEFAULT 'Pending Upload',
        last_audit DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id VARCHAR(64) PRIMARY KEY,
        university_id VARCHAR(32) NOT NULL,
        account_number VARCHAR(64) NOT NULL UNIQUE,
        account_name VARCHAR(128) NOT NULL,
        account_holder_name VARCHAR(128) NULL,
        bank_name VARCHAR(128) NOT NULL,
        account_type VARCHAR(64) NOT NULL,
        branch VARCHAR(128) NOT NULL DEFAULT 'State Capital Branch',
        ifsc_code VARCHAR(32) NOT NULL,
        current_balance BIGINT NOT NULL DEFAULT 0,
        currency VARCHAR(8) NOT NULL DEFAULT 'INR',
        status VARCHAR(32) NOT NULL DEFAULT 'Active',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS statements (
        id VARCHAR(64) PRIMARY KEY,
        university_id VARCHAR(32) NOT NULL,
        university_name VARCHAR(255) NOT NULL,
        account_id VARCHAR(64) NOT NULL,
        account_number VARCHAR(64) NOT NULL,
        account_name VARCHAR(128) NOT NULL,
        bank_name VARCHAR(128) NOT NULL,
        quarter VARCHAR(64) NOT NULL,
        financial_year VARCHAR(32) NOT NULL DEFAULT '2025-2026',
        file_name VARCHAR(255) NOT NULL,
        file_size VARCHAR(32) NOT NULL DEFAULT '450 KB',
        uploaded_at VARCHAR(64) NOT NULL,
        uploaded_by VARCHAR(128) NOT NULL,
        total_debits BIGINT NOT NULL DEFAULT 0,
        total_credits BIGINT NOT NULL DEFAULT 0,
        opening_balance BIGINT NOT NULL DEFAULT 0,
        closing_balance BIGINT NOT NULL DEFAULT 0,
        status VARCHAR(64) NOT NULL DEFAULT 'AI Validated',
        ai_confidence DECIMAL(5,2) NOT NULL DEFAULT 98.2,
        reconciliation_match BOOLEAN NOT NULL DEFAULT TRUE,
        variance_amount BIGINT NOT NULL DEFAULT 0,
        ai_summary TEXT NULL,
        submitted_at VARCHAR(64) NULL,
        submission_remarks TEXT NULL,
        approved_at VARCHAR(64) NULL,
        reviewed_by VARCHAR(128) NULL,
        review_notes TEXT NULL,
        raw_transactions JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        hash VARCHAR(16) NOT NULL,
        timestamp_str VARCHAR(64) NOT NULL,
        user_name VARCHAR(128) NOT NULL,
        action VARCHAR(128) NOT NULL,
        details TEXT NOT NULL,
        ip_address VARCHAR(64) NOT NULL,
        priority_level VARCHAR(32) NOT NULL DEFAULT 'Normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `)

    // Ensure official_email column exists in universities and column sizes are safe
    try {
      await conn.query(`
        ALTER TABLE universities ADD COLUMN IF NOT EXISTS official_email VARCHAR(128) NULL AFTER code;
      `)
      await conn.query(`ALTER TABLE audit_logs MODIFY COLUMN priority_level VARCHAR(64) NOT NULL DEFAULT 'Normal';`)
      await conn.query(`ALTER TABLE universities MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'Optimal';`)
      await conn.query(`ALTER TABLE universities MODIFY COLUMN statement_status VARCHAR(64) NOT NULL DEFAULT 'Pending Upload';`)
      await conn.query(`ALTER TABLE universities MODIFY COLUMN code VARCHAR(64) NOT NULL;`)
      await conn.query(`ALTER TABLE users MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'Active';`)
    } catch {
      // Ignore if exists
    }

    // Ensure Roles exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(32) PRIMARY KEY,
        role_number INT NOT NULL,
        title VARCHAR(128) NOT NULL,
        short_title VARCHAR(64) NOT NULL,
        tag VARCHAR(128) NOT NULL,
        badge VARCHAR(64) NOT NULL,
        badge_variant VARCHAR(32) NOT NULL DEFAULT 'primary',
        scope_description TEXT NOT NULL,
        accent_color VARCHAR(16) NOT NULL,
        icon_name VARCHAR(32) NOT NULL,
        permissions JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(128) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(128) NOT NULL,
        primary_role_id VARCHAR(32) NOT NULL,
        role_title VARCHAR(128) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        university_id VARCHAR(32) NULL,
        designation VARCHAR(128) NOT NULL,
        avatar_url VARCHAR(255) NOT NULL,
        authorized_roles JSON NOT NULL,
        status ENUM('Active', 'Suspended', 'Pending') NOT NULL DEFAULT 'Active',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_email (email),
        INDEX idx_user_role (primary_role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id VARCHAR(64) PRIMARY KEY,
        policy_code VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(128) NOT NULL,
        scope VARCHAR(128) NOT NULL DEFAULT 'All Colleges',
        directive TEXT NOT NULL,
        threshold_value VARCHAR(128) NULL,
        effective_date DATE NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Seed baseline government statutory policies if empty
    const [existingPolicies] = await conn.query('SELECT COUNT(*) as count FROM policies')
    if (existingPolicies[0].count === 0) {
      await conn.query(`
        INSERT INTO policies (id, policy_code, title, category, scope, directive, threshold_value, effective_date, status)
        VALUES 
        ('pol-01', 'POL-KA-2026-01', 'K.S.U. Act 2000 Quarterly Statement Filing & Reconciliation', 'Statutory Compliance', 'All Colleges', 'All affiliated and state universities must submit quarterly statements and reconcile unmapped vouchers within 30 days of quarter end.', '100% vouchers reconciled', '2026-04-01', 'Active'),
        ('pol-02', 'POL-KA-2026-02', 'Allowable Cost Guidelines & Grant Encumbrance Ceiling', 'Grant Utilization', 'All Colleges', 'Disbursements from state appropriations must strictly follow approved budget heads. Inter-fund variances exceeding 5% require prior Department approval.', 'Max 5% variance', '2026-04-01', 'Active')
      `)
    }

    // Upsert baseline roles
    const rolesData = [
      {
        id: 'gov_leader',
        role_number: 1,
        title: '1. Government Admin',
        short_title: 'Government Admin',
        tag: 'Department Officials (Higher Education Dept)',
        badge: 'Government Admin (View Only)',
        badge_variant: 'primary',
        scope_description: 'Statewide higher education oversight, view-only progress tracking of all Karnataka colleges, comprehensive reports, multi-bank treasury, and statutory audit monitoring.',
        accent_color: '#0969da',
        icon_name: 'Landmark',
        permissions: JSON.stringify(['Statewide Oversight', 'Colleges Progress Tracking', 'Statutory Statement Approval', 'Policy Allocation', 'Fiscal Risk Alerts']),
      },
      {
        id: 'univ_finance',
        role_number: 2,
        title: '2. College/University Finance',
        short_title: 'College/University Finance',
        tag: 'Finance Officer & Comptroller (University Staff)',
        badge: 'University CFO',
        badge_variant: 'success',
        scope_description: 'Institutional general ledger, bank accounts, quarterly statement upload, AI transaction validation, exception resolution, and compliance submission.',
        accent_color: '#1a7f37',
        icon_name: 'Building2',
        permissions: JSON.stringify(['Own Bank Accounts Ledger', 'Quarterly Statement Upload', 'AI Exception Resolution', 'Statutory Compliance Submission', 'Grant Allocation Tracking']),
      },
      {
        id: 'univ_admin',
        role_number: 3,
        title: '3. College/University Admin',
        short_title: 'College/University Admin',
        tag: 'Institution Administrator & Campus Registrar',
        badge: 'University Admin',
        badge_variant: 'purple',
        scope_description: 'Campus institution administration, staff & user RBAC directory, ERP gateway integration (Banner/SAP/Tally), immutable SHA-256 audit journal, and automated fiscal alert rules.',
        accent_color: '#8250df',
        icon_name: 'ShieldCheck',
        permissions: JSON.stringify(['User Directory & RBAC', 'Campus ERP Gateway Sync', 'Immutable Audit Journal', 'Tripwire Alert Rules Engine', 'Campus Account Directory']),
      },
    ]

    for (const r of rolesData) {
      await conn.query(`
        INSERT INTO roles (id, role_number, title, short_title, tag, badge, badge_variant, scope_description, accent_color, icon_name, permissions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          role_number = VALUES(role_number),
          title = VALUES(title),
          short_title = VALUES(short_title),
          tag = VALUES(tag),
          badge = VALUES(badge),
          badge_variant = VALUES(badge_variant),
          scope_description = VALUES(scope_description),
          accent_color = VALUES(accent_color),
          icon_name = VALUES(icon_name),
          permissions = VALUES(permissions)
      `, [r.id, r.role_number, r.title, r.short_title, r.tag, r.badge, r.badge_variant, r.scope_description, r.accent_color, r.icon_name, r.permissions])
    }

    // Ensure Government Admin user exists
    await conn.query(`
      INSERT INTO users (id, email, password_hash, name, primary_role_id, role_title, organization, university_id, designation, avatar_url, authorized_roles, status)
      VALUES (
        'usr-gov-01',
        'sec-higheredu@karnataka.gov.in',
        'password123',
        'Sri. G. Kumar Naik, IAS',
        'gov_leader',
        'Principal Secretary to Government, Dept of Higher Education',
        'Department of Higher Education, Government of Karnataka',
        NULL,
        'Principal Secretary, IAS',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        JSON_ARRAY('gov_leader'),
        'Active'
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        primary_role_id = VALUES(primary_role_id),
        role_title = VALUES(role_title),
        status = 'Active';
    `)

    console.log('[MySQL] Pure dynamic database schema synchronized. Zero dummy colleges or transactions seeded.')

    conn.release()
    return true
  } catch (err) {
    console.error('[MySQL] Initialization Error:', err.message)
    isConnected = false
    return false
  }
}

module.exports = {
  getPool,
  initMySQL,
  isMySQLConnected: () => isConnected,
  config: DB_CONFIG,
}
