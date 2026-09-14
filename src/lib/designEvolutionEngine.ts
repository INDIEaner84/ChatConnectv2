/**
 * Design Evolution Engine
 * Manages Prototype Archetypes, Generational Breeding, DNA Inheritance, and Live Switching.
 */

import { create } from 'zustand';
import { 
  PrototypeArchetype, 
  DesignDNA, 
  DesignEvolutionHistoryEntry, 
  UserPreferenceSignal,
  PrototypeMetrics,
  ExplorerTemplateId,
  TemplateDesignDNA,
  TemplateUsageMetrics,
  TemplatePreferenceProfile
} from '../types/designEvolution';
import { soundFx } from './soundFx';

export const DEFAULT_TEMPLATE_DNA: Record<ExplorerTemplateId, TemplateDesignDNA> = {
  grid: {
    templateId: 'grid',
    generation: 1,
    name: 'Holographic Matrix Grid',
    density: 'balanced',
    accentContrast: 'neon_high',
    visualTheme: 'cyber_emerald',
    particleDensity: 40,
    hoverInspectDepth: 2,
    spatialPhysics: false,
    audioFeedbackLevel: 'subtle',
    holographicBlur: true,
    telemetryBadges: true,
    disclosureDefault: 2,
    cardCornerRadius: 'standard',
    autoClustering: false,
    sortPreference: 'date',
    showWaveformAnimations: true,
    evolutionaryNotes: 'Optimiert für visuelle Erkennung und schnelle Voransicht.'
  },
  list: {
    templateId: 'list',
    generation: 1,
    name: 'Linear Synaptic Stream',
    density: 'compact',
    accentContrast: 'subtle_matte',
    visualTheme: 'zen_minimal',
    particleDensity: 15,
    hoverInspectDepth: 1,
    spatialPhysics: false,
    audioFeedbackLevel: 'subtle',
    holographicBlur: false,
    telemetryBadges: true,
    disclosureDefault: 1,
    cardCornerRadius: 'sharp',
    autoClustering: false,
    sortPreference: 'date',
    showWaveformAnimations: false,
    evolutionaryNotes: 'Maximale Informationsdichte für methodische Code- und Dateianalysen.'
  },
  spatial: {
    templateId: 'spatial',
    generation: 1,
    name: 'Orbital Dynamic Mesh',
    density: 'spacious',
    accentContrast: 'neon_high',
    visualTheme: 'tokyo_neon',
    particleDensity: 75,
    hoverInspectDepth: 3,
    spatialPhysics: true,
    audioFeedbackLevel: 'rich',
    holographicBlur: true,
    telemetryBadges: true,
    disclosureDefault: 3,
    cardCornerRadius: 'pill',
    autoClustering: true,
    sortPreference: 'relevance',
    showWaveformAnimations: true,
    evolutionaryNotes: 'Kraftfeld-basiertes Graphennetzwerk mit orbitaler Zentrierung.'
  },
  tree: {
    templateId: 'tree',
    generation: 1,
    name: 'Hierarchical Epistemic Tree',
    density: 'balanced',
    accentContrast: 'subtle_matte',
    visualTheme: 'akira_matrix',
    particleDensity: 25,
    hoverInspectDepth: 2,
    spatialPhysics: false,
    audioFeedbackLevel: 'subtle',
    holographicBlur: true,
    telemetryBadges: true,
    disclosureDefault: 2,
    cardCornerRadius: 'standard',
    autoClustering: true,
    sortPreference: 'name',
    showWaveformAnimations: true,
    evolutionaryNotes: 'Taxonomische Aufschlüsselung nach MIME-Typen und semantischen Tags.'
  }
};

export const DEFAULT_TEMPLATE_USAGE: Record<ExplorerTemplateId, TemplateUsageMetrics> = {
  grid: {
    templateId: 'grid',
    selectionCount: 5,
    totalDwellTimeMs: 120000,
    interactionCount: 14,
    lastSelectedAt: new Date().toISOString(),
    explicitRating: 4,
    directModificationsCount: 0
  },
  list: {
    templateId: 'list',
    selectionCount: 2,
    totalDwellTimeMs: 45000,
    interactionCount: 6,
    lastSelectedAt: undefined,
    explicitRating: 3,
    directModificationsCount: 0
  },
  spatial: {
    templateId: 'spatial',
    selectionCount: 4,
    totalDwellTimeMs: 160000,
    interactionCount: 22,
    lastSelectedAt: undefined,
    explicitRating: 5,
    directModificationsCount: 1
  },
  tree: {
    templateId: 'tree',
    selectionCount: 1,
    totalDwellTimeMs: 25000,
    interactionCount: 3,
    lastSelectedAt: undefined,
    explicitRating: 3,
    directModificationsCount: 0
  }
};

export const DEFAULT_PREFERENCE_PROFILE: TemplatePreferenceProfile = {
  preferredDensity: 'balanced',
  preferredSpatialPhysics: true,
  preferredAudioFeedback: 'rich',
  preferredTheme: 'cyber_emerald',
  preferredDisclosureDepth: 2,
  learningConvergenceScore: 68,
  totalInteractionsLogged: 45,
  lastUpdated: new Date().toISOString(),
  recommendedTemplate: 'spatial',
  weights: {
    grid: 0.30,
    list: 0.15,
    spatial: 0.45,
    tree: 0.10
  }
};

/**
 * Recompute preference weights and recommended template based on live telemetry
 */
export function recomputePreferenceProfile(
  usage: Record<ExplorerTemplateId, TemplateUsageMetrics>,
  dnas: Record<ExplorerTemplateId, TemplateDesignDNA>
): TemplatePreferenceProfile {
  const templates: ExplorerTemplateId[] = ['grid', 'list', 'spatial', 'tree'];
  
  // Calculate total raw engagement scores per template
  const rawScores: Record<ExplorerTemplateId, number> = {
    grid: 0,
    list: 0,
    spatial: 0,
    tree: 0
  };

  let totalPoints = 0;
  let totalInteractions = 0;

  templates.forEach((t) => {
    const u = usage[t] || { selectionCount: 0, totalDwellTimeMs: 0, interactionCount: 0, explicitRating: 3, directModificationsCount: 0 };
    // Score calculation:
    // 10 pts per selection + 1 pt per 5s dwell + 5 pts per interaction + 15 pts per explicit rating + 20 pts per direct DNA mod
    const dwellSeconds = (u.totalDwellTimeMs || 0) / 1000;
    const score = 
      (u.selectionCount * 10) + 
      (dwellSeconds / 5) + 
      (u.interactionCount * 5) + 
      ((u.explicitRating || 3) * 15) + 
      (u.directModificationsCount * 20);

    rawScores[t] = Math.max(1, score);
    totalPoints += rawScores[t];
    totalInteractions += u.interactionCount + u.selectionCount;
  });

  const weights: Record<ExplorerTemplateId, number> = {
    grid: parseFloat((rawScores.grid / totalPoints).toFixed(2)),
    list: parseFloat((rawScores.list / totalPoints).toFixed(2)),
    spatial: parseFloat((rawScores.spatial / totalPoints).toFixed(2)),
    tree: parseFloat((rawScores.tree / totalPoints).toFixed(2))
  };

  // Find top template
  let bestTemplate: ExplorerTemplateId = 'grid';
  let bestWeight = -1;
  templates.forEach((t) => {
    if (weights[t] > bestWeight) {
      bestWeight = weights[t];
      bestTemplate = t;
    }
  });

  // Extract common traits from heavily weighted templates
  const dominantDNA = dnas[bestTemplate];
  const convergenceScore = Math.min(99, Math.round(50 + (totalInteractions * 1.5) + (bestWeight * 50)));

  return {
    preferredDensity: dominantDNA.density,
    preferredSpatialPhysics: weights.spatial > 0.3 || dominantDNA.spatialPhysics,
    preferredAudioFeedback: dominantDNA.audioFeedbackLevel,
    preferredTheme: dominantDNA.visualTheme,
    preferredDisclosureDepth: dominantDNA.disclosureDefault,
    learningConvergenceScore: convergenceScore,
    totalInteractionsLogged: totalInteractions,
    lastUpdated: new Date().toISOString(),
    recommendedTemplate: bestTemplate,
    weights
  };
}

/**
 * Evolve a template's DNA by aligning it with learned user preferences
 */
export function evolveTemplateDNATowardsPreferences(
  dna: TemplateDesignDNA,
  profile: TemplatePreferenceProfile
): TemplateDesignDNA {
  const nextGen = dna.generation + 1;
  
  return {
    ...dna,
    generation: nextGen,
    density: profile.preferredDensity,
    spatialPhysics: dna.templateId === 'spatial' ? true : profile.preferredSpatialPhysics,
    audioFeedbackLevel: profile.preferredAudioFeedback,
    visualTheme: profile.preferredTheme,
    disclosureDefault: Math.min(5, Math.max(1, profile.preferredDisclosureDepth)) as any,
    particleDensity: profile.preferredDensity === 'spacious' ? Math.min(90, dna.particleDensity + 10) : Math.max(10, dna.particleDensity - 5),
    holographicBlur: true,
    telemetryBadges: true,
    lastMutatedAt: new Date().toISOString(),
    evolutionaryNotes: `Generation ${nextGen}: Angepasst an Benutzerpräferenzen (${profile.learningConvergenceScore}% Konvergenz, Fokus: ${profile.preferredDensity} Dichte & ${profile.preferredAudioFeedback} Audio).`
  };
}

export const INITIAL_PROTOTYPES: PrototypeArchetype[] = [
  {
    id: 'proto_a_spatial_orbit',
    generation: 0,
    name: 'Cognitive Spatial Orbit',
    codename: 'ORBIT-ALPHA',
    subtitle: 'Räumlicher Arbeitsraum & Orbitale Zentrierung',
    tagline: 'Menschliche Absicht im Gravitationszentrum — Kontext & Hypothesen rotieren als dynamische Satelliten.',
    concept: 'Basiert auf räumlicher Ergonomie: Das aktuelle Denkziel bildet den Fixpunkt. Assoziierte Gedanken, epistemische Beweise und Agenten ordnen sich nach Relevanz im Orbit an.',
    advantages: [
      'Minimale kognitive Überlastung bei langen Denk-Sessions',
      'Intuitive Raumorientierung (Entfernung = Relevanz)',
      'Sofort sichtbare Hypothesen-Satelliten'
    ],
    tradeOffs: [
      'Geringere lineare Zeitachsen-Sichtbarkeit',
      'Benötigt ausreichend Anzeigefläche'
    ],
    metrics: {
      cognitiveClarity: 92,
      intuitiveness: 94,
      userControl: 88,
      informationDensity: 76,
      explainability: 85,
      novelty: 96
    },
    dna: {
      interactionModel: 'spatial_orbit',
      disclosureDefault: 2,
      spatialHierarchy: 'central_orbit',
      humanAutonomy: 'copilot_proactive',
      visualRhythm: 'spatial_zen',
      audioFeedbackDensity: 'rich_harmonic',
      showPredictiveAffordances: true,
      showMetaCognitiveReflector: true,
      particleDensity: 60,
      accentContrast: 'neon_high'
    },
    isActive: true,
    parentIds: [],
    badge: 'Standard-Gen 0'
  },
  {
    id: 'proto_b_cognitive_flow',
    generation: 0,
    name: 'Cognitive Flow Stream',
    codename: 'FLOW-STREAM',
    subtitle: 'Kausaler Denkfluss & Progressive Kette',
    tagline: 'Ein synchroner kognitiver Fluss vom ersten sensorischen Impuls bis zur finalen Handlung.',
    concept: 'Strukturiert den Denkprozess als durchgehenden kausalen Fluss: Perceive → Understand → Connect → Hypothesize → Act. Jeder Schritt bietet interaktive Verzweigungen.',
    advantages: [
      'Höchste Nachvollziehbarkeit („Ich sehe genau, warum Schritt 3 folgt“)',
      'Hervorragend geeignet für methodische Code- und Systemanalysen',
      'Exzellente zeitliche Einordnung aller Gedankenschritte'
    ],
    tradeOffs: [
      'Weniger intuitive räumliche Quervernetzung',
      'Erfordert Scrollen bei sehr langen Denkwegen'
    ],
    metrics: {
      cognitiveClarity: 95,
      intuitiveness: 89,
      userControl: 91,
      informationDensity: 88,
      explainability: 97,
      novelty: 84
    },
    dna: {
      interactionModel: 'cognitive_flow',
      disclosureDefault: 3,
      spatialHierarchy: 'split_inspector',
      humanAutonomy: 'strict_supervisory',
      visualRhythm: 'cyber_precision',
      audioFeedbackDensity: 'subtle',
      showPredictiveAffordances: true,
      showMetaCognitiveReflector: true,
      particleDensity: 30,
      accentContrast: 'neon_high'
    },
    isActive: false,
    parentIds: [],
    badge: 'Kausal-Fokus'
  },
  {
    id: 'proto_c_synaptic_mesh',
    generation: 0,
    name: 'Synaptic Mind Mesh',
    codename: 'SYNAPSE-GRAPH',
    subtitle: 'Dialektischer Kraftfeld-Graph & Semantisches Netz',
    tagline: 'Ein lebendiges synaptisches Beziehungsnetzwerk mit dialektischer Kollisionserkennung.',
    concept: 'Gedanken, Thesen und Beweise interagieren als physikalische Masseknoten. Gestrichelte Dialektik-Kanten visualisieren logische Spannungsfelder und Widersprüche.',
    advantages: [
      'Maximale Sichtbarkeit komplexer Systemzusammenhänge',
      'Sofortiges Aufdecken von Widersprüchen und Zirkelschlüssen',
      'Faszinierende explorative Tiefe'
    ],
    tradeOffs: [
      'Höhere initiale visuelle Dichte',
      'Erfordert gelegentliches Filtern'
    ],
    metrics: {
      cognitiveClarity: 86,
      intuitiveness: 82,
      userControl: 93,
      informationDensity: 96,
      explainability: 90,
      novelty: 98
    },
    dna: {
      interactionModel: 'synaptic_mesh',
      disclosureDefault: 4,
      spatialHierarchy: 'full_horizon',
      humanAutonomy: 'continuous_dialectic',
      visualRhythm: 'matrix_fast',
      audioFeedbackDensity: 'rich_harmonic',
      showPredictiveAffordances: true,
      showMetaCognitiveReflector: true,
      particleDensity: 85,
      accentContrast: 'neon_high'
    },
    isActive: false,
    parentIds: [],
    badge: 'Dialektik-Netz'
  },
  {
    id: 'proto_d_hybrid_horizon',
    generation: 1,
    name: 'Unified Horizon Matrix',
    codename: 'HORIZON-GEN1',
    subtitle: 'Synthese aus Orbitalem Arbeitsraum & Dialektischem Mesh',
    tagline: 'Evolvierter Hybrid: Zentrierter Fokus mit adaptiv einblendbarem Kausalitäts- und Kognitionsnetz.',
    concept: 'Kombiniert die Ruhe des Orbit-Modells mit der analytischen Durchschlagskraft des Synaptic Mesh. Die Oberfläche passt ihre Dichte dynamisch an die kognitive Belastung an.',
    advantages: [
      'Optimale Balance aus visueller Ruhe und Tiefenanalytik',
      'Automatische Umschaltung bei dialektischen Zielkonflikten',
      'Integrierte Meta-Kognitions-Reflektoren'
    ],
    tradeOffs: [
      'Höhere Architekturkomplexität im Rendering'
    ],
    metrics: {
      cognitiveClarity: 96,
      intuitiveness: 93,
      userControl: 95,
      informationDensity: 90,
      explainability: 94,
      novelty: 97
    },
    dna: {
      interactionModel: 'horizon_matrix',
      disclosureDefault: 2,
      spatialHierarchy: 'bento_neural',
      humanAutonomy: 'copilot_proactive',
      visualRhythm: 'cyber_precision',
      audioFeedbackDensity: 'rich_harmonic',
      showPredictiveAffordances: true,
      showMetaCognitiveReflector: true,
      particleDensity: 50,
      accentContrast: 'neon_high'
    },
    isActive: false,
    parentIds: ['proto_a_spatial_orbit', 'proto_c_synaptic_mesh'],
    isEvolvedGeneration: true,
    evolutionSummary: 'Gezüchtet aus Orbit-Alpha + Synapse-Graph zur Eliminierung visueller Überfrachtung.',
    badge: 'Gen 1 Hybrid'
  }
];

interface DesignEvolutionStore {
  prototypes: PrototypeArchetype[];
  activePrototypeId: string;
  evolutionHistory: DesignEvolutionHistoryEntry[];
  currentGeneration: number;
  userSignals: UserPreferenceSignal[];
  
  // Selection & Activation
  activatePrototype: (prototypeId: string) => void;
  
  // Evolution Operations
  breedHybrid: (parentAId: string, parentBId: string, customName?: string) => PrototypeArchetype;
  mutatePrototype: (prototypeId: string, mutationGoal: string) => PrototypeArchetype;
  revertToHistory: (historyEntryId: string) => void;
  
  // DNA adjustments
  updateDNA: (prototypeId: string, partialDNA: Partial<DesignDNA>) => void;
}

export const useDesignEvolution = create<DesignEvolutionStore>((set, get) => ({
  prototypes: INITIAL_PROTOTYPES,
  activePrototypeId: INITIAL_PROTOTYPES[0].id,
  currentGeneration: 1,
  evolutionHistory: [
    {
      id: 'hist_init',
      generation: 0,
      timestamp: '17:00:00',
      action: 'spawn',
      selectedPrototypeId: 'proto_a_spatial_orbit',
      prototypeName: 'Cognitive Spatial Orbit',
      rationale: 'Initiales Grunduniversum mit 3 distinkten Kognitions-Paradigmen generiert.',
      resultingDNA: INITIAL_PROTOTYPES[0].dna
    },
    {
      id: 'hist_hybrid_gen1',
      generation: 1,
      timestamp: '17:15:00',
      action: 'hybridize',
      selectedPrototypeId: 'proto_d_hybrid_horizon',
      prototypeName: 'Unified Horizon Matrix',
      rationale: 'Synthese aus räumlichem Fokus (A) und semantischem Beziehungsnetz (C).',
      resultingDNA: INITIAL_PROTOTYPES[3].dna
    }
  ],
  userSignals: [
    {
      spatialClarity: 'high',
      interactionComplexity: 'low',
      visualDensity: 'balanced',
      directManipulationPreference: 'high',
      dialecticEngagement: 'high',
      extractedAt: '17:20:00'
    }
  ],

  activatePrototype: (prototypeId: string) => {
    soundFx.playThemeSwitch();
    set((state) => {
      const selected = state.prototypes.find((p) => p.id === prototypeId);
      if (!selected) return state;

      const newHistoryEntry: DesignEvolutionHistoryEntry = {
        id: `hist_${Date.now()}`,
        generation: selected.generation,
        timestamp: new Date().toLocaleTimeString(),
        action: 'select',
        selectedPrototypeId: selected.id,
        prototypeName: selected.name,
        rationale: `Benutzer hat "${selected.name}" als aktive kognitive Arbeitsumgebung aktiviert.`,
        resultingDNA: selected.dna
      };

      return {
        activePrototypeId: prototypeId,
        prototypes: state.prototypes.map((p) => ({
          ...p,
          isActive: p.id === prototypeId
        })),
        evolutionHistory: [...state.evolutionHistory, newHistoryEntry]
      };
    });
  },

  breedHybrid: (parentAId: string, parentBId: string, customName?: string) => {
    soundFx.playSystemBootBeep();
    const state = get();
    const parentA = state.prototypes.find((p) => p.id === parentAId) || state.prototypes[0];
    const parentB = state.prototypes.find((p) => p.id === parentBId) || state.prototypes[1];
    
    const nextGen = Math.max(parentA.generation, parentB.generation) + 1;
    const hybridId = `proto_hybrid_gen${nextGen}_${Date.now()}`;
    const name = customName || `${parentA.name.split(' ')[0]} × ${parentB.name.split(' ')[0]} Synthese`;

    const mergedMetrics: PrototypeMetrics = {
      cognitiveClarity: Math.min(99, Math.round((parentA.metrics.cognitiveClarity + parentB.metrics.cognitiveClarity) / 2 + 2)),
      intuitiveness: Math.min(99, Math.round((parentA.metrics.intuitiveness + parentB.metrics.intuitiveness) / 2 + 1)),
      userControl: Math.min(99, Math.round((parentA.metrics.userControl + parentB.metrics.userControl) / 2 + 3)),
      informationDensity: Math.min(99, Math.round((parentA.metrics.informationDensity + parentB.metrics.informationDensity) / 2)),
      explainability: Math.min(99, Math.round((parentA.metrics.explainability + parentB.metrics.explainability) / 2 + 2)),
      novelty: Math.min(99, Math.round((parentA.metrics.novelty + parentB.metrics.novelty) / 2 + 4))
    };

    const mergedDNA: DesignDNA = {
      interactionModel: parentA.dna.interactionModel,
      disclosureDefault: Math.min(parentA.dna.disclosureDefault, parentB.dna.disclosureDefault) as any,
      spatialHierarchy: parentB.dna.spatialHierarchy,
      humanAutonomy: 'continuous_dialectic',
      visualRhythm: 'cyber_precision',
      audioFeedbackDensity: 'rich_harmonic',
      showPredictiveAffordances: true,
      showMetaCognitiveReflector: true,
      particleDensity: Math.round((parentA.dna.particleDensity + parentB.dna.particleDensity) / 2),
      accentContrast: 'neon_high'
    };

    const newHybrid: PrototypeArchetype = {
      id: hybridId,
      generation: nextGen,
      name,
      codename: `SYNTH-G${nextGen}`,
      subtitle: `Evolutionäre Rekombination aus Gen ${parentA.generation} & Gen ${parentB.generation}`,
      tagline: `Vereint die Stärken von ${parentA.codename} mit der kognitiven Tiefe von ${parentB.codename}.`,
      concept: `Neurowissenschaftlich optimierte Rekombination: Vererbt Interaktionsmodell von ${parentA.name} und räumliche Hierarchie von ${parentB.name}.`,
      advantages: [
        `Synergie-Effekt: Höhere Kognitionsklarheit (${mergedMetrics.cognitiveClarity}%)`,
        `Kombiniert ${parentA.advantages[0]} mit ${parentB.advantages[0]}`,
        `Selbstheilende Kausalverknüpfung`
      ],
      tradeOffs: [
        'Erhöhter initialer Konfigurationsspielraum'
      ],
      metrics: mergedMetrics,
      dna: mergedDNA,
      isActive: true,
      parentIds: [parentA.id, parentB.id],
      isEvolvedGeneration: true,
      evolutionSummary: `Erfolgreich rekombiniert aus Eltern-DNA [${parentA.codename}] und [${parentB.codename}].`,
      badge: `Gen ${nextGen} Nachfahre`
    };

    const historyEntry: DesignEvolutionHistoryEntry = {
      id: `hist_${Date.now()}`,
      generation: nextGen,
      timestamp: new Date().toLocaleTimeString(),
      action: 'hybridize',
      selectedPrototypeId: newHybrid.id,
      prototypeName: newHybrid.name,
      rationale: `Evolutionäre Kreuzung von [${parentA.name}] und [${parentB.name}].`,
      resultingDNA: mergedDNA
    };

    set((s) => ({
      currentGeneration: nextGen,
      activePrototypeId: newHybrid.id,
      prototypes: [
        ...s.prototypes.map((p) => ({ ...p, isActive: false })),
        newHybrid
      ],
      evolutionHistory: [...s.evolutionHistory, historyEntry]
    }));

    return newHybrid;
  },

  mutatePrototype: (prototypeId: string, mutationGoal: string) => {
    soundFx.playPromptSubmit();
    const state = get();
    const base = state.prototypes.find((p) => p.id === prototypeId) || state.prototypes[0];
    const nextGen = base.generation + 1;
    const mutatedId = `proto_mut_${nextGen}_${Date.now()}`;

    const mutatedDNA: DesignDNA = {
      ...base.dna,
      particleDensity: Math.min(100, base.dna.particleDensity + 15),
      showMetaCognitiveReflector: true,
      showPredictiveAffordances: true
    };

    const mutated: PrototypeArchetype = {
      id: mutatedId,
      generation: nextGen,
      name: `${base.name} (Mutiert: ${mutationGoal})`,
      codename: `MUT-${base.codename}-G${nextGen}`,
      subtitle: `Gezielte Mutation: ${mutationGoal}`,
      tagline: `Spezifisch optimiert für ${mutationGoal}.`,
      concept: `Mutation der Design-DNA entlang des Optimierungsvektors: ${mutationGoal}.`,
      advantages: [
        `Gesteigerte Leistung im Bereich: ${mutationGoal}`,
        ...base.advantages.slice(0, 2)
      ],
      tradeOffs: base.tradeOffs,
      metrics: {
        ...base.metrics,
        novelty: Math.min(99, base.metrics.novelty + 3),
        userControl: Math.min(99, base.metrics.userControl + 2)
      },
      dna: mutatedDNA,
      isActive: true,
      parentIds: [base.id],
      isEvolvedGeneration: true,
      evolutionSummary: `Mutation basierend auf Benutzerfokus "${mutationGoal}".`,
      badge: `Gen ${nextGen} Mutation`
    };

    set((s) => ({
      currentGeneration: nextGen,
      activePrototypeId: mutated.id,
      prototypes: [
        ...s.prototypes.map((p) => ({ ...p, isActive: false })),
        mutated
      ],
      evolutionHistory: [
        ...s.evolutionHistory,
        {
          id: `hist_${Date.now()}`,
          generation: nextGen,
          timestamp: new Date().toLocaleTimeString(),
          action: 'mutate',
          selectedPrototypeId: mutated.id,
          prototypeName: mutated.name,
          rationale: `Gezielte Mutation für "${mutationGoal}".`,
          resultingDNA: mutatedDNA
        }
      ]
    }));

    return mutated;
  },

  revertToHistory: (historyEntryId: string) => {
    soundFx.playTimeTravel();
    const state = get();
    const entry = state.evolutionHistory.find((h) => h.id === historyEntryId);
    if (!entry) return;

    set((s) => ({
      activePrototypeId: entry.selectedPrototypeId,
      prototypes: s.prototypes.map((p) => ({
        ...p,
        isActive: p.id === entry.selectedPrototypeId
      }))
    }));
  },

  updateDNA: (prototypeId: string, partialDNA: Partial<DesignDNA>) => {
    soundFx.playClick();
    set((state) => ({
      prototypes: state.prototypes.map((p) =>
        p.id === prototypeId
          ? { ...p, dna: { ...p.dna, ...partialDNA } }
          : p
      )
    }));
  }
}));
