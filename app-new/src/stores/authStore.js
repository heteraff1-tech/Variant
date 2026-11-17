import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import router from '@/router';import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { ROLES, APP_ROUTES } from '@/shared/config/constants';
import { handleError } from '@/shared/lib/errorHandler';
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const token = ref(null);
  // Флаг — true когда init() завершился (успешно или нет)
  const isInitialized = ref(false);
  // Getters (computed)
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role_id === ROLES.ADMIN);
  const isTeacher = computed(() => user.value?.role_id === ROLES.TEACHER);
  const isStudent = computed(() => user.value?.role_id === ROLES.STUDENT);
  // Actions
  
  /**
   * Инициализация (восстановление сессии из sessionStorage для refresh)
   * Используем sessionStorage только для токена, не для всех данных
   */
  async function init() {
    const savedToken = sessionStorage.getItem('token');
    if (savedToken) {
      token.value = savedToken;
      // Восстанавливаем данные пользователя через API
      try {
        const response = await httpClient.get(API_ROUTES.auth.infoUser);
        user.value = response.data.data.user;
      } catch (err) {
        // Токен невалидный — выходим
        token.value = null;
        sessionStorage.removeItem('token');
      }
    }
    // Сигнализируем что инициализация завершена
    isInitialized.value = true;
  }
  /**
   * Логин
   */
  async function login(credentials) {
    try {
      const response = await httpClient.post(API_ROUTES.auth.login, credentials);
      const { user: userData, token: userToken } = response.data.data;
      // Сохраняем в store
      user.value = userData;
      token.value = userToken;
      // Сохраняем только токен (для восстановления сессии после refresh)
      sessionStorage.setItem('token', userToken);
      return userData;
    } catch (error) {
      handleError(error, { fallbackMessage: 'Ошибка входа' });
      throw error;
    }
  }
  /**
   * Регистрация
   */
  async function register(data) {
    try {
      const response = await httpClient.post(API_ROUTES.auth.register, data);
      return response.data;
    } catch (error) {
      handleError(error, { fallbackMessage: 'Ошибка регистрации' });
      throw error;
    }
  }
  /**
   * Выход
   */
  function logout() {
    user.value = null;
    token.value = null;
    sessionStorage.removeItem('token');
    router.push(APP_ROUTES.LOGIN);
  }
  /**
   * Редирект на основе роли
   */
  function redirectByRole() {
    if (!user.value) return;
    const routes = {
      [ROLES.STUDENT]: APP_ROUTES.STUDENT(user.value.id),
      [ROLES.TEACHER]: APP_ROUTES.TEACHER(user.value.id),
      [ROLES.ADMIN]: APP_ROUTES.ADMIN(user.value.id),
    };
    const route = routes[user.value.role_id];
    if (route) {
      router.push(route);
    }
  }
  return {
    // State
    user,
    token,
    isInitialized,
    // Getters
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    // Actions
    init,
    login,
    register,
    logout,
    redirectByRole,
  };
});