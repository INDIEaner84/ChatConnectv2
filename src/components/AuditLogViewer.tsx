import { useState, useEffect } from "react";
import { auditLogger, AuditEvent, AuditCategory, AuditSeverity } from "@/lib/AuditLogger";
import { 
  Shield, 
  Terminal, 
  Search, 
  Trash2, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Clock, 
  Cpu, 
  Radio, 
  Database 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuditLogViewerProps {
  maxHeight?: string;
  className?: string;
  onClose?: () => void;
}

export function AuditLogViewer({ maxHeight = "600px", className = "", onClose }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = auditLogger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (categoryFilter !== "ALL" && log.category !== categoryFilter) return false;
    if (severityFilter !== "ALL" && log.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchDesc = log.description.toLowerCase().includes(q);
      const matchActor = log.actor.toLowerCase().includes(q);
      const matchMeta = log.metadata ? JSON.stringify(log.metadata).toLowerCase().includes(q) : false;
      return matchAction || matchDesc || matchActor || matchMeta;
    }
    return true;
  });

  const handleExport = () => {
    const json = auditLogger.exportLogsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `muscal-audit-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case "INFO":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[var(--accent-neon)]/10 text-[var(--accent-neon)] border border-[var(--accent-neon)]/30 shadow-[0_0_8px_var(--accent-glow)]">
            <CheckCircle2 className="w-3 h-3" /> INFO
          </span>
        );
      case "WARN":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> WARN
          </span>
        );
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
            <XCircle className="w-3 h-3" /> ERROR
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500 animate-pulse">
            <Flame className="w-3 h-3 text-red-500" /> CRITICAL
          </span>
        );
    }
  };

  const getCategoryIcon = (category: AuditCategory) => {
    switch (category) {
      case "ROUTER": return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case "WEBRTC": return <Radio className="w-3.5 h-3.5 text-emerald-400" />;
      case "RAG": return <Database className="w-3.5 h-3.5 text-indigo-400" />;
      case "SECURITY": return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Terminal className="w-3.5 h-3.5 text-[var(--text-secondary)]" />;
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  };

  return (
    <div className={`flex flex-col bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-color)]/70 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden transition-colors ${className}`}>
      {/* Header bar */}
      <div className="p-5 border-b border-[var(--border-color)]/50 flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-sidebar)]/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-active)] rounded-lg border border-[var(--border-color)] text-[var(--accent-neon)] shadow-[0_0_12px_var(--accent-glow)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-tight text-[var(--text-primary)]">System Audit Logger</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-tertiary)]">
                {logs.length} Events
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] font-mono">Real-time state interception & security telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/60 hover:border-[var(--accent-neon)]/50 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title="Download JSON Export"
          >
            <Download className="w-3.5 h-3.5" />
            {copied ? "Exported!" : "Export JSON"}
          </button>
          <button
            onClick={() => auditLogger.clearLogs()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/60 hover:border-rose-500/50 hover:text-rose-400 text-xs font-mono text-[var(--text-secondary)] transition-all"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-[var(--border-color)]/40 bg-[var(--bg-main)]/40 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search action, intent, metadata..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-card)]/70 border border-[var(--border-color)]/60 rounded-lg text-xs focus:outline-none focus:border-[var(--accent-neon)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[var(--bg-card)]/70 border border-[var(--border-color)]/60 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-neon)]"
          >
            <option value="ALL">All Categories</option>
            <option value="ROUTER">Router</option>
            <option value="WEBRTC">WebRTC</option>
            <option value="RAG">RAG</option>
            <option value="SYSTEM">System</option>
            <option value="SECURITY">Security</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[var(--bg-card)]/70 border border-[var(--border-color)]/60 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-neon)]"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Log list */}
      <div 
        className="overflow-y-auto divide-y divide-[var(--border-color)]/30 p-2 space-y-1 font-sans"
        style={{ maxHeight }}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-tertiary)]">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--accent-neon)]" />
            <p className="font-mono text-xs uppercase tracking-wider">No audit events match criteria</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl hover:bg-[var(--bg-hover)]/40 transition-colors border border-transparent hover:border-[var(--border-color)]/40 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {getSeverityBadge(log.severity)}
                    <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-sidebar)] px-2 py-0.5 rounded border border-[var(--border-color)]/50">
                      {getCategoryIcon(log.category)}
                      {log.category}
                    </span>
                    <span className="font-bold text-[var(--text-primary)] font-mono tracking-tight">
                      {log.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-tertiary)]">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-active)] border border-[var(--border-color)]/40 text-[var(--text-secondary)]">
                      by {log.actor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--accent-neon)]" />
                      {formatTime(log.timestamp)}
                    </span>
                    {log.metadata && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="text-[var(--accent-neon)] hover:underline flex items-center gap-0.5"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Meta
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-1.5 text-[var(--text-secondary)] text-xs leading-relaxed pl-1 font-sans">
                  {log.description}
                </p>

                {/* Metadata JSON preview */}
                <AnimatePresence>
                  {isExpanded && log.metadata && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]/60 text-[11px] font-mono overflow-x-auto text-[var(--text-primary)]"
                    >
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
