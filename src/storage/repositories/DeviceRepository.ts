import { IDeviceRepository } from '@/runtime/interfaces/repositories';
import { DeviceEntity } from '@/storage/types';
import { IndexedDBDatabase, localDb } from '@/storage/IndexedDBDatabase';

export class DeviceRepository implements IDeviceRepository {
  constructor(private db: IndexedDBDatabase = localDb) {}

  public async getById(id: string): Promise<DeviceEntity | null> {
    return this.db.get<DeviceEntity>('devices', id);
  }

  public async getAll(): Promise<DeviceEntity[]> {
    return this.db.getAll<DeviceEntity>('devices');
  }

  public async save(item: DeviceEntity): Promise<void> {
    await this.db.put('devices', item);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete('devices', id);
  }

  public async count(): Promise<number> {
    return this.db.count('devices');
  }

  public async getCurrentDevice(): Promise<DeviceEntity | null> {
    const devices = await this.getAll();
    return devices.length > 0 ? devices[0] : null;
  }
}

export const deviceRepository = new DeviceRepository();
