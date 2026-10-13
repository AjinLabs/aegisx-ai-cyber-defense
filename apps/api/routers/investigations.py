import json
from fastapi import APIRouter, HTTPException
from apps.api.schemas.all_schemas import InvestigationTriggerRequest
from apps.api.services.agents import multi_agent_coordinator
from apps.api.database import get_db

router = APIRouter(prefix="/api/v1/investigations", tags=["Agentic AI Investigation Centre"])

@router.post("/trigger")
def trigger_agent_investigation(request: InvestigationTriggerRequest):
    """
    Triggers bounded autonomous multi-agent cyber investigation on an incident:
    Triage -> Threat Intel -> Behavioral Analysis -> RAG Playbooks -> Correlation Graph -> Response Planning -> Final Report.
    """
    try:
        agent_runs = multi_agent_coordinator.investigate_incident(
            incident_id=request.incident_id,
            strategy=request.orchestration_strategy
        )
        return {
            "status": "completed",
            "incident_id": request.incident_id,
            "total_agents_executed": len(agent_runs),
            "total_tokens": sum(r["tokens_used"] for r in agent_runs),
            "agent_runs": agent_runs
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent investigation failed: {str(e)}")

@router.get("/{incident_id}/runs")
def get_incident_agent_runs(incident_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agent_runs WHERE incident_id = ? ORDER BY start_time ASC", (incident_id,))
        rows = cursor.fetchall()
        for r in rows:
            for k in ["input_context", "output_findings", "tool_calls_json"]:
                if r.get(k):
                    try:
                        r[k] = json.loads(r[k])
                    except Exception:
                        pass
    return {"incident_id": incident_id, "agent_runs": rows}
