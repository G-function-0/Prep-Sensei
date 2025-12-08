// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXE7ZLm_5JZTgZTxEOtOftdVfOV-pogek",
  authDomain: "prepsensei.firebaseapp.com",
  projectId: "prepsensei",
  storageBucket: "prepsensei.firebasestorage.app",
  messagingSenderId: "701243073012",
  appId: "1:701243073012:web:a590e82b1bd8ed1dc519a1",
  measurementId: "G-H76CCD0WGH"
};

console.log("firebase config   ",firebaseConfig)

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
