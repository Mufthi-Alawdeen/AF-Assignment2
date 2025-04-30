import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Add this

const firebaseConfig = {
  apiKey: "AIzaSyAkAlKef9jDECe0nJqNiOy-lGWc780Rt3I",
  authDomain: "countires-817ff.firebaseapp.com",
  projectId: "countires-817ff",
  storageBucket: "countires-817ff.firebasestorage.app",
  messagingSenderId: "710818121949",
  appId: "1:710818121949:web:fab8b8b6821e866dc1b334",
  measurementId: "G-1Q6R99BCQT",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Add this export
export default app;
