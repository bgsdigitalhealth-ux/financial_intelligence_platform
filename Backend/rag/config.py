import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env or Backend/.env
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

# MySQL Database Configuration
DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'BGSMCH')
DB_NAME = os.getenv('DB_NAME', 'gov_finance_intel')

# Ollama LLM Configuration
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3')
OLLAMA_EMBED_MODEL = os.getenv('OLLAMA_EMBED_MODEL', 'nomic-embed-text')

# ChromaDB Vector Database Configuration
CHROMA_DIR = str(Path(__file__).resolve().parent / 'chroma_data')
COLLECTION_NAME = 'karnataka_higher_education_rag'

# RAG Microservice Port
RAG_SERVICE_PORT = int(os.getenv('RAG_SERVICE_PORT', 5001))
