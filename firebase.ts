
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These values are typically provided by the environment
// Since we are in a sandbox, we'll assume a standard configuration 
// or the environment will handle it. 
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDummyKey",
  authDomain: "sunolyrix.firebaseapp.com",
  projectId: "sunolyrix",
  storageBucket: "sunolyrix.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
