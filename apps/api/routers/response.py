import json
from fastapi import APIRouter, HTTPException, Query
from apps.api.database import get_db
from apps.api.schemas.all_schemas import ApprovalDecisionRequest, ActionExecuteRequest
from apps.api.services.response_engine import execute_defensive_action

router = APIRouter(prefix="/api/v1/response", tags=["Automated Response & Approval Queue"])

@router.get("/actions")
def list_available_actions():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM response_actions")
        rows = cursor.fetchall()
        for r in rows:
            if r["target_schema"]:
                try:
                    r["target_schema"] = json.loads(r["target_schema"])
                except Exception:
                    pass
    return {"registered_actions": rows}

@router.get("/approvals")
def list_approval_requests():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.*, i.title as incident_title, i.severity as incident_severity
            FROM approval_requests a
            LEFT JOIN incidents i ON a.incident_id = i.id
            ORDER BY a.created_at DESC
        """)
        rows = cursor.fetchall()
        for r in rows:
            if r["parameters"]:
                try:
                    r["parameters"] = json.loads(r["parameters"])
                except Exception:
                    pass
    return {"approvals": rows}

@router.post("/approvals/{approval_id}/decide")
def decide_approval(approval_id: str, decision_req: ApprovalDecisionRequest):
    """
    Incident Commander / Security Engineer sign-off:
    If approved, dispatches safe simulation response execution and records audit log.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM approval_requests WHERE id = ?", (approval_id,))
        appr = cursor.fetchone()
        if not appr:
            raise HTTPException(status_code=404, detail="Approval request not found")

    if decision_req.decision == "approved":
        params = json.loads(appr["parameters"]) if isinstance(appr["parameters"], str) else (appr["parameters"] or {})
        exec_res = execute_defensive_action(
            action_type=appr["action_type"],
            target_entity=appr["target_entity"],
            parameters=params,
            actor=decision_req.approver_user,
            approval_id=approval_id,
            simulate=True
        )
        return {
            "status": "approved_and_executed",
            "approval_id": approval_id,
            "decision": "approved",
            "execution": exec_res
        }
    else:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE approval_requests 
                SET status = 'rejected', approver_user = ?, decision_notes = ?, decided_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (decision_req.approver_user, decision_req.decision_notes or "Rejected by Commander", approval_id))
        return {
            "status": "rejected",
            "approval_id": approval_id,
            "decision": "rejected"
        }

@router.post("/execute")
def direct_execute_action(req: ActionExecuteRequest):
    """Directly test or execute a defensive action in simulation sandbox."""
    res = execute_defensive_action(
        action_type=req.action_type,
        target_entity=req.target_entity,
        parameters=req.parameters,
        actor="operator_manual",
        simulate=req.simulate_only
    )
    return res
