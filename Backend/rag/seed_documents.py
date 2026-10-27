"""
Document Ingestion & Indexing Pipeline for ChromaDB Vector Database
Processes Data Sources (Policies, Guidelines, SOPs, Circulars, Financial Statements)
Extracts, chunks, metadata-tags, and indexes into ChromaDB.
"""
from typing import List, Dict, Any
from .chroma_store import store

KNOWLEDGE_DOCUMENTS: List[Dict[str, Any]] = [
    # 1. Karnataka State Universities Act 2000
    {
        "id": "doc-ksu-act-sec47",
        "text": """
Karnataka State Universities Act, 2000 - Section 47: Maintenance of Accounts and Audit.
(1) The annual accounts and balance sheet of the university shall be prepared under the direction of the Finance Officer and shall be submitted to the State Government after approval by the Syndicate.
(2) The accounts of the university shall be audited at least once in each financial year by the Comptroller and Auditor General (CAG) of India or by the Controller of State Accounts Department.
(3) The audited accounts along with the audit report and university remarks shall be laid before each House of the State Legislature.
(4) Any expenditure incurred exceeding 5% of the sanctioned budgetary head without prior sanction of the Finance Committee and Syndicate shall be deemed unauthorized and flagged in the compliance risk map.
        """,
        "metadata": {
            "title": "KSU Act 2000 - Section 47 (Accounts & Audit)",
            "doc_type": "Statutory Act",
            "source": "Government of Karnataka Gazette (Act No. 29 of 2001)",
            "section": "Section 47",
            "regulatory_body": "Karnataka State Legislature",
            "keywords": "accounts, audit, finance committee, syndicate, cag, legislature"
        }
    },
    {
        "id": "doc-ksu-act-sec48",
        "text": """
Karnataka State Universities Act, 2000 - Section 48: Financial Powers & Comptroller Duties.
The Finance Officer (Comptroller) of the university shall:
(a) Exercise general supervision over the funds of the university and advise the Vice-Chancellor on financial policy.
(b) Ensure that no expenditure is incurred unless provision for the same exists in the budget approved by the Syndicate.
(c) Reconcile all bank statements across operational, research, and capital accounts on a quarterly basis within 30 days of the quarter ending.
(d) Report to the State Higher Education Department any variance exceeding INR 10 Lakhs or recurring duplicate wire transactions immediately upon detection.
        """,
        "metadata": {
            "title": "KSU Act 2000 - Section 48 (Finance Officer Mandate)",
            "doc_type": "Statutory Act",
            "source": "Government of Karnataka Gazette",
            "section": "Section 48",
            "regulatory_body": "Karnataka State Legislature",
            "keywords": "finance officer, comptroller, duties, bank reconciliation, quarterly statement"
        }
    },

    # 2. General Financial Rules & Allowable / Unallowable Expenses
    {
        "id": "doc-kgfr-unallowable-expenses",
        "text": """
Karnataka Higher Education Department Financial Rules: Allowable vs Non-Allowable Expenditures (KGFR Chapter 8).
Rule 8.4: Capital Grants and State Higher Education Appropriations.
(a) Allowable Expenditures:
- Faculty, researcher, and academic staff payroll and statutory pensions.
- Laboratory equipment procurement, cleanroom nanofabrication tooling, maintenance contracts.
- Digitization, high-performance campus compute clusters, library journals, and e-learning resources.
- Student merit-cum-means scholarships disbursed via PFMS / DBT direct bank transfer.
(b) Non-Allowable (Disallowed) Expenditures:
- Executive luxury hospitality suites, 5-star hotel bookings, and non-sanctioned travel vouchers.
- Personal hospitality, unapproved conference banquets exceeding statutory per-diem rates.
- Re-appropriation of research trust funds for administrative overheads without Syndicate clearance.
Any unallowable voucher flagged by AI automated classification must be frozen and resolved before quarterly submission.
        """,
        "metadata": {
            "title": "KGFR Chapter 8: Allowable & Unallowable Academic Expenditures",
            "doc_type": "Financial Directive",
            "source": "Karnataka Department of Higher Education Policy Handbook",
            "section": "Rule 8.4",
            "regulatory_body": "Department of Higher Education, Govt of Karnataka",
            "keywords": "allowable, unallowable, hospitality, travel voucher, payroll, lab equipment"
        }
    },

    # 3. UGC 12(B) & Central DBT/PFMS Directives
    {
        "id": "doc-ugc-12b-pfms-norms",
        "text": """
University Grants Commission (UGC) Section 12(B) & Public Financial Management System (PFMS) Integration Directives.
1. Eligibility for Central / State Matching Grants:
Only state universities certified under Section 12(B) of the UGC Act 1956 and linked with PFMS portal are eligible for RUSA and State Higher Education Council milestone tranches.
2. Zero Balance Subsidiary Accounts (ZBSA):
All state universities must maintain designated subsidiary bank accounts with scheduled commercial banks (Canara Bank, State Bank of India, Bank of Baroda).
3. Quarterly Bank Reconciliation:
Universities must upload bank statements in PDF/CSV/XLSX format to the State Financial Intelligence Platform every quarter. Closing balances must match ledger balances within 0.05% tolerance limit.
        """,
        "metadata": {
            "title": "UGC Section 12(B) & PFMS Grant Utilization Directives",
            "doc_type": "Regulatory Compliance",
            "source": "UGC & Ministry of Education, Govt of India",
            "section": "Circular 12B/PFMS-2025",
            "regulatory_body": "UGC / PFMS Karnataka",
            "keywords": "ugc 12b, pfms, zbsa, canara bank, sbi, quarterly filing, tolerance"
        }
    },

    # 4. University SOPs - Visvesvaraya Technological University (VTU) Belagavi
    {
        "id": "doc-sop-vtu-accounts",
        "text": """
Visvesvaraya Technological University (VTU), Belagavi - Financial Standard Operating Procedure (SOP-FIN-01).
Headquarters: Jnana Sangama Campus, Belagavi, Karnataka - 590018.
Institutional Accounts Directory:
1. Primary Operating & Faculty Payroll Account: Canara Bank, VTU Campus Branch, Belagavi (IFSC: CNRB0001001, A/C: 100102938401). Handles monthly state grant inflows and engineering faculty payroll.
2. Sponsored Research & AI Center of Excellence Account: State Bank of India, Belagavi Main Branch (IFSC: SBIN0040001, A/C: 400109283719). Dedicated to VLSI cleanroom, robotics grants, and patent filings.
3. Examination Fee Collection & Endowment Trust: Bank of Baroda, Belagavi City (IFSC: BARB0BELAGA, A/C: 204109283741). Handles student examination fees and endowment reserves.
All cheques/RTGS above INR 5 Lakhs require dual digital signatures of the Finance Officer and the Registrar.
        """,
        "metadata": {
            "title": "VTU Belagavi Institutional Bank Accounts & Operations SOP",
            "doc_type": "University SOP",
            "source": "VTU Office of the Comptroller & Registrar, Belagavi",
            "section": "SOP-FIN-01",
            "university_id": "univ-01",
            "university_name": "Visvesvaraya Technological University, Belagavi",
            "regulatory_body": "VTU Executive Council",
            "keywords": "vtu belagavi, canara bank, sbi, bank of baroda, ifsc, payroll, research grant"
        }
    },

    # 5. University SOPs - Bangalore University, Jnana Bharathi, Bengaluru
    {
        "id": "doc-sop-bu-accounts",
        "text": """
Bangalore University, Jnana Bharathi Campus, Bengaluru - 560056.
Financial Governance & Account Structure:
1. General Fund & Administrative Account: Canara Bank, Bangalore University Branch (IFSC: CNRB0001002, A/C: 100203849102). Total State Allocation: INR 820.00 Crores.
2. Centenary Research & Postgraduate Science Fund: State Bank of India, Jnana Bharathi (IFSC: SBIN0040002, A/C: 400201928340).
3. Self-Financed Courses & Distance Education Revenue: HDFC Bank, Rajarajeshwari Nagar (IFSC: HDFC0001202, A/C: 501002938410).
Compliance Grade: A (Score: 89/100). Active student enrollment: 145,000 across 650 affiliated colleges.
        """,
        "metadata": {
            "title": "Bangalore University Institutional Accounts & Financial Structure",
            "doc_type": "University SOP",
            "source": "Bangalore University Finance Branch",
            "section": "BU-FIN-2026",
            "university_id": "univ-02",
            "university_name": "Bangalore University, Bengaluru",
            "regulatory_body": "Bangalore University Syndicate",
            "keywords": "bangalore university, jnana bharathi, canara bank, sbi, 820 crore, affiliated colleges"
        }
    },

    # 6. University of Mysore Centenary Research SOP
    {
        "id": "doc-sop-uom-mysore",
        "text": """
University of Mysore, Crawford Hall, Mysuru - 570005.
Financial Allocation & Account Matrix:
1. State Core Grant & Heritage Campus Maintenance: State Bank of India, Mysore University Branch (IFSC: SBIN0040003, A/C: 400302918273). Allocation: INR 780.00 Crores; Utilization: 91.2%.
2. Institution of Excellence (IOE) Research Grant: Canara Bank, Saraswathipuram (IFSC: CNRB0001003, A/C: 100301928374).
Compliance Grade: A+ (Score: 92/100). Total patents registered: 142.
Under Section 47 of KSU Act 2000, all research equipment purchased above INR 25 Lakhs requires third-party technical audit certification.
        """,
        "metadata": {
            "title": "University of Mysore Financial Allocation & Research Grants SOP",
            "doc_type": "University SOP",
            "source": "University of Mysore Comptroller Branch",
            "section": "UOM-FIN-03",
            "university_id": "univ-03",
            "university_name": "University of Mysore, Mysuru",
            "regulatory_body": "University of Mysore Syndicate",
            "keywords": "university of mysore, crawford hall, 780 crore, sbi, canara bank, patents, ioe"
        }
    },

    # 7. AI Anomaly Resolution & Statement Exception SOP
    {
        "id": "doc-sop-ai-exception-resolution",
        "text": """
AI Analysis & Validation Workflow: Exception Resolution Protocol.
When the AI financial intelligence engine processes a quarterly statement:
1. Duplicate Wire Transfers: Flagged when two or more transactions share identical amounts, beneficiary accounts, and dates within 72 hours (e.g. ChemBio Reagent Systems INR 4,20,000 duplicate wire).
Resolution: The Finance Officer must verify bank reversal credit advice and submit resolution code 'RESOLVED_REVERSAL_CONFIRMED'.
2. Variance Matching: If calculated closing balance differs from uploaded bank statement closing balance by more than INR 1,000, status is set to 'Flagged Variance'.
3. Unallowable Expenditure Classification: When a voucher description contains prohibited keywords (e.g., luxury suites, personal travel), it is marked 'Exception - Non-Allowable'.
The University CFO must reclassify or refund to state pool before final submission to the Government Leadership Portal.
        """,
        "metadata": {
            "title": "AI Financial Anomaly Detection & Exception Resolution Protocol",
            "doc_type": "Technical SOP",
            "source": "Karnataka Financial Intelligence Platform AI Engine",
            "section": "AI-VAL-05",
            "regulatory_body": "Dept of Higher Education AI Oversight Committee",
            "keywords": "ai validation, duplicate wire, variance matching, exception resolution, reversal"
        }
    }
]

def seed_chroma():
    print("[ChromaDB Seeder] Starting document ingestion...")
    count = store.add_documents(KNOWLEDGE_DOCUMENTS)
    print(f"[ChromaDB Seeder] Successfully ingested and indexed {count} policy, statutory, and university documents!")
    stats = store.get_stats()
    print(f"[ChromaDB Seeder] Current vector store status: {stats}")
    return stats

if __name__ == '__main__':
    seed_chroma()
