/**
 * Prototype Archetype Card
 * Displays a real interactive prototype candidate with metrics, concept, and evolution triggers.
 */

import React from 'react';
import { PrototypeArchetype } from '@/types/designEvolution';
import { 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  ArrowRight, 
  Scale, 
  Dna, 
  Play,
  GitMerge,
  Flame
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  prototype: PrototypeArchetype;
  isActive: boolean;
  onActivate: (id: string) => void;
  onCompare: (id: string) => void;
  onBreed: (id: string) => void;
  onMutate: (id: string) => void;
}

export const PrototypeCard: React.FC<Props> = ({
  prototype,
  isActive,
  onActivate,
  onCompare,
  onBreed,
  onMutate
}) => {
  const { metrics, dna } = prototype;

  return (
    <div
      id={`prototype-card-${prototype.id}`}
      className={`rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
        isActive
          ? 'bg-[var(--bg-card)] border-[var(--accent-color)] shadow-xl ring-2 ring-[var(--accent-color)]/30'
          : 'bg-[var(--bg-card)]/80 border-[var(--border-color)] hover:border-[var(--text-secondary)]/50'
      }`}
    >
      {/* Top Banner / Generation Badge */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/30">
              Gen {prototype.generation} • {prototype.codename}
            </span>
            {prototype.badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                {prototype.badge}
              </span>
            )}
          </div>

          {isActive && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> AKTIV
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-[var(--text-primary)]">
          {prototype.name}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
          {prototype.subtitle}
        </p>
      </div>

      {/* Concept & Tagline */}
      <div className="p-4 space-y-3 flex-1 text-xs">
        <div className="italic text-[var(--text-primary)] bg-[var(--bg-input)]/60 p-2.5 rounded-xl border border-[var(--border-color)]/60">
          "{prototype.tagline}"
        </div>

        <p className="text-[var(--text-secondary)] leading-relaxed">
          {prototype.concept}
        </p>

        {/* Key Metrics Mini-Bars */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-secondary)]">Kognitionsklarheit:</span>
            <span className="font-bold text-[var(--accent-color)]">{metrics.cognitiveClarity}%</span>
          </div>
          <div className="w-full bg-[var(--bg-input)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--accent-color)] h-full rounded-full"
              style={{ width: `${metrics.cognitiveClarity}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <span className="text-[var(--text-secondary)]">Benutzerkontrolle:</span>
            <span className="font-bold text-emerald-400">{metrics.userControl}%</span>
          </div>
          <div className="w-full bg-[var(--bg-input)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${metrics.userControl}%` }}
            />
          </div>
        </div>

        {/* Advantages */}
        <div className="space-y-1 pt-1">
          <div className="text-[11px] font-bold text-[var(--text-primary)]">Vorteile:</div>
          <ul className="space-y-1 text-[11px] text-[var(--text-secondary)]">
            {prototype.advantages.map((adv, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)]/50 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            id={`btn-compare-${prototype.id}`}
            onClick={() => {
              soundFx.playBeep(650, 0.04);
              onCompare(prototype.id);
            }}
            className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Mit anderer Variante vergleichen"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>

          <button
            id={`btn-breed-${prototype.id}`}
            onClick={() => {
              soundFx.playBeep(750, 0.04);
              onBreed(prototype.id);
            }}
            className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Mit anderem Prototyp kreuzen"
          >
            <GitMerge className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          </button>

          <button
            id={`btn-mutate-${prototype.id}`}
            onClick={() => {
              soundFx.playBeep(850, 0.04);
              onMutate(prototype.id);
            }}
            className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Gezielte Mutation anstoßen"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>

        <button
          id={`btn-activate-${prototype.id}`}
          onClick={() => onActivate(prototype.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isActive
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-[var(--accent-color)] text-white hover:opacity-90 shadow-md'
          }`}
        >
          {isActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aktiviert</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Aktivieren & Erleben</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
