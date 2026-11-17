import axios from 'axios'
import { useRouter } from 'vue-router';
const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api';
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request Interceptor - автоматически добавляем токен
httpClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Логирование в dev режиме
    if (import.meta.env.DEV) {
      console.log(`🔵 ${config.method.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);
// Response Interceptor - обработка ошибок
httpClient.interceptors.response.use(
  (response) => {
    // Логирование успешных ответов
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Обработка 401 - редирект на логин
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Логирование ошибок
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data);
    
    return Promise.reject(error);
  }
);
export default httpClient;