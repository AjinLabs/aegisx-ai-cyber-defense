import sqlite3
import json
import logging
from contextlib import contextmanager
from typing import Generator
from apps.api.config import DB_PATH

logger = logging.getLogger("aegisx.database")

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        val = row[idx]
        d[col[0]] = val
    return d

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0, check_same_thread=False)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error: {e}")
        raise
    finally:
        conn.close()

def init_db():
    """Create all core AEGISX tables and indices."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Identity & Tenancy
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'soc_analyst', -- soc_analyst, threat_hunter, incident_commander, security_engineer, admin
            password_hash TEXT NOT NULL,
            workspace_id TEXT NOT NULL DEFAULT 'ws-prod',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            organization TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 2. Telemetry & Ingestion
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_sources (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- syslog, json_file, windows_event, cloud_trail, firewall
            status TEXT NOT NULL DEFAULT 'active', -- active, degraded, paused
            events_ingested INTEGER DEFAULT 0,
            last_event_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS security_events (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL DEFAULT 'ws-prod',
            timestamp TIMESTAMP NOT NULL,
            ingestion_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source_id TEXT NOT NULL,
            category TEXT NOT NULL, -- authentication, network, endpoint, administrative, cloud
            action TEXT NOT NULL, -- login_attempt, privilege_escalate, port_scan, dns_query, file_access
            outcome TEXT NOT NULL, -- success, failure, denied, unknown
            severity TEXT NOT NULL DEFAULT 'low', -- informational, low, medium, high, critical
            host_id TEXT,
            user_id TEXT,
            src_ip TEXT,
            dst_ip TEXT,
            src_port INTEGER,
            dst_port INTEGER,
            process_name TEXT,
            raw_payload TEXT,
            normalized_fields TEXT, -- JSON
            is_anomaly INTEGER DEFAULT 0,
            anomaly_score REAL DEFAULT 0.0,
            dl_reconstruction_error REAL DEFAULT 0.0,
            risk_score REAL DEFAULT 0.0
        );
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON security_events(timestamp DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_category ON security_events(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_host ON security_events(host_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_user ON security_events(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_src_ip ON security_events(src_ip);")

        # 3. Detection Engine & Rules
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS detection_rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            severity TEXT NOT NULL, -- low, medium, high, critical
            mitre_technique_id TEXT, -- e.g. T1110 (Brute Force), T1078 (Valid Accounts)
            condition_type TEXT NOT NULL, -- threshold, pattern, sequence, ioc_match
            condition_config TEXT NOT NULL, -- JSON
            is_enabled INTEGER DEFAULT 1,
            trigger_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            rule_id TEXT,
            source_event_id TEXT,
            severity TEXT NOT NULL, -- low, medium, high, critical
            status TEXT NOT NULL DEFAULT 'new', -- new, triaged, investigating, resolved, closed
            risk_score REAL NOT NULL,
            confidence REAL NOT NULL DEFAULT 0.85,
            reason_codes TEXT, -- JSON list
            entity_id TEXT, -- e.g. host or user involved
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (rule_id) REFERENCES detection_rules(id)
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);")

        # 4. Incidents & Evidence
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            severity TEXT NOT NULL, -- low, medium, high, critical
            status TEXT NOT NULL DEFAULT 'triaged', -- new, triaged, investigating, awaiting_approval, contained, resolved, closed
            assignee TEXT,
            risk_score REAL NOT NULL,
            summary TEXT,
            recommended_action TEXT,
            sla_deadline TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS incident_timeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            event_type TEXT NOT NULL, -- alert_linked, agent_investigation, human_note, response_proposed, action_executed
            actor TEXT NOT NULL, -- agent:triage, soc_analyst, response_engine, etc.
            description TEXT NOT NULL,
            metadata TEXT, -- JSON
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS incident_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT NOT NULL,
            evidence_type TEXT NOT NULL, -- telemetry, threat_ioc, ml_prediction, rag_citation, graph_node
            title TEXT NOT NULL,
            data TEXT NOT NULL, -- JSON or string
            confidence REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );
        """)

        # 5. Threat Intelligence & Graph
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS threat_indicators (
            id TEXT PRIMARY KEY,
            indicator_type TEXT NOT NULL, -- ip, domain, file_hash, cve, url
            value TEXT NOT NULL UNIQUE,
            threat_actor TEXT,
            campaign TEXT,
            maliciousness TEXT NOT NULL, -- confirmed_malicious, suspicious, benign
            confidence REAL DEFAULT 0.9,
            mitre_tactics TEXT, -- JSON list
            source_feed TEXT NOT NULL,
            first_seen TIMESTAMP,
            last_seen TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL, -- user, host, ip, process, service
            name TEXT NOT NULL,
            criticality TEXT DEFAULT 'medium', -- low, medium, high, critical
            attributes TEXT, -- JSON
            risk_score REAL DEFAULT 0.0,
            last_observed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS entity_relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_entity_id TEXT NOT NULL,
            target_entity_id TEXT NOT NULL,
            relation_type TEXT NOT NULL, -- authenticated_from, connected_to, executed, triggered, accessed
            weight REAL DEFAULT 1.0,
            evidence_reference TEXT,
            observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 6. RAG Knowledge Base
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL, -- playbook, policy, compliance, threat_report, architecture
            source TEXT NOT NULL,
            classification TEXT DEFAULT 'internal',
            chunk_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            section_title TEXT,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding_json TEXT, -- JSON float array of vector embeddings
            tokens INTEGER DEFAULT 0,
            FOREIGN KEY (document_id) REFERENCES knowledge_documents(id)
        );
        """)

        # 7. Agentic AI Orchestration
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_runs (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            status TEXT NOT NULL, -- running, completed, failed
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            duration_ms REAL,
            input_context TEXT, -- JSON
            output_findings TEXT, -- JSON
            tool_calls_json TEXT, -- JSON
            tokens_used INTEGER DEFAULT 0,
            model_used TEXT DEFAULT 'aegisx-cyber-agent-v1',
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );
        """)

        # 8. ML/DL Models & MLOps
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ml_models (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            model_type TEXT NOT NULL, -- isolation_forest, random_forest, pytorch_autoencoder, lstm_seq
            version TEXT NOT NULL,
            framework TEXT NOT NULL, -- scikit-learn, pytorch
            status TEXT NOT NULL DEFAULT 'deployed', -- deployed, evaluated, training, deprecated
            metrics_json TEXT, -- JSON: precision, recall, f1, auc, reconstruction_loss
            drift_score REAL DEFAULT 0.02,
            artifact_path TEXT,
            trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 9. Controlled Defensive Response & Approval Queue
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS response_actions (
            id TEXT PRIMARY KEY,
            action_type TEXT NOT NULL, -- isolate_endpoint, revoke_user_session, block_firewall_ip, quarantine_file, create_ticket
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            risk_level TEXT NOT NULL, -- low, medium, high, critical
            requires_approval INTEGER DEFAULT 1,
            target_schema TEXT -- JSON
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS approval_requests (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            target_entity TEXT NOT NULL,
            parameters TEXT NOT NULL, -- JSON
            status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, executed, cancelled
            requester_agent TEXT NOT NULL,
            reasoning TEXT NOT NULL,
            approver_user TEXT,
            decision_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            decided_at TIMESTAMP,
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS response_runs (
            id TEXT PRIMARY KEY,
            approval_id TEXT,
            action_type TEXT NOT NULL,
            target_entity TEXT NOT NULL,
            execution_status TEXT NOT NULL, -- simulated_success, executed_success, failed
            simulated INTEGER DEFAULT 1,
            output_log TEXT,
            executed_by TEXT NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 10. Audit Logging & Observability
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT,
            status TEXT NOT NULL,
            details TEXT -- JSON
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metric_name TEXT NOT NULL,
            metric_value REAL NOT NULL,
            unit TEXT
        );
        """)

        # 11. Human-in-the-Loop Active Learning & Analyst Notes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS human_feedback (
            id TEXT PRIMARY KEY,
            target_type TEXT NOT NULL, -- alert, event, incident
            target_id TEXT NOT NULL,
            verdict TEXT NOT NULL, -- confirmed_threat, false_positive, policy_exemption, benign_anomaly
            analyst_name TEXT NOT NULL,
            confidence REAL NOT NULL DEFAULT 1.0,
            feature_critique TEXT, -- JSON notes
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS incident_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT NOT NULL,
            analyst_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'SOC Analyst',
            note TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
        );
        """)

    logger.info("Database initialized successfully.")
