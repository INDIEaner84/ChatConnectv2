/**
 * Remote Mock AI Provider.
 * Simulates a cloud/remote inference backend with strict AI Data Policy enforcement,
 * streaming, and cancellation handling.
 */

import { IModelProvider } from '../api/ModelProvider';
import { ProviderHealth } from '../api/AIProvider';
import { ModelDescriptor } from '../api/ModelMetadata';
import { InferenceRequest } from '../api/InferenceRequest';
import { InferenceResponse } from '../api/InferenceResponse';
import { IModel } from '../api/Model';
import { canDispatchToRemote, DEFAULT_LOCAL_ONLY_POLICY } from '../api/AIDataPolicy';

export const REMOTE_PROVIDER_ID = 'provider.remote.cloud';

export const REMOTE_MODELS: readonly ModelDescriptor[] = [
  {
    id: 'model.remote.cloud-general-v1',
    name: 'Cloud General Assistant',
    version: '1.0.0',
    provider: REMOTE_PROVIDER_ID,
    type: 'instruct',
    parameterCount: '70B',
    contextLength: 32768,
    modalities: ['text'],
    quantization: 'none',
    runtime: 'cloud',
    license: 'Commercial',
    local: false,
    remote: true,
    requirements: {
      minRamMb: 64,
      recommendedRamMb: 128,
    },
    capabilities: ['chat', 'streaming', 'code-generation', 'complex-synthesis'],
    description: 'Cloud-hosted instruction model for general reasoning and coding.',
  },
  {
    id: 'model.remote.cloud-heavy-v1',
    name: 'Cloud Frontier Reasoning',
    version: '1.0.0',
    provider: REMOTE_PROVIDER_ID,
    type: 'thinking',
    parameterCount: '200B',
    contextLength: 131072,
    modalities: ['text', 'image'],
    quantization: 'none',
    runtime: 'cloud',
    license: 'Commercial',
    local: false,
    remote: true,
    requirements: {
      minRamMb: 64,
      recommendedRamMb: 128,
    },
    capabilities: ['chat', 'streaming', 'deep-research', 'multimodal'],
    description: 'Frontier thinking model for massive context and deep research.',
  },
];

export class RemoteMockProvider implements IModelProvider {
  public readonly id = REMOTE_PROVIDER_ID;
  public readonly name = 'Cloud Remote Provider';
  public readonly version = '1.0.0';
  public readonly type = 'REMOTE';
  public readonly description = 'External cloud inference endpoint with privacy policy gate';

  private isInitialized = false;
  private activeRequests = 0;

  public async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  public async shutdown(): Promise<void> {
    this.isInitialized = false;
  }

  public async getHealth(): Promise<ProviderHealth> {
    return {
      healthy: this.isInitialized,
      latencyMs: 120,
      activeRequests: this.activeRequests,
      message: 'Cloud API reachable and responsive',
    };
  }

  public async listModels(): Promise<readonly ModelDescriptor[]> {
    return REMOTE_MODELS;
  }

  public async getModelDescriptor(modelId: string): Promise<ModelDescriptor | null> {
    return REMOTE_MODELS.find((m) => m.id === modelId) || null;
  }

  public async getModel(modelId: string): Promise<IModel | null> {
    const desc = await this.getModelDescriptor(modelId);
    if (!desc) return null;

    const self = this;
    return {
      descriptor: desc,
      getStatus: async () => 'available',
      load: async () => {},
      unload: async () => {},
      generate: async (req: InferenceRequest) => self.executeInference(req),
      generateStream: async (req, onChunk) => self.executeInference({ ...req, onChunk }),
    };
  }

  public async executeInference(request: InferenceRequest): Promise<InferenceResponse> {
    const startTime = performance.now();
    this.activeRequests++;

    try {
      // 1. Policy Enforcement: Check if data is allowed to leave device
      const policy = request.policy || DEFAULT_LOCAL_ONLY_POLICY;
      const policyCheck = canDispatchToRemote(policy, this.id);
      if (!policyCheck.allowed) {
        throw new Error(
          `[SECURITY VIOLATION] Remote dispatch rejected by AI Data Policy: ${policyCheck.reason}`
        );
      }

      // 2. Cancellation check
      if (request.signal?.aborted) {
        throw new Error('Remote inference aborted by caller signal');
      }

      const modelId = request.modelId || 'model.remote.cloud-general-v1';
      const prompt = request.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
      const inputTokens = Math.ceil(prompt.length / 4);

      const responseContent = `Cloud Remote Response (${modelId}): Completed synthesis for ${request.messages.length} messages.`;

      // 3. Streaming simulation
      if (request.onChunk) {
        const tokens = responseContent.split(' ');
        for (const tok of tokens) {
          if (request.signal?.aborted) {
            throw new Error('Remote streaming aborted by caller signal');
          }
          request.onChunk(tok + ' ', { token: tok });
        }
      }

      const outTokens = Math.ceil(responseContent.length / 4);

      return {
        id: `resp_remote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        requestId: request.id,
        modelId,
        providerId: this.id,
        content: responseContent,
        role: 'assistant',
        finishReason: 'stop',
        usage: {
          promptTokens: inputTokens,
          completionTokens: outTokens,
          totalTokens: inputTokens + outTokens,
        },
        latencyMs: Math.max(5, Math.round(performance.now() - startTime)),
      };
    } finally {
      this.activeRequests--;
    }
  }
}
