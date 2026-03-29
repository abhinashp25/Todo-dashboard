"use client";

import { useMemo } from "react";
import { ArrowUpRight, Bot, TrendingUp } from "lucide-react";
import type { Todo } from "@/lib/supabase";

interface Props {
  todos: Todo[];
}

interface AgentStats {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  weekly: number[];
}

function getLast7DayKeys(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function AgentPerformancePanel({ todos }: Props) {
  const { agents, globalTrend } = useMemo(() => {
    const dayKeys = getLast7DayKeys();
    const emptyTrend = Array.from({ length: 7 }, () => 0);

    const byAgent = new Map<string, AgentStats>();

    todos.forEach((todo) => {
      const name = todo.assigned_agent ?? "Unassigned";
      if (!byAgent.has(name)) {
        byAgent.set(name, {
          name,
          total: 0,
          completed: 0,
          inProgress: 0,
          blocked: 0,
          weekly: [...emptyTrend],
        });
      }

      const stat = byAgent.get(name)!;
      stat.total += 1;
      if (todo.status === "completed") stat.completed += 1;
      if (todo.status === "in_progress") stat.inProgress += 1;
      if (todo.status === "blocked") stat.blocked += 1;

      const day = new Date(todo.updated_at).toISOString().slice(0, 10);
      const idx = dayKeys.indexOf(day);
      if (idx >= 0) stat.weekly[idx] += 1;
    });

    const global = [...emptyTrend];
    todos.forEach((todo) => {
      if (todo.status !== "completed") return;
      const day = new Date(todo.updated_at).toISOString().slice(0, 10);
      const idx = dayKeys.indexOf(day);
      if (idx >= 0) global[idx] += 1;
    });

    return {
      agents: [...byAgent.values()].sort((a, b) => b.total - a.total),
      globalTrend: global,
    };
  }, [todos]);

  return (
    <section className="premium-card section-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div>
          <p className="kicker">Agent Performance</p>
          <h3 style={{ marginTop: "6px", fontSize: "1.12rem" }}>Weekly throughput and workload intelligence</h3>
        </div>
        <div className="toolbar-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start" }}>
          <TrendingUp size={12} /> LAST 7 DAYS
        </div>
      </div>

      <div style={{ marginTop: "14px", border: "1px solid rgba(103,200,255,0.22)", borderRadius: "12px", padding: "12px" }}>
        <p className="kicker">Global completion trend</p>
        <TrendLine values={globalTrend} />
      </div>

      <div style={{ marginTop: "12px", display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {agents.map((agent) => {
          const completionRate = agent.total > 0 ? Math.round((agent.completed / agent.total) * 100) : 0;
          return (
            <article key={agent.name} style={{ border: "1px solid rgba(103,200,255,0.22)", borderRadius: "12px", padding: "12px", background: "rgba(17,28,42,0.72)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                  <Bot size={14} color="var(--blue)" /> {agent.name}
                </p>
                <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                  {completionRate}% done
                </span>
              </div>

              <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "6px" }}>
                <StatCell label="Total" value={agent.total} />
                <StatCell label="Progress" value={agent.inProgress} />
                <StatCell label="Blocked" value={agent.blocked} />
              </div>

              <div style={{ marginTop: "9px" }}>
                <MiniBars values={agent.weekly} />
              </div>

              <div style={{ marginTop: "7px", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "10px", color: "var(--text-dim)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Trend <ArrowUpRight size={11} />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "rgba(27,41,62,0.62)", borderRadius: "8px", padding: "7px" }}>
      <p style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ marginTop: "3px", fontSize: "1.05rem", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "42px" }}>
      {values.map((value, idx) => {
        const h = Math.max(6, Math.round((value / max) * 40));
        return (
          <div
            key={`${value}-${idx}`}
            style={{
              height: `${h}px`,
              flex: 1,
              borderRadius: "4px 4px 2px 2px",
              background: "linear-gradient(180deg, rgba(103,200,255,0.95), rgba(71,243,165,0.65))",
            }}
            title={`${value} updates`}
          />
        );
      })}
    </div>
  );
}

function TrendLine({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "78px", marginTop: "8px" }} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="rgba(84, 111, 255, 0.25)"
        strokeWidth="12"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        fill="none"
        stroke="var(--blue)"
        strokeWidth="2.4"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
