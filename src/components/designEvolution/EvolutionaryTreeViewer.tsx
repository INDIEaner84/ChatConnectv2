/**
 * Evolutionary Tree Viewer
 * Displays the genealogy of UI generations with time-travel rewind and lineage connections.
 */

import React from 'react';
import { DesignEvolutionHistoryEntry, PrototypeArchetype } from '@/types/designEvolution';
import { GitBranch, History, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  history: DesignEvolutionHistoryEntry[];
  prototypes: PrototypeArchetype[];
  activePrototypeId: string;
  onSelectPrototype: (id: string) => void;
  onRevertToHistory: (historyId: string) => void;
}

export const EvolutionaryTreeViewer: React.FC<Props> = ({
  history,
  prototypes,
  activePrototypeId,
  onSelectPrototype,
  onRevertToHistory
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Evolutionäre Design-Historie & Ahnentafel
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Verfolge die Entstehung deiner Kognitionsoberfläche über Generationen
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)]">
          {history.length} Evolutions-Epochen
        </span>
      </div>

      <div className="space-y-3 relative">
        {/* Vertical line connecting nodes */}
        <div className="absolute top-4 bottom-4 left-5 w-0.5 bg-[var(--border-color)] z-0" />

        {history.map((entry, idx) => {
          const isActive = entry.selectedPrototypeId === activePrototypeId;
          const proto = prototypes.find((p) => p.id === entry.selectedPrototypeId);

          return (
            <div
              key={entry.id}
              className={`relative z-10 flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-[var(--bg-main)] border-[var(--accent-color)] shadow-md'
                  : 'bg-[var(--bg-main)]/60 border-[var(--border-color)] hover:border-[var(--text-secondary)]/50'
              }`}
            >
              {/* Circle Generation badge */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-[var(--accent-color)] text-white ring-4 ring-[var(--accent-color)]/20 shadow-sm'
                    : 'bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)]'
                }`}
              >
                G{entry.generation}
              </div>

              {/* Info & Rationale */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                      {entry.prototypeName}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]">
                      {entry.action}
                    </span>
                  </div>

                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {entry.timestamp}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {entry.rationale}
                </p>

                {proto && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border-color)]/40 text-[11px] font-mono">
                    <span className="text-[var(--text-secondary)]">Klarheit:</span>
                    <span className="font-bold text-[var(--accent-color)]">
                      {proto.metrics.cognitiveClarity}%
                    </span>
                    <span className="text-[var(--text-secondary)]">• Modell:</span>
                    <span className="text-[var(--text-primary)]">{proto.dna.interactionModel}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="shrink-0 flex items-center">
                {isActive ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aktiv</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      soundFx.playTimeTravel();
                      onSelectPrototype(entry.selectedPrototypeId);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-[var(--accent-color)]" />
                    <span>Wiederherstellen</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
