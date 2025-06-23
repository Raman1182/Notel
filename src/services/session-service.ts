
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { SessionData } from '@/app/study/launch/page';
import type { TreeNode } from '@/components/study/session-sidebar';

// The full session document structure in Firestore
export interface SessionDocument extends Omit<SessionData, 'sessionId'> {
  userId: string;
  treeData?: TreeNode[];
  notesContent?: Record<string, string>;
  actualDuration?: number; // From the timer, in seconds
  pdfUrl?: string;
}

// The session document with its Firestore ID
export interface SessionDocumentWithId extends SessionDocument {
  id: string;
}

const SESSIONS_COLLECTION = 'sessions';

// Add a new session
export async function addSession(userId: string, sessionData: SessionData): Promise<string> {
  if (!userId) throw new Error("User ID is required to add a session.");
  
  const { sessionId, ...dataToStore } = sessionData; // Exclude client-side sessionId

  const initialTree: TreeNode[] = [
    {
      id: 'root',
      name: dataToStore.subject,
      type: 'subject',
      children: [],
      parentId: null,
    },
  ];

  try {
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      ...dataToStore,
      userId: userId,
      treeData: initialTree,
      notesContent: {},
      actualDuration: 0,
      // `startTime` is already set in sessionData from client
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding session:", error);
    throw new Error("Failed to add session.");
  }
}

// Get a single session by its Firestore ID
export async function getSession(sessionId: string): Promise<SessionDocumentWithId | null> {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn(`Session with ID ${sessionId} not found.`);
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as SessionDocumentWithId;
  } catch (error) {
    console.error("Error fetching session:", error);
    throw new Error("Failed to fetch session.");
  }
}

// Get all sessions for a user
export async function getSessions(userId: string, count?: number): Promise<SessionDocumentWithId[]> {
  if (!userId) return [];
  try {
    // Query without ordering to avoid needing a composite index.
    const sessionQuery = query(collection(db, SESSIONS_COLLECTION), where('userId', '==', userId));
    
    const querySnapshot = await getDocs(sessionQuery);
    const sessions = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as SessionDocumentWithId[];

    // Sort in-memory after fetching.
    sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

    // If a count is specified, return only that many of the most recent sessions.
    if (count) {
      return sessions.slice(0, count);
    }
    
    return sessions;
    
  } catch (error) {
    console.error("Error fetching sessions:", error);
    // This might fail if the composite index doesn't exist yet.
    // Firebase console provides a link to create it from the error message.
    throw new Error("Failed to fetch sessions. A Firestore index might be required.");
  }
}

// Get all sessions for a specific subject for a user
export async function getSessionsBySubject(userId: string, subject: string): Promise<SessionDocumentWithId[]> {
    if (!userId) return [];
    try {
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where('userId', '==', userId),
            where('subject', '==', subject)
            // Removed: orderBy('startTime', 'desc') to avoid index requirement.
        );
        const querySnapshot = await getDocs(q);
        const sessions = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SessionDocumentWithId[];

        // Sort in-memory after fetching
        sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

        return sessions;
    } catch (error) {
        console.error("Error fetching sessions by subject:", error);
        throw new Error("Failed to fetch sessions. A Firestore index might be required.");
    }
}


// Update a session (for notes, tree structure, timer, etc.)
export async function updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, updates);
  } catch (error) {
    console.error("Error updating session:", error);
    throw new Error("Failed to update session.");
  }
}

// Delete a session
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete session.");
  }
}
