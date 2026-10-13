from apps.api.database import get_db

def get_investigation_graph(incident_id: str = None) -> dict:
    """
    Build structured node-edge graph for React Flow visualization
    representing the attack chain and correlated entities.
    """
    nodes = [
        {
            "id": "node-attacker-ip",
            "type": "customNode",
            "data": {
                "label": "185.220.101.5",
                "sublabel": "Threat Actor Ingress IP",
                "category": "ip",
                "severity": "critical",
                "badge": "APT29 IOC",
                "details": "Known Tor exit node & cloud spray infrastructure"
            },
            "position": {"x": 50, "y": 180}
        },
        {
            "id": "node-user-svc",
            "type": "customNode",
            "data": {
                "label": "svc_deploy",
                "sublabel": "Service Account",
                "category": "user",
                "severity": "high",
                "badge": "Compromised Identity",
                "details": "Failed auth x14 -> elevated token issuance"
            },
            "position": {"x": 320, "y": 180}
        },
        {
            "id": "node-host-api",
            "type": "customNode",
            "data": {
                "label": "prod-api-srv-02",
                "sublabel": "Linux Production Workstation",
                "category": "host",
                "severity": "critical",
                "badge": "Quarantine Target",
                "details": "High CPU burst, unauthorized sudo invocation"
            },
            "position": {"x": 600, "y": 180}
        },
        {
            "id": "node-proc-ps",
            "type": "customNode",
            "data": {
                "label": "powershell -enc",
                "sublabel": "Spawned Binary",
                "category": "process",
                "severity": "high",
                "badge": "Defense Evasion",
                "details": "Base64 encoded payload dumping memory handles"
            },
            "position": {"x": 600, "y": 360}
        },
        {
            "id": "node-c2-ip",
            "type": "customNode",
            "data": {
                "label": "194.26.29.112:4444",
                "sublabel": "Active C2 Egress",
                "category": "ip",
                "severity": "critical",
                "badge": "FIN7 Infrastructure",
                "details": "128MB payload egress over port 4444"
            },
            "position": {"x": 880, "y": 180}
        },
        {
            "id": "node-db-asset",
            "type": "customNode",
            "data": {
                "label": "db-customer-vault-01",
                "sublabel": "Protected Relational Store",
                "category": "host",
                "severity": "medium",
                "badge": "Target Asset",
                "details": "Read query spikes from compromised API worker"
            },
            "position": {"x": 600, "y": 20}
        }
    ]

    edges = [
        {
            "id": "edge-1",
            "source": "node-attacker-ip",
            "target": "node-user-svc",
            "label": "T1110 Brute Force (Credential Spray)",
            "animated": True,
            "style": {"stroke": "#F15B6C", "strokeWidth": 2}
        },
        {
            "id": "edge-2",
            "source": "node-user-svc",
            "target": "node-host-api",
            "label": "T1078 Valid Credentials Sign-in",
            "animated": True,
            "style": {"stroke": "#F5B942", "strokeWidth": 2}
        },
        {
            "id": "edge-3",
            "source": "node-host-api",
            "target": "node-proc-ps",
            "label": "T1059.001 Execution",
            "animated": False,
            "style": {"stroke": "#5575FF", "strokeWidth": 2}
        },
        {
            "id": "edge-4",
            "source": "node-host-api",
            "target": "node-c2-ip",
            "label": "T1071 C2 Beaconing (Port 4444)",
            "animated": True,
            "style": {"stroke": "#F15B6C", "strokeWidth": 2}
        },
        {
            "id": "edge-5",
            "source": "node-host-api",
            "target": "node-db-asset",
            "label": "Attempted Lateral Data Staging",
            "animated": False,
            "style": {"stroke": "#94A3B8", "strokeWidth": 1.5, "strokeDasharray": "5 5"}
        }
    ]

    return {"nodes": nodes, "edges": edges}
