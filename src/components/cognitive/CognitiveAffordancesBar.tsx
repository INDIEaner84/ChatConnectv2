/**
 * Cognitive Affordances Bar
 * Anticipates the user's next logical thoughts and moves without intrusive menus.
 */

import React from 'react';
import { CognitiveAffordance } from '@/types/cognitive';
import { 
  Sparkles, 
  Search, 
  GitBranch, 
  CheckCircle2, 
  ShieldAlert, 
  Code2, 
  Cpu, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  affordances: CognitiveAffordance[];
  onExecute: (affordance: CognitiveAffordance) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  GitBranch,
  CheckCircle2,
  ShieldAlert,
  Code2,
  Cpu,
  Layers,
  Sparkles
};

export const CognitiveAffordancesBar: React.FC<Props> = ({ affordances, onExecute }) => {
  if (!affordances || affordances.length === 0) return null;

  return (
    <div className="bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border-color)] rounded-xl p-3 shadow-md">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide">
            Antizipierte Denkbewegungen (Affordanzen)
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]">
          Klicke, um Denkpfad zu vertiefen
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {affordances.map((aff) => {
          const Icon = ICON_MAP[aff.iconName] || Sparkles;
          const confPercent = Math.round(aff.confidence * 100);

          return (
            <button
              key={aff.id}
              id={`affordance-btn-${aff.id}`}
              onClick={() => {
                soundFx.playBeep(850, 0.05);
                onExecute(aff);
              }}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--accent-color)]/10 border border-[var(--border-color)] hover:border-[var(--accent-color)]/50 transition-all text-left shrink-0 shadow-sm"
            >
              <div className="p-1.5 rounded-md bg-[var(--bg-input)] group-hover:bg-[var(--accent-color)] text-[var(--text-primary)] group-hover:text-white transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                    {aff.title}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1 rounded bg-[var(--bg-input)] text-[var(--text-secondary)]">
                    {confPercent}%
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] max-w-xs truncate">
                  {aff.description}
                </span>
              </div>

              <ArrowUpRight className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] opacity-0 group-hover:opacity-100 transition-all ml-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
