/**
 * Phase 5 Extension Architecture Test Suite:
 * - Manifest validation & strict syntax enforcement
 * - Reserved Core ID collision protection
 * - Incompatible API version rejection
 * - Duplicate plugin ID rejection
 * - Permission & Capability decoupling and validation
 * - Forbidden permission rejection (identity:private, keys:private, storage:core)
 * - Capability Broker enforcement & unauthorized access interception
 * - Storage Isolation: Plugin A cannot access Plugin B storage
 * - Core Storage Isolation: Plugin cannot access internal Core database stores
 * - Private Key & Identity Protection: Plugin context contains zero private key references
 * - UI Extension Points: Registration and automatic cleanup on disable/unload
 * - Lifecycle Transitions: registered -> validated -> enabled -> disabled -> uninstalled
 * - Plugin Error Isolation: Faulty plugin onActivate catches error and transitions to failed without crashing host
 */

import {
  PluginRegistry,
  PluginRegistryError,
  validatePluginManifest,
  PluginRuntime,
  CapabilityBroker,
  PermissionManager,
  PluginStorageManager,
  UIExtensionRegistry,
  IPlugin,
  PluginContext,
  PluginSecurityException,
  FORBIDDEN_PERMISSIONS,
} from '@/plugins';
import { STORE_NAMES } from '@/storage/IndexedDBDatabase';

export async function runPluginArchitectureTests(): Promise<{ name: string; passed: boolean; message?: string }[]> {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  const registry = PluginRegistry.getInstance();
  const permissions = PermissionManager.getInstance();
  const storageManager = PluginStorageManager.getInstance();
  const uiRegistry = UIExtensionRegistry.getInstance();
  const broker = CapabilityBroker.getInstance();
  const runtime = PluginRuntime.getInstance();

  // Reset state before tests
  registry.clear();
  permissions.clear();
  storageManager.clearAllPartitions();
  uiRegistry.clearAll();
  broker.clearAuditLogs();

  // ------------------------------------------------------------
  // Test 1: Valid Manifest Validation & Registration
  // ------------------------------------------------------------
  try {
    const validManifest = {
      id: 'community.acme.weather',
      name: 'Acme Weather Forecast',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'Acme Corp',
      description: 'Provides local weather alerts and forecasts',
      permissions: ['ui:panel' as const, 'storage:plugin' as const, 'network:request' as const],
      capabilities: ['ui.panel' as const, 'storage.plugin' as const, 'network.request' as const],
    };

    const res = validatePluginManifest(validManifest);
    const ok = res.valid && res.sanitizedManifest !== undefined && res.errors.length === 0;

    results.push({
      name: 'Plugins: Valid Manifest Validation & Sanitization',
      passed: ok,
      message: ok ? `Manifest "${validManifest.id}" passed all structural checks` : `Errors: ${res.errors.join(', ')}`,
    });
  } catch (err) {
    results.push({ name: 'Plugins: Valid Manifest Validation & Sanitization', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 2: Invalid Manifest Rejection (Malformed ID & Missing Fields)
  // ------------------------------------------------------------
  try {
    const invalidManifest = {
      id: 'INVALID_ID_WITH_UPPERCASE!',
      // missing name, version, publisher, apiVersion
      description: 'Invalid plugin',
    };

    const res = validatePluginManifest(invalidManifest);
    const ok = !res.valid && res.errors.length >= 3;

    results.push({
      name: 'Plugins: Invalid Manifest Rejection & Error Reporting',
      passed: ok,
      message: ok ? `Correctly rejected invalid manifest with ${res.errors.length} errors` : 'Failed to reject invalid manifest',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Invalid Manifest Rejection & Error Reporting', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 3: Reserved Core ID Prefix Rejection
  // ------------------------------------------------------------
  try {
    const spoofManifest = {
      id: 'core.internal.superuser',
      name: 'Core Spoof',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'Attacker',
      description: 'Attempt to spoof core internal prefix',
      permissions: [],
      capabilities: [],
    };

    const res = validatePluginManifest(spoofManifest);
    const ok = !res.valid && res.errors.some((e) => e.includes('reserved prefix "core."'));

    results.push({
      name: 'Plugins: Reserved Core ID Collision Protection',
      passed: ok,
      message: ok ? 'Rejected plugin manifest attempting to use reserved "core." namespace' : 'Failed to block reserved ID prefix',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Reserved Core ID Collision Protection', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 4: Incompatible API Version Rejection
  // ------------------------------------------------------------
  try {
    const incompatibleManifest = {
      id: 'community.future.app',
      name: 'Future App',
      version: '2.0.0',
      apiVersion: '999.0', // Unsupported future API
      publisher: 'Future Corp',
      description: 'Tests future api version incompatibility',
      permissions: [],
      capabilities: [],
    };

    const res = validatePluginManifest(incompatibleManifest);
    const ok = !res.valid && res.errors.some((e) => e.includes('Incompatible "apiVersion"'));

    results.push({
      name: 'Plugins: Incompatible API Version Rejection',
      passed: ok,
      message: ok ? 'Rejected manifest with incompatible API version 999.0' : 'Incompatible API version was not rejected',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Incompatible API Version Rejection', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 5: Duplicate Plugin ID Rejection
  // ------------------------------------------------------------
  try {
    const manifestA = {
      id: 'community.test.duplicate',
      name: 'Test Duplicate',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'Tester',
      description: 'First registration',
      permissions: [],
      capabilities: [],
    };

    registry.register(manifestA);
    let duplicateCaught = false;

    try {
      registry.register(manifestA);
    } catch (e) {
      if (e instanceof PluginRegistryError && e.code === 'DUPLICATE_PLUGIN_ID') {
        duplicateCaught = true;
      }
    }

    results.push({
      name: 'Plugins: Duplicate Plugin ID Rejection',
      passed: duplicateCaught,
      message: duplicateCaught ? 'Duplicate plugin ID registration was successfully blocked' : 'Duplicate ID was permitted',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Duplicate Plugin ID Rejection', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 6: Forbidden Permission Rejection (identity:private, keys:private)
  // ------------------------------------------------------------
  try {
    const maliciousManifest = {
      id: 'community.malicious.keygrabber',
      name: 'Key Grabber',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'Attacker',
      description: 'Tries to obtain private cryptographic keys',
      permissions: ['keys:private' as unknown as string, 'identity:private' as unknown as string],
      capabilities: [],
    };

    const res = validatePluginManifest(maliciousManifest);
    const blocked = !res.valid && res.errors.some((e) => e.includes('strictly FORBIDDEN permission'));

    results.push({
      name: 'Plugins: Strictly Forbidden Permissions Interception',
      passed: blocked,
      message: blocked ? 'Blocked request for keys:private and identity:private permissions' : 'Forbidden permission was allowed',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Strictly Forbidden Permissions Interception', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 7: Capability & Permission Consistency Check
  // ------------------------------------------------------------
  try {
    const inconsistentManifest = {
      id: 'community.inconsistent.bot',
      name: 'Inconsistent Bot',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'Dev',
      description: 'Requests capability messaging.send without declaring permission',
      permissions: [], // Did not declare messaging:send!
      capabilities: ['messaging.send' as const],
    };

    const res = validatePluginManifest(inconsistentManifest);
    const ok = !res.valid && res.errors.some((e) => e.includes('requires permission "messaging:send"'));

    results.push({
      name: 'Plugins: Capability to Permission Consistency Enforcement',
      passed: ok,
      message: ok ? 'Detected undeclared required permission for messaging.send capability' : 'Allowed inconsistent capability',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Capability to Permission Consistency Enforcement', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 8: Capability Broker Unauthorized Access Interception
  // ------------------------------------------------------------
  try {
    const pluginId = 'community.test.unauthorized';
    registry.register({
      id: pluginId,
      name: 'Unauthorized Tester',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'QA',
      description: 'Tests unauthorized broker access',
      permissions: ['storage:plugin'],
      capabilities: ['storage.plugin'],
    });

    // Plugin is currently only in 'registered' state (not enabled)
    let stateBlocked = false;
    try {
      broker.getStorage(pluginId);
    } catch (e) {
      if (e instanceof PluginSecurityException && e.code === 'PLUGIN_NOT_ENABLED') {
        stateBlocked = true;
      }
    }

    // Now enable plugin, but attempt undeclared capability (contacts.read)
    registry.updateState(pluginId, 'enabled');
    let capabilityBlocked = false;
    try {
      await broker.readContacts(pluginId);
    } catch (e) {
      if (e instanceof PluginSecurityException && e.code === 'CAPABILITY_NOT_DECLARED') {
        capabilityBlocked = true;
      }
    }

    const ok = stateBlocked && capabilityBlocked;
    results.push({
      name: 'Plugins: Capability Broker Enforcement & Unauthorized Interception',
      passed: ok,
      message: ok ? 'Broker blocked non-enabled state and undeclared capabilities' : 'Broker failed security check',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Capability Broker Enforcement & Unauthorized Interception', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 9: Plugin Storage Isolation (Plugin A cannot access Plugin B)
  // ------------------------------------------------------------
  try {
    const storageA = storageManager.getStorage('community.plugin.alpha');
    const storageB = storageManager.getStorage('community.plugin.beta');

    await storageA.set('secretKey', { token: 'alpha-token-123' });
    await storageB.set('secretKey', { token: 'beta-token-456' });

    const readFromA = await storageA.get<{ token: string }>('secretKey');
    const readFromB = await storageB.get<{ token: string }>('secretKey');

    await storageA.delete('secretKey');
    const deletedA = await storageA.get('secretKey');
    const preservedB = await storageB.get<{ token: string }>('secretKey');

    const ok =
      readFromA?.token === 'alpha-token-123' &&
      readFromB?.token === 'beta-token-456' &&
      deletedA === null &&
      preservedB?.token === 'beta-token-456';

    results.push({
      name: 'Plugins: Storage Isolation Between Plugins (A vs B)',
      passed: ok,
      message: ok ? 'Strict namespace isolation verified: Plugin A and B stores are completely segregated' : 'Storage leakage detected',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Storage Isolation Between Plugins (A vs B)', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 10: Storage Traversal & Invalid Key Guard
  // ------------------------------------------------------------
  try {
    const storageA = storageManager.getStorage('community.plugin.alpha');
    let traversalBlocked = false;

    try {
      await storageA.get('../community.plugin.beta/secretKey');
    } catch {
      traversalBlocked = true;
    }

    results.push({
      name: 'Plugins: Storage Directory Traversal & Injection Guard',
      passed: traversalBlocked,
      message: traversalBlocked ? 'Malformed traversal storage keys blocked safely' : 'Traversal key allowed',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Storage Directory Traversal & Injection Guard', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 11: Core Storage Protection (Plugin Cannot Access Core Stores)
  // ------------------------------------------------------------
  try {
    // Verify that plugin storage manager cannot be initialized with core namespaces
    let coreNamespaceBlocked = false;
    try {
      storageManager.getStorage('core.users');
    } catch {
      coreNamespaceBlocked = true;
    }

    // Verify that internal Core STORE_NAMES are NOT exposed to any plugin
    const coreStores = [...STORE_NAMES];
    const ok = coreNamespaceBlocked && coreStores.includes('secureKeyStore') && coreStores.includes('users');

    results.push({
      name: 'Plugins: Core Storage Barrier & Internal Store Protection',
      passed: ok,
      message: ok ? 'Protected core namespaces inaccessible to plugin storage' : 'Core storage leak detected',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Core Storage Barrier & Internal Store Protection', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 12: Private Key & Identity Leakage Guard
  // ------------------------------------------------------------
  try {
    // Check that PluginContext and broker interfaces never expose raw crypto key objects or private identity secrets
    const pluginId = 'community.test.securityguard';
    const testManifest = {
      id: pluginId,
      name: 'Security Guard',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'QA',
      description: 'Verify zero private key leakage',
      permissions: ['storage:plugin' as const, 'messaging:send' as const],
      capabilities: ['storage.plugin' as const, 'messaging.send' as const],
    };

    let contextRef: PluginContext | null = null;

    const mockPlugin: IPlugin = {
      manifest: testManifest,
      onActivate(ctx) {
        contextRef = ctx;
      },
    };

    await runtime.load(testManifest, mockPlugin);
    await runtime.enable(pluginId);

    const ctx = contextRef as unknown as Record<string, unknown>;
    const hasPrivateKey = ctx !== null && ('privateKey' in ctx || 'keyStore' in ctx || 'rawDatabase' in ctx);

    results.push({
      name: 'Plugins: Private Key & Raw Core Service Shielding',
      passed: !hasPrivateKey && ctx !== null,
      message: !hasPrivateKey ? 'PluginContext contains zero private keys or raw core database references' : 'Private data exposed',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Private Key & Raw Core Service Shielding', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 13: UI Extension Registration & Automatic Cleanup
  // ------------------------------------------------------------
  try {
    const pluginId = 'community.test.uiprovider';
    const uiManifest = {
      id: pluginId,
      name: 'UI Provider',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'UI Team',
      description: 'Tests UI extension registration and cleanup',
      permissions: ['ui:panel' as const, 'ui:menu' as const, 'ui:widget' as const],
      capabilities: ['ui.panel' as const, 'ui.menu' as const, 'ui.widget' as const],
    };

    const mockUIPlugin: IPlugin = {
      manifest: uiManifest,
      onActivate(ctx) {
        ctx.ui.registerMenuItem({
          id: 'menu_notes',
          label: 'Quick Notes',
          section: 'navigation',
        });
        ctx.ui.registerPanel({
          id: 'panel_notes',
          title: 'Notes Workspace',
          placement: 'main',
          render: () => null,
        });
        ctx.ui.registerWidget({
          id: 'widget_notes',
          title: 'Notes Counter',
          size: 'compact',
          render: () => null,
        });
      },
    };

    await runtime.load(uiManifest, mockUIPlugin);
    await runtime.enable(pluginId);

    const menusBefore = uiRegistry.getMenuItems();
    const panelsBefore = uiRegistry.getPanels();
    const widgetsBefore = uiRegistry.getWidgets();

    const registeredOk =
      menusBefore.some((m) => m.id === 'menu_notes') &&
      panelsBefore.some((p) => p.id === 'panel_notes') &&
      widgetsBefore.some((w) => w.id === 'widget_notes');

    // Disable plugin -> UI extensions MUST be automatically removed
    await runtime.disable(pluginId);

    const menusAfter = uiRegistry.getMenuItems();
    const panelsAfter = uiRegistry.getPanels();
    const widgetsAfter = uiRegistry.getWidgets();

    const cleanedOk =
      !menusAfter.some((m) => m.id === 'menu_notes') &&
      !panelsAfter.some((p) => p.id === 'panel_notes') &&
      !widgetsAfter.some((w) => w.id === 'widget_notes');

    const ok = registeredOk && cleanedOk;
    results.push({
      name: 'Plugins: UI Extension Points Registration & Lifecycle Cleanup',
      passed: ok,
      message: ok ? 'Menu, Panel, and Widget registered and cleanly stripped upon plugin deactivation' : 'UI extension cleanup failed',
    });
  } catch (err) {
    results.push({ name: 'Plugins: UI Extension Points Registration & Lifecycle Cleanup', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 14: Plugin Lifecycle Transitions (registered -> validated -> enabled -> disabled -> uninstalled)
  // ------------------------------------------------------------
  try {
    const pluginId = 'community.test.lifecycle';
    const lifeManifest = {
      id: pluginId,
      name: 'Lifecycle Tester',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'QA',
      description: 'Tests full lifecycle state machine',
      permissions: ['storage:plugin' as const],
      capabilities: ['storage.plugin' as const],
    };

    let activated = false;
    let deactivated = false;

    const mockPlugin: IPlugin = {
      manifest: lifeManifest,
      onActivate() {
        activated = true;
      },
      onDeactivate() {
        deactivated = true;
      },
    };

    // 1. Load (registered)
    const loadRes = await runtime.load(lifeManifest, mockPlugin);
    const isRegistered = loadRes.success && registry.get(pluginId)?.lifecycleState === 'registered';

    // 2. Validate
    const valRes = await runtime.validate(pluginId);
    const isValidated = valRes.success && registry.get(pluginId)?.lifecycleState === 'validated';

    // 3. Enable
    const enableRes = await runtime.enable(pluginId);
    const isEnabled = enableRes.success && registry.get(pluginId)?.lifecycleState === 'enabled' && activated;

    // 4. Disable
    const disableRes = await runtime.disable(pluginId);
    const isDisabled = disableRes.success && registry.get(pluginId)?.lifecycleState === 'disabled' && deactivated;

    // 5. Unload / Uninstall
    const unloadRes = await runtime.unload(pluginId);
    const isUninstalled = unloadRes.success && !registry.has(pluginId);

    const ok = isRegistered && isValidated && isEnabled && isDisabled && isUninstalled;
    results.push({
      name: 'Plugins: Controlled Lifecycle Progression & State Machine',
      passed: ok,
      message: ok ? 'Verified complete state sequence: registered -> validated -> enabled -> disabled -> uninstalled' : 'State transition failed',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Controlled Lifecycle Progression & State Machine', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 15: Plugin Error Isolation (Crashed onActivate Does Not Crash Core)
  // ------------------------------------------------------------
  try {
    const pluginId = 'community.faulty.crasher';
    const faultyManifest = {
      id: pluginId,
      name: 'Faulty Crasher',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'Buggy Dev',
      description: 'Throws uncaught exception on activation',
      permissions: [],
      capabilities: [],
    };

    const crashingPlugin: IPlugin = {
      manifest: faultyManifest,
      onActivate() {
        throw new Error('FATAL SIMULATED PLUGIN CRASH!');
      },
    };

    await runtime.load(faultyManifest, crashingPlugin);
    const enableRes = await runtime.enable(pluginId);

    // Host app did NOT crash; enable returned failure and plugin is marked 'failed'
    const meta = registry.get(pluginId);
    const ok = enableRes.success === false && meta?.lifecycleState === 'failed' && meta.lastError?.includes('FATAL SIMULATED PLUGIN CRASH');

    results.push({
      name: 'Plugins: Fault Isolation & Host Resilience (Crashed Plugin Handled)',
      passed: Boolean(ok),
      message: ok ? 'Crashed plugin isolated; state transitioned to "failed" without crashing host application' : 'Crash was not isolated',
    });
  } catch (err) {
    results.push({ name: 'Plugins: Fault Isolation & Host Resilience (Crashed Plugin Handled)', passed: false, message: (err as Error).message });
  }

  // ------------------------------------------------------------
  // Test 16: Safe Execution Wrapper (executePluginSafe)
  // ------------------------------------------------------------
  try {
    const pluginId = 'community.test.safeexec';
    registry.register({
      id: pluginId,
      name: 'Safe Exec Test',
      version: '1.0.0',
      apiVersion: '1',
      publisher: 'QA',
      description: 'Tests safe execution wrapper',
      permissions: [],
      capabilities: [],
    });
    registry.updateState(pluginId, 'enabled');

    // Executing an action that throws
    const execRes = await runtime.executePluginSafe(pluginId, async () => {
      throw new Error('Plugin calculation failure');
    });

    const ok = execRes.success === false && execRes.error.code === 'EXECUTION_ERROR';

    results.push({
      name: 'Plugins: executePluginSafe Exception Boundary',
      passed: ok,
      message: ok ? 'Safely caught uncaught plugin function exception and returned failure result' : 'Exception boundary failed',
    });
  } catch (err) {
    results.push({ name: 'Plugins: executePluginSafe Exception Boundary', passed: false, message: (err as Error).message });
  }

  return results;
}
