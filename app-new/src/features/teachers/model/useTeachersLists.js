import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { useAuthStore } from '@/stores/authStore';

export function useTeachersList() {
  const authStore = useAuthStore();

  // Фильтры
  const searchQuery = ref('');
  const subjectFilter = ref('');
  const groupFilter = ref('');

  // Запрос списка учителей
  const {
    data: rawTeachers,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', authStore.user?.id, 'teachers'],
    queryFn: async () => {
      const response = await httpClient.get(
        API_ROUTES.admin.teachers(authStore.user?.id)
      );
      return response.data.data.teachers;
    },
    enabled: !!authStore.isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  // Фильтрованный список
  const teachers = computed(() => {
    let list = rawTeachers.value ?? [];

    // По ФИО
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter((t) => {
        const full = `${t.last_name} ${t.name} ${t.patronymic}`.toLowerCase();
        return full.includes(q);
      });
    }

    // По предмету
    if (subjectFilter.value) {
      list = list.filter((t) =>
        t.subjects?.some((s) => s.title === subjectFilter.value)
      );
    }

    // По группе
    if (groupFilter.value) {
      list = list.filter((t) =>
        t.subjects?.some((s) => s.groups?.includes(groupFilter.value))
      );
    }

    // Сортировка по фамилии
    return [...list].sort((a, b) =>
      (a.last_name ?? '').localeCompare(b.last_name ?? '')
    );
  });

  function resetFilters() {
    searchQuery.value = '';
    subjectFilter.value = '';
    groupFilter.value = '';
  }

  return {
    teachers,
    rawTeachers,
    isLoading,
    isError,
    error,
    searchQuery,
    subjectFilter,
    groupFilter,
    resetFilters,
    refetch,
  };
}
