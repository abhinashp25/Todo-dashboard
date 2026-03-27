"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TodoInsert, TodoStatus, TodoPriority } from "@/lib/supabase";

interface Props {
  onAdd: (todo: TodoInsert) => Promise<void>;
  onClose: () => void;
}

const AGENTS = ["Agent Alpha", "Agent Beta", "Agent Gamma", "Agent Delta", "Agent Epsilon"];

export function AddTodoModal({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TodoStatus>("pending");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [agent, setAgent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onAdd({
        title: title.trim(),
        status,
        priority,
        assigned_agent: agent || null,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "fadeSlideIn 0.2s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-bright)",
          borderRadius: "6px",
          width: "480px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          animation: "fadeSlideUp 0.25s ease both",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
            NEW_TASK
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={labelStyle}>TITLE</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Describe the task..."
            style={inputStyle}
          />
        </div>

        {/* Row: Status + Priority */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>STATUS</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TodoStatus)}
              style={selectStyle}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>PRIORITY</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TodoPriority)}
              style={selectStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Agent */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={labelStyle}>ASSIGNED AGENT</label>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            style={selectStyle}
          >
            <option value="">— Unassigned —</option>
            {AGENTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <span style={{ fontSize: "11px", color: "var(--red)", fontFamily: "var(--font-mono)" }}>
            ⚠ {error}
          </span>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
          <button onClick={onClose} style={btnSecondaryStyle}>CANCEL</button>
          <button onClick={handleSubmit} disabled={saving} style={btnPrimaryStyle}>
            {saving ? "SAVING..." : "CREATE TASK"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Shared input styles
const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
};

const inputStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "3px",
  color: "var(--text)",
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  padding: "9px 12px",
  outline: "none",
  width: "100%",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const btnSecondaryStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border-bright)",
  borderRadius: "3px",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.08em",
  padding: "8px 16px",
  cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = {
  background: "var(--green)",
  border: "none",
  borderRadius: "3px",
  color: "#000",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  padding: "8px 18px",
  cursor: "pointer",
};
