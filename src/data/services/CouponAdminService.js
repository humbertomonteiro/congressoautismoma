import axios from "axios";
import { auth } from "../../../firebaseConfig";

const isProduction = import.meta.env.VITE_ENV === "production";
const BASE_URL = isProduction
  ? `${import.meta.env.VITE_BASE_URL_PRODUCTION}/coupons`
  : `${import.meta.env.VITE_BASE_URL_SANDBOX}/coupons`;

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

const CouponAdminService = {
  async listCoupons() {
    const headers = await getAuthHeaders();
    const res = await axios.get(BASE_URL, { headers });
    return res.data.data;
  },

  async createCoupon(data) {
    const headers = await getAuthHeaders();
    const res = await axios.post(BASE_URL, data, { headers });
    return res.data;
  },

  async updateCoupon(id, data) {
    const headers = await getAuthHeaders();
    const res = await axios.put(`${BASE_URL}/${id}`, data, { headers });
    return res.data;
  },

  async deleteCoupon(id) {
    const headers = await getAuthHeaders();
    const res = await axios.delete(`${BASE_URL}/${id}`, { headers });
    return res.data;
  },
};

export default CouponAdminService;
