import axios from 'axios';

export const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('surge.sh')) {
    return 'https://seven7rpklip.onrender.com/api';
  }
  return 'https://seven7rpklip.onrender.com/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// Automatycznie dołączaj token JWT i aktualizuj baseURL
api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('yt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Obsługa 401 — wyloguj automatycznie dla chronionych tras
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/discord');
    const isUnauthorized = error.response?.status === 401 || error.response?.status === 403;
    if (isUnauthorized && !isAuthRoute && typeof window !== 'undefined') {
      localStorage.removeItem('yt_token');
      localStorage.removeItem('yt_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
