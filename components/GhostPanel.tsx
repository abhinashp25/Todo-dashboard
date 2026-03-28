"use client";

import { Check, X, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import type { GhostSuggestion } from "@/lib/supabase";

interface Props {
  ghosts:     GhostSuggestion[];
  streaming:  boolean;
  error:      string | null;
  parentTitle: string;
  onAccept:   (id: string) => void;
  onDismiss:  (id: string) => void;
  onAcceptAll: () => void;
  onDismissAll: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  low:      "var(--text-dim)",
  medium:   "var(--blue)",
  high:     "var(--amber)",
  critical: "var(--red)",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "↓", medium: "→", high: "↑", critical: "⚡",
};

export function GhostPanel({
  ghosts, streaming, error, parentTitle,
  onAccept, onDismiss, onAcceptAll, onDismissAll,
}: Props) {
  const visible = ghosts.filter((g) => !g.dismissed);
  const accepted = ghosts.filter((g) => g.accepted && !g.dismissed);
  const hasAny = visible.length > 0 || streaming;

  if (!hasAny && !error) return null;

  return (
    <div
      style={{
        marginTop: "12px",
        border: "1px solid rgba(103,200,255,0.28)",
        borderRadius: "12px",
        overflow: "hidden",
        animation: "fadeSlideUp 0.2s ease both",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "rgba(103,200,255,0.08)",
          borderBottom: "1px solid rgba(103,200,255,0.16)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          {streaming ? (
            <Loader2
              size={12}
              style={{ color: "var(--blue)", animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Sparkles size={12} style={{ color: "var(--blue)" }} />
          )}
          <span
            style={{
              fontSize: "10px",
              color: "var(--blue)",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {streaming ? "AI DECOMPOSING..." : `AI SUGGESTED ${visible.length} SUBTASKS`}
          </span>
          {!streaming && accepted.length > 0 && (
            <span
              style={{
                fontSize: "9px",
                color: "var(--green)",
                background: "var(--green-dim)",
                padding: "1px 6px",
                borderRadius: "2px",
                letterSpacing: "0.06em",
              }}
            >
              {accepted.length} SELECTED
            </span>
          )}
        </div>

        {!streaming && visible.length > 0 && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={onDismissAll}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "3px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.06em",
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              DISMISS ALL
            </button>
            <button
              onClick={onAcceptAll}
              style={{
                background: "rgba(103,200,255,0.16)",
                border: "1px solid rgba(103,200,255,0.35)",
                borderRadius: "3px",
                color: "var(--blue)",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              ACCEPT ALL
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 12px",
            fontSize: "11px",
            color: "var(--red)",
            background: "var(--red-dim)",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Ghost rows */}
      {visible.map((ghost, idx) => (
        <GhostRow
          key={ghost.id}
          ghost={ghost}
          index={idx}
          onAccept={() => onAccept(ghost.id)}
          onDismiss={() => onDismiss(ghost.id)}
        />
      ))}

      {/* Streaming skeleton rows */}
      {streaming && visible.length === 0 && (
        <>
          <SkeletonRow />
          <SkeletonRow delay="0.15s" />
          <SkeletonRow delay="0.3s" />
        </>
      )}

      {/* Footer */}
      {!streaming && visible.length > 0 && (
        <div
          style={{
            padding: "6px 12px",
            fontSize: "10px",
            color: "var(--text-dim)",
            background: "rgba(103,200,255,0.05)",
            borderTop: "1px solid rgba(103,200,255,0.13)",
          }}
        >
          Accepted subtasks will be created as children of &quot;{parentTitle.slice(0, 40)}{parentTitle.length > 40 ? "…" : ""}&quot;
        </div>
      )}
    </div>
  );
}

// ── Individual ghost row ──────────────────────────────────────
function GhostRow({
  ghost, index, onAccept, onDismiss,
}: {
  ghost:    GhostSuggestion;
  index:    number;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        borderBottom: "1px solid rgba(103,200,255,0.12)",
        opacity: ghost.accepted ? 1 : 0.65,
        background: ghost.accepted ? "rgba(103,200,255,0.08)" : "transparent",
        transition: "all 0.2s ease",
        animation: `fadeSlideUp 0.25s ease both`,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* Tree indicator */}
      <ChevronRight
        size={10}
        style={{ color: "rgba(103,200,255,0.4)", flexShrink: 0 }}
      />

      {/* Priority symbol */}
      <span
        style={{
          fontSize: "11px",
          color: PRIORITY_COLOR[ghost.priority] ?? "var(--text-muted)",
          width: "14px",
          flexShrink: 0,
          textAlign: "center",
        }}
      >
        {PRIORITY_LABEL[ghost.priority] ?? "→"}
      </span>

      {/* Title + rationale */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "12px",
            color: ghost.accepted ? "var(--text)" : "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-mono)",
            textDecoration: ghost.accepted ? "none" : "none",
          }}
        >
          {ghost.title}
        </div>
        {ghost.rationale && (
          <div
            style={{
              fontSize: "10px",
              color: "var(--text-dim)",
              marginTop: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ghost.rationale}
          </div>
        )}
      </div>

      {/* Accept / dismiss buttons */}
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        <button
          onClick={onDismiss}
          title="Dismiss"
          style={{
            width: "22px",
            height: "22px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            cursor: "pointer",
            color: "var(--text-dim)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--red)";
            (e.currentTarget as HTMLElement).style.color = "var(--red)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
          }}
        >
          <X size={10} />
        </button>

        <button
          onClick={onAccept}
          title={ghost.accepted ? "Accepted" : "Accept"}
          style={{
            width: "22px",
            height: "22px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: ghost.accepted ? "var(--green)" : "none",
            border: ghost.accepted
              ? "1px solid var(--green)"
              : "1px solid var(--border)",
            borderRadius: "3px",
            cursor: "pointer",
            color: ghost.accepted ? "#000" : "var(--text-dim)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!ghost.accepted) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--green)";
              (e.currentTarget as HTMLElement).style.color = "var(--green)";
            }
          }}
          onMouseLeave={(e) => {
            if (!ghost.accepted) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
            }
          }}
        >
          <Check size={10} />
        </button>
      </div>
    </div>
  );
}

// ── Skeleton loader row ───────────────────────────────────────
function SkeletonRow({ delay = "0s" }: { delay?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        borderBottom: "1px solid rgba(255,171,64,0.08)",
        animationDelay: delay,
      }}
    >
      <ChevronRight size={10} style={{ color: "rgba(255,171,64,0.2)", flexShrink: 0 }} />
      <div
        style={{
          height: "10px",
          flex: 1,
          background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
          backgroundSize: "200% 100%",
          borderRadius: "2px",
          animation: "shimmer 1.4s ease-in-out infinite",
          animationDelay: delay,
        }}
      />
    </div>
  );
}
