/**
 * Progressive Cognitive Disclosure Controller
 * Levels 1 (Intuition) -> 2 (Explanation) -> 3 (Structure) -> 4 (Mechanics) -> 5 (Deep Technical)
 */

import React from 'react';
import { CognitiveDisclosureLevel } from '@/types/cognitive';
import { Eye, HelpCircle, Network, Cpu, Terminal } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  currentLevel: CognitiveDisclosureLevel;
  onLevelChange: (level: CognitiveDisclosureLevel) => void;
}

interface LevelMeta {
  level: CognitiveDisclosureLevel;
  label: string;
  subtitle: string;
  question: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const LEVELS: LevelMeta[] = [
  {
    level: 1,
    label: 'Intuition',
    subtitle: 'Kompakte Essenz',
    question: 'Was passiert gerade?',
    icon: Eye,
    color: '#06b6d4' // cyan
  },
  {
    level: 2,
    label: 'Erklärung',
    subtitle: 'Kausaler Grund',
    question: 'Warum geschieht es?',
    icon: HelpCircle,
    color: '#3b82f6' // blue
  },
  {
    level: 3,
    label: 'Struktur',
    subtitle: 'Gedanken & Thesen',
    question: 'Welche Relationen & Thesen wirken?',
    icon: Network,
    color: '#8b5cf6' // purple
  },
  {
    level: 4,
    label: 'Mechanik',
    subtitle: 'Agenten & Werkzeuge',
    question: 'Welche Agenten & Modelle arbeiten?',
    icon: Cpu,
    color: '#f59e0b' // amber
  },
  {
    level: 5,
    label: 'Telemetrie',
    subtitle: 'Rohdaten & Latenz',
    question: 'Welche Systemzustände & Vektoren liegen an?',
    icon: Terminal,
    color: '#ec4899' // pink
  }
];

export const ProgressiveDisclosureSlider: React.FC<Props> = ({ currentLevel, onLevelChange }) => {
  return (
    <div className="bg-[var(--bg-card)]/80 backdrop-blur border border-[var(--border-color)] rounded-xl p-2.5 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-color)]">
            Progressive Kognitionstiefe
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-color)] font-mono text-[var(--text-secondary)]">
            Stufe {currentLevel} / 5
          </span>
        </div>
        <span className="text-xs text-[var(--text-secondary)] font-medium hidden sm:inline">
          {LEVELS[currentLevel - 1].question}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)]">
        {LEVELS.map((item) => {
          const Icon = item.icon;
          const isActive = currentLevel === item.level;
          const isPassed = currentLevel >= item.level;

          return (
            <button
              key={item.level}
              id={`disclosure-level-${item.level}`}
              onClick={() => {
                soundFx.playBeep(450 + item.level * 100, 0.04);
                onLevelChange(item.level);
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all text-center relative group ${
                isActive
                  ? 'bg-[var(--accent-color)] text-white shadow-md font-bold'
                  : isPassed
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span className="text-xs font-mono font-bold">{item.level}</span>
              </div>
              <span className="text-[11px] truncate w-full tracking-tight mt-0.5">
                {item.label}
              </span>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-[var(--accent-color)] rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
