# Plugin Contracts & Manifest Specification

## 1. Plugin Manifest Specification

Every plugin must provide a valid `manifest.json` conforming to the `PluginManifest` schema. Manifests are strictly validated by `validatePluginManifest()`.

```json
{
  "id": "community.acme.weather",
  "name": "Acme Weather Alerts",
  "version": "1.2.0",
  "apiVersion": "1.0.0",
  "publisher": "Acme Weather Labs",
  "description": "Real-time local weather alerts and compact conversation widgets.",
  "permissions": [
    "ui:widget",
    "ui:panel",
    "storage:plugin",
    "network:request"
  ],
  "capabilities": [
    "ui.widget",
    "ui.panel",
    "storage.plugin",
    "network.request"
  ],
  "entrypoints": {
    "main": "index.js",
    "ui": "widget.js"
  },
  "metadata": {
    "license": "MIT",
    "homepage": "https://example.com/acme-weather"
  }
}
```

### Manifest Rules & Constraints
1. **Plugin ID (`id`)**: Must match regex `/^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/`.
   - Cannot start with reserved internal prefixes: `core.`, `internal.`, `muscal.core.`, `sys.`, `system.`.
2. **Version (`version`)**: Must follow valid Semantic Versioning (SemVer, e.g. `1.0.0`).
3. **API Version (`apiVersion`)**: Must match or be backwards compatible with host API version (`1` or `1.0.0`).
4. **Permissions (`permissions`)**: Array of known valid permissions. Must NOT contain any `FORBIDDEN_PERMISSIONS`.
5. **Capabilities (`capabilities`)**: Array of recognized capabilities. Any capability requiring a permission must have that permission declared in `permissions`.

---

## 2. Plugin Contract (`IPlugin`)

```typescript
export interface IPlugin {
  readonly manifest: PluginManifest;
  onActivate(context: PluginContext): Promise<void> | void;
  onDeactivate?(): Promise<void> | void;
}
```

### `PluginContext` Interface
The `PluginContext` injected into `onActivate` contains:
- `pluginId`: Unique string ID of the plugin.
- `manifest`: Readonly manifest object.
- `storage`: Isolated `IPluginStorage` partition.
- `ui`: Registration interface for menu items, panels, and widgets.
- `capabilities`: Controlled `ICapabilityAccess` facade.
- `logger`: Structured logger with automatic token sanitization.
- `addCleanup(fn)`: Hook for registration of teardown callbacks.

---

## 3. UI Extension Points Contracts

### Menu Item (`PluginMenuItem`)
```typescript
export interface PluginMenuItem {
  readonly id: string;
  readonly pluginId: string;
  readonly label: string;
  readonly icon?: string;
  readonly section: 'navigation' | 'conversation' | 'tools';
  readonly order?: number;
  readonly badge?: string;
  readonly onClick?: () => void;
}
```

### Panel (`PluginPanel`)
```typescript
export interface PluginPanel {
  readonly id: string;
  readonly pluginId: string;
  readonly title: string;
  readonly placement: 'main' | 'drawer' | 'sidebar-bottom';
  readonly icon?: string;
  readonly render: () => React.ReactNode;
}
```

### Widget (`PluginWidget`)
```typescript
export interface PluginWidget {
  readonly id: string;
  readonly pluginId: string;
  readonly title: string;
  readonly size: 'compact' | 'standard' | 'full';
  readonly render: () => React.ReactNode;
}
```
