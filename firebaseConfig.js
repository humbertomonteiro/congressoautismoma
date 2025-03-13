import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZANOFCjPiG5KZGLuiAdAqtcJt3N1LuHg",
  authDomain: "congresso-cuidar-mais.firebaseapp.com",
  projectId: "congresso-cuidar-mais",
  storageBucket: "congresso-cuidar-mais.firebasestorage.app",
  messagingSenderId: "700368250122",
  appId: "1:700368250122:web:a3b4245ad62e814a9086f3",
  measurementId: "G-PTMSSP7NH1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, app, auth };
