// Migration script to create and populate 'roles' and 'users' in MySQL 'gov_finance_intel'
require('dotenv').config()
const mysql = require('mysql2/promise')

async function migrateRolesAndUsers() {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'BGSMCH',
    database: process.env.DB_NAME || 'gov_finance_intel',
  }

  console.log(`[Migration] Connecting to MySQL at ${config.host}:${config.port}/${config.database}...`)
  const conn = await mysql.createConnection(config)

  try {
    // 1. Create Roles Table
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
    console.log('[Migration] Table `roles` checked/created.')

    // 2. Create Users Table
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
        CONSTRAINT fk_user_role FOREIGN KEY (primary_role_id) REFERENCES roles (id) ON DELETE CASCADE,
        INDEX idx_user_email (email),
        INDEX idx_user_role (primary_role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    console.log('[Migration] Table `users` checked/created.')

    // 3. Populate / Upsert the 3 Dynamic Roles
    const rolesData = [
      {
        id: 'gov_leader',
        role_number: 1,
        title: '1. Government Leadership',
        short_title: 'Government Leadership',
        tag: 'Department Officials (Higher Education Dept)',
        badge: 'State Leadership',
        badge_variant: 'primary',
        scope_description: 'Statewide higher education appropriations, 32 Karnataka universities comparison, quarterly grant disbursements, compliance risk map, and legislative policy simulator.',
        accent_color: '#0969da',
        icon_name: 'Landmark',
        permissions: JSON.stringify([
          'Statewide Oversight',
          '32 Universities Comparison',
          'Statutory Statement Approval',
          'Policy Allocation',
          'Fiscal Risk Alerts'
        ]),
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
        permissions: JSON.stringify([
          'Own Bank Accounts Ledger',
          'Quarterly Statement Upload',
          'AI Exception Resolution',
          'Statutory Compliance Submission',
          'Grant Allocation Tracking'
        ]),
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
        permissions: JSON.stringify([
          'User Directory & RBAC',
          'Campus ERP Gateway Sync',
          'Immutable Audit Journal',
          'Tripwire Alert Rules Engine',
          'Campus Account Directory'
        ]),
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
    console.log('[Migration] 3 Roles inserted/updated.')

    // 4. Populate / Upsert Users (Only authorized Government Admin account)
    // All college accounts are created dynamically when Government Admin adds colleges
    const usersData = [
      {
        id: 'usr-gov-01',
        email: 'sec-higheredu@karnataka.gov.in',
        password_hash: 'password123',
        name: 'Sri. G. Kumar Naik, IAS',
        primary_role_id: 'gov_leader',
        role_title: 'Principal Secretary to Government, Dept of Higher Education',
        organization: 'Department of Higher Education, Government of Karnataka',
        university_id: null,
        designation: 'Principal Secretary, IAS',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        authorized_roles: JSON.stringify(['gov_leader']),
        status: 'Active',
      },
    ]

    for (const u of usersData) {
      await conn.query(`
        INSERT INTO users (id, email, password_hash, name, primary_role_id, role_title, organization, university_id, designation, avatar_url, authorized_roles, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          primary_role_id = VALUES(primary_role_id),
          role_title = VALUES(role_title),
          organization = VALUES(organization),
          university_id = VALUES(university_id),
          designation = VALUES(designation),
          avatar_url = VALUES(avatar_url),
          authorized_roles = VALUES(authorized_roles),
          status = VALUES(status)
      `, [u.id, u.email, u.password_hash, u.name, u.primary_role_id, u.role_title, u.organization, u.university_id, u.designation, u.avatar_url, u.authorized_roles, u.status])
    }
    console.log('[Migration] Users inserted/updated.')

    const [allRoles] = await conn.query('SELECT id, title, tag FROM roles ORDER BY role_number ASC')
    console.log('[Migration] Live Roles in MySQL:', allRoles)

    const [allUsers] = await conn.query('SELECT id, email, name, role_title, primary_role_id FROM users')
    console.log('[Migration] Live Users in MySQL:', allUsers)

    console.log('[Migration] Successfully synchronized Roles and Users into MySQL!')
  } catch (err) {
    console.error('[Migration Error]', err)
  } finally {
    await conn.end()
  }
}

migrateRolesAndUsers()
