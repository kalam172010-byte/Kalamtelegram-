import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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
    firestoreDatabaseId: 'ai-studio-kalamffpaneltele-80fa19f6-f935-4bdf-97bc-0c6dd01b4d82'
  };
}

const firebaseConfig = getFirebaseConfig();
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const STORE_DOC = doc(db, 'settings', 'master_database');

export async function loadStateFromFirestore(): Promise<any | null> {
  try {
    console.log('⚡ Firestore: Connecting & retrieving persistent database snapshot...');
    const snap = await getDoc(STORE_DOC);
    if (snap.exists()) {
      const data = snap.data();
      console.log('⚡ Firestore: Successfully loaded persistent state from Cloud Firestore!');
      return data;
    }
  } catch (err: any) {
    console.warn('⚡ Firestore load error:', err.message);
  }
  return null;
}

export async function saveStateToFirestore(data: any): Promise<void> {
  try {
    // Sanitize data for Firestore (JSON stringifiable)
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(STORE_DOC, {
      ...cleanData,
      last_synced_at: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    console.warn('⚡ Firestore sync error:', err.message);
  }
}
