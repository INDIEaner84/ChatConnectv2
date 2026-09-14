/**
 * Core Storage Abstraction: IndexedDBStorage.
 * Foundation-level persistent storage abstraction utilizing IndexedDB with schema migrations,
 * multi-index queries, robust transactions, and in-memory test fallback.
 */

import { StorageError } from '@/core/errors/AppError';
import { logger } from '@/core/logging/Logger';
import { AppConfig } from '@/core/config/appConfig';
import {
  CoreStoreName,
  CORE_STORE_NAMES,
  IStorageEngine,
  StoreDefinition,
} from './types';

export const CORE_STORE_DEFINITIONS: StoreDefinition[] = [
  { name: 'users', keyPath: 'id' },
  { name: 'devices', keyPath: 'id' },
  {
    name: 'contacts',
    keyPath: 'id',
    indexes: [{ name: 'publicIdentity', keyPath: 'publicIdentity', unique: false }],
  },
  {
    name: 'relationships',
    keyPath: 'id',
    indexes: [
      { name: 'peerUserId', keyPath: 'peerUserId', unique: false },
      { name: 'state', keyPath: 'state', unique: false },
    ],
  },
  {
    name: 'conversations',
    keyPath: 'id',
    indexes: [{ name: 'lastActivityAt', keyPath: 'lastActivityAt', unique: false }],
  },
  {
    name: 'messages',
    keyPath: 'id',
    indexes: [
      { name: 'conversationId', keyPath: 'conversationId', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'syncHash', keyPath: 'syncHash', unique: false },
    ],
  },
  { name: 'groups', keyPath: 'id' },
  {
    name: 'attachments',
    keyPath: 'id',
    indexes: [{ name: 'hash', keyPath: 'hash', unique: false }],
  },
  { name: 'syncState', keyPath: 'id' },
  { name: 'appMetadata', keyPath: 'key' },
  { name: 'secureKeyStore', keyPath: 'id' },
  {
    name: 'rawDocuments',
    keyPath: 'documentId',
    indexes: [
      { name: 'contentHash', keyPath: 'contentHash', unique: false },
      { name: 'sourceId', keyPath: 'sourceId', unique: false },
    ],
  },
  {
    name: 'documentChunks',
    keyPath: 'chunkId',
    indexes: [
      { name: 'documentId', keyPath: 'documentId', unique: false },
      { name: 'hash', keyPath: 'hash', unique: false },
    ],
  },
  {
    name: 'embeddingRecords',
    keyPath: 'id',
    indexes: [
      { name: 'chunkId', keyPath: 'chunkId', unique: false },
      { name: 'modelId', keyPath: 'modelId', unique: false },
    ],
  },
  { name: 'modelRegistry', keyPath: 'id' },
];

/**
 * In-memory fallback engine when running in headless testing, CLI, or SSR environments.
 */
class MemoryStorageEngine {
  private stores = new Map<CoreStoreName, Map<string, unknown>>();

  constructor() {
    CORE_STORE_NAMES.forEach((store) => this.stores.set(store, new Map()));
  }

  public get<T>(storeName: CoreStoreName, key: string): T | null {
    const store = this.stores.get(storeName);
    const val = store ? store.get(key) : null;
    return val !== undefined && val !== null ? (structuredClone(val) as T) : null;
  }

  public getAll<T>(storeName: CoreStoreName): T[] {
    const store = this.stores.get(storeName);
    return store ? Array.from(store.values() as Iterable<T>).map((v) => structuredClone(v)) : [];
  }

  public set<T>(storeName: CoreStoreName, key: string, value: T): void {
    const store = this.stores.get(storeName);
    if (store) store.set(key, structuredClone(value));
  }

  public delete(storeName: CoreStoreName, key: string): void {
    const store = this.stores.get(storeName);
    if (store) store.delete(key);
  }

  public count(storeName: CoreStoreName): number {
    const store = this.stores.get(storeName);
    return store ? store.size : 0;
  }

  public clear(storeName: CoreStoreName): void {
    const store = this.stores.get(storeName);
    if (store) store.clear();
  }

  public clearAll(): void {
    this.stores.forEach((s) => s.clear());
  }

  public find<T>(storeName: CoreStoreName, indexName: string, queryValue: unknown): T[] {
    const all = this.getAll<Record<string, unknown>>(storeName);
    return all.filter((item) => item[indexName] === queryValue) as T[];
  }
}

export class IndexedDBStorage implements IStorageEngine {
  private db: IDBDatabase | null = null;
  private memoryFallback: MemoryStorageEngine | null = null;
  private isFallbackMode = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    private dbName: string = AppConfig.databaseName,
    private version: number = AppConfig.databaseVersion
  ) {}

  public async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        logger.info(
          'IndexedDBStorage',
          'IndexedDB not available in current runtime, activating in-memory fallback store'
        );
        this.memoryFallback = new MemoryStorageEngine();
        this.isFallbackMode = true;
        return resolve();
      }

      try {
        const request = window.indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          logger.info('IndexedDBStorage', `Migrating database schema for "${this.dbName}" (v${this.version})`);

          for (const def of CORE_STORE_DEFINITIONS) {
            let store: IDBObjectStore;
            if (!db.objectStoreNames.contains(def.name)) {
              store = db.createObjectStore(def.name, {
                keyPath: def.keyPath,
                autoIncrement: def.autoIncrement,
              });
            } else {
              store = (event.target as IDBOpenDBRequest).transaction!.objectStore(def.name);
            }

            if (def.indexes) {
              for (const idx of def.indexes) {
                if (!store.indexNames.contains(idx.name)) {
                  store.createIndex(idx.name, idx.keyPath, {
                    unique: idx.unique,
                    multiEntry: idx.multiEntry,
                  });
                }
              }
            }
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          logger.info('IndexedDBStorage', `IndexedDBStorage "${this.dbName}" initialized successfully`);
          resolve();
        };

        request.onerror = (event) => {
          logger.warn('IndexedDBStorage', 'Failed to open IndexedDB, falling back to memory store', {
            error: (event.target as IDBOpenDBRequest).error?.message,
          });
          this.memoryFallback = new MemoryStorageEngine();
          this.isFallbackMode = true;
          resolve();
        };
      } catch (err) {
        logger.warn('IndexedDBStorage', 'Exception opening IndexedDB, falling back to memory store', {
          error: (err as Error).message,
        });
        this.memoryFallback = new MemoryStorageEngine();
        this.isFallbackMode = true;
        resolve();
      }
    });

    return this.initPromise;
  }

  public isUsingFallback(): boolean {
    return this.isFallbackMode;
  }

  public async get<T>(storeName: CoreStoreName, key: IDBValidKey): Promise<T | null> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      return this.memoryFallback.get<T>(storeName, String(key));
    }

    return new Promise<T | null>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => reject(new StorageError(`Failed to get item "${String(key)}" from store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async getAll<T>(storeName: CoreStoreName): Promise<T[]> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      return this.memoryFallback.getAll<T>(storeName);
    }

    return new Promise<T[]>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => reject(new StorageError(`Failed to get all items from store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async put<T extends { id?: string; key?: string }>(storeName: CoreStoreName, value: T): Promise<void> {
    await this.init();

    const key = value.id || value.key;
    if (!key) {
      throw new StorageError(`Cannot persist item to store "${storeName}" without "id" or "key" property`);
    }

    if (this.isFallbackMode && this.memoryFallback) {
      this.memoryFallback.set(storeName, key, value);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(value);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(new StorageError(`Failed to put item into store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async set<T>(storeName: CoreStoreName, key: string, value: T): Promise<void> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      this.memoryFallback.set(storeName, key, value);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(value, key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(new StorageError(`Failed to set item "${key}" in store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async delete(storeName: CoreStoreName, key: IDBValidKey): Promise<void> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      this.memoryFallback.delete(storeName, String(key));
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(new StorageError(`Failed to delete item "${String(key)}" from store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async count(storeName: CoreStoreName): Promise<number> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      return this.memoryFallback.count(storeName);
    }

    return new Promise<number>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(new StorageError(`Failed to count store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async find<T>(storeName: CoreStoreName, indexName: string, queryValue: IDBValidKey): Promise<T[]> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      return this.memoryFallback.find<T>(storeName, indexName, queryValue);
    }

    return new Promise<T[]>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const req = index.getAll(queryValue);

        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => reject(new StorageError(`Index query "${indexName}" failed on store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Index error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async findOne<T>(storeName: CoreStoreName, indexName: string, queryValue: IDBValidKey): Promise<T | null> {
    const results = await this.find<T>(storeName, indexName, queryValue);
    return results[0] ?? null;
  }

  public async clear(storeName: CoreStoreName): Promise<void> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      this.memoryFallback.clear(storeName);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(new StorageError(`Failed to clear store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on clear "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async clearAll(): Promise<void> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      this.memoryFallback.clearAll();
      return;
    }

    for (const store of CORE_STORE_NAMES) {
      await this.clear(store);
    }
  }
}

export const coreStorage = new IndexedDBStorage();
