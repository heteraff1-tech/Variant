import { ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useToast } from 'vue-toastification';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { useAuthStore } from '@/stores/authStore';

export function useAdminSubjects() {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Состояние модалки
  const isSubjectsModalOpen = ref(false);

  // Локальная копия для редактирования
  const localSubjects = ref([]);

  // GET — список предметов
  const {
    data: subjects,
    isLoading: isLoadingSubjects,
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ['admin', authStore.user?.id, 'subjects'],
queryFn: async () => {
    const { data } = await httpClient.get(
      API_ROUTES.admin.subjects(authStore.user?.id)
    );
    // API возвращает { success, data: { subjects: [...] }, ... }
    return data.data.subjects;
  },
    enabled: false, // загружаем только при открытии
  });

  // Синхронизируем локальную копию при получении данных
  watch(subjects, (val) => {
    if (val) {
      localSubjects.value = val.map((s) => ({ ...s }));
    }
  });

  // Открыть модалку
  const openSubjectsModal = async () => {
    const result = await refetchSubjects();
    localSubjects.value = (result.data ?? []).map((s) => ({ ...s }));
    isSubjectsModalOpen.value = true;
  };

  const closeSubjectsModal = () => {
    isSubjectsModalOpen.value = false;
  };

  // Добавить новый предмет в список
  const addSubject = () => {
    localSubjects.value.push({ title: '' });
  };

  // Удалить предмет из списка
  const removeSubject = (index) => {
    localSubjects.value.splice(index, 1);
  };

  // PUT — сохранение предметов
  const { mutate: saveSubjects, isPending: isSavingSubjects } = useMutation({
    mutationFn: async () => {
      await httpClient.put(API_ROUTES.admin.subjects(authStore.user?.id), {
        subjects: localSubjects.value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', authStore.user?.id, 'subjects'] });
      toast.success('Предметы успешно обновлены');
      closeSubjectsModal();
    },
    onError: () => {
      toast.error('Ошибка при сохранении предметов');
    },
  });

  return {
    isSubjectsModalOpen,
    localSubjects,
    isLoadingSubjects,
    isSavingSubjects,
    openSubjectsModal,
    closeSubjectsModal,
    addSubject,
    removeSubject,
    saveSubjects,
  };
}
