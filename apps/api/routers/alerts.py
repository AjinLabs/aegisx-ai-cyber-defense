import json
from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional
from apps.api.database import get_db

router = APIRouter(prefix="/api/v1/alerts", tags=["Alert Management"])

@router.get("")
def list_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM alerts WHERE 1=1"
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
        for r in rows:
            if r["reason_codes"]:
                try:
                    r["reason_codes"] = json.loads(r["reason_codes"])
                except Exception:
                    pass
        cursor.execute("SELECT COUNT(*) as cnt FROM alerts")
        total = cursor.fetchone()["cnt"]
    return {"total": total, "alerts": rows}

@router.get("/{alert_id}")
def get_alert(alert_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        if row["reason_codes"]:
            try:
                row["reason_codes"] = json.loads(row["reason_codes"])
            except Exception:
                pass
    return row

@router.patch("/{alert_id}")
def update_alert(alert_id: str, status: str = Body(..., embed=True)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET status = ? WHERE id = ?", (status, alert_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "alert_id": alert_id, "new_status": status}
