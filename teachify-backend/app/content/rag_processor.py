# app/content/rag_processor.py
"""
RAG pipeline: ingest files, extract text, chunk, embed (SentenceTransformers),
build FAISS index, and retrieve the most relevant context for a prompt.
Production-safe: no external paid APIs; supports PDF/DOCX/TXT.
"""

import os
import io
import re
import faiss
import logging
from typing import List, Tuple, Dict, Optional

from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader
from docx import Document

logger = logging.getLogger("uvicorn")

# One-time global model load (fast + cached in process)
_EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"  # 384-dim, lightweight & strong
_embedder: Optional[SentenceTransformer] = None

def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        logger.info(f"🔎 Loading embedding model: {_EMBED_MODEL_NAME}")
        _embedder = SentenceTransformer(_EMBED_MODEL_NAME)
    return _embedder


# ────────────────────────────────
# File text extraction
# ────────────────────────────────
def _extract_text_from_pdf(path: str) -> str:
    try:
        with open(path, "rb") as f:
            reader = PdfReader(f)
            texts = []
            for page in reader.pages:
                txt = page.extract_text() or ""
                texts.append(txt)
        return "\n".join(texts)
    except Exception as e:
        logger.error(f"PDF extract failed for {path}: {e}")
        return ""

def _extract_text_from_docx(path: str) -> str:
    try:
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs if p.text)
    except Exception as e:
        logger.error(f"DOCX extract failed for {path}: {e}")
        return ""

def _extract_text_from_txt(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        logger.error(f"TXT read failed for {path}: {e}")
        return ""


def extract_text(path: str, mime: Optional[str] = None) -> str:
    ext = os.path.splitext(path)[1].lower()
    if mime and "pdf" in mime or ext == ".pdf":
        return _extract_text_from_pdf(path)
    if mime and ("word" in mime or "docx" in mime) or ext == ".docx":
        return _extract_text_from_docx(path)
    return _extract_text_from_txt(path)


# ────────────────────────────────
# Chunking
# ────────────────────────────────
def clean_text(text: str) -> str:
    t = re.sub(r"[ \t]+", " ", text)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def chunk_text(text: str, max_tokens: int = 400, overlap: int = 50) -> List[str]:
    """
    Simple size-based chunker (chars as proxy for tokens).
    """
    text = clean_text(text)
    if not text:
        return []
    words = text.split()
    chunks, start = [], 0
    while start < len(words):
        end = min(len(words), start + max_tokens)
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end == len(words):
            break
        start = max(0, end - overlap)
    return chunks


# ────────────────────────────────
# Embedding + FAISS
# ────────────────────────────────
class RagIndex(BaseModel):
    index: faiss.IndexFlatIP
    dim: int
    chunks: List[str]

    model_config = {
        "arbitrary_types_allowed": True
    }


def build_faiss_index(chunks: List[str]) -> RagIndex:
    emb = _get_embedder()
    vectors = emb.encode(chunks, convert_to_numpy=True, normalize_embeddings=True)
    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    return RagIndex(index=index, dim=dim, chunks=chunks)

def search(index: RagIndex, query: str, top_k: int = 6) -> List[Tuple[str, float]]:
    emb = _get_embedder()
    q = emb.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = index.index.search(q, top_k)
    hits = []
    for score, idx in zip(D[0], I[0]):
        if idx == -1:
            continue
        hits.append((index.chunks[idx], float(score)))
    return hits


# ────────────────────────────────
# Public API: build context from uploaded docs
# ────────────────────────────────
def build_context_from_files(files: List[Tuple[str, Optional[str]]], prompt: str, top_k: int = 6) -> str:
    """
    files: list of (path, mime)
    Returns a concatenated context string from top relevant chunks.
    """
    all_text = []
    for path, mime in files:
        txt = extract_text(path, mime)
        if not txt:
            logger.warning(f"⚠️ Empty text from {path}")
            continue
        all_text.append(txt)

    big_text = "\n\n".join(all_text)
    chunks = chunk_text(big_text, max_tokens=450, overlap=80)
    if not chunks:
        return ""

    idx = build_faiss_index(chunks)
    hits = search(idx, prompt, top_k=top_k)

    context_sections = []
    for i, (chunk, score) in enumerate(hits, start=1):
        context_sections.append(f"[DOC#{i} score={score:.3f}]\n{chunk}")

    context = "\n\n".join(context_sections)
    logger.info(f"📚 Built RAG context with {len(hits)} chunks.")
    return context
