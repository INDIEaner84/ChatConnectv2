# Chat Connect / MUSCAL — Cryptographic & Security Specification

## 1. Cryptographic Primitives

Chat Connect employs standard W3C Web Cryptography API (`crypto.subtle`) primitives:
- **Algorithm**: ECDSA (`ECDSA` with curve `P-256`, also known as `secp256r1` / `prime256v1`).
- **Hash Function**: SHA-256 (`SHA-256`) for message digests, sync hashes, and attachment deduplication.
- **Key Format**:
  - **Public Identity**: Exported as SubjectPublicKeyInfo (`spki`) formatted in Base64.
  - **Private Key**: Generated with `extractable: false`. The key reference is retained in-memory in the runtime keystore or isolated session context.

---

## 2. Zero-Secret Guarantee

1. **Non-Extractability**:
   ```typescript
   await crypto.subtle.generateKey(
     { name: "ECDSA", namedCurve: "P-256" },
     false, // extractable = false (CRITICAL: private key material cannot be dumped)
     ["sign", "verify"]
   );
   ```
2. **Entity Isolation**:
   - `UserEntity` and `DeviceEntity` record ONLY public identifiers, names, and the public identity key string (`publicIdentity`).
   - Neither the local database nor any state serialization contains private keys or symmetric session secrets in plain text.
3. **Log Sanitization**:
   - The application logger (`src/core/logging/Logger.ts`) actively strips and redacts fields matching `/private|secret|token|password|credential|sig$/i` from diagnostic payloads and audit logs.

---

## 3. QR Invitation Protocol & Pairing Security

Peer discovery and pairing uses signed, self-authenticating QR tokens conforming to the following structure:

```json
{
  "invitationId": "inv_uuid",
  "issuerUserId": "usr_uuid",
  "issuerDeviceId": "dev_uuid",
  "issuerPublicIdentity": "MFkwEwYHKoZIzj0C...",
  "protocolVersion": "muscal.chatconnect.v1",
  "createdAt": 1789130000000,
  "expiresAt": 1789130600000,
  "bootstrapInformation": {
    "displayName": "Alice",
    "avatar": "",
    "capabilities": ["text", "voice", "p2p-sync"]
  },
  "signature": "MEQCIG7X9..."
}
```

### Verification Pipeline
When a QR token or invitation string (`chatconnect:invite:<base64>`) is imported:
1. **Syntax & Structural Validation**: Verifies all required fields exist and conform to schemas.
2. **Cryptographic Signature Verification**: Reconstructs canonical JSON from the unsigned payload and verifies `signature` against `issuerPublicIdentity`. Tampered tokens are dropped immediately.
3. **Protocol Compatibility**: Confirms matching protocol major version (`muscal.chatconnect.v1`).
4. **Time-To-Live (TTL) Check**: Rejects invitations where `Date.now() > expiresAt`.
5. **Anti-Self-Pairing**: Blocks attempts by a user device to pair with its own local identity.
6. **State Machine & Revocation Verification**:
   - If peer is currently marked `blocked`, pairing is declined.
   - If relationship was `revoked`, re-acceptance requires manual unrevocation.
   - If invitation has already been consumed, replay protection prevents duplicate relationships.

---

## 4. Threat Model & Mitigations

| Threat | Attack Vector | Chat Connect Mitigation |
| :--- | :--- | :--- |
| **Tampered QR Invitation** | Attacker alters display name or device ID in QR payload | Cryptographic signature verification over canonical JSON fails; token is rejected |
| **Invitation Replay Attack** | Attacker re-uses an intercepted QR code multiple times | Single-use invitation tracking in `RelationshipRepository` and expiration timestamp validation |
| **Forged Peer Message** | Malicious actor injects fake message envelopes into local mesh | `SyncService` verifies digital signature against peer's registered public identity; drops unverified senders |
| **State Regression / Downgrade** | Replay of old message status (e.g. sending `queued` over `delivered`) | Deterministic status weight check (`queued < sent < delivered < read`) discards backward transitions |
| **Private Key Compromise** | Memory dump or XSS attempting to exfiltrate private key | WebCrypto keys are declared with `extractable: false`, preventing retrieval by script APIs |
