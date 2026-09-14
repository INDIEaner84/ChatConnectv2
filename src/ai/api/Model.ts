/**
 * Active Model abstraction.
 * Represents an executable instance of a registered ModelDescriptor.
 */

import { ModelDescriptor, ModelStatus } from './ModelMetadata';
import { InferenceRequest } from './InferenceRequest';
import { InferenceResponse } from './InferenceResponse';

export interface IModel {
  readonly descriptor: ModelDescriptor;
  getStatus(): Promise<ModelStatus>;
  load(): Promise<void>;
  unload(): Promise<void>;
  generate(request: InferenceRequest): Promise<InferenceResponse>;
  generateStream?(
    request: InferenceRequest,
    onChunk: (chunk: string, delta: unknown) => void
  ): Promise<InferenceResponse>;
}
