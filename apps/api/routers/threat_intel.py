import json
from fastapi import APIRouter, Query
from typing import Optional
from apps.api.database import get_db
from apps.api.services.graph_engine import get_investigation_graph

router = APIRouter(prefix="/api/v1/threat-intel", tags=["Threat Intelligence & Entity Graph"])

@router.get("/indicators")
def list_indicators(
    indicator_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM threat_indicators WHERE 1=1"
        params = []
        if indicator_type:
            query += " AND indicator_type = ?"
            params.append(indicator_type)
        if search:
            query += " AND (value LIKE ? OR threat_actor LIKE ? OR campaign LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s])
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        for r in rows:
            if r["mitre_tactics"]:
                try:
                    r["mitre_tactics"] = json.loads(r["mitre_tactics"])
                except Exception:
                    pass
    return {"indicators": rows}

@router.get("/graph")
def get_attack_graph(incident_id: Optional[str] = None):
    """Returns React Flow formatted node and edge topology for visual graph rendering."""
    return get_investigation_graph(incident_id)
