// oxlint-disable no-underscore-dangle
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "./access";
import { navigate } from "wouter/use-browser-location";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: CustomAxiosRequestConfig;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.config.headers.Authorization = `Bearer ${token}`;
      p.resolve(apiClient(p.config));
    }
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await apiClient.get("/auth/refresh");
      const newAccessToken = refreshResponse.data.accessToken;

      setAccessToken(newAccessToken);

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (e) {
      clearAccessToken();

      navigate("/auth/login", { replace: true });

      processQueue(e as Error | null, null);

      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);
