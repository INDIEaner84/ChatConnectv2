import { IContactRepository } from '@/runtime/interfaces/repositories';
import { ContactEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class ContactRepository implements IContactRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<ContactEntity | null> {
    return this.db.get<ContactEntity>('contacts', id);
  }

  public async getAll(): Promise<ContactEntity[]> {
    return this.db.getAll<ContactEntity>('contacts');
  }

  public async save(item: ContactEntity): Promise<void> {
    await this.db.put('contacts', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('contacts', id);
  }

  public async count(): Promise<number> {
    return this.db.count('contacts');
  }

  public async getByPublicIdentity(publicIdentity: string): Promise<ContactEntity | null> {
    const all = await this.getAll();
    return all.find((c) => c.publicIdentity === publicIdentity) || null;
  }
}

export const contactRepository = new ContactRepository();
