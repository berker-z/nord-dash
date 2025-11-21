import React, { useState, useEffect } from "react";
import { TodoItem } from "../types";
import { Trash2, CheckSquare, Square, Plus } from "lucide-react";

export const TodoWidget: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem("nord_todos");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", text: "Install NixOS", completed: true },
          { id: "2", text: "Configure Hyprland", completed: false },
        ];
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    localStorage.setItem("nord_todos", JSON.stringify(todos));
  }, [todos]);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
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

  return (
    <div className="h-full flex flex-col font-mono">
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
