/**
 * Master Verification & Acceptance Test Gate Runner.
 * Executes Phase 1 (Foundation), Phase 2 (Identity), Phase 3 (QR), Phase 4 (Messenger Core), and Chaos tests.
 */

import { runFoundationTests } from '@/tests/unit/foundation.test';
import { runIdentitySecurityTests } from '@/tests/unit/identity.test';
import { runQRSecurityTests } from '@/tests/unit/qr.test';
import { runMessengerCoreTests } from '@/tests/unit/messenger.test';
import { runChaosAndResilienceTests } from '@/tests/unit/chaos.test';
import { runPluginArchitectureTests } from '@/tests/unit/plugins.test';
import { logger } from '@/core/logging/Logger';

export interface TestResultItem {
  name: string;
  passed: boolean;
  message?: string;
  phase: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResultItem[];
  allPassed: boolean;
}

export async function runAllTestGates(): Promise<TestSuiteSummary> {
  const startTime = Date.now();
  logger.info('TestRunner', '=== Commencing Chat Connect Verification Suite ===');

  const aggregated: TestResultItem[] = [];

  // Phase 1: Foundation
  const foundation = await runFoundationTests();
  foundation.forEach((r) => aggregated.push({ ...r, phase: 'Phase 1: Foundation' }));

  // Phase 2: Identity
  const identity = await runIdentitySecurityTests();
  identity.forEach((r) => aggregated.push({ ...r, phase: 'Phase 2: Identity' }));

  // Phase 3: QR Peer Invitation
  const qr = await runQRSecurityTests();
  qr.forEach((r) => aggregated.push({ ...r, phase: 'Phase 3: QR Invitation' }));

  // Phase 4: Messenger Core
  const messenger = await runMessengerCoreTests();
  messenger.forEach((r) => aggregated.push({ ...r, phase: 'Phase 4: Messenger Core' }));

  // Phase 5: Extension Architecture Foundation
  const plugins = await runPluginArchitectureTests();
  plugins.forEach((r) => aggregated.push({ ...r, phase: 'Phase 5: Extension Architecture' }));

  // Chaos & Resilience
  const chaos = await runChaosAndResilienceTests();
  chaos.forEach((r) => aggregated.push({ ...r, phase: 'Chaos & Resilience' }));

  const passedCount = aggregated.filter((r) => r.passed).length;
  const failedCount = aggregated.length - passedCount;
  const durationMs = Date.now() - startTime;

  logger.info('TestRunner', `=== Test Suite Completed in ${durationMs}ms: ${passedCount}/${aggregated.length} Passed ===`);

  return {
    total: aggregated.length,
    passed: passedCount,
    failed: failedCount,
    durationMs,
    results: aggregated,
    allPassed: failedCount === 0,
  };
}
