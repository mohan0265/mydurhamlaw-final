// File: /src/lib/hooks/useMemory.ts

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const useMemory = () => {
  const [memoryNotes, setMemoryNotes] = useState<string[]>([]);
  const [memory, setMemory] = useState<{ user: string; assistant: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemories = async () => {
      const { data, error } = await supabase
        .from('memory_logs')
        .select('note')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) {
        const notes = data.map((d) => d.note);
        setMemoryNotes(notes);
        setMemory(notes.map(note => ({ user: '', assistant: note })));
      }
      if (error) console.error('Error fetching memory logs:', error);
      setLoading(false);
    };
    fetchMemories();
  }, []);

  const updateMemory = (newMemory: { user: string; assistant: string }[]) => {
    setMemory(newMemory);
  };

  return { memoryNotes, loading, memory, updateMemory };
};
