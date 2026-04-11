import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../firebaseConfig";

async function fetchUserRole(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      return { role: data.role || "viewer", sellerId: data.sellerId || null, sellerName: data.sellerName || null };
    }
  } catch {
    // fallback silencioso
  }
  return { role: "viewer", sellerId: null, sellerName: null };
}

function mapFirebaseUser(firebaseUser, roleData = {}) {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || "Usuário",
    role: roleData.role || "viewer",
    sellerId: roleData.sellerId || null,
    sellerName: roleData.sellerName || null,
  };
}

export default class FirebaseAuth {
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(
        auth,
        async (user) => {
          if (user) {
            const roleData = await fetchUserRole(user.uid);
            resolve(mapFirebaseUser(user, roleData));
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const roleData = await fetchUserRole(userCredential.user.uid);
    return mapFirebaseUser(userCredential.user, roleData);
  }

  async register(name, email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;
    return { uid, name, email, role: "viewer", sellerId: null, sellerName: null };
  }

  async logout() {
    await signOut(auth);
  }
}
