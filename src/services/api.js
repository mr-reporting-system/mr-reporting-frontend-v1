import axios from 'axios';

// Vite exposes .env variables through import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setting a default header for all requests
api.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

export default api;