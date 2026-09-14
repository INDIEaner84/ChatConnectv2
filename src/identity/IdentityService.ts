/**
 * Identity Service for Chat Connect / MUSCAL.
 * Manages separate User and Device identities.
 * Decoupled completely from transport layers (WebRTC, WebSocket, Syncthing).
 */

import { UserEntity, DeviceEntity } from '@/storage/types';
import { userRepository } from '@/storage/repositories/UserRepository';
import { deviceRepository } from '@/storage/repositories/DeviceRepository';
import { keyStore } from '@/security/KeyStore';
import { logger } from '@/core/logging/Logger';
import { eventBus, AppEvents } from '@/core/events/EventBus';

export interface IIdentityService {
  initializeIdentity(preferredDisplayName?: string): Promise<{ user: UserEntity; device: DeviceEntity }>;
  getCurrentUser(): Promise<UserEntity | null>;
  getCurrentDevice(): Promise<DeviceEntity | null>;
  updateUserProfile(updates: Partial<Pick<UserEntity, 'displayName' | 'avatar' | 'privacySettings'>>): Promise<UserEntity>;
  signPayload(data: string | Uint8Array): Promise<string>;
  verifyPeerIdentity(publicIdentity: string, data: string | Uint8Array, signature: string): Promise<boolean>;
}

export class IdentityService implements IIdentityService {
  private currentUser: UserEntity | null = null;
  private currentDevice: DeviceEntity | null = null;
  private initPromise: Promise<{ user: UserEntity; device: DeviceEntity }> | null = null;

  public async initializeIdentity(
    preferredDisplayName?: string
  ): Promise<{ user: UserEntity; device: DeviceEntity }> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      logger.info('IdentityService', 'Initializing local-first cryptographic identity');

      // 1. Initialize WebCrypto KeyStore (generates or loads keypair)
      const publicIdentity = await keyStore.initialize();

      // 2. Check for existing User Identity
      let user = await userRepository.getCurrentUser();
      const now = Date.now();

      if (!user) {
        // Create new user identity
        const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
        const displayName = preferredDisplayName || 'User_' + userId.substring(4, 8);

        user = {
          id: userId,
          displayName,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`,
          publicIdentity,
          capabilities: ['messaging:v1', 'p2p:webrtc', 'offline:storage', 'qr:v1'],
          privacySettings: {
            allowQrDiscovery: true,
            shareOnlineStatus: true,
            allowDirectInvites: true,
          },
          createdAt: now,
          updatedAt: now,
        };

        await userRepository.save(user);
        logger.info('IdentityService', `Created fresh user identity: ${user.id} (${user.displayName})`);
      } else if (user.publicIdentity !== publicIdentity) {
        // Sync public identity if keys were regenerated
        user.publicIdentity = publicIdentity;
        user.updatedAt = now;
        await userRepository.save(user);
      }

      // 3. Check for separate Device Identity
      let device = await deviceRepository.getCurrentDevice();
      if (!device) {
        const deviceId = 'dev_' + Math.random().toString(36).substring(2, 11);
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeJS';
        const platform = typeof navigator !== 'undefined' ? navigator.platform : 'Server';
        const isStandalone =
          typeof window !== 'undefined' &&
          (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true);

        device = {
          id: deviceId,
          userId: user.id,
          deviceName: isStandalone ? 'Chat Connect App' : 'Browser Web Client',
          deviceType: isStandalone ? 'pwa-standalone' : 'desktop',
          capabilities: ['webrtc', 'indexeddb', 'service-worker', 'crypto-p256'],
          metadata: {
            userAgent,
            platform,
            isStandalone,
            registeredAt: now,
            lastSeenAt: now,
          },
        };

        await deviceRepository.save(device);
        logger.info('IdentityService', `Registered separate device identity: ${device.id}`);
      } else {
        device.metadata.lastSeenAt = now;
        await deviceRepository.save(device);
      }

      this.currentUser = user;
      this.currentDevice = device;

      eventBus.emit(AppEvents.IDENTITY_INITIALIZED, { user, device });
      return { user, device };
    })();

    return this.initPromise;
  }

  public async getCurrentUser(): Promise<UserEntity | null> {
    if (this.currentUser) return this.currentUser;
    this.currentUser = await userRepository.getCurrentUser();
    return this.currentUser;
  }

  public async getCurrentDevice(): Promise<DeviceEntity | null> {
    if (this.currentDevice) return this.currentDevice;
    this.currentDevice = await deviceRepository.getCurrentDevice();
    return this.currentDevice;
  }

  public async updateUserProfile(
    updates: Partial<Pick<UserEntity, 'displayName' | 'avatar' | 'privacySettings'>>
  ): Promise<UserEntity> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('Cannot update profile: No user identity found');
    }

    if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.privacySettings !== undefined) {
      user.privacySettings = { ...user.privacySettings, ...updates.privacySettings };
    }
    user.updatedAt = Date.now();

    await userRepository.save(user);
    this.currentUser = user;
    eventBus.emit(AppEvents.IDENTITY_UPDATED, user);
    logger.info('IdentityService', 'Updated user profile details');
    return user;
  }

  public async signPayload(data: string | Uint8Array): Promise<string> {
    return keyStore.signData(data);
  }

  public async verifyPeerIdentity(
    publicIdentity: string,
    data: string | Uint8Array,
    signature: string
  ): Promise<boolean> {
    return keyStore.verifySignature(publicIdentity, data, signature);
  }
}

export const identityService = new IdentityService();
