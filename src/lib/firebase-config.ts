import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// Firebase Configuration — Mary Bot Master Panel
// Uses Firebase Firestore for salon license management
// ═══════════════════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyA4pc_laIMG3JJYAFARV0LHDGYtXEMIe9c",
  authDomain: "nail-bot-mary.firebaseapp.com",
  projectId: "nail-bot-mary",
  storageBucket: "nail-bot-mary.firebasestorage.app",
  messagingSenderId: "954586354082",
  appId: "1:954586354082:web:3e3e8f8b3a3d4e5f6a7b8c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };
