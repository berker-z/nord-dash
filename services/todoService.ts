import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  runTransaction,
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
 * Add a single todo using a transaction to prevent race conditions
 */
export const addTodo = async (userEmail: string, todo: TodoItem) => {
  const userDocRef = doc(db, "users", userEmail);
  
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(userDocRef);
    
    if (docSnap.exists()) {
      const currentTodos = docSnap.data().todos || [];
      transaction.update(userDocRef, {
        todos: [...currentTodos, todo],
      });
    } else {
      transaction.set(userDocRef, { todos: [todo] });
    }
  });
};

/**
 * Update a single todo using a transaction to prevent race conditions
 */
export const updateTodo = async (
  userEmail: string,
  todoId: string,
  updates: Partial<TodoItem>
) => {
  const userDocRef = doc(db, "users", userEmail);
  
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(userDocRef);
    
    if (docSnap.exists()) {
      const currentTodos: TodoItem[] = docSnap.data().todos || [];
      const updatedTodos = currentTodos.map((t) =>
        t.id === todoId ? { ...t, ...updates } : t
      );
      transaction.update(userDocRef, { todos: updatedTodos });
    }
  });
};

/**
 * Delete a single todo using a transaction to prevent race conditions
 */
export const deleteTodo = async (userEmail: string, todoId: string) => {
  const userDocRef = doc(db, "users", userEmail);
  
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(userDocRef);
    
    if (docSnap.exists()) {
      const currentTodos: TodoItem[] = docSnap.data().todos || [];
      const filteredTodos = currentTodos.filter((t) => t.id !== todoId);
      transaction.update(userDocRef, { todos: filteredTodos });
    }
  });
};
