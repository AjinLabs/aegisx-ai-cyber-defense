"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AttackGraphNode } from "./AttackGraphNode";

interface AttackGraphViewProps {
  initialNodes: any[];
  initialEdges: any[];
}

export function AttackGraphView({ initialNodes, initialEdges }: AttackGraphViewProps) {
  const nodeTypes = useMemo(() => ({ customNode: AttackGraphNode }), []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[520px] bg-[#090E17] rounded-xl border border-[#1E2D48] overflow-hidden relative shadow-2xl">
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-[#0E1524]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-[#1E2D48] shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-[#E19AA6] animate-ping" />
        <span className="text-xs font-mono text-[#FAF0EA]">
          Entity Correlation Graph • <span className="text-[#82B0CE] font-bold">{nodes.length} Nodes</span> • <span className="text-[#E19AA6] font-bold">{edges.length} Edges</span>
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#1E2D48" gap={20} size={1} />
        <Controls className="!bg-[#0E1524] !border-[#1E2D48] !fill-[#FAF0EA]" />
        <MiniMap
          nodeColor={(node: any) => {
            if (node.data?.severity === "critical") return "#E19AA6";
            if (node.data?.severity === "high") return "#F0B0BB";
            return "#82B0CE";
          }}
          className="!bg-[#0E1524] !border-[#1E2D48]"
        />
      </ReactFlow>
    </div>
  );
}
