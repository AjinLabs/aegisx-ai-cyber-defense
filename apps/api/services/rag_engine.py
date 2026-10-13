import json
import math
import re
import hashlib
import numpy as np
from apps.api.database import get_db

EMBEDDING_DIM = 64

def generate_dense_embedding(text: str) -> list[float]:
    """
    Generate normalized 64-dimensional deterministic semantic embedding vector.
    Uses n-gram hashing and vocabulary weight projections with L2 normalization.
    """
    clean = re.sub(r"[^\w\s]", " ", text.lower())
    words = clean.split()
    if not words:
        return [0.0] * EMBEDDING_DIM
        
    vec = np.zeros(EMBEDDING_DIM, dtype=np.float32)
    for word in words:
        # Deterministic MD5 hash to embedding buckets with semantic feature weighting
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest()[:8], 16)
        idx1 = abs(h) % EMBEDDING_DIM
        idx2 = abs(h >> 5) % EMBEDDING_DIM
        weight = 1.0 + min(len(word) * 0.1, 1.5)
        # Give higher weight to security keywords
        if word in ["brute", "ssh", "privilege", "lateral", "c2", "beacon", "exfiltration", "quarantine", "isolate", "ransomware", "mitre", "token"]:
            weight *= 2.5
        vec[idx1] += weight
        vec[idx2] += weight * 0.5
        
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return [round(float(v), 6) for v in vec]

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

PLAYBOOKS = [
    {
        "id": "kb-pb-001",
        "title": "SOC Playbook PB-001: Compromised Credentials & Brute Force Triage",
        "category": "playbook",
        "source": "Internal SOC SOP / NIST SP 800-61 Rev 2",
        "chunks": [
            {
                "section": "1. Initial Triage & Indicator Verification",
                "content": "Upon detecting multiple failed authentication attempts (>5 failures within a 5-minute rolling window) followed by an abnormal successful login, immediately inspect the source IP reputation, geolocational divergence, and user role. If source IP matches threat intelligence feeds or VPN exit nodes, flag as Confirmed Credential Stuffing."
            },
            {
                "section": "2. Containment Playbook Actions",
                "content": "Phase 2 Containment: 1. Immediately request user session revocation in Okta/Azure AD. 2. Force password reset and MFA re-enrollment. 3. If unauthorized privileged operations were observed post-authentication, immediately isolate the endpoint and block the external ingress IP at the edge firewall."
            },
            {
                "section": "3. Post-Incident Eradication & Hardening",
                "content": "Audit all audit logs across cloud and on-prem assets for the compromised identity within the past 72 hours. Validate whether persistence mechanisms (new OAuth app consents, SSH authorized keys, API tokens) were established. Document incident root cause and record timeline in SOC incident repository."
            }
        ]
    },
    {
        "id": "kb-pb-002",
        "title": "SOC Playbook PB-002: Lateral Movement & Privilege Escalation Response",
        "category": "playbook",
        "source": "MITRE ATT&CK T1078 / T1059 Response Framework",
        "chunks": [
            {
                "section": "1. Identification of Suspicious Administrative Execution",
                "content": "Monitor endpoint telemetry for unexpected invocations of administrative binaries (powershell.exe -enc, mimikatz, vssadmin delete shadows, sudo -u root /bin/bash) originating from non-administrative service accounts or unauthorized developer workstations."
            },
            {
                "section": "2. Host Isolation & Forensic Artifact Capture",
                "content": "Execute immediate host network quarantine via EDR agent. Do not power down the target host to preserve volatile memory. Trigger memory dump capture and disk volume snapshot for offline malware and credential extraction analysis."
            },
            {
                "section": "3. Forest & Kerberos Ticket Invalidation",
                "content": "If domain administrator credentials have been touched, immediately initiate KRBTGT account password reset (twice within a 10-hour interval) to invalidate any Golden Ticket persistence mechanisms across the enterprise Active Directory forest."
            }
        ]
    },
    {
        "id": "kb-pb-003",
        "title": "SOC Playbook PB-003: C2 Beaconing & Outbound Data Exfiltration Containment",
        "category": "playbook",
        "source": "Cyber Defense Operations Manual / CISA Shield",
        "chunks": [
            {
                "section": "1. Network Flow Analysis & Beaconing Detection",
                "content": "Identify periodic outbound TCP/UDP transmissions with low jitter (<5% delta) or unusually large DNS TXT lookups destined for external untrusted IPs or dynamic DNS domains. Correlate with high egress byte counts (>50MB over encrypted non-standard ports)."
            },
            {
                "section": "2. Edge ACL Block & DNS Sinkholing",
                "content": "Deploy edge firewall block rules for the destination IP address and sinkhole the associated domain in corporate DNS resolvers. Check proxy and TLS inspection logs to determine the volume of data exfiltrated and identify staging directories on the host."
            }
        ]
    },
    {
        "id": "kb-mitre-001",
        "title": "MITRE ATT&CK Enterprise Matrix Reference Guide",
        "category": "threat_report",
        "source": "MITRE Corporation / ATT&CK v14",
        "chunks": [
            {
                "section": "T1110 - Brute Force",
                "content": "Adversaries may use brute force techniques to gain access to accounts when passwords are unknown or when password hashes are obtained. Techniques include password guessing, password spraying across multiple user accounts, and credential stuffing."
            },
            {
                "section": "T1071 - Application Layer Protocol (Command and Control)",
                "content": "Adversaries may communicate using application layer protocols to avoid detection by blending in with existing network traffic. Commands and data may be hidden within HTTP/HTTPS headers, websockets, or DNS requests to external servers."
            }
        ]
    }
]

def seed_knowledge_base():
    """Populate knowledge base documents and embedded chunks."""
    with get_db() as conn:
        cursor = conn.cursor()
        for doc in PLAYBOOKS:
            cursor.execute("""
            INSERT OR REPLACE INTO knowledge_documents (
                id, title, category, source, classification, chunk_count
            ) VALUES (?, ?, ?, ?, 'internal', ?)
            """, (doc["id"], doc["title"], doc["category"], doc["source"], len(doc["chunks"])))
            
            for idx, ch in enumerate(doc["chunks"]):
                chunk_id = f"{doc['id']}-ch-{idx}"
                embedding = generate_dense_embedding(ch["content"] + " " + ch["section"])
                cursor.execute("""
                INSERT OR REPLACE INTO knowledge_chunks (
                    id, document_id, section_title, chunk_index, content, embedding_json, tokens
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    chunk_id,
                    doc["id"],
                    ch["section"],
                    idx,
                    ch["content"],
                    json.dumps(embedding),
                    len(ch["content"].split())
                ))

def search_knowledge(query: str, top_k: int = 4, category: str = None) -> list[dict]:
    """
    Execute hybrid RAG retrieval:
    Calculates semantic cosine similarity + keyword matching against indexed chunks.
    Returns sorted list of citations with verified snippets and similarity scores.
    """
    query_vec = generate_dense_embedding(query)
    query_words = set(re.sub(r"[^\w\s]", " ", query.lower()).split())
    
    citations = []
    with get_db() as conn:
        cursor = conn.cursor()
        sql = """
        SELECT c.id, c.document_id, c.section_title, c.chunk_index, c.content, c.embedding_json,
               d.title as doc_title, d.category as doc_category, d.source as doc_source
        FROM knowledge_chunks c
        JOIN knowledge_documents d ON c.document_id = d.id
        """
        params = []
        if category:
            sql += " WHERE d.category = ?"
            params.append(category)
            
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        for r in rows:
            embedding = json.loads(r["embedding_json"])
            sem_score = cosine_similarity(query_vec, embedding)
            
            # Keyword overlap score
            content_words = set(re.sub(r"[^\w\s]", " ", r["content"].lower()).split())
            overlap = len(query_words.intersection(content_words))
            kw_score = min(1.0, overlap * 0.15)
            
            # Hybrid fusion score
            hybrid_score = round(float(0.65 * sem_score + 0.35 * kw_score), 4)
            
            if hybrid_score > 0.15:
                citations.append({
                    "chunk_id": r["id"],
                    "document_id": r["document_id"],
                    "document_title": r["doc_title"],
                    "section_title": r["section_title"],
                    "chunk_index": r["chunk_index"],
                    "content": r["content"],
                    "similarity_score": hybrid_score,
                    "source": r["doc_source"]
                })
                
    citations.sort(key=lambda x: x["similarity_score"], reverse=True)
    return citations[:top_k]
