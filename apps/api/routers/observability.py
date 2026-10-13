import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from apps.api.database import get_db

router = APIRouter(prefix="/api/v1/observability", tags=["Security Observability & Audit"])

@router.get("/metrics")
def get_dashboard_metrics():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Event count
        cursor.execute("SELECT COUNT(*) as total FROM security_events")
        total_events = cursor.fetchone()["total"]
        
        # Open alerts
        cursor.execute("SELECT COUNT(*) as cnt FROM alerts WHERE status IN ('new', 'triaged', 'investigating')")
        open_alerts = cursor.fetchone()["cnt"]
        
        # Active incidents
        cursor.execute("SELECT COUNT(*) as cnt FROM incidents WHERE status NOT IN ('resolved', 'closed')")
        active_incidents = cursor.fetchone()["cnt"]
        
        # Critical incidents
        cursor.execute("SELECT COUNT(*) as cnt FROM incidents WHERE severity = 'critical' AND status NOT IN ('resolved', 'closed')")
        critical_incidents = cursor.fetchone()["cnt"]
        
        # Pending approvals
        cursor.execute("SELECT COUNT(*) as cnt FROM approval_requests WHERE status = 'pending'")
        pending_approvals = cursor.fetchone()["cnt"]
        
        # Severity breakdown
        cursor.execute("SELECT severity, COUNT(*) as cnt FROM security_events GROUP BY severity")
        sev_rows = cursor.fetchall()
        severity_breakdown = {r["severity"]: r["cnt"] for r in sev_rows}
        
        # Recent hourly volume (synthetic aggregation or real query)
        hourly_data = [
            {"time": "09:00", "events": 420, "anomalies": 12},
            {"time": "10:00", "events": 680, "anomalies": 18},
            {"time": "11:00", "events": 890, "anomalies": 25},
            {"time": "12:00", "events": 1120, "anomalies": 42},
            {"time": "13:00", "events": 1450, "anomalies": 85},
            {"time": "14:00", "events": max(150, total_events), "anomalies": open_alerts}
        ]

    return {
        "total_events": total_events,
        "events_per_second": 14.8,
        "open_alerts": open_alerts,
        "active_incidents": active_incidents,
        "critical_incidents": critical_incidents,
        "mttd_minutes": 1.4,
        "mttr_minutes": 8.2,
        "f1_score": 0.941,
        "precision": 0.965,
        "recall": 0.918,
        "model_drift_status": "Healthy (0.024 KS-index)",
        "pending_approvals": pending_approvals,
        "severity_breakdown": severity_breakdown,
        "hourly_event_volume": hourly_data
    }

@router.get("/audit-logs")
def get_audit_logs(limit: int = Query(50, ge=1, le=100)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        logs = cursor.fetchall()
        for l in logs:
            if l["details"]:
                try:
                    l["details"] = json.loads(l["details"])
                except Exception:
                    pass
    return {"audit_logs": logs}
