import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pymysql
from . import config

BACKEND_DIR = Path(__file__).resolve().parent.parent
DB_JSON_PATH = BACKEND_DIR / 'data' / 'db.json'

def load_local_db() -> Dict[str, Any]:
    """Reads disk fallback db.json safely."""
    try:
        if DB_JSON_PATH.exists():
            with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    return json.loads(content)
    except Exception as e:
        print(f"[sql_connector] Warning loading db.json: {e}")
    return {"universities": [], "bankAccounts": [], "statements": [], "policies": [], "auditLogs": []}

def get_db_connection():
    return pymysql.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
        connect_timeout=2
    )

def fetch_all_universities() -> List[Dict[str, Any]]:
    """Fetches all universities from MySQL or disk fallback."""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, code, name, region, category,
                           allocation, spent, available_cash as availableCash,
                           utilization, compliance_score as complianceScore,
                           compliance_grade as complianceGrade, status,
                           warning_reason as warningReason, patents, student_enrollment as studentEnrollment
                    FROM universities
                    ORDER BY name ASC
                """)
                rows = cursor.fetchall()
                if rows:
                    return rows
        finally:
            conn.close()
    except Exception:
        pass

    # Disk Fallback
    local_data = load_local_db()
    univs = local_data.get('universities', [])
    return [
        {
            "id": u.get('id'),
            "code": u.get('code'),
            "name": u.get('name'),
            "region": u.get('region', 'Karnataka'),
            "category": u.get('category', 'State Public University'),
            "allocation": float(u.get('allocation', 0)),
            "spent": float(u.get('spent', 0)),
            "availableCash": float(u.get('availableCash', 0)),
            "utilization": float(u.get('utilization', 0)),
            "complianceScore": int(u.get('complianceScore', 95)),
            "complianceGrade": u.get('complianceGrade', 'A+'),
            "status": u.get('status', 'Optimal'),
            "warningReason": u.get('warningReason', ''),
            "patents": int(u.get('patents', 0)),
            "studentEnrollment": int(u.get('studentEnrollment', 0))
        }
        for u in univs
    ]

def fetch_university_metrics(univ_id: Optional[str] = None, univ_name: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
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
                        FROM universities WHERE id = %s OR code = %s
                    """, (univ_id, univ_id))
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
                rows = cursor.fetchall()
                if rows:
                    return rows
        finally:
            conn.close()
    except Exception:
        pass

    # Disk fallback from db.json
    all_univs = fetch_all_universities()
    if univ_id:
        return [u for u in all_univs if u['id'] == univ_id or u['code'] == univ_id]
    if univ_name:
        q = univ_name.lower()
        return [u for u in all_univs if q in u['name'].lower() or q in u['code'].lower()][:5]
    return all_univs

def fetch_bank_accounts(univ_id: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
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
                rows = cursor.fetchall()
                if rows:
                    return rows
        finally:
            conn.close()
    except Exception:
        pass

    # Disk fallback
    local_data = load_local_db()
    accounts = local_data.get('bankAccounts', [])
    if univ_id:
        accounts = [a for a in accounts if a.get('universityId') == univ_id]

    return [
        {
            "id": a.get('id'),
            "universityId": a.get('universityId'),
            "accountNumber": a.get('accountNumber'),
            "accountName": a.get('accountName'),
            "bankName": a.get('bankName'),
            "accountType": a.get('accountType', 'Treasury Escrow'),
            "branch": a.get('branch', 'Main Branch'),
            "ifscCode": a.get('ifscCode', 'CNRB0001001'),
            "currentBalance": float(a.get('currentBalance', 0)),
            "currency": a.get('currency', 'INR'),
            "status": a.get('status', 'Active')
        }
        for a in accounts
    ]

def fetch_transactions(statement_id: Optional[str] = None, exceptions_only: bool = False) -> List[Dict[str, Any]]:
    try:
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
                rows = cursor.fetchall()
                if rows:
                    return rows
        finally:
            conn.close()
    except Exception:
        pass

    # Disk fallback: extract transactions from statements in db.json
    local_data = load_local_db()
    all_txs = []
    for stmt in local_data.get('statements', []):
        if statement_id and stmt.get('id') != statement_id:
            continue
        for tx in stmt.get('transactions', []):
            if exceptions_only and tx.get('status') != 'Exception':
                continue
            all_txs.append({
                "id": tx.get('id'),
                "statementId": stmt.get('id'),
                "accountId": stmt.get('accountId'),
                "date": tx.get('date'),
                "referenceNo": tx.get('referenceNo'),
                "description": tx.get('description'),
                "type": tx.get('type', 'DEBIT'),
                "amount": float(tx.get('amount', 0)),
                "balance": float(tx.get('balance', 0)),
                "category": tx.get('category', 'General Operating'),
                "status": tx.get('status', 'Validated'),
                "flag": tx.get('flag', ''),
                "allowable": tx.get('allowable', True),
                "resolved": tx.get('resolved', False)
            })
    return all_txs[:20]

def fetch_statewide_summary() -> Dict[str, Any]:
    try:
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
                
                if stats and stats.get('totalUniversities', 0) > 0:
                    return {
                        "universities": stats,
                        "accounts": acct_stats,
                        "complianceStandards": compliance
                    }
        finally:
            conn.close()
    except Exception:
        pass

    # Disk fallback
    local_data = load_local_db()
    univs = local_data.get('universities', [])
    accts = local_data.get('bankAccounts', [])

    total_univ = len(univs)
    total_alloc = sum(float(u.get('allocation', 0)) for u in univs)
    total_spent = sum(float(u.get('spent', 0)) for u in univs)
    total_reserve = sum(float(u.get('availableCash', 0)) for u in univs)
    avg_util = round(sum(float(u.get('utilization', 0)) for u in univs) / total_univ, 1) if total_univ > 0 else 0.0
    flagged = sum(1 for u in univs if int(u.get('complianceScore', 95)) < 85)

    return {
        "universities": {
            "totalUniversities": total_univ,
            "totalAllocated": total_alloc,
            "totalDisbursed": total_spent,
            "totalReserve": total_reserve,
            "avgUtilization": avg_util,
            "flaggedCount": flagged
        },
        "accounts": {
            "totalBankAccounts": len(accts),
            "totalLiquidCash": sum(float(a.get('currentBalance', 0)) for a in accts)
        },
        "complianceStandards": []
    }
