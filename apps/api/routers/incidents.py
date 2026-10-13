import json
from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional
from apps.api.database import get_db
from apps.api.schemas.all_schemas import IncidentUpdateRequest

router = APIRouter(prefix="/api/v1/incidents", tags=["Incident Investigation"])

@router.get("")
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM incidents WHERE 1=1"
        params = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cursor.execute(query, params)
        rows = cursor.fetchall()
        cursor.execute("SELECT COUNT(*) as cnt FROM incidents")
        total = cursor.fetchone()["cnt"]
    return {"total": total, "incidents": rows}

@router.get("/{incident_id}")
def get_incident_detail(incident_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
        inc = cursor.fetchone()
        if not inc:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        # Fetch timeline
        cursor.execute("SELECT * FROM incident_timeline WHERE incident_id = ? ORDER BY timestamp ASC", (incident_id,))
        timeline = cursor.fetchall()
        for t in timeline:
            if t["metadata"]:
                try:
                    t["metadata"] = json.loads(t["metadata"])
                except Exception:
                    pass

        # Fetch evidence
        cursor.execute("SELECT * FROM incident_evidence WHERE incident_id = ? ORDER BY created_at ASC", (incident_id,))
        evidence = cursor.fetchall()
        for e in evidence:
            if e["data"]:
                try:
                    e["data"] = json.loads(e["data"])
                except Exception:
                    pass

        # Fetch agent runs
        cursor.execute("SELECT * FROM agent_runs WHERE incident_id = ? ORDER BY start_time ASC", (incident_id,))
        agent_runs = cursor.fetchall()
        for r in agent_runs:
            for k in ["input_context", "output_findings", "tool_calls_json"]:
                if r.get(k):
                    try:
                        r[k] = json.loads(r[k])
                    except Exception:
                        pass

        # Fetch pending approvals
        cursor.execute("SELECT * FROM approval_requests WHERE incident_id = ? ORDER BY created_at DESC", (incident_id,))
        approvals = cursor.fetchall()
        for a in approvals:
            if a.get("parameters"):
                try:
                    a["parameters"] = json.loads(a["parameters"])
                except Exception:
                    pass

        # Fetch analyst case notes
        cursor.execute("SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY created_at ASC", (incident_id,))
        notes = cursor.fetchall()

    return {
        "incident": inc,
        "timeline": timeline,
        "evidence": evidence,
        "agent_runs": agent_runs,
        "pending_approvals": approvals,
        "analyst_notes": notes
    }

@router.post("/{incident_id}/notes")
def add_incident_note(incident_id: str, payload: dict):
    """Adds a human analyst case observation / hypothesis to the incident record."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO incident_notes (incident_id, analyst_name, role, note)
        VALUES (?, ?, ?, ?)
        """, (
            incident_id,
            payload.get("analyst_name", "Sarah Chen"),
            payload.get("role", "SOC Analyst L2"),
            payload.get("note", "")
        ))
        
        # Also append to incident timeline as a human note
        cursor.execute("""
        INSERT INTO incident_timeline (incident_id, event_type, actor, description, metadata)
        VALUES (?, 'human_note', ?, ?, ?)
        """, (
            incident_id,
            payload.get("analyst_name", "Sarah Chen"),
            f"Analyst Note: {payload.get('note', '')[:120]}...",
            json.dumps({"role": payload.get("role", "SOC Analyst L2")})
        ))
    return {"status": "note_recorded", "incident_id": incident_id}

@router.patch("/{incident_id}")
def update_incident(incident_id: str, payload: IncidentUpdateRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        fields = []
        params = []
        if payload.status:
            fields.append("status = ?")
            params.append(payload.status)
        if payload.severity:
            fields.append("severity = ?")
            params.append(payload.severity)
        if payload.assignee:
            fields.append("assignee = ?")
            params.append(payload.assignee)
        if payload.summary:
            fields.append("summary = ?")
            params.append(payload.summary)
            
        if not fields:
            raise HTTPException(status_code=400, detail="No update fields provided")
            
        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(incident_id)
        
        sql = f"UPDATE incidents SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(sql, params)
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Incident not found")
            
    return {"status": "success", "incident_id": incident_id}
