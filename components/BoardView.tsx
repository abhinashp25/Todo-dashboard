"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import type { Todo, TodoPriority, TodoStatus, TodoUpdate } from "@/lib/supabase";

interface Props {
  todos: Todo[];
  onUpdate: (id: string, update: TodoUpdate) => Promise<void>;
  onOpenDetails: (todo: Todo) => void;
}

const STATUSES: TodoStatus[] = ["pending", "in_progress", "blocked", "completed"];
const STATUS_LABEL: Record<TodoStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

const PRIORITIES: TodoPriority[] = ["low", "medium", "high", "critical"];
const PRIORITY_LABEL: Record<TodoPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function BoardView({ todos, onUpdate, onOpenDetails }: Props) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status] = todos.filter((todo) => todo.status === status);
      return acc;
    }, {} as Record<TodoStatus, Todo[]>);
  }, [todos]);

  const byPriority = useMemo(() => {
    return PRIORITIES.reduce((acc, priority) => {
      acc[priority] = todos.filter((todo) => todo.priority === priority);
      return acc;
    }, {} as Record<TodoPriority, Todo[]>);
  }, [todos]);

  const findTask = (id: string | null) => (id ? todos.find((todo) => todo.id === id) : undefined);

  const updateStatus = async (status: TodoStatus) => {
    const task = findTask(dragTaskId);
    if (!task || task.status === status) return;
    await onUpdate(task.id, { status });
  };

  const updatePriority = async (priority: TodoPriority) => {
    const task = findTask(dragTaskId);
    if (!task || task.priority === priority) return;
    await onUpdate(task.id, { priority });
  };

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: "10px", overflowX: "auto" }}>
        {STATUSES.map((status) => (
          <section
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async () => {
              await updateStatus(status);
              setDragTaskId(null);
            }}
            style={{
              border: "1px solid rgba(103,200,255,0.24)",
              borderRadius: "12px",
              minHeight: "240px",
              padding: "10px",
              background: "rgba(15,24,37,0.72)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ fontSize: "0.93rem", fontWeight: 600 }}>{STATUS_LABEL[status]}</h4>
              <span className="toolbar-chip">{byStatus[status].length}</span>
            </div>

            <div style={{ display: "grid", gap: "7px" }}>
              {byStatus[status].map((todo) => (
                <article
                  key={todo.id}
                  draggable
                  onDragStart={() => setDragTaskId(todo.id)}
                  onDragEnd={() => setDragTaskId(null)}
                  style={{
                    border: "1px solid rgba(82,113,163,0.32)",
                    borderRadius: "10px",
                    padding: "9px",
                    background: "rgba(21,32,47,0.88)",
                    cursor: "grab",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <button
                      onClick={() => onOpenDetails(todo)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--text)",
                        textAlign: "left",
                        cursor: "pointer",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                      title="Open task detail"
                    >
                      {todo.title}
                    </button>
                    <GripVertical size={13} color="var(--text-dim)" />
                  </div>

                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <StatusBadge status={todo.status} />
                    <PriorityBadge priority={todo.priority} />
                  </div>
                </article>
              ))}

              {byStatus[status].length === 0 && (
                <div style={{ border: "1px dashed rgba(113,132,164,0.4)", borderRadius: "9px", padding: "16px", textAlign: "center", fontSize: "11px", color: "var(--text-dim)" }}>
                  Drop tasks here
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <section style={{ border: "1px solid rgba(103,200,255,0.24)", borderRadius: "12px", padding: "12px", background: "rgba(15,24,37,0.72)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "8px", flexWrap: "wrap" }}>
          <h4 style={{ fontSize: "0.94rem", fontWeight: 600 }}>Drag-and-drop prioritization studio</h4>
          <span className="toolbar-chip">DROP ON A BUCKET TO REPRIORITIZE</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: "8px" }}>
          {PRIORITIES.map((priority) => (
            <div
              key={priority}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async () => {
                await updatePriority(priority);
                setDragTaskId(null);
              }}
              style={{ border: "1px solid rgba(82,113,163,0.32)", borderRadius: "10px", padding: "8px", minHeight: "110px", background: "rgba(20,30,46,0.76)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>{PRIORITY_LABEL[priority]}</span>
                <span className="toolbar-chip">{byPriority[priority].length}</span>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                {byPriority[priority].slice(0, 4).map((todo) => (
                  <button
                    key={todo.id}
                    draggable
                    onDragStart={() => setDragTaskId(todo.id)}
                    onDragEnd={() => setDragTaskId(null)}
                    onClick={() => onOpenDetails(todo)}
                    style={{ border: "1px solid rgba(113,132,164,0.35)", borderRadius: "8px", background: "rgba(28,41,61,0.74)", color: "var(--text)", fontSize: "11px", textAlign: "left", padding: "6px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title="Open details"
                  >
                    {todo.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
