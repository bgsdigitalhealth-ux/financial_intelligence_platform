"""
FastAPI Microservice for Karnataka Financial Intelligence RAG Pipeline
Powered by LangGraph, ChromaDB, and Ollama Integration.
Runs on Port 5001.
"""
import os
import requests
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Body, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from . import config
from .chroma_store import store
from .graph import execute_rag
from . import sql_connector

app = FastAPI(
    title="Karnataka Department of Higher Education - Financial Intelligence RAG Microservice",
    description="LangGraph + ChromaDB + Ollama + MySQL RAG Service",
    version="1.0.0"
)

# Enable CORS for frontend and Node backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

class QueryRequest(BaseModel):
    query: str
    role: Optional[str] = "Government Leadership"
    universityId: Optional[str] = None
    model: Optional[str] = config.OLLAMA_MODEL

class IndexDocumentRequest(BaseModel):
    id: str
    title: str
    text: str
    docType: Optional[str] = "Policy"
    section: Optional[str] = "General"
    source: Optional[str] = "University Submission"
    universityId: Optional[str] = None
    regulatoryBody: Optional[str] = "Department of Higher Education"

@app.get("/")
@app.get("/rag")
@app.get("/api/rag")
def root_info():
    return {
        "status": "ONLINE",
        "service": "Karnataka Department of Higher Education - Financial Intelligence RAG Service",
        "architecture": "LangGraph + ChromaDB + Ollama + MySQL",
        "port": config.RAG_SERVICE_PORT,
        "chromaDB": store.get_stats(),
        "ollama": {
            "endpoint": config.OLLAMA_BASE_URL,
            "defaultModel": config.OLLAMA_MODEL
        },
        "endpoints": {
            "query": "POST /query",
            "status": "GET /status",
            "documents": "GET /documents",
            "index": "POST /index",
            "health": "GET /health",
            "docs": "GET /docs (Interactive Swagger UI)"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "Karnataka Higher Education RAG Pipeline",
        "architecture": "LangGraph + ChromaDB + Ollama + MySQL",
        "port": config.RAG_SERVICE_PORT
    }

@app.get("/status")
@app.get("/api/rag/status")
def get_system_status():
    """Returns live connection status for ChromaDB, Ollama, and MySQL"""
    # 1. ChromaDB Status
    chroma_stats = store.get_stats()

    # 2. Ollama Status & Available Models
    ollama_info = {
        "endpoint": config.OLLAMA_BASE_URL,
        "defaultModel": config.OLLAMA_MODEL,
        "connected": False,
        "availableModels": []
    }
    try:
        r = requests.get(f"{config.OLLAMA_BASE_URL}/api/tags", timeout=2)
        if r.status_code == 200:
            models_data = r.json()
            ollama_info["connected"] = True
            ollama_info["availableModels"] = [m["name"] for m in models_data.get("models", [])]
    except Exception as e:
        ollama_info["error"] = str(e)

    # 3. MySQL Status
    mysql_info = {
        "host": config.DB_HOST,
        "database": config.DB_NAME,
        "connected": False,
        "universitiesCount": 0
    }
    try:
        summary = sql_connector.fetch_statewide_summary()
        mysql_info["connected"] = True
        mysql_info["universitiesCount"] = summary.get("universities", {}).get("totalUniversities", 32)
    except Exception as e:
        mysql_info["error"] = str(e)

    return {
        "success": True,
        "chromaDB": chroma_stats,
        "ollama": ollama_info,
        "mysql": mysql_info
    }

@app.post("/query")
@app.post("/api/rag/query")
def handle_rag_query(payload: QueryRequest):
    """
    Executes the LangGraph RAG StateGraph Pipeline:
    1. Query Analysis & Entity Extraction
    2. Vector Retrieval (ChromaDB)
    3. Live SQL Ledger Augmentation (MySQL)
    4. LLM Generation (Ollama / Llama 3)
    5. Citation Synthesis with verifiable provenance
    """
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")

    try:
        result = execute_rag(
            query=payload.query.strip(),
            role=payload.role or "Government Leadership",
            university_id=payload.universityId,
            model=payload.model or config.OLLAMA_MODEL
        )
        return {
            "success": True,
            "query": result["query"],
            "intent": result["intent"],
            "role": result["role"],
            "answer": result["llm_response"],
            "citations": result["citations"],
            "dataCards": result["data_cards"],
            "retrievedChunksCount": len(result["vector_context"]),
            "ollamaStatus": result["ollama_status"],
            "latencyMs": result["latency_ms"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Execution error: {str(e)}")

@app.get("/documents")
@app.get("/api/rag/documents")
def list_indexed_documents():
    """Lists indexed documents and chunks from ChromaDB"""
    peek = store.collection.peek(limit=50)
    items = []
    if peek and peek.get("ids"):
        ids = peek["ids"]
        docs = peek.get("documents", [])
        metas = peek.get("metadatas", [])
        for i in range(len(ids)):
            items.append({
                "id": ids[i],
                "snippet": docs[i][:180] + "..." if len(docs[i]) > 180 else docs[i],
                "metadata": metas[i] if i < len(metas) else {}
            })
    return {
        "success": True,
        "totalCount": store.collection.count(),
        "documents": items
    }

@app.post("/index")
@app.post("/api/rag/index")
def index_document(payload: IndexDocumentRequest):
    """Dynamically adds/indexes a document chunk into ChromaDB"""
    doc = {
        "id": payload.id,
        "text": payload.text,
        "metadata": {
            "title": payload.title,
            "doc_type": payload.docType,
            "section": payload.section,
            "source": payload.source,
            "university_id": payload.universityId or "",
            "regulatory_body": payload.regulatoryBody
        }
    }
    count = store.add_documents([doc])
    return {
        "success": True,
        "message": f"Successfully indexed document '{payload.title}' into ChromaDB",
        "docId": payload.id,
        "totalChunks": store.collection.count()
    }

def start_server():
    print(f"Starting Karnataka Financial Intelligence RAG Microservice on port {config.RAG_SERVICE_PORT}...")
    uvicorn.run("rag.service:app", host="0.0.0.0", port=config.RAG_SERVICE_PORT, reload=False)

if __name__ == '__main__':
    start_server()
