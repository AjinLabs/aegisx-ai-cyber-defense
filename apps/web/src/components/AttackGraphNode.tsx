"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Globe, User, Server, Terminal, AlertTriangle } from "lucide-react";

export function AttackGraphNode({ data }: { data: any }) {
  const getIcon = () => {
    switch (data.category) {
      case "ip":
        return <Globe className="w-4 h-4 text-[#EB9F6E]" />;
      case "user":
        return <User className="w-4 h-4 text-[#FFEABD]" />;
      case "host":
        return <Server className="w-4 h-4 text-[#F2AF83]" />;
      case "process":
        return <Terminal className="w-4 h-4 text-[#6AC99F]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#EB9F6E]" />;
    }
  };

  const getBorderColor = () => {
    if (data.severity === "critical") return "border-[#EB9F6E] bg-[#1C1713]/95 shadow-[0_0_18px_rgba(235,159,110,0.3)]";
    if (data.severity === "high") return "border-[#EB9F6E]/80 bg-[#1C1713]/90";
    return "border-[#2E241D] bg-[#1C1713]/90";
  };

  return (
    <div className={`px-4 py-3 rounded-2xl border-2 shadow-xl backdrop-blur-md min-w-[220px] transition-all hover:scale-[1.02] ${getBorderColor()}`}>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#EB9F6E] !border-2 !border-[#0E0C0A]" />
      
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#FFEABD] font-bold">{data.category}</span>
        </div>
        {data.badge && (
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#EB9F6E]/20 text-[#EB9F6E] border border-[#EB9F6E]/40">
            {data.badge}
          </span>
        )}
      </div>

      <div className="font-bold text-xs text-[#FFF6E5] tracking-wide">{data.label}</div>
      <div className="text-[11px] text-[#FFEABD]/80 truncate font-mono mt-0.5">{data.sublabel}</div>

      {data.details && (
        <div className="mt-2 text-[10px] text-[#FFF6E5]/90 bg-[#0E0C0A]/85 p-2 rounded-xl border border-[#2E241D] leading-relaxed">
          {data.details}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#FFEABD] !border-2 !border-[#0E0C0A]" />
    </div>
  );
}

