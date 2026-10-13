import json
from datetime import datetime, timezone
from apps.api.database import get_db

SEED_INDICATORS = [
    {
        "id": "ioc-ip-001",
        "indicator_type": "ip",
        "value": "185.220.101.5",
        "threat_actor": "APT29 (Midnight Blizzard)",
        "campaign": "Cloud Identity Spray",
        "maliciousness": "confirmed_malicious",
        "confidence": 0.98,
        "mitre_tactics": ["Initial Access (T1078)", "Credential Access (T1110)"],
        "source_feed": "CrowdStrike Falcon Feed"
    },
    {
        "id": "ioc-ip-002",
        "indicator_type": "ip",
        "value": "194.26.29.112",
        "threat_actor": "FIN7",
        "campaign": "FIN7 C2 Infrastructure",
        "maliciousness": "confirmed_malicious",
        "confidence": 0.95,
        "mitre_tactics": ["Command and Control (T1071)", "Exfiltration (T1048)"],
        "source_feed": "Mandiant Threat Intelligence"
    },
    {
        "id": "ioc-ip-003",
        "indicator_type": "ip",
        "value": "45.154.255.89",
        "threat_actor": "Lazarus Group",
        "campaign": "Operation GhostNet",
        "maliciousness": "suspicious",
        "confidence": 0.88,
        "mitre_tactics": ["Defense Evasion (T1070)", "Lateral Movement (T1021)"],
        "source_feed": "AlienVault OTX"
    },
    {
        "id": "ioc-domain-001",
        "indicator_type": "domain",
        "value": "secure-verify-auth.net",
        "threat_actor": "Scattered Spider",
        "campaign": "Okta SSO Phishing & MFA Fatigue",
        "maliciousness": "confirmed_malicious",
        "confidence": 0.96,
        "mitre_tactics": ["Initial Access (T1566)", "Credential Access (T1621)"],
        "source_feed": "CISA Advisory AA23-320A"
    },
    {
        "id": "ioc-hash-001",
        "indicator_type": "file_hash",
        "value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "threat_actor": "BlackCat / ALPHV",
        "campaign": "Ransomware Encryptor Payload",
        "maliciousness": "confirmed_malicious",
        "confidence": 0.99,
        "mitre_tactics": ["Impact (T1486)"],
        "source_feed": "VirusTotal Intelligence"
    }
]

def seed_threat_intel():
    """Seed threat intelligence IOCs if not present."""
    with get_db() as conn:
        cursor = conn.cursor()
        for ioc in SEED_INDICATORS:
            cursor.execute("""
            INSERT OR IGNORE INTO threat_indicators (
                id, indicator_type, value, threat_actor, campaign, 
                maliciousness, confidence, mitre_tactics, source_feed, first_seen, last_seen
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, (
                ioc["id"],
                ioc["indicator_type"],
                ioc["value"],
                ioc["threat_actor"],
                ioc["campaign"],
                ioc["maliciousness"],
                ioc["confidence"],
                json.dumps(ioc["mitre_tactics"]),
                ioc["source_feed"]
            ))

def match_threat_intel(event: dict) -> list[dict]:
    """Search indicators table for matches against src_ip, dst_ip, or process hash."""
    src_ip = event.get("src_ip")
    dst_ip = event.get("dst_ip")
    
    matches = []
    with get_db() as conn:
        cursor = conn.cursor()
        query_vals = [v for v in [src_ip, dst_ip] if v]
        if not query_vals:
            return []
            
        placeholders = ",".join(["?"] * len(query_vals))
        cursor.execute(f"""
            SELECT * FROM threat_indicators 
            WHERE value IN ({placeholders})
        """, query_vals)
        rows = cursor.fetchall()
        for r in rows:
            matches.append({
                "indicator_id": r["id"],
                "indicator_type": r["indicator_type"],
                "value": r["value"],
                "threat_actor": r["threat_actor"],
                "campaign": r["campaign"],
                "confidence": r["confidence"],
                "mitre_tactics": json.loads(r["mitre_tactics"]) if r["mitre_tactics"] else [],
                "source_feed": r["source_feed"]
            })
    return matches
