import json
from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional
from apps.api.database import get_db
from apps.api.schemas.all_schemas import CanonicalSecurityEvent, EventBatchRequest
from apps.api.services.detection import process_and_alert_event
from apps.api.services.ingestion import inject_scenario, parse_and_ingest_json, parse_and_ingest_csv

router = APIRouter(prefix="/api/v1/events", tags=["Security Events Telemetry"])

@router.get("")
def list_events(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    is_anomaly: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM security_events WHERE 1=1"
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        if is_anomaly is not None:
            query += " AND is_anomaly = ?"
            params.append(1 if is_anomaly else 0)
        if search:
            query += " AND (action LIKE ? OR host_id LIKE ? OR user_id LIKE ? OR src_ip LIKE ? OR dst_ip LIKE ? OR process_name LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param, s_param, s_param, s_param])
            
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        cursor.execute("SELECT COUNT(*) as total FROM security_events")
        total_count = cursor.fetchone()["total"]
        
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "events": rows
    }

@router.post("")
def ingest_single_event(event: CanonicalSecurityEvent):
    event_dict = event.model_dump()
    result = process_and_alert_event(event_dict)
    return result

@router.post("/batch")
def ingest_batch_events(batch: EventBatchRequest):
    results = []
    for ev in batch.events:
        res = process_and_alert_event(ev.model_dump())
        results.append(res)
    return {"ingested_count": len(results), "results": results}

@router.post("/simulate/{scenario_key}")
def trigger_simulation_scenario(scenario_key: str):
    """Inject pre-configured attack scenarios ('brute_force_lateral', 'c2_exfiltration', 'normal_baseline')."""
    try:
        results = inject_scenario(scenario_key)
        return {
            "status": "success",
            "scenario": scenario_key,
            "events_injected": len(results),
            "alerts_generated": [r["alert"] for r in results if r["alert"]],
            "incidents": list(set([r["incident_id"] for r in results if r["incident_id"]]))
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-json")
def upload_json_events(raw_body: str = Body(..., media_type="text/plain")):
    try:
        results = parse_and_ingest_json(raw_body)
        return {"status": "success", "ingested": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse JSON telemetry: {str(e)}")

@router.post("/upload-csv")
def upload_csv_events(raw_body: str = Body(..., media_type="text/plain")):
    try:
        results = parse_and_ingest_csv(raw_body)
        return {"status": "success", "ingested": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV telemetry: {str(e)}")
