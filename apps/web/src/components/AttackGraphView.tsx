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
    <div className="w-full h-[520px] bg-[#0E0C0A] rounded-2xl border border-[#2E241D] overflow-hidden relative shadow-2xl">
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-[#15110E]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#2E241D] shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-[#EB9F6E] animate-ping" />
        <span className="text-xs font-mono text-[#FFF6E5]">
          Entity Correlation Graph • <span className="text-[#FFEABD] font-bold">{nodes.length} Nodes</span> • <span className="text-[#EB9F6E] font-bold">{edges.length} Edges</span>
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
        <Background color="#2E241D" gap={20} size={1} />
        <Controls className="!bg-[#15110E] !border-[#2E241D] !fill-[#FFF6E5]" />
        <MiniMap
          nodeColor={(node: any) => {
            if (node.data?.severity === "critical") return "#EB9F6E";
            if (node.data?.severity === "high") return "#F2AF83";
            return "#FFEABD";
          }}
          className="!bg-[#15110E] !border-[#2E241D]"
        />
      </ReactFlow>
    </div>
  );
}
