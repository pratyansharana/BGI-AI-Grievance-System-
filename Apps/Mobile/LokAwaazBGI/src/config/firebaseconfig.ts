import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDrHIBjrw-RUUMOpd7YD-hBGcx7WZ4RFDM",
  authDomain: "lokawaazbgi.firebaseapp.com",
  projectId: "lokawaazbgi",
  storageBucket: "lokawaazbgi.firebasestorage.app",
  messagingSenderId: "627614170522",
  appId: "1:627614170522:web:87cf24a7fe0aa036194e23",
  measurementId: "G-7L25VLDSN1"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore Database
const db = getFirestore(app);
const storage = getStorage(app);
export { app, auth, db, collection, addDoc, getDocs, storage };



