/**
 * Cognitive Engine - Core Mind Simulator & Live Thought Externalization Engine
 */

import { create } from 'zustand';
import { 
  CognitiveSessionState, 
  CognitivePhase, 
  CognitiveDisclosureLevel, 
  ThoughtNode, 
  ThoughtLink, 
  HypothesisBranch, 
  ActiveAgent, 
  ReasoningCheckpoint, 
  CognitiveAffordance, 
  MetaCognitiveReflection 
} from '../types/cognitive';
import { soundFx } from './soundFx';

export interface CognitiveScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  initialIntent: string;
  phases: Array<{
    phase: CognitivePhase;
    thoughtTokens: string[];
    confidence: number;
    uncertainty: [number, number];
    activeAgents: string[];
    nodesToAdd: ThoughtNode[];
    linksToAdd: ThoughtLink[];
    hypotheses: HypothesisBranch[];
    reflections: MetaCognitiveReflection[];
    affordances: CognitiveAffordance[];
  }>;
}

export const PRESET_SCENARIOS: CognitiveScenario[] = [
  {
    id: 'distributed-cognitive-mesh',
    title: 'Autonomer Kognitiver P2P-Mesh & Konsens-Architektur',
    category: 'Verteilte Systeme',
    description: 'Analyse und Synthese eines fehlertoleranten Kognitionsnetzes ohne zentralen Single-Point-of-Failure.',
    initialIntent: 'Wie konstruieren wir ein dezentrales Multi-Agenten-System mit kognitiver Konsensfindung unter byzantinischen Netzwerkbedingungen?',
    phases: [
      {
        phase: 'PERCEIVE',
        thoughtTokens: [
          'Erfasse Randbedingungen: 128 Knoten, Latenzschwankungen bis 240ms, asynchrone Zeitstempel.',
          'Identifiziere Hauptvektoren: Byzantinische Fehlertoleranz (BFT), epistemische Vektor-Synchronisation, Ressourcen-Gleichgewicht.'
        ],
        confidence: 0.74,
        uncertainty: [0.65, 0.82],
        activeAgents: ['Epistemologist', 'Empirical Verifier'],
        nodesToAdd: [
          {
            id: 'n_intent_mesh',
            title: 'Forschungsziel: P2P Kognitions-Mesh',
            content: 'Entwurf eines dezentralen Koordinationsmodells für autonome Kognitionseinheiten.',
            type: 'intent',
            phase: 'PERCEIVE',
            confidence: 0.98,
            weight: 1.0,
            timestamp: '00:01.200',
            tags: ['Architektur', 'P2P', 'Ziel'],
            x: 400,
            y: 100
          },
          {
            id: 'n_percept_byzantine',
            title: 'Signal: 15% instabile Knoten identifiziert',
            content: 'Telemetrie-Logs zeigen intermittierende Paketverluste und abweichende Epistemik.',
            type: 'perception',
            phase: 'PERCEIVE',
            confidence: 0.89,
            weight: 0.85,
            timestamp: '00:02.400',
            tags: ['Telemetrie', 'Sensorik'],
            evidenceSources: ['Peer_Probe_Daemon_v4', 'Network_Latency_Matrix'],
            x: 250,
            y: 180
          }
        ],
        linksToAdd: [
          {
            id: 'l_1',
            source: 'n_intent_mesh',
            target: 'n_percept_byzantine',
            relation: 'erfasst Umgebungsbedingung',
            strength: 0.8
          }
        ],
        hypotheses: [],
        reflections: [],
        affordances: [
          {
            id: 'aff_1',
            title: 'Epistemische Vektor-Divergenz prüfen',
            description: 'Knoten-Gedächtnisse auf logische Widersprüche untersuchen.',
            category: 'deepen_investigation',
            confidence: 0.91,
            actionPayload: 'run_epistemic_audit',
            iconName: 'Search'
          }
        ]
      },
      {
        phase: 'UNDERSTAND',
        thoughtTokens: [
          'Dekodiere semantische Bedeutungsrelation: Klassischer Raft-Konsens versagt bei semantischen Ambiguitäten.',
          'Konzeptbildung: Benötigt semantischen Kausalitäts-Merkle-DAG statt rein sequentieller Log-Replikation.'
        ],
        confidence: 0.81,
        uncertainty: [0.75, 0.88],
        activeAgents: ['Epistemologist', 'Architect'],
        nodesToAdd: [
          {
            id: 'n_under_dag',
            title: 'Konzept: Kausaler Merkle-DAG',
            content: 'Strukturierte Gedankenverkettung erlaubt nebenläufige Hypothesenbildung ohne Blockade.',
            type: 'memory',
            phase: 'UNDERSTAND',
            confidence: 0.92,
            weight: 0.9,
            timestamp: '00:04.100',
            tags: ['Datenstruktur', 'DAG', 'Semantik'],
            x: 550,
            y: 200
          }
        ],
        linksToAdd: [
          {
            id: 'l_2',
            source: 'n_intent_mesh',
            target: 'n_under_dag',
            relation: 'formuliert Grundstruktur',
            strength: 0.9
          }
        ],
        hypotheses: [],
        reflections: [
          {
            id: 'ref_1',
            type: 'assumption_conflict',
            title: 'Annahme: Vollständige Netzwerkkonnektivität',
            description: 'Die Standardhypothese ging von vollständiger Mesh-Sichtbarkeit aus; reale Netze weisen Partitionen auf.',
            severity: 'medium',
            detectedAtPhase: 'UNDERSTAND',
            suggestedResolution: 'CRDT-basierte Konfliktauflösung für Offline-Cluster vorsehen.',
            affectedNodeIds: ['n_intent_mesh', 'n_percept_byzantine']
          }
        ],
        affordances: [
          {
            id: 'aff_2',
            title: 'CRDT-Konfliktmatrix visualisieren',
            description: 'Konfliktraten bei Netzwerk-Partitionen berechnen.',
            category: 'branch_scenario',
            confidence: 0.88,
            actionPayload: 'simulate_partitions',
            iconName: 'GitBranch'
          }
        ]
      },
      {
        phase: 'HYPOTHESIZE',
        thoughtTokens: [
          'Generiere 3 konkurrierende Architektur-Hypothesen für den kognitiven Konsens:',
          'A: Probabilistischer Gossiping-Gedankenabgleich mit lokaler Vektor-Konvergenz (Hoher Durchsatz).',
          'B: Hierarchischer Schiedsrichter-Cluster mit kryptografischer Nachweiskette (Maximale Sicherheit).',
          'C: Emergent-Dialektischer Schwarm-Konsens mit adaptiver Gewichtung (Maximale Resilienz).'
        ],
        confidence: 0.87,
        uncertainty: [0.82, 0.93],
        activeAgents: ['Epistemologist', 'Dialectic Challenger', 'Architect'],
        nodesToAdd: [
          {
            id: 'n_hypo_a',
            title: 'Hypothese A: Probabilistisches Gossiping',
            content: 'Schnelle Verbreitung, akzeptiert temporäre Inkonsistenzen (Eventually Consistent).',
            type: 'hypothesis',
            phase: 'HYPOTHESIZE',
            confidence: 0.78,
            weight: 0.75,
            timestamp: '00:07.500',
            tags: ['Hypothese', 'Probabilistisch'],
            x: 220,
            y: 340
          },
          {
            id: 'n_hypo_c',
            title: 'Hypothese C: Emergent-Dialektischer Schwarm',
            content: 'Gedanken widerstreiten in Miniclustern; nur empirisch gestützte Thesen diffundieren.',
            type: 'hypothesis',
            phase: 'HYPOTHESIZE',
            confidence: 0.94,
            weight: 0.95,
            timestamp: '00:08.100',
            tags: ['Hypothese', 'Dialektik', 'Favorit'],
            x: 420,
            y: 350
          }
        ],
        linksToAdd: [
          {
            id: 'l_3',
            source: 'n_under_dag',
            target: 'n_hypo_a',
            relation: 'differenziert',
            strength: 0.7
          },
          {
            id: 'l_4',
            source: 'n_under_dag',
            target: 'n_hypo_c',
            relation: 'synthetisiert',
            strength: 0.95,
            isDialectic: true
          }
        ],
        hypotheses: [
          {
            id: 'hypo_a',
            label: 'Hypothese A — Gossiping DAG (Konservativ/Schnell)',
            archetype: 'conservative',
            probability: 0.28,
            premise: 'Netzwerkknoten synchronisieren Vektoren über Epidemic-Routing.',
            rationale: 'Sehr geringe CPU-Last, aber anfällig für semantische Drift.',
            evidenceIds: ['n_percept_byzantine'],
            contradictionRisk: 0.42,
            implications: ['Latenz < 30ms', 'Geringe kognitive Tiefe'],
            suggestedAction: 'Gossip-Protokoll mit Zeitfenstern testen',
            isSelected: false
          },
          {
            id: 'hypo_c',
            label: 'Hypothese C — Dialektischer Schwarm-Konsens (Empfohlen)',
            archetype: 'dialectic_antithesis',
            probability: 0.65,
            premise: 'Gedankencluster validieren sich gegenseitig über formale Widerspruchs-Graphen.',
            rationale: 'Höchste Resilienz gegen byzantinische Halluzinationen und Ausfälle.',
            evidenceIds: ['n_percept_byzantine', 'n_under_dag'],
            contradictionRisk: 0.12,
            implications: ['Selbstheilender Kausalgraph', '100% nachvollziehbare Entscheidungskette'],
            suggestedAction: 'Dialektische Konsens-Engine aktivieren',
            isSelected: true
          },
          {
            id: 'hypo_b',
            label: 'Hypothese B — Kryptografischer Schiedsrichter (Starre Hierarchie)',
            archetype: 'probabilistic',
            probability: 0.07,
            premise: 'Ausgewählte Lead-Nodes signieren kognitive Zustände.',
            rationale: 'Erhöht Latenz und schafft Angriffsvektoren auf Lead-Knoten.',
            evidenceIds: [],
            contradictionRisk: 0.75,
            implications: ['Zentralisierungsrisiko', 'Hohe Blockadelatenz'],
            suggestedAction: 'Als Fallback-Option reservieren',
            isSelected: false
          }
        ],
        reflections: [
          {
            id: 'ref_2',
            type: 'serendipitous_discovery',
            title: 'Serendipität: CRDT-Gedächtnis verhindert Deadlocks',
            description: 'Die mathematische Struktur eines state-based CRDT löst simultane Gedankenüberlagerungen deterministisch auf.',
            severity: 'low',
            detectedAtPhase: 'HYPOTHESIZE',
            suggestedResolution: 'CRDT-Kern in die finale Synthese übernehmen.',
            affectedNodeIds: ['n_hypo_c']
          }
        ],
        affordances: [
          {
            id: 'aff_3',
            title: 'Hypothese C direkt auswählen & vertiefen',
            description: 'Dialektischen Schwarmkonsens als verbindliche Architektur etablieren.',
            category: 'execute_action',
            confidence: 0.95,
            actionPayload: 'commit_hypo_c',
            iconName: 'CheckCircle2'
          },
          {
            id: 'aff_4',
            title: 'Dialektischen Stresstest ausführen',
            description: 'Bösartigen Agenten simulieren, der Falschthesen einspeist.',
            category: 'challenge_assumption',
            confidence: 0.89,
            actionPayload: 'run_byzantine_attack_sim',
            iconName: 'ShieldAlert'
          }
        ]
      },
      {
        phase: 'PLAN',
        thoughtTokens: [
          'Entwerfe 4-Phasen-Implementierungsplan:',
          '1. CRDT-Kausal-DAG in Rust/TypeScript implementieren.',
          '2. Dialektischen Schiedsrichter-Algorithmus für Widerspruchsmatrix kalibrieren.',
          '3. Verteilte WebRTC-Peer-Verbindungen mit Noise-Verschlüsselung koppeln.',
          '4. Integrierte Echtzeit-Telemetrie auf Kognitionsebene 4 (Mechanik) visualisieren.'
        ],
        confidence: 0.92,
        uncertainty: [0.88, 0.96],
        activeAgents: ['Architect', 'Synthesizer', 'Empirical Verifier'],
        nodesToAdd: [
          {
            id: 'n_plan_blueprint',
            title: 'Aktionsplan: Resilientes Kognitionsnetz',
            content: 'Vollständiger Bauplan für den dezentralen Gedanken-DAG mit dialektischer Selbstheilung.',
            type: 'decision',
            phase: 'PLAN',
            confidence: 0.96,
            weight: 1.0,
            timestamp: '00:11.400',
            tags: ['Planung', 'Architektur', 'Entscheidung'],
            x: 480,
            y: 480
          }
        ],
        linksToAdd: [
          {
            id: 'l_5',
            source: 'n_hypo_c',
            target: 'n_plan_blueprint',
            relation: 'konkretisiert in',
            strength: 0.98
          }
        ],
        hypotheses: [],
        reflections: [],
        affordances: [
          {
            id: 'aff_5',
            title: 'Code-Generierung für DAG-Engine starten',
            description: 'Generiert TypeScript-Schnittstellen und Kausalitäts-Validierer.',
            category: 'execute_action',
            confidence: 0.97,
            actionPayload: 'generate_dag_code',
            iconName: 'Code2'
          }
        ]
      }
    ]
  },
  {
    id: 'deep-contradiction-radar',
    title: 'Strategische Widerspruchsanalyse & Bias-Elimination',
    category: 'Meta-Kognition',
    description: 'Aufdeckung versteckter zirkulärer Annahmen in komplexen Zielvorgaben.',
    initialIntent: 'Prüfe das System auf verdeckte Widersprüche zwischen maximalem Datenschutz und globaler semantischer Suche.',
    phases: [
      {
        phase: 'PERCEIVE',
        thoughtTokens: [
          'Scanne Zielsystem: Zero-Knowledge-Verschlüsselung gefordert bei gleichzeitiger semantischer Volltext-Clusterung.',
          'Identifiziere epistemische Spannung: Vektorisierung auf Server vs. Client-seitige Privatsphäre.'
        ],
        confidence: 0.85,
        uncertainty: [0.78, 0.91],
        activeAgents: ['Epistemologist', 'Dialectic Challenger'],
        nodesToAdd: [
          {
            id: 'n_target_privacy',
            title: 'Forderung: 100% Client-Side Privacy',
            content: 'Keine Klartext-Daten oder unverschlüsselte Embeddings dürfen den lokalen Container verlassen.',
            type: 'intent',
            phase: 'PERCEIVE',
            confidence: 0.99,
            weight: 1.0,
            timestamp: '00:01.000',
            tags: ['Security', 'Privacy'],
            x: 300,
            y: 120
          },
          {
            id: 'n_target_search',
            title: 'Forderung: Globale semantische Quervernetzung',
            content: 'Knoten sollen verwandte Gedanken anderer Peers finden können.',
            type: 'intent',
            phase: 'PERCEIVE',
            confidence: 0.96,
            weight: 0.9,
            timestamp: '00:02.100',
            tags: ['Suche', 'Vektor', 'Netzwerk'],
            x: 520,
            y: 120
          }
        ],
        linksToAdd: [
          {
            id: 'l_conflict_1',
            source: 'n_target_privacy',
            target: 'n_target_search',
            relation: 'erzeugt dialektische Spannung',
            strength: 0.95,
            isDialectic: true
          }
        ],
        hypotheses: [],
        reflections: [
          {
            id: 'ref_privacy_conflict',
            type: 'assumption_conflict',
            title: 'Kritischer Zielkonflikt: Zero-Knowledge vs. Global Search',
            description: 'Server kann semantische Distanz nicht berechnen, wenn Vektoren homomorph verschlüsselt oder lokal isoliert sind.',
            severity: 'high',
            detectedAtPhase: 'PERCEIVE',
            suggestedResolution: 'Homomorphe Vektor-Approximation oder lokales WebGPU-Embedding mit verschlüsseltem Bloom-Filter-Abgleich einsetzen.',
            affectedNodeIds: ['n_target_privacy', 'n_target_search']
          }
        ],
        affordances: [
          {
            id: 'aff_priv_1',
            title: 'Lokal-Inferenz mit Bloom-Filtern bewerten',
            description: 'Prüfen ob WebGPU-Modelle ausreichen, um Zero-Knowledge-Kriterien zu erfüllen.',
            category: 'deepen_investigation',
            confidence: 0.94,
            actionPayload: 'evaluate_webgpu_local',
            iconName: 'Cpu'
          }
        ]
      },
      {
        phase: 'HYPOTHESIZE',
        thoughtTokens: [
          'Formuliere Lösungsräume zur Auflösung des Privatsphären-Widerspruchs:',
          '1. Vollständig lokale WebGPU-Vektorisierung: Peers tauschen nur verschleierte LSH (Locality-Sensitive Hashing) Hashes aus.',
          '2. Differential Privacy Vektoren: Rauschen hinzufügen, das Clusterung erlaubt, aber Rekonstruktion verhindert.'
        ],
        confidence: 0.91,
        uncertainty: [0.86, 0.95],
        activeAgents: ['Dialectic Challenger', 'Architect', 'Synthesizer'],
        nodesToAdd: [
          {
            id: 'n_solution_lsh',
            title: 'Synthese: Privatsphäre-erhaltendes LSH-Matching',
            content: 'Peers finden Übereinstimmungen mit mathematischem Beweis ohne Offenlegung des Inhalts.',
            type: 'decision',
            phase: 'HYPOTHESIZE',
            confidence: 0.95,
            weight: 0.95,
            timestamp: '00:05.800',
            tags: ['Kryptografie', 'LSH', 'Lösung'],
            x: 410,
            y: 300
          }
        ],
        linksToAdd: [
          {
            id: 'l_priv_res',
            source: 'n_target_privacy',
            target: 'n_solution_lsh',
            relation: 'löst Widerspruch auf',
            strength: 0.95
          }
        ],
        hypotheses: [
          {
            id: 'hypo_lsh',
            label: 'Lösung A: Locality-Sensitive Hashing (LSH) mit Zero-Knowledge Token',
            archetype: 'novel',
            probability: 0.88,
            premise: 'Ähnliche Gedanken erzeugen identische Hash-Kollisionen ohne Offenlegung des Rohtextes.',
            rationale: 'Ermöglicht semantische Suche bei voller Wahrung der Zero-Knowledge-Garantie.',
            evidenceIds: ['n_target_privacy', 'n_target_search'],
            contradictionRisk: 0.05,
            implications: ['100% DSGVO-konform', 'Mathematisch beweisbare Privatsphäre'],
            suggestedAction: 'LSH-Prototyp in WebAssembly aktivieren',
            isSelected: true
          }
        ],
        reflections: [],
        affordances: [
          {
            id: 'aff_priv_apply',
            title: 'LSH-Zero-Knowledge Engine anwenden',
            description: 'Architekturplan mit ZK-Hashes festschreiben.',
            category: 'execute_action',
            confidence: 0.98,
            actionPayload: 'apply_zk_lsh',
            iconName: 'ShieldCheck'
          }
        ]
      }
    ]
  }
];

const INITIAL_AGENTS: ActiveAgent[] = [
  {
    id: 'agent_epist',
    name: 'Epistemologe',
    role: 'Epistemologist',
    status: 'analyzing',
    currentTask: 'Validierung von Grundannahmen & Begriffsklarheit',
    confidence: 0.94,
    model: 'Gemini 3.7 Pro Cognition',
    latencyMs: 142,
    avatarIcon: 'Brain',
    color: '#06b6d4'
  },
  {
    id: 'agent_dialectic',
    name: 'Dialektischer Sparringspartner',
    role: 'Dialectic Challenger',
    status: 'debating',
    currentTask: 'Antithesen & versteckte Zielkonflikte aufdecken',
    confidence: 0.91,
    model: 'Gemini 3.7 Flash Dialectic',
    latencyMs: 98,
    avatarIcon: 'Flame',
    color: '#f59e0b'
  },
  {
    id: 'agent_empirical',
    name: 'Empirischer Verifizierer',
    role: 'Empirical Verifier',
    status: 'observing',
    currentTask: 'Faktenprüfung gegen Logs, Code & Messreihen',
    confidence: 0.96,
    model: 'Gemini 3.7 Flash Grounding',
    latencyMs: 110,
    avatarIcon: 'CheckCircle2',
    color: '#10b981'
  },
  {
    id: 'agent_architect',
    name: 'Kognitiver Architekt',
    role: 'Architect',
    status: 'executing',
    currentTask: 'Synthese in handlungsfähige Systemstrukturen',
    confidence: 0.93,
    model: 'Gemini 3.7 Pro Synthesis',
    latencyMs: 185,
    avatarIcon: 'Layers',
    color: '#8b5cf6'
  }
];

interface CognitiveEngineStore extends CognitiveSessionState {
  // Navigation & Depth
  setDisclosureLevel: (level: CognitiveDisclosureLevel) => void;
  setActivePhase: (phase: CognitivePhase) => void;
  setActiveViewArchetype: (view: 'spatial_orbit' | 'cognitive_flow' | 'synaptic_mesh' | 'horizon_matrix') => void;
  
  // Thinking Cycle
  loadScenario: (scenarioId: string) => void;
  runScenarioStep: () => void;
  startCustomThinkingProcess: (prompt: string) => Promise<void>;
  resetMindSpace: () => void;

  // Steering & Human-in-the-Loop
  selectHypothesis: (hypothesisId: string) => void;
  overrideHypothesisProbability: (hypothesisId: string, prob: number) => void;
  addHumanThoughtNode: (node: Omit<ThoughtNode, 'id' | 'timestamp'>) => void;
  toggleNodeDiscard: (nodeId: string, reason?: string) => void;
  resolveReflection: (reflectionId: string) => void;
  executeAffordance: (affordance: CognitiveAffordance) => void;

  // Time-Travel Checkpoints
  restoreCheckpoint: (index: number) => void;
}

export const useCognitiveEngine = create<CognitiveEngineStore>((set, get) => ({
  currentIntent: PRESET_SCENARIOS[0].initialIntent,
  activePhase: 'PERCEIVE',
  disclosureLevel: 2,
  confidence: 0.88,
  uncertaintyBand: [0.81, 0.94],
  nodes: PRESET_SCENARIOS[0].phases[0].nodesToAdd,
  links: PRESET_SCENARIOS[0].phases[0].linksToAdd,
  hypotheses: [],
  selectedHypothesisId: null,
  agents: INITIAL_AGENTS,
  checkpoints: [
    {
      id: 'chk_0',
      stepNumber: 1,
      timestamp: '17:20:00',
      phase: 'PERCEIVE',
      focusIntent: PRESET_SCENARIOS[0].initialIntent,
      selectedHypothesisId: '',
      summaryOfThought: 'Erfassung der Umgebungsfaktoren und Fehlertoleranz.',
      activeNodesCount: 2,
      confidenceScore: 0.74,
      humanInterventionsCount: 0
    }
  ],
  currentCheckpointIndex: 0,
  affordances: PRESET_SCENARIOS[0].phases[0].affordances,
  reflections: [],
  isStreaming: false,
  streamedThoughtTokens: PRESET_SCENARIOS[0].phases[0].thoughtTokens,
  activeViewArchetype: 'spatial_orbit',

  setDisclosureLevel: (level) => {
    soundFx.playBeep(400 + level * 120, 0.05);
    set({ disclosureLevel: level });
  },

  setActivePhase: (phase) => {
    soundFx.playBeep(650, 0.08);
    set({ activePhase: phase });
  },

  setActiveViewArchetype: (view) => {
    soundFx.playThemeSwitch();
    set({ activeViewArchetype: view });
  },

  loadScenario: (scenarioId) => {
    const sc = PRESET_SCENARIOS.find((s) => s.id === scenarioId) || PRESET_SCENARIOS[0];
    soundFx.playSystemBootBeep();
    
    const p0 = sc.phases[0];
    const initialCheckpoint: ReasoningCheckpoint = {
      id: `chk_${Date.now()}`,
      stepNumber: 1,
      timestamp: new Date().toLocaleTimeString(),
      phase: p0.phase,
      focusIntent: sc.initialIntent,
      selectedHypothesisId: '',
      summaryOfThought: p0.thoughtTokens[0] || 'Szenario geladen.',
      activeNodesCount: p0.nodesToAdd.length,
      confidenceScore: p0.confidence,
      humanInterventionsCount: 0
    };

    set({
      currentIntent: sc.initialIntent,
      activePhase: p0.phase,
      confidence: p0.confidence,
      uncertaintyBand: p0.uncertainty,
      nodes: [...p0.nodesToAdd],
      links: [...p0.linksToAdd],
      hypotheses: [...p0.hypotheses],
      selectedHypothesisId: null,
      reflections: [...p0.reflections],
      affordances: [...p0.affordances],
      streamedThoughtTokens: [...p0.thoughtTokens],
      checkpoints: [initialCheckpoint],
      currentCheckpointIndex: 0,
      isStreaming: false
    });
  },

  runScenarioStep: () => {
    const state = get();
    const sc = PRESET_SCENARIOS.find((s) => s.initialIntent === state.currentIntent) || PRESET_SCENARIOS[0];
    
    // Find next phase
    const currentPhaseIdx = sc.phases.findIndex((p) => p.phase === state.activePhase);
    const nextPhaseIdx = (currentPhaseIdx + 1) % sc.phases.length;
    const nextPhase = sc.phases[nextPhaseIdx];

    soundFx.playBeep(880, 0.09);
    set({ isStreaming: true });

    setTimeout(() => {
      set((prev) => {
        const mergedNodes = [...prev.nodes];
        nextPhase.nodesToAdd.forEach((n) => {
          if (!mergedNodes.some((existing) => existing.id === n.id)) {
            mergedNodes.push(n);
          }
        });

        const mergedLinks = [...prev.links];
        nextPhase.linksToAdd.forEach((l) => {
          if (!mergedLinks.some((existing) => existing.id === l.id)) {
            mergedLinks.push(l);
          }
        });

        const selectedHypo = nextPhase.hypotheses.find((h) => h.isSelected)?.id || prev.selectedHypothesisId;

        const newCheckpoint: ReasoningCheckpoint = {
          id: `chk_${Date.now()}`,
          stepNumber: prev.checkpoints.length + 1,
          timestamp: new Date().toLocaleTimeString(),
          phase: nextPhase.phase,
          focusIntent: prev.currentIntent,
          selectedHypothesisId: selectedHypo || '',
          summaryOfThought: nextPhase.thoughtTokens[0] || 'Kognitiver Schritt ausgeführt.',
          activeNodesCount: mergedNodes.length,
          confidenceScore: nextPhase.confidence,
          humanInterventionsCount: 0
        };

        return {
          activePhase: nextPhase.phase,
          confidence: nextPhase.confidence,
          uncertaintyBand: nextPhase.uncertainty,
          nodes: mergedNodes,
          links: mergedLinks,
          hypotheses: nextPhase.hypotheses.length > 0 ? nextPhase.hypotheses : prev.hypotheses,
          selectedHypothesisId: selectedHypo,
          reflections: [...prev.reflections, ...nextPhase.reflections],
          affordances: nextPhase.affordances,
          streamedThoughtTokens: [...prev.streamedThoughtTokens, ...nextPhase.thoughtTokens],
          checkpoints: [...prev.checkpoints, newCheckpoint],
          currentCheckpointIndex: prev.checkpoints.length,
          isStreaming: false
        };
      });
      soundFx.playSuccessBeep();
    }, 600);
  },

  startCustomThinkingProcess: async (prompt: string) => {
    soundFx.playPromptSubmit();
    set({
      currentIntent: prompt,
      activePhase: 'PERCEIVE',
      isStreaming: true,
      streamedThoughtTokens: [`Perzipiere Anfrage: "${prompt}"...`],
      hypotheses: [],
      selectedHypothesisId: null
    });

    // Step 1: Perception
    await new Promise((r) => setTimeout(r, 700));
    const rootNode: ThoughtNode = {
      id: `intent_${Date.now()}`,
      title: `Absicht: ${prompt.slice(0, 36)}...`,
      content: prompt,
      type: 'intent',
      phase: 'PERCEIVE',
      confidence: 0.97,
      weight: 1.0,
      timestamp: '00:00.800',
      tags: ['Benutzer-Absicht', 'Prompt'],
      x: 400,
      y: 100
    };

    set((prev) => ({
      nodes: [rootNode],
      links: [],
      confidence: 0.79,
      uncertaintyBand: [0.70, 0.88],
      streamedThoughtTokens: [
        ...prev.streamedThoughtTokens,
        'Analysiere semantische Vektoren und epistemische Voraussetzungen...',
        'Agenten-Schwarm koordiniert Hypothesen-Generierung...'
      ]
    }));

    // Step 2: Hypothesize & Connect
    await new Promise((r) => setTimeout(r, 900));
    soundFx.playBeep(740, 0.08);

    const hypoA: HypothesisBranch = {
      id: `hypo_a_${Date.now()}`,
      label: 'Hypothese A — Direkte pragmatische Synthese',
      archetype: 'conservative',
      probability: 0.35,
      premise: 'Standardisierte Lösung mit bewährten Architekturmustern.',
      rationale: 'Minimale Implementierungskomplexität, hohe Vorhersagbarkeit.',
      evidenceIds: [rootNode.id],
      contradictionRisk: 0.15,
      implications: ['Schnelle Inbetriebnahme', 'Solide Stabilität'],
      suggestedAction: 'Standard-Implementierung ausrollen',
      isSelected: false
    };

    const hypoB: HypothesisBranch = {
      id: `hypo_b_${Date.now()}`,
      label: 'Hypothese B — Adaptives kognitives Reaktionsnetz (Empfohlen)',
      archetype: 'dialectic_antithesis',
      probability: 0.65,
      premise: 'Selbstlernende Pipeline mit multi-agentischer Validierung.',
      rationale: 'Maximiert Reaktionsfähigkeit und Fehlertoleranz in unvorhergesehenen Szenarien.',
      evidenceIds: [rootNode.id],
      contradictionRisk: 0.08,
      implications: ['Höchste Flexibilität', 'Vollständige Selbsttransparenz'],
      suggestedAction: 'Kognitives Reaktionsnetz etablieren',
      isSelected: true
    };

    const nodeHypoB: ThoughtNode = {
      id: `node_hypo_${Date.now()}`,
      title: 'Kernkonzept: Kognitives Reaktionsnetz',
      content: 'Multi-Agenten-Synthese mit kontinuierlicher Feedback-Schleife und transparenter Begründung.',
      type: 'hypothesis',
      phase: 'HYPOTHESIZE',
      confidence: 0.94,
      weight: 0.9,
      timestamp: '00:03.200',
      tags: ['Kognition', 'Synthese', 'Kern'],
      x: 480,
      y: 260
    };

    const link1: ThoughtLink = {
      id: `link_${Date.now()}`,
      source: rootNode.id,
      target: nodeHypoB.id,
      relation: 'leitet ab & begründet',
      strength: 0.92
    };

    const reflection: MetaCognitiveReflection = {
      id: `ref_${Date.now()}`,
      type: 'serendipitous_discovery',
      title: 'Hohe epistemische Konvergenz erkannt',
      description: 'Die vorgeschlagene Lösung minimiert kognitive Dissonanzen bei gleichzeitig hoher Ausführungsgeschwindigkeit.',
      severity: 'low',
      detectedAtPhase: 'HYPOTHESIZE',
      suggestedResolution: 'Mit Ausführung auf Stufe 4 (Mechanik) fortfahren.',
      affectedNodeIds: [nodeHypoB.id]
    };

    const affordances: CognitiveAffordance[] = [
      {
        id: `aff_${Date.now()}_1`,
        title: 'Empfohlene Synthese anwenden',
        description: 'Generiert handlungsfähige Konfigurationen und Schritte.',
        category: 'execute_action',
        confidence: 0.96,
        actionPayload: 'apply_synthesis',
        iconName: 'Sparkles'
      },
      {
        id: `aff_${Date.now()}_2`,
        title: 'Dialektische Gegenprobe anfordern',
        description: 'Lässt den Dialektik-Agenten nach unbemerkten Schwachstellen suchen.',
        category: 'challenge_assumption',
        confidence: 0.88,
        actionPayload: 'challenge_hypo_b',
        iconName: 'Flame'
      }
    ];

    set((prev) => ({
      activePhase: 'HYPOTHESIZE',
      confidence: 0.93,
      uncertaintyBand: [0.89, 0.97],
      nodes: [...prev.nodes, nodeHypoB],
      links: [...prev.links, link1],
      hypotheses: [hypoA, hypoB],
      selectedHypothesisId: hypoB.id,
      reflections: [...prev.reflections, reflection],
      affordances,
      streamedThoughtTokens: [
        ...prev.streamedThoughtTokens,
        'Hypothesen generiert und evaluiert. Konfidenz bei 93%.'
      ],
      isStreaming: false
    }));

    soundFx.playSuccessBeep();
  },

  resetMindSpace: () => {
    soundFx.playClick();
    get().loadScenario(PRESET_SCENARIOS[0].id);
  },

  selectHypothesis: (hypothesisId) => {
    soundFx.playClick();
    set((state) => ({
      selectedHypothesisId: hypothesisId,
      hypotheses: state.hypotheses.map((h) => ({
        ...h,
        isSelected: h.id === hypothesisId,
        userOverridden: true
      }))
    }));
  },

  overrideHypothesisProbability: (hypothesisId, prob) => {
    set((state) => ({
      hypotheses: state.hypotheses.map((h) =>
        h.id === hypothesisId
          ? { ...h, probability: prob, userOverridden: true }
          : h
      )
    }));
  },

  addHumanThoughtNode: (newNode) => {
    soundFx.playSuccessBeep();
    const id = `human_node_${Date.now()}`;
    const fullNode: ThoughtNode = {
      ...newNode,
      id,
      timestamp: new Date().toLocaleTimeString(),
      confidence: 1.0,
      tags: [...newNode.tags, 'Menschliche Intervention']
    };

    set((state) => {
      const linksToAdd: ThoughtLink[] = [];
      if (state.nodes.length > 0) {
        const lastNode = state.nodes[state.nodes.length - 1];
        linksToAdd.push({
          id: `link_human_${Date.now()}`,
          source: lastNode.id,
          target: id,
          relation: 'menschlicher Steuerimpuls',
          strength: 1.0,
          isDialectic: true
        });
      }

      return {
        nodes: [...state.nodes, fullNode],
        links: [...state.links, ...linksToAdd],
        streamedThoughtTokens: [
          ...state.streamedThoughtTokens,
          `Menschlicher Steuerimpuls integriert: "${newNode.title}"`
        ]
      };
    });
  },

  toggleNodeDiscard: (nodeId, reason) => {
    soundFx.playClick();
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, isDiscarded: !n.isDiscarded, discardReason: reason || 'Durch Benutzer verworfen' }
          : n
      )
    }));
  },

  resolveReflection: (reflectionId) => {
    soundFx.playSuccessBeep();
    set((state) => ({
      reflections: state.reflections.map((r) =>
        r.id === reflectionId ? { ...r, isResolved: true } : r
      )
    }));
  },

  executeAffordance: (affordance) => {
    soundFx.playBeep(920, 0.08);
    get().addHumanThoughtNode({
      title: `Aktion: ${affordance.title}`,
      content: affordance.description,
      type: 'action',
      phase: get().activePhase,
      confidence: affordance.confidence || 0.95,
      weight: 0.9,
      tags: ['Affordanz', affordance.category]
    });
  },

  restoreCheckpoint: (index) => {
    const state = get();
    if (index >= 0 && index < state.checkpoints.length) {
      soundFx.playTimeTravel();
      set({ currentCheckpointIndex: index });
    }
  }
}));
