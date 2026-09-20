import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyDNZNZNXI01w_SyD7kyVY7SmFp5hQTEC6M",
  authDomain: "eagle-futsal-manager.firebaseapp.com",
  projectId: "eagle-futsal-manager",
  storageBucket: "eagle-futsal-manager.firebasestorage.app",
  messagingSenderId: "364876226824",
  appId: "1:364876226824:web:894d13bb05d8d0e664ccbd"
};

export const FIREBASE_APP_ID = 'eagle-futsal-db-v3';
export const IS_CONFIGURED = !firebaseConfig.apiKey.includes("xxxxxx");

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (IS_CONFIGURED) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.warn("Firebase Init Error:", e);
  }
}

export { app, auth, db };
export type { FirebaseApp, Firestore, Auth };

export function getCollectionPath(...segments: string[]) {
  return `artifacts/${FIREBASE_APP_ID}/public/data/${segments.join('/')}`;
}
