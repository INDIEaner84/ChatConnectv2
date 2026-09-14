# Plugin Security & Isolation Model

## 1. Core Isolation & Security Boundaries

Chat Connect enforces a zero-trust model for plugins:
**`UNTRUSTED BY DEFAULT`**

### Principles
1. **No Access to Private Cryptographic Keys**: Plugins can never access raw ECDSA P-256 private keys, encryption seeds, or key generation mechanisms.
2. **No Access to Internal Core Databases**: IndexedDB internal stores (`users`, `devices`, `contacts`, `conversations`, `messages`, `secureKeyStore`) are inaccessible to plugins.
3. **No Direct DOM or Raw Socket Manipulation**: Plugins do not receive unrestricted `document` or raw socket handles. All UI additions are mediated via `UIExtensionRegistry`.
4. **Namespace Storage Isolation**: `PluginStorageManager` isolates data per plugin ID. Plugin A cannot inspect, modify, or delete Plugin B's keys.
5. **Path Traversal & Injection Guards**: Storage keys containing directory traversal tokens (`..`, `/`, `\`) or reserved prefixes (`__`) are immediately rejected.

---

## 2. Forbidden Permissions

The following permissions are classified as strictly forbidden and will cause immediate rejection of the plugin manifest during validation:

| Forbidden Permission | Reason for Prohibition |
| :--- | :--- |
| `identity:private` | Exposing private identity would allow identity theft and impersonation. |
| `keys:private` | Exposing private signing/encryption keys compromises all past and future communications. |
| `storage:core` | Raw access to core storage bypasses all validation and security barriers. |
| `eval:execute` | Dynamic string evaluation (`eval`, `new Function`) enables remote code injection. |
| `dom:raw` | Direct DOM manipulation risks XSS, keystroke logging, and session token theft. |
| `system:root` | Privileged system access is prohibited in a client-side sandbox. |
| `webrtc:raw-sockets` | Raw socket manipulation could bypass end-to-end encryption protocols. |

---

## 3. Outbound Network Constraints

The `PluginSecurityPolicy` enforces strict constraints on outbound requests:
- Only `https:` and `wss:` protocols are permitted. Insecure `http:` and arbitrary URL schemes (`file:`, `javascript:`, `data:`) are rejected.
- Request timeouts are strictly bounded (default 15 seconds, max 30 seconds).
- All requests are logged in the audit log with target hosts and methods.

---

## 4. Audit Logging & Token Sanitization

All broker invocations are recorded in the `CapabilityBroker` audit trail:
- Each log entry includes `timestamp`, `pluginId`, `capability`, `operation`, and `outcome`.
- Arguments and metadata are automatically passed through `PluginSecurityPolicy.sanitizeAuditLogPayload()`, redacting sensitive keys (e.g. `secret`, `token`, `password`, `privateKey`).

---

## 5. Fault Isolation & Crash Containment

When a community plugin crashes during `onActivate` or background execution:
1. The error is caught by `PluginRuntime`.
2. The plugin's lifecycle state transitions to `'failed'`.
3. Its registered UI extension points (menu items, panels, widgets) are immediately unmounted.
4. Registered cleanups are executed.
5. The core host application continues operating smoothly without interruption.
