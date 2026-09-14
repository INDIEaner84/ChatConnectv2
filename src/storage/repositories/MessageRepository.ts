import { IMessageRepository } from '@/runtime/interfaces/repositories';
import { MessageEntity, MessageLifecycleState } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class MessageRepository implements IMessageRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<MessageEntity | null> {
    return this.db.get<MessageEntity>('messages', id);
  }

  public async getAll(): Promise<MessageEntity[]> {
    return this.db.getAll<MessageEntity>('messages');
  }

  public async save(item: MessageEntity): Promise<void> {
    // Idempotency check: if an identical message exists by id or syncHash, merge rather than duplicate
    const existing = await this.getByIdempotency(item.id, item.syncHash);
    if (existing) {
      // Retain already progressed lifecycle status if incoming is earlier
      const lifecycleWeight: Record<MessageLifecycleState, number> = {
        queued: 0,
        sent: 1,
        delivered: 2,
        read: 3,
        failed: 0,
      };

      const existingWeight = lifecycleWeight[existing.status] || 0;
      const incomingWeight = lifecycleWeight[item.status] || 0;
      const finalStatus = incomingWeight >= existingWeight ? item.status : existing.status;

      const merged: MessageEntity = {
        ...existing,
        ...item,
        status: finalStatus,
        deliveredAt: item.deliveredAt || existing.deliveredAt,
        readAt: item.readAt || existing.readAt,
      };
      await this.db.put('messages', merged);
      return;
    }

    await this.db.put('messages', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('messages', id);
  }

  public async count(): Promise<number> {
    return this.db.count('messages');
  }

  public async getByConversationId(conversationId: string, limit = 100): Promise<MessageEntity[]> {
    const all = await this.getAll();
    return all
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-limit);
  }

  public async getPendingMessages(): Promise<MessageEntity[]> {
    const all = await this.getAll();
    return all.filter((m) => m.status === 'queued' || m.status === 'failed');
  }

  public async updateStatus(messageId: string, status: MessageLifecycleState): Promise<void> {
    const msg = await this.getById(messageId);
    if (msg) {
      msg.status = status;
      if (status === 'delivered' && !msg.deliveredAt) msg.deliveredAt = Date.now();
      if (status === 'read' && !msg.readAt) msg.readAt = Date.now();
      await this.save(msg);
    }
  }

  public async getByIdempotency(id: string, syncHash?: string): Promise<MessageEntity | null> {
    const byId = await this.getById(id);
    if (byId) return byId;

    if (syncHash) {
      const all = await this.getAll();
      const byHash = all.find((m) => m.syncHash === syncHash);
      if (byHash) return byHash;
    }

    return null;
  }
}

export const messageRepository = new MessageRepository();
