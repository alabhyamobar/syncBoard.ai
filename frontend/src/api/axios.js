import axios from "axios";
import { setToken, getToken } from "../util";

const DEV_URL = import.meta.env.VITE_DEV_BACKEND_URL 
const PROD_URL = import.meta.env.VITE_PROD_BACKEND_URL 

const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const BACKEND_URL = isDev ? DEV_URL : PROD_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});


api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest = originalRequest.url && originalRequest.url.includes("auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        setToken(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);

      } catch (err) {
        setToken(null); 
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;