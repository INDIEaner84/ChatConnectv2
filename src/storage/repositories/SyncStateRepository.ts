import { ISyncStateRepository } from '@/runtime/interfaces/repositories';
import { SyncStateEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class SyncStateRepository implements ISyncStateRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<SyncStateEntity | null> {
    return this.db.get<SyncStateEntity>('syncState', id);
  }

  public async getAll(): Promise<SyncStateEntity[]> {
    return this.db.getAll<SyncStateEntity>('syncState');
  }

  public async save(item: SyncStateEntity): Promise<void> {
    await this.db.put('syncState', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('syncState', id);
  }

  public async count(): Promise<number> {
    return this.db.count('syncState');
  }

  public async getGlobalState(): Promise<SyncStateEntity> {
    const existing = await this.getById('global');
    if (existing) return existing;

    const initial: SyncStateEntity = {
      id: 'global',
      lastSyncTimestamp: 0,
      pendingQueueCount: 0,
      status: 'idle',
      syncedMessageCount: 0,
    };
    await this.save(initial);
    return initial;
  }
}

export const syncStateRepository = new SyncStateRepository();
