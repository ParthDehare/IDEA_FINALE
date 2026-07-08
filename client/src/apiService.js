import { authStore } from './authStore';

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const IS_DEV_SERVER = IS_LOCAL && window.location.port !== '' && window.location.port !== '80';
export const API_BASE = IS_DEV_SERVER
  ? 'http://localhost:8000'
  : IS_LOCAL
    ? ''
    : 'https://' + (import.meta.env.VITE_API_DOMAIN || 'api.vaultmind.systems');

export const fetchWithAuth = async (endpoint, options = {}) => {
  const headers = {
    ...options.headers,
  };

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
  }

  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  const response = await fetch(API_BASE + path, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    authStore.clearAuth();
    window.location.reload();
  }

  return response;
};
