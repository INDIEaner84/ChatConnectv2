import { IGroupRepository } from '@/runtime/interfaces/repositories';
import { GroupEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class GroupRepository implements IGroupRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<GroupEntity | null> {
    return this.db.get<GroupEntity>('groups', id);
  }

  public async getAll(): Promise<GroupEntity[]> {
    return this.db.getAll<GroupEntity>('groups');
  }

  public async save(item: GroupEntity): Promise<void> {
    await this.db.put('groups', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('groups', id);
  }

  public async count(): Promise<number> {
    return this.db.count('groups');
  }

  public async getGroupsForUser(userId: string): Promise<GroupEntity[]> {
    const all = await this.getAll();
    return all.filter((g) => g.memberIds.includes(userId) || g.ownerId === userId);
  }
}

export const groupRepository = new GroupRepository();
