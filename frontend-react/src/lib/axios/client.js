import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envApiUrl = import.meta.env.VITE_API_URL;
const isEnvUrlLocal = Boolean(
  envApiUrl && (envApiUrl.includes('localhost') || envApiUrl.includes('127.0.0.1'))
);

const resolvedBaseURL = isLocalhost
  ? (envApiUrl || 'http://localhost:8080/api/v1')
  : (!isEnvUrlLocal && envApiUrl ? envApiUrl : 'https://drl-backend-v5xb.onrender.com/api/v1');

export const client = axios.create({
  baseURL: resolvedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    // Return only data if it's an ApiResponse wrapper, else return full data
    if (response.data && response.data.code === "OK") {
      return response.data.data;
    }
    if (response.data && response.data.success === false) {
      return Promise.reject(new Error(response.data.message || "Lỗi hệ thống"));
    }
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);
