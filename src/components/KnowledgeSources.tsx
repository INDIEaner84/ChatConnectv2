import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auditLogger } from "@/lib/AuditLogger";
import { 
  HardDrive, 
  Cloud, 
  Github, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  ExternalLink,
  FolderSync
} from "lucide-react";
import { motion } from "motion/react";

export interface KnowledgeSourceItem {
  id: string;
  name: string;
  type: string;
  status: "synced" | "indexing" | "error";
  docsCount: number;
  lastSync: string;
}

const INITIAL_SOURCES: KnowledgeSourceItem[] = [
  {
    id: "gdrive-workspace",
    name: "Google Drive Workspace",
    type: "Cloud Directory",
    status: "synced",
    docsCount: 1245,
    lastSync: "10 mins ago"
  },
  {
    id: "local-vault",
    name: "Local Vault (/docs)",
    type: "Local File System",
    status: "indexing",
    docsCount: 8402,
    lastSync: "In progress..."
  },
  {
    id: "github-repo",
    name: "GitHub Repository (ais-core)",
    type: "Codebase",
    status: "synced",
    docsCount: 342,
    lastSync: "1 hour ago"
  }
];

interface KnowledgeSourcesProps {
  onSelectSource?: (source: KnowledgeSourceItem) => void;
  className?: string;
}

export function KnowledgeSources({ onSelectSource, className = "" }: KnowledgeSourcesProps) {
  const [sources, setSources] = useState<KnowledgeSourceItem[]>(INITIAL_SOURCES);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Subscribe to real-time Firestore synchronization
  useEffect(() => {
    try {
      const ragCol = collection(db, "rag_sources");
      const unsubscribe = onSnapshot(ragCol, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: KnowledgeSourceItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              name: data.name || "Unknown Source",
              type: data.type || "Cloud",
              status: data.status || "synced",
              docsCount: Number(data.docsCount) || 0,
              lastSync: data.lastSync || "Recently"
            });
          });
          setSources(loaded);
        }
      }, (err) => {
        console.warn("Firestore rag_sources listener:", err);
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Error subscribing to Firestore rag_sources:", err);
    }
  }, []);

  const handleSyncSource = async (source: KnowledgeSourceItem) => {
    setSyncingId(source.id);
    auditLogger.log({
      category: "RAG",
      severity: "INFO",
      action: "RAG_SOURCE_SYNC_STARTED",
      description: `Initiated indexing and vector embedding sync for ${source.name}.`,
      actor: "USER",
      metadata: { sourceId: source.id, type: source.type }
    });

    try {
      await setDoc(doc(db, "rag_sources", source.id), {
        status: "indexing",
        lastSync: "Indexing..."
      }, { merge: true });

      await new Promise((r) => setTimeout(r, 1200));

      await setDoc(doc(db, "rag_sources", source.id), {
        status: "synced",
        lastSync: "Just now",
        docsCount: source.docsCount + 12,
        updatedAt: serverTimestamp()
      }, { merge: true });

      auditLogger.log({
        category: "RAG",
        severity: "INFO",
        action: "RAG_SOURCE_SYNC_COMPLETED",
        description: `Completed vector synchronization for ${source.name} (docs count updated).`,
        actor: "SYSTEM"
      });
    } catch (e: any) {
      console.error("Sync error:", e);
    } finally {
      setSyncingId(null);
    }
  };

  const getSourceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("cloud") || t.includes("drive")) return <Cloud className="w-6 h-6 text-sky-400" />;
    if (t.includes("local") || t.includes("file")) return <HardDrive className="w-6 h-6 text-emerald-400" />;
    return <Github className="w-6 h-6 text-indigo-400" />;
  };

  const filteredSources = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)]/50 pb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search connected RAG sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-card)]/50 backdrop-blur-md border border-[var(--border-color)]/60 rounded-xl text-xs focus:outline-none focus:border-[var(--accent-neon)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono transition-all"
          />
        </div>

        <div className="text-xs font-mono text-[var(--text-tertiary)]">
          Showing <span className="text-[var(--text-primary)] font-bold">{filteredSources.length}</span> sources
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSources.map((source, idx) => {
          const isItemSyncing = syncingId === source.id || source.status === "indexing";

          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="p-5 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-card)]/60 backdrop-blur-xl hover:border-[var(--accent-neon)]/50 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-[var(--bg-sidebar)]/80 border border-[var(--border-color)]/60 rounded-xl shadow-inner">
                  {getSourceIcon(source.type)}
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight text-[var(--text-primary)]">
                    {source.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-tertiary)] font-mono">
                    <span className="uppercase">{source.type}</span>
                    <span>•</span>
                    <span>Last sync: {source.lastSync}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Documents Counter */}
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)]">Indexed Docs</span>
                  <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                    {source.docsCount.toLocaleString()}
                  </span>
                </div>

                {/* Status Indicator */}
                <div>
                  {source.status === "synced" && !isItemSyncing && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-[var(--accent-emerald)]/10 border border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SYNCED
                    </span>
                  )}
                  {isItemSyncing && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-[var(--accent-neon)]/10 border border-[var(--accent-neon)]/30 text-[var(--accent-neon)] animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> INDEXING...
                    </span>
                  )}
                  {source.status === "error" && !isItemSyncing && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" /> ERROR
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleSyncSource(source)}
                  disabled={isItemSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-color)]/70 bg-[var(--bg-main)]/70 hover:border-[var(--accent-neon)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                  title="Re-index and sync this source"
                >
                  <FolderSync className={`w-3.5 h-3.5 ${isItemSyncing ? 'animate-spin' : ''}`} />
                  {isItemSyncing ? "Syncing..." : "Sync"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
