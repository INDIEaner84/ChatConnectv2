/**
 * Hybrid Breeder Modal
 * Combines two selected prototype archetypes to synthesize a next-generation cognitive interface.
 */

import React, { useState } from 'react';
import { PrototypeArchetype } from '@/types/designEvolution';
import { GitMerge, Sparkles, X, Dna, ArrowRight } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  prototypes: PrototypeArchetype[];
  initialParentAId?: string;
  onClose: () => void;
  onBreed: (parentAId: string, parentBId: string, customName?: string) => void;
}

export const HybridBreederModal: React.FC<Props> = ({
  prototypes,
  initialParentAId,
  onClose,
  onBreed
}) => {
  const [parentAId, setParentAId] = useState<string>(initialParentAId || prototypes[0]?.id || '');
  const [parentBId, setParentBId] = useState<string>(
    prototypes.find((p) => p.id !== (initialParentAId || prototypes[0]?.id))?.id || prototypes[1]?.id || ''
  );
  const [customName, setCustomName] = useState<string>('');

  const parentA = prototypes.find((p) => p.id === parentAId);
  const parentB = prototypes.find((p) => p.id === parentBId);

  const handleBreed = () => {
    if (!parentAId || !parentBId) return;
    soundFx.playSystemBootBeep();
    onBreed(parentAId, parentBId, customName.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Evolutionärer Hybrid-Synthesizer
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Kreuzt zwei Design-Paradigmen zu einer neuen Generation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Parents Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase">
                Eltern-Paradigma 1 (DNA-Geber A):
              </label>
              <select
                value={parentAId}
                onChange={(e) => setParentAId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
              >
                {prototypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    Gen {p.generation}: {p.name}
                  </option>
                ))}
              </select>
              {parentA && (
                <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] space-y-1">
                  <div className="font-bold text-[var(--text-primary)]">{parentA.codename}</div>
                  <div>Modell: {parentA.dna.interactionModel}</div>
                  <div>Klarheit: {parentA.metrics.cognitiveClarity}%</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase">
                Eltern-Paradigma 2 (DNA-Geber B):
              </label>
              <select
                value={parentBId}
                onChange={(e) => setParentBId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
              >
                {prototypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    Gen {p.generation}: {p.name}
                  </option>
                ))}
              </select>
              {parentB && (
                <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] space-y-1">
                  <div className="font-bold text-[var(--text-primary)]">{parentB.codename}</div>
                  <div>Modell: {parentB.dna.interactionModel}</div>
                  <div>Klarheit: {parentB.metrics.cognitiveClarity}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Custom Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">
              Name für neue Generation (Optional):
            </label>
            <input
              type="text"
              placeholder="z. B. Spatial Synapse Horizon Matrix"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          {/* Genetic Synthesis Forecast */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--accent-color)]/30 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[var(--accent-color)] font-bold font-mono">
              <Dna className="w-4 h-4" />
              <span>Prognostizierte genetische Rekombination:</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Die neue Generation erbt das primäre räumliche Interaktionsmodell von{' '}
              <strong className="text-[var(--text-primary)]">{parentA?.name}</strong> und kombiniert es
              mit der dialektischen Kausalitätsprüfung von{' '}
              <strong className="text-[var(--text-primary)]">{parentB?.name}</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Abbrechen
          </button>

          <button
            onClick={handleBreed}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-color)] to-purple-600 text-white text-xs font-bold hover:opacity-95 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generation N+1 erzeugen & aktivieren</span>
          </button>
        </div>
      </div>
    </div>
  );
};
