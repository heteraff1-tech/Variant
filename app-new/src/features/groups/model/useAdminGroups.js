import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useToast } from 'vue-toastification';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { useAuthStore } from '@/stores/authStore';

export function useAdminGroups() {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Фильтры
  const groupFilter = ref('');
  const subjectFilter = ref('');

  // Состояние редактирования студента
  const editingStudent = ref(null); // { groupId, studentId, newGroupId }

  // Модалка добавления группы
  const showAddGroupModal = ref(false);

  // Панель управления: таб
  const activeTab = ref('clear');
  const clearRows = ref([{ groupId: null }]);
  const migrateRows = ref([{ fromGroupId: null, toGroupId: null }]);

  // ===============================
  // ЗАГРУЗКА ДАННЫХ
  // ===============================
  const {
    data: groupsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', authStore.user?.id, 'groups'],
    queryFn: async () => {
      const { data } = await httpClient.get(
        API_ROUTES.admin.groups(authStore.user?.id)
      );
      return data.data.groups;
    },
    enabled: !!authStore.isAdmin,
    staleTime: 1000 * 60 * 2,
  });

  // Удобные алиасы
  const courses = computed(() => groupsData.value?.courses ?? []);
  const allGroups = computed(() => groupsData.value?.allGroups ?? []);
  const allSubjects = computed(() => groupsData.value?.allSubjects ?? []);

  // Пустые группы для миграции
  const emptyGroups = computed(() =>
    courses.value
      .flatMap((c) => c.groups)
      .filter((g) => g.students.length === 0)
      .map((g) => ({ id: g.id, title: g.title }))
  );

  // Фильтрованные данные
  const filteredCourses = computed(() => {
    let result = courses.value;
    if (groupFilter.value) {
      result = result
        .map((c) => ({
          ...c,
          groups: c.groups.filter((g) => g.id === groupFilter.value),
        }))
        .filter((c) => c.groups.length > 0);
    }
    return result;
  });

  // Опции для фильтра по группе
  const groupOptions = computed(() =>
    allGroups.value.map((g) => ({ label: g.title, value: g.id }))
  );

  // Инвалидация кеша
const invalidate = () => {
  queryClient.invalidateQueries({
    queryKey: ['admin', authStore.user?.id, 'groups'],
  });
  // При изменении групп — обновляем и список преподавателей
  queryClient.invalidateQueries({
    queryKey: ['admin', authStore.user?.id, 'teachers'],
  });
};

  // ===============================
  // УДАЛЕНИЕ ГРУППЫ
  // ===============================
  const { mutate: deleteGroup } = useMutation({
    mutationFn: async (groupId) => {
      await httpClient.delete(
        API_ROUTES.admin.groupDelete(authStore.user?.id, groupId)
      );
    },
    onSuccess: () => {
      toast.success('Группа удалена');
      invalidate();
    },
    onError: (e) => {
      toast.error(e.response?.data?.message ?? 'Ошибка удаления группы');
    },
  });

  function confirmDeleteGroup(groupId) {
    if (!confirm('Удалить группу? Все студенты будут отвязаны.')) return;
    deleteGroup(groupId);
  }

  // ===============================
  // ПЕРЕМЕЩЕНИЕ СТУДЕНТА
  // ===============================
  function toggleStudentEdit(groupId, studentId) {
    if (
      editingStudent.value?.groupId === groupId &&
      editingStudent.value?.studentId === studentId
    ) {
      editingStudent.value = null;
    } else {
      editingStudent.value = { groupId, studentId, newGroupId: null };
    }
  }

  const { mutate: moveStudent } = useMutation({
    mutationFn: async (studentId) => {
      await httpClient.put(
        API_ROUTES.admin.studentMove(authStore.user?.id, studentId),
        { toGroupId: editingStudent.value.newGroupId }
      );
    },
    onSuccess: () => {
      editingStudent.value = null;
      toast.success('Студент перемещён');
      invalidate();
    },
    onError: (e) => {
      toast.error(e.response?.data?.message ?? 'Ошибка перемещения');
    },
  });

  function handleMoveStudent(studentId) {
    if (!editingStudent.value?.newGroupId) {
      toast.warning('Выберите группу для перемещения');
      return;
    }
    moveStudent(studentId);
  }

  // ===============================
  // УДАЛЕНИЕ СТУДЕНТА ИЗ ГРУППЫ
  // ===============================
  const { mutate: removeStudentFromGroup } = useMutation({
    mutationFn: async ({ groupId, studentId }) => {
      await httpClient.delete(
        API_ROUTES.admin.studentRemove(authStore.user?.id, groupId, studentId)
      );
    },
    onSuccess: () => {
      editingStudent.value = null;
      toast.success('Студент убран из группы');
      invalidate();
    },
    onError: (e) => {
      toast.error(e.response?.data?.message ?? 'Ошибка удаления студента');
    },
  });

  function handleRemoveStudent(groupId, studentId) {
    if (!confirm('Убрать студента из группы?')) return;
    removeStudentFromGroup({ groupId, studentId });
  }

  // ===============================
  // ОЧИСТКА ГРУПП
  // ===============================
  function addClearRow() {
    if (clearRows.value.length >= 20) {
      toast.warning('Максимум 20 групп за раз');
      return;
    }
    clearRows.value.push({ groupId: null });
  }
  function removeClearRow(index) {
    clearRows.value.splice(index, 1);
    if (clearRows.value.length === 0) clearRows.value = [{ groupId: null }];
  }
  function resetClearRows() {
    clearRows.value = [{ groupId: null }];
  }

  const { mutate: executeClearGroups, isPending: isClearPending } = useMutation({
    mutationFn: async () => {
      const groupIds = clearRows.value.map((r) => r.groupId).filter(Boolean);
      if (!groupIds.length) throw new Error('no-groups');
      const { data } = await httpClient.post(
        API_ROUTES.admin.groupClear(authStore.user?.id),
        { groupIds }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Очищено студентов: ${data.cleared}`);
      resetClearRows();
      invalidate();
    },
    onError: (e) => {
      if (e.message === 'no-groups') {
        toast.warning('Выберите хотя бы одну группу');
        return;
      }
      toast.error(e.response?.data?.message ?? 'Ошибка очистки');
    },
  });

  function handleExecuteClear() {
    const count = clearRows.value.filter((r) => r.groupId).length;
    if (!count || !confirm(`Очистить ${count} группу(ы)?`)) return;
    executeClearGroups();
  }

  // ===============================
  // МИГРАЦИЯ СТУДЕНТОВ
  // ===============================
  function addMigrateRow() {
    if (migrateRows.value.length >= 10) {
      toast.warning('Максимум 10 миграций за раз');
      return;
    }
    migrateRows.value.push({ fromGroupId: null, toGroupId: null });
  }
  function removeMigrateRow(index) {
    migrateRows.value.splice(index, 1);
    if (migrateRows.value.length === 0)
      migrateRows.value = [{ fromGroupId: null, toGroupId: null }];
  }
  function resetMigrateRows() {
    migrateRows.value = [{ fromGroupId: null, toGroupId: null }];
  }

  const { mutate: executeMigrateGroups, isPending: isMigratePending } = useMutation({
    mutationFn: async () => {
      const migrations = migrateRows.value
        .filter((r) => r.fromGroupId && r.toGroupId)
        .map((r) => ({ fromGroupId: r.fromGroupId, toGroupId: r.toGroupId }));
      if (!migrations.length) throw new Error('no-migrations');
      const { data } = await httpClient.post(
        API_ROUTES.admin.groupMigrate(authStore.user?.id),
        { migrations }
      );
      return data;
    },
    onSuccess: (data) => {
      const report = data.results
        .map((r) => `${r.from} → ${r.to}: ${r.migrated}`)
        .join('\n');
      toast.success(`Миграция завершена!\n${report}`);
      resetMigrateRows();
      invalidate();
    },
    onError: (e) => {
      if (e.message === 'no-migrations') {
        toast.warning('Укажите группы для миграции');
        return;
      }
      toast.error(e.response?.data?.message ?? 'Ошибка миграции');
    },
  });

  function handleExecuteMigrate() {
    const count = migrateRows.value.filter(
      (r) => r.fromGroupId && r.toGroupId
    ).length;
    if (!count || !confirm(`Выполнить ${count} миграцию(й)?`)) return;
    executeMigrateGroups();
  }

  // Сброс фильтров
  function resetFilters() {
    groupFilter.value = '';
    subjectFilter.value = '';
  }

  return {
    // Данные
    courses,
    filteredCourses,
    allGroups,
    allSubjects,
    emptyGroups,
    groupOptions,
    isLoading,
    isError,
    refetch,
    // Фильтры
    groupFilter,
    subjectFilter,
    resetFilters,
    // Редактирование студентов
    editingStudent,
    toggleStudentEdit,
    handleMoveStudent,
    handleRemoveStudent,
    // Группы
    showAddGroupModal,
    confirmDeleteGroup,
    // Управление (очистка + миграция)
    activeTab,
    clearRows,
    migrateRows,
    addClearRow,
    removeClearRow,
    resetClearRows,
    handleExecuteClear,
    isClearPending,
    addMigrateRow,
    removeMigrateRow,
    resetMigrateRows,
    handleExecuteMigrate,
    isMigratePending,
  };
}
