import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface AutosaveOptions {
  assignmentId: string;
  stepKey: string;
  workflowKey?: string;
  debounceMs?: number;
}

interface AutosaveResult {
  saving: boolean;
  saved: boolean;
  error: string | null;
  lastSavedAt: Date | null;
  saveNow: () => Promise<void>;
}

/**
 * Custom hook for robust assignment progress autosave
 * 
 * Features:
 * - Debounced remote save (default 1500ms)
 * - Immediate localStorage backup
 * - Network failure handling
 * - Save status indicators
 * - Manual save trigger
 * 
 * Usage:
 * const { saving, saved, saveNow } = useAutosave({
 *   assignmentId: 'abc123',
 *   stepKey: 'stage_1_understanding',
 *   workflowKey: 'individual_and_state',
 * });
 * 
 * // In your component, whenever state changes:
 * useEffect(() => {
 *   saveToAutosave({ userInput, messages, quizPassed });
 * }, [userInput, messages, quizPassed]);
 */

export function useAutosave<T extends object>(
  options: AutosaveOptions
): AutosaveResult & { saveToAutosave: (content: T) => void } {
  const { assignmentId, stepKey, workflowKey = 'default', debounceMs = 1500 } = options;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const latestContent = useRef<T | null>(null);
  const saveInProgress = useRef(false);

  // Generate localStorage key
  const localStorageKey = `assignment_autosave_${assignmentId}_${stepKey}`;

  // Save to localStorage immediately (synchronous, no network)
  const saveToLocalStorage = useCallback((content: T) => {
    try {
      const data = {
        content,
        savedAt: new Date().toISOString(),
        assignmentId,
        stepKey,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(data));
    } catch (err) {
      console.error('[Autosave] localStorage write failed:', err);
    }
  }, [localStorageKey, assignmentId, stepKey]);

  // Save to remote API (debounced, async)
  const saveToRemote = useCallback(async (content: T) => {
    if (saveInProgress.current) {
      console.log('[Autosave] Save already in progress, skipping');
      return;
    }

    saveInProgress.current = true;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/assignment/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for auth cookies
        body: JSON.stringify({
          assignmentId,
          workflowKey,
          stepKey,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setSaved(true);
      setLastSavedAt(new Date(result.progress?.updated_at || Date.now()));
      console.log('[Autosave] Remote save success:', stepKey);

      // Reset "saved" indicator after 2 seconds
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error('[Autosave] Remote save failed:', err);
      setError(err.message || 'Save failed');
      
      // Show user-friendly error
      if (navigator.onLine) {
        toast.error('Autosave failed - saved locally');
      } else {
        toast('Offline - saved locally', { icon: '📴' });
      }
    } finally {
      setSaving(false);
      saveInProgress.current = false;
    }
  }, [assignmentId, workflowKey, stepKey]);

  // Debounced save function
  const saveToAutosave = useCallback((content: T) => {
    latestContent.current = content;

    // 1. Immediate localStorage save (no delay)
    saveToLocalStorage(content);

    // 2. Debounced remote save
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (latestContent.current) {
        saveToRemote(latestContent.current);
      }
    }, debounceMs);
  }, [saveToLocalStorage, saveToRemote, debounceMs]);

  // Manual save (no debounce)
  const saveNow = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (latestContent.current) {
      await saveToRemote(latestContent.current);
    }
  }, [saveToRemote]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    saving,
    saved,
    error,
    lastSavedAt,
    saveNow,
    saveToAutosave,
  };
}

/**
 * Load saved progress from both remote and localStorage
 * Returns the newest version (by timestamp)
 */
export async function loadAutosavedProgress<T>(
  assignmentId: string,
  stepKey: string
): Promise<T | null> {
  const localStorageKey = `assignment_autosave_${assignmentId}_${stepKey}`;

  // 1. Load from localStorage
  let localData: { content: T; savedAt: string } | null = null;
  try {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      localData = JSON.parse(stored);
    }
  } catch (err) {
    console.error('[Autosave] localStorage read failed:', err);
  }

  // 2. Load from remote API
  let remoteData: { content: T; updated_at: string } | null = null;
  try {
    const response = await fetch(
      `/api/assignment/progress?assignmentId=${assignmentId}`,
      { credentials: 'include' }
    );
    if (response.ok) {
      const result = await response.json();
      const stepProgress = result.progress?.find((p: any) => p.step_key === stepKey);
      if (stepProgress) {
        remoteData = {
          content: stepProgress.content,
          updated_at: stepProgress.updated_at,
        };
      }
    }
  } catch (err) {
    console.error('[Autosave] Remote load failed:', err);
  }

  // 3. Return the newest version
  if (!localData && !remoteData) return null;
  if (!localData) return remoteData!.content;
  if (!remoteData) return localData.content;

  const localTime = new Date(localData.savedAt).getTime();
  const remoteTime = new Date(remoteData.updated_at).getTime();

  if (localTime > remoteTime) {
    console.log('[Autosave] Using local version (newer)');
    toast('Restored local draft', { icon: '💾' });
    return localData.content;
  } else {
    console.log('[Autosave] Using remote version (newer)');
    return remoteData.content;
  }
}
