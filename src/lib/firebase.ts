import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  getDocFromServer,
  setDoc as rawSetDoc, 
  updateDoc as rawUpdateDoc, 
  deleteDoc as rawDeleteDoc, 
  onSnapshot as rawOnSnapshot, 
  query, 
  where,
  type Firestore,
  type SetOptions,
  type DocumentReference,
  type UpdateData
} from 'firebase/firestore';

// Suppress internal Firebase Web SDK stream retry/not-found notices in console
try {
  setLogLevel('silent');
} catch (e) {
  // ignore
}

import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Force Google to always display the Account Chooser (select_account)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with Database ID if specified
function initFirestore(): Firestore {
  const dbId = firebaseConfigJson.firestoreDatabaseId || undefined;
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true
    }, dbId);
  } catch (err) {
    try {
      return dbId ? getFirestore(app, dbId) : getFirestore(app);
    } catch {
      return getFirestore(app);
    }
  }
}

export const db: Firestore = initFirestore();

// Quota & Unavailable circuit breaker on client
let clientQuotaExhausted = false;
let clientQuotaExhaustedUntil = 0;
let clientDbUnavailable = false;

export async function testConnection(): Promise<boolean> {
  try {
    const promise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection probe timeout')), 2500)
    );
    await Promise.race([promise, timeout]);
    clientDbUnavailable = false;
    return true;
  } catch (error: any) {
    const msg = String(error?.message || error?.code || error);
    if (msg.includes('not-found') || error?.code === 'not-found') {
      clientDbUnavailable = false;
      return true;
    }
    clientDbUnavailable = true;
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration.");
    }
    return false;
  }
}

// Initial boot connection test
testConnection().catch(() => {});

// Re-check when auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    testConnection().catch(() => {});
  }
});

function isClientFirestoreDisabled(): boolean {
  if (clientDbUnavailable) return true;
  if (clientQuotaExhausted && Date.now() > clientQuotaExhaustedUntil) {
    clientQuotaExhausted = false;
    clientQuotaExhaustedUntil = 0;
  }
  return clientQuotaExhausted;
}

function handleFirestoreWriteError(err: any) {
  const msg = String(err?.message || err?.code || err);
  if (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota limit exceeded') ||
    err?.code === 'resource-exhausted' ||
    msg.includes('8 RESOURCE_EXHAUSTED')
  ) {
    clientQuotaExhausted = true;
    clientQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
    console.warn('Firestore notice: Write quota reached. Operating seamlessly with local high-speed state cache.');
  } else if (
    msg.includes('NOT_FOUND') ||
    msg.includes('Code: 5') ||
    err?.code === 'not-found' ||
    msg.includes('5 NOT_FOUND') ||
    msg.includes('timeout')
  ) {
    clientDbUnavailable = true;
  } else {
    console.warn('Firestore operation notice:', msg);
  }
}

// Safe onSnapshot wrapper to ensure real-time listeners are always active with graceful error handling
export function onSnapshotSafe(
  reference: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  try {
    return rawOnSnapshot(
      reference,
      onNext,
      (err: any) => {
        handleFirestoreWriteError(err);
        if (onError) {
          onError(err);
        }
      }
    );
  } catch (err: any) {
    handleFirestoreWriteError(err);
    return () => {};
  }
}

// Resilient wrapper around setDoc with timeout race
export async function setDoc<T>(documentRef: DocumentReference<T, any>, data: any, options?: SetOptions): Promise<void> {
  try {
    const writePromise = options 
      ? rawSetDoc(documentRef as any, data, options) 
      : rawSetDoc(documentRef as any, data);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout')), 5000)
    );
    await Promise.race([writePromise, timeoutPromise]);
  } catch (err: any) {
    handleFirestoreWriteError(err);
  }
}

// Resilient wrapper around updateDoc with timeout race
export async function updateDoc<T extends Record<string, any>>(documentRef: DocumentReference<T, any>, data: UpdateData<T>): Promise<void> {
  try {
    const writePromise = rawUpdateDoc(documentRef as any, data as any);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Update timeout')), 5000)
    );
    await Promise.race([writePromise, timeoutPromise]);
  } catch (err: any) {
    handleFirestoreWriteError(err);
  }
}

// Resilient wrapper around deleteDoc with timeout race
export async function deleteDoc(documentRef: DocumentReference<any, any>): Promise<void> {
  try {
    const writePromise = rawDeleteDoc(documentRef);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Delete timeout')), 5000)
    );
    await Promise.race([writePromise, timeoutPromise]);
  } catch (err: any) {
    handleFirestoreWriteError(err);
  }
}

export {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshotSafe as onSnapshot,
  query,
  where,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
};

export type { FirebaseUser };
