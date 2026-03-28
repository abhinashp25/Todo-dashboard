"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { TodoInsert, TodoStatus, TodoPriority, Todo } from "@/lib/supabase";
import { insertTodos, logGhostFeedback } from "@/lib/supabase";
import { useGhostDecompose } from "@/lib/useGhostDecompose";
import { GhostPanel } from "@/components/GhostPanel";

interface Props {
  onAdd:      (todo: TodoInsert) => Promise<void>;
  onClose:    () => void;
  recentTodos?: Todo[];
}

const AGENTS = ["Agent Alpha","Agent Beta","Agent Gamma","Agent Delta","Agent Epsilon"];

export function AddTodoModal({ onAdd, onClose, recentTodos = [] }: Props) {
  const [title,    setTitle]    = useState("");
  const [status,   setStatus]   = useState<TodoStatus>("pending");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [agent,    setAgent]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const {
    ghosts, streaming, error: ghostError,
    trigger, cancel, accept, dismiss, acceptAll, dismissAll, reset,
  } = useGhostDecompose();

  // Recent completed task titles for context injection
  const recentTitles = recentTodos
    .filter((t) => t.status === "completed")
    .slice(0, 5)
    .map((t) => t.title);

  // Trigger ghost decomposition on title change
  useEffect(() => {
    trigger(title, priority, agent, recentTitles);
    return () => {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, priority, agent]);

  const acceptedGhosts = ghosts.filter((g) => g.accepted && !g.dismissed);
  const hasGhosts = ghosts.some((g) => !g.dismissed) || streaming;

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    cancel();

    try {
      // 1. Insert the parent task
      await onAdd({ title: title.trim(), status, priority, assigned_agent: agent || null });

      // We need the parent id — fetch it back via the realtime hook which will
      // emit it. Instead, we do a direct insert then bulk-insert children.
      // Better pattern: insert parent, get id, insert children.
      const { data: parentData, error: parentErr } = await import("@/lib/supabase").then(
        (m) => m.supabase.from("todos").select("id").eq("title", title.trim())
          .order("created_at", { ascending: false }).limit(1).single()
      );

      if (!parentErr && parentData && acceptedGhosts.length > 0) {
        const parentId = (parentData as { id: string }).id;

        const childInserts: TodoInsert[] = acceptedGhosts.map((g, i) => ({
          title:          g.title,
          status:         "pending" as TodoStatus,
          priority:       g.priority,
          assigned_agent: agent || null,
          parent_id:      parentId,
          position:       i,
        }));

        await insertTodos(childInserts);

        // Log telemetry (fire and forget)
        ghosts.forEach((g) => {
          logGhostFeedback(title.trim(), g.title, g.priority, g.accepted && !g.dismissed);
        });
      }

      reset();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100,
        animation: "fadeSlideIn 0.2s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, rgba(19,29,44,0.98), rgba(14,23,35,0.96))",
          border: "1px solid rgba(95,132,191,0.35)",
          borderRadius: "14px",
          width: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          display: "flex", flexDirection: "column", gap: "20px",
          animation: "fadeSlideUp 0.25s ease both",
          boxShadow: "0 24px 60px rgba(2,8,20,0.75)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
            NEW_TASK
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
            <X size={16} />
          </button>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={labelStyle}>TITLE</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Describe the task — AI will suggest subtasks…"
            className="app-input"
            style={inputStyle}
          />
        </div>

        {/* Ghost panel — appears as user types */}
        {hasGhosts && (
          <GhostPanel
            ghosts={ghosts}
            streaming={streaming}
            error={ghostError}
            parentTitle={title}
            onAccept={accept}
            onDismiss={dismiss}
            onAcceptAll={acceptAll}
            onDismissAll={dismissAll}
          />
        )}

        {/* Row: Status + Priority */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>STATUS</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TodoStatus)} className="app-select" style={selectStyle}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>PRIORITY</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)} className="app-select" style={selectStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Agent */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={labelStyle}>ASSIGNED AGENT</label>
          <select value={agent} onChange={(e) => setAgent(e.target.value)} className="app-select" style={selectStyle}>
            <option value="">— Unassigned —</option>
            {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Accepted subtask summary */}
        {acceptedGhosts.length > 0 && (
          <div style={{
            padding: "10px 12px",
            background: "rgba(0,230,118,0.05)",
            border: "1px solid rgba(0,230,118,0.2)",
            borderRadius: "4px",
            fontSize: "11px",
            color: "var(--green)",
            fontFamily: "var(--font-mono)",
          }}>
            ✓ {acceptedGhosts.length} subtask{acceptedGhosts.length > 1 ? "s" : ""} will be created automatically
          </div>
        )}

        {/* Error */}
        {error && (
          <span style={{ fontSize: "11px", color: "var(--red)", fontFamily: "var(--font-mono)" }}>
            ⚠ {error}
          </span>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
          <button onClick={onClose} style={btnSecondaryStyle}>CANCEL</button>
          <button onClick={handleSubmit} disabled={saving} style={btnPrimaryStyle}>
            {saving ? "SAVING..." : acceptedGhosts.length > 0
              ? `CREATE + ${acceptedGhosts.length} SUBTASKS`
              : "CREATE TASK"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-mono)",
};
const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  padding: "10px 12px",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
const btnSecondaryStyle: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border-bright)", borderRadius: "8px",
  color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px",
  letterSpacing: "0.08em", padding: "8px 16px", cursor: "pointer",
};
const btnPrimaryStyle: React.CSSProperties = {
  background: "linear-gradient(125deg, #72cfff, #59ecbb)", border: "none", borderRadius: "8px", color: "#06121e",
  fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
  letterSpacing: "0.08em", padding: "8px 18px", cursor: "pointer",
};
