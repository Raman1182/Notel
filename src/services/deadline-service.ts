
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Deadline } from '@/components/dashboard/deadline-item';

export interface DeadlineData extends Omit<Deadline, 'id'> {
  userId: string;
  createdAt: any; // serverTimestamp
}

export interface DeadlineDocument extends DeadlineData {
    id: string;
}

const DEADLINES_COLLECTION = 'deadlines';

// Get all deadlines for a user
export async function getDeadlines(userId: string): Promise<DeadlineDocument[]> {
  if (!userId) return [];
  try {
    const q = query(collection(db, DEADLINES_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const deadlines = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as DeadlineDocument[];
    
    // Sort by due date client-side
    deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return deadlines;
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    throw new Error("Failed to fetch deadlines.");
  }
}

// Add a new deadline
export async function addDeadline(userId: string, deadlineData: Omit<Deadline, 'id' | 'completed'>): Promise<string> {
  if (!userId) throw new Error("User ID is required to add a deadline.");
  try {
    const docRef = await addDoc(collection(db, DEADLINES_COLLECTION), {
      ...deadlineData,
      userId: userId,
      completed: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding deadline:", error);
    throw new Error("Failed to add deadline.");
  }
}

// Update a deadline (e.g., toggle complete status)
export async function updateDeadline(deadlineId: string, updates: Partial<DeadlineData>): Promise<void> {
  try {
    const deadlineRef = doc(db, DEADLINES_COLLECTION, deadlineId);
    await updateDoc(deadlineRef, updates);
  } catch (error) {
    console.error("Error updating deadline:", error);
    throw new Error("Failed to update deadline.");
  }
}

// Delete a deadline
export async function deleteDeadline(deadlineId: string): Promise<void> {
  try {
    const deadlineRef = doc(db, DEADLINES_COLLECTION, deadlineId);
    await deleteDoc(deadlineRef);
  } catch (error) {
    console.error("Error deleting deadline:", error);
    throw new Error("Failed to delete deadline.");
  }
}
