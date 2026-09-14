/**
 * Cognitive OS - Type Definitions
 * Externalizing perception, context, hypotheses, uncertainty, reasoning, and human-in-the-loop steering.
 */

export type CognitivePhase = 
  | 'PERCEIVE'
  | 'UNDERSTAND'
  | 'CONNECT'
  | 'HYPOTHESIZE'
  | 'EVALUATE'
  | 'PLAN'
  | 'ACT'
  | 'OBSERVE'
  | 'UPDATE';

export type CognitiveDisclosureLevel = 1 | 2 | 3 | 4 | 5;

export type HypothesisArchetype = 'conservative' | 'probabilistic' | 'novel' | 'dialectic_antithesis';

export interface HypothesisBranch {
  id: string;
  label: string;
  archetype: HypothesisArchetype;
  probability: number; // 0.0 to 1.0
  premise: string;
  rationale: string;
  evidenceIds: string[];
  contradictionRisk: number; // 0.0 to 1.0
  implications: string[];
  suggestedAction: string;
  isSelected: boolean;
  userOverridden?: boolean;
}

export type ThoughtNodeType = 
  | 'intent' 
  | 'perception' 
  | 'memory' 
  | 'hypothesis' 
  | 'evidence' 
  | 'decision' 
  | 'action' 
  | 'surprise'
  | 'dialectic';

export interface ThoughtNode {
  id: string;
  title: string;
  content: string;
  type: ThoughtNodeType;
  phase: CognitivePhase;
  confidence: number;
  weight: number;
  timestamp: string;
  tags: string[];
  sourceAgent?: string;
  evidenceSources?: string[];
  associatedNodeIds?: string[];
  isActive?: boolean;
  isDiscarded?: boolean;
  discardReason?: string;
  x?: number;
  y?: number;
}

export interface ThoughtLink {
  id: string;
  source: string;
  target: string;
  relation: string;
  strength: number;
  isDialectic?: boolean;
  isActive?: boolean;
}

export type AgentRole = 
  | 'Epistemologist' 
  | 'Dialectic Challenger' 
  | 'Empirical Verifier' 
  | 'Synthesizer' 
  | 'Architect' 
  | 'User Alignment Sentinel';

export interface ActiveAgent {
  id: string;
  name: string;
  role: AgentRole;
  status: 'observing' | 'analyzing' | 'debating' | 'executing' | 'idle';
  currentTask: string;
  confidence: number;
  model: string;
  latencyMs: number;
  avatarIcon: string;
  color: string;
}

export interface ReasoningCheckpoint {
  id: string;
  stepNumber: number;
  timestamp: string;
  phase: CognitivePhase;
  focusIntent: string;
  selectedHypothesisId: string;
  summaryOfThought: string;
  activeNodesCount: number;
  confidenceScore: number;
  humanInterventionsCount: number;
}

export interface CognitiveAffordance {
  id: string;
  title: string;
  description: string;
  predictedBenefit?: string;
  category: 'deepen_investigation' | 'challenge_assumption' | 'execute_action' | 'branch_scenario' | 'synthesize';
  confidence: number;
  actionPayload: string;
  iconName: string;
}

export interface MetaCognitiveReflection {
  id: string;
  type: 'bias_warning' | 'assumption_conflict' | 'unexamined_alternative' | 'serendipitous_discovery' | 'efficiency_gain';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAtPhase: CognitivePhase;
  suggestedResolution: string;
  affectedNodeIds: string[];
  isResolved?: boolean;
}

export interface CognitiveSessionState {
  currentIntent: string;
  activePhase: CognitivePhase;
  disclosureLevel: CognitiveDisclosureLevel;
  confidence: number;
  uncertaintyBand: [number, number]; // e.g. [0.82, 0.94]
  nodes: ThoughtNode[];
  links: ThoughtLink[];
  hypotheses: HypothesisBranch[];
  selectedHypothesisId: string | null;
  agents: ActiveAgent[];
  checkpoints: ReasoningCheckpoint[];
  currentCheckpointIndex: number;
  affordances: CognitiveAffordance[];
  reflections: MetaCognitiveReflection[];
  isStreaming: boolean;
  streamedThoughtTokens: string[];
  activeViewArchetype: 'spatial_orbit' | 'cognitive_flow' | 'synaptic_mesh' | 'horizon_matrix';
}
