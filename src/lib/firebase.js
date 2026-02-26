import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// وضعنا القيم هنا مباشرة لضمان إن المتصفح يشوفها 100% 
// ويفتح الموقع فوراً بدون الاعتماد على Vercel Env في هذه المرحلة
const firebaseConfig = {
  apiKey: "AIzaSyBIIdkBPaQFHhPLo7Gob7sA1LacaT3E2JE",
  authDomain: "wind-reviews.firebaseapp.com",
  projectId: "wind-reviews",
  storageBucket: "wind-reviews.firebasestorage.app",
  messagingSenderId: "596996130193",
  appId: "1:596996130193:web:186c91269249c6c5eb8630"
};

// تهيئة التطبيق - مستحيل يكون null دلوقتي
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };