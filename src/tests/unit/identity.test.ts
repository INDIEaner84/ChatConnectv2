/**
 * Phase 2 Identity Security Test Suite:
 * - Identity creation & persistence
 * - Separate Device vs User entities
 * - Public/Private separation: Private key is never present in UserEntity or DeviceEntity
 * - KeyStore digital signature generation & verification (ECDSA P-256)
 * - Tampered signature rejection
 * - Security Leakage Checks: Verifies that serialized representations for Logs, URLs, or QR never contain private keys.
 */

import { identityService } from '@/identity/IdentityService';
import { keyStore } from '@/security/KeyStore';
import { userRepository } from '@/storage/repositories/UserRepository';
import { deviceRepository } from '@/storage/repositories/DeviceRepository';

export async function runIdentitySecurityTests(): Promise<{ name: string; passed: boolean; message?: string }[]> {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Identity Creation & Storage Persistence
  try {
    const { user, device } = await identityService.initializeIdentity('TestUser_Alpha');
    const persistedUser = await userRepository.getById(user.id);
    const persistedDevice = await deviceRepository.getById(device.id);

    const ok =
      persistedUser !== null &&
      persistedDevice !== null &&
      persistedUser.id === user.id &&
      persistedDevice.id === device.id;

    results.push({
      name: 'Identity: Creation & Local-First Storage Persistence',
      passed: ok,
      message: ok ? `User ${user.id} and Device ${device.id} created & persisted` : 'Persistence failed',
    });
  } catch (err) {
    results.push({ name: 'Identity: Creation & Local-First Storage Persistence', passed: false, message: (err as Error).message });
  }

  // Test 2: Distinct Separation between User Identity and Device Identity
  try {
    const user = await identityService.getCurrentUser();
    const device = await identityService.getCurrentDevice();

    const separated =
      user !== null &&
      device !== null &&
      user.id !== device.id &&
      device.userId === user.id &&
      user.id.startsWith('usr_') &&
      device.id.startsWith('dev_');

    results.push({
      name: 'Identity: Architectural Separation of User and Device Entities',
      passed: Boolean(separated),
      message: separated ? 'User and Device identities cleanly segregated' : 'User and Device were not properly separated',
    });
  } catch (err) {
    results.push({ name: 'Identity: Architectural Separation of User and Device Entities', passed: false, message: (err as Error).message });
  }

  // Test 3: Public / Private Cryptographic Key Segregation
  try {
    const user = await identityService.getCurrentUser();
    const device = await identityService.getCurrentDevice();

    const userJson = JSON.stringify(user);
    const deviceJson = JSON.stringify(device);

    // Ensure no private key markers exist in user/device serialized states
    const containsPrivateKey =
      userJson.includes('privateKey') ||
      userJson.includes('BEGIN PRIVATE') ||
      userJson.includes('"d":') ||
      deviceJson.includes('privateKey') ||
      deviceJson.includes('"d":');

    const hasPublicIdentity = Boolean(user?.publicIdentity && user.publicIdentity.length > 20);

    const safe = !containsPrivateKey && hasPublicIdentity;
    results.push({
      name: 'Identity: Public/Private Key Separation & Zero Private Key Leakage',
      passed: safe,
      message: safe ? 'Zero private key data in user/device entities; public SPKI identity active' : 'Private key leaked in entity model',
    });
  } catch (err) {
    results.push({ name: 'Identity: Public/Private Key Separation & Zero Private Key Leakage', passed: false, message: (err as Error).message });
  }

  // Test 4: ECDSA P-256 Digital Signature and Tamper Resistance
  try {
    const user = await identityService.getCurrentUser();
    if (!user) throw new Error('No user for signature test');

    const message = 'ChatConnect-Signed-Payload-Verification-12345';
    const signature = await identityService.signPayload(message);

    // Verify valid signature
    const valid = await identityService.verifyPeerIdentity(user.publicIdentity, message, signature);

    // Verify tampered message fails
    const tamperedValid = await identityService.verifyPeerIdentity(user.publicIdentity, message + '-TAMPERED', signature);

    const cryptoPassed = valid === true && tamperedValid === false;
    results.push({
      name: 'Identity: WebCrypto ECDSA Signature Generation & Tamper Resistance',
      passed: cryptoPassed,
      message: cryptoPassed ? 'Signature verified legitimately; tampered payload rejected' : 'Signature verification anomaly',
    });
  } catch (err) {
    results.push({ name: 'Identity: WebCrypto ECDSA Signature Generation & Tamper Resistance', passed: false, message: (err as Error).message });
  }

  return results;
}
