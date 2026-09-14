/**
 * Files & Mesh-Sync Explorer: Decentralized File & Knowledge Base Explorer
 * Features a rich, sensible directory hierarchy with real-time file counts,
 * sub-folder drilldowns, P2P mesh synchronization indicators, SHA-256 integrity verification,
 * drag-and-drop ingestion, move-to-folder actions, and adaptive DesignEvolution templates.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FolderSync,
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Download,
  Trash2,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Search,
  Shield,
  Layers,
  Info,
  Zap,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Network,
  FolderTree,
  Eye,
  Send,
  Binary,
  Copy,
  Check,
  ChevronRight,
  Folder,
  FolderPlus,
  FolderOpen,
  Sliders,
  Dna,
  Cpu,
  Activity,
  Star,
  ArrowLeft,
  MoveRight,
  ArrowUpDown,
  Filter,
  Radio,
  RadioTower,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { attachmentRepository } from '@/storage/repositories/AttachmentRepository';
import { conversationService } from '@/messaging/ConversationService';
import { AttachmentEntity, AttachmentType } from '@/storage/types';
import { KnowledgeBaseManager } from '@/components/KnowledgeBaseManager';
import { useMuscalStore, ExplorerTemplateId } from '@/store/useMuscalStore';
import { CognitiveTemplateDNAHUD } from '@/components/designEvolution/CognitiveTemplateDNAHUD';
import { soundFx } from '@/lib/soundFx';
import {
  FolderNode,
  DEFAULT_FOLDER_DEFINITIONS,
  buildFolderHierarchy,
  inferFolderPath,
  INITIAL_SAMPLE_FILES
} from '@/lib/fileFolderHierarchy';

export function Files() {
  const [activeTab, setActiveTab] = useState<'files' | 'rag'>('files');
  const [files, setFiles] = useState<AttachmentEntity[]>([]);
  const [customFolders, setCustomFolders] = useState<{ path: string; name: string; parentPath: string }[]>(() => {
    try {
      const saved = localStorage.getItem('muscal_custom_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<AttachmentEntity | null>(null);
  const [fileToMove, setFileToMove] = useState<AttachmentEntity | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isDNAHUDOpen, setIsDNAHUDOpen] = useState(false);
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>('/');

  const {
    explorerTemplate,
    setExplorerTemplate,
    templateDNA,
    templatePreferences,
    recordTemplateInteraction,
    getRecommendedTemplate
  } = useMuscalStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDNA = templateDNA[explorerTemplate] || templateDNA.grid;
  const recommendedTemplate = getRecommendedTemplate();

  // Load files from IndexedDB and seed if completely empty
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      let items = await attachmentRepository.getAll();
      
      // If zero files exist, seed representative cognitive/mesh files so folder counts and hierarchy are immediately visible
      if (items.length === 0) {
        for (const sample of INITIAL_SAMPLE_FILES) {
          const newEntity: AttachmentEntity = {
            ...sample,
            id: 'att_' + Math.random().toString(36).substring(2, 9)
          };
          await attachmentRepository.save(newEntity);
        }
        items = await attachmentRepository.getAll();
      }

      // Sort newest first
      items.sort((a, b) => b.createdAt - a.createdAt);
      setFiles(items);
    } catch (err) {
      console.error('Failed to load files from storage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    const dwellTimer = setInterval(() => {
      recordTemplateInteraction(explorerTemplate, 'dwell');
    }, 10000);
    return () => clearInterval(dwellTimer);
  }, [explorerTemplate]);

  // Compute folder hierarchy with dynamic item counts
  const folderHierarchy = useMemo(() => {
    return buildFolderHierarchy(files, customFolders);
  }, [files, customFolders]);

  const folderMap = useMemo(() => {
    const map = new Map<string, FolderNode>();
    folderHierarchy.forEach((node) => map.set(node.path, node));
    return map;
  }, [folderHierarchy]);

  const currentFolderNode = folderMap.get(currentPath) || folderMap.get('/')!;

  // Subfolders of the current directory
  const subfolders = useMemo(() => {
    return folderHierarchy.filter((f) => f.parentPath === currentPath);
  }, [folderHierarchy, currentPath]);

  // Files belonging to current view
  const currentFolderFiles = useMemo(() => {
    return files.filter((f) => {
      const resolved = inferFolderPath(f);
      if (searchScope === 'all' || searchQuery.trim() !== '') {
        // When searching or explicitly in global scope
        if (searchScope === 'all') {
          return true;
        }
      }
      if (currentPath === '/') {
        return resolved === '/' || resolved === '';
      }
      return resolved === currentPath;
    });
  }, [files, currentPath, searchScope, searchQuery]);

  // Filtered files with search and type filter
  const displayedFiles = useMemo(() => {
    return (searchScope === 'all' && searchQuery.trim() !== '' ? files : currentFolderFiles).filter((f) => {
      const matchesSearch =
        f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.folderPath || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || f.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [files, currentFolderFiles, searchQuery, selectedType, searchScope]);

  // Total storage metrics
  const totalStorageBytes = useMemo(() => {
    return files.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  }, [files]);

  const detectAttachmentType = (mime: string, name: string): AttachmentType => {
    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'image';
    if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(name)) return 'audio';
    if (mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)) return 'video';
    if (mime.includes('pdf') || mime.includes('text') || /\.(pdf|txt|md|json|csv)$/i.test(name)) return 'document';
    return 'file';
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploadStatus('Dateien werden verarbeitet und SHA-256 Hash berechnet...');
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const type = detectAttachmentType(file.type, file.name);
        
        // Save attachment with current folder path
        const att = await conversationService.saveAttachment(file.name, file.type || 'application/octet-stream', type, file);
        if (att && currentPath !== '/') {
          att.folderPath = currentPath;
          await attachmentRepository.save(att);
        }
      }
      soundFx.playModuleActivate();
      setUploadStatus(`${fileList.length} Datei(en) in '${currentFolderNode.name}' gespeichert.`);
      await loadFiles();
      setTimeout(() => setUploadStatus(null), 3500);
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadStatus('Fehler beim Speichern der Datei: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      soundFx.playClick();
      await attachmentRepository.delete(id);
      await loadFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleDownload = (file: AttachmentEntity) => {
    if (!file.dataBase64) return;
    soundFx.playClick();
    const link = document.createElement('a');
    link.href = file.dataBase64;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMoveFile = async (file: AttachmentEntity, targetFolder: string) => {
    try {
      soundFx.playClick();
      file.folderPath = targetFolder;
      await attachmentRepository.save(file);
      await loadFiles();
      setFileToMove(null);
    } catch (err) {
      console.error('Failed to move file:', err);
    }
  };

  const handleCreateFolder = () => {
    const cleanName = newFolderName.trim();
    if (!cleanName) return;

    const slug = cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newPath = currentPath === '/' ? `/${slug}` : `${currentPath}/${slug}`;

    if (customFolders.some((f) => f.path === newPath) || DEFAULT_FOLDER_DEFINITIONS.some((f) => f.path === newPath)) {
      alert('Ein Ordner mit diesem Pfad existiert bereits.');
      return;
    }

    const updated = [...customFolders, { path: newPath, name: cleanName, parentPath: currentPath }];
    setCustomFolders(updated);
    try {
      localStorage.setItem('muscal_custom_folders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    soundFx.playModuleActivate();
    setNewFolderName('');
    setIsCreateFolderOpen(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: AttachmentType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-purple-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <File className="w-4 h-4 text-amber-400" />;
    }
  };

  // Breadcrumbs segments
  const breadcrumbs = useMemo(() => {
    if (currentPath === '/') return [{ path: '/', name: 'Root', count: files.length }];
    
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ path: '/', name: 'Root', count: files.length }];
    let acc = '';
    
    for (const part of parts) {
      acc += '/' + part;
      const node = folderMap.get(acc);
      crumbs.push({
        path: acc,
        name: node ? node.name : part,
        count: node ? node.totalFilesCount : 0
      });
    }
    return crumbs;
  }, [currentPath, folderMap, files.length]);

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-[var(--bg-main)] p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <FolderSync className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Dateien & Mesh-Sync Explorer
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {files.length} Dateien im Mesh
                </span>
              </div>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
                Strukturierter P2P-Datei-Explorer mit automatischer Ordnerzählung, SHA-256 Integritätsprüfung und ColBERT Vektor-Anbindung.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-view Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('files');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                activeTab === 'files'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Datei-Explorer</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveTab('rag');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                activeTab === 'rag'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ColBERT RAG Index</span>
            </button>
          </div>

          <button
            id="refresh-files-btn"
            onClick={() => {
              soundFx.playClick();
              loadFiles();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-secondary)] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Aktualisieren</span>
          </button>

          <button
            id="btn-create-folder"
            onClick={() => {
              soundFx.playClick();
              setIsCreateFolderOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Neuer Ordner</span>
          </button>

          <button
            id="upload-file-btn"
            onClick={() => {
              soundFx.playClick();
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Datei hochladen</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {activeTab === 'rag' ? (
        <KnowledgeBaseManager />
      ) : (
        <>
          {/* Storage & Sync Metrics with Exact Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Gesamtspeicher</span>
                <div className="text-xl font-bold text-[var(--text-primary)] mt-1">{formatBytes(totalStorageBytes)}</div>
                <span className="text-[11px] text-emerald-500 flex items-center gap-1 mt-0.5 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> IndexedDB persistent
                </span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Ordner & Objekte</span>
                <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
                  {folderHierarchy.length} Ordner • {files.length} Dateien
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-mono">
                  SHA-256 dedupliziert
                </span>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                <FolderTree className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Mesh Synchronisation</span>
                <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
                  <RadioTower className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>P2P WebRTC Aktiv</span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-mono">
                  Zero-Cloud Syncthing Cluster
                </span>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Drag & Drop Ingestion Bar */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                : 'border-[var(--border-color)] hover:border-emerald-500/50 bg-[var(--bg-card)]/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                  Dateien hier ablegen für sofortigen Import in <span className="text-emerald-400 font-mono">"{currentFolderNode.name}"</span>
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Automatische SHA-256 Hashung, Deduplikation und lokale Verschlüsselung.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Status Notification */}
          <AnimatePresence>
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{uploadStatus}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breadcrumb Navigation Bar with Exact Folder Numbers */}
          <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono py-1">
              {currentPath !== '/' && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    const parent = currentFolderNode.parentPath || '/';
                    setCurrentPath(parent);
                  }}
                  className="p-1.5 rounded-lg bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] mr-1 flex items-center gap-1"
                  title="Eine Ebene nach oben"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Zurück</span>
                </button>
              )}

              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.path}>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setCurrentPath(crumb.path);
                      }}
                      className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                        isLast
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold'
                          : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Folder className={`w-3.5 h-3.5 ${isLast ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span>{crumb.name}</span>
                      {/* Explicit number behind folder */}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isLast ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'bg-[var(--bg-main)] text-[var(--text-tertiary)]'
                      }`}>
                        ({crumb.count})
                      </span>
                    </button>
                    {!isLast && <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Template switcher & DNA button */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                id="btn-open-dna-hud"
                onClick={() => {
                  soundFx.playClick();
                  setIsDNAHUDOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold transition flex items-center gap-1.5"
                title="Design DNA Inspector"
              >
                <Dna className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span className="hidden sm:inline">Gen {activeDNA.generation}</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                {[
                  { id: 'grid' as ExplorerTemplateId, icon: LayoutGrid, label: 'Grid' },
                  { id: 'list' as ExplorerTemplateId, icon: ListIcon, label: 'Liste' },
                  { id: 'spatial' as ExplorerTemplateId, icon: Network, label: 'Spatial' },
                  { id: 'tree' as ExplorerTemplateId, icon: FolderTree, label: 'Baum' },
                ].map((tpl) => {
                  const isActive = explorerTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        soundFx.playClick();
                        setExplorerTemplate(tpl.id);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                      title={`Ansicht: ${tpl.label}`}
                    >
                      <tpl.icon className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search, Scope & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  id="files-search-input"
                  type="text"
                  placeholder="Dateiname, Hash oder Pfad..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    recordTemplateInteraction(explorerTemplate, 'filter');
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Search Scope Toggle */}
              <div className="flex items-center gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[11px] font-mono shrink-0">
                <button
                  onClick={() => setSearchScope('current')}
                  className={`px-2 py-1 rounded-lg transition ${
                    searchScope === 'current'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Nur im aktuellen Ordner suchen"
                >
                  Ordner ({currentFolderFiles.length})
                </button>
                <button
                  onClick={() => setSearchScope('all')}
                  className={`px-2 py-1 rounded-lg transition ${
                    searchScope === 'all'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Im gesamten Dateisystem suchen"
                >
                  Gesamt ({files.length})
                </button>
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Alle' },
                { id: 'document', label: 'Dokumente' },
                { id: 'image', label: 'Bilder' },
                { id: 'audio', label: 'Audio' },
                { id: 'file', label: 'Dateien' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedType(tab.id);
                    recordTemplateInteraction(explorerTemplate, 'filter');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition whitespace-nowrap ${
                    selectedType === tab.id
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subfolders Grid with Prominent Count Badges */}
          {subfolders.length > 0 && searchQuery.trim() === '' && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>Unterordner in diesem Verzeichnis ({subfolders.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {subfolders.map((folder) => (
                  <div
                    key={folder.path}
                    onClick={() => {
                      soundFx.playClick();
                      setCurrentPath(folder.path);
                    }}
                    className="group p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-emerald-500/50 hover:bg-[var(--bg-hover)] cursor-pointer transition-all flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[var(--text-primary)] group-hover:text-emerald-400 truncate">
                          {folder.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
                          {formatBytes(folder.totalSizeBytes)}
                        </div>
                      </div>
                    </div>

                    {/* Prominent count badge behind folder */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        {folder.totalFilesCount}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Area based on Explorer Template */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden min-h-[380px] transition-all relative">
            {isLoading ? (
              <div className="p-16 text-center text-xs text-[var(--text-tertiary)] flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="font-mono font-medium">Lade lokale Dateien und Ordnerstrukturen...</span>
              </div>
            ) : displayedFiles.length === 0 && subfolders.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <FolderSync className="w-12 h-12 text-[var(--text-tertiary)] mx-auto opacity-30" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Dieser Ordner ist leer</p>
                <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
                  {searchQuery
                    ? 'Keine Treffer für Ihren Suchbegriff in diesem Bereich.'
                    : `Laden Sie Dateien hoch oder verschieben Sie bestehende Dokumente in '${currentFolderNode.name}'.`}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  Datei in diesen Ordner hochladen
                </button>
              </div>
            ) : explorerTemplate === 'grid' ? (
              /* Template 1: Detailed Grid View */
              <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedFiles.map((file) => {
                  const resolvedFolder = inferFolderPath(file);
                  const folderNode = folderMap.get(resolvedFolder);

                  return (
                    <div
                      key={file.id}
                      className="group p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/70 hover:border-emerald-500/50 hover:shadow-[0_0_16px_rgba(16,185,129,0.15)] transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] group-hover:scale-105 transition-transform">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {file.syncState === 'p2p_mesh' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20" title="P2P Mesh repliziert">
                              P2P
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-black/20 border border-[var(--border-color)] text-[9px] font-mono text-[var(--text-tertiary)]">
                            {file.mimeType.split('/')[1] || file.type}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedFileForPreview(file);
                          }}
                          className="font-bold text-xs text-[var(--text-primary)] hover:text-emerald-400 cursor-pointer truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                          <span>{formatBytes(file.sizeBytes)}</span>
                          <span className="truncate max-w-[100px]" title={folderNode?.name || resolvedFolder}>
                            📁 {folderNode?.name.split('&')[0] || resolvedFolder}
                          </span>
                        </div>
                      </div>

                      {/* Hash pill */}
                      <div className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between text-[9px] font-mono text-[var(--text-tertiary)]">
                        <span className="truncate max-w-[120px]" title={file.hash}>{file.hash.slice(0, 16)}...</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(file.hash);
                            setCopiedHash(file.id);
                            soundFx.playClick();
                            setTimeout(() => setCopiedHash(null), 2000);
                          }}
                          className="hover:text-emerald-400"
                          title="SHA-256 kopieren"
                        >
                          {copiedHash === file.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Action Toolbar */}
                      <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedFileForPreview(file);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                          title="Vorschau"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setFileToMove(file);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-emerald-400 transition"
                          title="In anderen Ordner verschieben"
                        >
                          <MoveRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            soundFx.playModuleActivate();
                            setActiveTab('rag');
                          }}
                          className="px-2 py-1 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-mono font-bold transition flex items-center gap-1"
                          title="An ColBERT RAG übergeben"
                        >
                          <Layers className="w-3 h-3" />
                          <span>RAG</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {file.dataBase64 && (
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-emerald-400 hover:text-emerald-300 transition"
                              title="Herunterladen"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-tertiary)] hover:text-rose-400 transition"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : explorerTemplate === 'tree' ? (
              /* Template 2: 2-Column Cyberpunk Directory Tree with Exact Numbers */
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)] min-h-[420px]">
                {/* Left Tree Pane with numbers */}
                <div className="p-4 space-y-1.5 font-mono text-xs overflow-y-auto max-h-[500px]">
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>ORDNER-STRUKTUR</span>
                    <span className="text-emerald-400">{folderHierarchy.length} Ordner</span>
                  </div>

                  {folderHierarchy.map((folder) => {
                    const isCurrent = currentPath === folder.path;
                    const depth = (folder.path.match(/\//g) || []).length - 1;
                    const paddingLeft = Math.max(0, depth) * 16;

                    return (
                      <div
                        key={folder.path}
                        style={{ paddingLeft: `${paddingLeft + 8}px` }}
                        onClick={() => {
                          soundFx.playClick();
                          setCurrentPath(folder.path);
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                          isCurrent
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                            : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-emerald-400' : 'text-amber-400'}`} />
                          <span className="truncate">{folder.name}</span>
                        </div>

                        {/* Exact number behind every single folder in the tree */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-2 ${
                          isCurrent
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[var(--bg-main)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                        }`}>
                          {folder.totalFilesCount}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Right Contents Pane */}
                <div className="p-4 md:col-span-2 space-y-2 overflow-y-auto max-h-[500px]">
                  <div className="text-[10px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>INHALT VON: {currentFolderNode.name}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {displayedFiles.length} Dateien ({formatBytes(currentFolderNode.totalSizeBytes)})
                    </span>
                  </div>

                  {displayedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-emerald-500/40 transition flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedFileForPreview(file);
                        }}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:text-emerald-400 flex-1"
                      >
                        {getFileIcon(file.type)}
                        <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
                          {file.fileName}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--text-tertiary)] shrink-0">
                        <span>{formatBytes(file.sizeBytes)}</span>
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setFileToMove(file);
                          }}
                          className="p-1 hover:text-emerald-400"
                          title="Verschieben"
                        >
                          <MoveRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setSelectedFileForPreview(file);
                          }}
                          className="p-1 hover:text-emerald-400"
                          title="Vorschau"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1 hover:text-rose-400"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : explorerTemplate === 'spatial' ? (
              /* Template 3: Spatial Graph with Folder Clusters & Counts */
              <div className="p-6 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                    <Network className="w-4 h-4" />
                    <span>SPATIAL CLUSTER GRAPH ({folderHierarchy.length} ORDNER • {files.length} DATEIEN)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Klicken Sie auf einen Ordner-Knoten zum Navigieren
                  </span>
                </div>

                <div className="relative h-96 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center p-4">
                  {/* Central Node */}
                  <div
                    onClick={() => {
                      soundFx.playClick();
                      setCurrentPath('/');
                    }}
                    className="absolute z-10 cursor-pointer w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex flex-col items-center justify-center text-center p-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                  >
                    <FolderTree className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400">ROOT CLUSTER</span>
                    <span className="text-[9px] font-mono font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full mt-1">
                      {files.length} Dateien
                    </span>
                  </div>

                  {/* Orbiting Folder Nodes */}
                  <div className="w-full h-full relative">
                    {folderHierarchy.filter((f) => f.path !== '/').map((folder, idx) => {
                      const total = folderHierarchy.length - 1;
                      const angle = (idx / total) * 2 * Math.PI;
                      const x = 50 + Math.cos(angle) * 36;
                      const y = 50 + Math.sin(angle) * 34;
                      const isCurrent = currentPath === folder.path;

                      return (
                        <motion.div
                          key={folder.path}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => {
                            soundFx.playClick();
                            setCurrentPath(folder.path);
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                        >
                          <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                            isCurrent
                              ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                              : 'bg-[var(--bg-card)] border-[var(--border-color)] group-hover:border-emerald-400'
                          }`}>
                            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] font-mono font-bold text-[var(--text-primary)] max-w-[90px] truncate">
                                {folder.name}
                              </div>
                              <div className="text-[9px] font-mono text-emerald-400 font-bold">
                                {folder.totalFilesCount} Dateien
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Template 4: Minimalist Table / Detailed List with Counts */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/50 text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] font-semibold font-mono">
                    <tr>
                      <th className="px-4 py-3">Element / Name</th>
                      <th className="px-4 py-3">Ordnerpfad</th>
                      <th className="px-4 py-3">MIME / Typ</th>
                      <th className="px-4 py-3">Größe / Anzahl</th>
                      <th className="px-4 py-3">Integrität & Sync</th>
                      <th className="px-4 py-3 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] font-mono">
                    {/* List folders first if at root or current directory */}
                    {subfolders.map((f) => (
                      <tr
                        key={f.path}
                        onClick={() => {
                          soundFx.playClick();
                          setCurrentPath(f.path);
                        }}
                        className="hover:bg-emerald-500/5 cursor-pointer transition-colors bg-amber-500/[0.02]"
                      >
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Folder className="w-4 h-4" />
                            </div>
                            <span className="text-emerald-400 font-bold">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{f.path}</td>
                        <td className="px-4 py-3 text-[var(--text-tertiary)]">Verzeichnis</td>
                        <td className="px-4 py-3 font-bold text-emerald-400">
                          {/* Clear number behind folder */}
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                            {f.totalFilesCount} Dateien
                          </span>
                        </td>
                        <td className="px-4 py-3 text-purple-400 text-[11px]">Mesh-Cluster</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] inline-block" />
                        </td>
                      </tr>
                    ))}

                    {displayedFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-[var(--bg-hover)]/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                              {getFileIcon(file.type)}
                            </div>
                            <div
                              onClick={() => {
                                soundFx.playClick();
                                setSelectedFileForPreview(file);
                              }}
                              className="truncate max-w-[180px] sm:max-w-xs font-semibold cursor-pointer hover:text-emerald-400"
                            >
                              {file.fileName}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-tertiary)] text-[11px]">
                          {file.folderPath || '/'}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[10px]">
                            {file.mimeType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {formatBytes(file.sizeBytes)}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-tertiary)] text-[11px]">
                          <span className="truncate block max-w-[120px]" title={file.hash}>
                            {file.hash.slice(0, 14)}...
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setFileToMove(file);
                              }}
                              title="In Ordner verschieben"
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-emerald-400 transition-colors"
                            >
                              <MoveRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setSelectedFileForPreview(file);
                              }}
                              title="Vorschau"
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {file.dataBase64 && (
                              <button
                                onClick={() => handleDownload(file)}
                                title="Herunterladen"
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(file.id)}
                              title="Löschen"
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-tertiary)] hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Create Folder */}
      <AnimatePresence>
        {isCreateFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                  <FolderPlus className="w-5 h-5" />
                  <span>Neuen Ordner erstellen</span>
                </div>
                <button
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)] font-medium">
                  Ordnername in <span className="font-mono text-emerald-400">{currentPath}</span>:
                </label>
                <input
                  type="text"
                  placeholder="z.B. Forschungsberichte oder DeepSearch-Ergebnisse"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  Ordner anlegen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Move File to Folder */}
      <AnimatePresence>
        {fileToMove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                  <MoveRight className="w-5 h-5" />
                  <span>Datei verschieben</span>
                </div>
                <button
                  onClick={() => setFileToMove(null)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Wählen Sie den Zielordner für <span className="font-bold text-[var(--text-primary)]">"{fileToMove.fileName}"</span>:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[var(--border-color)] rounded-xl p-2 bg-[var(--bg-main)]">
                {folderHierarchy.map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => handleMoveFile(fileToMove, folder.path)}
                    className="w-full text-left p-2 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 transition flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-amber-400" />
                      <span>{folder.name}</span>
                    </div>
                    {/* Exact number behind folder */}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] border border-[var(--border-color)] font-bold">
                      {folder.totalFilesCount}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setFileToMove(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: File Preview */}
      <AnimatePresence>
        {selectedFileForPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2.5">
                  {getFileIcon(selectedFileForPreview.type)}
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)] truncate max-w-md">
                      {selectedFileForPreview.fileName}
                    </h3>
                    <p className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      {formatBytes(selectedFileForPreview.sizeBytes)} • {selectedFileForPreview.mimeType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFileForPreview(null)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[200px] flex items-center justify-center bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] p-4">
                {selectedFileForPreview.type === 'image' && selectedFileForPreview.dataBase64 ? (
                  <img
                    src={selectedFileForPreview.dataBase64}
                    alt={selectedFileForPreview.fileName}
                    className="max-h-96 object-contain rounded-lg shadow-md"
                  />
                ) : selectedFileForPreview.type === 'audio' && selectedFileForPreview.dataBase64 ? (
                  <audio controls className="w-full" src={selectedFileForPreview.dataBase64} />
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <FileText className="w-12 h-12 text-emerald-400 mx-auto opacity-60" />
                    <p className="text-xs font-mono text-[var(--text-secondary)]">
                      Binärdatei sicher im IndexedDB Speicher hinterlegt
                    </p>
                    <p className="text-[10px] font-mono text-[var(--text-tertiary)] break-all max-w-md">
                      SHA-256: {selectedFileForPreview.hash}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                  Ordner: {inferFolderPath(selectedFileForPreview)}
                </span>
                <div className="flex gap-2">
                  {selectedFileForPreview.dataBase64 && (
                    <button
                      onClick={() => handleDownload(selectedFileForPreview)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedFileForPreview(null)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cognitive Template Design DNA HUD Modal */}
      <CognitiveTemplateDNAHUD isOpen={isDNAHUDOpen} onClose={() => setIsDNAHUDOpen(false)} />
    </div>
  );
}
