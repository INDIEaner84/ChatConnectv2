import { IUserRepository } from '@/runtime/interfaces/repositories';
import { UserEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class UserRepository implements IUserRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<UserEntity | null> {
    return this.db.get<UserEntity>('users', id);
  }

  public async getAll(): Promise<UserEntity[]> {
    return this.db.getAll<UserEntity>('users');
  }

  public async save(item: UserEntity): Promise<void> {
    await this.db.put('users', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('users', id);
  }

  public async count(): Promise<number> {
    return this.db.count('users');
  }

  public async getCurrentUser(): Promise<UserEntity | null> {
    const users = await this.getAll();
    return users.length > 0 ? users[0] : null;
  }
}

export const userRepository = new UserRepository();
