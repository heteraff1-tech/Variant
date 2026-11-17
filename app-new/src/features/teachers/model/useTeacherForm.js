import { ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useToast } from 'vue-toastification';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { useAuthStore } from '@/stores/authStore';

export function useTeacherForm() {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Состояние модалки
  const isModalOpen = ref(false);
  const selectedTeacher = ref(null);

  // Данные формы: список назначений (предмет + группы)
  const teacherInfo = ref(null);
  const formSubjects = ref([]); // [{ subject_id, group_ids: [] }]

  // Все предметы и группы организации (загружаются при открытии)
  const allSubjects = ref([]);
  const allGroups = ref([]);

  // Открыть модалку редактирования
  const openEdit = async (teacher) => {
    selectedTeacher.value = teacher;
    isModalOpen.value = true;
    await loadTeacherEditData();
  };

  const close = () => {
    isModalOpen.value = false;
    selectedTeacher.value = null;
    teacherInfo.value = null;
    formSubjects.value = [];
    allSubjects.value = [];
    allGroups.value = [];
  };

  // Загрузка данных преподавателя для редактирования
  const isLoadingForm = ref(false);
const loadTeacherEditData = async () => {
  if (!selectedTeacher.value) return;
  isLoadingForm.value = true;
  try {
    const response = await httpClient.get(
      API_ROUTES.admin.teacherEdit(authStore.user?.id, selectedTeacher.value.id)
    );
    // API: { success, data: { teacher, subjects, allSubjects, allGroups } }
    const data = response.data.data;

    teacherInfo.value = data.teacher;
    formSubjects.value = data.subjects.map((s) => ({
      subject_id: s.id,
      group_ids: s.groups.map((g) => g.id),
    }));
    allSubjects.value = data.allSubjects;
    allGroups.value = data.allGroups;
  } catch (e) {
    toast.error('Ошибка загрузки данных преподавателя');
    console.error(e);
  } finally {
    isLoadingForm.value = false;
  }
};


  // Добавить строку предмет+группы
  const addSubject = () => {
    formSubjects.value.push({ subject_id: '', group_ids: [] });
  };

  // Удалить строку
  const removeSubject = (index) => {
    formSubjects.value.splice(index, 1);
  };

  // Мутация — сохранение
  const { mutate: saveTeacher, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const adminId = authStore.user?.id;
      const teacherId = selectedTeacher.value.id;
      await httpClient.put(API_ROUTES.admin.teacherUpdate(adminId, teacherId), {
        subjects: formSubjects.value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', authStore.user?.id, 'teachers'] });
      toast.success('Преподаватель успешно обновлён');
      close();
    },
    onError: (err) => {
      toast.error('Ошибка при сохранении');
      console.error('Save error', err);
    },
  });

  return {
    isModalOpen,
    selectedTeacher,
    teacherInfo,
    formSubjects,
    allSubjects,
    allGroups,
    isLoadingForm,
    isSaving,
    openEdit,
    close,
    addSubject,
    removeSubject,
    saveTeacher,
  };
}
