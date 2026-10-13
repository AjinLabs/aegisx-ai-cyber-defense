import json
import logging
from apps.api.database import init_db, get_db
from apps.api.services.detection import seed_detection_rules
from apps.api.services.threat_intel import seed_threat_intel
from apps.api.services.rag_engine import seed_knowledge_base
from apps.api.services.response_engine import seed_response_actions
from apps.api.services.ml_models import ml_registry
from apps.api.services.dl_models import dl_registry
from apps.api.services.ingestion import inject_scenario

logger = logging.getLogger("aegisx.seeds")

def seed_users_and_workspaces():
    with get_db() as conn:
        cursor = conn.cursor()
        # Workspaces
        cursor.execute("""
        INSERT OR IGNORE INTO workspaces (id, name, organization, description)
        VALUES ('ws-prod', 'Global SOC Operations', 'AEGISX Cyber Command', 'Primary 24/7 Security Operations Center workspace')
        """)
        
        # Seed users
        users = [
            ("usr-01", "sarah.chen@aegisx.corp", "Sarah Chen", "soc_analyst", "argon2_hash_mock"),
            ("usr-02", "marcus.vance@aegisx.corp", "Marcus Vance", "incident_commander", "argon2_hash_mock"),
            ("usr-03", "elena.rostova@aegisx.corp", "Elena Rostova", "threat_hunter", "argon2_hash_mock"),
            ("usr-04", "admin@aegisx.corp", "System Administrator", "admin", "argon2_hash_mock")
        ]
        for u in users:
            cursor.execute("""
            INSERT OR IGNORE INTO users (id, email, name, role, password_hash, workspace_id)
            VALUES (?, ?, ?, ?, ?, 'ws-prod')
            """, u)

def seed_human_feedback_and_notes():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM incidents LIMIT 1")
        inc = cursor.fetchone()
        if inc:
            inc_id = inc["id"]
            cursor.execute("SELECT COUNT(*) as cnt FROM incident_notes WHERE incident_id = ?", (inc_id,))
            if cursor.fetchone()["cnt"] == 0:
                cursor.execute("""
                INSERT INTO incident_notes (incident_id, analyst_name, role, note)
                VALUES 
                (?, 'Sarah Chen', 'SOC Analyst L2', 'Observed initial failed credential cascade from external IP 185.220.101.5. Correlating with geo-location mismatch against known corporate VPN.'),
                (?, 'Marcus Vance', 'Threat Hunter', 'Verified MITRE technique T1110.001. Adversary attempted password spraying across svc_backup and svc_api before targeting admin. Recommending host isolation.'),
                (?, 'Elena Rostova', 'MLOps Specialist', 'Model confidence calibrated at 94.2%. Isolation forest anomaly barrier crossed. Human review confirms true positive attack pattern.')
                """, (inc_id, inc_id, inc_id))

        cursor.execute("SELECT COUNT(*) as cnt FROM human_feedback")
        if cursor.fetchone()["cnt"] == 0:
            cursor.execute("""
            INSERT INTO human_feedback (id, target_type, target_id, verdict, analyst_name, confidence, feature_critique, notes)
            VALUES
            ('fb-init-01', 'alert', 'alert-brute-force-01', 'confirmed_threat', 'Sarah Chen (SOC Lead)', 0.98, 'Failed login burst exceeded baseline by 800%', 'True Positive: Confirmed external credential spraying attack.'),
            ('fb-init-02', 'alert', 'alert-c2-beacon-02', 'confirmed_threat', 'Marcus Vance (Hunter)', 0.95, 'Port 4444 outbound traffic matched APT29 beacon timing', 'True Positive: Verified malicious C2 communication.'),
            ('fb-init-03', 'event', 'evt-benign-cron-03', 'false_positive', 'Sarah Chen (SOC Lead)', 0.90, 'Nightly automated backup script flagged as off-hours burst', 'False Positive: Scheduled automated ETL backup pipeline on authorized server.'),
            ('fb-init-04', 'alert', 'alert-sudo-exec-04', 'policy_exemption', 'Elena Rostova (L3)', 0.92, 'Authorized IT administrator performing emergency database patch', 'Policy Exemption: Change management ticket CHG-8821 verified.')
            """)

def populate_initial_state():
    """Initializes tables, seeds all domain data, and runs initial demonstration incident."""
    print("Initialising AEGISX database tables...")
    init_db()
    
    print("Seeding users and workspaces...")
    seed_users_and_workspaces()
    
    print("Seeding detection rules...")
    seed_detection_rules()
    
    print("Seeding threat intelligence IOCs...")
    seed_threat_intel()
    
    print("Seeding RAG knowledge playbooks...")
    seed_knowledge_base()
    
    print("Seeding defensive response actions...")
    seed_response_actions()
    
    print("Verifying Scikit-learn ML & PyTorch Deep Learning models...")
    _ = ml_registry.metrics
    _ = dl_registry.metrics
    
    # Check if any events exist; if not, inject the initial realistic cyber incident!
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM security_events")
        row = cursor.fetchone()
        if row["cnt"] == 0:
            print("Injecting initial demonstration attack scenario: 'brute_force_lateral'...")
            inject_scenario("brute_force_lateral")
            print("Injecting initial baseline scenario: 'normal_baseline'...")
            inject_scenario("normal_baseline")
            
    print("Seeding human feedback and analyst case notes...")
    seed_human_feedback_and_notes()
    
    print("AEGISX state populated successfully.")

if __name__ == "__main__":
    populate_initial_state()

