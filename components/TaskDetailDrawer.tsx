"use client";

import { useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Todo, TodoUpdate } from "@/lib/supabase";
import { StatusBadge, PriorityBadge } from "@/components/Badges";

interface Props {
  todo: Todo;
  onClose: () => void;
  onUpdate: (id: string, update: TodoUpdate) => Promise<void>;
}

interface DrawerComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface NotesPayload {
  comments: DrawerComment[];
  legacyNote?: string;
}

function safeParseNotes(notes: string | null): NotesPayload {
  if (!notes) return { comments: [] };
  try {
    const parsed = JSON.parse(notes) as Partial<NotesPayload>;
    return {
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      legacyNote: typeof parsed.legacyNote === "string" ? parsed.legacyNote : undefined,
    };
  } catch {
    return { comments: [], legacyNote: notes };
  }
}

function makeCommentId() {
  return Math.random().toString(36).slice(2, 10);
}

export function TaskDetailDrawer({ todo, onClose, onUpdate }: Props) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const notes = useMemo(() => safeParseNotes(todo.notes), [todo.notes]);

  const timeline = useMemo(() => {
    const events: Array<{ id: string; at: string; label: string; detail: string }> = [
      {
        id: "created",
        at: todo.created_at,
        label: "Task created",
        detail: `Initial status ${todo.status.replace("_", " ")}, priority ${todo.priority}`,
      },
      {
        id: "updated",
        at: todo.updated_at,
        label: "Last update",
        detail: "Task changed in realtime board",
      },
      ...(notes.legacyNote
        ? [
            {
              id: "legacy-note",
              at: todo.updated_at,
              label: "Operational note",
              detail: notes.legacyNote,
            },
          ]
        : []),
      ...notes.comments.map((comment) => ({
        id: comment.id,
        at: comment.createdAt,
        label: `Comment by ${comment.author}`,
        detail: comment.text,
      })),
    ];

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [notes.comments, notes.legacyNote, todo.created_at, todo.priority, todo.status, todo.updated_at]);

  const addComment = async () => {
    const text = draft.trim();
    if (!text) return;

    const nextNotes: NotesPayload = {
      comments: [
        ...notes.comments,
        {
          id: makeCommentId(),
          text,
          author: "Ops",
          createdAt: new Date().toISOString(),
        },
      ],
      legacyNote: notes.legacyNote,
    };

    setSaving(true);
    try {
      await onUpdate(todo.id, { notes: JSON.stringify(nextNotes) });
      setDraft("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(2, 8, 18, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 95vw)",
          height: "100%",
          background: "linear-gradient(180deg, rgba(18,28,41,0.99), rgba(11,19,31,0.98))",
          borderLeft: "1px solid rgba(103,200,255,0.28)",
          padding: "18px",
          overflowY: "auto",
          boxShadow: "-24px 0 58px rgba(2,8,20,0.58)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div>
            <p className="kicker">Task Intelligence</p>
            <h3 style={{ marginTop: "8px", fontSize: "1.2rem", lineHeight: 1.35 }}>{todo.title}</h3>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "7px" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <StatusBadge status={todo.status} />
          <PriorityBadge priority={todo.priority} />
          <span className="toolbar-chip">{todo.assigned_agent ?? "Unassigned"}</span>
        </div>

        <section style={{ marginTop: "16px", border: "1px solid rgba(103,200,255,0.2)", borderRadius: "12px", padding: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ fontSize: "0.95rem" }}>Comments</h4>
            <span className="toolbar-chip">{notes.comments.length}</span>
          </div>

          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add context, blocker notes, decision..."
              className="app-input"
              style={{ fontFamily: "var(--font-sans)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addComment();
              }}
            />
            <button onClick={addComment} disabled={saving} className="btn-primary">
              <MessageCircle size={13} />
            </button>
          </div>
        </section>

        <section style={{ marginTop: "14px", border: "1px solid rgba(103,200,255,0.2)", borderRadius: "12px", padding: "12px" }}>
          <h4 style={{ fontSize: "0.95rem" }}>Activity timeline</h4>

          <div style={{ marginTop: "12px", display: "grid", gap: "9px" }}>
            {timeline.map((event) => (
              <article key={event.id} style={{ border: "1px solid rgba(113,132,164,0.28)", borderRadius: "10px", padding: "10px", background: "rgba(17,27,41,0.75)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <p style={{ fontWeight: 600, fontSize: "13px" }}>{event.label}</p>
                  <span style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                    {formatDistanceToNow(new Date(event.at), { addSuffix: true })}
                  </span>
                </div>
                <p style={{ marginTop: "5px", color: "var(--text-muted)", fontSize: "12px" }}>{event.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
