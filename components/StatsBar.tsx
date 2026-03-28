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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "10px",
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.status}
            style={{
              background: "linear-gradient(180deg, rgba(20,31,46,0.9), rgba(15,24,36,0.8))",
              border: `1px solid ${s.border}`,
              borderRadius: "12px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: s.color,
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {counts[s.status] ?? 0}
            </span>
            <span
              style={{
                fontSize: "9px",
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

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            flex: 1,
            height: "5px",
            background: "rgba(113,132,164,0.18)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completionPct}%`,
              background: "linear-gradient(90deg, var(--blue) 0%, var(--green) 100%)",
              borderRadius: "999px",
              boxShadow: "0 0 10px rgba(103,200,255,0.55)",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "var(--blue)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            minWidth: "36px",
            textAlign: "right",
            letterSpacing: "0.07em",
          }}
        >
          {completionPct}%
        </span>
      </div>
    </div>
  );
}
