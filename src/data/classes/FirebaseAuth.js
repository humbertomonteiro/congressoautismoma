import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../../../firebaseConfig";

function mapFirebaseUser(firebaseUser) {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || "Usuário",
  };
}

export default class FirebaseAuth {
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            resolve(mapFirebaseUser(user));
          } else {
            resolve(null);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return mapFirebaseUser(userCredential.user);
  }

  async register(name, email, password) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const { uid } = userCredential.user;
    return { uid, name, email };
  }

  async logout() {
    await signOut(auth);
  }
}
