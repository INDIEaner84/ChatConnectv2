import { AttachmentEntity, AttachmentType } from '@/storage/types';

export interface FolderNode {
  path: string; // unique normalized path, e.g. "/documents/rag-sources"
  name: string; // display name, e.g. "ColBERT RAG Quellen"
  parentPath: string | null; // null for root "/"
  iconType: 'root' | 'document' | 'media' | 'chat' | 'mesh' | 'system' | 'custom';
  description: string;
  isSystem: boolean; // default system folders vs custom created
  directFilesCount: number;
  totalFilesCount: number; // direct + all recursive subfolders
  totalSizeBytes: number;
  syncState: 'synced' | 'local_only' | 'p2p_mesh' | 'syncing';
}

export const DEFAULT_FOLDER_DEFINITIONS: Omit<FolderNode, 'directFilesCount' | 'totalFilesCount' | 'totalSizeBytes'>[] = [
  {
    path: '/',
    name: 'Root / Alle Dateien',
    parentPath: null,
    iconType: 'root',
    description: 'Gesamtes lokales IndexedDB & P2P Mesh Dateisystem',
    isSystem: true,
    syncState: 'synced'
  },
  {
    path: '/documents',
    name: 'Dokumente & Wissensbasis',
    parentPath: '/',
    iconType: 'document',
    description: 'PDFs, Notizen, Wissensgraphen & Textquellen',
    isSystem: true,
    syncState: 'synced'
  },
  {
    path: '/documents/rag-sources',
    name: 'ColBERT RAG Quellen',
    parentPath: '/documents',
    iconType: 'document',
    description: 'Vektor-indexierte Dokumente für LiquidAI RAG',
    isSystem: true,
    syncState: 'p2p_mesh'
  },
  {
    path: '/documents/notes',
    name: 'Notizen & Markdown',
    parentPath: '/documents',
    iconType: 'document',
    description: 'Kognitive Notizen, Protokolle und Markdown-Dateien',
    isSystem: true,
    syncState: 'synced'
  },
  {
    path: '/documents/pdf-reports',
    name: 'PDFs & Berichte',
    parentPath: '/documents',
    iconType: 'document',
    description: 'Generierte Berichte und technische Datenblätter',
    isSystem: true,
    syncState: 'local_only'
  },
  {
    path: '/media',
    name: 'Medien & Aufnahmen',
    parentPath: '/',
    iconType: 'media',
    description: 'Bilder, Audio-Memos, Videoaufnahmen & Visualisierungen',
    isSystem: true,
    syncState: 'synced'
  },
  {
    path: '/media/images',
    name: 'Bilder & Grafiken',
    parentPath: '/media',
    iconType: 'media',
    description: 'Diagramme, Screenshots & generierte Bildartefakte',
    isSystem: true,
    syncState: 'synced'
  },
  {
    path: '/media/audio-memos',
    name: 'Voice Memos & Audio',
    parentPath: '/media',
    iconType: 'media',
    description: 'Sprachnachrichten & WebAudio Synthesen',
    isSystem: true,
    syncState: 'p2p_mesh'
  },
  {
    path: '/media/videos',
    name: 'Videos & Aufzeichnungen',
    parentPath: '/media',
    iconType: 'media',
    description: 'Bildschirmaufnahmen und Medienstreams',
    isSystem: true,
    syncState: 'local_only'
  },
  {
    path: '/chat-attachments',
    name: 'Chat-Anhänge & Transfers',
    parentPath: '/',
    iconType: 'chat',
    description: 'In Direkt- und Gruppenchats empfangene Dateien',
    isSystem: true,
    syncState: 'p2p_mesh'
  },
  {
    path: '/mesh-sync',
    name: 'Syncthing / P2P Mesh-Replikate',
    parentPath: '/',
    iconType: 'mesh',
    description: 'Peer-to-Peer synchronisierte Cluster-Dateien',
    isSystem: true,
    syncState: 'p2p_mesh'
  },
  {
    path: '/mesh-sync/incoming',
    name: 'Eingehende P2P Chunks',
    parentPath: '/mesh-sync',
    iconType: 'mesh',
    description: 'Aktuell über WebRTC DataChannels übertragene Blöcke',
    isSystem: true,
    syncState: 'syncing'
  },
  {
    path: '/mesh-sync/synced-nodes',
    name: 'Verteilte Replikate',
    parentPath: '/mesh-sync',
    iconType: 'mesh',
    description: 'Vollständig synchronisierte Knoten-Datensätze',
    isSystem: true,
    syncState: 'synced'
  },
  {
    path: '/system-logs',
    name: 'System, Audit & Diagnostik',
    parentPath: '/',
    iconType: 'system',
    description: 'LFM Traces, Audit-Logs & Hash-Prüfsummen',
    isSystem: true,
    syncState: 'local_only'
  }
];

/**
 * Automatically assign a sensible folder path if none is specified for a file
 */
export function inferFolderPath(file: AttachmentEntity): string {
  if (file.folderPath && file.folderPath.trim() !== '') {
    return file.folderPath;
  }

  const name = file.fileName.toLowerCase();
  const mime = file.mimeType.toLowerCase();

  if (name.includes('rag') || name.includes('colbert') || name.includes('embedding')) {
    return '/documents/rag-sources';
  }
  if (name.endsWith('.md') || name.endsWith('.txt') || name.includes('note')) {
    return '/documents/notes';
  }
  if (name.endsWith('.pdf') || mime.includes('pdf')) {
    return '/documents/pdf-reports';
  }
  if (file.type === 'image' || mime.startsWith('image/')) {
    return '/media/images';
  }
  if (file.type === 'audio' || mime.startsWith('audio/') || name.includes('voice') || name.endsWith('.wav') || name.endsWith('.mp3')) {
    return '/media/audio-memos';
  }
  if (file.type === 'video' || mime.startsWith('video/')) {
    return '/media/videos';
  }
  if (name.includes('sync') || name.includes('webrtc') || name.includes('mesh')) {
    return '/mesh-sync/synced-nodes';
  }
  if (name.includes('log') || name.includes('trace') || name.includes('audit') || name.endsWith('.json')) {
    return '/system-logs';
  }

  return '/documents';
}

/**
 * Builds the folder tree and computes file counts & sizes for every folder
 */
export function buildFolderHierarchy(
  files: AttachmentEntity[],
  customFolders: { path: string; name: string; parentPath: string }[] = []
): FolderNode[] {
  // Normalize each file to have a resolved folder
  const normalizedFiles = files.map((f) => ({
    ...f,
    resolvedFolder: inferFolderPath(f)
  }));

  // Combine default and custom folder definitions
  const allDefs: Omit<FolderNode, 'directFilesCount' | 'totalFilesCount' | 'totalSizeBytes'>[] = [
    ...DEFAULT_FOLDER_DEFINITIONS
  ];

  customFolders.forEach((cf) => {
    if (!allDefs.some((d) => d.path === cf.path)) {
      allDefs.push({
        path: cf.path,
        name: cf.name,
        parentPath: cf.parentPath,
        iconType: 'custom',
        description: `Benutzerdefinierter Ordner: ${cf.path}`,
        isSystem: false,
        syncState: 'local_only'
      });
    }
  });

  // Calculate counts
  const folderNodes: FolderNode[] = allDefs.map((def) => {
    // Direct files in this folder exactly
    const direct = normalizedFiles.filter((f) => {
      if (def.path === '/') {
        return f.resolvedFolder === '/' || f.resolvedFolder === '';
      }
      return f.resolvedFolder === def.path;
    });

    // Total files including all subfolders starting with def.path
    const total = normalizedFiles.filter((f) => {
      if (def.path === '/') return true; // root has all files
      return f.resolvedFolder === def.path || f.resolvedFolder.startsWith(def.path + '/');
    });

    const totalSize = total.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

    return {
      ...def,
      directFilesCount: direct.length,
      totalFilesCount: total.length,
      totalSizeBytes: totalSize
    };
  });

  return folderNodes;
}

export const INITIAL_SAMPLE_FILES: Omit<AttachmentEntity, 'id'>[] = [
  {
    fileName: 'ColBERT_Vector_Index_LFM.bin',
    mimeType: 'application/octet-stream',
    sizeBytes: 4280000,
    type: 'document',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    folderPath: '/documents/rag-sources',
    syncState: 'p2p_mesh',
    createdAt: Date.now() - 3600000 * 2
  },
  {
    fileName: 'LiquidAI_RAG_Corpus_v2.md',
    mimeType: 'text/markdown',
    sizeBytes: 184000,
    type: 'document',
    hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    folderPath: '/documents/rag-sources',
    syncState: 'synced',
    createdAt: Date.now() - 3600000 * 4
  },
  {
    fileName: 'Cognitive_OS_Architecture_Blueprint.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2450000,
    type: 'document',
    hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
    folderPath: '/documents/pdf-reports',
    syncState: 'synced',
    createdAt: Date.now() - 3600000 * 12
  },
  {
    fileName: 'Akira_Cyber_Design_System_Notes.md',
    mimeType: 'text/markdown',
    sizeBytes: 45200,
    type: 'document',
    hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    folderPath: '/documents/notes',
    syncState: 'synced',
    createdAt: Date.now() - 3600000 * 24
  },
  {
    fileName: 'Neural_Memory_Graph_Export.png',
    mimeType: 'image/png',
    sizeBytes: 1520000,
    type: 'image',
    hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    folderPath: '/media/images',
    syncState: 'synced',
    createdAt: Date.now() - 3600000 * 6
  },
  {
    fileName: 'Mesh_Sync_Topology_Diagram.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 320000,
    type: 'image',
    hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    folderPath: '/media/images',
    syncState: 'p2p_mesh',
    createdAt: Date.now() - 3600000 * 18
  },
  {
    fileName: 'Voice_Synthesis_Liquid_LFM_Sample.wav',
    mimeType: 'audio/wav',
    sizeBytes: 980000,
    type: 'audio',
    hash: 'eccbc87e4b5ce2fe28308fd9f2a7baf3a3d537f884a43b4f62772591786520e5',
    folderPath: '/media/audio-memos',
    syncState: 'p2p_mesh',
    createdAt: Date.now() - 3600000 * 8
  },
  {
    fileName: 'Syncthing_Mesh_Cluster_Config.xml',
    mimeType: 'text/xml',
    sizeBytes: 64000,
    type: 'file',
    hash: 'c81e728d9d4c2f636f067f89cc14862c1ecd97932b3835ba8f45645f77d667a8',
    folderPath: '/mesh-sync/synced-nodes',
    syncState: 'p2p_mesh',
    createdAt: Date.now() - 3600000 * 14
  },
  {
    fileName: 'WebRTC_P2P_Chunk_Stream_089.bin',
    mimeType: 'application/octet-stream',
    sizeBytes: 512000,
    type: 'file',
    hash: 'a87ff679a2f3e71d9181a67b7542122c34a2e5d9962f928e4693a1529a674404',
    folderPath: '/mesh-sync/incoming',
    syncState: 'syncing',
    createdAt: Date.now() - 3600000 * 1
  },
  {
    fileName: 'Audit_Trace_Security_Matrix.json',
    mimeType: 'application/json',
    sizeBytes: 128000,
    type: 'file',
    hash: 'e4da3b7fbbce2345d7772b0674a318d5bbf764f69e9e1150fc90f45625e1df37',
    folderPath: '/system-logs',
    syncState: 'local_only',
    createdAt: Date.now() - 3600000 * 30
  }
];
