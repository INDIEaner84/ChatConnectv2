/**
 * Cognitive OS Hub - Master Human-AI Cognitive Interface
 * Unifies real-time cognitive externalization, multi-agent dialectics, progressive disclosure,
 * and the evolutionary AI Design Laboratory.
 */

import React, { useState } from 'react';
import { useCognitiveEngine, PRESET_SCENARIOS } from '@/lib/cognitiveEngine';
import { useDesignEvolution } from '@/lib/designEvolutionEngine';
import { ProgressiveDisclosureSlider } from '@/components/cognitive/ProgressiveDisclosureSlider';
import { HypothesisDivergencePanel } from '@/components/cognitive/HypothesisDivergencePanel';
import { MetaCognitiveReflector } from '@/components/cognitive/MetaCognitiveReflector';
import { CognitiveAffordancesBar } from '@/components/cognitive/CognitiveAffordancesBar';
import { CognitiveTimeMachine } from '@/components/cognitive/CognitiveTimeMachine';
import { CognitiveSpaceCanvas } from '@/components/cognitive/CognitiveSpaceCanvas';
import { DesignEvolutionLab } from '@/components/designEvolution/DesignEvolutionLab';
import { 
  Brain, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Send, 
  Dna, 
  Eye, 
  Layers, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  Compass, 
  Flame, 
  CheckCircle2, 
  ChevronRight,
  Plus,
  Atom,
  Terminal,
  Scale
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

export const CognitiveOSHub: React.FC = () => {
  const [hubMode, setHubMode] = useState<'mind_space' | 'design_lab'>('mind_space');
  const [customPrompt, setCustomPrompt] = useState('');
  const [humanNodeDialogOpen, setHumanNodeDialogOpen] = useState(false);
  const [humanTitle, setHumanTitle] = useState('');
  const [humanContent, setHumanContent] = useState('');
  const [humanType, setHumanType] = useState<'hypothesis' | 'perception' | 'memory' | 'decision'>('hypothesis');

  const {
    currentIntent,
    activePhase,
    disclosureLevel,
    confidence,
    uncertaintyBand,
    nodes,
    links,
    hypotheses,
    selectedHypothesisId,
    agents,
    checkpoints,
    currentCheckpointIndex,
    affordances,
    reflections,
    isStreaming,
    streamedThoughtTokens,
    setDisclosureLevel,
    loadScenario,
    runScenarioStep,
    startCustomThinkingProcess,
    resetMindSpace,
    selectHypothesis,
    overrideHypothesisProbability,
    addHumanThoughtNode,
    toggleNodeDiscard,
    resolveReflection,
    executeAffordance,
    restoreCheckpoint
  } = useCognitiveEngine();

  const { prototypes, activePrototypeId } = useDesignEvolution();
  const activeProto = prototypes.find((p) => p.id === activePrototypeId) || prototypes[0];
  const activeViewArchetype = activeProto.dna.interactionModel;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    startCustomThinkingProcess(customPrompt.trim());
    setCustomPrompt('');
  };

  const handleAddHumanNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanTitle.trim()) return;
    addHumanThoughtNode({
      title: humanTitle.trim(),
      content: humanContent.trim() || humanTitle.trim(),
      type: humanType,
      phase: activePhase,
      confidence: 1.0,
      weight: 1.0,
      tags: ['Benutzer-Gedanke']
    });
    setHumanTitle('');
    setHumanContent('');
    setHumanNodeDialogOpen(false);
  };

  const PHASES: Array<{ phase: typeof activePhase; label: string }> = [
    { phase: 'PERCEIVE', label: 'Wahrnehmen' },
    { phase: 'UNDERSTAND', label: 'Verstehen' },
    { phase: 'CONNECT', label: 'Verknüpfen' },
    { phase: 'HYPOTHESIZE', label: 'Hypothesen' },
    { phase: 'EVALUATE', label: 'Bewerten' },
    { phase: 'PLAN', label: 'Planen' },
    { phase: 'ACT', label: 'Handeln' },
    { phase: 'UPDATE', label: 'Lernen' }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* Top Universal Cognitive OS Header */}
      <header className="px-4 py-3 bg-[var(--bg-card)]/90 backdrop-blur border-b border-[var(--border-color)] flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Title & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent-color)] to-purple-600 flex items-center justify-center text-white shadow-md">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-[var(--text-primary)] font-mono uppercase">
                COGNITIVE OS
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-color)]/15 text-[var(--accent-color)] border border-[var(--accent-color)]/30 font-bold">
                {activeProto.codename} (Gen {activeProto.generation})
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-xs md:max-w-md">
              Mensch-KI Kognitionsschnittstelle • {activeProto.name}
            </p>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            id="tab-mind-space"
            onClick={() => {
              soundFx.playBeep(600, 0.04);
              setHubMode('mind_space');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              hubMode === 'mind_space'
                ? 'bg-[var(--accent-color)] text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Kognitionsraum</span>
          </button>

          <button
            id="tab-design-lab"
            onClick={() => {
              soundFx.playBeep(700, 0.04);
              setHubMode('design_lab');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              hubMode === 'design_lab'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Design Evolution Lab</span>
          </button>
        </div>

        {/* Right Stats: Confidence & Step Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right font-mono">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              <span>{Math.round(confidence * 100)}% Konfidenz</span>
            </div>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Unsicherheit: [{Math.round(uncertaintyBand[0] * 100)}% - {Math.round(uncertaintyBand[1] * 100)}%]
            </span>
          </div>

          <button
            id="btn-run-scenario-step"
            onClick={runScenarioStep}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-color)] text-white text-xs font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">Denkschritt ausführen</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      {hubMode === 'design_lab' ? (
        <DesignEvolutionLab onReturnToMindSpace={() => setHubMode('mind_space')} />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Sub-Header: Phase Pipeline & Scenarios */}
          <div className="px-4 py-2 bg-[var(--bg-card)]/50 border-b border-[var(--border-color)] flex items-center justify-between gap-3 overflow-x-auto shrink-0 scrollbar-none">
            {/* Phase Pipeline */}
            <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
              {PHASES.map((p, idx) => {
                const isActive = p.phase === activePhase;
                return (
                  <div key={p.phase} className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        isActive
                          ? 'bg-[var(--accent-color)] text-white shadow-sm'
                          : 'text-[var(--text-secondary)] bg-[var(--bg-input)]'
                      }`}
                    >
                      {idx + 1}. {p.label}
                    </span>
                    {idx < PHASES.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-[var(--text-secondary)] opacity-40" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scenarios Preset Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-mono font-bold hidden lg:inline">
                Szenarien:
              </span>
              <select
                onChange={(e) => loadScenario(e.target.value)}
                className="p-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                {PRESET_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title}
                  </option>
                ))}
              </select>

              <button
                id="btn-reset-mindspace"
                onClick={resetMindSpace}
                className="p-1.5 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Denkraum zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Content Area */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto lg:overflow-hidden scrollbar-thin">
            {/* Left 8 Cols: Space Canvas + Depth Slider + Affordances + Time Scrubber */}
            <div className="lg:col-span-8 flex flex-col space-y-4 min-h-0 lg:overflow-y-auto scrollbar-thin pr-1">
              {/* Progressive Disclosure Slider */}
              <ProgressiveDisclosureSlider
                currentLevel={disclosureLevel}
                onLevelChange={setDisclosureLevel}
              />

              {/* Main Interactive Cognitive Canvas */}
              <div className="flex-1 min-h-[420px] relative">
                <CognitiveSpaceCanvas
                  nodes={nodes}
                  links={links}
                  activePhase={activePhase}
                  disclosureLevel={disclosureLevel}
                  viewArchetype={activeViewArchetype as any}
                  selectedNodeId={null}
                  onSelectNode={() => {}}
                  onDiscardNode={toggleNodeDiscard}
                  onAddHumanNode={() => setHumanNodeDialogOpen(true)}
                />
              </div>

              {/* Anticipated Affordances Bar */}
              <CognitiveAffordancesBar
                affordances={affordances}
                onExecute={executeAffordance}
              />

              {/* Time Machine Scrubber */}
              <CognitiveTimeMachine
                checkpoints={checkpoints}
                currentIndex={currentCheckpointIndex}
                onSelectCheckpoint={restoreCheckpoint}
              />

              {/* Live User Prompt Input Bar */}
              <form
                onSubmit={handleCustomSubmit}
                className="flex items-center gap-2 p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg"
              >
                <div className="p-2 rounded-lg bg-[var(--bg-input)] text-[var(--accent-color)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Gib ein beliebiges Problem, These oder Frage ein (z. B. 'Entwirf ein fehlertolerantes Sensornetz')..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!customPrompt.trim() || isStreaming}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Denkprozess starten</span>
                </button>
              </form>
            </div>

            {/* Right 4 Cols: Hypotheses, Meta-Cognition & Swarm Monitor */}
            <div className="lg:col-span-4 flex flex-col space-y-4 min-h-0 lg:overflow-y-auto scrollbar-thin pl-1">
              {/* Competing Hypotheses Divergence Panel */}
              <HypothesisDivergencePanel
                hypotheses={hypotheses}
                selectedId={selectedHypothesisId}
                onSelect={selectHypothesis}
                onOverrideProb={overrideHypothesisProbability}
                onForkAlternative={() => setHumanNodeDialogOpen(true)}
              />

              {/* Meta-Cognitive Reflector */}
              <MetaCognitiveReflector
                reflections={reflections}
                onResolve={resolveReflection}
              />

              {/* Live Streaming Thought Tokens Terminal */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3.5 shadow-md space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    <h4 className="text-xs font-bold font-mono uppercase text-[var(--text-primary)]">
                      Gedanken-Stream & Telemetrie
                    </h4>
                  </div>
                  {isStreaming && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--accent-color)] animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]" />
                      Streamt Gedanken...
                    </span>
                  )}
                </div>

                <div className="bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-secondary)] max-h-44 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {streamedThoughtTokens.map((token, idx) => (
                    <div key={idx} className="leading-relaxed flex items-start gap-1.5">
                      <span className="text-[var(--accent-color)] font-bold shrink-0">›</span>
                      <span className="text-[var(--text-primary)]">{token}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Agent Swarm Monitor (Level 4 Mechanics) */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3.5 shadow-md space-y-2.5">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    <h4 className="text-xs font-bold font-mono uppercase text-[var(--text-primary)]">
                      Kognitiver Agenten-Schwarm
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {agents.length} Agenten aktiv
                  </span>
                </div>

                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: agent.color }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--text-primary)] truncate">
                            {agent.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)] truncate">
                            {agent.currentTask}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-[10px] shrink-0 text-[var(--text-secondary)]">
                        <div>{agent.latencyMs}ms</div>
                        <div className="text-emerald-400 font-bold">
                          {Math.round(agent.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Human Thought Node Injection Modal */}
      {humanNodeDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleAddHumanNodeSubmit}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-[var(--accent-color)] font-bold">
              <Plus className="w-5 h-5" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Menschlichen Gedanken einspeisen
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Füge einen Steuerimpuls, eine eigene Hypothese oder zusätzliche Kontextinformationen direkt in den aktiven Denkraum ein.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Typ:</label>
                <select
                  value={humanType}
                  onChange={(e) => setHumanType(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="hypothesis">Hypothese (Eigene These)</option>
                  <option value="perception">Wahrnehmung (Neuer Fakt / Beobachtung)</option>
                  <option value="decision">Entscheidung (Menschliches Richtungsurteil)</option>
                  <option value="memory">Gedächtnis (Hintergrundwissen)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Titel / Kernthese:</label>
                <input
                  type="text"
                  placeholder="z. B. Alternative: Edge-Computing mit WebAssembly"
                  value={humanTitle}
                  onChange={(e) => setHumanTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Ausführliche Begründung:</label>
                <textarea
                  placeholder="Erläutere den Gedankengang und die beabsichtigten Konsequenzen..."
                  value={humanContent}
                  onChange={(e) => setHumanContent(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHumanNodeDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--accent-color)] text-white text-xs font-bold shadow-md hover:opacity-90"
              >
                In Denkraum integrieren
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
