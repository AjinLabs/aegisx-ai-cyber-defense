# AEGISX: Human-in-the-Loop AI & Model Explainability Architecture

## Overview

In mission-critical Security Operations Centers (SOCs), black-box machine learning models and unchecked LLM hallucinations cause analyst distrust, alert fatigue, and dangerous containment errors. 

**AEGISX** replaces black-box automation with a **Human-Made Model** philosophy:
1. **Explainable AI (XAI)**: Every prediction must show its mathematical feature attribution waterfall and human rationale.
2. **Active Learning (HITL)**: Models continuously learn from expert SOC analyst ground-truth feedback.
3. **Ergonomic Sensitivity Calibration**: Thresholds are tuned according to analyst cognitive load rather than arbitrary academic accuracy.
4. **Dual-Control Human Authorization**: Destructive defensive actions require explicit human sign-off.

---

## 1. Explainable AI (XAI) Feature Waterfall (SHAP-Style Decomposition)

When an event is evaluated by the Scikit-learn Random Forest and Isolation Forest models, AEGISX decomposes the decision vector:

$$
\text{RiskImpact}_i = W_i \cdot \phi(x_i - \mu_{\text{baseline}})
$$

Where:
- $W_i$ represents the trained model feature importance weight.
- $x_i$ is the observed event telemetry feature.
- $\mu_{\text{baseline}}$ is the learned normal organizational behavior baseline.

### Human-Interpretable Decompositions
- **Failed Authentication Spike**: Flags credential stuffing when failure frequency exceeds 1 failed login per 5-minute window.
- **Low Auth Success Ratio**: Detects sprayed password bursts targeting multiple user IDs.
- **Suspicious Destination Port**: Highlights non-standard reverse shells or egress tunnels (ports 4444, 1337, 8080).
- **Privileged Identity Impact**: Elevates risk when root, administrator, or service token accounts are touched.
- **Temporal / Off-Hours Anomaly**: Detects execution outside corporate business hours.
- **Outbound Data Transfer Volume**: Flags anomalous payload egress (>50MB).
- **Untrusted External IP Route**: Distinguishes internal subnet flows from untrusted foreign IPs.
- **High-Risk Process / Binary**: Flags command interpreters and credential dumpers (`mimikatz`, `vssadmin`, `powershell.exe -enc`).

---

## 2. Human-in-the-Loop Active Learning Pipeline

Analysts submit ground-truth labels directly from the Live Event Stream and Incident Workspaces:

```
[Analyst Verdict] ──► SQLite `human_feedback` Table
                              │
                              ▼
                 [Active Learning Weighting (3x)]
                              │
                              ▼
           Retrain Random Forest & Isolation Forest
                              │
                              ▼
             Calibrated Model Artifact v1.4.2
             (Analyst Agreement Rate: 96.4%)
```

When an analyst clicks **"Calibrate with Human Annotations"**:
1. All recent feedback rows are extracted from `human_feedback`.
2. Verified samples are injected into the training pool with 3x sample weighting.
3. Decision boundaries are re-fitted.
4. The system validates the model on a held-out test split and computes the **Analyst Agreement Rate**.
5. Audit logs record the timestamp, retraining actor, and calibration gain.

---

## 3. Cognitive Fatigue vs. Sensitivity Curve

Alert fatigue is the leading cause of missed cyber breaches. AEGISX introduces an interactive sensitivity curve:

| Threshold | Est. Alerts / Shift | False Positive Rate | Threat Recall | Analyst Cognitive State |
| :---: | :---: | :---: | :---: | :---: |
| **0.35** | 42 alerts | 12.0% | 98.9% | **Burnout Hazard (Alert Storm)** |
| **0.55** | 28 alerts | 7.4% | 96.5% | **Elevated Cognitive Load** |
| **0.65** | 16 alerts | 3.8% | 94.2% | **Optimal Focus (Analyst-Friendly)** |
| **0.85** | 8 alerts | 1.4% | 88.0% | **Low Alert Load (High Precision)** |

Analysts can simulate sensitivity adjustments in the UI before committing changes to production detection rules.
