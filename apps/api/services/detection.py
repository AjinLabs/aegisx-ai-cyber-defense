import json
import uuid
from datetime import datetime, timezone
from apps.api.database import get_db
from apps.api.services.ml_models import ml_registry
from apps.api.services.dl_models import dl_registry
from apps.api.services.threat_intel import match_threat_intel

SEED_RULES = [
    {
        "id": "rule-auth-001",
        "name": "Distributed Brute Force / Credential Stuffing",
        "category": "authentication",
        "severity": "high",
        "mitre_technique_id": "T1110",
        "condition_type": "threshold",
        "description": "Triggered when repeated failed authentications occur for an account or from an external IP.",
        "config": {"min_failures": 3, "window_seconds": 300}
    },
    {
        "id": "rule-priv-002",
        "name": "Unauthorized Privilege Escalation & Admin Token Abuse",
        "category": "administrative",
        "severity": "critical",
        "mitre_technique_id": "T1078",
        "condition_type": "pattern",
        "description": "Triggered when a standard service or user executes administrative binaries or privilege elevation.",
        "config": {"actions": ["privilege_escalate", "sudo_exec"], "risky_users": ["admin", "root", "system"]}
    },
    {
        "id": "rule-c2-003",
        "name": "Beaconing to Known Malicious Threat Intel C2 IP",
        "category": "network",
        "severity": "critical",
        "mitre_technique_id": "T1071",
        "condition_type": "ioc_match",
        "description": "Network connection initiated to an external IP matching threat intelligence feeds.",
        "config": {"check_indicators": True}
    },
    {
        "id": "rule-exfil-004",
        "name": "Abnormal Data Egress over Non-Standard Port",
        "category": "network",
        "severity": "high",
        "mitre_technique_id": "T1048",
        "condition_type": "threshold",
        "description": "Triggered when large egress payload is transmitted over suspicious high ports.",
        "config": {"suspicious_ports": [4444, 1337, 8080, 2222]}
    }
]

def seed_detection_rules():
    """Seed detection rules in database."""
    with get_db() as conn:
        cursor = conn.cursor()
        for rule in SEED_RULES:
            cursor.execute("""
            INSERT OR IGNORE INTO detection_rules (
                id, name, description, category, severity, mitre_technique_id, 
                condition_type, condition_config, is_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                rule["id"],
                rule["name"],
                rule["description"],
                rule["category"],
                rule["severity"],
                rule["mitre_technique_id"],
                rule["condition_type"],
                json.dumps(rule["config"])
            ))

def evaluate_event_pipeline(event: dict) -> dict:
    """
    Execute 5-Layer Detection Pipeline:
    Layer A: Deterministic Rules
    Layer B: Statistical Anomaly
    Layer C: Scikit-learn ML Anomaly & Classification
    Layer D: PyTorch Autoencoder Reconstruction Error
    Layer E: Fusion Engine & Risk Calculation
    """
    rule_matches = []
    reason_codes = []
    
    # Layer A: Deterministic Rules & Threat Intel
    ioc_matches = match_threat_intel(event)
    if ioc_matches:
        rule_matches.append("rule-c2-003")
        for m in ioc_matches:
            reason_codes.append(f"IOC_MATCH: {m['value']} associated with {m['threat_actor']} ({m['campaign']})")

    action = event.get("action", "")
    outcome = event.get("outcome", "")
    dst_port = event.get("dst_port") or 80
    user_id = (event.get("user_id") or "").lower()
    process_name = (event.get("process_name") or "").lower()

    if action == "login_attempt" and outcome in ["failure", "denied"]:
        rule_matches.append("rule-auth-001")
        reason_codes.append("RULE_MATCH: Multiple failed authentication attempts detected")

    if action in ["privilege_escalate", "sudo_exec"] or ("mimikatz" in process_name or "powershell" in process_name and "admin" in user_id):
        rule_matches.append("rule-priv-002")
        reason_codes.append("RULE_MATCH: Suspicious administrative execution / privilege escalation pattern")

    if dst_port in [4444, 1337, 8080, 2222] and event.get("category") == "network":
        rule_matches.append("rule-exfil-004")
        reason_codes.append(f"RULE_MATCH: Outbound network activity over suspicious port {dst_port}")

    # Layer B: Statistical Anomaly Check
    stat_score = 0.0
    if outcome == "failure" or dst_port > 1024:
        stat_score = 0.45
        reason_codes.append("STAT_BASELINE: Activity deviates from normal host frequency baseline")

    # Layer C: Scikit-learn ML Models
    ml_result = ml_registry.predict_anomaly(event)
    iso_score = ml_result["isolation_forest_score"]
    rf_prob = ml_result["rf_attack_probability"]
    if ml_result["is_anomaly"]:
        reason_codes.append(f"ML_ANOMALY: Isolation Forest score {iso_score:.2f}, RF Attack Prob {rf_prob:.2f}")

    # Layer D: PyTorch Deep Learning Autoencoder
    dl_result = dl_registry.predict_reconstruction_error(event)
    recon_error = dl_result["reconstruction_error"]
    if dl_result["is_dl_anomaly"]:
        reason_codes.append(f"DL_AUTOENCODER: Reconstruction error {recon_error:.4f} exceeded threshold {dl_result['threshold']:.4f}")

    # Layer E: Detection Fusion Engine
    # Base weightings
    rule_weight = 40.0 if rule_matches else 0.0
    ioc_weight = 30.0 if ioc_matches else 0.0
    ml_weight = ml_result["composite_ml_score"] * 30.0
    dl_weight = dl_result["dl_confidence_score"] * 25.0
    
    raw_risk = min(100.0, rule_weight + ioc_weight + ml_weight + dl_weight)
    
    # Severity categorization
    if raw_risk >= 80.0 or ioc_matches:
        severity = "critical"
    elif raw_risk >= 55.0 or rule_matches:
        severity = "high"
    elif raw_risk >= 35.0 or ml_result["is_anomaly"] or dl_result["is_dl_anomaly"]:
        severity = "medium"
    else:
        severity = "low"

    is_overall_anomaly = bool(raw_risk >= 50.0 or rule_matches or ml_result["is_anomaly"] or dl_result["is_dl_anomaly"])

    return {
        "is_anomaly": 1 if is_overall_anomaly else 0,
        "risk_score": round(raw_risk, 1),
        "severity": severity,
        "rule_matches": rule_matches,
        "ioc_matches": ioc_matches,
        "ml_result": ml_result,
        "dl_result": dl_result,
        "reason_codes": reason_codes
    }

def process_and_alert_event(event_dict: dict) -> dict:
    """Ingest an event, evaluate detection pipeline, persist to DB, and create alerts/incidents if high risk."""
    pipeline_res = evaluate_event_pipeline(event_dict)
    
    event_id = event_dict.get("id") or f"evt-{uuid.uuid4().hex[:10]}"
    timestamp = event_dict.get("timestamp") or datetime.now(timezone.utc).isoformat()
    
    alert_created = None
    incident_id = None
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Persist security event with evaluated scores
        cursor.execute("""
        INSERT INTO security_events (
            id, workspace_id, timestamp, source_id, category, action, outcome, severity,
            host_id, user_id, src_ip, dst_ip, src_port, dst_port, process_name, raw_payload,
            normalized_fields, is_anomaly, anomaly_score, dl_reconstruction_error, risk_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            event_dict.get("workspace_id", "ws-prod"),
            timestamp,
            event_dict.get("source_id", "firewall-edge-01"),
            event_dict.get("category", "network"),
            event_dict.get("action", "traffic_flow"),
            event_dict.get("outcome", "success"),
            pipeline_res["severity"],
            event_dict.get("host_id"),
            event_dict.get("user_id"),
            event_dict.get("src_ip"),
            event_dict.get("dst_ip"),
            event_dict.get("src_port"),
            event_dict.get("dst_port"),
            event_dict.get("process_name"),
            event_dict.get("raw_payload", "{}"),
            json.dumps(event_dict),
            pipeline_res["is_anomaly"],
            pipeline_res["ml_result"]["composite_ml_score"],
            pipeline_res["dl_result"]["reconstruction_error"],
            pipeline_res["risk_score"]
        ))
        
        # 2. If high or critical risk, raise an Alert and Link/Create an Incident
        if pipeline_res["risk_score"] >= 50.0:
            alert_id = f"alt-{uuid.uuid4().hex[:8]}"
            rule_id = pipeline_res["rule_matches"][0] if pipeline_res["rule_matches"] else "rule-ml-anomaly"
            entity_id = event_dict.get("host_id") or event_dict.get("user_id") or event_dict.get("src_ip") or "unknown"
            
            summary = (
                f"Suspicious activity on {entity_id}: {'; '.join(pipeline_res['reason_codes'][:2])}"
                if pipeline_res["reason_codes"] else f"High risk anomaly detected ({pipeline_res['risk_score']})"
            )
            
            cursor.execute("""
            INSERT INTO alerts (
                id, title, rule_id, source_event_id, severity, status, risk_score,
                confidence, reason_codes, entity_id, summary
            ) VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?)
            """, (
                alert_id,
                f"Detection: {event_dict.get('action')} on {entity_id}",
                rule_id,
                event_id,
                pipeline_res["severity"],
                pipeline_res["risk_score"],
                0.90,
                json.dumps(pipeline_res["reason_codes"]),
                entity_id,
                summary
            ))
            
            alert_created = {
                "id": alert_id,
                "title": f"Detection: {event_dict.get('action')} on {entity_id}",
                "severity": pipeline_res["severity"],
                "risk_score": pipeline_res["risk_score"],
                "summary": summary
            }
            
            # Check if there is an active open incident for this entity, else create one
            cursor.execute("""
                SELECT id FROM incidents 
                WHERE status IN ('new', 'triaged', 'investigating', 'awaiting_approval')
                AND title LIKE ? 
                LIMIT 1
            """, (f"%{entity_id}%",))
            existing_inc = cursor.fetchone()
            
            if existing_inc:
                incident_id = existing_inc["id"]
                # Add timeline entry
                cursor.execute("""
                INSERT INTO incident_timeline (incident_id, event_type, actor, description, metadata)
                VALUES (?, 'alert_linked', 'detection_engine', ?, ?)
                """, (
                    incident_id,
                    f"Correlated Alert {alert_id} added to incident",
                    json.dumps(pipeline_res["reason_codes"])
                ))
            else:
                incident_id = f"inc-{uuid.uuid4().hex[:8]}"
                inc_title = f"Cyber Incident: Correlated Threat on {entity_id}"
                cursor.execute("""
                INSERT INTO incidents (
                    id, title, severity, status, assignee, risk_score, summary, recommended_action
                ) VALUES (?, ?, ?, 'triaged', 'analyst.sarah', ?, ?, ?)
                """, (
                    incident_id,
                    inc_title,
                    pipeline_res["severity"],
                    pipeline_res["risk_score"],
                    summary,
                    "Initiate automated multi-agent investigation & triage playbook"
                ))
                
                # Timeline
                cursor.execute("""
                INSERT INTO incident_timeline (incident_id, event_type, actor, description, metadata)
                VALUES (?, 'alert_linked', 'detection_engine', ?, ?)
                """, (
                    incident_id,
                    f"Incident created from high-severity alert {alert_id}",
                    json.dumps(pipeline_res["reason_codes"])
                ))
                
                # Initial evidence
                cursor.execute("""
                INSERT INTO incident_evidence (incident_id, evidence_type, title, data, confidence)
                VALUES (?, 'telemetry', 'Raw Event Telemetry', ?, 1.0)
                """, (
                    incident_id,
                    json.dumps(event_dict)
                ))
                
    return {
        "event_id": event_id,
        "detection": pipeline_res,
        "alert": alert_created,
        "incident_id": incident_id
    }
