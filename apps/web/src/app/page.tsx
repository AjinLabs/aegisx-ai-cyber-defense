"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Activity,
  AlertOctagon,
  Cpu,
  Bot,
  BookOpen,
  Share2,
  Sliders,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Terminal,
  Zap,
  Play,
  Check,
  X,
  Server,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Lock,
  Layers,
  Sparkles,
  Info,
  Sun,
  Moon,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Award,
  SlidersHorizontal,
  ChevronDown,
  Send,
  Eye,
  Crosshair,
  Coffee,
  FileCheck,
  PenTool,
  CheckCheck,
  Fingerprint
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { AttackGraphView } from "../components/AttackGraphView";
import * as api from "../lib/api";

type TabType =
  | "overview"
  | "telemetry"
  | "detection"
  | "incidents"
  | "agents"
  | "graph"
  | "rag"
  | "models"
  | "response"
  | "observability";

export default function AegisxDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"dark" | "sweet-lemon">("dark");
  const [isAnalystDeskOpen, setIsAnalystDeskOpen] = useState(false);
  const [activeOperator, setActiveOperator] = useState<"Ajin" | "Sarah" | "Marcus">("Ajin");
  const [operatorNotes, setOperatorNotes] = useState<any[]>([
    {
      id: "note-1",
      author: "Ajin K.",
      role: "Lead Architect & SOC Commander",
      time: "12 mins ago",
      tag: "DUAL-CONTROL SIGNED",
      content: "Validated APT29 credential spray telemetry. Model suggested immediate host isolation for 10.0.4.12. Confirmed anomalous SMB spray pattern; granted authorization while preserving memory artifacts for forensics.",
      intuition: "High Malicious Confidence (98%)"
    },
    {
      id: "note-2",
      author: "Sarah Chen",
      role: "Senior Incident Responder",
      time: "38 mins ago",
      tag: "THRESHOLD CALIBRATED",
      content: "Calibrated Isolation Forest sensitivity threshold to 0.65. Marketing bulk ETL batch was triggering noisy false positives. Zero true anomalies missed.",
      intuition: "False Positive Suppressed"
    },
    {
      id: "note-3",
      author: "Marcus Vance",
      role: "Threat Hunter & Reverse Engineer",
      time: "2 hours ago",
      tag: "RAG KNOWLEDGE LINKED",
      content: "Cross-referenced FIN7 C2 beacon payload with MITRE ATT&CK T1071.001. Playbook RAG-78 populated with custom YARA detection rule.",
      intuition: "Grounded in Threat Intel"
    }
  ]);
  const [newOperatorNoteText, setNewOperatorNoteText] = useState("");
  const [newOperatorTag, setNewOperatorTag] = useState("VERIFIED GROUND TRUTH");
  const [plainEnglishOpen, setPlainEnglishOpen] = useState<Record<string, boolean>>({});

  // Core Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [threatIndicators, setThreatIndicators] = useState<any[]>([]);
  const [attackGraph, setAttackGraph] = useState<any>(null);
  const [modelsData, setModelsData] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [ragQuery, setRagQuery] = useState("How do I contain brute force and isolate the endpoint?");
  const [ragResults, setRagResults] = useState<any>(null);
  const [telemetryFilter, setTelemetryFilter] = useState({ category: "", severity: "", search: "", anomalyOnly: false });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);

  // Human-Made Model & HITL States
  const [selectedExplainEvent, setSelectedExplainEvent] = useState<any>(null);
  const [explanationData, setExplanationData] = useState<any>(null);
  const [explainingLoading, setExplainingLoading] = useState(false);
  const [humanFeedbackList, setHumanFeedbackList] = useState<any[]>([]);
  const [sensitivityCurve, setSensitivityCurve] = useState<any[]>([]);
  const [selectedThreshold, setSelectedThreshold] = useState<number>(0.65);
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [fineTuneResult, setFineTuneResult] = useState<any>(null);
  const [newAnalystNote, setNewAnalystNote] = useState("");
  const [analystNoteAuthor, setAnalystNoteAuthor] = useState("Sarah Chen (SOC Lead)");

  // Toggle Theme: Sweet Lemon & Orange Dream
  useEffect(() => {
    if (themeMode === "sweet-lemon" || (themeMode as string) === "seashell") {
      document.documentElement.setAttribute("data-theme", "sweet-lemon");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [themeMode]);

  const handleAddOperatorNote = () => {
    if (!newOperatorNoteText.trim()) return;
    const authorName = activeOperator === "Ajin" ? "Ajin K." : activeOperator === "Sarah" ? "Sarah Chen" : "Marcus Vance";
    const authorRole = activeOperator === "Ajin" ? "Lead Architect & SOC Commander" : activeOperator === "Sarah" ? "Senior Incident Responder" : "Threat Hunter";
    const newEntry = {
      id: `note-${Date.now()}`,
      author: authorName,
      role: authorRole,
      time: "Just now",
      tag: newOperatorTag,
      content: newOperatorNoteText.trim(),
      intuition: "Analyst Heuristic Assessment"
    };
    setOperatorNotes([newEntry, ...operatorNotes]);
    setNewOperatorNoteText("");
    setNotification(`Analyst note recorded by ${authorName}! Linked to active shift handover log.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadIncidentDetails = async (id: string) => {
    try {
      const data = await api.fetchIncidentDetail(id);
      setSelectedIncident(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial Load
  const refreshAllData = async () => {
    try {
      setLoading(true);
      const [m, ev, al, inc, ioc, gr, md, ap, aud, fb, sc] = await Promise.all([
        api.fetchMetrics().catch(() => null),
        api.fetchEvents({ limit: 50 }).catch(() => ({ events: [] })),
        api.fetchAlerts().catch(() => ({ alerts: [] })),
        api.fetchIncidents().catch(() => ({ incidents: [] })),
        api.fetchThreatIndicators().catch(() => ({ indicators: [] })),
        api.fetchAttackGraph().catch(() => null),
        api.fetchModels().catch(() => null),
        api.fetchApprovals().catch(() => ({ approvals: [] })),
        api.fetchAuditLogs().catch(() => ({ audit_logs: [] })),
        api.fetchHumanFeedback().catch(() => ({ recent_feedback: [] })),
        api.fetchSensitivityCurve().catch(() => ({ sensitivity_curve: [] }))
      ]);

      if (m) setMetrics(m);
      if (ev) setEvents(ev.events || []);
      if (al) setAlerts(al.alerts || []);
      if (inc && inc.incidents) {
        setIncidents(inc.incidents);
        if (inc.incidents.length > 0 && !selectedIncident) {
          loadIncidentDetails(inc.incidents[0].id);
        }
      }
      if (ioc) setThreatIndicators(ioc.indicators || []);
      if (gr) setAttackGraph(gr);
      if (md) setModelsData(md);
      if (ap) setApprovals(ap.approvals || []);
      if (aud) setAuditLogs(aud.audit_logs || []);
      if (fb) setHumanFeedbackList(fb.recent_feedback || []);
      if (sc) setSensitivityCurve(sc.sensitivity_curve || []);
    } catch (err) {
      console.error("Data refresh failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleSimulateScenario = async (key: string) => {
    setIsSimulating(true);
    try {
      const res = await api.simulateScenario(key);
      setNotification(`Scenario injected: ${key.replace(/_/g, " ").toUpperCase()}. Generated ${res.events_injected} events & ${res.alerts_generated.length} alert(s).`);
      setTimeout(() => setNotification(null), 6000);
      await refreshAllData();
    } catch (err) {
      setNotification("Failed to inject scenario.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleTriggerInvestigation = async (incidentId: string) => {
    if (!incidentId) return;
    setIsInvestigating(true);
    try {
      const res = await api.triggerInvestigation(incidentId);
      setNotification(`Autonomous AI Investigation completed! 7 specialized agents executed with ${res.total_tokens} tokens.`);
      setTimeout(() => setNotification(null), 7000);
      await loadIncidentDetails(incidentId);
      setActiveTab("agents");
    } catch (err) {
      setNotification("Investigation run failed.");
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleDecideApproval = async (approvalId: string, decision: "approved" | "rejected") => {
    try {
      await api.decideApproval(approvalId, decision);
      setNotification(`Decision recorded: ${decision.toUpperCase()}. Action executed in sandbox.`);
      setTimeout(() => setNotification(null), 5000);
      await refreshAllData();
      if (selectedIncident?.incident?.id) {
        loadIncidentDetails(selectedIncident.incident.id);
      }
    } catch (err) {
      setNotification("Approval decision submission failed.");
    }
  };

  const handleRagSearch = async () => {
    try {
      const res = await api.searchKnowledge(ragQuery);
      setRagResults(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetrainAutoencoder = async () => {
    try {
      setNotification("Initiating PyTorch Deep Autoencoder training pipeline...");
      const res = await api.trainModel("pytorch_autoencoder", 25);
      setNotification(`PyTorch Deep Autoencoder trained! Val Normal Loss: ${res.metrics.val_normal_error_mean}, F1: ${res.metrics.f1_score}`);
      setTimeout(() => setNotification(null), 7000);
      const m = await api.fetchModels();
      setModelsData(m);
    } catch (err) {
      setNotification("Retraining failed.");
    }
  };

  // Human-in-the-Loop Verdict Submission
  const handleHumanFeedback = async (
    targetType: string,
    targetId: string,
    verdict: string,
    notes: string = ""
  ) => {
    try {
      await api.submitHumanFeedback({
        target_type: targetType,
        target_id: targetId,
        verdict,
        analyst_name: analystNoteAuthor,
        notes: notes || `Analyst verdict: ${verdict.replace(/_/g, " ")}`
      });
      setNotification(`Human verdict recorded: ${verdict.toUpperCase().replace(/_/g, " ")}! Stored for Active Learning.`);
      setTimeout(() => setNotification(null), 5000);
      const fb = await api.fetchHumanFeedback();
      setHumanFeedbackList(fb.recent_feedback || []);
    } catch (err) {
      setNotification("Failed to submit feedback.");
    }
  };

  // Human Active Learning Fine-Tuning
  const handleFineTuneHuman = async () => {
    setIsFineTuning(true);
    try {
      const res = await api.fineTuneWithHumanFeedback();
      setFineTuneResult(res);
      setNotification(`Model calibrated! Version: ${res.model_version} • Agreement: ${(res.analyst_agreement_rate * 100).toFixed(1)}%`);
      setTimeout(() => setNotification(null), 7000);
      const m = await api.fetchModels();
      setModelsData(m);
    } catch (err) {
      setNotification("Human fine-tuning failed.");
    } finally {
      setIsFineTuning(false);
    }
  };

  // Explain Model Decision (XAI Modal)
  const handleExplainDecision = async (event: any) => {
    setSelectedExplainEvent(event);
    setExplainingLoading(true);
    try {
      const res = await api.fetchEventExplanation(event.id);
      setExplanationData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setExplainingLoading(false);
    }
  };

  // Add Case Note to Incident
  const handleAddIncidentNote = async () => {
    if (!selectedIncident?.incident?.id || !newAnalystNote.trim()) return;
    try {
      await api.addIncidentNote(selectedIncident.incident.id, {
        analyst_name: analystNoteAuthor,
        role: "SOC Analyst L2",
        note: newAnalystNote.trim()
      });
      setNewAnalystNote("");
      await loadIncidentDetails(selectedIncident.incident.id);
      setNotification("Analyst case observation logged and linked to incident timeline.");
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification("Failed to record note.");
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    if (telemetryFilter.category && ev.category !== telemetryFilter.category) return false;
    if (telemetryFilter.severity && ev.severity !== telemetryFilter.severity) return false;
    if (telemetryFilter.anomalyOnly && !ev.is_anomaly) return false;
    if (telemetryFilter.search) {
      const s = telemetryFilter.search.toLowerCase();
      const match =
        (ev.host_id || "").toLowerCase().includes(s) ||
        (ev.user_id || "").toLowerCase().includes(s) ||
        (ev.src_ip || "").toLowerCase().includes(s) ||
        (ev.dst_ip || "").toLowerCase().includes(s) ||
        (ev.action || "").toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  // Active sensitivity point
  const currentSensitivity = sensitivityCurve.find(c => Math.abs(c.threshold - selectedThreshold) < 0.06) || sensitivityCurve[2] || {
    threshold: 0.65,
    alerts_per_shift: 16,
    false_positive_pct: 3.8,
    threat_recall_pct: 94.2,
    analyst_fatigue_status: "Optimal Focus (Analyst-Friendly)",
    fatigue_color: "#7ECBA1"
  };

  // Severity Colors Palette
  const isSweetLemon = themeMode === "sweet-lemon" || (themeMode as string) === "seashell";
  const isSeashell = isSweetLemon;

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${isSeashell ? "bg-[#FFFDF8] text-[#241912]" : "bg-[#0E0C0A] text-[#FFFDF8]"}`}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 transition-colors duration-300 ${isSeashell ? "bg-[#FFF3DB] border-[#F3DECB]" : "bg-[#15110E] border-[#2E241D]"}`}>
        <div>
          {/* Logo Brand with Palette Indicator */}
          <div className={`p-4 border-b flex items-center justify-between ${isSeashell ? "border-[#F3DECB]" : "border-[#2E241D]"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EB9F6E]/20 border border-[#EB9F6E] flex items-center justify-center glow-orange shadow-md">
                <Shield className="w-5 h-5 text-[#EB9F6E]" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-wider flex items-center gap-1.5">
                  <span className={isSeashell ? "text-[#241912]" : "text-[#FFFDF8]"}>AEGIS</span>
                  <span className="text-[#EB9F6E]">X</span>
                  <span className="text-[10px] bg-[#EB9F6E] text-[#0E0C0A] px-1.5 py-0.2 rounded font-mono font-bold">SOC</span>
                </div>
                <div className={`text-[10px] font-mono tracking-tight ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                  Human-in-the-Loop Cyber AI
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFEABD] border border-[#EB9F6E]" title="Sweet Lemon (#FFEABD)"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EB9F6E]" title="Orange Dream (#EB9F6E)"></span>
                  <span className="text-[9px] font-mono font-bold text-[#EB9F6E]">Sweet Lemon & Orange Dream</span>
                </div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setThemeMode(themeMode === "dark" ? "sweet-lemon" : "dark")}
              title={themeMode === "dark" ? "Switch to Sweet Lemon Daylight Mode (#FFEABD)" : "Switch to Warm Espresso Obsidian Mode (#EB9F6E)"}
              className={`p-1.5 rounded-lg border transition-all ${
                isSeashell
                  ? "bg-[#FFFDF8] border-[#F3DECB] text-[#EB9F6E] hover:bg-white"
                  : "bg-[#1C1713] border-[#2E241D] text-[#EB9F6E] hover:bg-[#261F1A]"
              }`}
            >
              {isSeashell ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Tenancy & Active Analyst Clearance */}
          <div className={`p-3 mx-2.5 my-2.5 rounded-xl border text-xs shadow-sm ${
            isSeashell
              ? "bg-[#FFFDF8] border-[#F3DECB]"
              : "bg-[#1C1713] border-[#2E241D]"
          }`}>
            <div className={`text-[10px] uppercase font-mono tracking-wider mb-1 flex items-center justify-between ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
              <span>Active Workspace</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#EB9F6E]/20 text-[#EB9F6E]">HITL Active</span>
            </div>
            <div className="font-bold flex items-center justify-between">
              <span className={isSeashell ? "text-[#241912]" : "text-[#FFFDF8]"}>Global Cyber Command</span>
              <span className="w-2 h-2 rounded-full bg-[#6AC99F] animate-pulse" />
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isSeashell ? "text-[#968070]" : "text-slate-400"}`}>
              ws-prod • Level 4 Operator Clearance
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-2 space-y-1 text-xs">
            {[
              { id: "overview", label: "Command Centre", icon: Activity },
              { id: "telemetry", label: "Live Event Stream", icon: Terminal },
              { id: "detection", label: "Detection & Anomaly Lab", icon: Layers },
              { id: "incidents", label: "Alerts & Incidents", icon: AlertOctagon },
              { id: "agents", label: "Agentic AI Investigations", icon: Bot, badge: "7 Agents" },
              { id: "graph", label: "Attack & Entity Graph", icon: Share2 },
              { id: "rag", label: "Knowledge & RAG Studio", icon: BookOpen },
              { id: "models", label: "ML/DL & Active Learning", icon: Cpu, badge: "HITL" },
              { id: "response", label: "Approval & Response Queue", icon: Lock, badge: approvals.filter(a => a.status === "pending").length || undefined },
              { id: "observability", label: "Observability & Audit", icon: Sliders }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? isSeashell
                        ? "bg-[#EB9F6E] text-white font-semibold shadow-md shadow-[#EB9F6E]/25"
                        : "bg-[#EB9F6E] text-[#0E0C0A] font-bold shadow-md shadow-[#EB9F6E]/20"
                      : isSeashell
                        ? "text-[#5E4A3E] hover:text-[#241912] hover:bg-[#FFFDF8]"
                        : "text-slate-400 hover:text-[#FFFDF8] hover:bg-[#1C1713]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? (isSeashell ? "text-white" : "text-[#0E0C0A]") : (isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]")}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? isSeashell ? "bg-white/30 text-white" : "bg-[#0E0C0A]/25 text-[#0E0C0A]"
                          : isSeashell
                            ? "bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/30"
                            : "bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/40"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card with Human Analyst Identity */}
        <div className={`p-3 border-t flex items-center gap-2.5 ${isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"}`}>
          <div className="w-8 h-8 rounded-full bg-[#EB9F6E]/20 border border-[#EB9F6E]/50 flex items-center justify-center text-xs font-bold text-[#EB9F6E]">
            {activeOperator === "Ajin" ? "AK" : activeOperator === "Sarah" ? "SC" : "MV"}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold truncate ${isSeashell ? "text-[#241912]" : "text-[#FFFDF8]"}`}>
              {activeOperator === "Ajin" ? "Ajin K." : activeOperator === "Sarah" ? "Sarah Chen" : "Marcus Vance"}
            </div>
            <div className="text-[10px] text-[#6AC99F] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6AC99F] inline-block" />
              {activeOperator === "Ajin" ? "Lead Architect • Shift Alpha" : activeOperator === "Sarah" ? "SOC Lead • Shift Alpha" : "Forensics • Shift Alpha"}
            </div>
          </div>
          <button
            onClick={() => setActiveOperator(activeOperator === "Ajin" ? "Sarah" : activeOperator === "Sarah" ? "Marcus" : "Ajin")}
            title="Switch Active Human Operator Profile"
            className={`p-1.5 rounded-lg border transition text-[9px] font-mono font-bold ${
              isSeashell ? "border-[#F3DECB] hover:bg-white text-[#5E4A3E]" : "border-[#2E241D] hover:bg-[#1C1713] text-slate-400 hover:text-white"
            }`}
          >
            SWITCH
          </button>
          <button
            onClick={refreshAllData}
            title="Refresh State"
            className={`p-1.5 rounded-lg border transition ${
              isSeashell ? "border-[#F3DECB] hover:bg-white text-[#5E4A3E]" : "border-[#2E241D] hover:bg-[#1C1713] text-slate-400 hover:text-white"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#EB9F6E]" : ""}`} />
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Operational Bar */}
        <header className={`h-14 border-b px-6 flex items-center justify-between shrink-0 transition-colors ${
          isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#15110E] border-[#2E241D]"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`text-xs font-mono uppercase tracking-wider ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
              Defense Status: <span className="text-[#6AC99F] font-bold">ACTIVE DEFENSE</span>
            </div>
            <div className={`h-3 w-px ${isSeashell ? "bg-[#F3DECB]" : "bg-[#2E241D]"}`} />
            <div className={`text-xs font-mono flex items-center gap-1.5 ${isSeashell ? "text-[#241912]" : "text-slate-300"}`}>
              <span className="w-2 h-2 rounded-full bg-[#FFEABD] animate-pulse" />
              <span>Throughput: {metrics?.events_per_second || 14.8} EPS</span>
            </div>
            <div className={`h-3 w-px ${isSeashell ? "bg-[#F3DECB]" : "bg-[#2E241D]"}`} />
            <div className={`text-xs font-mono ${isSeashell ? "text-[#241912]" : "text-slate-300"}`}>
              Analyst Agreement: <span className="text-[#EB9F6E] font-bold">96.4% calibrated</span>
            </div>
          </div>

          {/* Quick Actions & Human Shift Desk Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAnalystDeskOpen(true)}
              className="px-3 py-1 text-xs rounded-xl bg-[#EB9F6E] text-[#0E0C0A] font-bold hover:bg-[#F2AF83] transition flex items-center gap-1.5 glow-orange shadow-sm"
              title="Open Human Analyst Shift Desk & Handover Log"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analyst Shift Desk</span>
              <span className="bg-[#0E0C0A] text-[#FFEABD] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {operatorNotes.length}
              </span>
            </button>
            <div className={`h-3 w-px mx-1 ${isSeashell ? "bg-[#F3DECB]" : "bg-[#2E241D]"}`} />
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario("brute_force_lateral")}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#EB9F6E]/15 border border-[#EB9F6E]/40 text-[#EB9F6E] hover:bg-[#EB9F6E]/25 transition flex items-center gap-1 font-mono font-medium"
            >
              <Zap className="w-3 h-3 text-[#EB9F6E]" /> APT29 Spray
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario("c2_exfiltration")}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#FFEABD]/15 border border-[#FFEABD]/40 text-[#FFEABD] hover:bg-[#FFEABD]/25 transition flex items-center gap-1 font-mono font-medium"
            >
              <Zap className="w-3 h-3 text-[#FFEABD]" /> FIN7 C2 Beacon
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario("normal_baseline")}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#6AC99F]/15 border border-[#6AC99F]/40 text-[#6AC99F] hover:bg-[#6AC99F]/25 transition flex items-center gap-1 font-mono font-medium"
            >
              <Check className="w-3 h-3" /> Normal Baseline
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className={`border-b px-6 py-2.5 flex items-center justify-between text-xs animate-in fade-in ${
            isSeashell ? "bg-[#FFF7ED] border-[#EB9F6E] text-[#EB9F6E]" : "bg-[#1C1713] border-[#EB9F6E] text-[#EB9F6E]"
          }`}>
            <div className="flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-[#EB9F6E]" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-[#FFFDF8]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab View Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW / COMMAND CENTRE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Human SOC Shift Handover & Operational Briefing Card */}
              <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
                isSeashell ? "bg-[#FFF3DB] border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
              }`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#EB9F6E] text-[#0E0C0A] flex items-center justify-center font-bold text-lg shrink-0 shadow-md glow-orange">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-extrabold bg-[#EB9F6E] text-[#0E0C0A]">
                          HUMAN SOC BRIEFING
                        </span>
                        <span className="text-xs font-mono text-[#6AC99F] font-bold">
                          Shift Alpha • Lead Operator: {activeOperator === "Ajin" ? "Ajin K." : activeOperator === "Sarah" ? "Sarah Chen" : "Marcus Vance"}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#EB9F6E]/40 text-[#EB9F6E]">
                          Orange Dream & Sweet Lemon Edition
                        </span>
                      </div>
                      <h2 className="text-base font-extrabold tracking-tight">
                        Autonomous Defense Active with 100% Human-in-the-Loop Oversight
                      </h2>
                      <p className={`text-xs mt-1 max-w-3xl leading-relaxed ${isSeashell ? "text-[#5E4A3E]" : "text-[#FFEABD]/90"}`}>
                        "Shift handover active: 1 anomalous APT29 credential spray analyzed and contained with analyst ground truth. 7 specialized AI agents deployed; 2 response automations pending dual-operator sign-off."
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsAnalystDeskOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] font-extrabold text-xs flex items-center gap-1.5 transition glow-orange shadow-md"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Open Shift Desk ({operatorNotes.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("response")}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                        isSeashell ? "bg-white border-[#F3DECB] text-[#241912] hover:bg-[#FFF7ED]" : "bg-[#0E0C0A] border-[#2E241D] text-[#FFFDF8] hover:bg-[#261F1A]"
                      }`}
                    >
                      Review Approvals ({approvals.filter(a => a.status === "pending").length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Executive Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                  <div className={`flex items-center justify-between text-xs font-mono mb-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    <span>TOTAL TELEMETRY EVENTS</span>
                    <Terminal className="w-4 h-4 text-[#FFEABD]" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight">{metrics?.total_events || 0}</div>
                  <div className="text-[11px] text-[#6AC99F] font-mono mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +14.8 EPS ingest rate
                  </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                  <div className="flex items-center justify-between text-[#EB9F6E] text-xs font-mono mb-1">
                    <span>ACTIVE INCIDENTS</span>
                    <AlertOctagon className="w-4 h-4 text-[#EB9F6E]" />
                  </div>
                  <div className="text-2xl font-black text-[#EB9F6E] font-mono tracking-tight">
                    {metrics?.active_incidents || 0}
                  </div>
                  <div className="text-[11px] text-[#EB9F6E] font-mono mt-1">
                    {metrics?.critical_incidents || 0} Critical priority open
                  </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                  <div className={`flex items-center justify-between text-xs font-mono mb-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    <span>MODEL F1 SCORE (CALIBRATED)</span>
                    <Cpu className="w-4 h-4 text-[#EB9F6E]" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight">{metrics?.f1_score || 0.941}</div>
                  <div className={`text-[11px] font-mono mt-1 ${isSeashell ? "text-[#7E6857]" : "text-slate-400"}`}>
                    Prec: {metrics?.precision || 0.965} • Rec: {metrics?.recall || 0.918}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                  <div className={`flex items-center justify-between text-xs font-mono mb-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    <span>MTTD / MTTR</span>
                    <Clock className="w-4 h-4 text-[#FFEABD]" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight">
                    {metrics?.mttd_minutes || 1.4}m / {metrics?.mttr_minutes || 8.2}m
                  </div>
                  <div className="text-[11px] text-[#6AC99F] font-mono mt-1">SLA Compliance: 99.4%</div>
                </div>
              </div>

              {/* Visual Charts: Volume Timeline & Severity Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold">Security Telemetry Velocity & Anomaly Cascade</h3>
                      <p className={`text-xs ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                        Raw events correlated against Scikit-Learn and PyTorch Autoencoder anomalies
                      </p>
                    </div>
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                      isSeashell ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912]" : "bg-[#0E0C0A] border-[#2E241D] text-[#FFEABD]"
                    }`}>
                      24h Horizon
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics?.hourly_event_volume || []}>
                        <defs>
                          <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFEABD" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#FFEABD" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EB9F6E" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#EB9F6E" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isSeashell ? "#F3DECB" : "#2E241D"} />
                        <XAxis dataKey="time" stroke={isSeashell ? "#7E6857" : "#FFEABD"} fontSize={11} />
                        <YAxis stroke={isSeashell ? "#7E6857" : "#FFEABD"} fontSize={11} />
                        <Tooltip contentStyle={{
                          backgroundColor: isSeashell ? "#FFFDF8" : "#15110E",
                          borderColor: isSeashell ? "#F3DECB" : "#2E241D",
                          color: isSeashell ? "#241912" : "#FFFDF8",
                          fontSize: "12px",
                          borderRadius: "8px"
                        }} />
                        <Area type="monotone" dataKey="events" stroke="#FFEABD" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEvents)" name="Total Events" />
                        <Area type="monotone" dataKey="anomalies" stroke="#EB9F6E" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAnomalies)" name="Detected Anomalies" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alert Severity Distribution */}
                <div className={`p-5 rounded-xl border flex flex-col justify-between shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                  <div>
                    <h3 className="text-sm font-bold mb-1">Alert Severity Distribution</h3>
                    <p className={`text-xs mb-4 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                      Grounded by Layer E detection fusion engine
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: "Critical", count: alerts.filter(a => a.severity === "critical").length || 3, color: "bg-[#EB9F6E]", textColor: "text-[#EB9F6E]" },
                        { label: "High", count: alerts.filter(a => a.severity === "high").length || 4, color: "bg-[#F2AF83]", textColor: "text-[#EB9F6E]" },
                        { label: "Medium", count: alerts.filter(a => a.severity === "medium").length || 2, color: "bg-[#FFEABD]", textColor: "text-[#FFEABD]" },
                        { label: "Low", count: alerts.filter(a => a.severity === "low").length || 1, color: "bg-[#6AC99F]", textColor: "text-[#6AC99F]" }
                      ].map((s) => (
                        <div key={s.label} className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                            <span className="text-xs font-semibold">{s.label} Severity</span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${s.textColor}`}>{s.count} Alerts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("incidents")}
                    className="w-full mt-4 py-2 bg-[#EB9F6E]/15 hover:bg-[#EB9F6E]/25 border border-[#EB9F6E]/40 text-[#EB9F6E] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    View Incident Investigation Queue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active High-Priority Incidents Feed */}
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-[#EB9F6E]" />
                    <h3 className="text-sm font-bold">Active High-Priority Incidents & Active Investigations</h3>
                  </div>
                  <span className={`text-xs font-mono ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    {incidents.length} active incidents tracked
                  </span>
                </div>

                <div className="space-y-3">
                  {incidents.slice(0, 4).map((inc) => (
                    <div
                      key={inc.id}
                      className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition hover:border-[#EB9F6E] ${
                        isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/30">
                            {inc.severity}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{inc.id}</span>
                          <span className="text-[11px] font-mono text-[#FFEABD]">• Risk Score: {inc.risk_score}</span>
                        </div>
                        <h4 className="text-xs font-bold truncate">{inc.title}</h4>
                        <p className={`text-[11px] truncate ${isSeashell ? "text-[#7E6857]" : "text-slate-300"}`}>{inc.summary}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            loadIncidentDetails(inc.id);
                            setActiveTab("agents");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] text-xs font-bold flex items-center gap-1.5 transition glow-orange"
                        >
                          <Bot className="w-3.5 h-3.5" /> Launch AI Investigation
                        </button>
                        <button
                          onClick={() => {
                            loadIncidentDetails(inc.id);
                            setActiveTab("incidents");
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                            isSeashell ? "bg-white border-[#F3DECB] text-[#241912] hover:bg-[#FFF7ED]" : "bg-[#1C1713] border-[#2E241D] text-slate-300 hover:bg-[#261F1A]"
                          }`}
                        >
                          Investigate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE EVENT STREAM & INGESTION */}
          {activeTab === "telemetry" && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-sm ${
                isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
              }`}>
                <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                  <Search className={`w-4 h-4 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`} />
                  <input
                    type="text"
                    placeholder="Search host, user, IP, action, process..."
                    value={telemetryFilter.search}
                    onChange={(e) => setTelemetryFilter({ ...telemetryFilter, search: e.target.value })}
                    className={`rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none border ${
                      isSeashell
                        ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912] placeholder-[#968070] focus:border-[#EB9F6E]"
                        : "bg-[#0E0C0A] border-[#2E241D] text-[#FFFDF8] placeholder-slate-500 focus:border-[#EB9F6E]"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={telemetryFilter.category}
                    onChange={(e) => setTelemetryFilter({ ...telemetryFilter, category: e.target.value })}
                    className={`rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                      isSeashell ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912]" : "bg-[#0E0C0A] border-[#2E241D] text-slate-300"
                    }`}
                  >
                    <option value="">All Categories</option>
                    <option value="authentication">Authentication</option>
                    <option value="network">Network</option>
                    <option value="administrative">Administrative</option>
                    <option value="endpoint">Endpoint</option>
                  </select>

                  <select
                    value={telemetryFilter.severity}
                    onChange={(e) => setTelemetryFilter({ ...telemetryFilter, severity: e.target.value })}
                    className={`rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                      isSeashell ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912]" : "bg-[#0E0C0A] border-[#2E241D] text-slate-300"
                    }`}
                  >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <button
                    onClick={() => setTelemetryFilter({ ...telemetryFilter, anomalyOnly: !telemetryFilter.anomalyOnly })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition ${
                      telemetryFilter.anomalyOnly
                        ? "bg-[#EB9F6E]/20 border-[#EB9F6E] text-[#EB9F6E]"
                        : isSeashell
                          ? "bg-[#FFFDF8] border-[#F3DECB] text-[#7E6857]"
                          : "bg-[#0E0C0A] border-[#2E241D] text-slate-400"
                    }`}
                  >
                    {telemetryFilter.anomalyOnly ? "Anomalies Only" : "Show All Events"}
                  </button>
                </div>
              </div>

              {/* Event Table with Explain Button & Human Verdict */}
              <div className={`rounded-xl border overflow-hidden shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`font-mono uppercase text-[10px] border-b ${
                      isSeashell ? "bg-[#FFF3DB] border-[#F3DECB] text-[#7E6857]" : "bg-[#15110E] border-[#2E241D] text-[#FFEABD]"
                    }`}>
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Category / Action</th>
                        <th className="p-3">Host / User</th>
                        <th className="p-3">Network Flow</th>
                        <th className="p-3">Process</th>
                        <th className="p-3 text-center">ML / DL Anomaly</th>
                        <th className="p-3 text-center">Explainable AI</th>
                        <th className="p-3 text-right">Human Verdict</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${isSeashell ? "divide-[#F3DECB]" : "divide-[#2E241D]/60"}`}>
                      {filteredEvents.map((ev) => (
                        <tr key={ev.id} className={`transition ${isSeashell ? "hover:bg-[#FFFDF8]" : "hover:bg-[#261F1A]"}`}>
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            {ev.timestamp ? ev.timestamp.replace("T", " ").slice(0, 19) : "2026-10-13 14:00:00"}
                          </td>
                          <td className="p-3">
                            <div className="font-bold">{ev.action}</div>
                            <div className="text-[10px] text-[#FFEABD] capitalize">{ev.category} • {ev.outcome}</div>
                          </td>
                          <td className="p-3">
                            <div>{ev.host_id || "—"}</div>
                            <div className="text-[10px] text-[#EB9F6E]">{ev.user_id || "—"}</div>
                          </td>
                          <td className="p-3">
                            {ev.src_ip ? (
                              <div className="text-slate-300">
                                {ev.src_ip} → {ev.dst_ip}:{ev.dst_port || 80}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="p-3">{ev.process_name || "—"}</td>
                          <td className="p-3 text-center">
                            {ev.is_anomaly ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/40">
                                ANOMALY ({ev.anomaly_score?.toFixed(2) || "0.85"})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#6AC99F]/15 text-[#6AC99F]">
                                NORMAL
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleExplainDecision(ev)}
                              className="px-2 py-1 rounded bg-[#FFEABD]/15 hover:bg-[#FFEABD]/25 border border-[#FFEABD]/40 text-[#FFEABD] text-[10px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <Crosshair className="w-3 h-3" /> Explain XAI
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleHumanFeedback("event", ev.id, "confirmed_threat")}
                                title="Confirm Threat (True Positive)"
                                className="p-1 rounded bg-[#EB9F6E]/20 hover:bg-[#EB9F6E]/30 text-[#EB9F6E] border border-[#EB9F6E]/40 transition"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleHumanFeedback("event", ev.id, "false_positive")}
                                title="Mark False Positive"
                                className="p-1 rounded bg-[#FFEABD]/20 hover:bg-[#FFEABD]/30 text-[#FFEABD] border border-[#FFEABD]/40 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DETECTION & ANOMALY LAB */}
          {activeTab === "detection" && (
            <div className="space-y-6">
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#EB9F6E]" /> 5-Layer Autonomous Detection & Fusion Engine
                </h3>
                <p className={`text-xs mt-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                  Deterministic Rules → Statistical Baselines → Scikit-Learn Anomaly Classifier → PyTorch Deep Autoencoder → Layer E Fusion Risk Engine.
                </p>
              </div>

              {/* Detection Layers Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { layer: "Layer A", title: "Deterministic Rules", tech: "Regex & IOC Signatures", status: "Active (4 Rules)", color: "border-[#EB9F6E]" },
                  { layer: "Layer B", title: "Statistical Baseline", tech: "Z-Score Frequency Delta", status: "Monitoring 24h", color: "border-[#FFEABD]" },
                  { layer: "Layer C", title: "Scikit-Learn ML", tech: "Isolation Forest + RF", status: "F1: 0.941", color: "border-[#EB9F6E]" },
                  { layer: "Layer D", title: "Deep Autoencoder", tech: "PyTorch 8-dim Bottleneck", status: "Loss: 0.042", color: "border-[#FFEABD]" },
                  { layer: "Layer E", title: "Detection Fusion", tech: "Human Risk Calibration", status: "Calibrated 96.4%", color: "border-[#6AC99F]" }
                ].map((l) => (
                  <div key={l.layer} className={`p-4 rounded-xl border-2 shadow-sm ${l.color} ${isSeashell ? "bg-white" : "bg-[#1C1713]"}`}>
                    <div className="text-[10px] font-mono font-bold text-[#EB9F6E]">{l.layer}</div>
                    <div className="text-xs font-bold mt-0.5">{l.title}</div>
                    <div className={`text-[11px] font-mono mt-1 ${isSeashell ? "text-[#7E6857]" : "text-slate-400"}`}>{l.tech}</div>
                    <div className="mt-3 text-[10px] font-mono font-bold text-[#6AC99F] bg-[#6AC99F]/10 px-2 py-0.5 rounded border border-[#6AC99F]/30 inline-block">
                      {l.status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Rules List */}
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <h4 className="text-sm font-bold mb-3">Configured Deterministic Detection Rules</h4>
                <div className="space-y-2.5">
                  {[
                    { id: "rule-auth-001", name: "Distributed Brute Force / Credential Stuffing", mitre: "T1110", severity: "high", desc: "Threshold: >3 failed authentications within 300s window" },
                    { id: "rule-priv-002", name: "Unauthorized Privilege Escalation & Admin Token Abuse", mitre: "T1078", severity: "critical", desc: "Pattern: Administrative binary invocation (mimikatz, vssadmin, powershell)" },
                    { id: "rule-c2-003", name: "Beaconing to Known Malicious Threat Intel C2 IP", mitre: "T1071", severity: "critical", desc: "IOC Match against APT29 / Midnight Blizzard threat feeds" },
                    { id: "rule-exfil-004", name: "Abnormal Data Egress over Non-Standard Port", mitre: "T1048", severity: "high", desc: "Port: 4444, 1337, 8080 with >50MB egress traffic" }
                  ].map((r) => (
                    <div key={r.id} className={`p-3 rounded-lg border flex items-center justify-between ${
                      isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                    }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/30">
                            {r.severity}
                          </span>
                          <span className="text-xs font-bold">{r.name}</span>
                          <span className="text-[10px] font-mono text-[#FFEABD]">• MITRE {r.mitre}</span>
                        </div>
                        <p className={`text-[11px] ${isSeashell ? "text-[#7E6857]" : "text-slate-400"}`}>{r.desc}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#6AC99F]">ENABLED</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALERTS & INCIDENTS (WITH ANALYST JOURNAL) */}
          {activeTab === "incidents" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Incident List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center justify-between">
                  <span>Incident Queue</span>
                  <span className={`text-xs font-mono ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    {incidents.length} active
                  </span>
                </h3>

                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => loadIncidentDetails(inc.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      selectedIncident?.incident?.id === inc.id
                        ? "border-[#EB9F6E] bg-[#EB9F6E]/10 shadow-md"
                        : isSeashell
                          ? "bg-white border-[#F3DECB] hover:border-[#EB9F6E]"
                          : "bg-[#1C1713] border-[#2E241D] hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#EB9F6E] uppercase font-bold">{inc.severity}</span>
                      <span className="text-slate-400">{inc.status}</span>
                    </div>
                    <div className="text-xs font-bold">{inc.title}</div>
                    <div className={`text-[11px] truncate mt-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>{inc.summary}</div>
                  </div>
                ))}
              </div>

              {/* Incident Investigation Workspace with Case Notes */}
              <div className={`lg:col-span-2 p-5 rounded-xl border space-y-5 shadow-sm ${
                isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
              }`}>
                {selectedIncident ? (
                  <>
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
                      isSeashell ? "border-[#F3DECB]" : "border-[#2E241D]"
                    }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/30">
                            {selectedIncident.incident.severity}
                          </span>
                          <span className="text-xs font-mono text-[#FFEABD]">{selectedIncident.incident.id}</span>
                          <span className="text-xs font-mono text-slate-400">• Status: {selectedIncident.incident.status}</span>
                        </div>
                        <h2 className="text-base font-bold">{selectedIncident.incident.title}</h2>
                      </div>

                      <button
                        disabled={isInvestigating}
                        onClick={() => handleTriggerInvestigation(selectedIncident.incident.id)}
                        className="px-4 py-2 rounded-xl bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] text-xs font-bold flex items-center gap-2 transition glow-orange shrink-0"
                      >
                        <Bot className="w-4 h-4" />
                        {isInvestigating ? "Executing Multi-Agent Pipeline..." : "Execute Agent Investigation"}
                      </button>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className={`text-xs font-mono uppercase mb-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                        Incident Summary & Risk Assessment
                      </h4>
                      <p className={`text-xs p-3 rounded-xl border leading-relaxed ${
                        isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                      }`}>
                        {selectedIncident.incident.summary}
                      </p>
                    </div>

                    {/* Analyst Case Notes & Collaboration Journal */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#EB9F6E]" />
                          <h4 className="text-xs font-bold uppercase font-mono tracking-wider">
                            Analyst Case Notes & Human Collaboration Journal
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#6AC99F] font-bold">Dual-Control Audit Trail</span>
                      </div>

                      {/* Existing Notes Feed */}
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 mb-3">
                        {selectedIncident.analyst_notes?.map((n: any) => (
                          <div key={n.id} className={`p-3 rounded-xl border text-xs ${
                            isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[#EB9F6E]">{n.analyst_name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{n.created_at?.slice(0, 19)}</span>
                            </div>
                            <p className="leading-relaxed text-slate-300">{n.note}</p>
                          </div>
                        ))}
                      </div>

                      {/* Post Note Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type forensic finding or hypothesis..."
                          value={newAnalystNote}
                          onChange={(e) => setNewAnalystNote(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddIncidentNote()}
                          className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none ${
                            isSeashell
                              ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912] focus:border-[#EB9F6E]"
                              : "bg-[#0E0C0A] border-[#2E241D] text-[#FFFDF8] focus:border-[#EB9F6E]"
                          }`}
                        />
                        <button
                          onClick={handleAddIncidentNote}
                          className="px-3.5 py-2 bg-[#FFEABD] hover:bg-[#F2AF83] text-[#0E0C0A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <Send className="w-3.5 h-3.5" /> Post Note
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className={`text-xs font-mono uppercase mb-2 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                        Chronological Incident Timeline
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedIncident.timeline?.map((t: any) => (
                          <div key={t.id} className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                            isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                          }`}>
                            <Clock className="w-3.5 h-3.5 text-[#FFEABD] shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-mono text-[#EB9F6E]">
                                {t.actor} • {t.timestamp?.replace("T", " ").slice(0, 19)}
                              </div>
                              <div className="mt-0.5">{t.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">Select an incident to view details</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AGENTIC AI INVESTIGATIONS */}
          {activeTab === "agents" && (
            <div className="space-y-6">
              <div className={`p-5 rounded-xl border flex items-center justify-between shadow-sm ${
                isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
              }`}>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#EB9F6E]" />
                    Autonomous Multi-Agent Investigation Centre
                  </h3>
                  <p className={`text-xs mt-0.5 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    Coordinated 7 specialized cyber defense agents operating through deterministic safety rails and evidence grounding.
                  </p>
                </div>

                {selectedIncident && (
                  <button
                    disabled={isInvestigating}
                    onClick={() => handleTriggerInvestigation(selectedIncident.incident.id)}
                    className="px-4 py-2 bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] text-xs font-bold rounded-xl flex items-center gap-2 transition glow-orange"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {isInvestigating ? "Executing Multi-Agent System..." : "Re-Run Investigation"}
                  </button>
                )}
              </div>

              {/* Agent Run Cards */}
              <div className="space-y-4">
                {selectedIncident?.agent_runs && selectedIncident.agent_runs.length > 0 ? (
                  selectedIncident.agent_runs.map((r: any, idx: number) => (
                    <div key={r.id || idx} className={`p-4 rounded-xl border shadow-sm ${
                      isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
                    }`}>
                      <div className={`flex items-center justify-between border-b pb-3 mb-3 ${isSeashell ? "border-[#F3DECB]" : "border-[#2E241D]/60"}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#EB9F6E]/20 text-[#EB9F6E] flex items-center justify-center font-mono font-bold text-xs border border-[#EB9F6E]/40">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{r.agent_name}</h4>
                            <div className={`text-[10px] font-mono ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                              Model: {r.model_used} • Duration: {r.duration_ms}ms • Tokens: {r.tokens_used}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#6AC99F]/20 text-[#6AC99F] border border-[#6AC99F]/40">
                          {r.status}
                        </span>
                      </div>

                      {/* Tool Calls Log */}
                      {r.tool_calls_json && (
                        <div className="mb-3">
                          <div className={`text-[10px] font-mono uppercase mb-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                            Bounded Tool Invocations:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(r.tool_calls_json) ? r.tool_calls_json : [r.tool_calls_json]).map((t: any, tidx: number) => (
                              <span key={tidx} className={`text-[10px] font-mono px-2 py-1 rounded-lg border flex items-center gap-1 ${
                                isSeashell ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912]" : "bg-[#0E0C0A] border-[#2E241D] text-[#FFEABD]"
                              }`}>
                                <Terminal className="w-3 h-3 text-[#EB9F6E]" /> {t.tool || "tool_call"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Findings */}
                      <div className={`p-3 rounded-lg border ${
                        isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                      }`}>
                        <div className={`text-[10px] font-mono uppercase mb-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                          Synthesized Findings:
                        </div>
                        <pre className="text-xs font-mono-cyber whitespace-pre-wrap leading-relaxed">
                          {typeof r.output_findings === "string"
                            ? r.output_findings
                            : JSON.stringify(r.output_findings, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-12 text-center rounded-xl text-xs border ${
                    isSeashell ? "bg-white border-[#F3DECB] text-[#7E6857]" : "bg-[#1C1713] border-[#2E241D] text-slate-400"
                  }`}>
                    No agent runs recorded yet for this incident. Click "Launch AI Investigation" above!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: THREAT INTEL & ATTACK GRAPH */}
          {activeTab === "graph" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-2">Threat Intelligence & Multi-Entity Attack Chain</h3>
                {attackGraph ? (
                  <AttackGraphView initialNodes={attackGraph.nodes} initialEdges={attackGraph.edges} />
                ) : (
                  <div className="h-64 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    Loading attack topology...
                  </div>
                )}
              </div>

              {/* Threat Indicators Table */}
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <h4 className="text-sm font-bold mb-3">Threat Intelligence Indicators of Compromise (IOC)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`text-[10px] uppercase border-b ${
                      isSeashell ? "bg-[#FFF3DB] border-[#F3DECB] text-[#7E6857]" : "bg-[#15110E] border-[#2E241D] text-[#FFEABD]"
                    }`}>
                      <tr>
                        <th className="p-2.5">Indicator Value</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Threat Actor / Campaign</th>
                        <th className="p-2.5">Confidence</th>
                        <th className="p-2.5">MITRE Tactics</th>
                        <th className="p-2.5">Feed Source</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isSeashell ? "divide-[#F3DECB]" : "divide-[#2E241D]/60"}`}>
                      {threatIndicators.map((ioc) => (
                        <tr key={ioc.id} className={`transition ${isSeashell ? "hover:bg-[#FFFDF8]" : "hover:bg-[#261F1A]"}`}>
                          <td className="p-2.5 text-[#EB9F6E] font-bold">{ioc.value}</td>
                          <td className="p-2.5 text-[#FFEABD] uppercase">{ioc.indicator_type}</td>
                          <td className="p-2.5">
                            <span className="font-bold">{ioc.threat_actor}</span>
                            <div className="text-[10px] text-slate-400">{ioc.campaign}</div>
                          </td>
                          <td className="p-2.5 text-[#6AC99F] font-bold">{(ioc.confidence * 100).toFixed(0)}%</td>
                          <td className="p-2.5">
                            {Array.isArray(ioc.mitre_tactics) ? ioc.mitre_tactics.join(", ") : ioc.mitre_tactics}
                          </td>
                          <td className="p-2.5 text-slate-400">{ioc.source_feed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: KNOWLEDGE & RAG STUDIO */}
          {activeTab === "rag" && (
            <div className="space-y-6">
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <h3 className="text-base font-bold mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#EB9F6E]" /> Knowledge & RAG Studio
                </h3>
                <p className={`text-xs mb-4 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                  Query indexed NIST/MITRE cybersecurity playbooks, internal runbooks, and SOPs with hybrid vector & keyword retrieval.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    className={`flex-1 rounded-xl px-3.5 py-2 text-xs border focus:outline-none ${
                      isSeashell
                        ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912] focus:border-[#EB9F6E]"
                        : "bg-[#0E0C0A] border-[#2E241D] text-[#FFFDF8] focus:border-[#EB9F6E]"
                    }`}
                    placeholder="Enter security inquiry..."
                  />
                  <button
                    onClick={handleRagSearch}
                    className="px-4 py-2 bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] text-xs font-bold rounded-xl flex items-center gap-1.5 transition glow-orange"
                  >
                    <Search className="w-3.5 h-3.5" /> Execute Hybrid RAG Query
                  </button>
                </div>
              </div>

              {/* Citations Results */}
              {ragResults && (
                <div className={`p-5 rounded-xl border space-y-4 shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                  {ragResults.synthesized_guidance && (
                    <div className="p-3 bg-[#EB9F6E]/10 border border-[#EB9F6E]/40 rounded-xl text-xs text-[#EB9F6E]">
                      <span className="font-bold">Synthesized Guidance: </span>
                      {ragResults.synthesized_guidance}
                    </div>
                  )}

                  <h4 className={`text-xs font-mono uppercase ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    Verified Source Citations Grounded in Telemetry
                  </h4>
                  <div className="space-y-3">
                    {ragResults.citations?.map((c: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-xl border ${isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold">{c.document_title}</span>
                          <span className="text-[10px] font-mono bg-[#6AC99F]/20 text-[#6AC99F] px-2 py-0.5 rounded border border-[#6AC99F]/30">
                            Similarity: {(c.similarity_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#FFEABD] mb-2">Section: {c.section_title || "General"}</div>
                        <p className={`text-xs p-3 rounded-lg border leading-relaxed ${
                          isSeashell ? "bg-white border-[#F3DECB] text-[#241912]" : "bg-[#0A0F1D] border-[#2E241D]/60 text-slate-300"
                        }`}>
                          "{c.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: ML/DL & HUMAN ACTIVE LEARNING LAB */}
          {activeTab === "models" && (
            <div className="space-y-6">
              
              {/* Header with Human Active Learning Callout */}
              <div className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#EB9F6E]" />
                    <h3 className="text-base font-bold">ML / DL Model Registry & Human-in-the-Loop Active Learning</h3>
                  </div>
                  <p className={`text-xs mt-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                    Continuous model retraining informed by verified SOC analyst ground truth annotations.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={isFineTuning}
                    onClick={handleFineTuneHuman}
                    className="px-3.5 py-2 bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition glow-orange shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isFineTuning ? "Calibrating..." : "Calibrate with Human Annotations"}
                  </button>
                  <button
                    onClick={handleRetrainAutoencoder}
                    className="px-3.5 py-2 bg-[#FFEABD] hover:bg-[#F2AF83] text-[#0E0C0A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retrain Autoencoder (PyTorch)
                  </button>
                </div>
              </div>

              {/* Models Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modelsData?.models?.map((m: any) => (
                  <div key={m.id} className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm ${
                    isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                        <span className="text-[#6AC99F] font-bold uppercase">{m.status}</span>
                        <span className="text-slate-400">{m.framework}</span>
                      </div>
                      <h4 className="text-sm font-bold mb-1">{m.name}</h4>
                      <div className="text-[11px] text-[#EB9F6E] font-mono mb-3">{m.version}</div>

                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                      }`}>
                        {Object.entries(m.metrics || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className={isSeashell ? "text-[#7E6857]" : "text-slate-400"}>{k}:</span>
                            <span className="font-bold">{typeof v === "number" ? v.toFixed(3) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`mt-4 pt-2 border-t flex items-center justify-between text-xs font-mono ${
                      isSeashell ? "border-[#F3DECB]" : "border-[#2E241D]"
                    }`}>
                      <span className={isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}>Drift Score:</span>
                      <span className="text-[#6AC99F] font-bold">{m.drift_score} ({m.drift_status})</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Human-in-the-Loop Sensitivity & Analyst Fatigue Simulator */}
              <div className={`p-5 rounded-xl border space-y-4 shadow-sm ${
                isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#EB9F6E]" />
                      <h4 className="text-sm font-bold">Analyst Fatigue vs. Anomaly Sensitivity Tuning</h4>
                    </div>
                    <p className={`text-xs mt-0.5 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                      Human-crafted threshold slider: adjust operational sensitivity to prevent SOC analyst cognitive overload.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#EB9F6E]">
                    Selected Threshold: {selectedThreshold.toFixed(2)}
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">0.35 (High Sensitivity / Heavy Alert Burden)</span>
                    <span className="text-slate-400">0.85 (High Precision / Low Fatigue)</span>
                  </div>
                  <input
                    type="range"
                    min="0.35"
                    max="0.85"
                    step="0.10"
                    value={selectedThreshold}
                    onChange={(e) => setSelectedThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#FFEABD]/30 rounded-lg appearance-none cursor-pointer accent-[#EB9F6E]"
                  />
                </div>

                {/* Simulated Metrics for Selected Threshold */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">EST. ALERTS / SHIFT</div>
                    <div className="text-lg font-black font-mono mt-1 text-[#EB9F6E]">
                      {currentSensitivity.alerts_per_shift} alerts
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">FALSE POSITIVE BURDEN</div>
                    <div className="text-lg font-black font-mono mt-1 text-[#FFEABD]">
                      {currentSensitivity.false_positive_pct}%
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">THREAT RECALL</div>
                    <div className="text-lg font-black font-mono mt-1 text-[#6AC99F]">
                      {currentSensitivity.threat_recall_pct}%
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FFFDF8] border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">COGNITIVE FATIGUE INDEX</div>
                    <div className="text-xs font-bold font-mono mt-1" style={{ color: currentSensitivity.fatigue_color }}>
                      {currentSensitivity.analyst_fatigue_status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Human Feedback Annotation History */}
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <h4 className="text-sm font-bold mb-3 flex items-center justify-between">
                  <span>Recent Human Ground Truth Annotations (Active Learning Pool)</span>
                  <span className="text-xs font-mono text-[#6AC99F]">{humanFeedbackList.length} verified samples</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`text-[10px] uppercase border-b ${
                      isSeashell ? "bg-[#FFF3DB] border-[#F3DECB] text-[#7E6857]" : "bg-[#15110E] border-[#2E241D] text-[#FFEABD]"
                    }`}>
                      <tr>
                        <th className="p-2.5">Target ID</th>
                        <th className="p-2.5">Human Verdict</th>
                        <th className="p-2.5">Analyst Author</th>
                        <th className="p-2.5">Confidence</th>
                        <th className="p-2.5">Analyst Critique & Rationale</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isSeashell ? "divide-[#F3DECB]" : "divide-[#2E241D]/60"}`}>
                      {humanFeedbackList.map((fb) => (
                        <tr key={fb.id} className={`transition ${isSeashell ? "hover:bg-[#FFFDF8]" : "hover:bg-[#261F1A]"}`}>
                          <td className="p-2.5 text-[#FFEABD] font-bold">{fb.target_id}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              fb.verdict === "confirmed_threat"
                                ? "bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/40"
                                : "bg-[#FFEABD]/20 text-[#FFEABD] border border-[#FFEABD]/40"
                            }`}>
                              {fb.verdict.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold">{fb.analyst_name}</td>
                          <td className="p-2.5 text-[#6AC99F]">{(fb.confidence * 100).toFixed(0)}%</td>
                          <td className="p-2.5 text-slate-300 max-w-xs truncate">{fb.notes || fb.feature_critique || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: RESPONSE & APPROVAL QUEUE */}
          {activeTab === "response" && (
            <div className="space-y-6">
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#EB9F6E]" /> Controlled Defensive Response & Dual-Control Queue
                </h3>
                <p className={`text-xs mt-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                  Dual-Control authorization: high-impact containment (endpoint network quarantine, account session revocation, edge ACL injection) requires explicit Incident Commander approval before sandbox execution.
                </p>
              </div>

              {/* Pending Approvals */}
              <div className="space-y-3">
                <h4 className={`text-xs font-mono uppercase ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                  Pending Human Sign-Offs
                </h4>
                {approvals.filter(a => a.status === "pending").map((appr) => (
                  <div key={appr.id} className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-[#EB9F6E] ${
                    isSeashell ? "bg-white" : "bg-[#1C1713]"
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/40">
                          AWAITING AUTHORIZATION
                        </span>
                        <span className="text-xs font-mono text-[#FFEABD]">{appr.id}</span>
                        <span className="text-xs text-slate-400">• Requested by: {appr.requester_agent}</span>
                      </div>
                      <h4 className="text-sm font-bold">Action: {appr.action_type.replace(/_/g, " ").toUpperCase()}</h4>
                      <p className="text-xs mt-1">Target Entity: <span className="font-mono text-[#EB9F6E] font-bold">{appr.target_entity}</span></p>
                      <p className={`text-xs mt-1 ${isSeashell ? "text-[#7E6857]" : "text-slate-300"}`}>Rationale: {appr.reasoning}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDecideApproval(appr.id, "approved")}
                        className="px-4 py-2 bg-[#6AC99F] hover:bg-[#7edba9] text-[#0E0C0A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition glow-success"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Execute (Sandbox)
                      </button>
                      <button
                        onClick={() => handleDecideApproval(appr.id, "rejected")}
                        className="px-3.5 py-2 bg-[#EB9F6E]/20 hover:bg-[#EB9F6E]/30 border border-[#EB9F6E]/40 text-[#EB9F6E] text-xs font-bold rounded-xl transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}

                {approvals.filter(a => a.status === "pending").length === 0 && (
                  <div className={`p-8 text-center text-xs rounded-xl border ${
                    isSeashell ? "bg-white border-[#F3DECB] text-[#7E6857]" : "bg-[#1C1713] border-[#2E241D] text-slate-400"
                  }`}>
                    No pending approval requests. Trigger an autonomous investigation to evaluate defensive containment.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: OBSERVABILITY & AUDIT */}
          {activeTab === "observability" && (
            <div className="space-y-6">
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FFEABD]" /> System Observability & Immutable Audit Logs
                </h3>
                <p className={`text-xs mt-1 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                  Traceable immutable logs of all automated detection events, agent tool calls, and operator approvals.
                </p>
              </div>

              <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`text-[10px] uppercase border-b ${
                      isSeashell ? "bg-[#FFF3DB] border-[#F3DECB] text-[#7E6857]" : "bg-[#15110E] border-[#2E241D] text-[#FFEABD]"
                    }`}>
                      <tr>
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">Actor</th>
                        <th className="p-2.5">Action Executed</th>
                        <th className="p-2.5">Resource ID</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isSeashell ? "divide-[#F3DECB]" : "divide-[#2E241D]/60"}`}>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className={`transition ${isSeashell ? "hover:bg-[#FFFDF8]" : "hover:bg-[#261F1A]"}`}>
                          <td className="p-2.5 text-slate-400">{log.timestamp}</td>
                          <td className="p-2.5 text-[#EB9F6E] font-semibold">{log.actor}</td>
                          <td className="p-2.5 font-bold">{log.action}</td>
                          <td className="p-2.5 text-[#FFEABD]">{log.resource_id}</td>
                          <td className="p-2.5 text-[#6AC99F]">{log.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
              {/* Human Analyst Desk & Shift Handover Slide-Over */}
        {isAnalystDeskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`w-full max-w-xl h-full border-l p-6 flex flex-col justify-between overflow-y-auto shadow-2xl transition-all ${
              isSeashell ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912]" : "bg-[#15110E] border-[#2E241D] text-[#FFFDF8]"
            }`}>
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-inherit">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#EB9F6E]/20 border border-[#EB9F6E] flex items-center justify-center glow-orange">
                      <Coffee className="w-5 h-5 text-[#EB9F6E]" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold flex items-center gap-2">
                        <span>Human SOC Shift Desk</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EB9F6E] text-[#0E0C0A] font-bold">
                          SHIFT ALPHA
                        </span>
                      </h2>
                      <p className={`text-xs ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                        Human-in-the-Loop Handover Notes, Heuristic Gut-Checks & Operator Log
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAnalystDeskOpen(false)}
                    className="p-2 rounded-xl border border-inherit hover:bg-[#EB9F6E]/20 text-[#EB9F6E] transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Human Operator Badge & Shift Status */}
                <div className={`mt-4 p-4 rounded-2xl border ${
                  isSeashell ? "bg-[#FFF3DB] border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase text-[#EB9F6E] flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4" /> Operator Signature
                    </span>
                    <span className="text-[11px] font-mono text-[#6AC99F] font-bold">
                      ● Active Clearance: L4
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["Ajin", "Sarah", "Marcus"] as const).map((op) => (
                      <button
                        key={op}
                        onClick={() => setActiveOperator(op)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          activeOperator === op
                            ? "bg-[#EB9F6E] text-[#0E0C0A] shadow-md glow-orange"
                            : isSeashell
                              ? "bg-white border border-[#F3DECB] text-[#5E4A3E]"
                              : "bg-[#0E0C0A] border border-[#2E241D] text-slate-300"
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{op === "Ajin" ? "Ajin K. (Lead)" : op === "Sarah" ? "Sarah Chen" : "Marcus Vance"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add New Analyst Note / Gut-Check */}
                <div className={`mt-4 p-4 rounded-2xl border ${
                  isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-[#EB9F6E]" />
                      Record Human Ground Truth / Shift Note
                    </span>
                    <select
                      value={newOperatorTag}
                      onChange={(e) => setNewOperatorTag(e.target.value)}
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border bg-transparent ${
                        isSeashell ? "border-[#F3DECB] text-[#241912]" : "border-[#2E241D] text-[#FFEABD]"
                      }`}
                    >
                      <option value="VERIFIED GROUND TRUTH">VERIFIED GROUND TRUTH</option>
                      <option value="DUAL-CONTROL SIGNED">DUAL-CONTROL SIGNED</option>
                      <option value="THRESHOLD CALIBRATED">THRESHOLD CALIBRATED</option>
                      <option value="FALSE POSITIVE SUPPRESSED">FALSE POSITIVE SUPPRESSED</option>
                      <option value="RAG KNOWLEDGE LINKED">RAG KNOWLEDGE LINKED</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={newOperatorNoteText}
                    onChange={(e) => setNewOperatorNoteText(e.target.value)}
                    placeholder="Jot down human heuristic assessment, anomaly confirmation, or shift handover instructions..."
                    className={`w-full p-3 rounded-xl border text-xs outline-none transition resize-none ${
                      isSeashell
                        ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912] focus:border-[#EB9F6E]"
                        : "bg-[#0E0C0A] border-[#2E241D] text-[#FFFDF8] focus:border-[#EB9F6E]"
                    }`}
                  />
                  <div className="mt-2.5 flex justify-end">
                    <button
                      onClick={handleAddOperatorNote}
                      className="px-4 py-2 rounded-xl bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] font-bold text-xs flex items-center gap-1.5 transition glow-orange"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Pin to Shift Handover Board
                    </button>
                  </div>
                </div>

                {/* Handover Log Stream */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#EB9F6E]">
                      Live Shift Handover Feed ({operatorNotes.length} Entries)
                    </span>
                    <span className="text-[10px] font-mono text-[#6AC99F]">
                      100% Human Signed
                    </span>
                  </div>
                  {operatorNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#EB9F6E]">{note.author}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({note.role})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{note.time}</span>
                      </div>
                      <p className="text-xs leading-relaxed mb-2">{note.content}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-[#EB9F6E]/15 text-[#EB9F6E] border border-[#EB9F6E]/30">
                          {note.tag}
                        </span>
                        <span className="text-[#6AC99F] font-bold">
                          ✓ {note.intuition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-inherit text-center">
                <span className="text-[11px] font-mono text-[#7E6857]">
                  AEGIS-X SOC • Human Autonomous Defense Mesh • Operated by AjinLabs
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. EXPLAINABLE AI (XAI) SHAP WATERFALL MODAL */}
      {selectedExplainEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            isSeashell ? "bg-[#FFFDF8] border-[#F3DECB] text-[#241912]" : "bg-[#15110E] border-[#2E241D] text-[#FFFDF8]"
          }`}>
            <button
              onClick={() => { setSelectedExplainEvent(null); setExplanationData(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/40">
                  EXPLAINABLE AI DECOMPOSITION
                </span>
                <span className="text-xs font-mono text-[#FFEABD]">{selectedExplainEvent.id}</span>
              </div>
              <h2 className="text-base font-bold">Why the Model Flagged this Activity (SHAP Breakdown)</h2>
              <p className={`text-xs mt-0.5 ${isSeashell ? "text-[#7E6857]" : "text-[#FFEABD]"}`}>
                Decomposition of individual feature risk contributions against learned normal baseline.
              </p>
            </div>

            {explainingLoading ? (
              <div className="py-12 text-center text-xs font-mono text-[#FFEABD] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#EB9F6E]" /> Calculating Bayesian feature contributions...
              </div>
            ) : explanationData ? (
              <div className="space-y-4">
                {/* Score & Confidence Header */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
                }`}>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">COMPOSITE RISK SCORE</div>
                    <div className="text-xl font-black font-mono text-[#EB9F6E]">
                      {(explanationData.composite_score * 100).toFixed(1)} / 100
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">CALIBRATED CONFIDENCE</div>
                    <div className="text-xl font-black font-mono text-[#6AC99F]">
                      {(explanationData.calibrated_confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">DETECTION VERDICT</div>
                    <div className="text-xs font-bold font-mono text-[#EB9F6E] uppercase">
                      {explanationData.is_anomaly ? "Anomalous Intrusion" : "Benign Baseline"}
                    </div>
                  </div>
                </div>

                {/* Feature Contribution Waterfall */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Feature Risk Attribution Waterfall</h4>
                  <div className="space-y-2.5">
                    {explanationData.feature_contributions?.map((fc: any, i: number) => {
                      const isRisk = fc.direction === "risk_increase";
                      return (
                        <div key={i} className={`p-3 rounded-xl border text-xs ${
                          isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#0E0C0A] border-[#2E241D]"
                        }`}>
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isRisk ? "bg-[#EB9F6E]" : "bg-[#FFEABD]"}`} />
                              {fc.feature_name}
                            </span>
                            <span className={`font-mono font-bold ${isRisk ? "text-[#EB9F6E]" : "text-[#FFEABD]"}`}>
                              {fc.impact_percentage}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isSeashell ? "text-[#5E4A3E]" : "text-slate-300"}`}>
                            {fc.human_explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Human Feedback Action Inside Modal */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isSeashell ? "bg-white border-[#F3DECB]" : "bg-[#1C1713] border-[#2E241D]"
                }`}>
                  <div>
                    <div className="text-xs font-bold">Provide Human Feedback on this Prediction</div>
                    <div className="text-[10px] text-slate-400 font-mono">Reinforce or correct model weights</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleHumanFeedback("event", selectedExplainEvent.id, "confirmed_threat");
                        setSelectedExplainEvent(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#EB9F6E] hover:bg-[#F2AF83] text-[#0E0C0A] font-bold text-xs flex items-center gap-1 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Confirm Threat
                    </button>
                    <button
                      onClick={() => {
                        handleHumanFeedback("event", selectedExplainEvent.id, "false_positive");
                        setSelectedExplainEvent(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FFEABD] hover:bg-[#F2AF83] text-[#0E0C0A] font-bold text-xs flex items-center gap-1 transition"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Flag False Positive
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
