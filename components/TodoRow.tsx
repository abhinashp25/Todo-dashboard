"use client";

import { useState } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge, PriorityBadge } from "./Badges";
import { ChildrenPanel } from "./ChildrenPanel";
import type { Todo, TodoStatus, TodoPriority, TodoUpdate } from "@/lib/supabase";

interface Props {
  todo:     Todo;
  flash:    boolean;
  onUpdate: (id: string, update: TodoUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  index:    number;
}

const STATUSES:  TodoStatus[]  = ["pending","in_progress","completed","blocked"];
const PRIORITIES: TodoPriority[] = ["low","medium","high","critical"];
const AGENTS = ["","Agent Alpha","Agent Beta","Agent Gamma","Agent Delta","Agent Epsilon"];

export function TodoRow({ todo, flash, onUpdate, onDelete, index }: Props) {
  const [deleting,  setDeleting]  = useState(false);
  const [updating,  setUpdating]  = useState(false);

  const update = async (patch: TodoUpdate) => {
    setUpdating(true);
    try { await onUpdate(todo.id, patch); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(todo.id); }
    catch { setDeleting(false); }
  };

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(todo.updated_at), { addSuffix: true }); }
    catch { return "—"; }
  })();

  const hasChildren = (todo.child_count ?? 0) > 0;

  return (
    <tr
      className={flash ? "row-flash" : ""}
      style={{
        borderBottom: "1px solid var(--border)",
        opacity: deleting ? 0.4 : 1,
        transition: "opacity 0.3s ease",
        animationDelay: `${index * 0.04}s`,
      }}
    >
      {/* Index */}
      <td style={{ ...cell, width: "40px", color: "var(--text-dim)", textAlign: "center", fontSize: "11px" }}>
        {String(index + 1).padStart(2, "0")}
      </td>

      {/* Title + optional children panel */}
      <td style={{ ...cell, maxWidth: "280px" }}>
        <span
          style={{
            fontSize: "13px",
            color: todo.status === "completed" ? "var(--text-muted)" : "var(--text)",
            textDecoration: todo.status === "completed" ? "line-through" : "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {todo.title}
        </span>
        {hasChildren && (
          <ChildrenPanel
            parentId={todo.id}
            childCount={todo.child_count ?? 0}
          />
        )}
      </td>

      {/* Status */}
      <td style={{ ...cell, width: "160px" }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <StatusBadge status={todo.status} />
          <select
            value={todo.status}
            onChange={(e) => update({ status: e.target.value as TodoStatus })}
            disabled={updating}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </td>

      {/* Priority */}
      <td style={{ ...cell, width: "80px" }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
          <PriorityBadge priority={todo.priority} />
          <select
            value={todo.priority}
            onChange={(e) => update({ priority: e.target.value as TodoPriority })}
            disabled={updating}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </td>

      {/* Agent */}
      <td style={{ ...cell, width: "140px" }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px", maxWidth: "130px" }}>
          <span style={{ fontSize: "11px", color: todo.assigned_agent ? "var(--blue)" : "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {todo.assigned_agent ?? "—"}
          </span>
          <ChevronDown size={10} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
          <select
            value={todo.assigned_agent ?? ""}
            onChange={(e) => update({ assigned_agent: e.target.value || null })}
            disabled={updating}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
          >
            {AGENTS.map((a) => <option key={a} value={a}>{a || "Unassigned"}</option>)}
          </select>
        </div>
      </td>

      {/* Updated */}
      <td style={{ ...cell, width: "130px", color: "var(--text-dim)", fontSize: "11px" }}>
        {timeAgo}
      </td>

      {/* Delete */}
      <td style={{ ...cell, width: "40px", textAlign: "center" }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete task"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-dim)", padding: "4px", borderRadius: "3px",
            display: "inline-flex", alignItems: "center",
            opacity: deleting ? 0.4 : 1, transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--red)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)")}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

const cell: React.CSSProperties = {
  padding: "12px 14px",
  fontFamily: "var(--font-mono)",
  verticalAlign: "middle",
};
