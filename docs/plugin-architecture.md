# MUSCAL / Chat Connect — Extension Architecture Foundation

## 1. Master Objective & Philosophy

Chat Connect is a Local-First, fully offline-capable, security-first PWA. In Phase 5, we establish an **Extension Architecture Foundation** that allows community and modular extensions without compromising the stability, cryptographic integrity, or local privacy of the Core.

### The Closed Core Principle
```
+-------------------------------------------------------------------------+
|                          COMMUNITY PLUGINS                              |
+-------------------------------------------------------------------------+
                                    |
                            [PluginContext]
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  PUBLIC PLUGIN EXTENSION API (v1.0.0)                   |
|       - Sanitized data models (SanitizedPeerContact, OutboundMessage)   |
|       - UI Extension Points (Menu, Panel, Widget)                       |
|       - Isolated Storage Namespace (IPluginStorage)                     |
+-------------------------------------------------------------------------+
                                    |
                        [CapabilityBroker Interceptor]
                         (Verifies Manifest & Policy)
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    PERMISSION MANAGER (Policy & Grants)                 |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                               CLOSED CORE                               |
|       - Cryptographic Identity & Private Key Storage (ECDSA P-256)      |
|       - Raw IndexedDB Database & Internal Collections                   |
|       - P2P WebSockets, WebRTC DataChannels, Encrypted Sessions        |
|       - Master Device & Contact Repositories                            |
+-------------------------------------------------------------------------+
```

Community code **NEVER** receives direct access to internal Core implementations.

### Why Plugin API ≠ Core API
1. **Security & Cryptographic Isolation**: Core handles private ECDSA keys, encryption seeds, and raw device identifiers. Exposing internal repositories or key stores to plugins would risk key extraction or session hijacking.
2. **Backwards Compatibility & Versioning Stability**: Internal Core implementations evolve frequently. By exposing a strictly versioned, stabilized public API contract (`CURRENT_PLUGIN_API_VERSION = "1.0.0"`), plugins do not break when internal databases are migrated or optimized.
3. **Fault Isolation**: A buggy or crashing plugin in the extension layer is intercepted by `PluginRuntime.executePluginSafe` and transitioned to `failed`, ensuring the host application and messaging remain 100% operational.

---

## 2. Directory Structure

```
src/plugins/
├── api/
│   ├── Plugin.ts                    # Main IPlugin contract
│   ├── PluginManifest.ts            # Manifest schema and strict validator
│   ├── PluginContext.ts             # Sandboxed context passed to onActivate
│   ├── PluginCapability.ts          # Capability keys and contract interfaces
│   ├── PluginPermission.ts          # Permission model and forbidden list
│   ├── PluginVersion.ts             # SemVer and API version compatibility
│   ├── PluginResult.ts              # Type-safe result envelope
│   └── MuscalExtensionContracts.ts  # Forward-compatible MUSCAL extension specs
├── registry/
│   ├── PluginRegistry.ts            # Central registry and identity separation
│   └── PluginMetadata.ts            # Metadata and lifecycle state tracking
├── security/
│   ├── CapabilityBroker.ts          # Access broker and permission interceptor
│   ├── PermissionManager.ts         # Permission authority and grant management
│   └── PluginSecurityPolicy.ts      # Protocol checks and log sanitization
├── storage/
│   └── PluginStorage.ts             # Namespace-isolated storage engine
├── ui/
│   ├── UIExtensionPoint.ts          # UI extension registry and uninstaller
│   ├── PluginMenuItem.ts            # Navigation & action menu item contracts
│   ├── PluginPanel.ts               # Layout panel contracts
│   └── PluginWidget.ts              # Dashboard & chat widget contracts
├── runtime/
│   └── PluginRuntime.ts             # Lifecycle state machine & crash boundary
└── index.ts                         # Public extension barrel export
```

---

## 3. Plugin Lifecycle State Machine

```
   [Install / Load]
          │
          ▼
    [registered] ────────► [validated] ────────► [enabled] ◄─────┐
          │                      │                   │           │
          │                      ▼                   ▼           │
          └───────────────► [quarantined]        [disabled] ─────┘
                                                     │
                                                     ▼
                                                [uninstalled]
          (Any Unhandled Activation Crash)
                         │
                         ▼
                     [failed]
```

1. **registered**: Manifest validated structurally; entered into `PluginRegistry`.
2. **validated**: Capabilities and permissions verified against system policy.
3. **enabled**: Declared permissions granted; isolated `PluginContext` injected; `onActivate(ctx)` executed.
4. **disabled**: UI extension points unmounted; cleanups executed; `onDeactivate()` called.
5. **failed**: Caught unhandled crash during activation; quarantined safely without core crash.
6. **uninstalled**: Permissions revoked; registry deleted; resources released.
