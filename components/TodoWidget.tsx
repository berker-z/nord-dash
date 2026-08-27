import React, { useState, useEffect, useRef } from "react";
import { TodoItem } from "../types";
import { Trash2, CheckSquare, Square, Plus } from "lucide-react";
import {
  subscribeTodos,
  addTodo,
  updateTodo,
  deleteTodo as deleteTodoFromFirestore,
  clearTodos,
} from "../services/todoService";
import { ConfirmModal } from "./ConfirmModal";

interface TodoWidgetProps {
  userEmail: string | null;
}

export const TodoWidget: React.FC<TodoWidgetProps> = ({ userEmail }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  // Track if we've loaded initial data from Firestore to prevent saving during mount/logout
  const hasLoadedFromFirestore = useRef(false);

  // Subscribe to real-time todos from Firestore
  useEffect(() => {
    if (!userEmail) {
      setTodos([]);
      setLoading(false);
      hasLoadedFromFirestore.current = false; // Reset on logout
      return;
    }

    setLoading(true);
    setSyncError(null);
    hasLoadedFromFirestore.current = false; // Reset when user changes
    const unsubscribe = subscribeTodos(
      userEmail,
      (firestoreTodos) => {
        setTodos(firestoreTodos);
        setLoading(false);
        setSyncError(null);
        hasLoadedFromFirestore.current = true; // Mark as loaded
      },
      (error) => {
        console.error("Todo subscription failed:", error);
        setLoading(false);
        // Keep whatever we already have on screen — don't render an empty
        // list that looks like the todos were deleted.
        setSyncError(
          error?.code === "permission-denied"
            ? "PERMISSION_DENIED: your session expired — log out and back in."
            : String(error?.message || error),
        );
      }
    );

    return () => unsubscribe();
  }, [userEmail]);

  // NOTE: We do NOT auto-save on every todos change.
  // This prevents race conditions with the real-time subscription.
  // Instead, we save explicitly in handleAdd, toggleTodo, and deleteTodo.

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !userEmail) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: input.trim(),
      completed: false,
    };

    setInput(""); // Clear input immediately for better UX

    try {
      await addTodo(userEmail, newTodo);
      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error("Failed to add todo:", error);
      // Optionally show an error message to the user
    }
  };

  const toggleTodo = async (id: string) => {
    if (!userEmail) return;

    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      await updateTodo(userEmail, id, { completed: !todo.completed });
      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      // Optionally show an error message to the user
    }
  };

  const deleteTodo = async (id: string) => {
    if (!userEmail) return;

    try {
      await deleteTodoFromFirestore(userEmail, id);
      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error("Failed to delete todo:", error);
      // Optionally show an error message to the user
    }
  };

  const deleteAllTodos = async () => {
    setIsClearModalOpen(false);
    if (!userEmail) return;

    try {
      await clearTodos(userEmail);
      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error("Failed to delete all todos:", error);
    }
  };

  if (!userEmail) {
    return (
      <div className="flex flex-col font-mono items-center justify-center h-64 text-muted">
        <p className="text-center">Please log in to access your tasks.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col font-mono items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted mt-4">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-mono">
      {syncError && (
        <div className="mb-3 p-2 text-xs text-red border border-red/60 bg-red/10">
          Sync failed: {syncError}
        </div>
      )}
      <ul className="space-y-1 flex-1 overflow-y-auto pr-2 mb-4">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center justify-between group px-2 py-2 hover:bg-raised transition-colors border-b border-divider"
          >
            <div
              className="flex items-center gap-3 cursor-pointer flex-1"
              onClick={() => toggleTodo(todo.id)}
            >
              <span className={todo.completed ? "text-green" : "text-muted"}>
                {todo.completed ? (
                  <CheckSquare size={18} />
                ) : (
                  <Square size={18} />
                )}
              </span>
              <span
                className={`${
                  todo.completed
                    ? "text-muted line-through"
                    : "text-ink font-normal"
                }`}
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 text-red hover:bg-surface p-1.5 transition-all"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li className="text-muted italic text-center mt-10">
            Nothing to do.
          </li>
        )}
      </ul>

      <form
        onSubmit={handleAdd}
        className="pt-3 border-t border-divider mt-auto flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New task..."
          className="flex-1 min-w-0 bg-raised border border-faint px-3 py-2 focus:outline-none focus:border-accent text-ink placeholder-muted"
        />
        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          disabled={todos.length === 0}
          title="Delete all tasks"
          className="border border-faint text-muted hover:text-red hover:border-red/60 disabled:opacity-30 disabled:hover:text-muted disabled:hover:border-faint p-2.5 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </form>

      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Delete All Tasks"
        message={`Delete all ${todos.length} task${todos.length === 1 ? "" : "s"}? This cannot be undone.`}
        onConfirm={deleteAllTodos}
        onCancel={() => setIsClearModalOpen(false)}
        confirmText="Delete All"
        isDestructive={true}
      />
    </div>
  );
};
