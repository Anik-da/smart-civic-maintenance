import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "smart-maintenance-494503.firebaseapp.com",
  databaseURL: "https://smart-maintenance-494503-default-rtdb.firebaseio.com",
  projectId: "smart-maintenance-494503",
  storageBucket: "smart-maintenance-494503.firebasestorage.app",
  messagingSenderId: "812446110775",
  appId: "1:812446110775:web:55cf4badd4dc7c19829bb2",
  measurementId: "G-B34JEHQYYY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

