import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('business_nexus_user');
  if (user) {
    const parsed = JSON.parse(user);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});

export default api;
