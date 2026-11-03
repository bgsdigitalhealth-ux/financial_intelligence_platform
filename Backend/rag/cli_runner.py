"""
Command-line bridge to execute LangGraph RAG pipeline and return JSON output.
Invoked by Node.js Backend or directly via CLI.
"""
import sys
import json
import argparse
from pathlib import Path

# Ensure Backend directory is in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from rag.graph import execute_rag

def main():
    parser = argparse.ArgumentParser(description="Execute LangGraph RAG Pipeline")
    parser.add_argument("--query", type=str, required=True, help="User query text")
    parser.add_argument("--role", type=str, default="Government Leadership", help="User role")
    parser.add_argument("--universityId", type=str, default=None, help="University ID")
    parser.add_argument("--model", type=str, default=None, help="Ollama model")

    args = parser.parse_args()

    try:
        result = execute_rag(
            query=args.query,
            role=args.role,
            university_id=args.universityId,
            model=args.model or "llama3"
        )
        response_payload = {
            "success": True,
            "query": result.get("query"),
            "intent": result.get("intent"),
            "role": result.get("role"),
            "answer": result.get("llm_response"),
            "citations": result.get("citations", []),
            "dataCards": result.get("data_cards", []),
            "retrievedChunksCount": len(result.get("vector_context", [])),
            "ollamaStatus": result.get("ollama_status", {}),
            "latencyMs": result.get("latency_ms", 0)
        }
        print("__JSON_START__" + json.dumps(response_payload) + "__JSON_END__")
    except Exception as e:
        err_payload = {
            "success": False,
            "error": str(e)
        }
        print("__JSON_START__" + json.dumps(err_payload) + "__JSON_END__")
        sys.exit(1)

if __name__ == '__main__':
    main()
