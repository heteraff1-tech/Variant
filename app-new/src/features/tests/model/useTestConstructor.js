import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';

/**
 * Типы вопросов
 */
export const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Один правильный ответ' },
  { value: 'multiple_choice', label: 'Несколько правильных ответов' },
  { value: 'open_answer', label: 'Открытый ответ' },
  { value: 'matching', label: 'Установление соответствия' },
  { value: 'ordering', label: 'Установление последовательности' },
  { value: 'fill_blanks', label: 'Заполнение пропусков' },
];

/**
 * Создать пустой вопрос нужного типа
 */
function createEmptyQuestion(type = 'single_choice') {
  const base = {
    description: '',
    imageFile: null,
    imagePreview: null,
    question_type: type,
  };

  switch (type) {
    case 'single_choice':
    case 'multiple_choice':
      return {
        ...base,
        answers: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      };

    case 'open_answer':
      return {
        ...base,
        correctAnswer: '',
      };

    case 'matching':
      return {
        ...base,
        pairs: [
          { left: '', right: '' },
          { left: '', right: '' },
          { left: '', right: '' },
        ],
      };

    case 'ordering':
      return {
        ...base,
        items: [
          { text: '' },
          { text: '' },
          { text: '' },
        ],
      };

    case 'fill_blanks':
      return {
        ...base,
        description: '',
      };

    default:
      return {
        ...base,
        answers: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      };
  }
}

export function useTestConstructor() {
  const router = useRouter();
  const toast = useToast();

  // ============ ID учителя ============
  const teacherId = ref(null);

  // ============ НАСТРОЙКИ ТЕСТА ============
  const testTitle = ref('');
  const testDescription = ref('');
  const beginningDate = ref('');
  const endDate = ref('');
  const testTime = ref('');
  const selectedSubjectId = ref(null);
  const selectedGroupIds = ref([]); // массив выбранных group_id
  const isGroupDropdownOpen = ref(false);
  const shuffleQuestions = ref(false); // перемешивание вопросов

  // ============ ОБЛОЖКА ТЕСТА ============
  const testCoverImage = ref(null);       // File объект
  const testCoverImagePreview = ref(null); // URL превью

  // ============ ВОПРОСЫ ============
  const questions = ref([
    createEmptyQuestion('single_choice'),
  ]);

  // ============ ДАННЫЕ С СЕРВЕРА ============
  const availableSubjects = ref([]);
  const availableGroups = ref([]);
  const loading = ref(false);

  // ============ ЗАГРУЗКА ДАННЫХ ============
  // Загружаем teacherId и предметы при монтировании
  async function loadInitialData() {
    try {
      const stateRes = await httpClient.get(API_ROUTES.teacher.state);
      teacherId.value = stateRes.data.data.teacherId;

      if (teacherId.value) {
        const subjectsRes = await httpClient.get(API_ROUTES.teacher.subjects(teacherId.value));
        availableSubjects.value = subjectsRes.data.data.subjects;
      }
    } catch (err) {
      console.error('Ошибка загрузки данных учителя:', err);
      toast.error('Не удалось загрузить данные');
    }
  }

  // Загружаем группы при выборе предмета
  watch(selectedSubjectId, async (newSubjectId) => {
    selectedGroupIds.value = [];
    availableGroups.value = [];
    isGroupDropdownOpen.value = false;

    if (newSubjectId && teacherId.value) {
      try {
        loading.value = true;
        const res = await httpClient.get(API_ROUTES.teacher.groups(teacherId.value, newSubjectId));
        availableGroups.value = res.data.data.groups;
      } catch (err) {
        console.error('Ошибка загрузки групп:', err);
        toast.error('Не удалось загрузить группы');
      } finally {
        loading.value = false;
      }
    }
  });

  // ============ РАБОТА С ВОПРОСАМИ ============
  function addQuestion(type = 'single_choice') {
    questions.value.push(createEmptyQuestion(type));
  }

  function removeQuestion(index) {
    if (questions.value.length > 1) {
      questions.value.splice(index, 1);
    }
  }

  function changeQuestionType(index, newType) {
    const oldQuestion = questions.value[index];
    const newQuestion = createEmptyQuestion(newType);
    // Сохраняем описание и изображение
    newQuestion.description = oldQuestion.description;
    newQuestion.imageFile = oldQuestion.imageFile;
    newQuestion.imagePreview = oldQuestion.imagePreview;
    questions.value[index] = newQuestion;
  }

  // ============ ОТВЕТЫ (single/multiple choice) ============
  function addAnswer(questionIndex) {
    questions.value[questionIndex].answers.push({ text: '', isCorrect: false });
  }

  function removeAnswer(questionIndex, answerIndex) {
    if (questions.value[questionIndex].answers.length > 3) {
      questions.value[questionIndex].answers.splice(answerIndex, 1);
    }
  }

  // ============ ПАРЫ (matching) ============
  function addPair(questionIndex) {
    questions.value[questionIndex].pairs.push({ left: '', right: '' });
  }

  function removePair(questionIndex, pairIndex) {
    if (questions.value[questionIndex].pairs.length > 2) {
      questions.value[questionIndex].pairs.splice(pairIndex, 1);
    }
  }

  // ============ ЭЛЕМЕНТЫ (ordering) ============
  function addOrderItem(questionIndex) {
    questions.value[questionIndex].items.push({ text: '' });
  }

  function removeOrderItem(questionIndex, itemIndex) {
    if (questions.value[questionIndex].items.length > 2) {
      questions.value[questionIndex].items.splice(itemIndex, 1);
    }
  }

  function moveOrderItem(questionIndex, fromIndex, direction) {
    const items = questions.value[questionIndex].items;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= items.length) return;
    const temp = items[fromIndex];
    items[fromIndex] = items[toIndex];
    items[toIndex] = temp;
  }

  // ============ ИЗОБРАЖЕНИЯ ВОПРОСОВ ============
  function onQuestionImageSelected(event, questionIndex) {
    const file = event.target.files[0];
    if (file) {
      questions.value[questionIndex].imageFile = file;
      questions.value[questionIndex].imagePreview = URL.createObjectURL(file);
    }
  }

  function removeQuestionImage(questionIndex) {
    questions.value[questionIndex].imageFile = null;
    questions.value[questionIndex].imagePreview = null;
  }

  // ============ ОБЛОЖКА ТЕСТА ============
  function onCoverSelected(event) {
    const file = event.target.files[0];
    if (file) {
      testCoverImage.value = file;
      testCoverImagePreview.value = URL.createObjectURL(file);
    }
  }

  function removeCover() {
    testCoverImage.value = null;
    testCoverImagePreview.value = null;
  }

  // ============ ВЫБОР ГРУПП (мультиселект) ============
  function toggleGroupSelection(groupId) {
    const index = selectedGroupIds.value.indexOf(groupId);
    if (index > -1) {
      selectedGroupIds.value.splice(index, 1);
    } else {
      selectedGroupIds.value.push(groupId);
    }
  }

  // ============ ВАЛИДАЦИЯ ============
  function validate() {
    if (!testTitle.value.trim()) {
      toast.error('Введите заголовок теста');
      return false;
    }
    if (!testCoverImage.value) {
      toast.error('Добавьте обложку теста');
      return false;
    }
    if (!selectedSubjectId.value) {
      toast.error('Выберите предмет');
      return false;
    }
    if (selectedGroupIds.value.length === 0) {
      toast.warning('Выберите хотя бы одну группу');
      return false;
    }
    if (!testTime.value || Number(testTime.value) <= 0) {
      toast.error('Укажите время прохождения теста');
      return false;
    }

    // Валидация каждого вопроса
    for (let i = 0; i < questions.value.length; i++) {
      const q = questions.value[i];
      const num = i + 1;

      if (!q.description.trim()) {
        toast.error(`Вопрос ${num}: заполните текст вопроса`);
        return false;
      }

      switch (q.question_type) {
        case 'single_choice':
        case 'multiple_choice': {
          if (q.answers.some(a => !a.text.trim())) {
            toast.error(`Вопрос ${num}: заполните все варианты ответов`);
            return false;
          }
          if (!q.answers.some(a => a.isCorrect)) {
            toast.error(`Вопрос ${num}: укажите хотя бы один правильный ответ`);
            return false;
          }
          break;
        }

        case 'open_answer': {
          if (!q.correctAnswer.trim()) {
            toast.error(`Вопрос ${num}: введите эталонный ответ`);
            return false;
          }
          break;
        }

        case 'matching': {
          if (q.pairs.some(p => !p.left.trim() || !p.right.trim())) {
            toast.error(`Вопрос ${num}: заполните все пары соответствий`);
            return false;
          }
          break;
        }

        case 'ordering': {
          if (q.items.some(item => !item.text.trim())) {
            toast.error(`Вопрос ${num}: заполните все элементы последовательности`);
            return false;
          }
          break;
        }

        case 'fill_blanks': {
          const blanks = q.description.match(/\{[^}]+\}/g);
          if (!blanks || blanks.length === 0) {
            toast.error(`Вопрос ${num}: добавьте хотя бы один пропуск в формате {ответ}`);
            return false;
          }
          break;
        }
      }
    }

    return true;
  }

  // ============ ПУБЛИКАЦИЯ ТЕСТА ============
  async function publishTest() {
    if (!validate()) return;

    try {
      loading.value = true;

      const formData = new FormData();
      formData.append('title', testTitle.value);
      formData.append('description', testDescription.value);
      formData.append('beginning_date', beginningDate.value);
      formData.append('end_date', endDate.value);
      formData.append('time', testTime.value);
      formData.append('subject_id', selectedSubjectId.value);
      formData.append('group_ids', JSON.stringify(selectedGroupIds.value));
      formData.append('shuffle_questions', shuffleQuestions.value);

      // Обложка теста (обязательна)
      formData.append('img', testCoverImage.value);

      // Вопросы: формируем данные в зависимости от типа
      const questionsData = questions.value.map(q => {
        const base = {
          description: q.description,
          question_type: q.question_type,
        };

        switch (q.question_type) {
          case 'single_choice':
          case 'multiple_choice':
            return {
              ...base,
              answers: q.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect })),
            };

          case 'open_answer':
            return {
              ...base,
              correctAnswer: q.correctAnswer,
            };

          case 'matching':
            return {
              ...base,
              pairs: q.pairs.map(p => ({ left: p.left, right: p.right })),
            };

          case 'ordering':
            return {
              ...base,
              items: q.items.map(item => ({ text: item.text })),
            };

          case 'fill_blanks':
            return base; // пропуски парсятся из description на сервере

          default:
            return base;
        }
      });
      formData.append('questions', JSON.stringify(questionsData));

      // Изображения вопросов (опционально)
      questions.value.forEach((q, idx) => {
        if (q.imageFile) {
          formData.append(`questionImage_${idx}`, q.imageFile);
        }
      });

      await httpClient.post(API_ROUTES.teacher.createTest(teacherId.value), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Тест успешно опубликован!');
      router.back();
    } catch (err) {
      console.error('Ошибка публикации теста:', err);
      toast.error('Ошибка при публикации: ' + (err.response?.data?.message || err.message));
    } finally {
      loading.value = false;
    }
  }

  // ============ ПРЕВЬЮ ПРОПУСКОВ (fill_blanks) ============
  const getFillBlanksPreview = computed(() => {
    return (description) => {
      if (!description) return '';
      return description.replace(/\{([^}]+)\}/g, '<span class="blank-preview">$1</span>');
    };
  });

  // ============ ИНИЦИАЛИЗАЦИЯ ============
  onMounted(loadInitialData);

  return {
    // состояние формы
    testTitle,
    testDescription,
    beginningDate,
    endDate,
    testTime,
    selectedSubjectId,
    selectedGroupIds,
    isGroupDropdownOpen,
    shuffleQuestions,
    // обложка
    testCoverImage,
    testCoverImagePreview,
    // вопросы
    questions,
    // данные сервера
    availableSubjects,
    availableGroups,
    loading,
    // константы
    QUESTION_TYPES,
    // методы
    addQuestion,
    removeQuestion,
    changeQuestionType,
    addAnswer,
    removeAnswer,
    addPair,
    removePair,
    addOrderItem,
    removeOrderItem,
    moveOrderItem,
    onQuestionImageSelected,
    removeQuestionImage,
    onCoverSelected,
    removeCover,
    toggleGroupSelection,
    publishTest,
    getFillBlanksPreview,
  };
}
