"use client";

import { useCallback, useRef, useState } from "react";
import type { GhostSuggestion, TodoPriority } from "@/lib/supabase";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

interface UseGhostDecomposeReturn {
  ghosts:      GhostSuggestion[];
  streaming:   boolean;
  error:       string | null;
  trigger:     (title: string, priority: string, agent: string, recentTasks: string[]) => void;
  cancel:      () => void;
  accept:      (id: string) => void;
  dismiss:     (id: string) => void;
  acceptAll:   () => void;
  dismissAll:  () => void;
  reset:       () => void;
}

export function useGhostDecompose(): UseGhostDecomposeReturn {
  const [ghosts,    setGhosts]    = useState<GhostSuggestion[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const abortRef    = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setGhosts([]);
    setError(null);
  }, [cancel]);

  const runDecompose = useCallback(
    async (title: string, priority: string, agent: string, recentTasks: string[]) => {
      cancel();
      setGhosts([]);
      setError(null);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/decompose", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ title, priority, agent, recentTasks }),
          signal:  controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData.error ?? `HTTP ${res.status}`);
        }

        // Parse the complete JSON response
        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response format from AI");
        }

        // Map to GhostSuggestion objects and reveal them one-by-one with stagger
        const suggestions: GhostSuggestion[] = data
          .filter((item: unknown) => {
            if (typeof item !== "object" || item === null) return false;
            const obj = item as Record<string, unknown>;
            return typeof obj.title === "string" && typeof obj.priority === "string";
          })
          .map((item: Record<string, unknown>) => ({
            id:        makeId(),
            title:     String(item.title),
            priority:  item.priority as TodoPriority,
            rationale: String(item.rationale ?? ""),
            accepted:  false,
            dismissed: false,
          }));

        if (suggestions.length === 0) {
          throw new Error("AI returned no subtasks. Try a more descriptive task title.");
        }

        // Stagger reveal for visual effect — show one every 120ms
        for (let i = 0; i < suggestions.length; i++) {
          await new Promise<void>((resolve) => setTimeout(resolve, 120));
          if (controller.signal.aborted) return;
          setGhosts((prev) => [...prev, suggestions[i]]);
        }

      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Decomposition failed";
        setError(msg);
      } finally {
        setStreaming(false);
      }
    },
    [cancel]
  );

  // Debounced trigger — fires 800ms after typing stops
  const trigger = useCallback(
    (title: string, priority: string, agent: string, recentTasks: string[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!title || title.trim().length < 4) {
        reset();
        return;
      }

      debounceRef.current = setTimeout(() => {
        runDecompose(title.trim(), priority, agent, recentTasks);
      }, 800);
    },
    [runDecompose, reset]
  );

  const accept    = useCallback((id: string) => setGhosts((p) => p.map((g) => g.id === id ? { ...g, accepted: true,  dismissed: false } : g)), []);
  const dismiss   = useCallback((id: string) => setGhosts((p) => p.map((g) => g.id === id ? { ...g, dismissed: true, accepted: false  } : g)), []);
  const acceptAll = useCallback(() => setGhosts((p) => p.map((g) => ({ ...g, accepted: true,  dismissed: false }))), []);
  const dismissAll= useCallback(() => setGhosts((p) => p.map((g) => ({ ...g, dismissed: true, accepted: false  }))), []);

  return { ghosts, streaming, error, trigger, cancel, accept, dismiss, acceptAll, dismissAll, reset };
}
