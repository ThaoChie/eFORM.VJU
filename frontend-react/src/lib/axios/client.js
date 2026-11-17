import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envApiUrl = import.meta.env.VITE_API_URL;
const isEnvUrlLocal = Boolean(
  envApiUrl && (envApiUrl.includes('localhost') || envApiUrl.includes('127.0.0.1'))
);

const resolvedBaseURL = isLocalhost
  ? (envApiUrl && !envApiUrl.includes('drl-backend-f0sx') ? envApiUrl : 'http://localhost:8080/api/v1')
  : (!isEnvUrlLocal && envApiUrl && !envApiUrl.includes('drl-backend-f0sx') ? envApiUrl : 'https://drl-backend-v5xb.onrender.com/api/v1');

export const getApiOrigin = () => {
  return resolvedBaseURL.replace(/\/api\/v1\/?$/, '');
};

export const getProofUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  let finalUrl = String(url).trim();
  if (finalUrl.includes('drl-backend-f0sx.onrender.com')) {
    finalUrl = finalUrl.replace('drl-backend-f0sx.onrender.com', 'drl-backend-v5xb.onrender.com');
  }
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    const origin = getApiOrigin();
    let path = finalUrl;
    if (!path.startsWith('/api/')) {
      path = `/api/v1/editor/proofs/${path.replace(/^\/+/, '')}`;
    }
    finalUrl = `${origin}${path}`;
  }
  try {
    const parsed = new URL(finalUrl);
    parsed.pathname = encodeURI(decodeURI(parsed.pathname));
    return parsed.toString();
  } catch {
    return encodeURI(finalUrl).replace(/"/g, '%22');
  }
};

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
    if (error.response && error.response.data && error.response.data.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);
