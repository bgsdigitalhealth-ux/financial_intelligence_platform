const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const mysqlConfig = require('../config/mysql')
const db = require('../models/db')

// Helper to safe-parse JSON
function safeParse(val, fallback = []) {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

// GET /api/auth/roles - Dynamic roles loaded from MySQL
router.get('/roles', async (req, res) => {
  try {
    const pool = await mysqlConfig.getPool()
    const [rows] = await pool.query(`
      SELECT id, role_number AS roleNumber, title, short_title AS shortTitle,
             tag, badge, badge_variant AS badgeVariant,
             scope_description AS scopeDescription,
             accent_color AS accentColor, icon_name AS iconName,
             permissions
      FROM roles
      ORDER BY role_number ASC
    `)

    const roles = rows.map((r) => ({
      ...r,
      permissions: safeParse(r.permissions, []),
    }))

    res.json({
      success: true,
      count: roles.length,
      roles,
    })
  } catch (err) {
    console.error('Error fetching roles from MySQL:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/auth/users - Dynamic user accounts loaded from MySQL
router.get('/users', async (req, res) => {
  try {
    const pool = await mysqlConfig.getPool()
    const [rows] = await pool.query(`
      SELECT u.id, u.email, u.name, u.primary_role_id AS primaryRole,
             u.role_title AS roleTitle, u.organization, u.university_id AS universityId,
             u.designation, u.avatar_url AS avatar, u.authorized_roles AS authorizedRoles,
             u.status, u.activation_token AS activationToken, u.last_login AS lastLogin,
             r.title AS roleFullTitle, r.badge, r.badge_variant AS badgeVariant,
             r.tag AS roleTag, r.accent_color AS accentColor, r.icon_name AS iconName
      FROM users u
      LEFT JOIN roles r ON u.primary_role_id = r.id
      ORDER BY u.created_at ASC
    `)

    const users = rows.map((u) => ({
      ...u,
      authorizedRoles: safeParse(u.authorizedRoles, [u.primaryRole]),
    }))

    res.json({
      success: true,
      count: users.length,
      users,
    })
  } catch (err) {
    console.error('Error fetching users from MySQL:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/auth/activate - Activate invited College Finance user account
router.post('/activate', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Both the activation token and a new password are required.',
      })
    }

    if (password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      })
    }

    const pool = await mysqlConfig.getPool()
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.name, u.primary_role_id, u.role_title, u.organization,
              u.university_id, u.designation, u.avatar_url, u.authorized_roles, u.status,
              u.activation_token_expires_at
       FROM users u
       WHERE u.activation_token = ?
       LIMIT 1`,
      [token.trim()]
    )

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired activation token. Please request assistance from the Government Administrator.',
      })
    }

    const user = users[0]

    if (user.activation_token_expires_at && new Date() > new Date(user.activation_token_expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This activation token has expired. Please contact the Government Administrator to generate a new activation link.',
      })
    }

    // Secure password hashing
    const passwordHash = await bcrypt.hash(password.trim(), 10)

    // Activate the user
    await pool.query(
      `UPDATE users 
       SET password_hash = ?, status = 'Active', activation_token = NULL, activation_token_expires_at = NULL, last_login = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, user.id]
    )

    db.addAuditLog({
      action: 'USER_ACTIVATION_SUCCESS',
      details: `User ${user.name} (${user.email}) activated account and established secure password.`,
      user: user.name,
      level: 'High Priority',
    })

    const authorizedRoles = safeParse(user.authorized_roles, [user.primary_role_id])

    res.json({
      success: true,
      message: 'Account activated successfully. You can now log in using your registered finance email and password.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        primaryRole: user.primary_role_id,
        roleTitle: user.role_title,
        organization: user.organization,
        universityId: user.university_id,
        designation: user.designation,
        avatar: user.avatar_url,
        authorizedRoles,
      },
    })
  } catch (err) {
    console.error('Error during activation:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/auth/activation-info/:email - Retrieve activation status for an email (for Government Admin)
router.get('/activation-info/:email', async (req, res) => {
  try {
    const { email } = req.params
    const pool = await mysqlConfig.getPool()
    const [rows] = await pool.query(
      `SELECT id, email, name, status, activation_token, activation_token_expires_at, primary_role_id, university_id
       FROM users
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email.trim()]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found in registry.' })
    }

    const user = rows[0]
    res.json({
      success: true,
      email: user.email,
      name: user.name,
      status: user.status,
      isPendingActivation: user.status === 'Pending Activation',
      activationToken: user.activation_token,
      expiresAt: user.activation_token_expires_at,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/auth/login - Dynamic database credential authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Both email address and password are required.',
      })
    }

    const pool = await mysqlConfig.getPool()
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.name, u.primary_role_id,
              u.role_title, u.organization, u.university_id,
              u.designation, u.avatar_url, u.authorized_roles, u.status
       FROM users u
       WHERE LOWER(u.email) = LOWER(?)
       LIMIT 1`,
      [email.trim()]
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User identity not found in Karnataka Registry.',
      })
    }

    const userRow = users[0]

    // Check account status
    if (userRow.status === 'Pending Activation') {
      return res.status(403).json({
        success: false,
        error: 'Your finance account is pending activation. Please use your activation token/link to establish your password before logging in.',
        isPendingActivation: true,
      })
    }

    if (userRow.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: `Your account is currently ${userRow.status}. Please contact the Government Administrator.`,
      })
    }

    // Verify password against secure bcrypt hash stored in MySQL
    let isMatch = false
    if (userRow.password_hash.startsWith('$2a$') || userRow.password_hash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password.trim(), userRow.password_hash)
    } else {
      // Legacy transition check
      isMatch = (userRow.password_hash === password.trim())
      if (isMatch) {
        // Upgrade plaintext to secure bcrypt hash in database
        const upgradedHash = await bcrypt.hash(password.trim(), 10)
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [upgradedHash, userRow.id])
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Incorrect password provided.',
      })
    }

    // Update last login in MySQL
    await pool.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
      [userRow.id]
    )

    // Fetch full role details
    const [roleRows] = await pool.query(
      `SELECT id, role_number, title, short_title, tag, badge, badge_variant,
              scope_description, accent_color, icon_name, permissions
       FROM roles WHERE id = ?`,
      [userRow.primary_role_id]
    )

    const roleDetails = roleRows[0] || null
    const authorizedRoles = safeParse(userRow.authorized_roles, [userRow.primary_role_id])

    // Log in audit log
    db.addAuditLog({
      action: 'USER_LOGIN_SUCCESS',
      details: `User ${userRow.name} (${userRow.email}) authenticated for role: ${userRow.primary_role_id}`,
      user: userRow.name,
      level: 'Normal',
    })

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        primaryRole: userRow.primary_role_id,
        roleTitle: userRow.role_title,
        organization: userRow.organization,
        universityId: userRow.university_id,
        designation: userRow.designation,
        avatar: userRow.avatar_url,
        authorizedRoles,
        badge: roleDetails?.badge || 'Staff',
        badgeVariant: roleDetails?.badge_variant || 'primary',
        role: roleDetails ? {
          ...roleDetails,
          permissions: safeParse(roleDetails.permissions, []),
        } : null,
      },
    })
  } catch (err) {
    console.error('Error during login:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/auth/select-role - Verify role authorization
router.post('/select-role', async (req, res) => {
  try {
    const { userId, roleKey } = req.body

    if (!userId || !roleKey) {
      return res.status(400).json({ success: false, error: 'User ID and Role Key are required.' })
    }

    const pool = await mysqlConfig.getPool()
    const [users] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userId])

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User record not found.' })
    }

    const user = users[0]
    const authorizedRoles = safeParse(user.authorized_roles, [user.primary_role_id])

    if (!authorizedRoles.includes(roleKey)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Your identity is not authorized for role '${roleKey}'.`,
      })
    }

    const [roleRows] = await pool.query(`SELECT * FROM roles WHERE id = ?`, [roleKey])
    const role = roleRows[0] || null

    res.json({
      success: true,
      roleKey,
      role: role ? {
        ...role,
        permissions: safeParse(role.permissions, []),
      } : null,
    })
  } catch (err) {
    console.error('Error selecting role:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
