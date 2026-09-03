import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, sanitizeForFirestore, handleFirestoreError, OperationType } from './config';
import { Interaction } from '../types';
import { getSeedInteractions } from '../data/seedInteractions';

const LOCAL_STORAGE_KEY_PREFIX = 'reflectai_interactions_';

/**
 * Persists an interaction session to Cloud Firestore under the user-isolated path:
 * /users/{userId}/interactions/{interactionId}
 */
export async function saveInteraction(
  userId: string,
  interaction: Interaction,
  isDemoMode: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    throw new Error('User ID is required to save interaction');
  }

  // Sanitize to guarantee strict undefined-stripping
  const cleanPayload = sanitizeForFirestore({
    ...interaction,
    userId,
    updatedAt: new Date().toISOString(),
  });

  if (isFirebaseConfigured && db && !isDemoMode) {
    const docPath = `users/${userId}/interactions/${interaction.id}`;
    try {
      const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
      await setDoc(docRef, cleanPayload, { merge: true });
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  }

  // Fallback to local user-isolated storage for demo/preview mode
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    const list: Interaction[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((item) => item.id === interaction.id);

    if (index >= 0) {
      list[index] = cleanPayload as Interaction;
    } else {
      list.unshift(cleanPayload as Interaction);
    }

    localStorage.setItem(key, JSON.stringify(list));
    return { success: true };
  } catch (err: any) {
    console.error('Local persistence failure:', err);
    return { success: false, error: err?.message || 'Failed to persist interaction locally' };
  }
}

/**
 * Loads all user interactions ordered by updatedAt descending
 */
export async function getUserInteractions(
  userId: string,
  isDemoMode: boolean = false
): Promise<Interaction[]> {
  if (!userId) return [];

  if (isFirebaseConfigured && db && !isDemoMode) {
    const colPath = `users/${userId}/interactions`;
    try {
      const colRef = collection(db, 'users', userId, 'interactions');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);

      const items: Interaction[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Interaction);
      });
      if (items.length > 0) {
        return items;
      }
    } catch (err: any) {
      console.warn('Firestore fetch failed, checking local cache:', err);
      // Fallback to local cache if Firestore is unreachable or offline
    }
  }

  // Local user-isolated storage
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: Interaction[] = JSON.parse(raw);
      if (list.length > 0) {
        return list.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    }
  } catch (e) {
    console.error('Failed to load local interactions:', e);
  }

  // If no interactions exist yet, automatically initialize with curated seed reflections
  const seeds = getSeedInteractions(userId);
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(seeds));
  } catch (e) {
    console.warn('Failed to cache seed interactions locally:', e);
  }
  return seeds;
}

/**
 * Deletes an interaction by ID
 */
export async function deleteInteraction(
  userId: string,
  interactionId: string,
  isDemoMode: boolean = false
): Promise<boolean> {
  if (!userId || !interactionId) return false;

  if (isFirebaseConfigured && db && !isDemoMode) {
    const docPath = `users/${userId}/interactions/${interactionId}`;
    try {
      const docRef = doc(db, 'users', userId, 'interactions', interactionId);
      await deleteDoc(docRef);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  }

  // Local storage cleanup
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: Interaction[] = JSON.parse(raw);
      const filtered = list.filter((item) => item.id !== interactionId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return true;
  } catch {
    return false;
  }
}
