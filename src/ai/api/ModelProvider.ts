/**
 * Model Provider Contract.
 * Manages models and executes text/instruct/thinking/vision inference requests.
 */

import { IAIProvider } from './AIProvider';
import { ModelDescriptor } from './ModelMetadata';
import { InferenceRequest } from './InferenceRequest';
import { InferenceResponse } from './InferenceResponse';
import { IModel } from './Model';

export interface IModelProvider extends IAIProvider {
  /**
   * Returns descriptors of all models supported or exposed by this provider.
   */
  listModels(): Promise<readonly ModelDescriptor[]>;

  /**
   * Retrieves a model descriptor by ID if owned by this provider.
   */
  getModelDescriptor(modelId: string): Promise<ModelDescriptor | null>;

  /**
   * Instantiates or acquires an executable model handle.
   */
  getModel(modelId: string): Promise<IModel | null>;

  /**
   * Executes inference directly through this provider.
   */
  executeInference(request: InferenceRequest): Promise<InferenceResponse>;
}
