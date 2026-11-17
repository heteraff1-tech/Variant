import { ref, computed, onUnmounted, watch } from 'vue';

/**
 * Движок прохождения теста:
 * - Навигация по вопросам (свободная)
 * - Хранение ответов (single/multiple/open/matching/ordering/fill_blanks)
 * - Таймер обратного отсчёта
 * - Анти-чит (отслеживание tab-switch)
 */
export function useQuizEngine(options = {}) {
  const { onTimeUp, onAutoFinish } = options;

  // ===== Состояние вопросов =====
  const questions = ref([]);
  const currentIndex = ref(0);
  const answers = ref({}); // { [questionId]: { type, ...data } }
  const isStarted = ref(false);
  const isFinished = ref(false);

  // ===== Таймер =====
  const totalSeconds = ref(0);
  const remainingSeconds = ref(0);
  let timerInterval = null;

  // ===== Анти-чит =====
  const tabSwitchCount = ref(0);
  const maxTabSwitches = 3;
  const showTabWarning = ref(false);
  let tabWarningTimeout = null;

  // ===== Computed =====
  const currentQuestion = computed(() => questions.value[currentIndex.value] || null);

  const totalQuestions = computed(() => questions.value.length);

  const answeredCount = computed(() => {
    return Object.keys(answers.value).filter((qId) => isQuestionAnswered(Number(qId))).length;
  });

  const remainingWarnings = computed(() => maxTabSwitches - tabSwitchCount.value);

  const timerDisplay = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  const timerState = computed(() => {
    const pct = (remainingSeconds.value / totalSeconds.value) * 100;
    if (pct <= 10) return 'danger';
    if (pct <= 25) return 'warning';
    return 'normal';
  });

  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0;
    return Math.round((answeredCount.value / totalQuestions.value) * 100);
  });

  // ===== Инициализация =====
  function init(testQuestions, timeMinutes) {
    questions.value = testQuestions;
    totalSeconds.value = timeMinutes * 60;
    remainingSeconds.value = timeMinutes * 60;
    currentIndex.value = 0;
    answers.value = {};
    isStarted.value = false;
    isFinished.value = false;
    tabSwitchCount.value = 0;
    showTabWarning.value = false;
  }

  // ===== Старт =====
  function start() {
    if (isStarted.value) return;
    isStarted.value = true;

    // Включаем таймер
    timerInterval = setInterval(() => {
      remainingSeconds.value--;
      if (remainingSeconds.value <= 0) {
        remainingSeconds.value = 0;
        clearInterval(timerInterval);
        timerInterval = null;
        // Время вышло
        if (onTimeUp) onTimeUp();
      }
    }, 1000);

    // Слушаем переключение вкладок
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Блокируем copy/paste/contextmenu
    document.addEventListener('copy', preventEvent);
    document.addEventListener('cut', preventEvent);
    document.addEventListener('contextmenu', preventEvent);
  }

  // ===== Навигация =====
  function goToQuestion(index) {
    if (index >= 0 && index < questions.value.length) {
      currentIndex.value = index;
    }
  }

  function nextQuestion() {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++;
    }
  }

  function prevQuestion() {
    if (currentIndex.value > 0) {
      currentIndex.value--;
    }
  }

  // ===== Ответы: single/multiple choice =====
  function selectAnswer(questionId, answerId, isMultiple = false) {
    if (isFinished.value) return;

    if (isMultiple) {
      // Множественный выбор — toggle
      const current = (answers.value[questionId]?.answerIds) || [];
      const idx = current.indexOf(answerId);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(answerId);
      }
      answers.value[questionId] = { type: 'choice', answerIds: [...current] };
    } else {
      // Одиночный выбор — замена
      answers.value[questionId] = { type: 'choice', answerIds: [answerId] };
    }
    // Триггерим реактивность
    answers.value = { ...answers.value };
  }

  function isAnswerSelected(questionId, answerId) {
    const data = answers.value[questionId];
    if (!data || !data.answerIds) return false;
    return data.answerIds.includes(answerId);
  }

  // ===== Ответы: open_answer =====
  function setOpenAnswer(questionId, text) {
    if (isFinished.value) return;
    answers.value[questionId] = { type: 'open_answer', openAnswer: text };
    answers.value = { ...answers.value };
  }

  function getOpenAnswer(questionId) {
    return answers.value[questionId]?.openAnswer || '';
  }

  // ===== Ответы: matching =====
  function setMatchPair(questionId, leftId, rightId) {
    if (isFinished.value) return;
    const data = answers.value[questionId] || { type: 'matching', matchPairs: [] };
    data.type = 'matching';
    if (!data.matchPairs) data.matchPairs = [];

    // Обновляем или добавляем пару для данного leftId
    const existing = data.matchPairs.find((p) => p.leftId === leftId);
    if (existing) {
      existing.rightId = rightId;
    } else {
      data.matchPairs.push({ leftId, rightId });
    }

    answers.value[questionId] = { ...data, matchPairs: [...data.matchPairs] };
    answers.value = { ...answers.value };
  }

  function getMatchPairs(questionId) {
    return answers.value[questionId]?.matchPairs || [];
  }

  function getMatchRight(questionId, leftId) {
    const pairs = getMatchPairs(questionId);
    const pair = pairs.find((p) => p.leftId === leftId);
    return pair?.rightId || null;
  }

  // ===== Ответы: ordering =====
  function setOrdering(questionId, orderedIds) {
    if (isFinished.value) return;
    answers.value[questionId] = { type: 'ordering', orderedIds: [...orderedIds] };
    answers.value = { ...answers.value };
  }

  function getOrdering(questionId) {
    return answers.value[questionId]?.orderedIds || [];
  }

  function moveOrderingItem(questionId, fromIdx, toIdx) {
    if (isFinished.value) return;
    const question = questions.value.find((q) => q.id === questionId);
    if (!question) return;

    // Если еще не начато — инициализируем текущим порядком
    let currentOrder = getOrdering(questionId);
    if (currentOrder.length === 0) {
      currentOrder = question.items.map((item) => item.id);
    }

    if (toIdx < 0 || toIdx >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);

    setOrdering(questionId, newOrder);
  }

  // ===== Ответы: fill_blanks =====
  function setBlankAnswer(questionId, blankIndex, text) {
    if (isFinished.value) return;
    const data = answers.value[questionId] || { type: 'fill_blanks', blanks: [] };
    data.type = 'fill_blanks';
    if (!data.blanks) data.blanks = [];
    data.blanks[blankIndex] = text;

    answers.value[questionId] = { ...data, blanks: [...data.blanks] };
    answers.value = { ...answers.value };
  }

  function getBlankAnswer(questionId, blankIndex) {
    return answers.value[questionId]?.blanks?.[blankIndex] || '';
  }

  // ===== Проверка: ответил ли на вопрос =====
  function isQuestionAnswered(questionId) {
    const data = answers.value[questionId];
    if (!data) return false;

    switch (data.type) {
      case 'choice':
        return data.answerIds && data.answerIds.length > 0;
      case 'open_answer':
        return data.openAnswer && data.openAnswer.trim().length > 0;
      case 'matching':
        return data.matchPairs && data.matchPairs.length > 0;
      case 'ordering':
        return data.orderedIds && data.orderedIds.length > 0;
      case 'fill_blanks':
        return data.blanks && data.blanks.some((b) => b && b.trim().length > 0);
      default:
        return false;
    }
  }

  // ===== Подготовка к отправке =====
  function getSubmissionData() {
    return questions.value.map((q) => {
      const data = answers.value[q.id];
      const base = { questionId: q.id };

      if (!data) {
        // Не отвечено — отправляем пустое
        return { ...base, answerIds: [] };
      }

      switch (data.type) {
        case 'choice':
          return { ...base, answerIds: data.answerIds || [] };
        case 'open_answer':
          return { ...base, openAnswer: data.openAnswer || '' };
        case 'matching':
          return { ...base, matchPairs: data.matchPairs || [] };
        case 'ordering':
          return { ...base, orderedIds: data.orderedIds || [] };
        case 'fill_blanks':
          return { ...base, blanks: data.blanks || [] };
        default:
          return { ...base, answerIds: [] };
      }
    });
  }

  // ===== Завершение =====
  function finish() {
    isFinished.value = true;
    cleanup();
  }

  // ===== Анти-чит =====
  function handleVisibilityChange() {
    if (document.hidden && isStarted.value && !isFinished.value) {
      tabSwitchCount.value++;
      showTabWarning.value = true;

      // Скрываем предупреждение через 5 секунд
      if (tabWarningTimeout) clearTimeout(tabWarningTimeout);
      tabWarningTimeout = setTimeout(() => {
        showTabWarning.value = false;
      }, 5000);

      // На 4-м переключении — автозавершение
      if (tabSwitchCount.value >= maxTabSwitches + 1) {
        if (onAutoFinish) onAutoFinish();
      }
    }
  }

  function preventEvent(e) {
    e.preventDefault();
  }

  // ===== Очистка =====
  function cleanup() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (tabWarningTimeout) {
      clearTimeout(tabWarningTimeout);
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('copy', preventEvent);
    document.removeEventListener('cut', preventEvent);
    document.removeEventListener('contextmenu', preventEvent);
  }

  onUnmounted(() => {
    cleanup();
  });

  return {
    // State
    questions,
    currentIndex,
    answers,
    isStarted,
    isFinished,
    tabSwitchCount,
    showTabWarning,
    remainingWarnings,

    // Computed
    currentQuestion,
    totalQuestions,
    answeredCount,
    timerDisplay,
    timerState,
    remainingSeconds,
    progress,

    // Methods — navigation
    init,
    start,
    goToQuestion,
    nextQuestion,
    prevQuestion,

    // Methods — choice
    selectAnswer,
    isAnswerSelected,

    // Methods — open answer
    setOpenAnswer,
    getOpenAnswer,

    // Methods — matching
    setMatchPair,
    getMatchPairs,
    getMatchRight,

    // Methods — ordering
    setOrdering,
    getOrdering,
    moveOrderingItem,

    // Methods — fill blanks
    setBlankAnswer,
    getBlankAnswer,

    // Methods — general
    isQuestionAnswered,
    getSubmissionData,
    finish,
    cleanup,
  };
}
