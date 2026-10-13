"use client";

import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Globe, User, Server, Terminal, AlertTriangle } from "lucide-react";

export function AttackGraphNode({ data }: { data: any }) {
  const getIcon = () => {
    switch (data.category) {
      case "ip":
        return <Globe className="w-4 h-4 text-[#E19AA6]" />;
      case "user":
        return <User className="w-4 h-4 text-[#82B0CE]" />;
      case "host":
        return <Server className="w-4 h-4 text-[#82B0CE]" />;
      case "process":
        return <Terminal className="w-4 h-4 text-[#6AC99F]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#E19AA6]" />;
    }
  };

  const getBorderColor = () => {
    if (data.severity === "critical") return "border-[#E19AA6] bg-[#121C2F]/95 shadow-[0_0_15px_rgba(225,154,166,0.25)]";
    if (data.severity === "high") return "border-[#E19AA6]/80 bg-[#121C2F]/90";
    return "border-[#1E2D48] bg-[#121C2F]/90";
  };

  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-xl backdrop-blur-md min-w-[220px] transition-all hover:scale-[1.02] ${getBorderColor()}`}>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#E19AA6] !border-2 !border-[#090E17]" />
      
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#82B0CE] font-bold">{data.category}</span>
        </div>
        {data.badge && (
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#E19AA6]/20 text-[#E19AA6] border border-[#E19AA6]/40">
            {data.badge}
          </span>
        )}
      </div>

      <div className="font-bold text-xs text-[#FAF0EA] tracking-wide">{data.label}</div>
      <div className="text-[11px] text-slate-300 truncate font-mono mt-0.5">{data.sublabel}</div>

      {data.details && (
        <div className="mt-2 text-[10px] text-[#FAF0EA]/90 bg-[#090E17]/80 p-2 rounded-lg border border-[#1E2D48]/80 leading-relaxed">
          {data.details}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#82B0CE] !border-2 !border-[#090E17]" />
    </div>
  );
}

