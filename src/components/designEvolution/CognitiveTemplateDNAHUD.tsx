/**
 * Cognitive Template Design DNA Inspector & Evolution HUD
 * Real-time genetic parameter tuning & preference learning radar for Cognitive Explorer views.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dna,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Volume1,
  Layers,
  Cpu,
  Star,
  Eye,
  Network,
  LayoutGrid,
  List,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useMuscalStore, ExplorerTemplateId } from '@/store/useMuscalStore';
import { TemplateDesignDNA } from '@/types/designEvolution';
import { soundFx } from '@/lib/soundFx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CognitiveTemplateDNAHUD: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    explorerTemplate,
    setExplorerTemplate,
    templateDNA,
    templateUsage,
    templatePreferences,
    updateTemplateDNA,
    evolveTemplateDNA,
    evolveAllTemplates,
    resetTemplateDNA,
    rateTemplate,
    getRecommendedTemplate
  } = useMuscalStore();

  const [selectedTemplateTab, setSelectedTemplateTab] = useState<ExplorerTemplateId>(explorerTemplate);
  const [showEvolutionLog, setShowEvolutionLog] = useState(false);

  if (!isOpen) return null;

  const currentDNA = templateDNA[selectedTemplateTab] || templateDNA.grid;
  const currentUsage = templateUsage[selectedTemplateTab] || templateUsage.grid;
  const recommendedTemplate = getRecommendedTemplate();
  const isRecommended = recommendedTemplate === selectedTemplateTab;

  const handleUpdate = (partial: Partial<TemplateDesignDNA>) => {
    updateTemplateDNA(selectedTemplateTab, partial);
  };

  const handleEvolve = () => {
    soundFx.playPromptSubmit();
    evolveTemplateDNA(selectedTemplateTab);
  };

  const templateIcons = {
    grid: LayoutGrid,
    list: List,
    spatial: Network,
    tree: FolderTree
  };

  const templateLabels = {
    grid: 'Matrix Grid',
    list: 'Linear Stream',
    spatial: 'Spatial Orbit',
    tree: 'Epistemic Tree'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-4xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--accent-color)]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Dna className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  Cognitive Design Evolution Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Gen {currentDNA.generation} • DNA Aktiv
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Adaptives neuronales UI-Lernen & Design-DNA für Cognitive Explorer Templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              Schließen
            </button>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="px-4 sm:px-5 py-2.5 bg-[var(--bg-main)]/60 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--text-tertiary)] mr-1">
              Explorer Template:
            </span>
            {(['grid', 'list', 'spatial', 'tree'] as ExplorerTemplateId[]).map((tId) => {
              const Icon = templateIcons[tId];
              const isSelected = selectedTemplateTab === tId;
              const weight = Math.round((templatePreferences.weights[tId] || 0) * 100);
              const isTopRec = recommendedTemplate === tId;

              return (
                <button
                  key={tId}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedTemplateTab(tId);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{templateLabels[tId]}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/30 text-white' : 'bg-black/20 text-[var(--text-tertiary)]'}`}>
                    {weight}%
                  </span>
                  {isTopRec && (
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setExplorerTemplate(selectedTemplateTab);
                soundFx.playSystemBootBeep();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                explorerTemplate === selectedTemplateTab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              {explorerTemplate === selectedTemplateTab ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bereits im Explorer aktiv</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Als aktives View setzen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body: Left DNA Controls, Right Preference Learning Radar */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* Preference Convergence & Recommended Affinity Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 border border-emerald-500/30 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>Neuronale Präferenz-Konvergenz</span>
              </div>
              <div className="text-2xl font-black text-[var(--text-primary)] font-mono">
                {templatePreferences.learningConvergenceScore}%
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Basiert auf {templatePreferences.totalInteractionsLogged} erfassten Interaktionen & Dwell-Zeiten.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)]">
                KI-Empfohlenes Layout
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)] capitalize">
                  {templateLabels[recommendedTemplate]}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                  {Math.round((templatePreferences.weights[recommendedTemplate] || 0) * 100)}% Affinität
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Passend zur bevorzugten {templatePreferences.preferredDensity}-Dichte.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
              <button
                onClick={handleEvolve}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Auto-Adapt DNA (Gen {currentDNA.generation + 1})</span>
              </button>
              <button
                onClick={evolveAllTemplates}
                className="w-full py-1.5 px-3 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-medium transition flex items-center justify-center gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Alle 4 Templates evolvieren</span>
              </button>
            </div>
          </div>

          {/* DNA Traits Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 font-mono">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Genetische Parameter für [{templateLabels[selectedTemplateTab]}]</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  Bewertung:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => rateTemplate(selectedTemplateTab, star)}
                      className="p-1 hover:scale-110 transition"
                      title={`Template mit ${star} Sternen bewerten`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          (currentUsage.explicitRating || 3) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[var(--text-tertiary)]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* Trait: Density */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--text-primary)]">Layout-Dichte:</label>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold capitalize">
                    {currentDNA.density}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['compact', 'balanced', 'spacious'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleUpdate({ density: d })}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-medium transition text-center ${
                        currentDNA.density === d
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {d === 'compact' ? 'Kompakt' : d === 'balanced' ? 'Balanciert' : 'Geräumig'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trait: Visual Palette */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--text-primary)]">Visuelle DNA:</label>
                  <span className="font-mono text-[10px] text-cyan-400 font-bold">
                    {currentDNA.visualTheme}
                  </span>
                </div>
                <select
                  value={currentDNA.visualTheme}
                  onChange={(e) => handleUpdate({ visualTheme: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none"
                >
                  <option value="cyber_emerald">Cyber Emerald (High-Tech Grün)</option>
                  <option value="akira_matrix">Akira Neo-Tokyo (Neon Rot)</option>
                  <option value="zen_minimal">Spatial Zen (Subtil Minimal)</option>
                  <option value="tokyo_neon">Tokyo Electric (Cyan Glow)</option>
                </select>
              </div>

              {/* Trait: Particle Stream Density */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--text-primary)]">Partikel-Dichte:</label>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    {currentDNA.particleDensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentDNA.particleDensity}
                  onChange={(e) => handleUpdate({ particleDensity: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[var(--text-tertiary)]">
                  <span>0% Aus</span>
                  <span>50% Ausgewogen</span>
                  <span>100% Voller Fluss</span>
                </div>
              </div>

              {/* Trait: Hover Inspect Depth */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--text-primary)]">Hover Inspektionstiefe:</label>
                  <span className="font-mono text-[10px] text-purple-400 font-bold">
                    Stufe {currentDNA.hoverInspectDepth}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleUpdate({ hoverInspectDepth: lvl as any })}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-medium transition text-center ${
                        currentDNA.hoverInspectDepth === lvl
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {lvl === 1 ? 'Basis' : lvl === 2 ? 'Metadaten' : 'Voll-RAG'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trait: Spatial Force Physics */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--text-primary)]">Spatial Physics & Gravitation:</label>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">
                    {currentDNA.spatialPhysics ? 'Aktiv' : 'Statisch'}
                  </span>
                </div>
                <button
                  onClick={() => handleUpdate({ spatialPhysics: !currentDNA.spatialPhysics })}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                    currentDNA.spatialPhysics
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>{currentDNA.spatialPhysics ? 'Kraftfeld-Physik aktiv' : 'Statische Anordnung'}</span>
                </button>
              </div>

              {/* Trait: Audio Feedback */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--text-primary)]">Audio-Feedback Level:</label>
                  <span className="font-mono text-[10px] text-amber-400 font-bold capitalize">
                    {currentDNA.audioFeedbackLevel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['silent', 'subtle', 'rich'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleUpdate({ audioFeedbackLevel: lvl })}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-medium transition text-center ${
                        currentDNA.audioFeedbackLevel === lvl
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {lvl === 'silent' ? 'Stumm' : lvl === 'subtle' ? 'Subtil' : 'Harmonisch'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Evolutionary Notes & Metadata */}
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Genetische Evolutions-Notizen</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                Modifikationen: {currentUsage.directModificationsCount} manuell
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
              "{currentDNA.evolutionaryNotes || 'Standard-Konfiguration der Generation 1.'}"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)] font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Persistiert im lokalen Speicher (muscal_template_dna)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => resetTemplateDNA(selectedTemplateTab)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>DNA zurücksetzen</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
            >
              Fertigstellen
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
