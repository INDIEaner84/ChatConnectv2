import { useState, useEffect } from "react";
import { identityService } from "@/identity/IdentityService";
import { invitationService, InvitationPayload } from "@/networking/InvitationService";
import { relationshipRepository } from "@/storage/repositories/RelationshipRepository";
import { contactRepository } from "@/storage/repositories/ContactRepository";
import { RelationshipEntity, ContactEntity, UserEntity, DeviceEntity } from "@/storage/types";
import { nicknameEngine } from "@/lib/nicknameEngine";
import { soundFx } from "@/lib/soundFx";
import { 
  MonitorSmartphone, 
  Smartphone, 
  Check, 
  Loader2, 
  QrCode, 
  ShieldCheck, 
  Scan, 
  AlertCircle, 
  Copy, 
  Clock, 
  Key, 
  UserCheck, 
  XCircle,
  Ban,
  Radio,
  Edit2,
  Sparkles
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";

export function Devices() {
  const [currentUser, setCurrentUser] = useState<UserEntity | null>(null);
  const [currentDevice, setCurrentDevice] = useState<DeviceEntity | null>(null);
  const [relationships, setRelationships] = useState<RelationshipEntity[]>([]);
  const [contacts, setContacts] = useState<ContactEntity[]>([]);

  // QR creation state
  const [pairingMode, setPairingMode] = useState(false);
  const [activeInvitation, setActiveInvitation] = useState<InvitationPayload | null>(null);
  const [qrPayloadString, setQrPayloadString] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // QR scan/import state
  const [scanInputMode, setScanInputMode] = useState(false);
  const [incomingToken, setIncomingToken] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Nickname editor state
  const [editingPeerId, setEditingPeerId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");

  const handleSaveNickname = (peerId: string) => {
    nicknameEngine.setCustomNickname(peerId, nicknameInput);
    setEditingPeerId(null);
    soundFx.playBeep(1200, 0.05);
    loadData();
  };

  const loadData = async () => {
    const { user, device } = await identityService.initializeIdentity();
    setCurrentUser(user);
    setCurrentDevice(device);

    const rels = await relationshipRepository.getAll();
    setRelationships(rels);

    const cts = await contactRepository.getAll();
    setContacts(cts);
  };

  useEffect(() => {
    loadData();

    // Check for incoming invite token in URL query parameter
    try {
      const params = new URLSearchParams(window.location.search);
      const urlInvite = params.get('invite');
      if (urlInvite) {
        setIncomingToken(decodeURIComponent(urlInvite));
        setScanInputMode(true);
      }
    } catch (e) {}
  }, []);

  const handleCreateSignedInvitation = async () => {
    try {
      const { invitation, qrString } = await invitationService.createInvitation(600); // 10 min TTL
      setActiveInvitation(invitation);
      setQrPayloadString(qrString);
      setPairingMode(true);
      setValidationError(null);
      setValidationSuccess(null);
    } catch (err) {
      setValidationError((err as Error).message);
    }
  };

  const getDirectInviteUrl = () => {
    if (!qrPayloadString) return "";
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?invite=${encodeURIComponent(qrPayloadString)}`;
  };

  const handleCopyDirectLink = () => {
    const link = getDirectInviteUrl();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyQrToken = () => {
    if (!qrPayloadString) return;
    navigator.clipboard.writeText(qrPayloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAcceptIncomingToken = async () => {
    if (!incomingToken.trim()) return;
    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(null);

    try {
      const check = await invitationService.validateInvitation(incomingToken.trim());
      if (!check.valid || !check.invitation) {
        setValidationError(check.error || "Invalid invitation");
        setIsValidating(false);
        return;
      }

      const rel = await invitationService.acceptInvitation(check.invitation);
      setValidationSuccess(`Connected with ${check.invitation.bootstrapInformation.displayName}!`);
      setIncomingToken("");
      setScanInputMode(false);
      await loadData();
    } catch (err) {
      setValidationError((err as Error).message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBlockPeer = async (peerUserId: string) => {
    await invitationService.updateRelationshipState(peerUserId, 'blocked');
    await loadData();
  };

  const handleRevokePeer = async (peerUserId: string) => {
    await invitationService.updateRelationshipState(peerUserId, 'revoked');
    await loadData();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 text-[var(--text-primary)] h-full overflow-y-auto relative z-10"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <MonitorSmartphone className="w-6 h-6 text-sky-500" />
            Devices & Zero-Trust QR Pairing
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Local device identity, ECDSA P-256 cryptographic assertions, and tamper-resistant peer pairing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setScanInputMode(!scanInputMode); setPairingMode(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-xs font-semibold shadow-sm transition"
          >
            <Scan className="w-4 h-4 text-indigo-400" />
            <span>{scanInputMode ? "Close Pair Input" : "Pair with Peer QR / Token"}</span>
          </button>
        </div>
      </header>

      {/* Local Identity & Device Card */}
      <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Key className="w-4 h-4 text-emerald-500" />
            Local Device Cryptographic Identity
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-300 dark:border-emerald-800">
            ECDSA P-256 WebCrypto Active
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-[var(--text-tertiary)] block">User ID:</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentUser?.id || "Loading..."}</span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block">Display Name:</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentUser?.displayName || "Loading..."}</span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block">Device ID:</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentDevice?.id || "Loading..."}</span>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)] block">Public Identity Fingerprint:</span>
            <span className="text-sky-500 font-semibold truncate block">
              {currentUser?.publicIdentity ? `${currentUser.publicIdentity.substring(0, 32)}...` : "Loading..."}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 italic pt-1">
          Zero-Secret Guarantee: Private keys are held strictly in non-extractable WebCrypto runtime and never displayed or serialized.
        </div>
      </div>

      {/* Manual Token / QR Input Section */}
      {scanInputMode && (
        <div className="p-6 rounded-2xl border border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Scan className="w-4 h-4 text-indigo-500" />
              Accept Peer Invitation (Paste QR Token)
            </h2>
            <button onClick={() => setScanInputMode(false)} className="text-slate-400 hover:text-slate-200 text-xs">Cancel</button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Paste the signed invitation string or scanned QR payload from another Chat Connect peer. The payload's ECDSA signature and timestamp will be verified automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={incomingToken}
              onChange={(e) => setIncomingToken(e.target.value)}
              placeholder="Paste chatconnect:invite:... token here"
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAcceptIncomingToken}
              disabled={isValidating || !incomingToken.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow flex items-center justify-center gap-1.5 transition"
            >
              {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>Verify & Connect</span>
            </button>
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {validationSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{validationSuccess}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Connected Peer Relationships */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-500" />
            Peer Relationships ({relationships.length})
          </h2>

          <div className="space-y-3">
            {relationships.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-tertiary)]">
                No peer relationships established yet. Create an invitation QR code or scan a peer's QR to pair.
              </div>
            ) : (
              relationships.map((rel) => {
                const contact = contacts.find((c) => c.id === rel.peerUserId);
                const customOrAlias = contact?.displayName || nicknameEngine.generateDeterministicAlias(rel.peerUserId);
                const role = nicknameEngine.getRoleDescriptor(rel.peerUserId);
                const isEditing = editingPeerId === rel.peerUserId;

                return (
                  <div
                    key={rel.id}
                    className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-2.5 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-neon)]/40 text-[var(--accent-neon)] flex items-center justify-center font-bold text-xs shadow-sm">
                          {customOrAlias.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="Enter custom nickname..."
                                className="px-2 py-0.5 text-xs bg-[var(--bg-main)] border border-[var(--accent-neon)] rounded text-[var(--text-primary)] focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveNickname(rel.peerUserId)}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPeerId(null)}
                                className="px-2 py-0.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                                <span>{customOrAlias}</span>
                              </h3>
                              <button
                                onClick={() => {
                                  setEditingPeerId(rel.peerUserId);
                                  setNicknameInput(customOrAlias);
                                }}
                                title="Edit Nickname"
                                className="text-[var(--text-tertiary)] hover:text-[var(--accent-neon)] transition"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[var(--accent-neon)] bg-[var(--accent-neon)]/10 px-1.5 py-0.2 rounded border border-[var(--accent-neon)]/20">
                              {role}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-tertiary)] truncate max-w-[130px]">
                              {rel.peerUserId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rel.state === 'accepted'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : rel.state === 'blocked'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {rel.state}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-[11px] text-[var(--text-tertiary)]">
                      <span>Node Active: {new Date(rel.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-3">
                        {rel.state === 'accepted' && (
                          <>
                            <button
                              onClick={() => handleBlockPeer(rel.peerUserId)}
                              className="text-amber-500 hover:text-amber-400 flex items-center gap-1 text-[11px] font-medium"
                              title="Block Peer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Block</span>
                            </button>
                            <button
                              onClick={() => handleRevokePeer(rel.peerUserId)}
                              className="text-red-500 hover:text-red-400 flex items-center gap-1 text-[11px] font-medium"
                              title="Revoke Relationship"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Generate Invitation QR Card */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Create Peer Invitation
          </h2>

          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm flex flex-col items-center text-center min-h-[340px] justify-center relative">
            {!pairingMode ? (
              <>
                <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base mb-1">Generate Signed QR Invitation</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-6 max-w-xs">
                  Creates a cryptographically signed bootstrap QR code containing your public identity and a 10-minute expiration.
                </p>
                <button
                  onClick={handleCreateSignedInvitation}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow transition"
                >
                  Generate Invitation QR
                </button>
              </>
            ) : (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Signed Peer Invitation QR</span>
                  </div>
                  <button
                    onClick={() => setPairingMode(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Done
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner flex justify-center mx-auto max-w-[220px]">
                  <QRCodeSVG value={qrPayloadString} size={180} level="M" />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Valid for 10 minutes</span>
                </div>

                {/* Direct Link & Raw Token Action Buttons */}
                <div className="space-y-2 w-full pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
                      Direkter Einladungs-Link (Direct Web URL):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getDirectInviteUrl()}
                        className="w-full text-[11px] font-mono bg-transparent border-none focus:outline-none text-[var(--text-primary)] truncate"
                      />
                      <button
                        onClick={handleCopyDirectLink}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-sm transition"
                      >
                        {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? "Kopiert!" : "Link kopieren"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleCopyQrToken}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Token Kopiert!" : "Raw Token kopieren"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PWA & Mesh Architecture Protocol Comparison Card: WebRTC vs Syncthing */}
      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[var(--accent-neon)]" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              PWA Übertragungs- & Mesh-Architektur: WebRTC vs. Syncthing
            </h3>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            BROWSER-NATIV // ZERO-INSTALL
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-[var(--accent-neon)] flex items-center gap-1.5">
              <span>1. Wie wird die PWA übermittelt?</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Die <strong>Progressive Web App (PWA)</strong> wird über standardkonforme HTTPS-Web-Manifeste (<code>manifest.webmanifest</code>) und Service Worker Caches ausgeliefert. Dadurch lässt sich die App auf jedem Smartphone, Tablet oder PC ohne App Store installieren und läuft sofort vollständig offlinefähig aus dem lokalen IndexedDB-Speicher.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-sky-400 flex items-center gap-1.5">
              <span>2. Datenübertragung: WebRTC vs. Syncthing</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Muscal Core verwendet <strong>WebRTC DataChannels</strong> (SCTP über DTLS/UDP). 
              <em>Warum nicht Syncthing?</em> Syncthing benötigt einen separaten Hintergrund-Dienst (C/Go Daemon) mit direktem Dateisystemzugriff, der in Web-Browsern und mobilen PWAs aus Sandbox-Sicherheitsgründen <strong>nicht ausführbar</strong> ist. WebRTC hingegen ist 100% browser-nativ, ermöglicht direkte P2P E2E-verschlüsselte Daten- und Dateiübertragung ohne zusätzliche Software und ohne Cloud-Zwang.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
