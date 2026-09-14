/**
 * Design DNA Inspector & Genetic Parameter Tuning Panel
 */

import React from 'react';
import { DesignDNA, PrototypeArchetype } from '@/types/designEvolution';
import { Dna, Sliders, Sparkles, RefreshCw } from 'lucide-react';
import { soundFx } from '@/lib/soundFx';

interface Props {
  prototype: PrototypeArchetype;
  onUpdateDNA: (partial: Partial<DesignDNA>) => void;
}

export const DesignDNAPanel: React.FC<Props> = ({ prototype, onUpdateDNA }) => {
  const { dna } = prototype;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Design-DNA & Kognitive Genetik
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Parametrische Steuerung von {prototype.name} (Gen {prototype.generation})
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--accent-color)] font-bold">
          {prototype.codename}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Trait 1: Interaction Model */}
        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
          <label className="font-bold text-[var(--text-primary)]">Interaktionsmodell:</label>
          <select
            value={dna.interactionModel}
            onChange={(e) => onUpdateDNA({ interactionModel: e.target.value as any })}
            className="w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
          >
            <option value="spatial_orbit">Spatial Orbit (Orbitaler Fokus)</option>
            <option value="cognitive_flow">Cognitive Flow Stream (Kausalfluss)</option>
            <option value="synaptic_mesh">Synaptic Mesh (Kraftfeld-Graph)</option>
            <option value="horizon_matrix">Unified Horizon (Bento-Matrix)</option>
          </select>
        </div>

        {/* Trait 2: Spatial Hierarchy */}
        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
          <label className="font-bold text-[var(--text-primary)]">Räumliche Hierarchie:</label>
          <select
            value={dna.spatialHierarchy}
            onChange={(e) => onUpdateDNA({ spatialHierarchy: e.target.value as any })}
            className="w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
          >
            <option value="central_orbit">Zentrierte Umlaufbahn</option>
            <option value="bento_neural">Bento Neural Grid</option>
            <option value="split_inspector">Split-Stream & Inspektor</option>
            <option value="full_horizon">Full-Horizon Canvas</option>
          </select>
        </div>

        {/* Trait 3: Human Autonomy Balance */}
        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
          <label className="font-bold text-[var(--text-primary)]">Mensch-KI Autonomie:</label>
          <select
            value={dna.humanAutonomy}
            onChange={(e) => onUpdateDNA({ humanAutonomy: e.target.value as any })}
            className="w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
          >
            <option value="copilot_proactive">Co-Pilot & Proaktive Vorschläge</option>
            <option value="continuous_dialectic">Kontinuierlicher dialektischer Diskurs</option>
            <option value="strict_supervisory">Strikte menschliche Bestätigung</option>
          </select>
        </div>

        {/* Trait 4: Visual Rhythm */}
        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
          <label className="font-bold text-[var(--text-primary)]">Visueller Rhythmus:</label>
          <select
            value={dna.visualRhythm}
            onChange={(e) => onUpdateDNA({ visualRhythm: e.target.value as any })}
            className="w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
          >
            <option value="cyber_precision">Cyber-Präzision (Hoher Kontrast)</option>
            <option value="spatial_zen">Spatial Zen (Ruhige Balance)</option>
            <option value="matrix_fast">Matrix Fast (Maximale Datendichte)</option>
          </select>
        </div>

        {/* Trait 5: Disclosure Default Level */}
        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
          <label className="font-bold text-[var(--text-primary)]">Standard-Kognitionstiefe:</label>
          <select
            value={dna.disclosureDefault}
            onChange={(e) => onUpdateDNA({ disclosureDefault: parseInt(e.target.value, 10) as any })}
            className="w-full p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none"
          >
            <option value={1}>Stufe 1: Intuition</option>
            <option value={2}>Stufe 2: Erklärung</option>
            <option value={3}>Stufe 3: Struktur</option>
            <option value={4}>Stufe 4: Mechanik</option>
            <option value={5}>Stufe 5: Telemetrie</option>
          </select>
        </div>

        {/* Trait 6: Particle Density Slider */}
        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-[var(--text-primary)]">Synapsen-Partikeldichte:</label>
            <span className="font-mono text-[var(--accent-color)] font-bold">{dna.particleDensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={dna.particleDensity}
            onChange={(e) => onUpdateDNA({ particleDensity: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)] mt-2"
          />
        </div>
      </div>
    </div>
  );
};
