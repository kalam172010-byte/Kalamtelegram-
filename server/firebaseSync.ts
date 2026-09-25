import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

function getFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read firebase-applet-config.json:', e);
  }
  return {
    projectId: 'kalam-panel',
    firestoreDatabaseId: 'ai-studio-kalamtelegram-fbe85e45-7e8b-4c74-8606-6c7736ba397a'
  };
}

const firebaseConfig = getFirebaseConfig();
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function initServerFirestore() {
  const dbId = firebaseConfig.firestoreDatabaseId;
  try {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  } catch (err) {
    try {
      return initializeFirestore(app, {}, dbId || undefined);
    } catch {
      return getFirestore(app);
    }
  }
}

export const db = initServerFirestore();

const STORE_DOC = doc(db, 'settings', 'master_database');

// Circuit Breaker & Throttling State to prevent Firestore Quota Exhaustion
let isQuotaExhausted = false;
let quotaExhaustedUntil = 0;
let saveDebounceTimer: NodeJS.Timeout | null = null;
let pendingDataToSave: any = null;
let isSaving = false;
let lastSaveTime = 0;
const MIN_SAVE_INTERVAL_MS = 15000; // Minimum interval for standard background autosave

export function isFirestoreQuotaExhausted(): boolean {
  if (isQuotaExhausted && Date.now() > quotaExhaustedUntil) {
    isQuotaExhausted = false;
    quotaExhaustedUntil = 0;
    console.log('⚡ Firestore: Quota backoff window expired. Resuming cloud backup stream.');
  }
  return isQuotaExhausted;
}

export async function loadStateFromFirestore(): Promise<any | null> {
  if (isFirestoreQuotaExhausted()) {
    return null;
  }

  try {
    console.log('⚡ Firestore: Connecting & retrieving persistent database snapshot...');
    const snap = await getDoc(STORE_DOC);
    if (snap.exists()) {
      const data = snap.data();
      console.log('⚡ Firestore: Successfully loaded persistent state from Cloud Firestore!');
      return data;
    }
  } catch (err: any) {
    const msg = String(err?.message || err?.code || err);
    if (
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Quota limit exceeded') ||
      err?.code === 'resource-exhausted' ||
      msg.includes('8 RESOURCE_EXHAUSTED')
    ) {
      isQuotaExhausted = true;
      quotaExhaustedUntil = Date.now() + 15 * 60 * 1000; // Pause cloud writes for 15 minutes
      console.warn('⚡ Firestore: Daily quota limit reached on cloud project. Operating securely with local high-speed disk database.');
    } else if (
      msg.includes('NOT_FOUND') ||
      msg.includes('Code: 5') ||
      err?.code === 'not-found' ||
      msg.includes('5 NOT_FOUND')
    ) {
      console.log('⚡ Firestore: Master document does not exist yet. Local disk store is active and will create it on save.');
    } else {
      console.warn('⚡ Firestore load notice:', msg);
    }
  }
  return null;
}

async function performActualFirestoreSave(data: any): Promise<void> {
  if (isFirestoreQuotaExhausted()) {
    return;
  }

  if (isSaving) {
    pendingDataToSave = data;
    return;
  }

  isSaving = true;
  lastSaveTime = Date.now();

  try {
    // Sanitize data for Firestore (JSON stringifiable)
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(STORE_DOC, {
      ...cleanData,
      last_synced_at: new Date().toISOString()
    });
    // Clear any previous error flag on success
    isQuotaExhausted = false;
  } catch (err: any) {
    const msg = String(err?.message || err?.code || err);
    if (
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Quota limit exceeded') ||
      err?.code === 'resource-exhausted' ||
      msg.includes('8 RESOURCE_EXHAUSTED')
    ) {
      isQuotaExhausted = true;
      quotaExhaustedUntil = Date.now() + 15 * 60 * 1000; // Pause cloud writes for 15 minutes
      console.warn('⚡ Firestore Notice: Cloud write quota limit reached. Local disk database is 100% active and maintaining all state.');
    } else if (
      msg.includes('NOT_FOUND') ||
      msg.includes('Code: 5') ||
      err?.code === 'not-found' ||
      msg.includes('5 NOT_FOUND')
    ) {
      console.warn('⚡ Firestore Notice: Document location not found or created yet.');
    } else {
      console.warn('⚡ Firestore save notice:', msg);
    }
  } finally {
    isSaving = false;
    if (pendingDataToSave && !isFirestoreQuotaExhausted()) {
      const nextData = pendingDataToSave;
      pendingDataToSave = null;
      saveStateToFirestore(nextData);
    }
  }
}

export async function saveStateToFirestore(data: any, forceImmediate: boolean = false): Promise<void> {
  if (isFirestoreQuotaExhausted()) {
    return;
  }

  pendingDataToSave = data;

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }

  if (forceImmediate) {
    const dataToSave = pendingDataToSave;
    pendingDataToSave = null;
    await performActualFirestoreSave(dataToSave);
    return;
  }

  const timeSinceLastSave = Date.now() - lastSaveTime;
  const delay = timeSinceLastSave < MIN_SAVE_INTERVAL_MS ? (MIN_SAVE_INTERVAL_MS - timeSinceLastSave) : 1000;

  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    if (pendingDataToSave) {
      const dataToSave = pendingDataToSave;
      pendingDataToSave = null;
      performActualFirestoreSave(dataToSave).catch(() => {});
    }
  }, delay);
}

/**
 * Real-Time Firestore Individual Document Handlers for Products
 */
export async function syncProductToFirestore(product: any): Promise<void> {
  if (isFirestoreQuotaExhausted() || !product || product.id === undefined) return;
  try {
    const cleanProd = JSON.parse(JSON.stringify(product));
    await setDoc(doc(db, 'products', String(product.id)), cleanProd);
    console.log(`⚡ Firestore: Real-time product #${product.id} synced to 'products' collection.`);
  } catch (err: any) {
    console.warn('⚡ Firestore notice (syncProductToFirestore):', err?.message || err);
  }
}

export async function deleteProductFromFirestore(productId: string | number): Promise<void> {
  if (isFirestoreQuotaExhausted() || productId === undefined) return;
  try {
    await deleteDoc(doc(db, 'products', String(productId)));
    console.log(`⚡ Firestore: Real-time product #${productId} deleted from 'products' collection.`);
  } catch (err: any) {
    console.warn('⚡ Firestore notice (deleteProductFromFirestore):', err?.message || err);
  }
}

export async function deleteProductsFromFirestore(productIds: (string | number)[]): Promise<void> {
  if (isFirestoreQuotaExhausted() || !Array.isArray(productIds)) return;
  for (const id of productIds) {
    await deleteProductFromFirestore(id);
  }
}

