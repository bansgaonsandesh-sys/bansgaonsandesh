// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAP4BVnVkrI6HArkz5CCDvXyVsJ6Q-kFx4",
  authDomain: "bansgaonsandesh-bd46b.firebaseapp.com",
  projectId: "bansgaonsandesh-bd46b",
  storageBucket: "bansgaonsandesh-bd46b.firebasestorage.app",
  messagingSenderId: "244492195314",
  appId: "1:244492195314:web:f11d8412f6c9789d2cc76b",
  measurementId: "G-9YS8W4K2JX"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only on client side
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
