// Create axios client with base URL and auth header injection
import axios from 'axios';

const api = axios.create({
    // Default to backend dev port 5050; override via VITE_API_BASE_URL when needed
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
