# Chat Connect / MUSCAL — Testing & Verification Gates

## 1. Governance & Verification Mandate
Every phase of Chat Connect must pass an automated, comprehensive verification gate before being merged into the permanent source of truth on GitHub:

> **Phase Gate Policy**: No phase may be marked complete without 100% green execution across all acceptance criteria and chaos tests.

---

## 2. Test Suites Overview

The test runner (`src/tests/testRunner.ts`) executes 24 automated verification gates across five key domains:

### Phase 1: Foundation (`src/tests/unit/foundation.test.ts`)
- **Version & Protocol Metadata**: Validates semantic versioning, protocol string, and PWA configuration.
- **Security Logger Sanitization**: Asserts that sensitive fields (private keys, tokens) are redacted from logs.
- **Decoupled Typed EventBus**: Tests event publishing, subscription callbacks, and unsubscription memory cleanup.
- **IndexedDB Storage Engine**: Validates CRUD persistence across repositories with in-memory fallback.

### Phase 2: Identity (`src/tests/unit/identity.test.ts`)
- **Identity Creation & Persistence**: Creates and retrieves user and device records.
- **Architectural Separation**: Ensures `UserEntity` and `DeviceEntity` are separate with distinct UUIDs.
- **Zero Private Key Leakage**: Inspects database records to guarantee zero private keys are stored in plain text.
- **WebCrypto ECDSA Signing**: Signs challenge strings, verifies legitimate signatures, and rejects tampered payloads.

### Phase 3: QR Peer Invitation (`src/tests/unit/qr.test.ts`)
- **Signed QR Generation**: Verifies QR payload format and digital signature generation.
- **Malformed Token Interception**: Rejects corrupted or non-base64 invitation strings.
- **Tampered Payload Detection**: Detects altered display names or parameters and fails signature verification.
- **TTL & Expiration Enforcement**: Rejects expired invitations promptly.
- **Replay Attack Protection**: Ensures single-use invitation consumption prevents duplicate acceptance.
- **Relationship State Guarding**: Rejects pairing requests from blocked or revoked peers.

### Phase 4: Messenger Core (`src/tests/unit/messenger.test.ts`)
- **1:1 Direct Conversations**: Verifies direct peer chat creation and message routing.
- **Group Conversations & Roles**: Validates owner and member role hierarchy and permissions.
- **Lifecycle Progression**: Confirms message progression across `queued -> sent -> delivered -> read`.
- **Idempotent Deduplication**: Merges duplicate message deliveries without creating extra database rows.
- **Attachment Deduplication**: Validates SHA-256 hash deduplication for file and media payloads.

### Chaos & Resilience (`src/tests/unit/chaos.test.ts`)
- **Network Loss & Offline Queuing**: Enqueues messages while transport is offline without throwing errors.
- **Reconnection Flush**: Verifies automatic outbound queue dispatch upon network recovery.
- **Concurrent Conflict Resolution**: Resolves conflicting statuses deterministically without state regression.
- **Forged Envelope Interception**: Detects unauthorized senders or forged transport signatures and drops payloads before database writes.
- **Simulated Crash & Restart**: Verifies entity consistency and store integrity after simulated process restarts.

---

## 3. How to Execute Tests

### Headless CLI Execution
To run the full suite from the command line:
```bash
npx tsx src/tests/runCli.ts
```

### In-App Interactive Test Suite
1. Launch the application.
2. Navigate to `/tests` (or click **Test Gates** in the sidebar).
3. View real-time assertion traces, filter by phase, or trigger fresh gate runs on demand.

---

## 4. Release Version Tags

| Phase | Version Tag | Status | Description |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `v0.1.0-foundation` | **PASSED** | PWA Core, Storage Engine, EventBus, Logger |
| **Phase 2** | `v0.2.0-identity` | **PASSED** | WebCrypto ECDSA Identity, User/Device Separation |
| **Phase 3** | `v0.3.0-qr-peer` | **PASSED** | Signed QR Peer Bootstrap, Replay & Tamper Guards |
| **Phase 4** | `v0.4.0-messenger` | **PASSED** | Messenger Core, Idempotent Sync, Chaos Resilience |
