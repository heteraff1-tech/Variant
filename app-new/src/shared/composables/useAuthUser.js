import { useQuery } from '@tanstack/vue-query';
import { useAuthStore } from '@/stores/authStore';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
/**
 * Загружает данные текущего пользователя и кеширует их
 */
export function useAuthUser() {
  const authStore = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await httpClient.get(API_ROUTES.auth.me);
      const userData = response.data.data.user;
      
      // Обновляем store
      authStore.user = userData;
      
      return userData;
    },
    enabled: !!authStore.token, // Загружаем только если есть токен
    staleTime: 1000 * 60 * 10, // 10 минут
    retry: false,
  });
}