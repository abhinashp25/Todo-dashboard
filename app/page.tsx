"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Gauge,
  Plus,
  RefreshCw,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useRealtimeTodos } from "@/lib/useRealtimeTodos";
import { StatsBar } from "@/components/StatsBar";
import { TodoRow } from "@/components/TodoRow";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { AddTodoModal } from "@/components/AddTodoModal";

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function DashboardPage() {
  const { todos, loading, error, connected, recentlyUpdated, addTodo, patchTodo, removeTodo } =
    useRealtimeTodos();

  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    priority: "all",
  });

  const filtered = useMemo(() => {
    let list = todos;
    if (filters.status !== "all") list = list.filter((t) => t.status === filters.status);
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

  const completedCount = todos.filter((t) => t.status === "completed").length;
  const liveAgents = new Set(todos.map((t) => t.assigned_agent).filter(Boolean)).size;
  const completionPct = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="dashboard-shell">
      <nav className="top-nav">
        <div className="top-nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              className="toolbar-chip"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Sparkles size={12} />
              AI WORKFLOW CORE
            </span>
            <h1 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em" }}>
              TASKOPS COMMAND
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {connected ? (
              <span className="status-live">
                <span className="status-dot" /> LIVE SYNC
              </span>
            ) : (
              <span
                className="toolbar-chip"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <WifiOff size={12} /> CONNECTING
              </span>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
            >
              <Plus size={14} /> NEW TASK
            </button>
          </div>
        </div>
      </nav>

      <main className="main-wrap">
        <section className="premium-card hero-card">
          <div>
            <p className="kicker">Realtime Orchestration Dashboard</p>
            <h2 className="hero-title">
              Command your team tasks with AI-backed decomposition and live state telemetry.
            </h2>
            <p className="hero-sub">
              This board behaves like a production control room: instant updates, inline workflow
              edits, and structured task decomposition from your agents.
            </p>
          </div>

          <div className="metric-grid">
            <article className="metric-pill">
              <p className="kicker" style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                <Gauge size={12} /> Throughput
              </p>
              <p className="kicker-value">{completionPct}%</p>
            </article>
            <article className="metric-pill">
              <p className="kicker" style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                <Bot size={12} /> Active Agents
              </p>
              <p className="kicker-value">{liveAgents}</p>
            </article>
            <article className="metric-pill">
              <p className="kicker" style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                <Activity size={12} /> Completed
              </p>
              <p className="kicker-value">{completedCount}</p>
            </article>
          </div>
        </section>

        {error && (
          <div
            className="premium-card section-card"
            style={{ borderColor: "rgba(255, 123, 143, 0.45)", color: "var(--red)" }}
          >
            {error}
          </div>
        )}

        <section className="premium-card section-card">
          <StatsBar todos={todos} />
        </section>

        <section className="premium-card section-card">
          <div className="filter-shell" style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="toolbar-chip">TASK TABLE</span>
              <span className="toolbar-chip">{filtered.length} SHOWN</span>
              <span className="toolbar-chip">{todos.length} TOTAL</span>
            </div>
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          <div className="table-shell">
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "52px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                LOADING REALTIME TASKS
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  padding: "54px",
                }}
              >
                <span
                  style={{
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {filters.status !== "all" || filters.priority !== "all" || filters.search
                    ? "No tasks match the current filters"
                    : "No tasks yet"}
                </span>
                <button onClick={() => setShowModal(true)} className="btn-secondary">
                  Create your first task
                </button>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {["#", "TITLE", "STATUS", "PRIORITY", "AGENT", "UPDATED", ""].map((h) => (
                      <th key={h}>{h}</th>
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
        </section>
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
