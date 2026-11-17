import { computed, ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'vue-toastification';

export function useGradesTable(props) {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();

  const queryKey = computed(() => [
    'grades', 
    props.groupId, 
    props.subjectId, 
    props.month, 
    props.year
  ]);

  const averagesKey = computed(() => [
    'averages',
    props.groupId,
    props.subjectId
  ]);

  const studentsKey = computed(() => [
    'students',
    props.teacherId,
    props.groupId,
    props.subjectId,
  ]);

  const isEnabled = computed(() => !!props.groupId && !!props.subjectId && !!props.teacherId);

  const { data: students } = useQuery({
    queryKey: studentsKey,
    queryFn: async () => {
      const response = await httpClient.get(
        API_ROUTES.grades.students(props.teacherId, props.groupId, props.subjectId)
      );
      return response.data.data.students;
    },
    enabled: isEnabled,
  });

  const { data: gradesMap, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await httpClient.get(
        API_ROUTES.grades.get(
          props.teacherId, 
          props.groupId, 
          props.subjectId,
          props.month,
          props.year
        )
      );
      return response.data.data.grades;
    },
    enabled: isEnabled,
    keepPreviousData: true,
  });

  const { data: averagesMap } = useQuery({
    queryKey: averagesKey,
    queryFn: async () => {
      const response = await httpClient.get(
        API_ROUTES.grades.averages(props.teacherId, props.groupId, props.subjectId)
      );
      return response.data.data.averages;
    },
    enabled: isEnabled,
  });

  const SHORT_DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const dateColumns = computed(() => {
    const daysInMonth = new Date(props.year, props.month, 0).getDate();
    const columns = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(props.year, props.month - 1, day);
      columns.push({
        day,
        date: date.toISOString().split('T')[0],
        dayName: SHORT_DAYS[date.getDay()],
      });
    }
    return columns;
  });

  // Debounce — не спамим запросами при быстром наборе
  const debounceTimers = ref({});

  const { mutate: _saveGrade } = useMutation({
    mutationFn: async ({ studentId, date, grade }) => {
      await httpClient.post(
        API_ROUTES.grades.save(props.teacherId), 
        { studentId, subjectId: props.subjectId, date, grade: Number(grade) }
      );
    },
    onMutate: async (newGrade) => {
      // Оптимистичное обновление без отмены запросов
      const previousGrades = queryClient.getQueryData(queryKey.value);
      queryClient.setQueryData(queryKey.value, (oldMaps) => {
        if (!oldMaps) return oldMaps;
        const newMaps = { ...oldMaps };
        if (!newMaps[newGrade.studentId]) newMaps[newGrade.studentId] = {};
        newMaps[newGrade.studentId] = { ...newMaps[newGrade.studentId] };
        newMaps[newGrade.studentId][newGrade.date] = {
          grade: newGrade.grade,
          gradeId: newGrade.grade != null ? (newMaps[newGrade.studentId][newGrade.date]?.gradeId ?? null) : null,
          testId: null,
          testTitle: null,
          totalQuestions: null,
        };
        return newMaps;
      });
      return { previousGrades };
    },
    onError: (err, newGrade, context) => {
      queryClient.setQueryData(queryKey.value, context.previousGrades);
    },
    onSettled: () => {
      queryClient.invalidateQueries(queryKey.value);
      queryClient.invalidateQueries(averagesKey.value);
    }
  });

  // Обёртка с debounce 400ms — не шлём запрос на каждое нажатие клавиши
  function saveGrade({ studentId, date, grade }) {
    // Пропускаем null — это значит ячейку очистили, не сохраняем
    if (grade === null || grade === undefined) return;

    const key = `${studentId}-${date}`;
    clearTimeout(debounceTimers.value[key]);
    debounceTimers.value[key] = setTimeout(() => {
      _saveGrade({ studentId, date, grade });
    }, 400);
  }

  const { mutate: resetTestGrade, isLoading: isResetting } = useMutation({
    mutationFn: async ({ gradeId }) => {
      await httpClient.delete(
        API_ROUTES.grades.resetTest(props.teacherId, gradeId)
      );
    },
    onSuccess: () => {
      toast.success('Пересдача открыта. Студент может пройти тест заново.');
      queryClient.invalidateQueries(queryKey.value);
      queryClient.invalidateQueries(averagesKey.value);
    },
    onError: () => {
      toast.error('Не удалось открыть пересдачу');
    },
  });

  return { students, gradesMap, averagesMap, dateColumns, isLoading, saveGrade, resetTestGrade, isResetting };
}