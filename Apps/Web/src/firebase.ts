import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrHIBjrw-RUUMOpd7YD-hBGcx7WZ4RFDM",
  authDomain: "lokawaazbgi.firebaseapp.com",
  projectId: "lokawaazbgi",
  storageBucket: "lokawaazbgi.firebasestorage.app",
  messagingSenderId: "627614170522",
  appId: "1:627614170522:web:87cf24a7fe0aa036194e23",
  measurementId: "G-7L25VLDSN1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();