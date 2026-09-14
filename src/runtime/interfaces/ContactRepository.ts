/**
 * Runtime Interface for ContactRepository.
 * Manages peer contacts, cached public identities, and peer verification metadata.
 */

import { ContactEntity } from '@/storage/types';
import { IRepository } from './repositories';

export interface IContactRepository extends IRepository<ContactEntity> {
  /**
   * Looks up a contact by their public identity key (e.g. SPKI Base64 string).
   */
  getByPublicIdentity(publicIdentity: string): Promise<ContactEntity | null>;

  /**
   * Looks up a contact by their peer user identifier.
   */
  getByPeerUserId?(peerUserId: string): Promise<ContactEntity | null>;

  /**
   * Searches contacts by name or identifier query.
   */
  search?(query: string): Promise<ContactEntity[]>;

  /**
   * Saves or updates a contact entity.
   */
  save(contact: ContactEntity): Promise<void>;

  /**
   * Retrieves a contact by unique contact ID.
   */
  getById(id: string): Promise<ContactEntity | null>;

  /**
   * Returns all stored contacts.
   */
  getAll(): Promise<ContactEntity[]>;

  /**
   * Deletes a contact record by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Returns total count of contacts.
   */
  count(): Promise<number>;
}

export type ContactRepository = IContactRepository;
