"use client";

import type { TodoStatus, TodoPriority } from "@/lib/supabase";

// ── Status Badge ─────────────────────────────────────────────
const STATUS_MAP: Record<
  TodoStatus,
  { label: string; color: string; bg: string; glow: string; dot: string }
> = {
  pending: {
    label: "PENDING",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.04)",
    glow: "none",
    dot: "#555",
  },
  in_progress: {
    label: "IN PROGRESS",
    color: "var(--amber)",
    bg: "var(--amber-dim)",
    glow: "var(--amber-glow)",
    dot: "var(--amber)",
  },
  completed: {
    label: "COMPLETED",
    color: "var(--green)",
    bg: "var(--green-dim)",
    glow: "var(--green-glow)",
    dot: "var(--green)",
  },
  blocked: {
    label: "BLOCKED",
    color: "var(--red)",
    bg: "var(--red-dim)",
    glow: "var(--red-glow)",
    dot: "var(--red)",
  },
};

export function StatusBadge({ status }: { status: TodoStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "3px",
        background: s.bg,
        color: s.color,
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
        boxShadow: s.glow,
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
          animation: status === "in_progress" ? "pulse-dot 1.4s ease-in-out infinite" : "none",
          boxShadow: status !== "pending" ? `0 0 5px ${s.dot}` : "none",
        }}
      />
      {s.label}
    </span>
  );
}

// ── Priority Badge ────────────────────────────────────────────
const PRIORITY_MAP: Record<
  TodoPriority,
  { label: string; color: string; symbol: string }
> = {
  low:      { label: "LOW",      color: "var(--text-dim)",   symbol: "↓" },
  medium:   { label: "MED",      color: "var(--blue)",       symbol: "→" },
  high:     { label: "HIGH",     color: "var(--amber)",      symbol: "↑" },
  critical: { label: "CRIT",     color: "var(--red)",        symbol: "⚡" },
};

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const p = PRIORITY_MAP[priority];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        color: p.color,
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        fontFamily: "var(--font-mono)",
        opacity: 0.9,
      }}
    >
      <span style={{ fontSize: "11px" }}>{p.symbol}</span>
      {p.label}
    </span>
  );
}
