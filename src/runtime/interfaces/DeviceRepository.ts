/**
 * Runtime Interface for DeviceRepository.
 * Manages device identity lifecycle, platform profiles, and multi-device pairings.
 */

import { DeviceEntity } from '@/storage/types';
import { IRepository } from './repositories';

export interface IDeviceRepository extends IRepository<DeviceEntity> {
  /**
   * Retrieves the current local device profile.
   */
  getCurrentDevice(): Promise<DeviceEntity | null>;

  /**
   * Returns all devices registered for a specific user ID.
   */
  getDevicesForUser?(userId: string): Promise<DeviceEntity[]>;

  /**
   * Updates last seen timestamp for a device.
   */
  updateLastSeen?(deviceId: string, timestamp?: number): Promise<void>;

  /**
   * Saves or updates a device entity.
   */
  save(device: DeviceEntity): Promise<void>;

  /**
   * Retrieves a device entity by unique device identifier.
   */
  getById(id: string): Promise<DeviceEntity | null>;

  /**
   * Returns all registered device entities.
   */
  getAll(): Promise<DeviceEntity[]>;

  /**
   * Removes a device entity by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Returns total count of registered devices.
   */
  count(): Promise<number>;
}

export type DeviceRepository = IDeviceRepository;
