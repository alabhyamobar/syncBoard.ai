import axios from "axios";
import { setToken , getToken } from "../util/tokenManager.js";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
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

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        setToken(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);

      } catch (err) {
        setToken(null);
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;