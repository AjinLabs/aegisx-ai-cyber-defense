# AEGISX

### Enterprise Agentic AI Cyber Defense, Threat Intelligence & Human-in-the-Loop Operations Platform

**AEGISX** is a production-grade, enterprise cybersecurity intelligence and autonomous threat operations platform designed with an organic, human-made model philosophy. It deeply integrates five core AI paradigms:

1. **Machine Learning (ML)**: Scikit-learn Isolation Forest anomaly detector & Random Forest tabular attack classifier.
2. **Deep Learning (DL)**: PyTorch 8-dimensional bottleneck Autoencoder for neural behavioral reconstruction anomalies.
3. **Retrieval-Augmented Generation (RAG)**: Hybrid semantic vector + keyword knowledge search with verified citations against NIST SP 800-61, MITRE ATT&CK v14, and SOC Playbooks.
4. **Large Language Models (LLMs) & Explainable AI (XAI)**: SHAP/LIME-style feature contribution decomposition, Bayesian confidence calibration, and human-interpretable technical explanations.
5. **Agentic AI Orchestration**: Multi-agent coordinator deploying 7 bounded, specialized cyber defense agents with deterministic security guardrails.

---

## 🎨 Visual Design System & Palette

AEGISX features an executive aesthetic centered on the human-curated palette:

| Color Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Old Rose** | `#E19AA6` | Primary brand accent, critical alert indicators, high-impact malware nodes, active states |
| **Seashell** | `#FAF0EA` | Primary typography, clean surfaces, warm parchment executive light mode |
| **Sky Blue** | `#82B0CE` | Telemetry streams, network flows, host/user entity nodes, informative telemetry |

The platform supports a 1-click **Theme Toggle** directly on the dashboard:
- **Cyber Rose Dark Mode** (Default SOC): Nocturnal slate background (`#090E17`), deep panels (`#121C2F`), glowing Old Rose (`#E19AA6`) critical alerts, and Sky Blue (`#82B0CE`) network telemetry.
- **Seashell Executive Mode**: Warm, organic paper/parchment theme (`#FAF0EA`), crisp card surfaces (`#FFFFFF`), deep charcoal ink typography (`#141C2B`), and muted Old Rose (`#D67786`) highlights.

---

## 🧠 What Makes the Model "Human-Made" & Human-in-the-Loop (HITL)?

Unlike black-box AI tools that output arbitrary numbers or claim autonomous superpowers, AEGISX is engineered around **human analyst ergonomics, active feedback, and Explainable AI (XAI)**:

### 1. Explainable AI (XAI) Feature Waterfall
- For every detection, the system computes the exact **SHAP-style feature attribution breakdown**:
  - `Failed Authentication Spike`: +35.2% risk impact
  - `Privileged Account Impact`: +24.0% risk impact
  - `Suspicious Destination Port`: +21.5% risk impact
  - `Off-Hours Execution Window`: +16.0% risk impact
  - `Outbound Payload Baseline`: -6.4% risk reduction
- Translates model weights into **plain-English narrative explanations** specifically for Tier-2/Tier-3 SOC analysts.

### 2. Human-in-the-Loop Active Learning Loop
- Analysts can label any alert or telemetry record directly in the UI:
  - `✓ Confirmed Threat (True Positive)`
  - `✗ Benign Quirk (False Positive)`
  - `⚠ Policy Exemption`
  - `🔍 Under Review`
- Clicking **"Calibrate with Human Annotations"** triggers the active learning retraining pipeline: weights human annotations 3x higher, recalibrates decision boundaries, and updates model version tags (`v1.4.2-human-calibrated`).

### 3. Analyst Fatigue & Sensitivity Threshold Simulator
- An interactive slider allows SOC supervisors to slide the anomaly threshold (0.35 to 0.85) and simulate real-time tradeoffs:
  - **Estimated Alerts per Shift** (e.g. 14 alerts vs. 52 alerts)
  - **False Positive Burden** (e.g. 2.4% vs. 16.8%)
  - **Threat Recall** (e.g. 94.2% vs. 99.1%)
  - **Cognitive Fatigue Index** (`Optimal Focus` vs. `Burnout Hazard`)

### 4. Human Analyst Collaboration Journal
- Real analysts (Sarah Chen, Marcus Vance, Elena Rostova) record observations, forensic hashes, and hypotheses in persistent case notes.
- Notes are cryptographically attached to the incident timeline for dual-control auditability.

---

## 🚀 Quick Start Guide

### 1. Backend API (FastAPI, Scikit-learn, PyTorch, SQLite WAL)

```bash
# From workspace root
python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload
```

The API initializes SQLite with WAL mode, seeds initial detection rules, threat intelligence IOCs, RAG playbooks, and PyTorch autoencoder checkpoints.

- Swagger API Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### 2. Frontend Interface (Next.js 16, React 19, Tailwind CSS, React Flow)

```bash
# Navigate to web app
cd apps/web
npm.cmd run dev
```

Open `http://localhost:3000` to access the AEGISX Security Command Centre.

### 3. Running Automated Tests

```bash
# Run full Pytest suite
python -m pytest tests/test_aegisx.py -v
```

All 8 comprehensive tests verify:
- APT29 IOC Threat Intel Matching
- 5-Layer Detection Pipeline (Rules + Stats + ML + DL + Layer E Fusion)
- RAG Semantic Cosine & Keyword Hybrid Search
- Alert & Incident Auto-Generation
- 7-Agent Autonomous Investigation Pipeline
- Sandbox Defensive Action Simulation
- Explainable AI Feature Attribution Decomposition
- Human Active Learning Retraining & Sensitivity Curves

---

## 🏗️ Architecture

```
Telemetry Ingestion (JSON/CSV/Syslog/Simulations)
                       │
                       ▼
       ┌──────────────────────────────┐
       │   5-Layer Detection Engine   │
       ├──────────────────────────────┤
       │ Layer A: Deterministic Rules │
       │ Layer B: Statistical Z-Score │
       │ Layer C: Scikit-learn (IF+RF)│
       │ Layer D: PyTorch Autoencoder │
       │ Layer E: Detection Fusion    │
       └──────────────┬───────────────┘
                      │
                      ▼
         Incident & Alert Generation
                      │
                      ▼
       ┌──────────────────────────────┐
       │   Agentic AI Coordinator     │
       ├──────────────────────────────┤
       │ 1. Triage Agent              │
       │ 2. Threat Intel Agent        │
       │ 3. Behavioral Analysis Agent │
       │ 4. Knowledge Research (RAG)  │
       │ 5. Correlation & Graph Agent │
       │ 6. Response Planning Agent   │
       │ 7. Incident Report Agent     │
       └──────────────┬───────────────┘
                      │
                      ▼
       ┌──────────────────────────────┐
       │ Human-in-the-Loop Governance │
       ├──────────────────────────────┤
       │ • Dual-Control Approval      │
       │ • XAI Waterfall Inspection   │
       │ • Ground Truth Active Label  │
       │ • Sandbox Simulation Action  │
       └──────────────────────────────┘
```

---

## 🔒 Safe Defensive Response Sandbox
All automated containment actions (`isolate_endpoint`, `revoke_user_session`, `block_firewall_ip`) execute inside a safe simulation sandbox with verification logs. No uncontrolled or destructive shell execution can reach production environments.
