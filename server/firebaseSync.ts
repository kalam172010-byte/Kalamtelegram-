import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  setLogLevel, 
  getDocFromServer,
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  type Firestore
} from 'firebase/firestore';

// Suppress internal Firebase SDK stream retry/error spam in server process
try {
  setLogLevel('silent');
} catch {
  // ignore
}

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

function createFirestoreInstance(databaseId?: string): Firestore {
  try {
    if (databaseId && databaseId !== '(default)') {
      return getFirestore(app, databaseId);
    }
    return getFirestore(app);
  } catch {
    try {
      return initializeFirestore(app, {}, databaseId || undefined);
    } catch {
      return getFirestore(app);
    }
  }
}

// Active database instance
export let db = createFirestoreInstance(firebaseConfig.firestoreDatabaseId);
let STORE_DOC = doc(db, 'settings', 'master_database');

// Connection & Health State
let isCloudDbAvailable = false;
let isConnectionVerified = false;
let connectionCheckPromise: Promise<boolean> | null = null;
let lastConnectionCheckTime = 0;
const CONNECTION_RETRY_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Circuit Breaker & Throttling State
let isQuotaExhausted = false;
let quotaExhaustedUntil = 0;
let saveDebounceTimer: NodeJS.Timeout | null = null;
let pendingDataToSave: any = null;
let isSaving = false;
let lastSaveTime = 0;
const MIN_SAVE_INTERVAL_MS = 15000;

export function isFirestoreQuotaExhausted(): boolean {
  if (isQuotaExhausted && Date.now() > quotaExhaustedUntil) {
    isQuotaExhausted = false;
    quotaExhaustedUntil = 0;
    console.log('⚡ Firestore: Quota backoff window expired. Cloud state active.');
  }
  return isQuotaExhausted;
}

export function isFirestoreAvailable(): boolean {
  return isCloudDbAvailable && !isFirestoreQuotaExhausted();
}

/**
 * Validates connection to Cloud Firestore using getDocFromServer with timeout
 * Probes the configured database ID, falling back to default database if needed.
 */
export async function verifyFirestoreConnection(): Promise<boolean> {
  const now = Date.now();
  if (isConnectionVerified && (now - lastConnectionCheckTime < CONNECTION_RETRY_INTERVAL_MS)) {
    return isCloudDbAvailable;
  }

  if (connectionCheckPromise) {
    return connectionCheckPromise;
  }

  connectionCheckPromise = (async () => {
    lastConnectionCheckTime = Date.now();

    const probe = async (testDb: Firestore): Promise<boolean> => {
      try {
        const promise = getDocFromServer(doc(testDb, 'test', 'connection'));
        const timeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection probe timeout')), 2500)
        );
        await Promise.race([promise, timeout]);
        return true;
      } catch (err: any) {
        const msg = String(err?.message || err?.code || err);
        // If the document doesn't exist, the connection to the database itself succeeded!
        if (msg.includes('not-found') || err?.code === 'not-found') {
          // Document not found on server means database is reachable and alive
          return true;
        }
        return false;
      }
    };

    // 1. Probe primary configured database
    let ok = await probe(db);

    // 2. If primary failed and was a custom database ID, test default database
    if (!ok && firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      const fallbackDb = createFirestoreInstance('(default)');
      const fallbackOk = await probe(fallbackDb);
      if (fallbackOk) {
        db = fallbackDb;
        STORE_DOC = doc(db, 'settings', 'master_database');
        ok = true;
        console.log('⚡ Firestore: Connected using (default) database.');
      }
    }

    isCloudDbAvailable = ok;
    isConnectionVerified = true;

    if (ok) {
      console.log('⚡ Firestore: Cloud database connection verified.');
    } else {
      console.log('⚡ Firestore: Cloud database not reachable (offline / auth restricted). System operating seamlessly on high-speed persistent disk database.');
    }

    return ok;
  })().finally(() => {
    connectionCheckPromise = null;
  });

  return connectionCheckPromise;
}

export async function loadStateFromFirestore(): Promise<any | null> {
  const isConnected = await verifyFirestoreConnection();
  if (!isConnected || isFirestoreQuotaExhausted()) {
    return null;
  }

  try {
    console.log('⚡ Firestore: Retrieving persistent database snapshot...');
    const promise = getDoc(STORE_DOC);
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Read timeout')), 4000)
    );
    const snap = await Promise.race([promise, timeout]);

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
      err?.code === 'resource-exhausted'
    ) {
      isQuotaExhausted = true;
      quotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
      console.warn('⚡ Firestore: Daily quota limit reached. Disk store active.');
    } else if (msg.includes('NOT_FOUND') || msg.includes('Code: 5') || err?.code === 'not-found') {
      console.log('⚡ Firestore: Master document does not exist yet. Disk store active.');
    } else {
      isCloudDbAvailable = false;
      console.warn('⚡ Firestore load notice:', msg);
    }
  }
  return null;
}

async function performActualFirestoreSave(data: any): Promise<void> {
  if (!isCloudDbAvailable || isFirestoreQuotaExhausted()) {
    return;
  }

  if (isSaving) {
    pendingDataToSave = data;
    return;
  }

  isSaving = true;
  lastSaveTime = Date.now();

  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    const writePromise = setDoc(STORE_DOC, {
      ...cleanData,
      last_synced_at: new Date().toISOString()
    });
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout')), 5000)
    );

    await Promise.race([writePromise, timeoutPromise]);
    isQuotaExhausted = false;
  } catch (err: any) {
    const msg = String(err?.message || err?.code || err);
    if (
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('Quota limit exceeded') ||
      err?.code === 'resource-exhausted'
    ) {
      isQuotaExhausted = true;
      quotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
      console.warn('⚡ Firestore Notice: Quota limit reached. Local disk database maintaining all state.');
    } else if (
      msg.includes('NOT_FOUND') || 
      msg.includes('Code: 5') || 
      msg.includes('PERMISSION_DENIED') ||
      msg.includes('unavailable') ||
      msg.includes('timeout')
    ) {
      isCloudDbAvailable = false;
      console.warn('⚡ Firestore Notice: Cloud database currently offline. Local disk maintaining 100% of state.');
    } else {
      console.warn('⚡ Firestore save notice:', msg);
    }
  } finally {
    isSaving = false;
    if (pendingDataToSave && isCloudDbAvailable && !isFirestoreQuotaExhausted()) {
      const nextData = pendingDataToSave;
      pendingDataToSave = null;
      saveStateToFirestore(nextData);
    }
  }
}

export async function saveStateToFirestore(data: any, forceImmediate: boolean = false): Promise<void> {
  if (!isCloudDbAvailable || isFirestoreQuotaExhausted()) {
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
  if (!isCloudDbAvailable || isFirestoreQuotaExhausted() || !product || product.id === undefined) return;
  try {
    const cleanProd = JSON.parse(JSON.stringify(product));
    const writePromise = setDoc(doc(db, 'products', String(product.id)), cleanProd);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Product sync timeout')), 4000)
    );
    await Promise.race([writePromise, timeoutPromise]);
  } catch {
    // Graceful handling without throwing
  }
}

export async function deleteProductFromFirestore(productId: string | number): Promise<void> {
  if (!isCloudDbAvailable || isFirestoreQuotaExhausted() || productId === undefined) return;
  try {
    const deletePromise = deleteDoc(doc(db, 'products', String(productId)));
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Product delete timeout')), 4000)
    );
    await Promise.race([deletePromise, timeoutPromise]);
  } catch {
    // Graceful handling without throwing
  }
}

export async function deleteProductsFromFirestore(productIds: (string | number)[]): Promise<void> {
  if (!isCloudDbAvailable || isFirestoreQuotaExhausted() || !Array.isArray(productIds)) return;
  for (const id of productIds) {
    await deleteProductFromFirestore(id);
  }
}
