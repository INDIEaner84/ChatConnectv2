# Chat Connect / MUSCAL — System Architecture

## 1. Master Objective & Vision
**Chat Connect** is a fully local-first Progressive Web Application (PWA) messaging platform designed from first principles with zero native runtime dependencies, absolute privacy guarantees, and future modular extensibility as an AI-runtime platform (MUSCAL).

### Core Architectural Axioms
1. **PWA-Exclusivity**: Operates strictly within browser standards (WebCrypto, IndexedDB, Service Workers, WebRTC, BroadcastChannel). No native wrappers or platform-specific binaries.
2. **Local-First Single Source of Truth**: All user entities, devices, relationships, conversations, and messages are authored and committed to local IndexedDB before any network transport takes place.
3. **Zero-Trust & Zero-Secret Leakage**: Cryptographic identity keys (ECDSA P-256) are generated with `extractable: false`. Private keys never touch storage, logs, URLs, or QR codes.
4. **Decoupled Asynchronous Sync**: Transport channels (`LocalMeshTransport`, WebRTC signaling) are completely decoupled from message persistence and UI rendering.
5. **Phase-Gated Quality Assurance**: Every functional milestone is sealed with automated verification gates covering unit integrity and chaos resilience.

---

## 2. Architectural Layers

```
+-------------------------------------------------------------------------+
|                        Presentation & UI Layer                          |
|  - React 18 + Tailwind CSS + Lucide Icons + Motion                      |
|  - Pages: / (Chat), /devices (QR Pair), /diagnostics, /tests, /settings |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                       Application Services Layer                        |
|  - IdentityService: User & Device life-cycle, cryptographic signing     |
|  - InvitationService: QR payload generation, validation, state machine  |
|  - ConversationService: 1:1, Group chats, attachments, role hierarchy  |
|  - SyncService: Idempotent queue, reconciliation, conflict resolution   |
|  - EventBus: Decoupled typed publish/subscribe event dispatcher         |
+-------------------------------------------------------------------------+
           │                                          │
           ▼                                          ▼
+-----------------------+                 +-------------------------------+
|    Security Layer     |                 |       Networking Layer        |
| - WebCryptoKeyStore   |                 | - TransportAdapter (Interface)|
| - ECDSA P-256 Signing |                 | - LocalMeshTransport (P2P)    |
| - SHA-256 Digest      |                 | - WebRTCConnectionManager     |
| - Sensitive Redaction |                 | - Offline Outbox Queue        |
+-----------------------+                 +-------------------------------+
           │                                          │
           └─────────────────────┬────────────────────┘
                                 ▼
+-------------------------------------------------------------------------+
|                       Local Storage & Data Layer                        |
|  - IndexedDBDatabase: Primary persistence engine                        |
|  - MemoryStore: In-memory fallback for headless tests & SSR             |
|  - Repository Pattern: User, Device, Relationship, Contact,             |
|                        Conversation, Message, Group, Attachment,        |
|                        SyncState, AppMetadata Repositories              |
+-------------------------------------------------------------------------+
```

---

## 3. Storage Architecture & Repository Pattern

All data access flows through typed repository interfaces adhering to `/src/runtime/interfaces/repositories.ts`:

- **UserRepository**: Local user profiles (`id`, `displayName`, `publicIdentity`, `createdAt`).
- **DeviceRepository**: Registered devices (`id`, `userId`, `deviceName`, `platform`, `pushEndpoint`).
- **RelationshipRepository**: Peer pairing states (`pending`, `accepted`, `blocked`, `revoked`).
- **ContactRepository**: Public profiles of paired peers and cached identities.
- **ConversationRepository**: Direct and group conversation metadata, unread counters, and last message timestamps.
- **MessageRepository**: Message payloads, idempotency hashes, and lifecycle state tracking (`queued`, `sent`, `delivered`, `read`, `failed`).
- **GroupRepository**: Group ownership, participant lists, roles (`owner`, `admin`, `member`), and permissions.
- **AttachmentRepository**: File metadata and binary Blob storage indexed by SHA-256 content hashes.
- **SyncStateRepository**: Outbound sync queues, retry counters, and vector clock/sequence numbers.
- **AppMetadataRepository**: Persistent configuration, migration status, and protocol version flags.

---

## 4. Message Lifecycle & Progression

Messages progress deterministically across five discrete lifecycle states:

```
[User Drafts Message]
         │
         ▼
    ┌──────────┐
    │  QUEUED  │ ── Committed to local IndexedDB; added to Sync Outbox
    └──────────┘
         │
   (Network Online / Transport Available)
         │
         ▼
    ┌──────────┐
    │   SENT   │ ── Dispatched over transport adapter with signature
    └──────────┘
         │
   (Peer Acknowledgment Received)
         │
         ▼
    ┌──────────┐
    │ DELIVERED│ ── Delivered to peer device storage
    └──────────┘
         │
   (Peer Opens Conversation)
         │
         ▼
    ┌──────────┐
    │   READ   │ ── Read receipt recorded; deliveredAt and readAt timestamps
    └──────────┘
```

Status weights (`queued: 0`, `sent: 1`, `delivered: 2`, `read: 3`) strictly prevent state regressions. Incoming updates with equal or lower status weights are discarded.

---

## 5. Group Conversation & Role Hierarchy

Groups support collaborative communication with strict cryptographic attribution:
- **Owner**: Creator of the group; holds exclusive rights to promote admins, transfer ownership, or disband the group.
- **Admin**: Permitted to invite verified contacts and modify group metadata.
- **Member**: Permitted to broadcast signed messages and attachments within the conversation.

All group actions are verified against the membership record in `GroupRepository` before dispatch.
