import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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
    return dbId
      ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
      : initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch (err) {
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
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
const MIN_SAVE_INTERVAL_MS = 20000; // Minimum 20 seconds between Firestore writes

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
      isQuotaExhausted = true;
      quotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
      console.warn('⚡ Firestore: Remote cloud database instance not found. Seamlessly operating on local high-speed disk store.');
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
    }, { merge: true });
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
      isQuotaExhausted = true;
      quotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
      console.warn('⚡ Firestore Notice: Remote cloud database not found. Local disk database is 100% active and maintaining all state.');
    } else {
      console.warn('⚡ Firestore save notice:', msg);
    }
  } finally {
    isSaving = false;
    // If new data arrived while saving, schedule next debounced save
    if (pendingDataToSave && !isFirestoreQuotaExhausted()) {
      const nextData = pendingDataToSave;
      pendingDataToSave = null;
      saveStateToFirestore(nextData);
    }
  }
}

export async function saveStateToFirestore(data: any): Promise<void> {
  if (isFirestoreQuotaExhausted()) {
    return;
  }

  pendingDataToSave = data;

  // Clear existing debounce timer
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  const timeSinceLastSave = Date.now() - lastSaveTime;
  const delay = timeSinceLastSave < MIN_SAVE_INTERVAL_MS ? (MIN_SAVE_INTERVAL_MS - timeSinceLastSave) : 2500;

  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    if (pendingDataToSave) {
      const dataToSave = pendingDataToSave;
      pendingDataToSave = null;
      performActualFirestoreSave(dataToSave).catch(() => {});
    }
  }, delay);
}
