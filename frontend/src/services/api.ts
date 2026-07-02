import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let csrfToken: string | null = null;

const fetchCsrfToken = async () => {
  try {
    const response = await axios.get(`${api.defaults.baseURL}/csrf-token`, {
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

export default api;
