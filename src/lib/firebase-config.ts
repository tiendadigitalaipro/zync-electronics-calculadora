import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ═══════════════════════════════════════════════════════════════════════════
// Firebase Configuration — SynthTrade Pro License System
// Uses Firebase Realtime Database for license storage and validation
//
// ⚠️ IMPORTANT: Update these placeholder values with your REAL Firebase
// config before deploying to production.
// ═══════════════════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyAeCKJZqE8xb5YvniZhJ6CODCRS0t5W-SI",
  authDomain: "synthtrade-pro.firebaseapp.com",
  databaseURL: "https://synthtrade-pro-default-rtdb.firebaseio.com",
  projectId: "synthtrade-pro",
  storageBucket: "synthtrade-pro.firebasestorage.app",
  messagingSenderId: "336497532355",
  appId: "1:336497532355:web:316ccb205fda8729e8f176"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE REALTIME DATABASE SECURITY RULES
// Apply these rules in the Firebase Console → Realtime Database → Rules tab
// ═══════════════════════════════════════════════════════════════════════════
//
// {
//   "rules": {
//     "licenses": {
//       ".read": true,
//       ".write": false,
//       "$licenseKey": {
//         ".read": true,
//         ".write": true
//       }
//     },
//     "demos": {
//       ".read": true,
//       ".write": false,
//       "$deviceId": {
//         ".read": true,
//         ".write": true
//       }
//     },
//     "admin": {
//       ".read": true,
//       ".write": true
//     },
//     "settings": {
//       ".read": true,
//       ".write": true
//     }
//   }
// }
// ═══════════════════════════════════════════════════════════════════════════
