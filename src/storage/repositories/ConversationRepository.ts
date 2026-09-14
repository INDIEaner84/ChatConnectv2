import { IConversationRepository } from '@/runtime/interfaces/repositories';
import { ConversationEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class ConversationRepository implements IConversationRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<ConversationEntity | null> {
    return this.db.get<ConversationEntity>('conversations', id);
  }

  public async getAll(): Promise<ConversationEntity[]> {
    return this.db.getAll<ConversationEntity>('conversations');
  }

  public async save(item: ConversationEntity): Promise<void> {
    await this.db.put('conversations', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('conversations', id);
  }

  public async count(): Promise<number> {
    return this.db.count('conversations');
  }

  public async getRecent(limit = 50): Promise<ConversationEntity[]> {
    const all = await this.getAll();
    return all
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
      .slice(0, limit);
  }
}

export const conversationRepository = new ConversationRepository();
