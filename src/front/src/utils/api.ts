import axios from 'axios';

const baseURL = import.meta.env.VITE_BACK_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
