/**
 * MUSCAL / Chat Connect Extension Architecture Foundation.
 * 
 * Public Extension API and Runtime Exports.
 * 
 * Architectural Layer:
 * CLOSED CORE -> PUBLIC EXTENSION API -> CAPABILITY BROKER -> PLUGIN RUNTIME -> COMMUNITY EXTENSIONS
 */

// API Contracts
export * from './api/Plugin';
export * from './api/PluginManifest';
export * from './api/PluginContext';
export * from './api/PluginCapability';
export * from './api/PluginPermission';
export * from './api/PluginVersion';
export * from './api/PluginResult';
export * from './api/MuscalExtensionContracts';

// Registry
export * from './registry/PluginRegistry';
export * from './registry/PluginMetadata';

// Security
export * from './security/CapabilityBroker';
export * from './security/PermissionManager';
export * from './security/PluginSecurityPolicy';

// Storage
export * from './storage/PluginStorage';

// UI Extension Points
export * from './ui/UIExtensionPoint';
export * from './ui/PluginMenuItem';
export * from './ui/PluginPanel';
export * from './ui/PluginWidget';

// Runtime
export * from './runtime/PluginRuntime';
