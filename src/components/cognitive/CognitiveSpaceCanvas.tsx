/**
 * Cognitive Space Canvas
 * Renders the active cognitive interaction model:
 * 1. Spatial Orbit (Center intent with contextual satellites)
 * 2. Cognitive Flow Stream (Kausalitäts-Fluss von Perzeption bis Aktion)
 * 3. Synaptic Mind Mesh (D3 Force-Graph mit dialektischen Kraftfeldern)
 * 4. Unified Horizon Matrix (Bento-Grid Kognitionshorizont)
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  ThoughtNode, 
  ThoughtLink, 
  CognitivePhase, 
  CognitiveDisclosureLevel 
} from '@/types/cognitive';
import { 
  Brain, 
  Sparkles, 
  Target, 
  Eye, 
  Flame, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  XCircle,
  Plus
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  nodes: ThoughtNode[];
  links: ThoughtLink[];
  activePhase: CognitivePhase;
  disclosureLevel: CognitiveDisclosureLevel;
  viewArchetype: 'spatial_orbit' | 'cognitive_flow' | 'synaptic_mesh' | 'horizon_matrix';
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onDiscardNode: (id: string) => void;
  onAddHumanNode: () => void;
}

export const CognitiveSpaceCanvas: React.FC<Props> = ({
  nodes,
  links,
  activePhase,
  disclosureLevel,
  viewArchetype,
  selectedNodeId,
  onSelectNode,
  onDiscardNode,
  onAddHumanNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Helper color logic for thought nodes
  const getNodeColor = (type: ThoughtNode['type']) => {
    switch (type) {
      case 'intent':
        return '#06b6d4'; // cyan
      case 'perception':
        return '#3b82f6'; // blue
      case 'memory':
        return '#8b5cf6'; // purple
      case 'hypothesis':
        return '#f59e0b'; // amber
      case 'evidence':
        return '#10b981'; // emerald
      case 'decision':
        return '#ec4899'; // pink
      case 'action':
        return '#6366f1'; // indigo
      case 'dialectic':
        return '#ef4444'; // red
      default:
        return 'var(--accent-color, #06b6d4)';
    }
  };

  // D3 Force Graph Simulation for 'synaptic_mesh' and 'spatial_orbit'
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (viewArchetype !== 'synaptic_mesh' && viewArchetype !== 'spatial_orbit') return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('class', 'mind-space-root');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Deep clones for D3 mutation
    const simNodes = nodes.map((n) => ({ ...n }));
    const simLinks = links.map((l) => ({ ...l }));

    let simulation: d3.Simulation<any, any>;

    if (viewArchetype === 'spatial_orbit') {
      // Orbital radial force centered around intent node
      simulation = d3.forceSimulation(simNodes)
        .force(
          'link',
          d3.forceLink(simLinks)
            .id((d: any) => d.id)
            .distance(120)
            .strength(0.6)
        )
        .force('charge', d3.forceManyBody().strength(-280))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(45));

      // Draw Orbit concentric circles
      const orbitRadii = [80, 160, 240, 320];
      const orbitGroup = g.append('g').attr('class', 'orbit-rings').attr('opacity', 0.15);
      orbitRadii.forEach((r) => {
        orbitGroup
          .append('circle')
          .attr('cx', width / 2)
          .attr('cy', height / 2)
          .attr('r', r)
          .attr('fill', 'none')
          .attr('stroke', 'var(--accent-color, #06b6d4)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 6');
      });
    } else {
      // Standard synaptic force mesh
      simulation = d3.forceSimulation(simNodes)
        .force(
          'link',
          d3.forceLink(simLinks)
            .id((d: any) => d.id)
            .distance(110)
            .strength(0.8)
        )
        .force('charge', d3.forceManyBody().strength(-350))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));
    }

    // Draw Links
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => (d.isDialectic ? '#f59e0b' : 'var(--border-color, #334155)'))
      .attr('stroke-width', (d: any) => Math.max(1.5, d.strength * 3))
      .attr('stroke-dasharray', (d: any) => (d.isDialectic ? '4 4' : 'none'))
      .attr('opacity', 0.65);

    // Draw Nodes
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_event, d: any) => {
        onSelectNode(d.id);
        soundFx.playBeep(800 + Math.random() * 300, 0.04);
      });

    // Outer Aura
    node
      .append('circle')
      .attr('r', (d: any) => 24 + d.weight * 10)
      .attr('fill', (d: any) => getNodeColor(d.type))
      .attr('fill-opacity', (d: any) => (d.id === selectedNodeId ? 0.3 : 0.08))
      .attr('stroke', (d: any) => getNodeColor(d.type))
      .attr('stroke-width', (d: any) => (d.id === selectedNodeId ? 2.5 : 1))
      .attr('stroke-opacity', (d: any) => (d.id === selectedNodeId ? 1 : 0.4));

    // Core Solid Circle
    node
      .append('circle')
      .attr('r', (d: any) => 14 + d.weight * 6)
      .attr('fill', 'var(--bg-card, #0f172a)')
      .attr('stroke', (d: any) => getNodeColor(d.type))
      .attr('stroke-width', 2);

    // Center Pulse Indicator
    node
      .append('circle')
      .attr('r', 4)
      .attr('fill', (d: any) => getNodeColor(d.type));

    // Label Text
    node
      .append('text')
      .text((d: any) => (d.title.length > 24 ? d.title.slice(0, 22) + '...' : d.title))
      .attr('y', (d: any) => 34 + d.weight * 6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-primary, #f8fafc)')
      .attr('font-size', '11px')
      .attr('font-weight', (d: any) => (d.id === selectedNodeId ? 'bold' : 'normal'))
      .attr('letter-spacing', '0.01em')
      .style('pointer-events', 'none');

    // Type Badge Text
    node
      .append('text')
      .text((d: any) => d.type.toUpperCase())
      .attr('y', (d: any) => 46 + d.weight * 6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary, #94a3b8)')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .style('pointer-events', 'none');

    // Tick update
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, viewArchetype, selectedNodeId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[440px] bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col shadow-inner"
    >
      {/* Top HUD Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[var(--bg-card)]/90 backdrop-blur px-3 py-1.5 rounded-xl border border-[var(--border-color)] shadow-md">
          <Brain className="w-4 h-4 text-[var(--accent-color)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
            {viewArchetype === 'spatial_orbit' && 'SPATIAL ORBIT CANVAS'}
            {viewArchetype === 'cognitive_flow' && 'COGNITIVE FLOW STREAM'}
            {viewArchetype === 'synaptic_mesh' && 'SYNAPTIC FORCE MESH'}
            {viewArchetype === 'horizon_matrix' && 'UNIFIED HORIZON MATRIX'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-input)] font-mono text-[var(--text-secondary)]">
            {nodes.length} Gedanken
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            id="btn-add-thought-node"
            onClick={onAddHumanNode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-color)] text-white text-xs font-bold shadow-md hover:opacity-90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gedanken einfügen</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 w-full h-full relative">
        {/* Render D3 Canvas for Orbit and Mesh */}
        {(viewArchetype === 'spatial_orbit' || viewArchetype === 'synaptic_mesh') && (
          <svg ref={svgRef} className="w-full h-full select-none" />
        )}

        {/* Render Stepwise Cognitive Flow Stream */}
        {viewArchetype === 'cognitive_flow' && (
          <div className="w-full h-full p-6 overflow-y-auto space-y-4 pt-14 scrollbar-thin">
            <div className="max-w-3xl mx-auto space-y-3">
              {nodes.map((node, idx) => {
                const isSelected = node.id === selectedNodeId;
                const nodeColor = getNodeColor(node.type);

                return (
                  <div
                    key={node.id}
                    id={`flow-node-${node.id}`}
                    onClick={() => onSelectNode(node.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[var(--bg-card)] border-[var(--accent-color)] shadow-lg ring-1 ring-[var(--accent-color)]/30'
                        : 'bg-[var(--bg-card)]/70 border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-white shadow-sm shrink-0"
                          style={{ backgroundColor: nodeColor }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                              {node.title}
                            </span>
                            <span
                              className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold"
                              style={{ color: nodeColor, backgroundColor: `${nodeColor}15` }}
                            >
                              {node.type}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                            {node.content}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-[var(--text-secondary)] shrink-0">
                        <span>{node.timestamp}</span>
                      </div>
                    </div>

                    {/* Progressive Disclosure Level 3+ additions */}
                    {disclosureLevel >= 3 && node.tags.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 flex items-center gap-1.5 flex-wrap">
                        {node.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Render Horizon Bento Matrix */}
        {viewArchetype === 'horizon_matrix' && (
          <div className="w-full h-full p-4 pt-14 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
            {/* Column 1: Intent & Perception */}
            <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-xl p-3.5 flex flex-col space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono">
                  Absicht & Wahrnehmung
                </h4>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
                {nodes
                  .filter((n) => n.type === 'intent' || n.type === 'perception')
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onSelectNode(n.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer ${
                        n.id === selectedNodeId
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                      }`}
                    >
                      <div className="font-bold text-[var(--text-primary)]">{n.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-1">{n.content}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Working Memory & Hypotheses */}
            <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-xl p-3.5 flex flex-col space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono">
                  Gedächtnis & Thesen
                </h4>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
                {nodes
                  .filter((n) => n.type === 'memory' || n.type === 'hypothesis' || n.type === 'dialectic')
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onSelectNode(n.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer ${
                        n.id === selectedNodeId
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                      }`}
                    >
                      <div className="font-bold text-[var(--text-primary)]">{n.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-1">{n.content}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Decisions & Actions */}
            <div className="bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-xl p-3.5 flex flex-col space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono">
                  Entscheidung & Handlung
                </h4>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
                {nodes
                  .filter((n) => n.type === 'decision' || n.type === 'action' || n.type === 'evidence')
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onSelectNode(n.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer ${
                        n.id === selectedNodeId
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                      }`}
                    >
                      <div className="font-bold text-[var(--text-primary)]">{n.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-1">{n.content}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Deep Inspector Overlay */}
      {selectedNode && (
        <div className="absolute bottom-3 right-3 max-w-sm w-full bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--accent-color)] rounded-xl p-4 shadow-2xl z-20 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2 border-b border-[var(--border-color)] pb-2">
            <div>
              <span
                className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                style={{
                  color: getNodeColor(selectedNode.type),
                  backgroundColor: `${getNodeColor(selectedNode.type)}15`
                }}
              >
                {selectedNode.type}
              </span>
              <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {selectedNode.title}
              </h4>
            </div>

            <button
              onClick={() => onSelectNode(null)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {selectedNode.content}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[var(--bg-input)] p-2 rounded-lg border border-[var(--border-color)]">
            <div>
              <span className="text-[var(--text-secondary)]">Phase:</span>{' '}
              <strong className="text-[var(--text-primary)]">{selectedNode.phase}</strong>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Konfidenz:</span>{' '}
              <strong className="text-emerald-400">
                {Math.round(selectedNode.confidence * 100)}%
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onDiscardNode(selectedNode.id)}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Diesen Gedanken verwerfen
            </button>

            <button
              onClick={() => onSelectNode(null)}
              className="px-3 py-1 rounded-lg bg-[var(--bg-input)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--border-color)]"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
