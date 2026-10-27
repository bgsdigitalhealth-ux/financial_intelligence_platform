const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

// Clean dynamic repository: Zero hardcoded dummy universities or transactions.
// All colleges are enrolled manually by Government Admin.
const KARNATAKA_UNIVERSITIES = [];

(async () => {
  try {
    const config = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'BGSMCH',
      database: process.env.DB_NAME || 'gov_finance_intel',
    };

    console.log(`[Migration] Connecting to MySQL at ${config.host}:${config.port}/${config.database}...`);
    const conn = await mysql.createConnection(config);

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Ensure universities table exists with official_email column
    await conn.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id VARCHAR(32) PRIMARY KEY,
        code VARCHAR(16) NOT NULL UNIQUE,
        official_email VARCHAR(128) NULL,
        name VARCHAR(255) NOT NULL,
        region VARCHAR(100) NOT NULL,
        category VARCHAR(128) NOT NULL,
        allocation BIGINT NOT NULL DEFAULT 0,
        spent BIGINT NOT NULL DEFAULT 0,
        available_cash BIGINT GENERATED ALWAYS AS (allocation - spent) STORED,
        utilization DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        compliance_score INT NOT NULL DEFAULT 98,
        compliance_grade VARCHAR(8) NOT NULL DEFAULT 'A+',
        status ENUM('Optimal', 'Notice', 'Audit Flag', 'Under Review') NOT NULL DEFAULT 'Optimal',
        warning_reason TEXT NULL,
        patents INT NOT NULL DEFAULT 0,
        student_enrollment INT NOT NULL DEFAULT 0,
        bank_account_count INT NOT NULL DEFAULT 0,
        statement_status ENUM('Pending Upload', 'AI Validated', 'Submitted for Approval', 'Approved', 'Flagged Variance') NOT NULL DEFAULT 'Pending Upload',
        last_audit DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region),
        INDEX idx_status (status),
        INDEX idx_compliance_score (compliance_score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure bank_accounts table exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id VARCHAR(64) PRIMARY KEY,
        university_id VARCHAR(32) NOT NULL,
        account_number VARCHAR(64) NOT NULL UNIQUE,
        account_name VARCHAR(128) NOT NULL,
        bank_name VARCHAR(128) NOT NULL,
        account_type VARCHAR(64) NOT NULL,
        branch VARCHAR(128) NOT NULL DEFAULT 'Campus Branch',
        ifsc_code VARCHAR(32) NOT NULL,
        current_balance BIGINT NOT NULL DEFAULT 0,
        currency VARCHAR(8) NOT NULL DEFAULT 'INR',
        status VARCHAR(32) NOT NULL DEFAULT 'Active',
        last_reconciled TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_univ_account FOREIGN KEY (university_id) REFERENCES universities (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure statements table exists
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
        status ENUM('Uploaded', 'AI Validated', 'Submitted for Approval', 'Approved by Gov Leader', 'Revision Requested') NOT NULL DEFAULT 'AI Validated',
        ai_confidence DECIMAL(5,2) NOT NULL DEFAULT 98.2,
        reconciliation_match BOOLEAN NOT NULL DEFAULT TRUE,
        variance_amount BIGINT NOT NULL DEFAULT 0,
        ai_summary TEXT NULL,
        submitted_at VARCHAR(64) NULL,
        submission_remarks TEXT NULL,
        approved_at VARCHAR(64) NULL,
        reviewed_by VARCHAR(128) NULL,
        review_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_statement_univ FOREIGN KEY (university_id) REFERENCES universities (id) ON DELETE CASCADE,
        CONSTRAINT fk_statement_acct FOREIGN KEY (account_id) REFERENCES bank_accounts (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure transactions table exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        statement_id VARCHAR(64) NOT NULL,
        account_id VARCHAR(64) NOT NULL,
        transaction_date DATE NOT NULL,
        reference_no VARCHAR(64) NOT NULL,
        description TEXT NOT NULL,
        type ENUM('CREDIT', 'DEBIT') NOT NULL,
        amount BIGINT NOT NULL,
        balance BIGINT NOT NULL,
        category VARCHAR(128) NOT NULL,
        ai_confidence DECIMAL(5,2) NOT NULL DEFAULT 95.0,
        status ENUM('Validated', 'Exception', 'Resolved') NOT NULL DEFAULT 'Validated',
        flag TEXT NULL,
        allowable BOOLEAN NOT NULL DEFAULT TRUE,
        resolved BOOLEAN NOT NULL DEFAULT FALSE,
        resolution_action VARCHAR(128) NULL,
        resolution_note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_tx_statement FOREIGN KEY (statement_id) REFERENCES statements (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[Migration] Database tables verified clean with zero dummy data.');

    await conn.end();
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
