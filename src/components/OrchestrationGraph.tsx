import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useMuscalStore } from '@/store/useMuscalStore';

export function OrchestrationGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trace } = useMuscalStore();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Clear previous SVG
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth;
    const height = 400;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Define glowing cyber gradients
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", "link-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
      
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "var(--accent-neon)");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "var(--accent-emerald)");

    const dropShadowFilter = defs.append("filter")
      .attr("id", "neon-glow")
      .attr("x", "-20%").attr("y", "-20%")
      .attr("width", "140%").attr("height", "140%");
      
    dropShadowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    const feMerge = dropShadowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Static Base Nodes
    const nodesData = [
      { id: "User", x: 50, y: height / 2, type: "source" },
      { id: "Router", x: width * 0.25, y: height / 2, type: "core" },
      { id: "Context", x: width * 0.5, y: height * 0.25, type: "module" },
      { id: "Tools", x: width * 0.5, y: height * 0.75, type: "module" },
      { id: "LLM", x: width * 0.75, y: height / 2, type: "core" },
      { id: "Output", x: width - 50, y: height / 2, type: "sink" }
    ];

    const linksData = [
      { source: "User", target: "Router" },
      { source: "Router", target: "Context" },
      { source: "Router", target: "Tools" },
      { source: "Context", target: "LLM" },
      { source: "Tools", target: "LLM" },
      { source: "LLM", target: "Output" }
    ];

    // Determine active links based on recent trace
    const activeNodes = new Set<string>();
    activeNodes.add("User");
    activeNodes.add("Router");
    
    if (trace.length > 0) {
      const lastTrace = trace[trace.length - 1];
      if (lastTrace.tool !== 'none') activeNodes.add("Tools");
      activeNodes.add("LLM");
      if (lastTrace.result === 'Success') activeNodes.add("Output");
    }

    // Draw lines
    svg.append("g")
      .selectAll("line")
      .data(linksData)
      .join("line")
      .attr("x1", d => nodesData.find(n => n.id === d.source)!.x)
      .attr("y1", d => nodesData.find(n => n.id === d.source)!.y)
      .attr("x2", d => nodesData.find(n => n.id === d.target)!.x)
      .attr("y2", d => nodesData.find(n => n.id === d.target)!.y)
      .attr("stroke", d => (activeNodes.has(d.source) && activeNodes.has(d.target)) ? "url(#link-gradient)" : "var(--border-color)")
      .attr("stroke-width", d => (activeNodes.has(d.source) && activeNodes.has(d.target)) ? 3 : 1)
      .attr("stroke-dasharray", d => (activeNodes.has(d.source) && activeNodes.has(d.target)) ? "none" : "5,5")
      .attr("opacity", 0.6)
      .attr("class", d => (activeNodes.has(d.source) && activeNodes.has(d.target)) ? "animate-pulse" : "");

    // Draw nodes
    const nodeGroups = svg.append("g")
      .selectAll("g")
      .data(nodesData)
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
      .attr("r", 25)
      .attr("fill", d => activeNodes.has(d.id) ? "var(--bg-active)" : "var(--bg-card)")
      .attr("stroke", d => activeNodes.has(d.id) ? "var(--accent-neon)" : "var(--border-color)")
      .attr("stroke-width", 2)
      .attr("filter", d => activeNodes.has(d.id) ? "url(#neon-glow)" : "none");

    nodeGroups.append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", d => activeNodes.has(d.id) ? "var(--text-primary)" : "var(--text-secondary)")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("font-family", "monospace")
      .style("text-transform", "uppercase")
      .style("letter-spacing", "1px");

  }, [trace]); // Re-render when trace updates

  return (
    <div className="w-full bg-[var(--bg-card)]/50 backdrop-blur-md border border-[var(--border-color)] rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-neon)] animate-pulse shadow-[0_0_8px_var(--accent-neon)]" />
          Live Orchestration Graph
        </h3>
      </div>
      <div ref={containerRef} className="w-full h-[400px]" />
    </div>
  );
}
