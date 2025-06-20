
'use server'; // Can be used by server components/actions if needed, but primarily for client via calls

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Todo } from '@/components/dashboard/todo-item'; // Assuming Todo type is defined here

export interface TodoData extends Omit<Todo, 'id' | 'dueDate'> {
  userId: string;
  createdAt: Timestamp;
  dueDate?: Timestamp; // If you add due dates to todos later
}

export interface TodoDocument extends TodoData {
  id: string;
}

const TODOS_COLLECTION = 'todos';

// Get all todos for a user
export async function getTodos(userId: string): Promise<TodoDocument[]> {
  if (!userId) {
    console.error("User ID is required to fetch todos.");
    return [];
  }
  try {
    const q = query(
      collection(db, TODOS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc') // Order by creation date, newest first
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data() as TodoData,
    })) as TodoDocument[];
  } catch (error) {
    console.error("Error fetching todos:", error);
    throw new Error("Failed to fetch todos.");
  }
}

// Add a new todo for a user
export async function addTodo(userId: string, todoData: Omit<Todo, 'id' | 'completed'>): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to add a todo.");
  }
  try {
    const docRef = await addDoc(collection(db, TODOS_COLLECTION), {
      ...todoData,
      userId: userId,
      completed: false, // Ensure new todos are not completed
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding todo:", error);
    throw new Error("Failed to add todo.");
  }
}

// Update a todo (e.g., toggle complete status, change title/importance)
export async function updateTodo(todoId: string, updates: Partial<Omit<TodoData, 'userId' | 'createdAt'>>): Promise<void> {
  try {
    const todoRef = doc(db, TODOS_COLLECTION, todoId);
    await updateDoc(todoRef, updates);
  } catch (error) {
    console.error("Error updating todo:", error);
    throw new Error("Failed to update todo.");
  }
}

// Delete a todo
export async function deleteTodo(todoId: string): Promise<void> {
  try {
    const todoRef = doc(db, TODOS_COLLECTION, todoId);
    await deleteDoc(todoRef);
  } catch (error) {
    console.error("Error deleting todo:", error);
    throw new Error("Failed to delete todo.");
  }
}
