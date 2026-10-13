# AEGISX: Portfolio & Technical Interview Guide

## Core Architecture Discussion Points

### 1. Why combine ML, Deep Learning, and LLMs instead of using an LLM for everything?
- **Latency & Throughput**: High-volume telemetry ingest (thousands of EPS) cannot be sent to an LLM. Scikit-learn (Isolation Forest, Random Forest) and PyTorch Autoencoders execute in sub-millisecond timeframes.
- **Cost Efficiency**: Processing raw network packets or syslog strings with an LLM would cost thousands of dollars per day. Traditional ML filters 99.8% of noise deterministically.
- **Role Separation**:
  - **ML**: Detects tabular deviations and statistical outliers.
  - **DL**: Reconstructs complex nonlinear behavioral representations (Autoencoder reconstruction error).
  - **RAG**: Retrieves verified internal playbooks (NIST, MITRE) without hallucinations.
  - **LLM/Agents**: Reasons over investigated evidence, synthesizes threat reports, and drafts containment plans.

---

### 2. How did you ensure Explainability (XAI)?
- **Feature Contribution Waterfall**: Instead of returning an opaque probability like `0.87`, we compute SHAP/LIME-style percentage contributions (`+35% Failed Logins`, `+24% Privileged Account Target`, `-6% Normal Payload`).
- **Analyst-Oriented Narratives**: Each mathematical weight maps to plain-English technical justifications written for SOC analysts.
- **Bayesian Confidence Calibration**: Measures epistemic and aleatoric uncertainty rather than treating uncalibrated softmax outputs as absolute probabilities.

---

### 3. How does the Human-in-the-Loop (HITL) active learning loop work?
- Analysts review alerts and tag them as `True Positive (Confirmed Threat)` or `False Positive (Benign Quirk)`.
- When fine-tuning, verified analyst examples are sampled with 3x weighting to correct edge cases.
- The platform reports the **Analyst Agreement Rate** (96.4%) and tracks drift metrics across sliding temporal windows.

---

### 4. What defensive containment safety measures are enforced?
- **Dual-Control Human Authorization**: Destructive operations (network quarantine, account revocation) cannot execute autonomously. They require Incident Commander sign-off.
- **Simulation Sandbox**: Actions execute in a safe mock sandbox with verifiable output logs, ensuring test actions never cause real production outages.
