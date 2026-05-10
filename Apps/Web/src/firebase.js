// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDrHIBjrw-RUUMOpd7YD-hBGcx7WZ4RFDM",
  authDomain: "lokawaazbgi.firebaseapp.com",
  projectId: "lokawaazbgi",
  storageBucket: "lokawaazbgi.firebasestorage.app",
  messagingSenderId: "627614170522",
  appId: "1:627614170522:web:87cf24a7fe0aa036194e23",
  measurementId: "G-7L25VLDSN1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);