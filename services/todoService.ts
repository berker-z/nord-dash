import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { TodoItem } from "../types";

/**
 * Get real-time todos for a specific user
 */
export const subscribeTodos = (
  userEmail: string,
  onData: (todos: TodoItem[]) => void,
  onError?: (error: any) => void
) => {
  const userDocRef = doc(db, "users", userEmail);

  return onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData(data.todos || []);
      } else {
        // Initialize empty todos for new user
        setDoc(userDocRef, { todos: [] });
        onData([]);
      }
    },
    (error) => {
      console.error("Error subscribing to todos:", error);
      if (onError) onError(error);
    }
  );
};

/**
 * Save todos for a specific user
 */
export const saveTodos = async (userEmail: string, todos: TodoItem[]) => {
  const userDocRef = doc(db, "users", userEmail);
  await setDoc(userDocRef, { todos }, { merge: true });
};

/**
 * Add a single todo
 */
export const addTodo = async (userEmail: string, todo: TodoItem) => {
  const userDocRef = doc(db, "users", userEmail);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const currentTodos = docSnap.data().todos || [];
    await updateDoc(userDocRef, {
      todos: [...currentTodos, todo],
    });
  } else {
    await setDoc(userDocRef, { todos: [todo] });
  }
};

/**
 * Update a single todo
 */
export const updateTodo = async (
  userEmail: string,
  todoId: string,
  updates: Partial<TodoItem>
) => {
  const userDocRef = doc(db, "users", userEmail);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const currentTodos: TodoItem[] = docSnap.data().todos || [];
    const updatedTodos = currentTodos.map((t) =>
      t.id === todoId ? { ...t, ...updates } : t
    );
    await updateDoc(userDocRef, { todos: updatedTodos });
  }
};

/**
 * Delete a single todo
 */
export const deleteTodo = async (userEmail: string, todoId: string) => {
  const userDocRef = doc(db, "users", userEmail);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const currentTodos: TodoItem[] = docSnap.data().todos || [];
    const filteredTodos = currentTodos.filter((t) => t.id !== todoId);
    await updateDoc(userDocRef, { todos: filteredTodos });
  }
};
