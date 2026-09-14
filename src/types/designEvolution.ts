/**
 * Design Evolution Engine - Type Definitions
 * Declarative Design DNA, Prototype Generations, Hybrid Combiners, and Evolution History.
 */

export interface DesignDNA {
  interactionModel: 'spatial_orbit' | 'cognitive_flow' | 'synaptic_mesh' | 'horizon_matrix' | 'command_orchestrator';
  disclosureDefault: 1 | 2 | 3 | 4 | 5;
  spatialHierarchy: 'central_orbit' | 'bento_neural' | 'split_inspector' | 'full_horizon';
  humanAutonomy: 'strict_supervisory' | 'copilot_proactive' | 'continuous_dialectic';
  visualRhythm: 'cyber_precision' | 'spatial_zen' | 'matrix_fast';
  audioFeedbackDensity: 'subtle' | 'rich_harmonic' | 'minimal';
  showPredictiveAffordances: boolean;
  showMetaCognitiveReflector: boolean;
  particleDensity: number; // 0 to 100
  accentContrast: 'neon_high' | 'subtle_matte' | 'monochrome_glass';
}

export interface PrototypeMetrics {
  cognitiveClarity: number; // 0 - 100
  intuitiveness: number;     // 0 - 100
  userControl: number;       // 0 - 100
  informationDensity: number;// 0 - 100
  explainability: number;    // 0 - 100
  novelty: number;           // 0 - 100
}

export interface PrototypeArchetype {
  id: string;
  generation: number;
  name: string;
  codename: string;
  subtitle: string;
  concept: string;
  tagline: string;
  advantages: string[];
  tradeOffs: string[];
  metrics: PrototypeMetrics;
  dna: DesignDNA;
  isActive: boolean;
  parentIds: string[];
  isEvolvedGeneration?: boolean;
  evolutionSummary?: string;
  badge?: string;
}

export interface DesignEvolutionHistoryEntry {
  id: string;
  generation: number;
  timestamp: string;
  action: 'spawn' | 'select' | 'hybridize' | 'mutate' | 'revert';
  selectedPrototypeId: string;
  prototypeName: string;
  rationale: string;
  resultingDNA: DesignDNA;
}

export interface UserPreferenceSignal {
  spatialClarity: 'high' | 'medium' | 'low';
  interactionComplexity: 'high' | 'medium' | 'low';
  visualDensity: 'dense' | 'balanced' | 'airy';
  directManipulationPreference: 'high' | 'medium' | 'low';
  dialecticEngagement: 'high' | 'medium' | 'low';
  extractedAt: string;
}

/**
 * Cognitive Explorer UI Template Specific Design DNA
 */
export type ExplorerTemplateId = 'grid' | 'list' | 'spatial' | 'tree';

export interface TemplateDesignDNA {
  templateId: ExplorerTemplateId;
  generation: number;
  name: string;
  density: 'compact' | 'balanced' | 'spacious';
  accentContrast: 'neon_high' | 'subtle_matte' | 'monochrome_glass';
  visualTheme: 'cyber_emerald' | 'akira_matrix' | 'zen_minimal' | 'tokyo_neon';
  particleDensity: number; // 0 - 100
  hoverInspectDepth: 1 | 2 | 3;
  spatialPhysics: boolean;
  audioFeedbackLevel: 'silent' | 'subtle' | 'rich';
  holographicBlur: boolean;
  telemetryBadges: boolean;
  disclosureDefault: 1 | 2 | 3 | 4 | 5;
  cardCornerRadius: 'sharp' | 'standard' | 'pill';
  autoClustering: boolean;
  sortPreference: 'date' | 'name' | 'size' | 'relevance';
  showWaveformAnimations: boolean;
  lastMutatedAt?: string;
  evolutionaryNotes?: string;
}

export interface TemplateUsageMetrics {
  templateId: ExplorerTemplateId;
  selectionCount: number;
  totalDwellTimeMs: number;
  interactionCount: number; // clicks, filters, previews, rag transfers
  lastSelectedAt?: string;
  explicitRating?: number; // 1 to 5
  directModificationsCount: number;
}

export interface TemplatePreferenceProfile {
  preferredDensity: 'compact' | 'balanced' | 'spacious';
  preferredSpatialPhysics: boolean;
  preferredAudioFeedback: 'silent' | 'subtle' | 'rich';
  preferredTheme: 'cyber_emerald' | 'akira_matrix' | 'zen_minimal' | 'tokyo_neon';
  preferredDisclosureDepth: number;
  learningConvergenceScore: number; // 0 - 100%
  totalInteractionsLogged: number;
  lastUpdated: string;
  recommendedTemplate: ExplorerTemplateId;
  weights: Record<ExplorerTemplateId, number>; // 0.0 to 1.0 affinity score
}
