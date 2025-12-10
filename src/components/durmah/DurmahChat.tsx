import { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowRight, Brain, AlertTriangle, Send } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthContext';
import { useDurmah } from '@/lib/durmah/context';
import { useDurmahDynamicContext } from '@/hooks/useDurmahDynamicContext';
import { buildDurmahSystemPrompt } from '@/lib/durmah/systemPrompt';

type Msg = { role: "durmah" | "you"; text: string; ts: number };

interface DurmahChatProps {
  contextType: "assignment" | "exam" | "general";
  contextTitle: string;
  contextId?: string;
  systemHint?: string;
  initialPrompt?: string;
  className?: string;
}

export default function DurmahChat({
  contextType,
  contextTitle,
  contextId,
  systemHint,
  initialPrompt,
  className = ""
}: DurmahChatProps) {
  const { user } = useAuth();
  const durmahCtx = useDurmah();
  const { upcomingTasks, todaysEvents } = useDurmahDynamicContext();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting or prompt
  useEffect(() => {
    if (messages.length === 0) {
      if (initialPrompt) {
         // Auto-send initial prompt from user side perspective? Or system greeting?
         // Usually better to have Durmah greet with context.
         setMessages([{ role: "durmah", text: initialPrompt, ts: Date.now() }]);
      } else {
         const greeting = contextType === 'assignment' 
            ? `I'm ready to help with "${contextTitle}". We can break it down, plan your research, or check your structure.`
            : contextType === 'exam'
            ? `Let's get exam ready for "${contextTitle}". I can help with revision planning and testing your knowledge.`
            : `Hello! I'm listening.`;
         setMessages([{ role: "durmah", text: greeting, ts: Date.now() }]);
      }
    }
  }, [contextType, contextTitle, initialPrompt, messages.length]);

  // Construct context-aware system prompt
  const systemPrompt = useMemo(() => {
    // Base student context
    const studentContext = {
      userId: user?.id || "anon",
      firstName: durmahCtx.firstName || "Student",
      university: "Durham University",
      programme: durmahCtx.programme || "Law",
      yearGroup: durmahCtx.yearKey || "year1",
      academicYear: durmahCtx.academicYear || "2025/26",
      modules: durmahCtx.modules || [],
      nowPhase: durmahCtx.nowPhase || "term time",
      currentPhase: durmahCtx.nowPhase || "term time",
      keyDates: durmahCtx.keyDates || [],
      todayLabel: new Date().toDateString(),
      upcomingTasks,
      todaysEvents
    };

    let contextInstruction = "";
    if (contextType === "assignment") {
      contextInstruction = `
Current Context: ASSIGNMENT ASSISTANCE
Assignment: "${contextTitle}"
ID: ${contextId || 'N/A'}

ROLE: You are an academic mentor. You MUST NOT write the student's assignment for them.
- Help break down the question.
- Suggest structures and outlines.
- Explain legal concepts relative to the topic.
- Critique draft text if provided.
- REMIND them to follow Durham's academic integrity rules.
- If asked to write the essay, refuse politely and offer to help plan it instead.
${systemHint || ""}
`;
    } else if (contextType === "exam") {
      contextInstruction = `
Current Context: EXAM PREPARATION
Module/Exam: "${contextTitle}"
ID: ${contextId || 'N/A'}

ROLE: You are a revision coach.
- Focus on testing knowledge, explaining concepts, and revision planning.
- Do NOT help with live exam questions.
- If the student implies they are in a live exam, refuse to answer content questions.
${systemHint || ""}
`;
    }

    // Combine standard prompt with specific context
    // We can reuse buildDurmahSystemPrompt and append, or build a custom one.
    // Ideally we append our specific instructions to the standard persona.
    const basePrompt = buildDurmahSystemPrompt(studentContext as any, null, upcomingTasks, todaysEvents, { systemTone: "Mentor" });
    return `${basePrompt}\n\n${contextInstruction}`;
  }, [user, durmahCtx, upcomingTasks, todaysEvents, contextType, contextTitle, contextId, systemHint]);

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;
    const userText = input.trim();
    setInput("");
    
    const now = Date.now();
    const newHistory = [...messages, { role: "you" as const, text: userText, ts: now }];
    setMessages(newHistory);
    
    // Add placeholder for AI response
    const assistantId = now + 1;
    setMessages(prev => [...prev, { role: "durmah", text: "", ts: assistantId }]);
    setIsStreaming(true);

    try {
      const controller = new AbortController();
      streamControllerRef.current = controller;

      // Prepare payload
      const payloadMessages = [
        { role: "system", content: systemPrompt },
        ...newHistory.map(m => ({
          role: m.role === "durmah" ? "assistant" : "user",
          content: m.text
        }))
      ];

      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           messages: payloadMessages,
           // Metadata for backend logging if supported
           metadata: {
             pageContext: contextType,
             contextId,
             userId: user?.id
           }
        }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error(await res.text());
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        
        setMessages(current => 
          current.map(m => m.ts === assistantId ? { ...m, text: buf } : m)
        );
      }
      
      buf += decoder.decode();
      setMessages(current => 
        current.map(m => m.ts === assistantId ? { ...m, text: buf.trim() } : m)
      );

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(current => 
          current.map(m => m.ts === assistantId ? { ...m, text: "I'm having trouble connecting right now." } : m)
        );
      }
    } finally {
      setIsStreaming(false);
      streamControllerRef.current = null;
    }
  }

  return (
    <div className={`flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
            <Brain size={16} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Durmah</div>
            <div className="text-xs text-violet-600 font-medium">
              {contextType === 'assignment' ? 'Assignment Mentor' : 'Exam Coach'}
            </div>
          </div>
        </div>
        {contextTitle && (
          <div className="text-xs text-gray-400 max-w-[150px] truncate text-right">
            {contextTitle}
          </div>
        )}
      </div>

      {/* Ethics Banner */}
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 leading-tight">
          {contextType === 'assignment' 
            ? "Durmah helps you think, plan, and revise — not write your work for you. Always submit your own original work."
            : "No AI use permitted in live exams or prohibited assessments. Use this for revision only."
          }
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((m) => (
          <div key={m.ts} className={`flex ${m.role === "you" ? "justify-end" : "justify-start"}`}>
            <div
              className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed ${
                m.role === "you"
                  ? "bg-violet-600 text-white rounded-tr-sm"
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
         {isStreaming && (
            <div className="flex justify-start">
               <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
                  <div className="flex gap-1">
                     <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-75"></span>
                     <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-150"></span>
                  </div>
               </div>
            </div>
         )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask for help..."
            className="flex-1 resize-none h-12 py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-50 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="w-12 h-12 flex items-center justify-center bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-[10px] text-center text-gray-400 mt-2">
          AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
}
