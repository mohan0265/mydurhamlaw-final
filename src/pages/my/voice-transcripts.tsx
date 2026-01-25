import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { withAuthProtection } from "@/lib/withAuthProtection";
import { 
  Search, Plus, Folder, FolderOpen, Star, MoreVertical, 
  Trash2, Copy, ChevronDown, ChevronRight, Pin, PinOff,
  Filter, Loader2, X, FolderPlus, List, Bookmark,
  MoreHorizontal, Download, Share2, CornerDownRight,
  Home, ChevronLeft, Edit3, Archive, Grid, LayoutList,
  FolderInput, ChevronUp, ChevronDown as ChevronDownIcon,
  Brain, Headphones, PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SaveToFolderModal from "@/components/durmah/SaveToFolderModal";

const supabase = getSupabaseClient();

// --- Types ---
type TranscriptTurn = {
  role?: string;
  text?: string;
  timestamp?: number;
};

type TranscriptFolder = {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  children?: TranscriptFolder[];
};

type VoiceJournalRow = {
  id: string;
  topic: string | null;
  summary?: string | null;
  content_text?: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: TranscriptTurn[] | null;
  is_pinned?: boolean;
  pinned_at?: string | null;
  archived?: boolean;
  source_type?: 'quiz' | 'voice_chat' | null;
  source_id?: string | null;
};

// --- Helpers ---
function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString(undefined, { timeZone: 'Europe/London', 
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

// --- Components ---

const Breadcrumbs = ({ path, onNavigate, isPinned }: { path: { id: string; name: string }[], onNavigate: (id: string) => void, isPinned: boolean }) => (
  <nav className="flex items-center gap-1 text-sm text-slate-500 mb-4 overflow-x-auto whitespace-nowrap pb-2">
    <button onClick={() => onNavigate('all')} className="hover:text-violet-600 transition flex items-center gap-1">
      <Home className="w-4 h-4" />
      <span>All</span>
    </button>
    {path.map((segment) => (
      <div key={segment.id} className="flex items-center gap-1">
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <button onClick={() => onNavigate(segment.id)} className="hover:text-violet-600 transition font-medium text-slate-700">
          {segment.name}
        </button>
      </div>
    ))}
  </nav>
);

const FolderTreeNode = ({ 
  folder, 
  selectedId, 
  onSelect, 
  expandedFolders, 
  toggleExpand,
  onCreateSubfolder,
  onRename,
  onDelete
}: { 
  folder: TranscriptFolder; 
  selectedId: string; 
  onSelect: (id: string) => void;
  expandedFolders: Set<string>;
  toggleExpand: (id: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onRename: (folder: TranscriptFolder) => void;
  onDelete: (id: string) => void;
}) => {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
          isSelected ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-600'
        }`}
        onClick={() => onSelect(folder.id)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id); }}
              className="p-0.5 hover:bg-slate-200 rounded transition"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <div className="w-4" />
          )}
          {isExpanded ? <FolderOpen className="w-4 h-4 text-violet-500 shrink-0" /> : <Folder className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className="text-sm font-semibold truncate">{folder.name}</span>
        </div>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folder.id); }} className="p-1 hover:text-violet-600 transition" title="New Subfolder">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRename(folder); }} className="p-1 hover:text-violet-600 transition" title="Rename">
            <Edit3 className="w-3 h-3" />
          </button>
          {folder.name !== 'Unsorted' && (
             <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }} className="p-1 hover:text-red-600 transition" title="Delete">
               <Trash2 className="w-3 h-3" />
             </button>
          )}
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-4 mt-1 border-l border-slate-100 pl-1 space-y-0.5">
          {folder.children!.map(child => (
            <FolderTreeNode 
                key={child.id} 
                folder={child} 
                selectedId={selectedId} 
                onSelect={onSelect}
                expandedFolders={expandedFolders}
                toggleExpand={toggleExpand}
                onCreateSubfolder={onCreateSubfolder}
                onRename={onRename}
                onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PAGE_SIZE = 20;

// Helper Component for Highlighting
const HighlightedText = ({ text, query, currentMatchIndex, matchCounter, onMatchFound }: { 
  text: string; 
  query: string; 
  currentMatchIndex: number;
  matchCounter: { count: number };
  onMatchFound?: (el: HTMLElement) => void;
}) => {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.toLowerCase() === query.toLowerCase()) {
          const matchIndex = matchCounter.count++;
          const isCurrent = matchIndex === currentMatchIndex;
          
          return (
            <span 
              key={i} 
              id={`match-${matchIndex}`}
              className={`rounded px-0.5 transition-all duration-300 ${isCurrent ? 'bg-amber-300 text-slate-900 shadow-sm ring-2 ring-amber-400' : 'bg-yellow-200 text-slate-900'}`}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

const TranscriptDetailsModal = ({ isOpen, onClose, transcript, searchQuery }: { isOpen: boolean; onClose: () => void; transcript: VoiceJournalRow | null; searchQuery: string }) => {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Reset match index when query changes or modal opens
  useEffect(() => {
    setCurrentMatchIndex(0);
    if (!transcript || !searchQuery) {
      setTotalMatches(0);
      return;
    }

    // Count total matches
    let count = 0;
    const re = new RegExp(searchQuery, 'gi');
    if (transcript.topic) count += (transcript.topic.match(re) || []).length;
    if (transcript.summary) count += (transcript.summary.match(re) || []).length;
    transcript.transcript?.forEach(turn => {
      if (turn.text) count += (turn.text.match(re) || []).length;
    });
    setTotalMatches(count);

  }, [searchQuery, transcript]);

  // Scroll to match
  useEffect(() => {
    if (totalMatches > 0) {
      const el = document.getElementById(`match-${currentMatchIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, totalMatches]);

  const handleNext = () => setCurrentMatchIndex(prev => (prev + 1) % totalMatches);
  const handlePrev = () => setCurrentMatchIndex(prev => (prev - 1 + totalMatches) % totalMatches);

  if (!isOpen || !transcript) return null;

  // Use a mutable counter for rendering pass
  const renderCounter = { count: 0 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
       >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
             <div className="flex items-center gap-4">
               <div>
                  <h2 className="text-xl font-bold text-slate-900">
                     <HighlightedText 
                        text={transcript.topic || 'Untitled'} 
                        query={searchQuery} 
                        currentMatchIndex={currentMatchIndex}
                        matchCounter={renderCounter}
                     />
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                     {formatDate(transcript.started_at || transcript.created_at)}
                  </p>
               </div>
               {searchQuery && totalMatches > 0 && (
                 <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                   <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition"><ChevronUp className="w-4 h-4" /></button>
                   <span className="text-xs font-bold text-slate-600 px-1 min-w-[3rem] text-center">{currentMatchIndex + 1} / {totalMatches}</span>
                   <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition"><ChevronDownIcon className="w-4 h-4" /></button>
                 </div>
               )}
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white rounded-xl shadow-sm transition">
                <X className="w-5 h-5 text-slate-400" />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
             {transcript.summary && (
               <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100">
                  <h4 className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-2">Auto Summary</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                     <HighlightedText 
                        text={transcript.summary} 
                        query={searchQuery} 
                        currentMatchIndex={currentMatchIndex}
                        matchCounter={renderCounter}
                     />
                  </p>
               </div>
             )}

             <div className="space-y-4">
                {transcript.transcript?.map((turn, i) => {
                   const isUser = turn.role === 'you' || turn.role === 'user';
                   return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                         isUser ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
                       }`}>
                          <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{isUser ? 'You' : 'Durmah'}</p>
                          <HighlightedText 
                            text={turn.text || ''} 
                            query={searchQuery} 
                            currentMatchIndex={currentMatchIndex}
                            matchCounter={renderCounter}
                          />
                       </div>
                    </div>
                   );
                })}
             </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
             <button 
               onClick={() => {
                 const text = (transcript.transcript || []).map(turn => `${turn.role || '??'}: ${turn.text || ''}`).join('\n');
                 navigator.clipboard.writeText(text).then(() => toast.success("Copied transcript"));
               }}
               className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-violet-600 transition"
             >
               <Copy className="w-4 h-4" /> Copy Full Text
             </button>
             <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-violet-600 transition"
             >
              Close View
             </button>
          </div>
       </motion.div>
    </div>
  );

};

export default withAuthProtection(function VoiceTranscriptsPage() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<TranscriptFolder[]>([]);
  const [transcripts, setTranscripts] = useState<VoiceJournalRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [isPinnedMode, setIsPinnedMode] = useState(false);
  // Derived for backward compatibility in some helpers
  const selectedFolderId = activeFolderId; 

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<'recent'|'oldest'|'title'>('recent');
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  
  // -- Move to Folder State --
  const [transcriptToMove, setTranscriptToMove] = useState<VoiceJournalRow | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // --- Data Loading ---

  const loadFolders = useCallback(async () => {
    try {
      const resp = await fetch('/api/transcripts/folders/tree');
      const json = await resp.json();
      if (json.ok) setFolders(json.tree);
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  }, []);

  const loadTranscripts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sort,
        query: debouncedQuery,
        folderId: activeFolderId === 'all' ? '' : activeFolderId,
        pinned: isPinnedMode ? 'true' : ''
      });
      const resp = await fetch(`/api/transcripts/list?${params.toString()}`);
      const json = await resp.json();
      if (json.ok) {
        setTranscripts(json.transcripts || []);
        setTotalCount(json.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load transcripts");
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedQuery, activeFolderId, isPinnedMode]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadTranscripts();
  }, [loadTranscripts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Breadcrumb Logic ---
  const breadcrumbs = useMemo(() => {
    if (activeFolderId === 'all') return [];
    
    const findPath = (nodes: TranscriptFolder[], targetId: string, currentPath: {id:string, name:string}[] = []): {id:string, name:string}[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) return [...currentPath, { id: node.id, name: node.name }];
        if (node.children) {
          const path = findPath(node.children, targetId, [...currentPath, { id: node.id, name: node.name }]);
          if (path) return path;
        }
      }
      return null;
    };
    return findPath(folders, activeFolderId) || [];
  }, [folders, activeFolderId]);

  // --- Folder Actions ---
  
  const handleCreateFolder = async (parentId: string | null = null) => {
    const name = prompt(parentId ? "Subfolder name:" : "New folder name:");
    if (!name?.trim()) return;
    try {
      const resp = await fetch('/api/transcripts/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId })
      });
      const json = await resp.json();
      if (json.ok) {
        toast.success("Folder created");
        loadFolders();
        if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
      } else {
        toast.error(json.error || "Failed to create folder");
      }
    } catch (err) {
      toast.error("Error creating folder");
    }
  };

  const handleRenameFolder = async (folder: TranscriptFolder) => {
    const name = prompt("Rename folder to:", folder.name);
    if (!name?.trim() || name === folder.name) return;
    try {
      const resp = await fetch('/api/transcripts/folders/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folder.id, name })
      });
      const json = await resp.json();
      if (json.ok) {
        toast.success("Folder renamed");
        loadFolders();
      }
    } catch (err) {
      toast.error("Error renaming folder");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Delete this folder? Mapping will be removed but transcripts remain.")) return;
    try {
      const resp = await fetch('/api/transcripts/folders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: id })
      });
      if (resp.ok) {
        toast.success("Folder deleted");
        if (activeFolderId === id) setActiveFolderId('all');
        loadFolders();
      }
    } catch (err) {
      toast.error("Error deleting folder");
    }
  };

  // --- Transcript Actions ---

  const handleTogglePin = async (t: VoiceJournalRow) => {
    try {
      const newVal = !t.is_pinned;
      const resp = await fetch('/api/transcripts/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptId: t.id, pinned: newVal })
      });
      if (resp.ok) {
        setTranscripts(prev => prev.map(item => item.id === t.id ? { ...item, is_pinned: newVal } : item));
        toast.success(newVal ? "Pinned" : "Unpinned");
      }
    } catch (err) {
      toast.error("Failed to update pin");
    }
  };

  const handleDeleteTranscript = async (id: string) => {
    if (!confirm("Delete this transcript permanently?")) return;
    setBusyId(id);
    try {
      const { error } = await supabase.from('voice_journals').delete().eq('id', id);
      if (error) throw error;
      setTranscripts(prev => prev.filter(t => t.id !== id));
      toast.success("Transcript deleted");
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmMove = async (targetFolderId: string) => {
    if (!transcriptToMove) return;
    setIsMoving(true);
    try {
      // 1. Assign to new folder
      const assignResp = await fetch('/api/transcripts/folders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            transcriptId: transcriptToMove.id, 
            folderId: targetFolderId, 
            assigned: true 
        })
      });
      const assignJson = await assignResp.json();
      
      if (!assignJson.ok) {
        throw new Error(assignJson.error || "Failed to assign to new folder");
      }

      // 2. If we are in a specific folder (not All), remove from current
      if (activeFolderId !== 'all' && activeFolderId !== targetFolderId) {
        await fetch('/api/transcripts/folders/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              transcriptId: transcriptToMove.id, 
              folderId: activeFolderId, 
              assigned: false 
          })
        });
      }

      toast.success("Transcript moved successfully");
      setTranscriptToMove(null);
      loadTranscripts();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while moving");
    } finally {
      setIsMoving(false);
    }
  };

  const toggleExpandFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Render ---

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
      {/* --- Sidebar (Explorer Tree) --- */}
      <aside className="w-full lg:w-72 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-[calc(100vh-64px)]">
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Library Explorer</h2>
            <button onClick={() => handleCreateFolder(null)} className="p-1 hover:text-violet-600 transition text-slate-400" title="New Root Folder">
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          
          <nav className="space-y-1 mb-8">
            <button 
              onClick={() => { setActiveFolderId('all'); setIsPinnedMode(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                activeFolderId === 'all' && !isPinnedMode ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
              All Transcripts
            </button>
            <button 
              onClick={() => { setActiveFolderId('all'); setIsPinnedMode(true); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                isPinnedMode && activeFolderId === 'all' ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Star className={`w-4 h-4 ${isPinnedMode || (activeFolderId === 'all' && isPinnedMode) ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              Pinned Items
            </button>
          </nav>

          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">Folders</h3>
            {folders.length === 0 ? (
              <p className="px-3 text-xs text-slate-400 italic">No folders created yet</p>
            ) : (
              folders.map(folder => (
                <FolderTreeNode 
                  key={folder.id} 
                  folder={folder} 
                  selectedId={activeFolderId}
                  onSelect={(id) => setActiveFolderId(id)}
                  expandedFolders={expandedFolders}
                  toggleExpand={toggleExpandFolder}
                  onCreateSubfolder={handleCreateFolder}
                  onRename={handleRenameFolder}
                  onDelete={handleDeleteFolder}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-64px)] overflow-hidden">
        {/* Header / Breadcrumbs / Search */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0">
                <Breadcrumbs path={breadcrumbs} onNavigate={setActiveFolderId} isPinned={isPinnedMode} />
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 truncate flex items-center gap-2">
                    {activeFolderId === 'all' ? 'All Transcripts' : 
                     breadcrumbs[breadcrumbs.length - 1]?.name || 'Explorer'}
                  </h1>
                  {isPinnedMode && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-700" /> Pinned Only
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative group w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition" />
                  <input 
                    type="text"
                    placeholder="Search titles & content..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setViewMode('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-slate-100 text-violet-600' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                    <Grid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-slate-100 text-violet-600' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Sort:</span>
                <select 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-violet-600 transition"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <p className="text-slate-500 font-medium">
                {loading ? 'Scanning...' : `${totalCount} item${totalCount === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </header>

        {/* Transcripts List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {loading && !transcripts.length ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-violet-500" />
                  <p className="font-medium">Pulling from archive...</p>
                </motion.div>
              ) : !transcripts.length ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    {searchQuery ? <Search className="w-10 h-10" /> : <Archive className="w-10 h-10" />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{searchQuery ? 'No matches found' : 'Empty Folder'}</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    {searchQuery ? "We couldn't find any transcripts matching your search." : "This folder doesn't have any transcripts yet. Save a session from Durmah to fill it up!"}
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}
                >
                  {transcripts.map((t) => (
                    <motion.div 
                      key={t.id} 
                      layout
                      className={`group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 ${
                        expandedTranscript === t.id ? 'ring-2 ring-violet-500 ring-offset-2' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(t.started_at || t.created_at)}</p>
                            {t.source_type === 'quiz' && (
                              <div className="bg-purple-100 p-0.5 rounded-md" title="Quiz Session">
                                <img src="/assets/mascots/quiz-me-bunny-96.webp" alt="Quiz Me Bunny" className="w-5 h-5 object-contain" />
                              </div>
                            )}
                            {t.source_type === 'voice_chat' && (
                              <div className="bg-blue-100 text-blue-600 p-1 rounded-md" title="Voice Discussion">
                                <Headphones className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 leading-tight truncate group-hover:text-violet-600 transition">{t.topic || 'Untitled Session'}</h3>
                        </div>
                        <button 
                          onClick={() => handleTogglePin(t)} 
                          className={`shrink-0 transition-colors p-1 rounded-md hover:bg-slate-50 ${t.is_pinned ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                          {t.is_pinned ? <Star className="w-5 h-5 fill-amber-500" /> : <Star className="w-5 h-5" />}
                        </button>
                      </div>

                      {t.summary && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{t.summary}</p>
                      )}

                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><List className="w-3 h-3" /> {t.transcript?.length || 0} Turns</span>
                        <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 text-green-500" /> {formatDuration(t.duration_seconds || 0)}</span>
                      </div>

                      {/* Overly Actions on Hover */}
                      <div className="flex items-center justify-end gap-1 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => setTranscriptToMove(t)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" 
                            title="Move to Folder"
                         >
                            <FolderInput className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => {
                                const text = (t.transcript || []).map(turn => `${turn.role || '??'}: ${turn.text || ''}`).join('\n');
                                navigator.clipboard.writeText(text).then(() => toast.success("Copied transcript"));
                            }}
                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition" 
                            title="Copy to Clipboard"
                         >
                            <Copy className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => handleDeleteTranscript(t.id)}
                            disabled={busyId === t.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition" 
                            title="Delete Permanently"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                         
                         {t.source_type === 'quiz' && t.source_id && (
                           <Link 
                              href={`/quiz/${t.source_id}`}
                              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-500/10 ml-2 animate-pulse"
                           >
                              <PlayCircle className="w-4 h-4" />
                              Resume Quiz
                           </Link>
                         )}

                         <Link 
                            href={`#`} 
                            onClick={(e) => { e.preventDefault(); setExpandedTranscript(t.id); }}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-violet-600 transition shadow-lg shadow-slate-900/10 ml-2"
                         >
                            View
                         </Link>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination Placeholder */}
            {totalCount > PAGE_SIZE && (
               <div className="mt-12 flex justify-center pb-8">
                  <button 
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={transcripts.length >= totalCount}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-violet-300 hover:text-violet-600 hover:shadow-lg transition disabled:opacity-50"
                  >
                    Load More Transcripts
                  </button>
               </div>
            )}
          </div>
        </div>
      </main>


      <TranscriptDetailsModal 
        isOpen={!!expandedTranscript}
        onClose={() => setExpandedTranscript(null)}
        transcript={transcripts.find(t => t.id === expandedTranscript) || null}
        searchQuery={searchQuery}
      />

      <AnimatePresence>
        {transcriptToMove && (
          <SaveToFolderModal
            isOpen={true}
            onClose={() => setTranscriptToMove(null)}
            onSave={handleConfirmMove}
            isSaving={isMoving}
            title="Move Transcript"
            buttonText="Move to this Folder"
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
});
