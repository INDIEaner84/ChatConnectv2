/**
 * Type-safe, decoupled EventBus for Chat Connect & MUSCAL Runtime.
 */

export type EventCallback<T = unknown> = (payload: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Set<EventCallback>>();

  public on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(callback as EventCallback);

    return () => this.off(event, callback);
  }

  public once<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    const wrapper: EventCallback<T> = (payload: T) => {
      this.off(event, wrapper);
      return callback(payload);
    };
    return this.on(event, wrapper);
  }

  public off<T = unknown>(event: string, callback: EventCallback<T>): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(callback as EventCallback);
      if (set.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  public async emit<T = unknown>(event: string, payload?: T): Promise<void> {
    const set = this.handlers.get(event);
    if (!set) return;

    const promises: Promise<void>[] = [];
    for (const handler of Array.from(set)) {
      try {
        const result = handler(payload);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (err) {
        console.error(`[EventBus] Unhandled error in listener for event "${event}":`, err);
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

// Core event topic names
export const AppEvents = {
  // Identity & Auth
  IDENTITY_INITIALIZED: 'identity:initialized',
  IDENTITY_UPDATED: 'identity:updated',
  DEVICE_REGISTERED: 'device:registered',

  // Relationships & QR
  INVITATION_CREATED: 'invitation:created',
  INVITATION_ACCEPTED: 'invitation:accepted',
  RELATIONSHIP_CHANGED: 'relationship:changed',

  // Messaging
  MESSAGE_CREATED: 'message:created',
  MESSAGE_QUEUED: 'message:queued',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_STATUS_CHANGED: 'message:status_changed',
  CONVERSATION_CREATED: 'conversation:created',
  CONVERSATION_UPDATED: 'conversation:updated',

  // Sync & Network
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETED: 'sync:completed',
  SYNC_FAILED: 'sync:failed',
  NETWORK_ONLINE: 'network:online',
  NETWORK_OFFLINE: 'network:offline',

  // Runtime & Diagnostics
  DIAGNOSTICS_TICK: 'diagnostics:tick',

  // Phase 5: Plugin Lifecycle Events
  PLUGIN_LOADED: 'plugin.loaded',
  PLUGIN_ENABLED: 'plugin.enabled',
  PLUGIN_DISABLED: 'plugin.disabled',

  // Phase 6: AI Provider & Inference Events
  AI_PROVIDER_REGISTERED: 'ai.provider.registered',
  AI_MODEL_REGISTERED: 'ai.model.registered',
  AI_MODEL_SELECTED: 'ai.model.selected',
  AI_INFERENCE_STARTED: 'ai.inference.started',
  AI_INFERENCE_COMPLETED: 'ai.inference.completed',

  // Phase 7: Context & Evidence Events
  CONTEXT_INGESTION_STARTED: 'context.ingestion.started',
  CONTEXT_PROCESSING_COMPLETED: 'context.processing.completed',
  CONTEXT_RETRIEVAL_COMPLETED: 'context.retrieval.completed',
  CONTEXT_EVIDENCE_SELECTED: 'context.evidence.selected',
  CONTEXT_PACKAGE_CREATED: 'context.package.created',

  // Phase 8: Model Router Events
  MODEL_ROUTING_STARTED: 'model.routing.started',
  MODEL_ROUTING_COMPLETED: 'model.routing.completed',
  MODEL_ROUTING_FALLBACK: 'model.routing.fallback',
} as const;
