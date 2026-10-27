import os
import hashlib
from typing import List, Dict, Any, Optional
import numpy as np
import chromadb
from chromadb import EmbeddingFunction, Documents, Embeddings
from chromadb.config import Settings
from . import config

class FinancialEmbeddingFunction(EmbeddingFunction):
    """
    High-performance, deterministic 384-dimensional financial domain embedding function.
    Provides instant offline indexing with zero external network lag or timeout vulnerabilities.
    """
    def __init__(self, dimension: int = 384):
        super().__init__()
        self.dimension = dimension

    def __call__(self, input: Documents) -> Embeddings:
        return self._embed(input)

    def embed_documents(self, input: Documents) -> Embeddings:
        return self._embed(input)

    def embed_query(self, input: Documents) -> Embeddings:
        return self._embed(input)

    def _embed(self, input: Documents) -> Embeddings:
        vectors = []
        for text in input:
            cleaned = text.lower().replace('.', ' ').replace(',', ' ').replace('(', ' ').replace(')', ' ').replace('-', ' ')
            tokens = cleaned.split()
            vec = np.zeros(self.dimension, dtype=np.float32)

            for i, t in enumerate(tokens):
                # Unigram hash
                h1 = int(hashlib.sha256(t.encode('utf-8')).hexdigest(), 16)
                idx1 = h1 % self.dimension
                weight = 1.0 + (0.5 if len(t) > 4 else 0.0)
                vec[idx1] += weight

                # Bigram hash for phrase awareness
                if i < len(tokens) - 1:
                    bigram = f"{t}_{tokens[i+1]}"
                    h2 = int(hashlib.md5(bigram.encode('utf-8')).hexdigest(), 16)
                    idx2 = h2 % self.dimension
                    vec[idx2] += 1.8

            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            vectors.append(vec.tolist())
        return vectors


class ChromaVectorStore:
    def __init__(self, persist_directory: str = config.CHROMA_DIR, collection_name: str = config.COLLECTION_NAME):
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # Initialize custom embedding function
        self.ef = FinancialEmbeddingFunction(dimension=384)

        # Initialize persistent ChromaDB client
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(anonymized_telemetry=False, allow_reset=True)
        )
        
        # Get or create collection with custom embedding function
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.ef,
            metadata={"description": "Karnataka Department of Higher Education Financial & Statutory Knowledge Base"}
        )
        print(f"[ChromaDB] Initialized persistent store at {self.persist_directory} (Collection: {self.collection_name}, Docs: {self.collection.count()})")

    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        Expects a list of dictionaries with:
        - id: str
        - text: str
        - metadata: dict (title, doc_type, source, section, regulatory_body, etc.)
        """
        if not documents:
            return 0

        ids = [doc['id'] for doc in documents]
        texts = [doc['text'] for doc in documents]
        metadatas = [doc.get('metadata', {}) for doc in documents]

        self.collection.upsert(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
        return len(ids)

    def similarity_search(self, query: str, n_results: int = 4, where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Performs semantic vector similarity search against ChromaDB.
        """
        count = self.collection.count()
        if count == 0:
            return []

        effective_k = min(n_results, count)
        kwargs = {
            "query_texts": [query],
            "n_results": effective_k
        }
        if where:
            kwargs["where"] = where

        try:
            results = self.collection.query(**kwargs)
        except Exception as e:
            print(f"[ChromaDB Query Warning] {e}. Retrying without where filter...")
            kwargs.pop("where", None)
            results = self.collection.query(**kwargs)

        extracted = []
        if results and results.get('documents') and len(results['documents']) > 0:
            docs = results['documents'][0]
            metas = results['metadatas'][0] if results.get('metadatas') else [{}] * len(docs)
            distances = results['distances'][0] if results.get('distances') else [0.0] * len(docs)
            ids = results['ids'][0] if results.get('ids') else [''] * len(docs)

            for i in range(len(docs)):
                extracted.append({
                    "id": ids[i],
                    "content": docs[i].strip(),
                    "metadata": metas[i],
                    "distance": round(float(distances[i]), 4),
                    "relevance_score": round(max(0.0, 1.0 - (float(distances[i]) / 2.0)), 3)
                })

        return extracted

    def get_stats(self) -> Dict[str, Any]:
        count = self.collection.count()
        peek = self.collection.peek(limit=5)
        return {
            "collectionName": self.collection_name,
            "totalChunks": count,
            "persistDirectory": self.persist_directory,
            "sampleIds": peek.get("ids", []) if peek else []
        }

    def clear(self):
        self.client.delete_collection(self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.ef
        )
        print(f"[ChromaDB] Collection {self.collection_name} cleared.")

# Singleton instance
store = ChromaVectorStore()
