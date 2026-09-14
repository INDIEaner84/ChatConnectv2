# Capability Model & Permission Separation

## 1. Concept: Capability vs. Permission

Chat Connect strictly decouples **Permissions** from **Capabilities**:

| Concept | Question Answered | Definition & Role |
| :--- | :--- | :--- |
| **Permission** | *What is the plugin allowed to do?* | Security grant declared in the manifest and approved by the user or security policy. |
| **Capability** | *What API interface is exposed to the plugin?* | Functional contract and interface methods exposed via `CapabilityBroker`. |

A plugin cannot invoke a capability unless it possesses the required permission.

---

## 2. Mapping Table: Capabilities to Required Permissions

| Capability Key (`PluginCapabilityKey`) | Required Permission (`PluginPermission`) | Description |
| :--- | :--- | :--- |
| `ui.panel` | `ui:panel` | Render panels in main view or drawers |
| `ui.menu` | `ui:menu` | Add navigation or context menu entries |
| `ui.widget` | `ui:widget` | Render dashboard or chat widgets |
| `storage.plugin` | `storage:plugin` | Access private, isolated plugin storage |
| `messaging.read` | `messaging:read` | Read sanitized conversation summaries |
| `messaging.send` | `messaging:send` | Queue messages via controlled dispatch |
| `contacts.read` | `contacts:read` | Read verified peer contacts (public data only) |
| `network.request` | `network:request` | Outbound HTTPS/WSS calls |
| `ai.inference` | `ai:inference` | Controlled AI inference requests |
| `ai.context` | `ai:context` | Provide contextual memory blocks |
| `ai.tool` | `ai:tool` | Register callable agent tools |
| `location.approximate` | `location:approximate` | Low-resolution location (coarse km accuracy) |
| `filesystem.user-selected` | `filesystem:user-selected` | Access user-chosen files via file picker |

---

## 3. The CapabilityBroker Interceptor

```
Plugin invokes capability.readContacts()
                 │
                 ▼
      [CapabilityBroker Interceptor]
                 │
                 ├── 1. Check plugin registration in PluginRegistry?
                 │      -> Deny if unregistered
                 ├── 2. Check plugin lifecycleState == 'enabled'?
                 │      -> Deny if 'registered', 'disabled', or 'failed'
                 ├── 3. Check capability declared in PluginManifest?
                 │      -> Deny if undeclared
                 ├── 4. Check required permission granted in PermissionManager?
                 │      -> Deny if permission not granted
                 ├── 5. Check protocol/rate limit in PluginSecurityPolicy?
                 │      -> Deny if disallowed protocol or rate exceeded
                 └── 6. Write sanitized audit log
                 │
                 ▼
        Forward to Core API
        (Sanitize return value before returning to Plugin)
```

---

## 4. Forward-Compatible MUSCAL Integration

The extension architecture prepares contracts for future MUSCAL extensions:

- **Agent Plugin (`MuscalAgentContract`)**: Encapsulates specialized autonomous AI agents.
- **Tool Plugin (`MuscalToolContract`)**: Provides callable deterministic functions (e.g. calculator, query engine).
- **Context Provider (`MuscalContextProviderContract`)**: Supplies relevant context snippets to conversation generation.
- **Model Provider (`MuscalModelProviderContract`)**: Bridges local or remote LLM runtimes.
- **Extractor (`MuscalExtractorContract`)**: Extracts text from PDFs, images, or audio.
- **Embedding Provider (`MuscalEmbeddingProviderContract`)**: Generates vector representations.
- **Retriever (`MuscalRetrieverContract`)**: Performs vector similarity search.
- **UI Cognitive Component (`MuscalUICognitiveComponentContract`)**: Renders rich cognitive cards.
- **Workflow Plugin (`MuscalWorkflowPluginContract`)**: Coordinates multi-step agent pipelines.
