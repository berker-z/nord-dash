import React, { useState, useEffect, useRef } from "react";
import { TodoItem } from "../types";
import { Trash2, CheckSquare, Square, Plus } from "lucide-react";
import { subscribeTodos, saveTodos } from "../services/todoService";

interface TodoWidgetProps {
  userEmail: string | null;
}

export const TodoWidget: React.FC<TodoWidgetProps> = ({ userEmail }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
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
    hasLoadedFromFirestore.current = false; // Reset when user changes
    const unsubscribe = subscribeTodos(userEmail, (firestoreTodos) => {
      setTodos(firestoreTodos);
      setLoading(false);
      hasLoadedFromFirestore.current = true; // Mark as loaded
    });

    return () => unsubscribe();
  }, [userEmail]);

  // Save todos to Firestore whenever they change
  // CRITICAL: Only save after we've loaded initial data from Firestore
  // This prevents race conditions during login/logout
  useEffect(() => {
    // Only save if:
    // 1. User is logged in (userEmail exists)
    // 2. Not currently loading from Firestore
    // 3. We've successfully loaded initial data (prevents saving empty array on mount/logout)
    if (!userEmail || loading || !hasLoadedFromFirestore.current) {
      return;
    }

    // Save the current state to Firestore
    saveTodos(userEmail, todos);
  }, [todos, userEmail, loading]);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !userEmail) return;
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: input.trim(),
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  if (!userEmail) {
    return (
      <div className="flex flex-col font-mono items-center justify-center h-64 text-nord-3">
        <p className="text-center">Please log in to access your tasks.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col font-mono items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-nord-8 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-nord-3 mt-4">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-mono">
      <ul className="space-y-3 flex-1 overflow-y-auto pr-2 mb-4">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center justify-between group p-3 hover:bg-nord-1 transition-colors border-b border-nord-1 hover:border-nord-2 rounded-lg"
          >
            <div
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => toggleTodo(todo.id)}
            >
              <span className={todo.completed ? "text-nord-14" : "text-nord-3"}>
                {todo.completed ? (
                  <CheckSquare size={24} />
                ) : (
                  <Square size={24} />
                )}
              </span>
              <span
                className={`${
                  todo.completed
                    ? "text-nord-3 line-through"
                    : "text-nord-5 font-medium"
                }`}
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 text-nord-11 hover:bg-nord-2 p-2 rounded transition-all"
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li className="text-nord-3 italic text-center mt-10">
            {">"} NO_ACTIVE_TASKS
          </li>
        )}
      </ul>

      <form
        onSubmit={handleAdd}
        className="flex gap-3 pt-4 border-t-2 border-nord-1 mt-auto"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New task..."
          className="flex-1 bg-nord-1 border-2 border-nord-3 rounded-lg px-4 py-3 focus:outline-none focus:border-nord-9 text-nord-4 placeholder-nord-3"
        />
        <button
          type="submit"
          className="bg-nord-3 hover:bg-nord-9 hover:text-nord-1 text-nord-4 px-5 rounded-lg flex items-center justify-center transition-colors"
        >
          <Plus size={24} />
        </button>
      </form>
    </div>
  );
};
