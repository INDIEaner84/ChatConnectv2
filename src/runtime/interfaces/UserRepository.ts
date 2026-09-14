/**
 * Runtime Interface for UserRepository.
 * Manages local user profile persistence, identity lookup, and user lifecycle.
 */

import { UserEntity } from '@/storage/types';
import { IRepository } from './repositories';

export interface IUserRepository extends IRepository<UserEntity> {
  /**
   * Retrieves the currently active local user profile.
   */
  getCurrentUser(): Promise<UserEntity | null>;

  /**
   * Saves or updates a user entity.
   */
  save(user: UserEntity): Promise<void>;

  /**
   * Retrieves a user entity by unique user identifier.
   */
  getById(id: string): Promise<UserEntity | null>;

  /**
   * Returns all stored user entities.
   */
  getAll(): Promise<UserEntity[]>;

  /**
   * Removes a user profile by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Returns the count of registered user entities.
   */
  count(): Promise<number>;
}

export type UserRepository = IUserRepository;
