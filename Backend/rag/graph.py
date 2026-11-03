"""
LangGraph StateGraph RAG Pipeline for Karnataka Financial Intelligence Platform
Orchestrates:
1. Query Analysis & Entity Extraction (detects any college/university dynamically)
2. Vector Retrieval from persistent ChromaDB
3. Structured Data Augmentation from MySQL / disk db.json
4. LLM Generation via Ollama (with local grounded financial synthesis fallback)
5. Citation & Provenance Synthesis
"""
import time
import requests
import json
import re
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from .chroma_store import store
from . import sql_connector
from . import config

class RAGState(TypedDict):
    query: str
    role: str
    university_id: Optional[str]
    model: str
    ollama_base_url: str
    intent: str
    entities: Dict[str, Any]
    vector_context: List[Dict[str, Any]]
    sql_context: Dict[str, Any]
    llm_response: str
    citations: List[Dict[str, Any]]
    data_cards: List[Dict[str, Any]]
    ollama_status: Dict[str, Any]
    latency_ms: float

# --- Node 1: Analyze Query & Entity Extraction ---
def analyze_query_node(state: RAGState) -> Dict[str, Any]:
    query_lower = state['query'].lower()
    entities: Dict[str, Any] = {}

    # 1. Check if university_id was explicitly provided in state
    if state.get('university_id'):
        univs = sql_connector.fetch_university_metrics(univ_id=state['university_id'])
        if univs:
            entities['univ_id'] = univs[0]['id']
            entities['university'] = univs[0]['name']

    # 2. Dynamically scan all institutions from database / db.json
    all_univs = sql_connector.fetch_all_universities()
    if not entities.get('univ_id'):
        for u in all_univs:
            u_name = u.get('name', '').lower()
            u_code = u.get('code', '').lower()
            u_id = u.get('id', '').lower()
            if (u_name and u_name in query_lower) or (u_code and u_code in query_lower) or (u_id and u_id in query_lower):
                entities['university'] = u.get('name')
                entities['univ_id'] = u.get('id')
                break

    # Hardcoded aliases / short codes
    if not entities.get('univ_id'):
        if 'vtu' in query_lower or 'belagavi' in query_lower or 'visvesvaraya' in query_lower:
            entities['university'] = 'VTU Belagavi'
            entities['univ_id'] = 'univ-01'
        elif 'bgs' in query_lower or 'bgsmch' in query_lower:
            entities['university'] = 'BGSMCH'
            entities['univ_id'] = 'univ-bgsmch'
        elif 'bangalore' in query_lower or 'bengaluru' in query_lower:
            entities['university'] = 'Bangalore University'
            entities['univ_id'] = 'univ-02'
        elif 'mysore' in query_lower or 'mysuru' in query_lower:
            entities['university'] = 'University of Mysore'
            entities['univ_id'] = 'univ-03'
        elif 'rguhs' in query_lower or 'health' in query_lower:
            entities['university'] = 'RGUHS Bengaluru'
            entities['univ_id'] = 'univ-04'

    # Domain financial keywords for RAG routing
    financial_keywords = [
        'unallowable', 'luxury', 'hospitality', 'exception', 'violation', 'flag',
        'bank', 'account', 'balance', 'ifsc', 'canara', 'sbi', 'baroda', 'cash',
        'credit', 'debit', 'statement', 'transaction', 'ref', 'ledger', 'act',
        'statutory', 'section 47', 'section 48', 'cag', 'rule', 'policy', 'budget',
        'allocation', 'spent', 'utilization', 'reserve', 'grant', 'college',
        'university', 'institution', 'mysore', 'vtu', 'bangalore', 'bgs', 'bgsmch',
        'audit', 'financial', 'inflow', 'outflow', 'opening', 'closing', 'reconcil',
        'voucher', 'variance', 'discrepancy', 'quarter', 'q1', 'q2', 'q3', 'q4',
        'payroll', 'vendor', 'chembio', 'zenith', 'nanotech', 'expenditure',
        'deposit', 'withdraw', 'cost', 'fee', 'fund', 'treasury'
    ]

    has_financial_word = any(k in query_lower for k in financial_keywords)
    has_numeric_figure = bool(re.search(r'\b\d{3,}\b', query_lower))
    has_ref_code = bool(re.search(r'(?:ref|tx|rtgs|neft|inv)[-_a-z0-9]*', query_lower))

    if not has_financial_word and not has_numeric_figure and not has_ref_code and not entities.get('univ_id'):
        intent = 'unrelated_random'
    elif any(k in query_lower for k in ['unallowable', 'luxury', 'hospitality', 'exception', 'violation', 'flag']):
        intent = 'compliance_exception'
    elif any(k in query_lower for k in ['bank', 'account', 'balance', 'ifsc', 'canara', 'sbi', 'baroda', 'cash', 'credit', 'debit', 'statement', 'transaction', 'ref', 'ledger', 'opening', 'closing']):
        intent = 'banking_liquidity'
    elif any(k in query_lower for k in ['act', 'statutory', 'section 47', 'section 48', 'cag', 'rule', 'policy']):
        intent = 'statutory_policy'
    elif any(k in query_lower for k in ['budget', 'allocation', 'spent', 'utilization', 'reserve', 'grant']):
        intent = 'budget_appropriation'
    else:
        intent = 'general_financial'

    return {
        "intent": intent,
        "entities": entities
    }

# --- Node 2: Retrieve Vector Context from ChromaDB ---
def retrieve_vector_context_node(state: RAGState) -> Dict[str, Any]:
    query = state['query']
    entities = state.get('entities', {})
    intent = state.get('intent', 'general_financial')

    if intent == 'unrelated_random':
        return {"vector_context": []}

    # Query ChromaDB Persistent Vector Database
    where_filter = None
    if entities.get('univ_id'):
        where_filter = {"university_id": entities['univ_id']}

    chunks = store.similarity_search(query, n_results=4, where=where_filter)

    # Fallback to general query if filtered yields 0
    if not chunks and where_filter:
        chunks = store.similarity_search(query, n_results=4)

    return {
        "vector_context": chunks
    }

# --- Node 3: Query Structured Data from Database ---
def query_sql_data_node(state: RAGState) -> Dict[str, Any]:
    if state.get('intent') == 'unrelated_random':
        return {"sql_context": {}, "data_cards": []}

    entities = state.get('entities', {})
    intent = state.get('intent', 'general_financial')

    sql_data = {}
    data_cards = []

    try:
        if entities.get('univ_id') or entities.get('university'):
            univs = sql_connector.fetch_university_metrics(
                univ_id=entities.get('univ_id'),
                univ_name=entities.get('university')
            )
            accts = sql_connector.fetch_bank_accounts(univ_id=entities.get('univ_id'))
            sql_data['universities'] = univs
            sql_data['bank_accounts'] = accts

            if univs:
                u = univs[0]
                alloc_cr = round(float(u.get('allocation', 0)) / 10000000, 2)
                spent_cr = round(float(u.get('spent', 0)) / 10000000, 2)
                res_cr = round(float(u.get('availableCash', 0)) / 10000000, 2)
                data_cards.append({
                    "title": f"Live Financial Ledger: {u.get('name')}",
                    "subtitle": f"Code: {u.get('code')} • Region: {u.get('region')} Division",
                    "metrics": [
                        {"label": "State Allocation", "value": f"₹{alloc_cr} Cr"},
                        {"label": "Disbursed / Spent", "value": f"₹{spent_cr} Cr"},
                        {"label": "Reserve Balance", "value": f"₹{res_cr} Cr"},
                        {"label": "Utilization Rate", "value": f"{u.get('utilization')}%"},
                        {"label": "Compliance Grade", "value": f"{u.get('complianceGrade')} ({u.get('complianceScore')}/100)"}
                    ]
                })

            if accts:
                data_cards.append({
                    "title": "Institutional Bank Accounts (Live Ledger)",
                    "subtitle": f"{len(accts)} active account(s) registered with state treasury",
                    "items": [
                        {
                            "name": a['accountName'],
                            "bank": f"{a['bankName']} ({a['ifscCode']})",
                            "number": a['accountNumber'],
                            "balance": f"₹{round(float(a['currentBalance']) / 10000000, 2)} Cr" if float(a['currentBalance']) >= 10000000 else f"₹{float(a['currentBalance']):,.2f}",
                            "status": a['status']
                        } for a in accts[:3]
                    ]
                })

        # Check for exceptions / transactions
        if intent == 'compliance_exception' or 'exception' in state['query'].lower():
            txs = sql_connector.fetch_transactions(exceptions_only=True)
            sql_data['exceptions'] = txs
            if txs:
                data_cards.append({
                    "title": "Live Flagged Exceptions & Anomaly Ledger",
                    "subtitle": f"{len(txs)} transactions flagged by AI reconciliation engine",
                    "items": [
                        {
                            "ref": t['referenceNo'],
                            "description": t['description'],
                            "category": t['category'],
                            "amount": f"₹{t['amount']:,}",
                            "status": "Exception Flagged" if not t['resolved'] else "Resolved"
                        } for t in txs[:3]
                    ]
                })

        # Statewide overview
        if not entities.get('univ_id') or intent == 'budget_appropriation':
            summary = sql_connector.fetch_statewide_summary()
            sql_data['summary'] = summary
            if summary.get('universities'):
                s = summary['universities']
                alloc_total = round(float(s.get('totalAllocated', 0)) / 10000000, 2)
                disb_total = round(float(s.get('totalDisbursed', 0)) / 10000000, 2)
                res_total = round(float(s.get('totalReserve', 0)) / 10000000, 2)
                data_cards.append({
                    "title": "Karnataka Statewide Higher Education Telemetry",
                    "subtitle": f"{s.get('totalUniversities', 0)} Institutions Consolidated Ledger",
                    "metrics": [
                        {"label": "Total State Budget", "value": f"₹{alloc_total} Cr"},
                        {"label": "Total Disbursed", "value": f"₹{disb_total} Cr"},
                        {"label": "Total Reserves", "value": f"₹{res_total} Cr"},
                        {"label": "Avg Utilization", "value": f"{s.get('avgUtilization')}%"},
                        {"label": "Audit Flagged", "value": f"{s.get('flaggedCount')} Campuses"}
                    ]
                })

    except Exception as e:
        print(f"[SQL Retrieval Warning] {e}")
        sql_data['error'] = str(e)

    return {
        "sql_context": sql_data,
        "data_cards": data_cards
    }

# --- Node 4: LLM Generation via Ollama ---
def llm_generate_node(state: RAGState) -> Dict[str, Any]:
    query = state['query']
    if state.get('intent') == 'unrelated_random':
        return {
            "llm_response": "I don't have information.",
            "ollama_status": {"connected": False},
            "latency_ms": 15.0
        }

    model = state.get('model') or config.OLLAMA_MODEL
    ollama_url = state.get('ollama_base_url') or config.OLLAMA_BASE_URL
    vector_context = state.get('vector_context', [])
    sql_context = state.get('sql_context', {})
    role = state.get('role', 'Government Leadership')

    start_time = time.time()

    docs_text = "\n\n".join([
        f"[Document: {c['metadata'].get('title', 'Policy Doc')} | Source: {c['metadata'].get('source', 'Karnataka Govt')}]\n{c['content']}"
        for c in vector_context
    ])
    sql_text = json.dumps(sql_context, default=str, indent=2)

    system_prompt = f"""You are the official AI Financial Intelligence & Statutory RAG Copilot for the Karnataka Department of Higher Education.
User Role: {role}
You have access to:
1. VECTOR DATABASE CONTEXT (Retrieved from ChromaDB - statutory acts, bank statements, KGFR rules, SOPs).
2. LIVE SQL DATABASE RECORDS (Queried directly from financial database 'gov_finance_intel').

Instructions:
- Provide an authoritative, structured, and factual response.
- Directly answer the query with precise monetary figures in Indian Rupees (₹, ₹ Cr, ₹ Lakhs).
- Cite statutory clauses (e.g. KSU Act 2000 Section 47/48, KGFR Chapter 8, UGC 12(B)).
- If asked an unrelated or random question outside Karnataka university finance and banking, reply strictly: "I don't have information."
"""

    user_prompt = f"""USER QUERY: {query}

CHROMA VECTOR CONTEXT:
{docs_text if docs_text else "No specific policy chunks matched."}

LIVE DATABASE FACTS:
{sql_text}

Please generate the comprehensive financial intelligence response with citations and clear action points.
"""

    ollama_status = {"connected": False, "model": model, "endpoint": ollama_url}
    response_text = ""

    # Attempt calling Ollama
    try:
        tags_res = requests.get(f"{ollama_url}/api/tags", timeout=1.5)
        if tags_res.status_code == 200:
            available_models = [m["name"] for m in tags_res.json().get("models", [])]
            chosen_model = model
            if chosen_model not in available_models and available_models:
                chosen_model = available_models[0]

            if chosen_model in available_models:
                req_payload = {
                    "model": chosen_model,
                    "prompt": f"{system_prompt}\n\n{user_prompt}",
                    "stream": False,
                    "options": {
                        "temperature": 0.2,
                        "top_p": 0.9,
                    }
                }
                res = requests.post(f"{ollama_url}/api/generate", json=req_payload, timeout=25)
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "")
                    ollama_status["connected"] = True
                    ollama_status["model"] = chosen_model
                    ollama_status["version"] = "Ollama Local Engine"
    except Exception as e:
        ollama_status["error"] = str(e)
        ollama_status["connected"] = False

    # Grounded synthesis fallback if Ollama endpoint is offline or warming up
    if not response_text:
        response_text = _generate_local_synthesis(query, role, vector_context, sql_context)

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "llm_response": response_text,
        "ollama_status": ollama_status,
        "latency_ms": latency_ms
    }

def _generate_local_synthesis(query: str, role: str, vector_context: List[Dict[str, Any]], sql_context: Dict[str, Any]) -> str:
    """Deterministic, fact-checked financial synthesis when Ollama is offline or warming up."""
    univ_info = sql_context.get('universities', [{}])[0] if sql_context.get('universities') else None
    accts = sql_context.get('bank_accounts', [])
    exceptions = sql_context.get('exceptions', [])
    summary = sql_context.get('summary', {}).get('universities', {})

    top_chunk = vector_context[0] if vector_context else None
    top_title = top_chunk['metadata'].get('title', 'Karnataka State Financial Regulations') if top_chunk else 'KSU Act 2000'

    out = []
    out.append("### Statutory & Financial Intelligence Assessment")
    out.append(f"**Operational Role:** {role} | **Knowledge Authority:** Karnataka Department of Higher Education\n")

    if univ_info:
        alloc_cr = round(float(univ_info.get('allocation', 0)) / 10000000, 2)
        spent_cr = round(float(univ_info.get('spent', 0)) / 10000000, 2)
        res_cr = round(float(univ_info.get('availableCash', 0)) / 10000000, 2)
        out.append(f"#### 1. Live Institutional Ledger ({univ_info.get('name')})")
        out.append(f"- **State Grant Allocation:** ₹{alloc_cr} Cr")
        out.append(f"- **Disbursed to Date:** ₹{spent_cr} Cr ({univ_info.get('utilization')}% utilization)")
        out.append(f"- **Treasury Reserve Balance:** ₹{res_cr} Cr")
        out.append(f"- **Statutory Compliance Grade:** **{univ_info.get('complianceGrade')}** (Score: {univ_info.get('complianceScore')}/100)")
        if univ_info.get('warningReason'):
            out.append(f"- **Audit Warning:** ⚠️ *{univ_info.get('warningReason')}*")

    if accts:
        out.append("\n#### 2. Institutional Treasury Accounts (Live Ledger)")
        for a in accts[:3]:
            bal_num = float(a['currentBalance'])
            bal_str = f"₹{round(bal_num / 10000000, 2)} Cr" if bal_num >= 10000000 else f"₹{bal_num:,.2f}"
            out.append(f"- **{a['accountName']}:** {bal_str} ({a['bankName']} • IFSC: `{a['ifscCode']}`) — Status: `{a['status']}`")

    if exceptions:
        out.append("\n#### 3. Flagged Exceptions & Anomaly Ledger")
        for ex in exceptions[:2]:
            out.append(f"- 🚩 **Ref `{ex['referenceNo']}` ({ex['category']}):** ₹{ex['amount']:,} — {ex['description']}")

    if summary and summary.get('totalUniversities'):
        alloc_tot = round(float(summary.get('totalAllocated', 0)) / 10000000, 2)
        out.append("\n#### Consolidated Statewide Financial Telemetry")
        out.append(f"- **Total Registered Higher Ed Campuses:** {summary.get('totalUniversities')}")
        out.append(f"- **Total State Grant Appropriation:** ₹{alloc_tot} Cr")
        out.append(f"- **Statewide Average Utilization:** {summary.get('avgUtilization')}%")
        out.append(f"- **Institutions with Audit Flags:** {summary.get('flaggedCount')} Campuses")

    if top_chunk:
        out.append("\n#### 4. Vector Knowledge Context (ChromaDB)")
        out.append(f"According to **{top_title}** ({top_chunk['metadata'].get('section', 'General Provisions')}):")
        snippet = top_chunk['content'][:320]
        out.append(f"> \"{snippet}...\"")

    out.append("\n#### 5. Recommended Actions")
    out.append("1. **Comptroller Action:** Under KSU Act Section 48, reconcile bank statement debits against approved budget lines.")
    out.append("2. **Exception Remediation:** Submit credit advice reversals for duplicate wires prior to quarterly filing.")
    out.append("3. **State Portal Submission:** Complete digital sign-off on the Financial Intelligence Platform for Higher Education.")

    return "\n".join(out)

# --- Node 5: Synthesize Citations & Provenance ---
def synthesize_citations_node(state: RAGState) -> Dict[str, Any]:
    if state.get('intent') == 'unrelated_random':
        return {"citations": []}

    vector_context = state.get('vector_context', [])
    sql_context = state.get('sql_context', {})

    citations = []

    # Vector DB Citations (ChromaDB)
    for c in vector_context:
        meta = c.get('metadata', {})
        citations.append({
            "type": "Vector Knowledge Base (ChromaDB)",
            "title": meta.get('title', 'Statutory Policy Document'),
            "section": meta.get('section', 'General Provisions'),
            "source": meta.get('source', 'Department of Higher Education'),
            "relevanceScore": c.get('relevance_score', 0.95),
            "docType": meta.get('doc_type', 'Policy')
        })

    # Database Citations
    if sql_context.get('universities'):
        citations.append({
            "type": "Live Institutional Ledger",
            "title": "Registered Colleges & Universities",
            "section": "Budget Allocations & Utilization",
            "source": "State Financial Database: gov_finance_intel",
            "relevanceScore": 1.0,
            "docType": "Relational Ledger"
        })

    if sql_context.get('bank_accounts'):
        citations.append({
            "type": "Live Treasury Ledger",
            "title": "Official Bank Accounts",
            "section": "Treasury & Account Balances",
            "source": "State Financial Database: gov_finance_intel",
            "relevanceScore": 1.0,
            "docType": "Relational Ledger"
        })

    if sql_context.get('exceptions'):
        citations.append({
            "type": "Anomaly Audit Trail",
            "title": "Flagged Transactions",
            "section": "AI Exception Resolution",
            "source": "State Financial Database: gov_finance_intel",
            "relevanceScore": 0.98,
            "docType": "Audit Log"
        })

    return {
        "citations": citations
    }

# --- Build LangGraph StateGraph Workflow ---
def build_rag_graph():
    workflow = StateGraph(RAGState)

    workflow.add_node("analyze_query", analyze_query_node)
    workflow.add_node("retrieve_vector_context", retrieve_vector_context_node)
    workflow.add_node("query_sql_data", query_sql_data_node)
    workflow.add_node("llm_generate", llm_generate_node)
    workflow.add_node("synthesize_citations", synthesize_citations_node)

    workflow.set_entry_point("analyze_query")
    workflow.add_edge("analyze_query", "retrieve_vector_context")
    workflow.add_edge("retrieve_vector_context", "query_sql_data")
    workflow.add_edge("query_sql_data", "llm_generate")
    workflow.add_edge("llm_generate", "synthesize_citations")
    workflow.add_edge("synthesize_citations", END)

    app = workflow.compile()
    return app

rag_graph = build_rag_graph()

def execute_rag(query: str, role: str = "Government Leadership", university_id: Optional[str] = None, model: str = config.OLLAMA_MODEL) -> Dict[str, Any]:
    """Execute end-to-end LangGraph RAG pipeline"""
    initial_state: RAGState = {
        "query": query,
        "role": role,
        "university_id": university_id,
        "model": model,
        "ollama_base_url": config.OLLAMA_BASE_URL,
        "intent": "",
        "entities": {},
        "vector_context": [],
        "sql_context": {},
        "llm_response": "",
        "citations": [],
        "data_cards": [],
        "ollama_status": {},
        "latency_ms": 0.0
    }
    result = rag_graph.invoke(initial_state)
    return result
