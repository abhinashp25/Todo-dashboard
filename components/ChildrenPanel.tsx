"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fetchChildren, updateTodo } from "@/lib/supabase";
import type { Todo, TodoStatus } from "@/lib/supabase";
import { StatusBadge } from "@/components/Badges";

interface Props {
  parentId:    string;
  childCount:  number;
  onStatusChange?: () => void;
}

export function ChildrenPanel({ parentId, childCount, onStatusChange }: Props) {
  const [open,     setOpen]     = useState(false);
  const [children, setChildren] = useState<Todo[]>([]);
  const [loading,  setLoading]  = useState(false);

  const handleToggleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    setLoading(true);
    try {
      const nextChildren = await fetchChildren(parentId);
      setChildren(nextChildren);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const completed = children.filter((c) => c.status === "completed").length;
  const pct       = children.length > 0 ? Math.round((completed / children.length) * 100) : 0;

  const handleChildStatus = async (id: string, status: TodoStatus) => {
    await updateTodo(id, { status });
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    onStatusChange?.();
  };

  return (
    <div style={{ marginTop: "4px" }}>
      {/* Toggle button */}
      <button
        onClick={handleToggleOpen}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 0",
          color: "var(--text-muted)",
        }}
      >
        {open ? (
          <ChevronDown size={11} style={{ color: "var(--blue)" }} />
        ) : (
          <ChevronRight size={11} style={{ color: "var(--blue)" }} />
        )}

        {/* Progress ring */}
        <ProgressRing pct={pct} size={14} />

        <span
          style={{
            fontSize: "10px",
            color: "var(--blue)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          {childCount} subtask{childCount !== 1 ? "s" : ""} · {pct}%
        </span>
      </button>

      {/* Children list */}
      {open && (
        <div
          style={{
            marginTop: "6px",
            borderLeft: "2px solid rgba(68,138,255,0.2)",
            paddingLeft: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            animation: "fadeSlideUp 0.15s ease both",
          }}
        >
          {loading && (
            <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Loading…</span>
          )}
          {!loading && children.map((child) => (
            <div
              key={child.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 6px",
                borderRadius: "3px",
                background:
                  child.status === "completed"
                    ? "rgba(0,230,118,0.04)"
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                <StatusBadge status={child.status} />
                <select
                  value={child.status}
                  onChange={(e) => handleChildStatus(child.id, e.target.value as TodoStatus)}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                >
                  {(["pending","in_progress","completed","blocked"] as TodoStatus[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: child.status === "completed" ? "var(--text-dim)" : "var(--text-muted)",
                  textDecoration: child.status === "completed" ? "line-through" : "none",
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {child.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tiny SVG progress ring ────────────────────────────────────
function ProgressRing({ pct, size }: { pct: number; size: number }) {
  const r   = (size - 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--surface-3)"
        strokeWidth="1.5"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="1.5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}
