"use client";

import { useEffect, useReducer, useRef, useCallback } from "react";
import {
  supabase,
  fetchTodos,
  insertTodo,
  updateTodo,
  deleteTodo,
  type Todo,
  type TodoInsert,
  type TodoUpdate,
} from "@/lib/supabase";

// ── State shape ──────────────────────────────────────────────
interface State {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  recentlyUpdated: Set<string>; // ids that flashed recently
}

type Action =
  | { type: "LOADED"; todos: Todo[] }
  | { type: "ERROR"; message: string }
  | { type: "CONNECTED"; value: boolean }
  | { type: "UPSERT"; todo: Todo }
  | { type: "REMOVE"; id: string }
  | { type: "MARK_RECENT"; id: string }
  | { type: "CLEAR_RECENT"; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return { ...state, todos: action.todos, loading: false, error: null };
    case "ERROR":
      return { ...state, error: action.message, loading: false };
    case "CONNECTED":
      return { ...state, connected: action.value };
    case "UPSERT": {
      const exists = state.todos.some((t) => t.id === action.todo.id);
      const todos = exists
        ? state.todos.map((t) => (t.id === action.todo.id ? action.todo : t))
        : [action.todo, ...state.todos];
      return { ...state, todos };
    }
    case "REMOVE":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.id),
      };
    case "MARK_RECENT": {
      const next = new Set(state.recentlyUpdated);
      next.add(action.id);
      return { ...state, recentlyUpdated: next };
    }
    case "CLEAR_RECENT": {
      const next = new Set(state.recentlyUpdated);
      next.delete(action.id);
      return { ...state, recentlyUpdated: next };
    }
    default:
      return state;
  }
}

const initialState: State = {
  todos: [],
  loading: true,
  error: null,
  connected: false,
  recentlyUpdated: new Set(),
};

// ── Hook ─────────────────────────────────────────────────────
export function useRealtimeTodos() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const flashTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const flashRow = useCallback((id: string) => {
    dispatch({ type: "MARK_RECENT", id });
    // Clear previous timer if exists
    const existing = flashTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      dispatch({ type: "CLEAR_RECENT", id });
      flashTimers.current.delete(id);
    }, 1400);
    flashTimers.current.set(id, t);
  }, []);

  // Initial load
  useEffect(() => {
    fetchTodos()
      .then((todos) => dispatch({ type: "LOADED", todos }))
      .catch((err) => dispatch({ type: "ERROR", message: String(err.message) }));
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            dispatch({ type: "REMOVE", id: payload.old.id as string });
          } else {
            const todo = payload.new as Todo;
            dispatch({ type: "UPSERT", todo });
            flashRow(todo.id);
          }
        }
      )
      .subscribe((status) => {
        dispatch({ type: "CONNECTED", value: status === "SUBSCRIBED" });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flashRow]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = flashTimers.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Mutations exposed to UI
  const addTodo = useCallback(async (todo: TodoInsert) => {
    await insertTodo(todo);
  }, []);

  const patchTodo = useCallback(async (id: string, update: TodoUpdate) => {
    await updateTodo(id, update);
  }, []);

  const removeTodo = useCallback(async (id: string) => {
    await deleteTodo(id);
  }, []);

  return { ...state, addTodo, patchTodo, removeTodo };
}
