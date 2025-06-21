
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { SavedLink } from '@/components/dashboard/saved-link-item';

export interface LinkData extends Omit<SavedLink, 'id'> {
  userId: string;
  createdAt: Timestamp;
}

export interface LinkDocument extends LinkData {
    id: string;
}

const LINKS_COLLECTION = 'savedLinks';

// Get all saved links for a user
export async function getLinks(userId: string): Promise<LinkDocument[]> {
  if (!userId) return [];
  try {
    const q = query(
        collection(db, LINKS_COLLECTION), 
        where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const links = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as LinkDocument[];

    // Sort links by creation date in descending order (newest first)
    links.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() ?? 0;
      const timeB = b.createdAt?.toMillis() ?? 0;
      return timeB - timeA;
    });
    
    return links;

  } catch (error) {
    console.error("Error fetching links:", error);
    throw new Error("Failed to fetch links. An index might be required.");
  }
}

// Add a new saved link
export async function addLink(userId: string, linkData: Omit<SavedLink, 'id'>): Promise<string> {
  if (!userId) throw new Error("User ID is required to add a link.");
  try {
    const docRef = await addDoc(collection(db, LINKS_COLLECTION), {
      ...linkData,
      userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding link:", error);
    throw new Error("Failed to add link.");
  }
}

// Delete a saved link
export async function deleteLink(linkId: string): Promise<void> {
  try {
    const linkRef = doc(db, LINKS_COLLECTION, linkId);
    await deleteDoc(linkRef);
  } catch (error) {
    console.error("Error deleting link:", error);
    throw new Error("Failed to delete link.");
  }
}
