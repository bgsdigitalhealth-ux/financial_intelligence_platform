-- GovFinanceIntel MySQL Database Schema
-- Compatible with MySQL 8.0+ and MySQL 26.10

CREATE DATABASE IF NOT EXISTS gov_finance_intel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gov_finance_intel;

-- 1. Universities Table
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_region (region),
  INDEX idx_status (status),
  INDEX idx_compliance_score (compliance_score),
  INDEX idx_official_email (official_email),
  INDEX idx_finance_email (finance_email)
) ENGINE=InnoDB;

-- 2. Bank Accounts Table
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
  last_reconciled TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_univ_account FOREIGN KEY (university_id) REFERENCES universities (id) ON DELETE CASCADE,
  INDEX idx_account_bank (bank_name),
  INDEX idx_univ_account (university_id)
) ENGINE=InnoDB;

-- 3. Statements Table (Quarterly Bank Statement Filings)
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
  CONSTRAINT fk_statement_acct FOREIGN KEY (account_id) REFERENCES bank_accounts (id) ON DELETE CASCADE,
  INDEX idx_statement_status (status),
  INDEX idx_statement_quarter (quarter)
) ENGINE=InnoDB;

-- 4. Transactions Table (Extracted Ledger Lines & AI Classification)
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
  CONSTRAINT fk_tx_statement FOREIGN KEY (statement_id) REFERENCES statements (id) ON DELETE CASCADE,
  INDEX idx_tx_statement (statement_id),
  INDEX idx_tx_status (status),
  INDEX idx_tx_category (category)
) ENGINE=InnoDB;

-- 5. Additional Reports & Domain Distributions
CREATE TABLE IF NOT EXISTS fund_domains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain_name VARCHAR(128) NOT NULL,
  allocation BIGINT NOT NULL,
  disbursed BIGINT NOT NULL,
  share_percent INT NOT NULL,
  color_code VARCHAR(16) NOT NULL
) ENGINE=InnoDB;

-- 6. Category Analysis Table
CREATE TABLE IF NOT EXISTS category_benchmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(128) NOT NULL,
  amount BIGINT NOT NULL,
  actual_percent DECIMAL(5,2) NOT NULL,
  benchmark_percent DECIMAL(5,2) NOT NULL,
  variance_status VARCHAR(32) NOT NULL DEFAULT 'Normal'
) ENGINE=InnoDB;

-- 7. AI Insights & Anomaly Detections
CREATE TABLE IF NOT EXISTS ai_insights (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  severity ENUM('High Priority', 'Warning', 'Compliance', 'Normal') NOT NULL,
  insight_type ENUM('Opportunity', 'Risk', 'Audit') NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Statutory Compliance Standards
CREATE TABLE IF NOT EXISTS compliance_standards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  standard_name VARCHAR(255) NOT NULL,
  status_badge VARCHAR(64) NOT NULL,
  compliant_institutions INT NOT NULL DEFAULT 32,
  auditor_notes TEXT NOT NULL
) ENGINE=InnoDB;

-- 9. Immutable Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  hash VARCHAR(16) NOT NULL,
  timestamp_str VARCHAR(64) NOT NULL,
  user_name VARCHAR(128) NOT NULL,
  action VARCHAR(128) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  priority_level ENUM('Normal', 'High Priority', 'Warning', 'Critical') NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_action (action),
  INDEX idx_audit_priority (priority_level)
) ENGINE=InnoDB;

-- 10. System Roles Table (3 Dynamic Operational Roles)
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
) ENGINE=InnoDB;

-- 11. Users & Identities Table (Dynamic Role-based Authentication)
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
  status ENUM('Active', 'Suspended', 'Pending', 'Pending Activation') NOT NULL DEFAULT 'Active',
  activation_token VARCHAR(255) NULL,
  activation_token_expires_at TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_role FOREIGN KEY (primary_role_id) REFERENCES roles (id) ON DELETE CASCADE,
  INDEX idx_user_email (email),
  INDEX idx_user_role (primary_role_id)
) ENGINE=InnoDB;
