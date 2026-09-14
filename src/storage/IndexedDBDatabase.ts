/**
 * IndexedDB storage engine with schema migrations, indexes, transaction safety,
 * and seamless fallback for automated headless testing environments.
 */

import { StorageError } from '@/core/errors/AppError';
import { logger } from '@/core/logging/Logger';
import { AppConfig } from '@/core/config/appConfig';

export const STORE_NAMES = [
  'users',
  'devices',
  'contacts',
  'relationships',
  'conversations',
  'messages',
  'groups',
  'attachments',
  'syncState',
  'appMetadata',
  'secureKeyStore',
  'rawDocuments',
  'documentChunks',
  'embeddingRecords',
  'modelRegistry',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

class MemoryStore {
  private data = new Map<StoreName, Map<string, unknown>>();

  constructor() {
    STORE_NAMES.forEach((store) => this.data.set(store, new Map()));
  }

  public get<T>(store: StoreName, key: string): T | null {
    const s = this.data.get(store);
    const val = s ? s.get(key) : null;
    return val !== undefined && val !== null ? (structuredClone(val) as T) : null;
  }

  public getAll<T>(store: StoreName): T[] {
    const s = this.data.get(store);
    return s ? Array.from(s.values() as Iterable<T>).map((v) => structuredClone(v)) : [];
  }

  public set<T>(store: StoreName, key: string, value: T): void {
    const s = this.data.get(store);
    if (s) s.set(key, structuredClone(value));
  }

  public delete(store: StoreName, key: string): void {
    const s = this.data.get(store);
    if (s) s.delete(key);
  }

  public count(store: StoreName): number {
    const s = this.data.get(store);
    return s ? s.size : 0;
  }

  public clear(): void {
    this.data.forEach((s) => s.clear());
  }
}

export class IndexedDBDatabase {
  private db: IDBDatabase | null = null;
  private memoryFallback: MemoryStore | null = null;
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
        logger.info('IndexedDBDatabase', 'IndexedDB not found in environment, activating in-memory fallback store');
        this.memoryFallback = new MemoryStore();
        this.isFallbackMode = true;
        return resolve();
      }

      try {
        const request = window.indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          logger.info('IndexedDBDatabase', `Migrating database "${this.dbName}" to version ${this.version}`);

          // Create object stores and indexes
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('devices')) {
            db.createObjectStore('devices', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('contacts')) {
            const store = db.createObjectStore('contacts', { keyPath: 'id' });
            store.createIndex('publicIdentity', 'publicIdentity', { unique: false });
          }

          if (!db.objectStoreNames.contains('relationships')) {
            const store = db.createObjectStore('relationships', { keyPath: 'id' });
            store.createIndex('peerUserId', 'peerUserId', { unique: false });
            store.createIndex('state', 'state', { unique: false });
          }

          if (!db.objectStoreNames.contains('conversations')) {
            const store = db.createObjectStore('conversations', { keyPath: 'id' });
            store.createIndex('lastActivityAt', 'lastActivityAt', { unique: false });
          }

          if (!db.objectStoreNames.contains('messages')) {
            const store = db.createObjectStore('messages', { keyPath: 'id' });
            store.createIndex('conversationId', 'conversationId', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('syncHash', 'syncHash', { unique: false });
          }

          if (!db.objectStoreNames.contains('groups')) {
            db.createObjectStore('groups', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('attachments')) {
            const store = db.createObjectStore('attachments', { keyPath: 'id' });
            store.createIndex('hash', 'hash', { unique: false });
          }

          if (!db.objectStoreNames.contains('syncState')) {
            db.createObjectStore('syncState', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('appMetadata')) {
            db.createObjectStore('appMetadata', { keyPath: 'key' });
          }

          if (!db.objectStoreNames.contains('secureKeyStore')) {
            db.createObjectStore('secureKeyStore', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('rawDocuments')) {
            const store = db.createObjectStore('rawDocuments', { keyPath: 'documentId' });
            store.createIndex('contentHash', 'contentHash', { unique: false });
            store.createIndex('sourceId', 'sourceId', { unique: false });
          }

          if (!db.objectStoreNames.contains('documentChunks')) {
            const store = db.createObjectStore('documentChunks', { keyPath: 'chunkId' });
            store.createIndex('documentId', 'documentId', { unique: false });
            store.createIndex('hash', 'hash', { unique: false });
          }

          if (!db.objectStoreNames.contains('embeddingRecords')) {
            const store = db.createObjectStore('embeddingRecords', { keyPath: 'id' });
            store.createIndex('chunkId', 'chunkId', { unique: false });
            store.createIndex('modelId', 'modelId', { unique: false });
          }

          if (!db.objectStoreNames.contains('modelRegistry')) {
            db.createObjectStore('modelRegistry', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          logger.info('IndexedDBDatabase', `Database "${this.dbName}" initialized successfully`);
          resolve();
        };

        request.onerror = (event) => {
          logger.warn('IndexedDBDatabase', 'Failed to open IndexedDB, falling back to memory store', {
            error: (event.target as IDBOpenDBRequest).error?.message,
          });
          this.memoryFallback = new MemoryStore();
          this.isFallbackMode = true;
          resolve();
        };
      } catch (err) {
        logger.warn('IndexedDBDatabase', 'Exception opening IndexedDB, falling back to memory store', {
          error: (err as Error).message,
        });
        this.memoryFallback = new MemoryStore();
        this.isFallbackMode = true;
        resolve();
      }
    });

    return this.initPromise;
  }

  public isUsingFallback(): boolean {
    return this.isFallbackMode;
  }

  public async get<T>(storeName: StoreName, key: string): Promise<T | null> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      return this.memoryFallback.get<T>(storeName, key);
    }

    return new Promise<T | null>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => reject(new StorageError(`Failed to get item "${key}" from store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
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

  public async put<T extends { id?: string; key?: string }>(storeName: StoreName, value: T): Promise<void> {
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

  public async delete(storeName: StoreName, key: string): Promise<void> {
    await this.init();

    if (this.isFallbackMode && this.memoryFallback) {
      this.memoryFallback.delete(storeName, key);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(new StorageError(`Failed to delete item "${key}" from store "${storeName}"`));
      } catch (err) {
        reject(new StorageError(`Transaction error on store "${storeName}"`, { error: (err as Error).message }));
      }
    });
  }

  public async count(storeName: StoreName): Promise<number> {
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

  public async clearAll(): Promise<void> {
    await this.init();
    if (this.isFallbackMode && this.memoryFallback) {
      this.memoryFallback.clear();
      return;
    }

    for (const store of STORE_NAMES) {
      await new Promise<void>((resolve) => {
        try {
          const tx = this.db!.transaction(store, 'readwrite');
          tx.objectStore(store).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  }
}

export const localDb = new IndexedDBDatabase();
