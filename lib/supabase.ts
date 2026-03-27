import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

// ── Types ────────────────────────────────────────────────────
export type TodoStatus = "pending" | "in_progress" | "completed" | "blocked";
export type TodoPriority = "low" | "medium" | "high" | "critical";

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  assigned_agent: string | null;
  updated_at: string;
  created_at: string;
}

export type TodoInsert = Omit<Todo, "id" | "updated_at" | "created_at">;
export type TodoUpdate = Partial<Omit<Todo, "id" | "created_at">>;

// ── DB helpers ───────────────────────────────────────────────
export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Todo[];
}

export async function insertTodo(todo: TodoInsert): Promise<Todo> {
  const { data, error } = await supabase
    .from("todos")
    .insert(todo)
    .select()
    .single();

  if (error) throw error;
  return data as Todo;
}

export async function updateTodo(id: string, update: TodoUpdate): Promise<Todo> {
  const { data, error } = await supabase
    .from("todos")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Todo;
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
}
