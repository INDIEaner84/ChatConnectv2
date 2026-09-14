/**
 * Cognitive Time Machine & Reasoning Checkpoints Scrubber
 * Visualizes the evolution of thought over time with reversible states and checkpoint inspection.
 */

import React from 'react';
import { ReasoningCheckpoint } from '@/types/cognitive';
import { History, Play, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  checkpoints: ReasoningCheckpoint[];
  currentIndex: number;
  onSelectCheckpoint: (index: number) => void;
}

export const CognitiveTimeMachine: React.FC<Props> = ({
  checkpoints,
  currentIndex,
  onSelectCheckpoint
}) => {
  if (!checkpoints || checkpoints.length === 0) return null;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-md space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wide">
            Kognitive Zeitachse & Denk-Checkpoints
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] font-mono">
          {checkpoints.length} gespeicherte Bewusstseins-Zustände
        </span>
      </div>

      <div className="relative pt-2 pb-1">
        {/* Connecting line */}
        <div className="absolute top-5 left-4 right-4 h-0.5 bg-[var(--border-color)] z-0" />

        <div className="flex items-center justify-between relative z-10 gap-2 overflow-x-auto">
          {checkpoints.map((chk, idx) => {
            const isSelected = idx === currentIndex;
            const isPassed = idx <= currentIndex;

            return (
              <button
                key={chk.id}
                id={`checkpoint-step-${idx}`}
                onClick={() => {
                  soundFx.playBeep(600 + idx * 80, 0.04);
                  onSelectCheckpoint(idx);
                }}
                className="flex flex-col items-center group focus:outline-none min-w-[70px]"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-color)] text-white ring-4 ring-[var(--accent-color)]/20 scale-110 shadow-lg'
                      : isPassed
                      ? 'bg-[var(--bg-input)] text-[var(--accent-color)] border border-[var(--accent-color)]/50'
                      : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)] group-hover:border-[var(--text-secondary)]'
                  }`}
                >
                  {chk.stepNumber}
                </div>

                <div className="text-center mt-1.5 w-full">
                  <div className="text-[11px] font-bold text-[var(--text-primary)] truncate font-mono">
                    {chk.phase}
                  </div>
                  <div className="text-[9px] text-[var(--text-secondary)] truncate">
                    {chk.timestamp}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Checkpoint Detail */}
      {checkpoints[currentIndex] && (
        <div className="bg-[var(--bg-main)] p-2.5 rounded-lg border border-[var(--border-color)]/70 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
            <span className="text-[var(--text-secondary)] truncate">
              <strong className="text-[var(--text-primary)]">Zustand {checkpoints[currentIndex].stepNumber}:</strong>{' '}
              {checkpoints[currentIndex].summaryOfThought}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-secondary)] shrink-0">
            <span>{checkpoints[currentIndex].activeNodesCount} Knoten</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">
              {Math.round(checkpoints[currentIndex].confidenceScore * 100)}% Konfidenz
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
