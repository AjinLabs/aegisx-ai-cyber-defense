from fastapi import APIRouter, Query
from typing import Optional
from apps.api.database import get_db
from apps.api.schemas.all_schemas import KnowledgeSearchRequest, KnowledgeSearchResponse, KnowledgeCitation
from apps.api.services.rag_engine import search_knowledge

router = APIRouter(prefix="/api/v1/knowledge", tags=["Knowledge & RAG Studio"])

@router.get("/documents")
def list_documents():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM knowledge_documents ORDER BY created_at DESC")
        docs = cursor.fetchall()
    return {"documents": docs}

@router.post("/search")
def search_playbooks(query_req: KnowledgeSearchRequest):
    """
    Execute hybrid vector & keyword RAG search across security playbooks and policies.
    Returns verified citations with similarity scores and sections.
    """
    raw_citations = search_knowledge(
        query=query_req.query,
        top_k=query_req.top_k,
        category=query_req.category
    )
    
    citations = [
        KnowledgeCitation(
            document_id=c["document_id"],
            document_title=c["document_title"],
            section_title=c.get("section_title"),
            chunk_index=c["chunk_index"],
            content=c["content"],
            similarity_score=c["similarity_score"]
        )
        for c in raw_citations
    ]
    
    guidance = None
    if citations:
        guidance = (
            f"Based on {citations[0].document_title} (Section: {citations[0].section_title or 'General'}), "
            f"recommended immediate containment procedure involves: {citations[0].content[:160]}..."
        )
        
    return KnowledgeSearchResponse(
        query=query_req.query,
        citations=citations,
        synthesized_guidance=guidance
    )
