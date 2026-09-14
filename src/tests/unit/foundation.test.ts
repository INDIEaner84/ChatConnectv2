/**
 * Phase 1 Foundation Test Suite:
 * - Version metadata validation
 * - Logging sanitization (no private key leaks)
 * - EventBus pub/sub
 * - IndexedDB storage persistence & transactions
 * - Error classes
 */

import { APP_VERSION_METADATA } from '@/core/versioning/version';
import { logger, sanitizeData } from '@/core/logging/Logger';
import { eventBus } from '@/core/events/EventBus';
import { localDb } from '@/storage/IndexedDBDatabase';
import { userRepository } from '@/storage/repositories/UserRepository';
import { deviceRepository } from '@/storage/repositories/DeviceRepository';
import { messageRepository } from '@/storage/repositories/MessageRepository';
import { appMetadataRepository } from '@/storage/repositories/AppMetadataRepository';

export async function runFoundationTests(): Promise<{ name: string; passed: boolean; message?: string }[]> {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Test 1: Version Metadata
  try {
    const valid = APP_VERSION_METADATA.version.startsWith('v0.') && Boolean(APP_VERSION_METADATA.protocolVersion);
    results.push({
      name: 'Foundation: Version & Protocol Metadata Validation',
      passed: valid,
      message: `Version: ${APP_VERSION_METADATA.version}, Protocol: ${APP_VERSION_METADATA.protocolVersion}`,
    });
  } catch (err) {
    results.push({ name: 'Foundation: Version & Protocol Metadata Validation', passed: false, message: (err as Error).message });
  }

  // Test 2: Logging Sanitization - Strict No Private Key Leakage
  try {
    const maliciousPayload = {
      user: 'alice',
      privateKey: 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgxyz...',
      secretToken: 'shhh-super-secret-1234',
      jwk: {
        kty: 'EC',
        crv: 'P-256',
        d: 'private_scalar_d_value_must_never_leak',
        x: 'public_x_coordinate',
      },
    };

    const sanitized = sanitizeData(maliciousPayload) as Record<string, unknown>;
    const leakCheck =
      sanitized.privateKey === '[REDACTED_CONFIDENTIAL]' &&
      sanitized.secretToken === '[REDACTED_CONFIDENTIAL]' &&
      (sanitized.jwk as Record<string, unknown>).d === '[REDACTED_CONFIDENTIAL]' &&
      (sanitized.jwk as Record<string, unknown>).x === 'public_x_coordinate';

    results.push({
      name: 'Foundation: Security Logger Private Key Sanitization',
      passed: leakCheck,
      message: leakCheck ? 'Sensitive fields redacted safely' : 'Failed to sanitize private keys',
    });
  } catch (err) {
    results.push({ name: 'Foundation: Security Logger Private Key Sanitization', passed: false, message: (err as Error).message });
  }

  // Test 3: EventBus Asynchronous Dispatch & Subscription
  try {
    let receivedPayload: string | null = null;
    const unsub = eventBus.on<string>('test:event', (data) => {
      receivedPayload = data;
    });

    await eventBus.emit('test:event', 'muscal-payload-ok');
    unsub();
    await eventBus.emit('test:event', 'should-not-receive');

    const busOk = receivedPayload === 'muscal-payload-ok';
    results.push({
      name: 'Foundation: Decoupled Typed EventBus Pub/Sub',
      passed: busOk,
      message: busOk ? 'Events dispatched and unsubscribed cleanly' : 'Payload mismatch or unsub failure',
    });
  } catch (err) {
    results.push({ name: 'Foundation: Decoupled Typed EventBus Pub/Sub', passed: false, message: (err as Error).message });
  }

  // Test 4: IndexedDB Storage CRUD & Transactions
  try {
    await localDb.init();

    // AppMetadata repository test
    const testKey = 'test_schema_check';
    await appMetadataRepository.set(testKey, { initialized: true, timestamp: 12345 });
    const fetched = await appMetadataRepository.get<{ initialized: boolean; timestamp: number }>(testKey);

    const storageOk = fetched !== null && fetched.initialized === true && fetched.timestamp === 12345;
    await appMetadataRepository.delete(testKey);

    results.push({
      name: 'Foundation: IndexedDB Storage Engine & Repository Persistence',
      passed: storageOk,
      message: storageOk ? 'Data persisted and queried successfully' : 'Retrieved value did not match',
    });
  } catch (err) {
    results.push({ name: 'Foundation: IndexedDB Storage Engine & Repository Persistence', passed: false, message: (err as Error).message });
  }

  return results;
}
