import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let csrfToken: string | null = null;

import { API_ENDPOINTS } from './apiEndpoints';

const fetchCsrfToken = async () => {
  try {
    const response = await axios.get(`${api.defaults.baseURL}${API_ENDPOINTS.AUTH.CSRF_TOKEN}`, {
      withCredentials: true,
    });
    csrfToken = response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token', error);
  }
};

// Fetch token on initialization
fetchCsrfToken();

api.interceptors.request.use(
  async (config) => {
    // Only attach CSRF token for mutating requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If error is 403 Invalid CSRF token, and we haven't retried yet
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.message === 'Invalid CSRF token' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Force fetch a fresh CSRF token
        await fetchCsrfToken();
        // Update the header of the original request
        if (csrfToken) {
          originalRequest.headers['x-csrf-token'] = csrfToken;
        }
        // Retry the request
        return api(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
