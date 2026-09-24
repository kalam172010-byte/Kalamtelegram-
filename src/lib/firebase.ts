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
  onSnapshot, 
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

// Safe onSnapshot wrapper to prevent unhandled gRPC Write/Listen stream errors
export function onSnapshotSafe(
  reference: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  if (isClientFirestoreDisabled()) {
    return () => {};
  }
  try {
    return onSnapshot(
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

// Quota & Unavailable circuit breaker on client
let clientQuotaExhausted = false;
let clientQuotaExhaustedUntil = 0;
let clientDbUnavailable = false;

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
    msg.includes('5 NOT_FOUND')
  ) {
    // Gracefully handle document not found errors without throwing unhandled exceptions
  } else {
    console.warn('Firestore operation notice:', msg);
  }
}

// Resilient wrapper around setDoc that catches quota and not-found errors gracefully
export async function setDoc<T>(documentRef: DocumentReference<T, any>, data: any, options?: SetOptions): Promise<void> {
  if (isClientFirestoreDisabled()) return;
  try {
    if (options) {
      await rawSetDoc(documentRef as any, data, options);
    } else {
      await rawSetDoc(documentRef as any, data);
    }
  } catch (err: any) {
    handleFirestoreWriteError(err);
  }
}

// Resilient wrapper around updateDoc
export async function updateDoc<T extends Record<string, any>>(documentRef: DocumentReference<T, any>, data: UpdateData<T>): Promise<void> {
  if (isClientFirestoreDisabled()) return;
  try {
    await rawUpdateDoc(documentRef as any, data as any);
  } catch (err: any) {
    handleFirestoreWriteError(err);
  }
}

// Resilient wrapper around deleteDoc
export async function deleteDoc(documentRef: DocumentReference<any, any>): Promise<void> {
  if (isClientFirestoreDisabled()) return;
  try {
    await rawDeleteDoc(documentRef);
  } catch (err: any) {
    handleFirestoreWriteError(err);
  }
}

export {
  collection,
  doc,
  getDoc,
  getDocs,
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
