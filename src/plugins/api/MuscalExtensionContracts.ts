/**
 * Future MUSCAL Extension Architectural Contracts (Draft Specifications).
 * 
 * Prepares the structural contracts for future MUSCAL extensions:
 * - Agent Plugin
 * - Tool Plugin
 * - Context Provider
 * - Model Provider
 * - Extractor
 * - Embedding Provider
 * - Retriever
 * - UI Cognitive Component
 * - Workflow Plugin
 * 
 * Note: These are forward-compatible contracts for upcoming phases.
 */

export interface MuscalAgentContract {
  readonly agentId: string;
  readonly name: string;
  readonly description: string;
  readonly capabilities: string[];
  readonly systemPromptTemplate: string;
  handleMessage(message: string, context: Record<string, unknown>): Promise<{ reply: string }>;
}

export interface MuscalToolContract {
  readonly toolName: string;
  readonly description: string;
  readonly parametersSchema: Record<string, unknown>;
  execute(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface MuscalContextProviderContract {
  readonly providerId: string;
  readonly name: string;
  getContext(query: string, maxItems?: number): Promise<Array<{ id: string; content: string; score: number }>>;
}

export interface MuscalModelProviderContract {
  readonly providerId: string;
  readonly supportedModels: string[];
  generateCompletion(model: string, prompt: string, options?: Record<string, unknown>): Promise<string>;
}

export interface MuscalExtractorContract {
  readonly mimeTypes: string[];
  extractText(binaryDataBase64: string, mimeType: string): Promise<string>;
}

export interface MuscalEmbeddingProviderContract {
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface MuscalRetrieverContract {
  search(embedding: number[], topK: number): Promise<Array<{ documentId: string; text: string; score: number }>>;
}

export interface MuscalUICognitiveComponentContract {
  readonly componentId: string;
  readonly title: string;
  readonly triggerEventType: string;
  renderCognitiveCard(data: Record<string, unknown>): unknown;
}

export interface MuscalWorkflowPluginContract {
  readonly workflowId: string;
  readonly name: string;
  readonly steps: Array<{ stepId: string; toolName: string }>;
  executeWorkflow(input: Record<string, unknown>): Promise<Record<string, unknown>>;
}
