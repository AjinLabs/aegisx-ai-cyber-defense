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
  Crosshair
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
  const [themeMode, setThemeMode] = useState<"dark" | "seashell">("dark");

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

  // Toggle Theme
  useEffect(() => {
    if (themeMode === "seashell") {
      document.documentElement.setAttribute("data-theme", "seashell");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [themeMode]);

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

  const loadIncidentDetails = async (id: string) => {
    try {
      const data = await api.fetchIncidentDetail(id);
      setSelectedIncident(data);
    } catch (err) {
      console.error(err);
    }
  };

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
  const isSeashell = themeMode === "seashell";

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${isSeashell ? "bg-[#FAF0EA] text-[#141C2B]" : "bg-[#090E17] text-[#FAF0EA]"}`}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 transition-colors duration-300 ${isSeashell ? "bg-[#F2E3DA] border-[#E5D2C5]" : "bg-[#0E1524] border-[#1E2D48]"}`}>
        <div>
          {/* Logo Brand with Palette Indicator */}
          <div className={`p-4 border-b flex items-center justify-between ${isSeashell ? "border-[#E5D2C5]" : "border-[#1E2D48]"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E19AA6]/20 border border-[#E19AA6] flex items-center justify-center glow-rose shadow-md">
                <Shield className="w-5 h-5 text-[#E19AA6]" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-wider flex items-center gap-1.5">
                  <span className={isSeashell ? "text-[#141C2B]" : "text-[#FAF0EA]"}>AEGIS</span>
                  <span className="text-[#E19AA6]">X</span>
                  <span className="text-[10px] bg-[#E19AA6] text-[#090E17] px-1.5 py-0.2 rounded font-mono font-bold">SOC</span>
                </div>
                <div className={`text-[10px] font-mono tracking-tight ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                  Human-in-the-Loop Cyber AI
                </div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setThemeMode(themeMode === "dark" ? "seashell" : "dark")}
              title={themeMode === "dark" ? "Switch to Seashell Executive Mode" : "Switch to Cyber Rose Dark Mode"}
              className={`p-1.5 rounded-lg border transition-all ${
                isSeashell
                  ? "bg-[#FAF0EA] border-[#DEC8BC] text-[#D67786] hover:bg-white"
                  : "bg-[#121C2F] border-[#1E2D48] text-[#E19AA6] hover:bg-[#17243C]"
              }`}
            >
              {isSeashell ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Tenancy & Active Analyst Clearance */}
          <div className={`p-3 mx-2.5 my-2.5 rounded-xl border text-xs shadow-sm ${
            isSeashell
              ? "bg-[#FAF0EA] border-[#E5D2C5]"
              : "bg-[#121C2F] border-[#1E2D48]"
          }`}>
            <div className={`text-[10px] uppercase font-mono tracking-wider mb-1 flex items-center justify-between ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
              <span>Active Workspace</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#E19AA6]/20 text-[#E19AA6]">HITL Active</span>
            </div>
            <div className="font-bold flex items-center justify-between">
              <span className={isSeashell ? "text-[#141C2B]" : "text-[#FAF0EA]"}>Global Cyber Command</span>
              <span className="w-2 h-2 rounded-full bg-[#6AC99F] animate-pulse" />
            </div>
            <div className={`text-[10px] font-mono mt-0.5 ${isSeashell ? "text-[#8E7A70]" : "text-slate-400"}`}>
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
                        ? "bg-[#D67786] text-white font-semibold shadow-md shadow-[#D67786]/25"
                        : "bg-[#E19AA6] text-[#090E17] font-bold shadow-md shadow-[#E19AA6]/20"
                      : isSeashell
                        ? "text-[#4B5A70] hover:text-[#141C2B] hover:bg-[#FAF0EA]"
                        : "text-slate-400 hover:text-[#FAF0EA] hover:bg-[#121C2F]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? (isSeashell ? "text-white" : "text-[#090E17]") : (isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]")}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? isSeashell ? "bg-white/30 text-white" : "bg-[#090E17]/25 text-[#090E17]"
                          : isSeashell
                            ? "bg-[#D67786]/20 text-[#D67786] border border-[#D67786]/30"
                            : "bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/40"
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
        <div className={`p-3 border-t flex items-center gap-2.5 ${isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"}`}>
          <div className="w-8 h-8 rounded-full bg-[#E19AA6]/20 border border-[#E19AA6]/50 flex items-center justify-center text-xs font-bold text-[#E19AA6]">
            SC
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold truncate ${isSeashell ? "text-[#141C2B]" : "text-[#FAF0EA]"}`}>Sarah Chen</div>
            <div className="text-[10px] text-[#6AC99F] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6AC99F] inline-block" />
              SOC Lead • Shift Alpha
            </div>
          </div>
          <button
            onClick={refreshAllData}
            title="Refresh State"
            className={`p-1.5 rounded-lg border transition ${
              isSeashell ? "border-[#E5D2C5] hover:bg-white text-[#4B5A70]" : "border-[#1E2D48] hover:bg-[#121C2F] text-slate-400 hover:text-white"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#E19AA6]" : ""}`} />
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Operational Bar */}
        <header className={`h-14 border-b px-6 flex items-center justify-between shrink-0 transition-colors ${
          isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#0E1524] border-[#1E2D48]"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`text-xs font-mono uppercase tracking-wider ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
              Defense Status: <span className="text-[#6AC99F] font-bold">ACTIVE DEFENSE</span>
            </div>
            <div className={`h-3 w-px ${isSeashell ? "bg-[#E5D2C5]" : "bg-[#1E2D48]"}`} />
            <div className={`text-xs font-mono flex items-center gap-1.5 ${isSeashell ? "text-[#141C2B]" : "text-slate-300"}`}>
              <span className="w-2 h-2 rounded-full bg-[#82B0CE] animate-pulse" />
              <span>Throughput: {metrics?.events_per_second || 14.8} EPS</span>
            </div>
            <div className={`h-3 w-px ${isSeashell ? "bg-[#E5D2C5]" : "bg-[#1E2D48]"}`} />
            <div className={`text-xs font-mono ${isSeashell ? "text-[#141C2B]" : "text-slate-300"}`}>
              Analyst Agreement: <span className="text-[#E19AA6] font-bold">96.4% calibrated</span>
            </div>
          </div>

          {/* Quick Scenario Injector & Actions */}
          <div className="flex items-center gap-2">
            <div className={`text-xs font-mono mr-1 hidden lg:inline ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
              Inject Real Telemetry:
            </div>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario("brute_force_lateral")}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#E19AA6]/15 border border-[#E19AA6]/40 text-[#E19AA6] hover:bg-[#E19AA6]/25 transition flex items-center gap-1 font-mono font-medium"
            >
              <Zap className="w-3 h-3 text-[#E19AA6]" /> APT29 Credential Spray
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateScenario("c2_exfiltration")}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#82B0CE]/15 border border-[#82B0CE]/40 text-[#82B0CE] hover:bg-[#82B0CE]/25 transition flex items-center gap-1 font-mono font-medium"
            >
              <Zap className="w-3 h-3 text-[#82B0CE]" /> FIN7 C2 Beacon
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
            isSeashell ? "bg-[#F8EFE9] border-[#D67786] text-[#D67786]" : "bg-[#121C2F] border-[#E19AA6] text-[#E19AA6]"
          }`}>
            <div className="flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-[#E19AA6]" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-[#FAF0EA]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab View Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW / COMMAND CENTRE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Executive Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                  <div className={`flex items-center justify-between text-xs font-mono mb-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    <span>TOTAL TELEMETRY EVENTS</span>
                    <Terminal className="w-4 h-4 text-[#82B0CE]" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight">{metrics?.total_events || 0}</div>
                  <div className="text-[11px] text-[#6AC99F] font-mono mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +14.8 EPS ingest rate
                  </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                  <div className="flex items-center justify-between text-[#E19AA6] text-xs font-mono mb-1">
                    <span>ACTIVE INCIDENTS</span>
                    <AlertOctagon className="w-4 h-4 text-[#E19AA6]" />
                  </div>
                  <div className="text-2xl font-black text-[#E19AA6] font-mono tracking-tight">
                    {metrics?.active_incidents || 0}
                  </div>
                  <div className="text-[11px] text-[#E19AA6] font-mono mt-1">
                    {metrics?.critical_incidents || 0} Critical priority open
                  </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                  <div className={`flex items-center justify-between text-xs font-mono mb-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    <span>MODEL F1 SCORE (CALIBRATED)</span>
                    <Cpu className="w-4 h-4 text-[#E19AA6]" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight">{metrics?.f1_score || 0.941}</div>
                  <div className={`text-[11px] font-mono mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-slate-400"}`}>
                    Prec: {metrics?.precision || 0.965} • Rec: {metrics?.recall || 0.918}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                  <div className={`flex items-center justify-between text-xs font-mono mb-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    <span>MTTD / MTTR</span>
                    <Clock className="w-4 h-4 text-[#82B0CE]" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight">
                    {metrics?.mttd_minutes || 1.4}m / {metrics?.mttr_minutes || 8.2}m
                  </div>
                  <div className="text-[11px] text-[#6AC99F] font-mono mt-1">SLA Compliance: 99.4%</div>
                </div>
              </div>

              {/* Visual Charts: Volume Timeline & Severity Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold">Security Telemetry Velocity & Anomaly Cascade</h3>
                      <p className={`text-xs ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                        Raw events correlated against Scikit-Learn and PyTorch Autoencoder anomalies
                      </p>
                    </div>
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                      isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B]" : "bg-[#090E17] border-[#1E2D48] text-[#82B0CE]"
                    }`}>
                      24h Horizon
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics?.hourly_event_volume || []}>
                        <defs>
                          <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82B0CE" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#82B0CE" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E19AA6" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#E19AA6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isSeashell ? "#E5D2C5" : "#1E2D48"} />
                        <XAxis dataKey="time" stroke={isSeashell ? "#6B7B94" : "#82B0CE"} fontSize={11} />
                        <YAxis stroke={isSeashell ? "#6B7B94" : "#82B0CE"} fontSize={11} />
                        <Tooltip contentStyle={{
                          backgroundColor: isSeashell ? "#FAF0EA" : "#0E1524",
                          borderColor: isSeashell ? "#E5D2C5" : "#1E2D48",
                          color: isSeashell ? "#141C2B" : "#FAF0EA",
                          fontSize: "12px",
                          borderRadius: "8px"
                        }} />
                        <Area type="monotone" dataKey="events" stroke="#82B0CE" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEvents)" name="Total Events" />
                        <Area type="monotone" dataKey="anomalies" stroke="#E19AA6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAnomalies)" name="Detected Anomalies" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alert Severity Distribution */}
                <div className={`p-5 rounded-xl border flex flex-col justify-between shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                  <div>
                    <h3 className="text-sm font-bold mb-1">Alert Severity Distribution</h3>
                    <p className={`text-xs mb-4 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                      Grounded by Layer E detection fusion engine
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: "Critical", count: alerts.filter(a => a.severity === "critical").length || 3, color: "bg-[#E19AA6]", textColor: "text-[#E19AA6]" },
                        { label: "High", count: alerts.filter(a => a.severity === "high").length || 4, color: "bg-[#F0B0BB]", textColor: "text-[#E19AA6]" },
                        { label: "Medium", count: alerts.filter(a => a.severity === "medium").length || 2, color: "bg-[#82B0CE]", textColor: "text-[#82B0CE]" },
                        { label: "Low", count: alerts.filter(a => a.severity === "low").length || 1, color: "bg-[#6AC99F]", textColor: "text-[#6AC99F]" }
                      ].map((s) => (
                        <div key={s.label} className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
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
                    className="w-full mt-4 py-2 bg-[#E19AA6]/15 hover:bg-[#E19AA6]/25 border border-[#E19AA6]/40 text-[#E19AA6] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    View Incident Investigation Queue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active High-Priority Incidents Feed */}
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-[#E19AA6]" />
                    <h3 className="text-sm font-bold">Active High-Priority Incidents & Active Investigations</h3>
                  </div>
                  <span className={`text-xs font-mono ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    {incidents.length} active incidents tracked
                  </span>
                </div>

                <div className="space-y-3">
                  {incidents.slice(0, 4).map((inc) => (
                    <div
                      key={inc.id}
                      className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition hover:border-[#E19AA6] ${
                        isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/30">
                            {inc.severity}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{inc.id}</span>
                          <span className="text-[11px] font-mono text-[#82B0CE]">• Risk Score: {inc.risk_score}</span>
                        </div>
                        <h4 className="text-xs font-bold truncate">{inc.title}</h4>
                        <p className={`text-[11px] truncate ${isSeashell ? "text-[#6B7B94]" : "text-slate-300"}`}>{inc.summary}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            loadIncidentDetails(inc.id);
                            setActiveTab("agents");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#E19AA6] hover:bg-[#F0B0BB] text-[#090E17] text-xs font-bold flex items-center gap-1.5 transition glow-rose"
                        >
                          <Bot className="w-3.5 h-3.5" /> Launch AI Investigation
                        </button>
                        <button
                          onClick={() => {
                            loadIncidentDetails(inc.id);
                            setActiveTab("incidents");
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                            isSeashell ? "bg-white border-[#E5D2C5] text-[#141C2B] hover:bg-[#F8EFE9]" : "bg-[#121C2F] border-[#1E2D48] text-slate-300 hover:bg-[#17243C]"
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
                isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
              }`}>
                <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                  <Search className={`w-4 h-4 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`} />
                  <input
                    type="text"
                    placeholder="Search host, user, IP, action, process..."
                    value={telemetryFilter.search}
                    onChange={(e) => setTelemetryFilter({ ...telemetryFilter, search: e.target.value })}
                    className={`rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none border ${
                      isSeashell
                        ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B] placeholder-[#8E7A70] focus:border-[#D67786]"
                        : "bg-[#090E17] border-[#1E2D48] text-[#FAF0EA] placeholder-slate-500 focus:border-[#E19AA6]"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={telemetryFilter.category}
                    onChange={(e) => setTelemetryFilter({ ...telemetryFilter, category: e.target.value })}
                    className={`rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border ${
                      isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B]" : "bg-[#090E17] border-[#1E2D48] text-slate-300"
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
                      isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B]" : "bg-[#090E17] border-[#1E2D48] text-slate-300"
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
                        ? "bg-[#E19AA6]/20 border-[#E19AA6] text-[#E19AA6]"
                        : isSeashell
                          ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#6B7B94]"
                          : "bg-[#090E17] border-[#1E2D48] text-slate-400"
                    }`}
                  >
                    {telemetryFilter.anomalyOnly ? "Anomalies Only" : "Show All Events"}
                  </button>
                </div>
              </div>

              {/* Event Table with Explain Button & Human Verdict */}
              <div className={`rounded-xl border overflow-hidden shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`font-mono uppercase text-[10px] border-b ${
                      isSeashell ? "bg-[#F2E3DA] border-[#E5D2C5] text-[#6B7B94]" : "bg-[#0E1524] border-[#1E2D48] text-[#82B0CE]"
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
                    <tbody className={`divide-y font-mono ${isSeashell ? "divide-[#E5D2C5]" : "divide-[#1E2D48]/60"}`}>
                      {filteredEvents.map((ev) => (
                        <tr key={ev.id} className={`transition ${isSeashell ? "hover:bg-[#FAF0EA]" : "hover:bg-[#17243C]"}`}>
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            {ev.timestamp ? ev.timestamp.replace("T", " ").slice(0, 19) : "2026-10-13 14:00:00"}
                          </td>
                          <td className="p-3">
                            <div className="font-bold">{ev.action}</div>
                            <div className="text-[10px] text-[#82B0CE] capitalize">{ev.category} • {ev.outcome}</div>
                          </td>
                          <td className="p-3">
                            <div>{ev.host_id || "—"}</div>
                            <div className="text-[10px] text-[#E19AA6]">{ev.user_id || "—"}</div>
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
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/40">
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
                              className="px-2 py-1 rounded bg-[#82B0CE]/15 hover:bg-[#82B0CE]/25 border border-[#82B0CE]/40 text-[#82B0CE] text-[10px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <Crosshair className="w-3 h-3" /> Explain XAI
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleHumanFeedback("event", ev.id, "confirmed_threat")}
                                title="Confirm Threat (True Positive)"
                                className="p-1 rounded bg-[#E19AA6]/20 hover:bg-[#E19AA6]/30 text-[#E19AA6] border border-[#E19AA6]/40 transition"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleHumanFeedback("event", ev.id, "false_positive")}
                                title="Mark False Positive"
                                className="p-1 rounded bg-[#82B0CE]/20 hover:bg-[#82B0CE]/30 text-[#82B0CE] border border-[#82B0CE]/40 transition"
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
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E19AA6]" /> 5-Layer Autonomous Detection & Fusion Engine
                </h3>
                <p className={`text-xs mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                  Deterministic Rules → Statistical Baselines → Scikit-Learn Anomaly Classifier → PyTorch Deep Autoencoder → Layer E Fusion Risk Engine.
                </p>
              </div>

              {/* Detection Layers Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { layer: "Layer A", title: "Deterministic Rules", tech: "Regex & IOC Signatures", status: "Active (4 Rules)", color: "border-[#E19AA6]" },
                  { layer: "Layer B", title: "Statistical Baseline", tech: "Z-Score Frequency Delta", status: "Monitoring 24h", color: "border-[#82B0CE]" },
                  { layer: "Layer C", title: "Scikit-Learn ML", tech: "Isolation Forest + RF", status: "F1: 0.941", color: "border-[#E19AA6]" },
                  { layer: "Layer D", title: "Deep Autoencoder", tech: "PyTorch 8-dim Bottleneck", status: "Loss: 0.042", color: "border-[#82B0CE]" },
                  { layer: "Layer E", title: "Detection Fusion", tech: "Human Risk Calibration", status: "Calibrated 96.4%", color: "border-[#6AC99F]" }
                ].map((l) => (
                  <div key={l.layer} className={`p-4 rounded-xl border-2 shadow-sm ${l.color} ${isSeashell ? "bg-white" : "bg-[#121C2F]"}`}>
                    <div className="text-[10px] font-mono font-bold text-[#E19AA6]">{l.layer}</div>
                    <div className="text-xs font-bold mt-0.5">{l.title}</div>
                    <div className={`text-[11px] font-mono mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-slate-400"}`}>{l.tech}</div>
                    <div className="mt-3 text-[10px] font-mono font-bold text-[#6AC99F] bg-[#6AC99F]/10 px-2 py-0.5 rounded border border-[#6AC99F]/30 inline-block">
                      {l.status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Rules List */}
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <h4 className="text-sm font-bold mb-3">Configured Deterministic Detection Rules</h4>
                <div className="space-y-2.5">
                  {[
                    { id: "rule-auth-001", name: "Distributed Brute Force / Credential Stuffing", mitre: "T1110", severity: "high", desc: "Threshold: >3 failed authentications within 300s window" },
                    { id: "rule-priv-002", name: "Unauthorized Privilege Escalation & Admin Token Abuse", mitre: "T1078", severity: "critical", desc: "Pattern: Administrative binary invocation (mimikatz, vssadmin, powershell)" },
                    { id: "rule-c2-003", name: "Beaconing to Known Malicious Threat Intel C2 IP", mitre: "T1071", severity: "critical", desc: "IOC Match against APT29 / Midnight Blizzard threat feeds" },
                    { id: "rule-exfil-004", name: "Abnormal Data Egress over Non-Standard Port", mitre: "T1048", severity: "high", desc: "Port: 4444, 1337, 8080 with >50MB egress traffic" }
                  ].map((r) => (
                    <div key={r.id} className={`p-3 rounded-lg border flex items-center justify-between ${
                      isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                    }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/30">
                            {r.severity}
                          </span>
                          <span className="text-xs font-bold">{r.name}</span>
                          <span className="text-[10px] font-mono text-[#82B0CE]">• MITRE {r.mitre}</span>
                        </div>
                        <p className={`text-[11px] ${isSeashell ? "text-[#6B7B94]" : "text-slate-400"}`}>{r.desc}</p>
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
                  <span className={`text-xs font-mono ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    {incidents.length} active
                  </span>
                </h3>

                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => loadIncidentDetails(inc.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      selectedIncident?.incident?.id === inc.id
                        ? "border-[#E19AA6] bg-[#E19AA6]/10 shadow-md"
                        : isSeashell
                          ? "bg-white border-[#E5D2C5] hover:border-[#D67786]"
                          : "bg-[#121C2F] border-[#1E2D48] hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#E19AA6] uppercase font-bold">{inc.severity}</span>
                      <span className="text-slate-400">{inc.status}</span>
                    </div>
                    <div className="text-xs font-bold">{inc.title}</div>
                    <div className={`text-[11px] truncate mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>{inc.summary}</div>
                  </div>
                ))}
              </div>

              {/* Incident Investigation Workspace with Case Notes */}
              <div className={`lg:col-span-2 p-5 rounded-xl border space-y-5 shadow-sm ${
                isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
              }`}>
                {selectedIncident ? (
                  <>
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
                      isSeashell ? "border-[#E5D2C5]" : "border-[#1E2D48]"
                    }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/30">
                            {selectedIncident.incident.severity}
                          </span>
                          <span className="text-xs font-mono text-[#82B0CE]">{selectedIncident.incident.id}</span>
                          <span className="text-xs font-mono text-slate-400">• Status: {selectedIncident.incident.status}</span>
                        </div>
                        <h2 className="text-base font-bold">{selectedIncident.incident.title}</h2>
                      </div>

                      <button
                        disabled={isInvestigating}
                        onClick={() => handleTriggerInvestigation(selectedIncident.incident.id)}
                        className="px-4 py-2 rounded-xl bg-[#E19AA6] hover:bg-[#F0B0BB] text-[#090E17] text-xs font-bold flex items-center gap-2 transition glow-rose shrink-0"
                      >
                        <Bot className="w-4 h-4" />
                        {isInvestigating ? "Executing Multi-Agent Pipeline..." : "Execute Agent Investigation"}
                      </button>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className={`text-xs font-mono uppercase mb-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                        Incident Summary & Risk Assessment
                      </h4>
                      <p className={`text-xs p-3 rounded-xl border leading-relaxed ${
                        isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                      }`}>
                        {selectedIncident.incident.summary}
                      </p>
                    </div>

                    {/* Analyst Case Notes & Collaboration Journal */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#E19AA6]" />
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
                            isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[#E19AA6]">{n.analyst_name}</span>
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
                              ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B] focus:border-[#D67786]"
                              : "bg-[#090E17] border-[#1E2D48] text-[#FAF0EA] focus:border-[#E19AA6]"
                          }`}
                        />
                        <button
                          onClick={handleAddIncidentNote}
                          className="px-3.5 py-2 bg-[#82B0CE] hover:bg-[#9AC2DC] text-[#090E17] font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <Send className="w-3.5 h-3.5" /> Post Note
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className={`text-xs font-mono uppercase mb-2 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                        Chronological Incident Timeline
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedIncident.timeline?.map((t: any) => (
                          <div key={t.id} className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                            isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                          }`}>
                            <Clock className="w-3.5 h-3.5 text-[#82B0CE] shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-mono text-[#E19AA6]">
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
                isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
              }`}>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#E19AA6]" />
                    Autonomous Multi-Agent Investigation Centre
                  </h3>
                  <p className={`text-xs mt-0.5 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    Coordinated 7 specialized cyber defense agents operating through deterministic safety rails and evidence grounding.
                  </p>
                </div>

                {selectedIncident && (
                  <button
                    disabled={isInvestigating}
                    onClick={() => handleTriggerInvestigation(selectedIncident.incident.id)}
                    className="px-4 py-2 bg-[#E19AA6] hover:bg-[#F0B0BB] text-[#090E17] text-xs font-bold rounded-xl flex items-center gap-2 transition glow-rose"
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
                      isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
                    }`}>
                      <div className={`flex items-center justify-between border-b pb-3 mb-3 ${isSeashell ? "border-[#E5D2C5]" : "border-[#1E2D48]/60"}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#E19AA6]/20 text-[#E19AA6] flex items-center justify-center font-mono font-bold text-xs border border-[#E19AA6]/40">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{r.agent_name}</h4>
                            <div className={`text-[10px] font-mono ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
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
                          <div className={`text-[10px] font-mono uppercase mb-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                            Bounded Tool Invocations:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(r.tool_calls_json) ? r.tool_calls_json : [r.tool_calls_json]).map((t: any, tidx: number) => (
                              <span key={tidx} className={`text-[10px] font-mono px-2 py-1 rounded-lg border flex items-center gap-1 ${
                                isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B]" : "bg-[#090E17] border-[#1E2D48] text-[#82B0CE]"
                              }`}>
                                <Terminal className="w-3 h-3 text-[#E19AA6]" /> {t.tool || "tool_call"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Findings */}
                      <div className={`p-3 rounded-lg border ${
                        isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                      }`}>
                        <div className={`text-[10px] font-mono uppercase mb-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
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
                    isSeashell ? "bg-white border-[#E5D2C5] text-[#6B7B94]" : "bg-[#121C2F] border-[#1E2D48] text-slate-400"
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
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <h4 className="text-sm font-bold mb-3">Threat Intelligence Indicators of Compromise (IOC)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`text-[10px] uppercase border-b ${
                      isSeashell ? "bg-[#F2E3DA] border-[#E5D2C5] text-[#6B7B94]" : "bg-[#0E1524] border-[#1E2D48] text-[#82B0CE]"
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
                    <tbody className={`divide-y ${isSeashell ? "divide-[#E5D2C5]" : "divide-[#1E2D48]/60"}`}>
                      {threatIndicators.map((ioc) => (
                        <tr key={ioc.id} className={`transition ${isSeashell ? "hover:bg-[#FAF0EA]" : "hover:bg-[#17243C]"}`}>
                          <td className="p-2.5 text-[#E19AA6] font-bold">{ioc.value}</td>
                          <td className="p-2.5 text-[#82B0CE] uppercase">{ioc.indicator_type}</td>
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
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <h3 className="text-base font-bold mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#E19AA6]" /> Knowledge & RAG Studio
                </h3>
                <p className={`text-xs mb-4 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                  Query indexed NIST/MITRE cybersecurity playbooks, internal runbooks, and SOPs with hybrid vector & keyword retrieval.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    className={`flex-1 rounded-xl px-3.5 py-2 text-xs border focus:outline-none ${
                      isSeashell
                        ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B] focus:border-[#D67786]"
                        : "bg-[#090E17] border-[#1E2D48] text-[#FAF0EA] focus:border-[#E19AA6]"
                    }`}
                    placeholder="Enter security inquiry..."
                  />
                  <button
                    onClick={handleRagSearch}
                    className="px-4 py-2 bg-[#E19AA6] hover:bg-[#F0B0BB] text-[#090E17] text-xs font-bold rounded-xl flex items-center gap-1.5 transition glow-rose"
                  >
                    <Search className="w-3.5 h-3.5" /> Execute Hybrid RAG Query
                  </button>
                </div>
              </div>

              {/* Citations Results */}
              {ragResults && (
                <div className={`p-5 rounded-xl border space-y-4 shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                  {ragResults.synthesized_guidance && (
                    <div className="p-3 bg-[#E19AA6]/10 border border-[#E19AA6]/40 rounded-xl text-xs text-[#E19AA6]">
                      <span className="font-bold">Synthesized Guidance: </span>
                      {ragResults.synthesized_guidance}
                    </div>
                  )}

                  <h4 className={`text-xs font-mono uppercase ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    Verified Source Citations Grounded in Telemetry
                  </h4>
                  <div className="space-y-3">
                    {ragResults.citations?.map((c: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-xl border ${isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold">{c.document_title}</span>
                          <span className="text-[10px] font-mono bg-[#6AC99F]/20 text-[#6AC99F] px-2 py-0.5 rounded border border-[#6AC99F]/30">
                            Similarity: {(c.similarity_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#82B0CE] mb-2">Section: {c.section_title || "General"}</div>
                        <p className={`text-xs p-3 rounded-lg border leading-relaxed ${
                          isSeashell ? "bg-white border-[#E5D2C5] text-[#141C2B]" : "bg-[#0A0F1D] border-[#1E2D48]/60 text-slate-300"
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
                isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#E19AA6]" />
                    <h3 className="text-base font-bold">ML / DL Model Registry & Human-in-the-Loop Active Learning</h3>
                  </div>
                  <p className={`text-xs mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                    Continuous model retraining informed by verified SOC analyst ground truth annotations.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={isFineTuning}
                    onClick={handleFineTuneHuman}
                    className="px-3.5 py-2 bg-[#E19AA6] hover:bg-[#F0B0BB] text-[#090E17] font-bold text-xs rounded-xl flex items-center gap-1.5 transition glow-rose shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isFineTuning ? "Calibrating..." : "Calibrate with Human Annotations"}
                  </button>
                  <button
                    onClick={handleRetrainAutoencoder}
                    className="px-3.5 py-2 bg-[#82B0CE] hover:bg-[#9AC2DC] text-[#090E17] font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retrain Autoencoder (PyTorch)
                  </button>
                </div>
              </div>

              {/* Models Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modelsData?.models?.map((m: any) => (
                  <div key={m.id} className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm ${
                    isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                        <span className="text-[#6AC99F] font-bold uppercase">{m.status}</span>
                        <span className="text-slate-400">{m.framework}</span>
                      </div>
                      <h4 className="text-sm font-bold mb-1">{m.name}</h4>
                      <div className="text-[11px] text-[#E19AA6] font-mono mb-3">{m.version}</div>

                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                      }`}>
                        {Object.entries(m.metrics || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className={isSeashell ? "text-[#6B7B94]" : "text-slate-400"}>{k}:</span>
                            <span className="font-bold">{typeof v === "number" ? v.toFixed(3) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`mt-4 pt-2 border-t flex items-center justify-between text-xs font-mono ${
                      isSeashell ? "border-[#E5D2C5]" : "border-[#1E2D48]"
                    }`}>
                      <span className={isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}>Drift Score:</span>
                      <span className="text-[#6AC99F] font-bold">{m.drift_score} ({m.drift_status})</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Human-in-the-Loop Sensitivity & Analyst Fatigue Simulator */}
              <div className={`p-5 rounded-xl border space-y-4 shadow-sm ${
                isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#E19AA6]" />
                      <h4 className="text-sm font-bold">Analyst Fatigue vs. Anomaly Sensitivity Tuning</h4>
                    </div>
                    <p className={`text-xs mt-0.5 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                      Human-crafted threshold slider: adjust operational sensitivity to prevent SOC analyst cognitive overload.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#E19AA6]">
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
                    className="w-full h-2 bg-[#82B0CE]/30 rounded-lg appearance-none cursor-pointer accent-[#E19AA6]"
                  />
                </div>

                {/* Simulated Metrics for Selected Threshold */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">EST. ALERTS / SHIFT</div>
                    <div className="text-lg font-black font-mono mt-1 text-[#E19AA6]">
                      {currentSensitivity.alerts_per_shift} alerts
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">FALSE POSITIVE BURDEN</div>
                    <div className="text-lg font-black font-mono mt-1 text-[#82B0CE]">
                      {currentSensitivity.false_positive_pct}%
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">THREAT RECALL</div>
                    <div className="text-lg font-black font-mono mt-1 text-[#6AC99F]">
                      {currentSensitivity.threat_recall_pct}%
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"}`}>
                    <div className="text-[10px] font-mono text-slate-400">COGNITIVE FATIGUE INDEX</div>
                    <div className="text-xs font-bold font-mono mt-1" style={{ color: currentSensitivity.fatigue_color }}>
                      {currentSensitivity.analyst_fatigue_status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Human Feedback Annotation History */}
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <h4 className="text-sm font-bold mb-3 flex items-center justify-between">
                  <span>Recent Human Ground Truth Annotations (Active Learning Pool)</span>
                  <span className="text-xs font-mono text-[#6AC99F]">{humanFeedbackList.length} verified samples</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`text-[10px] uppercase border-b ${
                      isSeashell ? "bg-[#F2E3DA] border-[#E5D2C5] text-[#6B7B94]" : "bg-[#0E1524] border-[#1E2D48] text-[#82B0CE]"
                    }`}>
                      <tr>
                        <th className="p-2.5">Target ID</th>
                        <th className="p-2.5">Human Verdict</th>
                        <th className="p-2.5">Analyst Author</th>
                        <th className="p-2.5">Confidence</th>
                        <th className="p-2.5">Analyst Critique & Rationale</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isSeashell ? "divide-[#E5D2C5]" : "divide-[#1E2D48]/60"}`}>
                      {humanFeedbackList.map((fb) => (
                        <tr key={fb.id} className={`transition ${isSeashell ? "hover:bg-[#FAF0EA]" : "hover:bg-[#17243C]"}`}>
                          <td className="p-2.5 text-[#82B0CE] font-bold">{fb.target_id}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              fb.verdict === "confirmed_threat"
                                ? "bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/40"
                                : "bg-[#82B0CE]/20 text-[#82B0CE] border border-[#82B0CE]/40"
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
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#E19AA6]" /> Controlled Defensive Response & Dual-Control Queue
                </h3>
                <p className={`text-xs mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                  Dual-Control authorization: high-impact containment (endpoint network quarantine, account session revocation, edge ACL injection) requires explicit Incident Commander approval before sandbox execution.
                </p>
              </div>

              {/* Pending Approvals */}
              <div className="space-y-3">
                <h4 className={`text-xs font-mono uppercase ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                  Pending Human Sign-Offs
                </h4>
                {approvals.filter(a => a.status === "pending").map((appr) => (
                  <div key={appr.id} className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-[#E19AA6] ${
                    isSeashell ? "bg-white" : "bg-[#121C2F]"
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/40">
                          AWAITING AUTHORIZATION
                        </span>
                        <span className="text-xs font-mono text-[#82B0CE]">{appr.id}</span>
                        <span className="text-xs text-slate-400">• Requested by: {appr.requester_agent}</span>
                      </div>
                      <h4 className="text-sm font-bold">Action: {appr.action_type.replace(/_/g, " ").toUpperCase()}</h4>
                      <p className="text-xs mt-1">Target Entity: <span className="font-mono text-[#E19AA6] font-bold">{appr.target_entity}</span></p>
                      <p className={`text-xs mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-slate-300"}`}>Rationale: {appr.reasoning}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDecideApproval(appr.id, "approved")}
                        className="px-4 py-2 bg-[#6AC99F] hover:bg-[#7edba9] text-[#090E17] font-bold text-xs rounded-xl flex items-center gap-1.5 transition glow-success"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Execute (Sandbox)
                      </button>
                      <button
                        onClick={() => handleDecideApproval(appr.id, "rejected")}
                        className="px-3.5 py-2 bg-[#E19AA6]/20 hover:bg-[#E19AA6]/30 border border-[#E19AA6]/40 text-[#E19AA6] text-xs font-bold rounded-xl transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}

                {approvals.filter(a => a.status === "pending").length === 0 && (
                  <div className={`p-8 text-center text-xs rounded-xl border ${
                    isSeashell ? "bg-white border-[#E5D2C5] text-[#6B7B94]" : "bg-[#121C2F] border-[#1E2D48] text-slate-400"
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
              <div className={`p-5 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#82B0CE]" /> System Observability & Immutable Audit Logs
                </h3>
                <p className={`text-xs mt-1 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                  Traceable immutable logs of all automated detection events, agent tool calls, and operator approvals.
                </p>
              </div>

              <div className={`p-4 rounded-xl border shadow-sm ${isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className={`text-[10px] uppercase border-b ${
                      isSeashell ? "bg-[#F2E3DA] border-[#E5D2C5] text-[#6B7B94]" : "bg-[#0E1524] border-[#1E2D48] text-[#82B0CE]"
                    }`}>
                      <tr>
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">Actor</th>
                        <th className="p-2.5">Action Executed</th>
                        <th className="p-2.5">Resource ID</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isSeashell ? "divide-[#E5D2C5]" : "divide-[#1E2D48]/60"}`}>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className={`transition ${isSeashell ? "hover:bg-[#FAF0EA]" : "hover:bg-[#17243C]"}`}>
                          <td className="p-2.5 text-slate-400">{log.timestamp}</td>
                          <td className="p-2.5 text-[#E19AA6] font-semibold">{log.actor}</td>
                          <td className="p-2.5 font-bold">{log.action}</td>
                          <td className="p-2.5 text-[#82B0CE]">{log.resource_id}</td>
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
      </main>

      {/* 3. EXPLAINABLE AI (XAI) SHAP WATERFALL MODAL */}
      {selectedExplainEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            isSeashell ? "bg-[#FAF0EA] border-[#E5D2C5] text-[#141C2B]" : "bg-[#0E1524] border-[#1E2D48] text-[#FAF0EA]"
          }`}>
            <button
              onClick={() => { setSelectedExplainEvent(null); setExplanationData(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/40">
                  EXPLAINABLE AI DECOMPOSITION
                </span>
                <span className="text-xs font-mono text-[#82B0CE]">{selectedExplainEvent.id}</span>
              </div>
              <h2 className="text-base font-bold">Why the Model Flagged this Activity (SHAP Breakdown)</h2>
              <p className={`text-xs mt-0.5 ${isSeashell ? "text-[#6B7B94]" : "text-[#82B0CE]"}`}>
                Decomposition of individual feature risk contributions against learned normal baseline.
              </p>
            </div>

            {explainingLoading ? (
              <div className="py-12 text-center text-xs font-mono text-[#82B0CE] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#E19AA6]" /> Calculating Bayesian feature contributions...
              </div>
            ) : explanationData ? (
              <div className="space-y-4">
                {/* Score & Confidence Header */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
                }`}>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">COMPOSITE RISK SCORE</div>
                    <div className="text-xl font-black font-mono text-[#E19AA6]">
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
                    <div className="text-xs font-bold font-mono text-[#E19AA6] uppercase">
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
                          isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#090E17] border-[#1E2D48]"
                        }`}>
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isRisk ? "bg-[#E19AA6]" : "bg-[#82B0CE]"}`} />
                              {fc.feature_name}
                            </span>
                            <span className={`font-mono font-bold ${isRisk ? "text-[#E19AA6]" : "text-[#82B0CE]"}`}>
                              {fc.impact_percentage}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isSeashell ? "text-[#4B5A70]" : "text-slate-300"}`}>
                            {fc.human_explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Human Feedback Action Inside Modal */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isSeashell ? "bg-white border-[#E5D2C5]" : "bg-[#121C2F] border-[#1E2D48]"
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
                      className="px-3 py-1.5 rounded-lg bg-[#E19AA6] hover:bg-[#F0B0BB] text-[#090E17] font-bold text-xs flex items-center gap-1 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Confirm Threat
                    </button>
                    <button
                      onClick={() => {
                        handleHumanFeedback("event", selectedExplainEvent.id, "false_positive");
                        setSelectedExplainEvent(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#82B0CE] hover:bg-[#9AC2DC] text-[#090E17] font-bold text-xs flex items-center gap-1 transition"
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
