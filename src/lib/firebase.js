import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSy-dummy-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "wind-reviews.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "wind-reviews",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// تهيئة التطبيق - دايماً هيرجع كائن (Object) عشان يرضي المتصفح
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// تهيئة الخدمات - كدة الـ db والـ auth دايماً ليهم قيمة ومستحيل يبقوا null
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// سطر سحري للـ Debug: افتح كونسول المتصفح وشوف هل القيمة دي بتظهر ولا undefined
if (typeof window !== "undefined") {
    console.log("🛠️ Firebase Initialized with Auth Domain:", firebaseConfig.authDomain);
}

export { db, storage, auth };