/**
 * Core Storage Abstraction Interfaces and Types.
 * Defines the foundation engine contracts for IndexedDB persistence.
 */

export const CORE_STORE_NAMES = [
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

export type CoreStoreName = (typeof CORE_STORE_NAMES)[number];

export interface IndexDefinition {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}

export interface StoreDefinition {
  name: CoreStoreName;
  keyPath?: string | string[];
  autoIncrement?: boolean;
  indexes?: IndexDefinition[];
}

export interface IStorageEngine {
  /**
   * Initializes the storage engine, opening connections and executing migrations.
   */
  init(): Promise<void>;

  /**
   * Retrieves a single record by primary key.
   */
  get<T>(storeName: CoreStoreName, key: IDBValidKey): Promise<T | null>;

  /**
   * Retrieves all records from an object store.
   */
  getAll<T>(storeName: CoreStoreName): Promise<T[]>;

  /**
   * Saves or replaces a record in the specified store.
   */
  put<T extends { id?: string; key?: string }>(storeName: CoreStoreName, value: T): Promise<void>;

  /**
   * Explicitly sets a value for a specific key.
   */
  set<T>(storeName: CoreStoreName, key: string, value: T): Promise<void>;

  /**
   * Removes a record by primary key.
   */
  delete(storeName: CoreStoreName, key: IDBValidKey): Promise<void>;

  /**
   * Returns the count of items in a store.
   */
  count(storeName: CoreStoreName): Promise<number>;

  /**
   * Queries records using a secondary index.
   */
  find<T>(storeName: CoreStoreName, indexName: string, queryValue: IDBValidKey): Promise<T[]>;

  /**
   * Queries the first matching record using a secondary index.
   */
  findOne<T>(storeName: CoreStoreName, indexName: string, queryValue: IDBValidKey): Promise<T | null>;

  /**
   * Clears all records from a specific store.
   */
  clear(storeName: CoreStoreName): Promise<void>;

  /**
   * Clears all stores in the database.
   */
  clearAll(): Promise<void>;

  /**
   * Checks if in-memory fallback is active.
   */
  isUsingFallback(): boolean;
}
