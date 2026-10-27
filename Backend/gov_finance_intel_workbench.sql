-- ========================================================
-- GovFinanceIntel MySQL Workbench Complete Database Script
-- Database: gov_finance_intel | Host: 127.0.0.1:3306
-- Clean Production Engine - Zero Dummy Colleges / Accounts / Transactions
-- All colleges are enrolled manually by Government Admin
-- ========================================================

CREATE DATABASE IF NOT EXISTS `gov_finance_intel` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gov_finance_intel`;

-- --------------------------------------------------------
-- Schema: Tables, Foreign Keys, Indexes and Constraints
-- --------------------------------------------------------

-- 1. Universities Table (Enrolled Manually by Government Admin)
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
  region VARCHAR(100) NOT NULL DEFAULT 'Bengaluru Central',
  category VARCHAR(128) NOT NULL DEFAULT 'State University',
  allocation BIGINT NOT NULL DEFAULT 0,
  spent BIGINT NOT NULL DEFAULT 0,
  available_cash BIGINT GENERATED ALWAYS AS (allocation - spent) STORED,
  utilization DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  compliance_score INT NOT NULL DEFAULT 98,
  compliance_grade VARCHAR(8) NOT NULL DEFAULT 'A+',
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

-- 2. Bank Accounts Table (Configured by College Finance)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(64) PRIMARY KEY,
  university_id VARCHAR(32) NOT NULL,
  account_number VARCHAR(64) NOT NULL UNIQUE,
  account_name VARCHAR(128) NOT NULL,
  account_holder_name VARCHAR(128) NULL,
  bank_name VARCHAR(128) NOT NULL,
  account_type VARCHAR(64) NOT NULL,
  branch VARCHAR(128) NOT NULL DEFAULT 'Campus Branch',
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
  compliant_institutions INT NOT NULL DEFAULT 0,
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

-- ========================================================
-- Core Production Master Data (No Dummy Colleges or Accounts)
-- ========================================================

-- Table: roles (3 dynamic operational roles)
INSERT INTO `roles` (`id`, `role_number`, `title`, `short_title`, `tag`, `badge`, `badge_variant`, `scope_description`, `accent_color`, `icon_name`, `permissions`) VALUES 
('gov_leader', 1, '1. Government Leadership', 'Government Leadership', 'Department Officials (Higher Education Dept)', 'State Leadership', 'primary', 'Statewide higher education appropriations, institution oversight, quarterly grant disbursements, compliance risk map, and legislative policy review.', '#0969da', 'Landmark', '["Statewide Oversight", "Universities Comparison", "Statutory Statement Approval", "Policy Allocation", "Fiscal Risk Alerts"]'),
('univ_finance', 2, '2. College/University Finance', 'College/University Finance', 'Finance Officer & Comptroller (University Staff)', 'University CFO', 'success', 'Institutional general ledger, bank accounts, quarterly statement upload, AI transaction validation, exception resolution, and compliance submission.', '#1a7f37', 'Building2', '["Own Bank Accounts Ledger", "Quarterly Statement Upload", "AI Exception Resolution", "Statutory Compliance Submission", "Grant Allocation Tracking"]'),
('univ_admin', 3, '3. College/University Admin', 'College/University Admin', 'Institution Administrator & Campus Registrar', 'University Admin', 'purple', 'Campus institution administration, staff & user RBAC directory, ERP gateway integration, immutable SHA-256 audit journal, and automated fiscal alert rules.', '#8250df', 'ShieldCheck', '["User Directory & RBAC", "Campus ERP Gateway Sync", "Immutable Audit Journal", "Tripwire Alert Rules Engine", "Campus Account Directory"]')
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);

-- Table: users (Only authorized Government Admin account)
-- All College Admin and College Finance accounts are dynamically created when Government Admin registers colleges
INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `primary_role_id`, `role_title`, `organization`, `university_id`, `designation`, `avatar_url`, `authorized_roles`, `status`, `last_login`) VALUES 
('usr-gov-01', 'sec-higheredu@karnataka.gov.in', 'password123', 'Sri. G. Kumar Naik, IAS', 'gov_leader', 'Principal Secretary to Government, Dept of Higher Education', 'Department of Higher Education, Government of Karnataka', NULL, 'Principal Secretary, IAS', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '["gov_leader"]', 'Active', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);

-- Reference Standards
INSERT INTO `compliance_standards` (`id`, `standard_name`, `status_badge`, `compliant_institutions`, `auditor_notes`) VALUES 
(1, 'GASB Statement No. 34 (Full Accrual Net Position)', 'Certified 100%', 0, 'General ledger accrual verified against treasury accounts'),
(2, '2 CFR 200 Allowable Direct Cost Guidelines', 'Standard Verified', 0, 'Higher Education procurement and expenditure principles'),
(3, 'Karnataka State Universities Act 2000 §102', 'Statutory Return Mandate', 0, 'Quarterly financial returns requirement'),
(4, 'Statutory 90-Day Liquidity Covenant', 'Fully Solvent', 0, 'Treasury balance operational floor requirement')
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);

-- Initial Audit Log
INSERT INTO `audit_logs` (`id`, `hash`, `timestamp_str`, `user_name`, `action`, `details`, `ip_address`, `priority_level`) VALUES 
('audit-init-001', '62dcd28', '2026-10-26 09:00:00 UTC', 'System Administrator', 'SYSTEM_INITIALIZED', 'Government Financial Intelligence Platform initialized with zero dummy records. Ready for manual college onboarding.', '127.0.0.1', 'Normal')
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);
