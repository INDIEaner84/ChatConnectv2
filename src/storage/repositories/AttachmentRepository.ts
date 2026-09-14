import { IAttachmentRepository } from '@/runtime/interfaces/repositories';
import { AttachmentEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class AttachmentRepository implements IAttachmentRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<AttachmentEntity | null> {
    return this.db.get<AttachmentEntity>('attachments', id);
  }

  public async getAll(): Promise<AttachmentEntity[]> {
    return this.db.getAll<AttachmentEntity>('attachments');
  }

  public async save(item: AttachmentEntity): Promise<void> {
    await this.db.put('attachments', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('attachments', id);
  }

  public async count(): Promise<number> {
    return this.db.count('attachments');
  }

  public async getByHash(hash: string): Promise<AttachmentEntity | null> {
    const all = await this.getAll();
    return all.find((a) => a.hash === hash) || null;
  }
}

export const attachmentRepository = new AttachmentRepository();
