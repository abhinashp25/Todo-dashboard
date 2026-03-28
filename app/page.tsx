"use client";

import { useMemo, useState } from "react";
import { Plus, WifiOff, RefreshCw, Terminal, Sparkles } from "lucide-react";
import { useRealtimeTodos } from "@/lib/useRealtimeTodos";
import { StatsBar } from "@/components/StatsBar";
import { TodoRow } from "@/components/TodoRow";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { AddTodoModal } from "@/components/AddTodoModal";

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

export default function DashboardPage() {
  const { todos, loading, error, connected, recentlyUpdated, addTodo, patchTodo, removeTodo } =
    useRealtimeTodos();

  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "", status: "all", priority: "all",
  });

  const filtered = useMemo(() => {
    let list = todos;
    if (filters.status !== "all")   list = list.filter((t) => t.status === filters.status);
    if (filters.priority !== "all") list = list.filter((t) => t.priority === filters.priority);
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) ||
               (t.assigned_agent?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...list].sort((a, b) => {
      const pw = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      if (pw !== 0) return pw;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [todos, filters]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-mono)" }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{
        borderBottom: "1px solid var(--border)", padding: "0 32px", height: "52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--surface)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Terminal size={16} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.15em", color: "var(--text)" }}>
            TASKOPS
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.06em", borderLeft: "1px solid var(--border)", paddingLeft: "10px", marginLeft: "2px" }}>
            REAL-TIME DASHBOARD
          </span>
          {/* AI badge */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "9px", color: "var(--amber)", letterSpacing: "0.07em",
            background: "rgba(255,171,64,0.08)", border: "1px solid rgba(255,171,64,0.2)",
            padding: "2px 7px", borderRadius: "3px",
          }}>
            <Sparkles size={9} />
            AI DECOMPOSITION
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {connected ? (
              <>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)", animation: "pulse-dot 2s ease-in-out infinite" }} />
                <span style={{ fontSize: "10px", color: "var(--green)", letterSpacing: "0.08em" }}>LIVE</span>
              </>
            ) : (
              <>
                <WifiOff size={12} style={{ color: "var(--text-dim)" }} />
                <span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.08em" }}>CONNECTING</span>
              </>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "var(--green)", border: "none", borderRadius: "3px",
              color: "#000", fontFamily: "var(--font-mono)", fontSize: "11px",
              fontWeight: 700, letterSpacing: "0.08em", padding: "7px 14px", cursor: "pointer",
            }}
          >
            <Plus size={13} />
            NEW TASK
          </button>
        </div>
      </nav>

      {/* ── MAIN ────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "32px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
        {error && (
          <div style={{ background: "var(--red-dim)", border: "1px solid var(--red)", borderRadius: "4px", color: "var(--red)", padding: "10px 16px", fontSize: "12px", marginBottom: "24px" }}>
            ⚠ {error}
          </div>
        )}

        <section style={{ marginBottom: "28px" }}>
          <StatsBar todos={todos} />
        </section>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>TASKS</span>
            <span style={{ fontSize: "10px", color: "var(--text-dim)", background: "var(--surface-3)", padding: "2px 7px", borderRadius: "2px" }}>
              {filtered.length} / {todos.length}
            </span>
          </div>
          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "60px", color: "var(--text-muted)", fontSize: "12px", letterSpacing: "0.08em" }}>
              <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
              LOADING TASKS...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "60px", color: "var(--text-dim)" }}>
              <span style={{ fontSize: "28px", opacity: 0.3 }}>▣</span>
              <span style={{ fontSize: "12px", letterSpacing: "0.08em" }}>
                {filters.status !== "all" || filters.priority !== "all" || filters.search
                  ? "NO TASKS MATCH FILTERS"
                  : "NO TASKS YET"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
                Click NEW TASK — AI will suggest subtasks as you type
              </span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["#","TITLE","STATUS","PRIORITY","AGENT","UPDATED",""].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", fontWeight: 600, background: "var(--surface-2)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((todo, i) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    index={i}
                    flash={recentlyUpdated.has(todo.id)}
                    onUpdate={patchTodo}
                    onDelete={removeTodo}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.06em" }}>
            Type a task → AI decomposes it into subtasks in real time · Click STATUS / PRIORITY / AGENT to edit inline
          </p>
        )}
      </main>

      {showModal && (
        <AddTodoModal
          onAdd={addTodo}
          onClose={() => setShowModal(false)}
          recentTodos={todos}
        />
      )}
    </div>
  );
}
