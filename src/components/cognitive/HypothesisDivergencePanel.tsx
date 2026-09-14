/**
 * Hypothesis Divergence & Epistemic Probability Panel
 * Displays competing thoughts, probability distributions, contradiction risks, and human steering overrides.
 */

import React from 'react';
import { HypothesisBranch } from '@/types/cognitive';
import { 
  GitFork, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Scale, 
  ArrowRight, 
  ShieldAlert,
  Flame
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  hypotheses: HypothesisBranch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOverrideProb: (id: string, prob: number) => void;
  onForkAlternative: () => void;
}

export const HypothesisDivergencePanel: React.FC<Props> = ({
  hypotheses,
  selectedId,
  onSelect,
  onOverrideProb,
  onForkAlternative
}) => {
  if (!hypotheses || hypotheses.length === 0) {
    return (
      <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-center text-[var(--text-secondary)] text-sm">
        <GitFork className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse text-[var(--accent-color)]" />
        <p className="font-semibold text-[var(--text-primary)]">Keine offenen Hypothesen-Divergenzen</p>
        <p className="text-xs mt-1">Die KI konvergiert aktuell auf einem stabilen Denkpfad. Starte einen Denkzyklus, um Alternativen zu explorieren.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Hypothesen-Divergenz & Denkpfade
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {hypotheses.length} konkurrierende Thesen mit probabilistischer Konfidenz
            </p>
          </div>
        </div>

        <button
          id="btn-fork-alternative"
          onClick={() => {
            soundFx.playBeep(950, 0.06);
            onForkAlternative();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-input)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          <span>Pfad forken</span>
        </button>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {hypotheses.map((hypo) => {
          const isSelected = hypo.id === selectedId || hypo.isSelected;
          const probPercent = Math.round(hypo.probability * 100);

          return (
            <div
              key={hypo.id}
              id={`hypo-card-${hypo.id}`}
              className={`p-3.5 rounded-xl border transition-all relative ${
                isSelected
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/5 shadow-md ring-1 ring-[var(--accent-color)]/30'
                  : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)]/50'
              }`}
            >
              {/* Top Row: Label & Archetype Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                      {hypo.label}
                    </span>
                    {hypo.archetype === 'dialectic_antithesis' && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 font-semibold">
                        <Flame className="w-3 h-3" /> Dialektische Antithesen
                      </span>
                    )}
                    {hypo.archetype === 'novel' && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold">
                        <Sparkles className="w-3 h-3" /> Laterale Innovation
                      </span>
                    )}
                    {hypo.archetype === 'conservative' && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
                        <Scale className="w-3 h-3" /> Pragmatischer Standard
                      </span>
                    )}
                    {hypo.userOverridden && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                        Vom Menschen gesteuert
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {hypo.premise}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-base font-mono font-black text-[var(--accent-color)]">
                    {probPercent}%
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                    Wahrsch.
                  </span>
                </div>
              </div>

              {/* Rationale & Implications */}
              <div className="bg-[var(--bg-input)]/70 p-2.5 rounded-lg border border-[var(--border-color)]/60 text-xs space-y-1.5 mb-3">
                <div className="text-[var(--text-primary)]">
                  <strong className="text-[var(--text-secondary)]">Begründung:</strong> {hypo.rationale}
                </div>
                {hypo.implications.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Konsequenzen:</span>
                    {hypo.implications.map((imp, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                        {imp}
                      </span>
                    ))}
                  </div>
                )}
                {hypo.contradictionRisk > 0.3 && (
                  <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-semibold pt-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Widerspruchsrisiko: {Math.round(hypo.contradictionRisk * 100)}%</span>
                  </div>
                )}
              </div>

              {/* Prob Slider & Select Action */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[var(--border-color)]/40">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
                    Gewichtung:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={probPercent}
                    onChange={(e) => onOverrideProb(hypo.id, parseInt(e.target.value, 10) / 100)}
                    className="flex-1 h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
                  />
                </div>

                <button
                  id={`btn-select-hypo-${hypo.id}`}
                  onClick={() => onSelect(hypo.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isSelected
                      ? 'bg-[var(--accent-color)] text-white shadow-[var(--accent-color)]/20'
                      : 'bg-[var(--bg-card)] hover:bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ausgewählter Pfad</span>
                    </>
                  ) : (
                    <>
                      <span>Diesen Pfad wählen</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
