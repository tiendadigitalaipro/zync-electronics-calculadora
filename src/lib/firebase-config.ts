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
  apiKey: "AIzaSyDemoKeyReplaceMe",
  authDomain: "synthtrade-pro.web.app",
  databaseURL: "https://synthtrade-pro-default-rtdb.firebaseio.com",
  projectId: "synthtrade-pro",
  storageBucket: "synthtrade-pro.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
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
