/**
 * Isolated storage for plugins.
 * 
 * Plugins receive an isolated storage namespace (e.g. pluginStorage("community.example.weather")).
 * Plugin storage is completely segregated from internal Core storage and other plugins.
 */

import { logger } from '@/core/logging/Logger';

export interface IPluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
}

export class PluginStorageIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginStorageIsolationError';
  }
}

/**
 * In-memory / persistent isolated storage manager.
 * Isolates each plugin into its own partition: `${pluginId}::${key}`
 */
export class PluginStorageManager {
  private static instance: PluginStorageManager | null = null;
  // pluginId -> (key -> serializedValue)
  private partitions = new Map<string, Map<string, string>>();
  private maxQuotaBytesPerPlugin = 10 * 1024 * 1024; // 10MB default quota

  public static getInstance(): PluginStorageManager {
    if (!PluginStorageManager.instance) {
      PluginStorageManager.instance = new PluginStorageManager();
    }
    return PluginStorageManager.instance;
  }

  public getStorage(pluginId: string): IPluginStorage {
    if (!pluginId || typeof pluginId !== 'string' || pluginId.trim() === '') {
      throw new PluginStorageIsolationError('Invalid pluginId for storage namespace');
    }

    const cleanId = pluginId.trim();

    // Prevent plugins from using reserved or core namespace
    if (cleanId.startsWith('core.') || cleanId.startsWith('internal.') || cleanId.startsWith('muscal.core.')) {
      throw new PluginStorageIsolationError(`Cannot create plugin storage in protected namespace: ${cleanId}`);
    }

    return new IsolatedPluginStorage(cleanId, this);
  }

  // Internal partitioned access strictly guarded by pluginId
  public async get<T>(pluginId: string, key: string): Promise<T | null> {
    const partition = this.partitions.get(pluginId);
    if (!partition) return null;
    const val = partition.get(key);
    if (val === undefined) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }

  public async set<T>(pluginId: string, key: string, value: T): Promise<void> {
    if (!this.partitions.has(pluginId)) {
      this.partitions.set(pluginId, new Map());
    }
    const partition = this.partitions.get(pluginId)!;
    const serialized = JSON.stringify(value);

    // Calculate rough partition size
    let currentBytes = 0;
    for (const [k, v] of partition.entries()) {
      if (k !== key) {
        currentBytes += k.length + v.length;
      }
    }
    if (currentBytes + key.length + serialized.length > this.maxQuotaBytesPerPlugin) {
      throw new PluginStorageIsolationError(
        `Storage quota exceeded for plugin ${pluginId} (limit: ${this.maxQuotaBytesPerPlugin} bytes)`
      );
    }

    partition.set(key, serialized);
  }

  public async delete(pluginId: string, key: string): Promise<void> {
    const partition = this.partitions.get(pluginId);
    if (partition) {
      partition.delete(key);
    }
  }

  public async list(pluginId: string): Promise<string[]> {
    const partition = this.partitions.get(pluginId);
    if (!partition) return [];
    return Array.from(partition.keys());
  }

  public async clear(pluginId: string): Promise<void> {
    const partition = this.partitions.get(pluginId);
    if (partition) {
      partition.clear();
    }
  }

  public clearAllPartitions(): void {
    this.partitions.clear();
  }

  public getPartitionCount(): number {
    return this.partitions.size;
  }
}

class IsolatedPluginStorage implements IPluginStorage {
  constructor(
    private readonly pluginId: string,
    private readonly manager: PluginStorageManager
  ) {}

  public async get<T>(key: string): Promise<T | null> {
    this.validateKey(key);
    return this.manager.get<T>(this.pluginId, key);
  }

  public async set<T>(key: string, value: T): Promise<void> {
    this.validateKey(key);
    return this.manager.set<T>(this.pluginId, key, value);
  }

  public async delete(key: string): Promise<void> {
    this.validateKey(key);
    return this.manager.delete(this.pluginId, key);
  }

  public async list(): Promise<string[]> {
    return this.manager.list(this.pluginId);
  }

  public async clear(): Promise<void> {
    return this.manager.clear(this.pluginId);
  }

  private validateKey(key: string): void {
    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new PluginStorageIsolationError('Invalid storage key: must be a non-empty string');
    }
    // Prevent keys that attempt traversal or accessing other namespaces
    if (key.includes('..') || key.includes('/') || key.includes('\\') || key.startsWith('__')) {
      throw new PluginStorageIsolationError(`Malformed storage key attempted: "${key}"`);
    }
  }
}
