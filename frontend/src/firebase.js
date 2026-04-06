// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8BXtRX7pvMBK2j56p6hKm3Ih5vbX4njw",
  authDomain: "renthub-ae366.firebaseapp.com",
  projectId: "renthub-ae366",
  storageBucket: "renthub-ae366.firebasestorage.app",
  messagingSenderId: "902510641231",
  appId: "1:902510641231:web:83889d4997a80cac896a3a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
