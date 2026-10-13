const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE_URL}/api/v1/observability/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
  return res.json();
}

export async function fetchEvents(params: { category?: string; severity?: string; search?: string; is_anomaly?: boolean; limit?: number }) {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.severity) q.set("severity", params.severity);
  if (params.search) q.set("search", params.search);
  if (params.is_anomaly !== undefined) q.set("is_anomaly", String(params.is_anomaly));
  if (params.limit) q.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE_URL}/api/v1/events?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function simulateScenario(scenarioKey: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/events/simulate/${scenarioKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to trigger simulation scenario");
  return res.json();
}

export async function fetchAlerts(params?: { status?: string; severity?: string }) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.severity) q.set("severity", params.severity);

  const res = await fetch(`${API_BASE_URL}/api/v1/alerts?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function fetchIncidents() {
  const res = await fetch(`${API_BASE_URL}/api/v1/incidents`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchIncidentDetail(incidentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch incident details");
  return res.json();
}

export async function triggerInvestigation(incidentId: string, strategy: string = "full_pipeline") {
  const res = await fetch(`${API_BASE_URL}/api/v1/investigations/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incident_id: incidentId, orchestration_strategy: strategy })
  });
  if (!res.ok) throw new Error("Failed to trigger multi-agent investigation");
  return res.json();
}

export async function searchKnowledge(query: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/knowledge/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: 3 })
  });
  if (!res.ok) throw new Error("Failed to search knowledge base");
  return res.json();
}

export async function fetchKnowledgeDocs() {
  const res = await fetch(`${API_BASE_URL}/api/v1/knowledge/documents`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch knowledge documents");
  return res.json();
}

export async function fetchThreatIndicators(search?: string) {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  const res = await fetch(`${API_BASE_URL}/api/v1/threat-intel/indicators?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch threat indicators");
  return res.json();
}

export async function fetchAttackGraph(incidentId?: string) {
  const q = new URLSearchParams();
  if (incidentId) q.set("incident_id", incidentId);
  const res = await fetch(`${API_BASE_URL}/api/v1/threat-intel/graph?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch attack graph");
  return res.json();
}

export async function fetchModels() {
  const res = await fetch(`${API_BASE_URL}/api/v1/models`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function trainModel(modelType: string, epochs: number = 20) {
  const res = await fetch(`${API_BASE_URL}/api/v1/models/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_type: modelType, epochs })
  });
  if (!res.ok) throw new Error("Failed to train model");
  return res.json();
}

export async function fetchApprovals() {
  const res = await fetch(`${API_BASE_URL}/api/v1/response/approvals`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
}

export async function decideApproval(approvalId: string, decision: "approved" | "rejected") {
  const res = await fetch(`${API_BASE_URL}/api/v1/response/approvals/${approvalId}/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, approver_user: "Incident Commander (Marcus Vance)" })
  });
  if (!res.ok) throw new Error("Failed to submit approval decision");
  return res.json();
}

export async function executeDefensiveAction(actionType: string, targetEntity: string, incidentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/response/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action_type: actionType, target_entity: targetEntity, incident_id: incidentId, simulate_only: true })
  });
  if (!res.ok) throw new Error("Failed to execute defensive action");
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE_URL}/api/v1/observability/audit-logs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

// Human-in-the-Loop & Explainable AI
export async function submitHumanFeedback(data: {
  target_type: string;
  target_id: string;
  verdict: string;
  analyst_name?: string;
  confidence?: number;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/models/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to submit human feedback");
  return res.json();
}

export async function fetchHumanFeedback() {
  const res = await fetch(`${API_BASE_URL}/api/v1/models/feedback`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch human feedback history");
  return res.json();
}

export async function fineTuneWithHumanFeedback() {
  const res = await fetch(`${API_BASE_URL}/api/v1/models/fine-tune-human`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to execute human active learning fine-tuning");
  return res.json();
}

export async function fetchSensitivityCurve() {
  const res = await fetch(`${API_BASE_URL}/api/v1/models/sensitivity-curve`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sensitivity curve");
  return res.json();
}

export async function fetchEventExplanation(eventId: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/models/explain/${eventId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch feature explanation");
  return res.json();
}

export async function addIncidentNote(incidentId: string, noteData: { analyst_name?: string; role?: string; note: string }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(noteData)
  });
  if (!res.ok) throw new Error("Failed to add incident note");
  return res.json();
}

