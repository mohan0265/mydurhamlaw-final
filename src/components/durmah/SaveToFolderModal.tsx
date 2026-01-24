import { useState, useEffect, useCallback } from 'react';
import { 
  X, Folder, FolderPlus, ChevronRight, ChevronDown, 
  Search, Plus, Check, Loader2, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

type FolderNode = {
  id: string;
  name: string;
  parent_id: string | null;
  children?: FolderNode[];
};

interface SaveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderId: string) => Promise<void>;
  isSaving: boolean;
  title?: string;
  buttonText?: string;
  initialFolderId?: string | null;
}

const FolderPickerItem = ({ 
  folder, 
  selectedId, 
  onSelect, 
  expandedIds, 
  onToggleExpand 
}: { 
  folder: FolderNode; 
  selectedId: string | null; 
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) => {
  const isSelected = selectedId === folder.id;
  const isExpanded = expandedIds.has(folder.id);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div 
        onClick={() => onSelect(folder.id)}
        className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
          isSelected ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'hover:bg-slate-50 text-slate-700'
        }`}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(folder.id);
          }}
          className={`p-1 rounded-md hover:bg-black/5 transition ${!hasChildren && 'invisible'}`}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <Folder className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
        <span className="text-sm font-semibold truncate">{folder.name}</span>
        {isSelected && <Check className="w-3 h-3 ml-auto" />}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-4 pl-2 border-l border-slate-100 mt-1 space-y-1">
          {folder.children!.map(child => (
            <FolderPickerItem 
              key={child.id} 
              folder={child} 
              selectedId={selectedId} 
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SaveToFolderModal({ isOpen, onClose, onSave, isSaving, title, buttonText, initialFolderId }: SaveToFolderModalProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/transcripts/folders/tree');
      const json = await resp.json();
      if (json.ok) {
        setFolders(json.tree);
        // Priority selection: prop > localStorage > "Unsorted" fallback
        if (initialFolderId) {
          setSelectedFolderId(initialFolderId);
          // Auto-expand parents if needed (simple check for now)
          setExpandedIds(prev => new Set(prev).add(initialFolderId));
        } else {
          const lastId = localStorage.getItem('durmah:lastFolderId');
          if (lastId) setSelectedFolderId(lastId);
          else {
             const unsorted = json.tree.find((f: any) => f.name === 'Unsorted');
             if (unsorted) setSelectedFolderId(unsorted.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load folders for picker:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadFolders();
  }, [isOpen, loadFolders]);

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
        await loadFolders();
        setSelectedFolderId(json.folder.id);
        if (parentId) setExpandedIds(prev => new Set(prev).add(parentId));
      }
    } catch (err) {
      toast.error("Failed to create folder");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title || "Save Transcript"}</h2>
            <p className="text-xs text-slate-500 font-medium">Choose a destination folder</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Search folders..." 
                 className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs font-medium">Loading folders...</p>
             </div>
          ) : (
             <div className="space-y-1">
                <div className="flex items-center justify-between px-2 mb-2">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">My Hierarchy</span>
                   <button 
                      onClick={() => handleCreateFolder(null)}
                      className="p-1 text-slate-400 hover:text-violet-600 transition flex items-center gap-1 text-[10px] font-bold"
                   >
                     <Plus className="w-3 h-3" /> New Root
                   </button>
                </div>
                {folders.map(node => (
                  <FolderPickerItem 
                    key={node.id} 
                    folder={node} 
                    selectedId={selectedFolderId}
                    onSelect={setSelectedFolderId}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                  />
                ))}
                
                {selectedFolderId && (
                   <div className="mt-4 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleCreateFolder(selectedFolderId)}
                        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition text-xs font-bold"
                      >
                         <FolderPlus className="w-4 h-4" /> Create Subfolder in selected
                      </button>
                   </div>
                )}
             </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white transition text-sm"
          >
            Cancel
          </button>
          <button 
            disabled={!selectedFolderId || isSaving}
            onClick={() => selectedFolderId && onSave(selectedFolderId)}
            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-violet-600 transition text-sm shadow-xl shadow-slate-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin" />
                 Processing...
               </>
            ) : (
               <>
                 <Check className="w-4 h-4" />
                 {buttonText || "Confirm & Save"}
               </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
