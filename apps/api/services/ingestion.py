import csv
import io
import json
import uuid
from datetime import datetime, timezone, timedelta
from apps.api.database import get_db
from apps.api.services.detection import process_and_alert_event

SCENARIOS = {
    "brute_force_lateral": {
        "name": "Scenario A: Distributed SSH/RDP Brute Force -> Lateral Movement",
        "description": "Adversary spray against service account from Tor exit node followed by interactive session.",
        "events": [
            {
                "category": "authentication",
                "action": "login_attempt",
                "outcome": "failure",
                "src_ip": "185.220.101.5",
                "dst_ip": "10.0.1.15",
                "user_id": "root",
                "host_id": "prod-api-srv-02",
                "src_port": 49201,
                "dst_port": 22,
                "process_name": "sshd",
                "raw_payload": "Failed password for invalid user root from 185.220.101.5 port 49201 ssh2"
            },
            {
                "category": "authentication",
                "action": "login_attempt",
                "outcome": "failure",
                "src_ip": "185.220.101.5",
                "dst_ip": "10.0.1.15",
                "user_id": "admin",
                "host_id": "prod-api-srv-02",
                "src_port": 49205,
                "dst_port": 22,
                "process_name": "sshd",
                "raw_payload": "Failed password for admin from 185.220.101.5 port 49205 ssh2"
            },
            {
                "category": "authentication",
                "action": "login_attempt",
                "outcome": "failure",
                "src_ip": "185.220.101.5",
                "dst_ip": "10.0.1.15",
                "user_id": "svc_deploy",
                "host_id": "prod-api-srv-02",
                "src_port": 49210,
                "dst_port": 22,
                "process_name": "sshd",
                "raw_payload": "Failed password for svc_deploy from 185.220.101.5 port 49210 ssh2"
            },
            {
                "category": "authentication",
                "action": "login_attempt",
                "outcome": "success",
                "src_ip": "185.220.101.5",
                "dst_ip": "10.0.1.15",
                "user_id": "svc_deploy",
                "host_id": "prod-api-srv-02",
                "src_port": 49212,
                "dst_port": 22,
                "process_name": "sshd",
                "raw_payload": "Accepted password for svc_deploy from 185.220.101.5 port 49212 ssh2"
            },
            {
                "category": "administrative",
                "action": "privilege_escalate",
                "outcome": "success",
                "src_ip": "10.0.1.15",
                "dst_ip": "10.0.1.15",
                "user_id": "svc_deploy",
                "host_id": "prod-api-srv-02",
                "src_port": 22,
                "dst_port": 0,
                "process_name": "sudo",
                "raw_payload": "svc_deploy : TTY=pts/0 ; PWD=/tmp ; USER=root ; COMMAND=/bin/bash"
            }
        ]
    },
    "c2_exfiltration": {
        "name": "Scenario B: FIN7 Command & Control Beaconing and Large Egress",
        "description": "High-volume egress over port 4444 to confirmed malicious IP infrastructure.",
        "events": [
            {
                "category": "network",
                "action": "traffic_flow",
                "outcome": "success",
                "src_ip": "10.0.1.15",
                "dst_ip": "194.26.29.112",
                "user_id": "svc_deploy",
                "host_id": "prod-api-srv-02",
                "src_port": 54120,
                "dst_port": 4444,
                "process_name": "powershell.exe",
                "raw_payload": "Outbound TCP connection established to 194.26.29.112:4444; 142MB payload transferred"
            }
        ]
    },
    "normal_baseline": {
        "name": "Scenario C: Benign Business Telemetry (Normal Traffic)",
        "description": "Routine authorized web traffic and normal scheduled cron jobs.",
        "events": [
            {
                "category": "network",
                "action": "web_access",
                "outcome": "success",
                "src_ip": "10.0.2.40",
                "dst_ip": "10.0.1.10",
                "user_id": "dev_alex",
                "host_id": "web-gateway-01",
                "src_port": 50110,
                "dst_port": 443,
                "process_name": "nginx",
                "raw_payload": "GET /api/v1/health HTTP/1.1 200 OK"
            },
            {
                "category": "authentication",
                "action": "login_attempt",
                "outcome": "success",
                "src_ip": "192.168.1.105",
                "dst_ip": "10.0.1.10",
                "user_id": "dev_alex",
                "host_id": "web-gateway-01",
                "src_port": 50220,
                "dst_port": 443,
                "process_name": "sssd",
                "raw_payload": "SSO OAuth token validated successfully for user dev_alex"
            }
        ]
    }
}

SCENARIO_ALIASES = {
    "brute_force_attack": "brute_force_lateral",
    "brute_force": "brute_force_lateral",
    "c2": "c2_exfiltration",
    "c2_beacon": "c2_exfiltration",
    "normal": "normal_baseline",
    "baseline": "normal_baseline",
}

def inject_scenario(scenario_key: str) -> list[dict]:
    """Inject pre-built scenario events into pipeline."""
    normalized_key = SCENARIO_ALIASES.get(scenario_key, scenario_key)
    scenario = SCENARIOS.get(normalized_key)
    if not scenario:
        valid_keys = list(SCENARIOS.keys())
        raise ValueError(f"Unknown scenario: {scenario_key}. Valid options: {valid_keys}")
        
    results = []
    base_time = datetime.now(timezone.utc) - timedelta(minutes=len(scenario["events"]))
    for idx, ev in enumerate(scenario["events"]):
        ev_copy = dict(ev)
        ev_copy["id"] = f"evt-{uuid.uuid4().hex[:10]}"
        ev_copy["timestamp"] = (base_time + timedelta(seconds=idx * 25)).isoformat()
        res = process_and_alert_event(ev_copy)
        results.append(res)
        
    return results

def parse_and_ingest_json(raw_json_str: str) -> list[dict]:
    """Parse JSON or NDJSON and ingest events."""
    events = []
    try:
        # Try JSON array first
        data = json.loads(raw_json_str)
        if isinstance(data, list):
            events = data
        elif isinstance(data, dict):
            events = [data]
    except Exception:
        # Try NDJSON
        for line in raw_json_str.strip().split("\n"):
            line = line.strip()
            if line:
                events.append(json.loads(line))
                
    results = []
    for ev in events:
        res = process_and_alert_event(ev)
        results.append(res)
    return results

def parse_and_ingest_csv(raw_csv_str: str) -> list[dict]:
    """Parse CSV format telemetry and ingest canonical fields."""
    reader = csv.DictReader(io.StringIO(raw_csv_str))
    results = []
    for row in reader:
        event = {
            "category": row.get("category", "network"),
            "action": row.get("action", "traffic_flow"),
            "outcome": row.get("outcome", "success"),
            "src_ip": row.get("src_ip"),
            "dst_ip": row.get("dst_ip"),
            "src_port": int(row.get("src_port")) if row.get("src_port") else 80,
            "dst_port": int(row.get("dst_port")) if row.get("dst_port") else 80,
            "user_id": row.get("user_id"),
            "host_id": row.get("host_id"),
            "process_name": row.get("process_name"),
            "raw_payload": row.get("raw_payload", json.dumps(row))
        }
        res = process_and_alert_event(event)
        results.append(res)
    return results
