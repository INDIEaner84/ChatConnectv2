/**
 * Prototype Comparison Matrix
 * Side-by-side comparative inspection of two candidate cognitive paradigms.
 */

import React from 'react';
import { PrototypeArchetype } from '@/types/designEvolution';
import { Scale, GitMerge, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  protoA: PrototypeArchetype;
  protoB: PrototypeArchetype;
  onClose: () => void;
  onSelectProto: (id: string) => void;
  onSynthesizeBoth: () => void;
}

export const PrototypeComparisonMatrix: React.FC<Props> = ({
  protoA,
  protoB,
  onClose,
  onSelectProto,
  onSynthesizeBoth
}) => {
  const metricsKeys: Array<{ key: keyof PrototypeArchetype['metrics']; label: string }> = [
    { key: 'cognitiveClarity', label: 'Kognitive Klarheit' },
    { key: 'intuitiveness', label: 'Intuitivität' },
    { key: 'userControl', label: 'Menschliche Kontrolle' },
    { key: 'informationDensity', label: 'Informationsdichte' },
    { key: 'explainability', label: 'Erklärbarkeit' },
    { key: 'novelty', label: 'Neuartigkeit / Innovationsgrad' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[var(--accent-color)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Kognitiver Prototypen-Vergleich
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {/* Side by side Headers */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
              <span className="text-[10px] font-mono font-bold text-[var(--accent-color)] uppercase">
                Variante A (Gen {protoA.generation})
              </span>
              <h4 className="text-lg font-bold text-[var(--text-primary)] mt-1">{protoA.name}</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{protoA.subtitle}</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                Variante B (Gen {protoB.generation})
              </span>
              <h4 className="text-lg font-bold text-[var(--text-primary)] mt-1">{protoB.name}</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{protoB.subtitle}</p>
            </div>
          </div>

          {/* Metrics Comparative Bars */}
          <div className="space-y-4 bg-[var(--bg-main)]/60 p-5 rounded-xl border border-[var(--border-color)]">
            <h4 className="text-xs font-bold uppercase font-mono text-[var(--text-primary)] tracking-wider">
              Metrik-Vergleich (Neuro-Kognitive Leistungsindikatoren)
            </h4>

            <div className="space-y-3">
              {metricsKeys.map(({ key, label }) => {
                const valA = protoA.metrics[key];
                const valB = protoB.metrics[key];

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[var(--accent-color)]">{valA}%</span>
                      <span className="text-[var(--text-primary)] font-semibold">{label}</span>
                      <span className="font-mono font-bold text-purple-400">{valB}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="w-full bg-[var(--bg-input)] h-2 rounded-full overflow-hidden flex justify-end">
                        <div
                          className="bg-[var(--accent-color)] h-full rounded-full"
                          style={{ width: `${valA}%` }}
                        />
                      </div>
                      <div className="w-full bg-[var(--bg-input)] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${valB}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Design DNA Differences */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-[var(--text-primary)]">DNA von {protoA.codename}:</span>
              <div className="bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border-color)] font-mono text-[11px] space-y-1 text-[var(--text-secondary)]">
                <div>Modell: <strong className="text-[var(--text-primary)]">{protoA.dna.interactionModel}</strong></div>
                <div>Hierarchie: <strong className="text-[var(--text-primary)]">{protoA.dna.spatialHierarchy}</strong></div>
                <div>Autonomie: <strong className="text-[var(--text-primary)]">{protoA.dna.humanAutonomy}</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[var(--text-primary)]">DNA von {protoB.codename}:</span>
              <div className="bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border-color)] font-mono text-[11px] space-y-1 text-[var(--text-secondary)]">
                <div>Modell: <strong className="text-[var(--text-primary)]">{protoB.dna.interactionModel}</strong></div>
                <div>Hierarchie: <strong className="text-[var(--text-primary)]">{protoB.dna.spatialHierarchy}</strong></div>
                <div>Autonomie: <strong className="text-[var(--text-primary)]">{protoB.dna.humanAutonomy}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectProto(protoA.id)}
              className="px-4 py-2 rounded-xl bg-[var(--accent-color)] text-white text-xs font-bold hover:opacity-90 shadow-md"
            >
              Variante A wählen
            </button>
            <button
              onClick={() => onSelectProto(protoB.id)}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:opacity-90 shadow-md"
            >
              Variante B wählen
            </button>
          </div>

          <button
            onClick={onSynthesizeBoth}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-color)] to-purple-600 text-white text-xs font-bold hover:opacity-95 shadow-lg"
          >
            <GitMerge className="w-4 h-4" />
            <span>Beide Varianten zu neuem Hybrid kreuzen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
