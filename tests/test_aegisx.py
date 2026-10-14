import pytest
from apps.api.database import init_db, get_db
from apps.api.services.detection import evaluate_event_pipeline, process_and_alert_event
from apps.api.services.rag_engine import search_knowledge
from apps.api.services.threat_intel import match_threat_intel
from apps.api.services.agents import multi_agent_coordinator
from apps.api.services.response_engine import execute_defensive_action

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_threat_intel_ioc_match():
    # 185.220.101.5 is a known APT29 indicator seeded in DB
    event = {
        "src_ip": "185.220.101.5",
        "dst_ip": "10.0.1.15",
        "action": "traffic_flow"
    }
    matches = match_threat_intel(event)
    assert len(matches) > 0
    assert matches[0]["threat_actor"] == "APT29 (Midnight Blizzard)"

def test_five_layer_detection_pipeline():
    # Test high-risk brute-force & suspicious port event
    event = {
        "action": "login_attempt",
        "outcome": "failure",
        "src_ip": "185.220.101.5",
        "dst_ip": "10.0.1.15",
        "dst_port": 4444,
        "user_id": "root",
        "host_id": "test-box",
        "process_name": "mimikatz"
    }
    result = evaluate_event_pipeline(event)
    assert result["is_anomaly"] == 1
    assert result["risk_score"] > 60.0
    assert result["severity"] in ["high", "critical"]
    assert len(result["reason_codes"]) > 0
    # Check that both ML and DL generated scores
    assert "isolation_forest_score" in result["ml_result"]
    assert "reconstruction_error" in result["dl_result"]

def test_rag_semantic_search_and_citations():
    query = "How do I isolate a host and contain brute force credentials?"
    citations = search_knowledge(query, top_k=2)
    assert len(citations) > 0
    assert any("Playbook" in c["document_title"] for c in citations)
    assert citations[0]["similarity_score"] > 0.0
    assert len(citations[0]["content"]) > 30

def test_event_alert_and_incident_generation():
    event = {
        "action": "login_attempt",
        "outcome": "failure",
        "src_ip": "185.220.101.5",
        "dst_ip": "10.0.1.15",
        "user_id": "svc_test",
        "host_id": "test-api-host",
        "process_name": "sshd"
    }
    res = process_and_alert_event(event)
    assert res["event_id"] is not None
    assert res["alert"] is not None
    assert res["incident_id"] is not None

def test_multi_agent_investigation():
    # Fetch an existing incident
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM incidents LIMIT 1")
        row = cursor.fetchone()
        
    incident_id = row["id"]
    agent_runs = multi_agent_coordinator.investigate_incident(incident_id)
    assert len(agent_runs) == 7
    agent_names = [r["agent_name"] for r in agent_runs]
    assert "Triage Agent" in agent_names
    assert "Threat Intelligence Agent" in agent_names
    assert "Behavioral Analysis Agent" in agent_names
    assert "Knowledge Research Agent" in agent_names
    assert "Correlation & Graph Agent" in agent_names
    assert "Response Planning Agent" in agent_names
    assert "Incident Report Agent" in agent_names

def test_defensive_action_execution_sandbox():
    res = execute_defensive_action(
        action_type="isolate_endpoint",
        target_entity="prod-api-srv-02",
        parameters={"duration_hours": 4},
        actor="test_runner",
        simulate=True
    )
    assert res["execution_status"] == "simulated_success"
    assert "quarantined" in res["status_message"].lower() or "completed" in res["status_message"].lower()

def test_explainable_ai_feature_contributions():
    from apps.api.services.ml_models import ml_registry
    event = {
        "action": "login_attempt",
        "outcome": "failure",
        "user_id": "root",
        "dst_port": 4444,
        "process_name": "mimikatz"
    }
    pred = ml_registry.predict_anomaly(event)
    assert "feature_contributions" in pred
    assert len(pred["feature_contributions"]) > 0
    # Check that top risk drivers have plain-English human rationale
    top_driver = pred["feature_contributions"][0]
    assert "human_explanation" in top_driver
    assert "impact_percentage" in top_driver
    assert top_driver["direction"] in ["risk_increase", "risk_decrease"]

def test_human_active_learning_and_sensitivity_curve():
    from apps.api.services.ml_models import ml_registry
    # Test sensitivity & fatigue calculation
    curve = ml_registry.get_sensitivity_curve()
    assert len(curve) >= 5
    assert "alerts_per_shift" in curve[0]
    assert "analyst_fatigue_status" in curve[0]
    
    # Test active learning recalibration with human feedback
    metrics = ml_registry.retrain_with_human_feedback(n_synthetic_base=300)
    assert metrics["human_calibrated"] is True
    assert metrics["analyst_agreement_rate"] >= 0.90
    assert "v1.4.2" in metrics["model_version"]

def test_attack_scenario_injection():
    from apps.api.services.ingestion import inject_scenario
    # Test valid scenario injection
    results = inject_scenario("brute_force_lateral")
    assert len(results) == 5
    assert any(r["alert"] is not None for r in results)
    # Test alias resolution
    alias_results = inject_scenario("brute_force_attack")
    assert len(alias_results) == 5

def test_api_health_and_observability():
    from fastapi.testclient import TestClient
    from apps.api.main import app
    client = TestClient(app)
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "sqlite_wal_database" in data["services"]
    
    metrics_res = client.get("/api/v1/observability/metrics")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()
    assert "total_events" in metrics_data


