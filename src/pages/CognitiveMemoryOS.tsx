import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as d3 from "d3";
import { 
  Brain, 
  Sparkles, 
  Network, 
  GitFork, 
  Cpu, 
  Activity, 
  Search, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Tag, 
  Sliders, 
  Maximize2,
  Database,
  Filter,
  Zap,
  Info,
  HelpCircle,
  Share2,
  ChevronRight
} from "lucide-react";
import { useMuscalStore } from "@/store/useMuscalStore";
import { soundFx } from "@/lib/soundFx";

export interface CognitiveNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  category: "impulse" | "concept" | "evidence" | "synthesis" | "working_memory";
  cluster: string;
  summary: string;
  confidence: number;
  weight: number;
  timestamp: string;
  tags: string[];
  evidenceSources?: string[];
  reasoningStep?: number;
  status: "idle" | "active" | "synthesizing" | "verified";
}

export interface CognitiveLink extends d3.SimulationLinkDatum<CognitiveNode> {
  id: string;
  source: string | CognitiveNode;
  target: string | CognitiveNode;
  relation: string;
  strength: number; // 0.1 to 1.0
  isDialectic?: boolean;
}

const INITIAL_NODES: CognitiveNode[] = [
  {
    id: "node-1",
    label: "Akira UI & Neuro-Ergonomie",
    category: "concept",
    cluster: "Interface",
    summary: "Verbindung von Retro-Cyberpunk Ästhetik mit kognitiver Entlastung und sofortiger Nachvollziehbarkeit.",
    confidence: 0.96,
    weight: 0.85,
    timestamp: "16:45:10",
    tags: ["UI/UX", "Akira", "Ergonomie"],
    evidenceSources: ["Design System Core", "Viewport Bounds v2"],
    status: "verified",
  },
  {
    id: "node-2",
    label: "Local-First P2P Datensouveränität",
    category: "evidence",
    cluster: "Architecture",
    summary: "Vollständige lokale Speicherung und On-Device Vektor-Indizierung ohne zwingende Cloud-Abhängigkeit.",
    confidence: 0.99,
    weight: 0.95,
    timestamp: "16:45:22",
    tags: ["P2P", "WebRTC", "Datenschutz"],
    evidenceSources: ["IndexedDB Store", "WebRTC Mesh Signaling"],
    status: "verified",
  },
  {
    id: "node-3",
    label: "Dynamische Fokus-Kollabierung",
    category: "impulse",
    cluster: "Cognition",
    summary: "Automatisches Ausblenden redundanter Menüs bei aktiver Aufgabenbearbeitung zur Minimierung kognitiver Last.",
    confidence: 0.92,
    weight: 0.78,
    timestamp: "16:46:04",
    tags: ["Fokus", "Zen", "Reduktion"],
    evidenceSources: ["Sidebar State Observer"],
    status: "active",
  },
  {
    id: "node-4",
    label: "Echtzeit-Kollisionsschutz",
    category: "concept",
    cluster: "Interface",
    summary: "Mathematischer Detektor, der Layout-Kollisionen vorab berechnet und auto-justiert.",
    confidence: 0.98,
    weight: 0.90,
    timestamp: "16:46:30",
    tags: ["Overlap Protection", "Layout Engine"],
    evidenceSources: ["OverlapDetector.ts"],
    status: "verified",
  },
  {
    id: "node-5",
    label: "Synthese: Kognitive OS-Architektur",
    category: "synthesis",
    cluster: "System",
    summary: "Einheitliches System, das Gedanken, Notizen und KI-Inferenz in einem transparenten Graphen strukturiert.",
    confidence: 0.95,
    weight: 1.0,
    timestamp: "16:47:15",
    tags: ["OS", "Synthese", "Harmonie"],
    evidenceSources: ["Synthesizer Pipeline", "Muscal Core v1.4"],
    status: "verified",
  },
  {
    id: "node-6",
    label: "WebAudio Frequenz-Feedback",
    category: "evidence",
    cluster: "Multimodal",
    summary: "Reine WebAudio Oszillatoren für sofortige akustische Verifikation von Nutzeraktionen.",
    confidence: 0.94,
    weight: 0.72,
    timestamp: "16:47:40",
    tags: ["WebAudio", "SFX", "Feedback"],
    evidenceSources: ["SoundFx.ts (WebAudio API)"],
    status: "verified",
  },
  {
    id: "node-7",
    label: "Dialektische Validierung",
    category: "working_memory",
    cluster: "Reasoning",
    summary: "Kontinuierlicher Abgleich von Thesen mit dokumentierten Beweisketten zur Vermeidung von Halluzinationen.",
    confidence: 0.88,
    weight: 0.82,
    timestamp: "16:48:02",
    tags: ["Logik", "Verifikation", "Dialektik"],
    evidenceSources: ["RAG Engine v2", "Vector Store"],
    status: "synthesizing",
  },
];

const INITIAL_LINKS: CognitiveLink[] = [
  { id: "l1", source: "node-1", target: "node-3", relation: "steuert", strength: 0.85 },
  { id: "l2", source: "node-1", target: "node-4", relation: "sichert ab", strength: 0.9 },
  { id: "l3", source: "node-2", target: "node-5", relation: "fundiert", strength: 0.95 },
  { id: "l4", source: "node-3", target: "node-5", relation: "ermöglicht", strength: 0.88 },
  { id: "l5", source: "node-4", target: "node-5", relation: "garantiert", strength: 0.82 },
  { id: "l6", source: "node-6", target: "node-1", relation: "verstärkt Feedback", strength: 0.75 },
  { id: "l7", source: "node-7", target: "node-5", relation: "validiert", strength: 0.91, isDialectic: true },
  { id: "l8", source: "node-2", target: "node-7", relation: "liefert Fakten", strength: 0.89 },
];

export function CognitiveMemoryOS() {
  const { focusMode, toggleFocusMode } = useMuscalStore();
  const [nodes, setNodes] = useState<CognitiveNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<CognitiveLink[]>(INITIAL_LINKS);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-5");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"graph" | "tree" | "matrix">("graph");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // New Node Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeCategory, setNewNodeCategory] = useState<CognitiveNode["category"]>("concept");
  const [newNodeSummary, setNewNodeSummary] = useState("");
  const [newNodeTags, setNewNodeTags] = useState("");

  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<CognitiveNode, CognitiveLink> | null>(null);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch =
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || n.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [nodes, searchQuery, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const verifiedCount = nodes.filter((n) => n.status === "verified").length;
    const avgConfidence = Math.round(
      (nodes.reduce((acc, n) => acc + n.confidence, 0) / (nodes.length || 1)) * 100
    );
    const synapticDensity = (links.length / (nodes.length || 1)).toFixed(2);
    return { verifiedCount, avgConfidence, synapticDensity };
  }, [nodes, links]);

  // D3 Graph Simulation Initialization & Update
  useEffect(() => {
    if (viewMode !== "graph" || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 550;

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "graph-container");

    // Zoom & Pan handler
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Color mapper for categories
    const getCategoryColor = (cat: string) => {
      switch (cat) {
        case "impulse":
          return "var(--accent-neon, #ff0055)";
        case "concept":
          return "#38bdf8"; // cyan / sky
        case "evidence":
          return "#10b981"; // emerald
        case "synthesis":
          return "#a855f7"; // purple
        case "working_memory":
          return "#f59e0b"; // amber
        default:
          return "#94a3b8";
      }
    };

    // Prepare links with cloned objects to prevent mutability conflicts
    const simNodes = nodes.map((d) => ({ ...d }));
    const simLinks = links.map((d) => ({ ...d }));

    // Force Simulation Setup
    const simulation = d3.forceSimulation<CognitiveNode>(simNodes)
      .force(
        "link",
        d3.forceLink<CognitiveNode, CognitiveLink>(simLinks)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => 38 + (d as CognitiveNode).weight * 12));

    simulationRef.current = simulation as any;

    // Draw connecting edges
    const link = g.append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, CognitiveLink>("line")
      .data(simLinks)
      .enter()
      .append("line")
      .attr("stroke", (d: CognitiveLink) => (d.isDialectic ? "#f59e0b" : "var(--border-color, #334155)"))
      .attr("stroke-width", (d: CognitiveLink) => Math.max(1.5, d.strength * 3))
      .attr("stroke-dasharray", (d: CognitiveLink) => (d.isDialectic ? "4 4" : "none"))
      .attr("opacity", 0.7);

    // Node container
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, CognitiveNode>("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, CognitiveNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            soundFx.playClick();
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      )
      .on("click", (_event, d: CognitiveNode) => {
        setSelectedNodeId(d.id);
        soundFx.playBeep(900 + Math.random() * 400, 0.04);
      });

    // Outer glow for active/selected node
    node.append("circle")
      .attr("r", (d: CognitiveNode) => 24 + d.weight * 10)
      .attr("fill", (d: CognitiveNode) => getCategoryColor(d.category))
      .attr("fill-opacity", (d: CognitiveNode) => (d.id === selectedNodeId ? 0.25 : 0.08))
      .attr("stroke", (d: CognitiveNode) => getCategoryColor(d.category))
      .attr("stroke-width", (d: CognitiveNode) => (d.id === selectedNodeId ? 2.5 : 1))
      .attr("stroke-opacity", (d: CognitiveNode) => (d.id === selectedNodeId ? 1 : 0.4));

    // Inner core
    node.append("circle")
      .attr("r", (d: CognitiveNode) => 14 + d.weight * 6)
      .attr("fill", "var(--bg-card, #0f172a)")
      .attr("stroke", (d: CognitiveNode) => getCategoryColor(d.category))
      .attr("stroke-width", 2);

    // Node Icon / Indicator
    node.append("circle")
      .attr("r", 4)
      .attr("fill", (d: CognitiveNode) => getCategoryColor(d.category));

    // Node Label text
    node.append("text")
      .text((d: CognitiveNode) => d.label)
      .attr("y", (d: CognitiveNode) => 36 + d.weight * 6)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-primary, #f8fafc)")
      .attr("font-size", "11px")
      .attr("font-family", "monospace")
      .attr("font-weight", (d: CognitiveNode) => (d.id === selectedNodeId ? "bold" : "normal"))
      .attr("letter-spacing", "0.02em")
      .style("pointer-events", "none")
      .attr("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, selectedNodeId, viewMode]);

  // Simulation Sequence
  const runCognitiveCycle = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(1);
    soundFx.playSend();

    const sequence = [
      { step: 1, node: "node-3", delay: 800 },
      { step: 2, node: "node-7", delay: 1600 },
      { step: 3, node: "node-2", delay: 2400 },
      { step: 4, node: "node-5", delay: 3400 },
    ];

    sequence.forEach(({ step, node, delay }) => {
      setTimeout(() => {
        setSimulationStep(step);
        setSelectedNodeId(node);
        soundFx.playBeep(800 + step * 250, 0.06);
      }, delay);
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationStep(0);
      soundFx.playConfirm();
    }, 4200);
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;

    soundFx.playConfirm();
    const id = `node-${Date.now()}`;
    const newNode: CognitiveNode = {
      id,
      label: newNodeLabel.trim(),
      category: newNodeCategory,
      cluster: "User Created",
      summary: newNodeSummary.trim() || "Manuell erfasster Gedanken-Knoten.",
      confidence: 0.95,
      weight: 0.8,
      timestamp: new Date().toLocaleTimeString(),
      tags: newNodeTags ? newNodeTags.split(",").map((t) => t.trim()) : ["Gedanke"],
      status: "verified",
    };

    setNodes((prev) => [...prev, newNode]);

    // Link with currently selected node
    if (selectedNodeId) {
      const newLink: CognitiveLink = {
        id: `link-${Date.now()}`,
        source: selectedNodeId,
        target: id,
        relation: "assoziiert",
        strength: 0.8,
      };
      setLinks((prev) => [...prev, newLink]);
    }

    setSelectedNodeId(id);
    setShowAddModal(false);
    setNewNodeLabel("");
    setNewNodeSummary("");
    setNewNodeTags("");
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] text-[var(--text-primary)] font-sans overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/40 flex items-center justify-center text-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-glow)] shrink-0">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold font-mono tracking-tight text-[var(--text-primary)]">
                KOGNITIVES OS // GEDANKEN-STRUKTUR
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent-neon)] border border-[var(--accent-neon)]/30 font-bold">
                REAL-TIME REASONING
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
              Interaktive Visualisierung kognitiver Pipelines & semantischer Nachvollziehbarkeit
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={runCognitiveCycle}
            disabled={isSimulating}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 border transition ${
              isSimulating
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50 animate-pulse"
                : "bg-[var(--accent-neon)] text-black border-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-glow)] hover:brightness-110"
            }`}
            title="Startet eine transparente Simulation des Denk- und Synthese-Prozesses"
          >
            {isSimulating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{isSimulating ? `SYNTHESE SCHRITT ${simulationStep}/4` : "SYNTHESE STARTEN"}</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--accent-neon)] text-[var(--text-primary)] flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent-neon)]" />
            <span>KNOTEN HINZUFÜGEN</span>
          </button>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-0.5">
            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode("graph");
              }}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition ${
                viewMode === "graph"
                  ? "bg-[var(--bg-active)] text-[var(--accent-neon)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Graph
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode("tree");
              }}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition ${
                viewMode === "tree"
                  ? "bg-[var(--bg-active)] text-[var(--accent-neon)] shadow-sm"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Hierarchie
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Graph Canvas + Right Telemetry Inspector */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left/Center Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] relative">
          {/* Quick Filter & Telemetry Strip */}
          <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Gedanken & Verknüpfungen filtern..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)]"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {[
                { id: "all", label: "Alle", color: "text-[var(--text-primary)]" },
                { id: "concept", label: "Konzepte", color: "text-sky-400" },
                { id: "evidence", label: "Beweise", color: "text-emerald-400" },
                { id: "impulse", label: "Impulse", color: "text-rose-400" },
                { id: "synthesis", label: "Synthese", color: "text-purple-400" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundFx.playClick();
                    setCategoryFilter(cat.id);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                    categoryFilter === cat.id
                      ? "bg-[var(--accent-subtle)] text-[var(--accent-neon)] border-[var(--accent-neon)]"
                      : "bg-[var(--bg-card)] text-[var(--text-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-neon)]/50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Stats Badge */}
            <div className="hidden lg:flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] shrink-0">
              <span>Knoten: <b className="text-[var(--text-primary)]">{nodes.length}</b></span>
              <span>Synapsen: <b className="text-[var(--text-primary)]">{links.length}</b></span>
              <span>Konfidenz: <b className="text-emerald-400">{stats.avgConfidence}%</b></span>
            </div>
          </div>

          {/* Visual Presentation Area */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {viewMode === "graph" ? (
              <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />
            ) : (
              /* Hierarchical Tree Matrix */
              <div className="p-6 h-full overflow-y-auto space-y-4 max-w-4xl mx-auto">
                <div className="text-xs font-mono uppercase text-[var(--text-tertiary)] mb-2 flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-[var(--accent-neon)]" />
                  <span>Deduktive Argumentationskette & Kausalgraph</span>
                </div>
                {nodes.map((n, idx) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelectedNodeId(n.id);
                      soundFx.playClick();
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      selectedNodeId === n.id
                        ? "border-[var(--accent-neon)] bg-[var(--accent-subtle)] shadow-[0_0_16px_var(--accent-glow)]"
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-neon)]/50"
                    }`}
                  >
                    <div className="text-xs font-mono font-bold px-2 py-1 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--accent-neon)]">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold font-mono text-[var(--text-primary)]">{n.label}</h4>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                          {n.category}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{n.summary}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {n.tags.map((t) => (
                          <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-main)] text-[var(--text-tertiary)] border border-[var(--border-color)]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Floating Akira Watermark in background */}
            <div className="absolute bottom-4 left-4 pointer-events-none text-[9px] font-mono text-[var(--text-tertiary)]/40 uppercase tracking-widest">
              AKIRA KOGNITION // REASONING OS 2088
            </div>
          </div>
        </div>

        {/* Right Inspector & Reasoning Explanation Drawer */}
        <aside className="w-80 sm:w-96 border-l border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-xl flex flex-col h-full shrink-0 shadow-lg overflow-hidden">
          {/* Header of Inspector */}
          <div className="p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-active)]/40 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-neon)]" />
              <h2 className="text-xs font-extrabold font-mono tracking-wider uppercase text-[var(--text-primary)]">
                KOGNITIVER INSPEKTOR
              </h2>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              VERIFIZIERT
            </span>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-sans">
            {selectedNode ? (
              <>
                {/* Node Title & Badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-[var(--accent-neon)] font-bold tracking-wider">
                      {selectedNode.category} // {selectedNode.cluster}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      {selectedNode.timestamp}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold font-mono text-[var(--text-primary)] leading-snug">
                    {selectedNode.label}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {selectedNode.summary}
                  </p>
                </div>

                {/* Mathematical Certainty & Weight Meters */}
                <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[var(--text-tertiary)]">Logische Konfidenz:</span>
                    <span className="font-bold text-emerald-400">{Math.round(selectedNode.confidence * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[var(--accent-neon)]"
                      style={{ width: `${selectedNode.confidence * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <span className="text-[var(--text-tertiary)]">Synaptisches Gewicht:</span>
                    <span className="font-bold text-[var(--accent-neon)]">{(selectedNode.weight * 10).toFixed(1)} / 10.0</span>
                  </div>
                </div>

                {/* Evidence & Verification Citations */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono font-bold text-[var(--text-tertiary)] tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Beweiskette & Quellen-Nachweis</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedNode.evidenceSources && selectedNode.evidenceSources.length > 0 ? (
                      selectedNode.evidenceSources.map((src, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-primary)] flex items-center justify-between"
                        >
                          <span className="truncate">{src}</span>
                          <span className="text-[9px] text-emerald-400 font-bold px-1 rounded bg-emerald-500/10">
                            VALID
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] font-mono text-[var(--text-tertiary)] italic p-2">
                        Keine direkten Quellen verknüpft.
                      </div>
                    )}
                  </div>
                </div>

                {/* Synaptic Connections */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono font-bold text-[var(--text-tertiary)] tracking-wider flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-sky-400" />
                    <span>Verbundene Gedanken & Relationen</span>
                  </div>
                  <div className="space-y-1.5">
                    {links
                      .filter((l) => {
                        const sId = typeof l.source === "object" ? (l.source as any).id : l.source;
                        const tId = typeof l.target === "object" ? (l.target as any).id : l.target;
                        return sId === selectedNode.id || tId === selectedNode.id;
                      })
                      .map((link) => {
                        const sId = typeof link.source === "object" ? (link.source as any).id : link.source;
                        const targetId = sId === selectedNode.id 
                          ? (typeof link.target === "object" ? (link.target as any).id : link.target)
                          : sId;
                        const targetNode = nodes.find((n) => n.id === targetId);

                        return (
                          <div
                            key={link.id}
                            onClick={() => {
                              if (targetNode) {
                                setSelectedNodeId(targetNode.id);
                                soundFx.playClick();
                              }
                            }}
                            className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] transition cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="text-[9px] font-mono text-[var(--accent-neon)] px-1 rounded bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/30">
                                {link.relation}
                              </span>
                              <span className="font-mono text-[11px] truncate text-[var(--text-primary)]">
                                {targetNode?.label || targetId}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-neon)]" />
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] uppercase font-mono font-bold text-[var(--text-tertiary)]">Schlagworte</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-[var(--text-tertiary)] font-mono text-center">
                <HelpCircle className="w-6 h-6 mb-2 text-[var(--accent-neon)]" />
                <span>Wähle einen Knoten im Graphen aus.</span>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">NODE_ID: {selectedNode?.id}</span>
            <button
              onClick={() => {
                soundFx.playConfirm();
                runCognitiveCycle();
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--accent-neon)] text-[var(--text-primary)]"
            >
              Neu Evaluieren
            </button>
          </div>
        </aside>
      </div>

      {/* Add Node Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--accent-neon)]" />
                  <h3 className="font-extrabold font-mono text-sm">NEUEN GEDANKEN-KNOTEN ERFASSEN</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-xs font-mono text-[var(--text-tertiary)] hover:text-white"
                >
                  SCHLIESSEN
                </button>
              </div>

              <form onSubmit={handleCreateNode} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-[var(--text-tertiary)] mb-1">Bezeichnung / Kernthese</label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Multimodales Reasoning Pipeline"
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[var(--text-tertiary)] mb-1">Kategorie</label>
                  <select
                    value={newNodeCategory}
                    onChange={(e) => setNewNodeCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)]"
                  >
                    <option value="concept">Konzept (Strukturelles Denkmodell)</option>
                    <option value="evidence">Beweis (Fakt / Log / Messung)</option>
                    <option value="impulse">Impuls (Hypothese / Fragestellung)</option>
                    <option value="synthesis">Synthese (Handlungsentscheid)</option>
                    <option value="working_memory">Arbeitsgedächtnis (Puffer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[var(--text-tertiary)] mb-1">Zusammenfassung & Begründung</label>
                  <textarea
                    rows={3}
                    placeholder="Erläutere die logische Argumentation oder das Phänomen..."
                    value={newNodeSummary}
                    onChange={(e) => setNewNodeSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[var(--text-tertiary)] mb-1">Schlagworte (Kommagetrennt)</label>
                  <input
                    type="text"
                    placeholder="Logik, System, WebGPU"
                    value={newNodeTags}
                    onChange={(e) => setNewNodeTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-neon)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl font-bold bg-[var(--accent-neon)] text-black shadow-[0_0_12px_var(--accent-glow)] hover:brightness-110"
                  >
                    In Graph Integrieren
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
