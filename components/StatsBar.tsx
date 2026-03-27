"use client";

import type { Todo, TodoStatus } from "@/lib/supabase";

interface Props {
  todos: Todo[];
}

interface StatItem {
  label: string;
  status: TodoStatus | "total";
  color: string;
  border: string;
}

const STATS: StatItem[] = [
  { label: "Total",       status: "total",       color: "var(--text)",    border: "var(--border-bright)" },
  { label: "Pending",     status: "pending",     color: "var(--text-muted)", border: "#333" },
  { label: "In Progress", status: "in_progress", color: "var(--amber)",   border: "rgba(255,171,64,0.3)" },
  { label: "Completed",   status: "completed",   color: "var(--green)",   border: "rgba(0,230,118,0.3)" },
  { label: "Blocked",     status: "blocked",     color: "var(--red)",     border: "rgba(255,82,82,0.3)" },
];

export function StatsBar({ todos }: Props) {
  const counts = todos.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, pending: 0, in_progress: 0, completed: 0, blocked: 0 } as Record<string, number>
  );

  const completionPct =
    counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.status}
            style={{
              background: "var(--surface)",
              border: `1px solid ${s.border}`,
              borderRadius: "4px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: s.color,
                fontFamily: "var(--font-mono)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {counts[s.status] ?? 0}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            flex: 1,
            height: "3px",
            background: "var(--surface-3)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completionPct}%`,
              background: "linear-gradient(90deg, var(--green) 0%, rgba(0,230,118,0.6) 100%)",
              borderRadius: "2px",
              boxShadow: "0 0 8px rgba(0,230,118,0.5)",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "11px",
            color: "var(--green)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            minWidth: "36px",
            textAlign: "right",
          }}
        >
          {completionPct}%
        </span>
      </div>
    </div>
  );
}
