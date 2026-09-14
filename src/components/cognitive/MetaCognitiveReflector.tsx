/**
 * Meta-Cognitive Reflector Component
 * Evaluates thinking quality in real time: detects hidden circular assumptions,
 * biases, epistemic gaps, and serendipitous cross-domain bridges.
 */

import React from 'react';
import { MetaCognitiveReflection } from '@/types/cognitive';
import { 
  Sparkles, 
  AlertCircle, 
  Compass, 
  Lightbulb, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  reflections: MetaCognitiveReflection[];
  onResolve: (id: string) => void;
}

export const MetaCognitiveReflector: React.FC<Props> = ({ reflections, onResolve }) => {
  if (!reflections || reflections.length === 0) {
    return (
      <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-secondary)] flex items-center gap-2">
        <Compass className="w-4 h-4 text-[var(--accent-color)] animate-spin-slow shrink-0" />
        <span>Meta-Kognition aktiv: Keine logischen Zirkelschlüsse oder Zielkonflikte erkannt.</span>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3.5 shadow-md space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-500">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              Meta-Kognitiver Reflektor
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Überwacht Denkqualität, Zielwidersprüche und Heuristik
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)]">
          {reflections.filter((r) => !r.isResolved).length} Offen
        </span>
      </div>

      <div className="space-y-2">
        {reflections.map((ref) => {
          const isResolved = ref.isResolved;

          return (
            <div
              key={ref.id}
              id={`reflection-item-${ref.id}`}
              className={`p-2.5 rounded-lg border text-xs transition-all ${
                isResolved
                  ? 'bg-[var(--bg-main)]/50 border-[var(--border-color)]/50 opacity-60'
                  : ref.severity === 'high'
                  ? 'bg-rose-500/5 border-rose-500/30'
                  : ref.type === 'serendipitous_discovery'
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-bold">
                  {ref.type === 'serendipitous_discovery' ? (
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  ) : ref.severity === 'high' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="text-[var(--text-primary)]">{ref.title}</span>
                </div>

                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]">
                  {ref.detectedAtPhase}
                </span>
              </div>

              <p className="text-[var(--text-secondary)] mb-2 leading-relaxed">
                {ref.description}
              </p>

              {ref.suggestedResolution && !isResolved && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]/30">
                  <span className="text-[11px] text-[var(--text-primary)] font-medium truncate">
                    💡 {ref.suggestedResolution}
                  </span>

                  <button
                    id={`btn-resolve-ref-${ref.id}`}
                    onClick={() => {
                      soundFx.playSuccessBeep();
                      onResolve(ref.id);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--accent-color)] text-white text-[11px] font-bold hover:opacity-90 shrink-0"
                  >
                    <span>Auflösen</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {isResolved && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold pt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Widerspruch aufgelöst und in Kausalgraph integriert</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
