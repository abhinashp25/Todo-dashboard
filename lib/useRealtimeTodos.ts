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

interface State {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  recentlyUpdated: Set<string>;
}

type Action =
  | { type: "LOADED"; todos: Todo[] }
  | { type: "ERROR"; message: string }
  | { type: "CONNECTED"; value: boolean }
  | { type: "UPSERT"; todo: Todo }
  | { type: "REMOVE"; id: string }
  | { type: "BUMP_CHILD_COUNT"; parentId: string; delta: number }
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
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case "BUMP_CHILD_COUNT":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.parentId
            ? { ...t, child_count: Math.max(0, (t.child_count ?? 0) + action.delta) }
            : t
        ),
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

export function useRealtimeTodos() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const flashTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const flashRow = useCallback((id: string) => {
    dispatch({ type: "MARK_RECENT", id });
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
            const old = payload.old as Todo;
            // If deleting a child, decrement parent's count
            if (old.parent_id) {
              dispatch({ type: "BUMP_CHILD_COUNT", parentId: old.parent_id, delta: -1 });
            } else {
              dispatch({ type: "REMOVE", id: old.id });
            }
          } else {
            const todo = payload.new as Todo;

            // Child task inserted — just bump the parent's child_count in state
            if (todo.parent_id) {
              if (payload.eventType === "INSERT" && !todo.is_ghost) {
                dispatch({ type: "BUMP_CHILD_COUNT", parentId: todo.parent_id, delta: 1 });
                flashRow(todo.parent_id);
              }
              return; // never add children to the main list
            }

            // Ghost task — ignore completely
            if (todo.is_ghost) return;

            // Top-level task — upsert normally
            dispatch({ type: "UPSERT", todo });
            flashRow(todo.id);
          }
        }
      )
      .subscribe((status) => {
        dispatch({ type: "CONNECTED", value: status === "SUBSCRIBED" });
      });

    return () => { supabase.removeChannel(channel); };
  }, [flashRow]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = flashTimers.current;
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const addTodo    = useCallback(async (todo: TodoInsert) => { await insertTodo(todo); }, []);
  const patchTodo  = useCallback(async (id: string, update: TodoUpdate) => { await updateTodo(id, update); }, []);
  const removeTodo = useCallback(async (id: string) => { await deleteTodo(id); }, []);

  return { ...state, addTodo, patchTodo, removeTodo };
}
