/**
 * Design Evolution Laboratory Dashboard
 * Master Hub for exploring, comparing, breeding, and mutating cognitive interface paradigms.
 */

import React, { useState } from 'react';
import { useDesignEvolution } from '@/lib/designEvolutionEngine';
import { PrototypeCard } from './PrototypeCard';
import { PrototypeComparisonMatrix } from './PrototypeComparisonMatrix';
import { HybridBreederModal } from './HybridBreederModal';
import { EvolutionaryTreeViewer } from './EvolutionaryTreeViewer';
import { DesignDNAPanel } from './DesignDNAPanel';
import { 
  Sparkles, 
  GitMerge, 
  Dna, 
  Scale, 
  Flame, 
  RotateCcw, 
  Layers, 
  Lightbulb, 
  CheckCircle2,
  Atom
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  onReturnToMindSpace?: () => void;
}

export const DesignEvolutionLab: React.FC<Props> = ({ onReturnToMindSpace }) => {
  const {
    prototypes,
    activePrototypeId,
    evolutionHistory,
    currentGeneration,
    activatePrototype,
    breedHybrid,
    mutatePrototype,
    revertToHistory,
    updateDNA
  } = useDesignEvolution();

  const [compareProtoIds, setCompareProtoIds] = useState<{ aId: string; bId: string } | null>(null);
  const [breederModalOpen, setBreederModalOpen] = useState(false);
  const [initialBreedParentId, setInitialBreedParentId] = useState<string | undefined>();
  const [mutationModalTargetId, setMutationModalTargetId] = useState<string | null>(null);
  const [mutationInput, setMutationInput] = useState<string>('Dialektische Transparenz maximieren');

  const activeProto = prototypes.find((p) => p.id === activePrototypeId) || prototypes[0];

  const handleStartCompare = (protoId: string) => {
    const other = prototypes.find((p) => p.id !== protoId) || prototypes[0];
    setCompareProtoIds({ aId: protoId, bId: other.id });
  };

  const handleStartBreed = (protoId: string) => {
    setInitialBreedParentId(protoId);
    setBreederModalOpen(true);
  };

  const handleStartMutate = (protoId: string) => {
    setMutationModalTargetId(protoId);
  };

  const handleExecuteMutation = () => {
    if (!mutationModalTargetId || !mutationInput.trim()) return;
    mutatePrototype(mutationModalTargetId, mutationInput.trim());
    setMutationModalTargetId(null);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-y-auto space-y-6 scrollbar-thin">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--accent-color)]/10 border border-[var(--border-color)] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--accent-color)]/15 text-[var(--accent-color)] border border-[var(--accent-color)]/30">
                <Atom className="w-3.5 h-3.5" /> AI Design Laboratory • Generation {currentGeneration}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-mono">
                {prototypes.length} aktive Paradigmen
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Kognitive Design-Evolution & Prototypen-Labor
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Die KI und der Mensch explorieren gemeinsam unterschiedliche Interaktionsmodelle. Probiere Prototypen live aus, vergleiche Metriken und züchte evolutionäre Hybride.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-open-hybrid-breeder"
              onClick={() => {
                soundFx.playBeep(800, 0.05);
                setInitialBreedParentId(undefined);
                setBreederModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-color)] to-purple-600 text-white text-xs font-bold shadow-lg hover:opacity-95 transition-all"
            >
              <GitMerge className="w-4 h-4" />
              <span>Hybrid kreuzen</span>
            </button>

            {onReturnToMindSpace && (
              <button
                onClick={onReturnToMindSpace}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] transition-colors"
              >
                Zum Denkraum
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Prototype Live Indicator */}
      <div className="bg-[var(--bg-card)] border border-[var(--accent-color)]/40 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-color)]/15 border border-[var(--accent-color)]/30 flex items-center justify-center text-[var(--accent-color)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--accent-color)] uppercase">
                Aktive Kognitions-Umgebung:
              </span>
              <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                {activeProto.name} (Gen {activeProto.generation})
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {activeProto.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[var(--text-secondary)]">Klarheit:</span>
          <span className="font-bold text-[var(--accent-color)]">{activeProto.metrics.cognitiveClarity}%</span>
          <span className="text-[var(--text-secondary)]">• Kontrolle:</span>
          <span className="font-bold text-emerald-400">{activeProto.metrics.userControl}%</span>
        </div>
      </div>

      {/* Archetypes Prototype Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-[var(--text-primary)]">
            Verfügbare Kognitions-Paradigmen & Prototypen
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">
            Klicke auf „Aktivieren“, um das Modell sofort im Gesamtsystem zu erleben
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {prototypes.map((proto) => (
            <PrototypeCard
              key={proto.id}
              prototype={proto}
              isActive={proto.id === activePrototypeId}
              onActivate={activatePrototype}
              onCompare={handleStartCompare}
              onBreed={handleStartBreed}
              onMutate={handleStartMutate}
            />
          ))}
        </div>
      </div>

      {/* DNA Parameter Tuning Panel */}
      <DesignDNAPanel
        prototype={activeProto}
        onUpdateDNA={(partial) => updateDNA(activeProto.id, partial)}
      />

      {/* Evolutionary Ancestor Tree */}
      <EvolutionaryTreeViewer
        history={evolutionHistory}
        prototypes={prototypes}
        activePrototypeId={activePrototypeId}
        onSelectPrototype={activatePrototype}
        onRevertToHistory={revertToHistory}
      />

      {/* Modals: Comparison Matrix */}
      {compareProtoIds && (
        <PrototypeComparisonMatrix
          protoA={prototypes.find((p) => p.id === compareProtoIds.aId) || prototypes[0]}
          protoB={prototypes.find((p) => p.id === compareProtoIds.bId) || prototypes[1]}
          onClose={() => setCompareProtoIds(null)}
          onSelectProto={(id) => {
            activatePrototype(id);
            setCompareProtoIds(null);
          }}
          onSynthesizeBoth={() => {
            breedHybrid(compareProtoIds.aId, compareProtoIds.bId);
            setCompareProtoIds(null);
          }}
        />
      )}

      {/* Modals: Hybrid Breeder */}
      {breederModalOpen && (
        <HybridBreederModal
          prototypes={prototypes}
          initialParentAId={initialBreedParentId}
          onClose={() => setBreederModalOpen(false)}
          onBreed={(pA, pB, name) => breedHybrid(pA, pB, name)}
        />
      )}

      {/* Modals: Mutation Dialog */}
      {mutationModalTargetId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-500 font-bold">
              <Flame className="w-5 h-5" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">Gezielte Mutation anstoßen</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Entwickle eine neue Generation, die spezifisch auf ein kognitives Optimierungsziel ausgerichtet ist.
            </p>
            <input
              type="text"
              value={mutationInput}
              onChange={(e) => setMutationInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMutationModalTargetId(null)}
                className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Abbrechen
              </button>
              <button
                onClick={handleExecuteMutation}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md"
              >
                Mutation erzeugen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
