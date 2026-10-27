import pymysql
from typing import Dict, Any, List, Optional
from . import config

def get_db_connection():
    return pymysql.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def fetch_university_metrics(univ_id: Optional[str] = None, univ_name: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if univ_id:
                cursor.execute("""
                    SELECT id, code, name, region, category,
                           allocation, spent, available_cash as availableCash,
                           utilization, compliance_score as complianceScore,
                           compliance_grade as complianceGrade, status,
                           warning_reason as warningReason, patents, student_enrollment as studentEnrollment
                    FROM universities WHERE id = %s
                """, (univ_id,))
            elif univ_name:
                cursor.execute("""
                    SELECT id, code, name, region, category,
                           allocation, spent, available_cash as availableCash,
                           utilization, compliance_score as complianceScore,
                           compliance_grade as complianceGrade, status,
                           warning_reason as warningReason, patents, student_enrollment as studentEnrollment
                    FROM universities WHERE LOWER(name) LIKE %s OR LOWER(code) LIKE %s
                    LIMIT 5
                """, (f"%{univ_name.lower()}%", f"%{univ_name.lower()}%"))
            else:
                cursor.execute("""
                    SELECT id, code, name, region, category,
                           allocation, spent, available_cash as availableCash,
                           utilization, compliance_score as complianceScore,
                           compliance_grade as complianceGrade, status
                    FROM universities
                    ORDER BY allocation DESC
                """)
            return cursor.fetchall()
    finally:
        conn.close()

def fetch_bank_accounts(univ_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if univ_id:
                cursor.execute("""
                    SELECT id, university_id as universityId, account_number as accountNumber,
                           account_name as accountName, bank_name as bankName,
                           account_type as accountType, branch, ifsc_code as ifscCode,
                           current_balance as currentBalance, currency, status
                    FROM bank_accounts WHERE university_id = %s
                """, (univ_id,))
            else:
                cursor.execute("""
                    SELECT id, university_id as universityId, account_number as accountNumber,
                           account_name as accountName, bank_name as bankName,
                           account_type as accountType, branch, ifsc_code as ifscCode,
                           current_balance as currentBalance, currency, status
                    FROM bank_accounts
                    ORDER BY current_balance DESC
                    LIMIT 15
                """)
            return cursor.fetchall()
    finally:
        conn.close()

def fetch_transactions(statement_id: Optional[str] = None, exceptions_only: bool = False) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT id, statement_id as statementId, account_id as accountId,
                       transaction_date as date, reference_no as referenceNo,
                       description, type, amount, balance, category,
                       status, flag, allowable, resolved
                FROM transactions
            """
            params = []
            conditions = []
            if statement_id:
                conditions.append("statement_id = %s")
                params.append(statement_id)
            if exceptions_only:
                conditions.append("status = 'Exception'")
            
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            query += " ORDER BY transaction_date DESC LIMIT 20"
            
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
    finally:
        conn.close()

def fetch_statewide_summary() -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) as totalUniversities,
                    SUM(allocation) as totalAllocated,
                    SUM(spent) as totalDisbursed,
                    SUM(available_cash) as totalReserve,
                    ROUND(AVG(utilization), 1) as avgUtilization,
                    SUM(CASE WHEN compliance_score < 85 THEN 1 ELSE 0 END) as flaggedCount
                FROM universities
            """)
            stats = cursor.fetchone()
            
            cursor.execute("SELECT COUNT(*) as totalBankAccounts, SUM(current_balance) as totalLiquidCash FROM bank_accounts")
            acct_stats = cursor.fetchone()
            
            cursor.execute("SELECT standard_name as standard, status_badge as status, auditor_notes as note FROM compliance_standards")
            compliance = cursor.fetchall()
            
            return {
                "universities": stats,
                "accounts": acct_stats,
                "complianceStandards": compliance
            }
    finally:
        conn.close()
