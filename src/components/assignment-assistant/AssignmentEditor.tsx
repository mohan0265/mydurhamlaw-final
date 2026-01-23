import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { 
  Bold, Italic, Type, 
  List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight,
  Download, FileText, Eraser
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

export interface AssignmentEditorHandle {
  focus: () => void;
  insertHtmlAtCursor: (html: string) => void;
  appendHtml: (html: string) => void;
  replaceSelection: (html: string) => void;
}

interface AssignmentEditorProps {
  valueHtml: string;
  onChange: (html: string, text: string) => void;
  className?: string;
}

const AssignmentEditor = forwardRef<AssignmentEditorHandle, AssignmentEditorProps>(({ valueHtml, onChange, className = '' }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);

  // Track if this is the initial mount
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize content on mount and when valueHtml significantly changes
  useEffect(() => {
    if (!editorRef.current) return;

    const currentContent = editorRef.current.innerHTML;
    
    // On first mount, always set the content
    if (!isInitialized) {
      editorRef.current.innerHTML = valueHtml || '';
      setIsInitialized(true);
      
      // Update word count
      const text = editorRef.current.innerText;
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      return;
    }

    // After initialization, only update if there's a significant change from parent
    // This handles stage transitions (e.g., moving to Review stage with final draft)
    const isDifferent = currentContent !== valueHtml;
    const isSignificantChange = Math.abs(currentContent.length - (valueHtml || '').length) > 50;
    
    // If parent is pushing new content (like when entering Review stage), update the editor
    if (isDifferent && (isSignificantChange || currentContent === '' || currentContent === '<br>')) {
      editorRef.current.innerHTML = valueHtml || '';
      
      // Update word count
      const text = editorRef.current.innerText;
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    }
  }, [valueHtml, isInitialized]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
      onChange(html, text);
    }
  };

  useImperativeHandle(ref, () => ({
    focus: () => {
      editorRef.current?.focus();
    },
    insertHtmlAtCursor: (html: string) => {
      if (!editorRef.current) return;
      editorRef.current.focus();

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // Check if range is inside editor
        if (editorRef.current.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            
            const el = document.createElement("div");
            el.innerHTML = html;
            const frag = document.createDocumentFragment();
            let lastNode;
            while (el.firstChild) {
                lastNode = frag.appendChild(el.firstChild);
            }
            range.insertNode(frag);
            
            // Move cursor after insertion
            if (lastNode) {
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        } else {
            // Fallback to append if selection is outside
             editorRef.current.innerHTML += html;
        }
      } else {
         editorRef.current.innerHTML += html;
      }
      handleInput(); // Trigger save
    },
    appendHtml: (html: string) => {
        if (!editorRef.current) return;
        editorRef.current.innerHTML += html;
        handleInput();
        // Scroll to bottom
        requestAnimationFrame(() => {
             if (editorRef.current) {
                 editorRef.current.scrollTop = editorRef.current.scrollHeight;
             }
        });
    },
    replaceSelection: (html: string) => {
         // Re-use insert for now
         if (!editorRef.current) return;
         editorRef.current.focus();
         const sel = window.getSelection();
         if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
             document.execCommand('insertHTML', false, html);
             handleInput();
         }
    }
  }));

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleDownloadDocx = async () => {
    if (!editorRef.current) return;
    const textContent = editorRef.current.innerText;
    
    // Basic DOCX generation (Multi-paragraph splitting)
    const paragraphs = textContent.split('\n').filter(p => p.trim()).map(text => 
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            font: "Times New Roman",
            size: 24, // 12pt = 24 half-points
          }),
        ],
        spacing: {
          line: 480, // Double spacing (240 = 1 line, 480 = 2 lines)
          after: 200, // Spacing after paragraph
        },
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
      styles: {
        default: {
            document: {
                run: {
                    font: "Times New Roman",
                    size: 24,
                }
            }
        }
      }
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `assignment_draft_${new Date().toISOString().slice(0, 10)}.docx`);
      toast.success('Downloaded DOCX');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate DOCX');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border-x border-gray-200 shadow-sm ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 flex-wrap">
        <ToolBtn icon={Bold} onClick={() => execCmd('bold')} title="Bold" />
        <ToolBtn icon={Italic} onClick={() => execCmd('italic')} title="Italic" />
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolBtn icon={AlignLeft} onClick={() => execCmd('justifyLeft')} title="Align Left" />
        <ToolBtn icon={AlignCenter} onClick={() => execCmd('justifyCenter')} title="Align Center" />
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolBtn icon={List} onClick={() => execCmd('insertUnorderedList')} title="Bullet List" />
        <ToolBtn icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} title="Numbered List" />

        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <ToolBtn icon={Type} onClick={() => execCmd('formatBlock', 'H2')} title="Heading" label="H2" />
        <ToolBtn icon={Eraser} onClick={() => execCmd('removeFormat')} title="Clear Formatting" />

        <div className="flex-1" />
        
        <button 
           onClick={handleDownloadDocx}
           className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded transition"
           title="Download as DOCX"
        >
           <Download size={14} />
           <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4" onClick={() => editorRef.current?.focus()}>
        <div 
           ref={editorRef}
           contentEditable
           onInput={handleInput}
           className="min-h-[800px] w-full max-w-[800px] mx-auto bg-white shadow-md p-[1in] outline-none"
           style={{
             fontFamily: '"Times New Roman", Times, serif',
             fontSize: '12pt',
             lineHeight: '2.0',
             color: '#000'
           }}
        />
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-t bg-gray-50 flex justify-between text-xs text-gray-500 font-mono">
         <span>Words: {wordCount}</span>
         <span>Times New Roman, 12pt, Double Spaced</span>
      </div>
    </div>
  );
});

AssignmentEditor.displayName = 'AssignmentEditor';
export default AssignmentEditor;

function ToolBtn({ icon: Icon, onClick, title, label }: any) {
    return (
        <button 
           onClick={(e) => { e.preventDefault(); onClick(); }}
           className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition flex items-center gap-1"
           title={title}
        >
            <Icon size={16} />
            {label && <span className="text-xs font-bold">{label}</span>}
        </button>
    )
}
