import axios from "axios";
import { auth } from "../../../firebaseConfig";

const isProduction = import.meta.env.VITE_ENV === "production";
const BASE_URL = isProduction
  ? `${import.meta.env.VITE_BASE_URL_PRODUCTION}/users`
  : `${import.meta.env.VITE_BASE_URL_SANDBOX}/users`;

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

const UserService = {
  async listUsers() {
    const headers = await getAuthHeaders();
    const res = await axios.get(BASE_URL, { headers });
    return res.data.data;
  },

  async createUser({ name, email, password, role, sellerId, sellerName }) {
    const headers = await getAuthHeaders();
    const res = await axios.post(
      BASE_URL,
      { name, email, password, role, sellerId, sellerName },
      { headers }
    );
    return res.data;
  },

  async updateUser(uid, { name, role, sellerId, sellerName }) {
    const headers = await getAuthHeaders();
    const res = await axios.put(
      `${BASE_URL}/${uid}`,
      { name, role, sellerId, sellerName },
      { headers }
    );
    return res.data;
  },

  async deleteUser(uid) {
    const headers = await getAuthHeaders();
    const res = await axios.delete(`${BASE_URL}/${uid}`, { headers });
    return res.data;
  },
};

export default UserService;
