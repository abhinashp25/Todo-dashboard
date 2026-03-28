import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 20 } },
});

// ── Types ─────────────────────────────────────────────────────
export type TodoStatus   = "pending" | "in_progress" | "completed" | "blocked";
export type TodoPriority = "low" | "medium" | "high" | "critical";

export interface Todo {
  id:             string;
  title:          string;
  status:         TodoStatus;
  priority:       TodoPriority;
  assigned_agent: string | null;
  parent_id:      string | null;
  is_ghost:       boolean;
  accepted_at:    string | null;
  notes:          string | null;
  position:       number;
  updated_at:     string;
  created_at:     string;
  child_count?:     number;
  child_completed?: number;
  completion_pct?:  number | null;
}

export type TodoInsert = Pick<Todo, "title" | "status" | "priority" | "assigned_agent"> & {
  parent_id?: string | null;
  is_ghost?:  boolean;
  notes?:     string | null;
  position?:  number;
};

export type TodoUpdate = Partial<
  Omit<Todo, "id" | "created_at" | "child_count" | "child_completed" | "completion_pct">
>;

export interface GhostSuggestion {
  id:        string;
  title:     string;
  priority:  TodoPriority;
  rationale: string;
  accepted:  boolean;
  dismissed: boolean;
}

// ── DB helpers ────────────────────────────────────────────────
export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("is_ghost", false)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Todo[];
}

export async function insertTodo(todo: TodoInsert): Promise<Todo> {
  const { data, error } = await supabase.from("todos").insert(todo).select().single();
  if (error) throw error;
  return data as Todo;
}

export async function insertTodos(todos: TodoInsert[]): Promise<Todo[]> {
  const { data, error } = await supabase.from("todos").insert(todos).select();
  if (error) throw error;
  return data as Todo[];
}

export async function updateTodo(id: string, update: TodoUpdate): Promise<Todo> {
  const { data, error } = await supabase.from("todos").update(update).eq("id", id).select().single();
  if (error) throw error;
  return data as Todo;
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchChildren(parentId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("parent_id", parentId)
    .eq("is_ghost", false)
    .order("position", { ascending: true });
  if (error) throw error;
  return data as Todo[];
}

export function logGhostFeedback(
  parentTitle: string,
  ghostTitle: string,
  priority: TodoPriority,
  accepted: boolean
): void {
  fetch("/api/ghost-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parent_title: parentTitle, ghost_title: ghostTitle, priority, accepted }),
  }).catch(() => {});
}
