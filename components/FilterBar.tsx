"use client";

import { Search, X } from "lucide-react";
import type { TodoStatus, TodoPriority } from "@/lib/supabase";

export interface Filters {
  search: string;
  status: TodoStatus | "all";
  priority: TodoPriority | "all";
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const STATUS_OPTS: { value: TodoStatus | "all"; label: string }[] = [
  { value: "all",         label: "ALL STATUS"   },
  { value: "pending",     label: "PENDING"      },
  { value: "in_progress", label: "IN PROGRESS"  },
  { value: "completed",   label: "COMPLETED"    },
  { value: "blocked",     label: "BLOCKED"      },
];

const PRIORITY_OPTS: { value: TodoPriority | "all"; label: string }[] = [
  { value: "all",      label: "ALL PRIORITY" },
  { value: "low",      label: "LOW"          },
  { value: "medium",   label: "MEDIUM"       },
  { value: "high",     label: "HIGH"         },
  { value: "critical", label: "CRITICAL"     },
];

export function FilterBar({ filters, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
      {/* Search */}
      <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
        <Search
          size={13}
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search tasks..."
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            padding: "8px 10px 8px 30px",
            outline: "none",
            width: "100%",
          }}
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: "" })}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 0,
              display: "flex",
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as TodoStatus | "all" })}
        style={selectStyle}
      >
        {STATUS_OPTS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as TodoPriority | "all" })}
        style={selectStyle}
      >
        {PRIORITY_OPTS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "3px",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  letterSpacing: "0.06em",
  padding: "8px 10px",
  cursor: "pointer",
  outline: "none",
};
