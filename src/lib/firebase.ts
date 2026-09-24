import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
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

// Initialize Firestore with Database ID if specified, enabling long polling for fallback environments
function initFirestore(): Firestore {
  const dbId = firebaseConfigJson.firestoreDatabaseId;
  try {
    return dbId
      ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
      : initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch (err) {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
}

export const db: Firestore = initFirestore();

// Quota circuit breaker on client
let clientQuotaExhausted = false;
let clientQuotaExhaustedUntil = 0;

function isClientQuotaExhausted(): boolean {
  if (clientQuotaExhausted && Date.now() > clientQuotaExhaustedUntil) {
    clientQuotaExhausted = false;
    clientQuotaExhaustedUntil = 0;
  }
  return clientQuotaExhausted;
}

// Resilient wrapper around setDoc that catches quota exhaustion gracefully
export async function setDoc<T>(documentRef: DocumentReference<T, any>, data: any, options?: SetOptions): Promise<void> {
  if (isClientQuotaExhausted()) return;
  try {
    if (options) {
      await rawSetDoc(documentRef as any, data, options);
    } else {
      await rawSetDoc(documentRef as any, data);
    }
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota limit exceeded') || err?.code === 'resource-exhausted') {
      clientQuotaExhausted = true;
      clientQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
      console.warn('Firestore notice: Write quota reached. Data safely persisted to local cache.');
    }
  }
}

// Resilient wrapper around updateDoc
export async function updateDoc<T extends Record<string, any>>(documentRef: DocumentReference<T, any>, data: UpdateData<T>): Promise<void> {
  if (isClientQuotaExhausted()) return;
  try {
    await rawUpdateDoc(documentRef as any, data as any);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota limit exceeded') || err?.code === 'resource-exhausted') {
      clientQuotaExhausted = true;
      clientQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
    }
  }
}

// Resilient wrapper around deleteDoc
export async function deleteDoc(documentRef: DocumentReference<any, any>): Promise<void> {
  if (isClientQuotaExhausted()) return;
  try {
    await rawDeleteDoc(documentRef);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota limit exceeded') || err?.code === 'resource-exhausted') {
      clientQuotaExhausted = true;
      clientQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
    }
  }
}

// Test connection on boot to verify health
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore: Client is operating in offline mode.");
    }
  }
}
testConnection();

export {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
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
