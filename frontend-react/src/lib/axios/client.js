import axios from 'axios';

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://drl-backend-f0sx.onrender.com/api/v1',
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
