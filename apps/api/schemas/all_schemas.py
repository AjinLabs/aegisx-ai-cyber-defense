from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

# 1. Telemetry & Security Events
class CanonicalSecurityEvent(BaseModel):
    id: Optional[str] = None
    workspace_id: str = "ws-prod"
    timestamp: Optional[str] = None
    source_id: str
    category: str  # authentication, network, endpoint, administrative, cloud
    action: str  # login_attempt, privilege_escalate, port_scan, dns_query, file_access
    outcome: str  # success, failure, denied, unknown
    severity: str = "low"  # informational, low, medium, high, critical
    host_id: Optional[str] = None
    user_id: Optional[str] = None
    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    process_name: Optional[str] = None
    raw_payload: Optional[str] = None
    normalized_fields: Optional[dict[str, Any]] = None

class EventBatchRequest(BaseModel):
    events: list[CanonicalSecurityEvent]

class EventFilterParams(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    search: Optional[str] = None
    is_anomaly: Optional[bool] = None
    limit: int = 50
    offset: int = 0

# 2. Alerts
class AlertResponse(BaseModel):
    id: str
    title: str
    rule_id: Optional[str] = None
    source_event_id: Optional[str] = None
    severity: str
    status: str
    risk_score: float
    confidence: float
    reason_codes: list[str] = []
    entity_id: Optional[str] = None
    summary: Optional[str] = None
    created_at: str

# 3. Incidents
class IncidentResponse(BaseModel):
    id: str
    title: str
    severity: str
    status: str
    assignee: Optional[str] = None
    risk_score: float
    summary: Optional[str] = None
    recommended_action: Optional[str] = None
    sla_deadline: Optional[str] = None
    created_at: str
    updated_at: str

class IncidentDetail(IncidentResponse):
    timeline: list[dict[str, Any]] = []
    evidence: list[dict[str, Any]] = []
    agent_runs: list[dict[str, Any]] = []
    pending_approvals: list[dict[str, Any]] = []

class IncidentUpdateRequest(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assignee: Optional[str] = None
    summary: Optional[str] = None

# 4. Agentic AI & Investigations
class InvestigationTriggerRequest(BaseModel):
    incident_id: str
    orchestration_strategy: str = "full_pipeline"  # full_pipeline, triage_only, research_only
    custom_instruction: Optional[str] = None

class AgentRunResponse(BaseModel):
    id: str
    incident_id: str
    agent_name: str
    status: str
    start_time: str
    end_time: Optional[str] = None
    duration_ms: Optional[float] = None
    input_context: Optional[dict[str, Any]] = None
    output_findings: Optional[dict[str, Any]] = None
    tool_calls: list[dict[str, Any]] = []
    tokens_used: int = 0
    model_used: str

# 5. RAG & Knowledge Base
class KnowledgeSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    top_k: int = 4

class KnowledgeCitation(BaseModel):
    document_id: str
    document_title: str
    section_title: Optional[str] = None
    chunk_index: int
    content: str
    similarity_score: float

class KnowledgeSearchResponse(BaseModel):
    query: str
    citations: list[KnowledgeCitation]
    synthesized_guidance: Optional[str] = None

# 6. ML / DL Models & MLOps
class ModelTrainRequest(BaseModel):
    model_type: str  # isolation_forest, random_forest, pytorch_autoencoder
    epochs: int = 15
    contamination: float = 0.05
    n_estimators: int = 100

class ModelEvaluationMetrics(BaseModel):
    model_id: str
    model_name: str
    model_type: str
    framework: str
    version: str
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float] = None
    reconstruction_loss_mean: Optional[float] = None
    reconstruction_threshold: Optional[float] = None
    confusion_matrix: Optional[dict[str, Any]] = None
    drift_score: float
    status: str
    trained_at: str

# 7. Response Actions & Approval
class ApprovalDecisionRequest(BaseModel):
    decision: str  # approved, rejected
    approver_user: str = "incident_commander"
    decision_notes: Optional[str] = None

class ActionExecuteRequest(BaseModel):
    action_type: str
    target_entity: str
    incident_id: str
    parameters: dict[str, Any] = {}
    simulate_only: bool = True

# 8. Threat Intel & Graph
class IndicatorSearchFilter(BaseModel):
    indicator_type: Optional[str] = None
    search: Optional[str] = None
    maliciousness: Optional[str] = None
    limit: int = 50

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # user, host, ip, process, alert
    data: dict[str, Any]
    position: dict[str, float]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    animated: bool = False

class EntityGraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]

# 9. Dashboard Overview Metrics
class DashboardOverviewMetrics(BaseModel):
    total_events: int
    events_per_second: float
    open_alerts: int
    active_incidents: int
    critical_incidents: int
    mttd_minutes: float
    mttr_minutes: float
    f1_score: float
    precision: float
    recall: float
    model_drift_status: str
    pending_approvals: int
    severity_breakdown: dict[str, int]
    hourly_event_volume: list[dict[str, Any]]

# 10. Human Feedback & Collaboration
class HumanFeedbackCreateRequest(BaseModel):
    target_type: str = "alert"  # alert, event, incident
    target_id: str
    verdict: str  # confirmed_threat, false_positive, policy_exemption, benign_anomaly
    analyst_name: str = "Sarah Chen (SOC Lead)"
    confidence: float = 1.0
    feature_critique: Optional[str] = None
    notes: Optional[str] = None

class IncidentNoteCreateRequest(BaseModel):
    analyst_name: str = "Sarah Chen (SOC Lead)"
    role: str = "SOC Analyst L2"
    note: str

