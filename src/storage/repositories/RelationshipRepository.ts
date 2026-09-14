import { IRelationshipRepository } from '@/runtime/interfaces/repositories';
import { RelationshipEntity, RelationshipState } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class RelationshipRepository implements IRelationshipRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<RelationshipEntity | null> {
    return this.db.get<RelationshipEntity>('relationships', id);
  }

  public async getAll(): Promise<RelationshipEntity[]> {
    return this.db.getAll<RelationshipEntity>('relationships');
  }

  public async save(item: RelationshipEntity): Promise<void> {
    await this.db.put('relationships', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('relationships', id);
  }

  public async count(): Promise<number> {
    return this.db.count('relationships');
  }

  public async getByPeerUserId(peerUserId: string): Promise<RelationshipEntity | null> {
    const all = await this.getAll();
    return all.find((r) => r.peerUserId === peerUserId) || null;
  }

  public async getByState(state: RelationshipState): Promise<RelationshipEntity[]> {
    const all = await this.getAll();
    return all.filter((r) => r.state === state);
  }
}

export const relationshipRepository = new RelationshipRepository();
