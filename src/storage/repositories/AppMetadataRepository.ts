import { IAppMetadataRepository } from '@/runtime/interfaces/repositories';
import { AppMetadataEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class AppMetadataRepository implements IAppMetadataRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async get<T = unknown>(key: string): Promise<T | null> {
    const item = await this.db.get<AppMetadataEntity>('appMetadata', key);
    return item ? (item.value as T) : null;
  }

  public async set<T = unknown>(key: string, value: T): Promise<void> {
    const entity: AppMetadataEntity = {
      key,
      value,
      updatedAt: Date.now(),
    };
    await this.db.put('appMetadata', entity);
  }

  public async delete(key: string): Promise<void> {
    await this.db.delete('appMetadata', key);
  }

  public async getAll(): Promise<Record<string, unknown>> {
    const all = await this.db.getAll<AppMetadataEntity>('appMetadata');
    const result: Record<string, unknown> = {};
    for (const item of all) {
      result[item.key] = item.value;
    }
    return result;
  }
}

export const appMetadataRepository = new AppMetadataRepository();
