<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStudentTests } from '@/features/tests';
import { useQuizEngine } from '@/features/tests';
import { UiButton, UiLoader } from '@/shared/ui';

const route = useRoute();
const router = useRouter();
const studentId = computed(() => route.params.id);
const testId = computed(() => route.params.testId);

const { currentTest, loading, loadTest, submitTest } = useStudentTests();

// Состояние страницы: 'loading' | 'ready' | 'quiz' | 'timeup' | 'submitting' | 'result'
const pageState = ref('loading');
const testResult = ref(null);
const submitError = ref(null);

// Quiz Engine
const engine = useQuizEngine({
  onTimeUp: handleTimeUp,
  onAutoFinish: handleAutoFinish,
});

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function getImageUrl(img) {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_BASE}${img}`;
}

// ===== ЗАГРУЗКА =====
onMounted(async () => {
  try {
    const test = await loadTest(studentId.value, testId.value);
    engine.init(test.questions, test.time);
    pageState.value = 'ready';
  } catch (err) {
    // Если тест уже пройден или ошибка — вернуться к списку
    setTimeout(() => {
      router.push(`/student/${studentId.value}/tests`);
    }, 2000);
  }
});

// ===== СТАРТ ТЕСТА =====
function handleStart() {
  engine.start();
  // Инициализируем ordering вопросы текущим порядком
  engine.questions.value.forEach((q) => {
    if (q.question_type === 'ordering' && q.items) {
      engine.setOrdering(q.id, q.items.map((item) => item.id));
    }
  });
  pageState.value = 'quiz';
}

// ===== ВЫБОР ОТВЕТА (single/multiple) =====
function handleSelectAnswer(questionId, answerId) {
  const question = engine.currentQuestion.value;
  const isMultiple = question?.question_type === 'multiple_choice';
  engine.selectAnswer(questionId, answerId, isMultiple);
}

// ===== ОТПРАВКА =====
async function handleSubmit() {
  if (pageState.value === 'submitting') return;
  pageState.value = 'submitting';

  try {
    const data = engine.getSubmissionData();
    engine.finish();
    const result = await submitTest(studentId.value, testId.value, data);
    testResult.value = result;
    pageState.value = 'result';
  } catch (err) {
    submitError.value = 'Ошибка отправки. Попробуйте ещё раз.';
    pageState.value = 'quiz';
  }
}

// ===== ВРЕМЯ ВЫШЛО =====
function handleTimeUp() {
  pageState.value = 'timeup';
}

function handleTimeUpSubmit() {
  pageState.value = 'submitting';
  const data = engine.getSubmissionData();
  engine.finish();

  submitTest(studentId.value, testId.value, data)
    .then((result) => {
      testResult.value = result;
      pageState.value = 'result';
    })
    .catch(() => {
      submitError.value = 'Ошибка отправки';
      pageState.value = 'result';
    });
}

// ===== АВТОЗАВЕРШЕНИЕ (4-е переключение) =====
function handleAutoFinish() {
  pageState.value = 'submitting';
  const data = engine.getSubmissionData();
  engine.finish();

  submitTest(studentId.value, testId.value, data)
    .then((result) => {
      testResult.value = result;
      pageState.value = 'result';
    })
    .catch(() => {
      pageState.value = 'result';
    });
}

// ===== ВЕРНУТЬСЯ К СПИСКУ =====
function goBack() {
  router.push(`/student/${studentId.value}/tests`);
}

// ===== ОЦЕНКА LABEL =====
function getGradeLabel(grade) {
  const labels = { 5: 'Отлично', 4: 'Хорошо', 3: 'Удовлетворительно', 2: 'Неудовлетворительно' };
  return labels[grade] || '';
}

// Буквы для маркеров ответов
const LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ';

// ===== FILL BLANKS: парсинг текста с пропусками =====
function parseFillBlanks(text) {
  // Разбиваем текст по {blank_N} на массив сегментов
  const parts = [];
  const regex = /\{blank_(\d+)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Текст до пропуска
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'blank', index: parseInt(match[1]) });
    lastIndex = match.index + match[0].length;
  }
  // Текст после последнего пропуска
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

// ===== ORDERING: перемещение элемента =====
function handleMoveOrdering(questionId, fromIdx, direction) {
  engine.moveOrderingItem(questionId, fromIdx, fromIdx + direction);
}

// ===== MATCHING: получить выбранное значение для правой стороны =====
function getSelectedRightText(questionId, leftId) {
  const rightId = engine.getMatchRight(questionId, leftId);
  if (!rightId) return null;
  const question = engine.currentQuestion.value;
  const rightItem = question.rightSide.find((r) => r.id === rightId);
  return rightItem?.text || null;
}

// ===== Подсказка типа вопроса =====
function getQuestionTypeHint(type) {
  const hints = {
    single_choice: 'Выберите один вариант ответа',
    multiple_choice: 'Выберите несколько вариантов ответа',
    open_answer: 'Введите ваш ответ',
    matching: 'Установите соответствие между элементами',
    ordering: 'Расставьте элементы в правильном порядке',
    fill_blanks: 'Заполните пропуски',
  };
  return hints[type] || '';
}
</script>

<template>
  <div class="quiz-workspace">
    <!-- ЗАГРУЗКА -->
    <UiLoader v-if="pageState === 'loading'" text="Загрузка теста..." />

    <!-- ГОТОВНОСТЬ (до старта) -->
    <div v-else-if="pageState === 'ready'" class="result-screen">
      <div class="result-card">
        <h2 class="result-card__label">{{ currentTest?.title }}</h2>
        <div class="preview-info" style="text-align: left; margin-bottom: 24px;">
          <div class="preview-info__row">
            <span class="preview-info__label">Предмет</span>
            <span class="preview-info__value">{{ currentTest?.subject }}</span>
          </div>
          <div class="preview-info__row">
            <span class="preview-info__label">Вопросов</span>
            <span class="preview-info__value">{{ currentTest?.questions?.length || 0 }}</span>
          </div>
          <div class="preview-info__row">
            <span class="preview-info__label">Время</span>
            <span class="preview-info__value">{{ currentTest?.time }} мин</span>
          </div>
        </div>
        <UiButton variant="primary" size="lg" @click="handleStart">
          Начать тест
        </UiButton>
      </div>
    </div>

    <!-- РАБОЧАЯ ОБЛАСТЬ ТЕСТА -->
    <template v-else-if="pageState === 'quiz' || pageState === 'submitting'">
      <!-- Заголовок + таймер -->
      <div class="quiz-header">
        <h2 class="quiz-header__title">{{ currentTest?.title }}</h2>
        <div class="quiz-header__right">
          <span
            class="quiz-timer"
            :class="`quiz-timer--${engine.timerState.value}`"
          >
            {{ engine.timerDisplay.value }}
          </span>
        </div>
      </div>

      <!-- Предупреждение анти-чит -->
      <div v-if="engine.showTabWarning.value" class="anticheat-warn">
        <span class="anticheat-warn__text">
          Обнаружено переключение вкладки! Не покидайте страницу теста.
        </span>
        <span class="anticheat-warn__count">
          Осталось попыток: {{ engine.remainingWarnings.value }}
        </span>
      </div>

      <!-- Навигация по вопросам -->
      <div class="quiz-nav">
        <button
          v-for="(q, idx) in engine.questions.value"
          :key="q.id"
          class="quiz-nav__btn"
          :class="{
            'quiz-nav__btn--active': idx === engine.currentIndex.value,
            'quiz-nav__btn--answered': engine.isQuestionAnswered(q.id),
          }"
          @click="engine.goToQuestion(idx)"
        >
          {{ idx + 1 }}
        </button>
      </div>

      <!-- Текущий вопрос -->
      <div v-if="engine.currentQuestion.value" class="quiz-question">
        <div class="quiz-question__number">
          Вопрос {{ engine.currentIndex.value + 1 }} из {{ engine.totalQuestions.value }}
        </div>
        <div class="quiz-question__type-hint">
          {{ getQuestionTypeHint(engine.currentQuestion.value.question_type) }}
        </div>

        <!-- Текст вопроса (кроме fill_blanks, у которого свой рендер) -->
        <p
          v-if="engine.currentQuestion.value.question_type !== 'fill_blanks'"
          class="quiz-question__text"
        >
          {{ engine.currentQuestion.value.description }}
        </p>

        <!-- Изображение вопроса -->
        <img
          v-if="engine.currentQuestion.value.img"
          :src="getImageUrl(engine.currentQuestion.value.img)"
          alt="Изображение к вопросу"
          class="quiz-question__img"
        />

        <!-- ========== SINGLE/MULTIPLE CHOICE ========== -->
        <div
          v-if="engine.currentQuestion.value.question_type === 'single_choice' || engine.currentQuestion.value.question_type === 'multiple_choice'"
          class="quiz-answers"
        >
          <div
            v-for="(answer, aIdx) in engine.currentQuestion.value.answers"
            :key="answer.id"
            class="quiz-answer"
            :class="{ 'quiz-answer--selected': engine.isAnswerSelected(engine.currentQuestion.value.id, answer.id) }"
            @click="handleSelectAnswer(engine.currentQuestion.value.id, answer.id)"
          >
            <!-- Маркер: круг для single, чекбокс для multiple -->
            <span
              v-if="engine.currentQuestion.value.question_type !== 'multiple_choice'"
              class="quiz-answer__marker"
            >
              {{ LETTERS[aIdx] || aIdx + 1 }}
            </span>
            <span v-else class="quiz-answer__check">
              <template v-if="engine.isAnswerSelected(engine.currentQuestion.value.id, answer.id)">&#10003;</template>
            </span>

            <span class="quiz-answer__text">{{ answer.text }}</span>
          </div>
        </div>

        <!-- ========== OPEN ANSWER ========== -->
        <div
          v-if="engine.currentQuestion.value.question_type === 'open_answer'"
          class="quiz-open-answer"
        >
          <textarea
            class="quiz-open-answer__input"
            placeholder="Введите ваш ответ..."
            :value="engine.getOpenAnswer(engine.currentQuestion.value.id)"
            @input="engine.setOpenAnswer(engine.currentQuestion.value.id, $event.target.value)"
            rows="4"
          ></textarea>
        </div>

        <!-- ========== MATCHING ========== -->
        <div
          v-if="engine.currentQuestion.value.question_type === 'matching'"
          class="quiz-matching"
        >
          <div class="quiz-matching__header">
            <span class="quiz-matching__col-title">Элемент</span>
            <span class="quiz-matching__col-title">Соответствие</span>
          </div>
          <div
            v-for="left in engine.currentQuestion.value.leftSide"
            :key="left.id"
            class="quiz-matching__row"
          >
            <div class="quiz-matching__left">{{ left.text }}</div>
            <div class="quiz-matching__arrow">&#8594;</div>
            <select
              class="quiz-matching__select"
              :value="engine.getMatchRight(engine.currentQuestion.value.id, left.id) || ''"
              @change="engine.setMatchPair(engine.currentQuestion.value.id, left.id, Number($event.target.value))"
            >
              <option value="" disabled>Выберите...</option>
              <option
                v-for="right in engine.currentQuestion.value.rightSide"
                :key="right.id"
                :value="right.id"
              >
                {{ right.text }}
              </option>
            </select>
          </div>
        </div>

        <!-- ========== ORDERING ========== -->
        <div
          v-if="engine.currentQuestion.value.question_type === 'ordering'"
          class="quiz-ordering"
        >
          <div
            v-for="(itemId, idx) in (engine.getOrdering(engine.currentQuestion.value.id).length > 0
              ? engine.getOrdering(engine.currentQuestion.value.id)
              : engine.currentQuestion.value.items.map(i => i.id))"
            :key="itemId"
            class="quiz-ordering__item"
          >
            <span class="quiz-ordering__number">{{ idx + 1 }}</span>
            <span class="quiz-ordering__text">
              {{ engine.currentQuestion.value.items.find(i => i.id === itemId)?.text || '' }}
            </span>
            <div class="quiz-ordering__controls">
              <button
                class="quiz-ordering__btn"
                :disabled="idx === 0"
                @click="handleMoveOrdering(engine.currentQuestion.value.id, idx, -1)"
                type="button"
              >
                &#9650;
              </button>
              <button
                class="quiz-ordering__btn"
                :disabled="idx === engine.currentQuestion.value.items.length - 1"
                @click="handleMoveOrdering(engine.currentQuestion.value.id, idx, 1)"
                type="button"
              >
                &#9660;
              </button>
            </div>
          </div>
        </div>

        <!-- ========== FILL BLANKS ========== -->
        <div
          v-if="engine.currentQuestion.value.question_type === 'fill_blanks'"
          class="quiz-fill-blanks"
        >
          <div class="quiz-fill-blanks__content">
            <template
              v-for="(part, pIdx) in parseFillBlanks(engine.currentQuestion.value.description)"
              :key="pIdx"
            >
              <span v-if="part.type === 'text'" class="quiz-fill-blanks__text">{{ part.value }}</span>
              <input
                v-else
                class="quiz-fill-blanks__input"
                type="text"
                :placeholder="`Ответ ${part.index + 1}`"
                :value="engine.getBlankAnswer(engine.currentQuestion.value.id, part.index)"
                @input="engine.setBlankAnswer(engine.currentQuestion.value.id, part.index, $event.target.value)"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="quiz-actions">
        <div class="quiz-actions__nav">
          <UiButton
            variant="ghost"
            size="sm"
            :disabled="engine.currentIndex.value === 0"
            @click="engine.prevQuestion()"
          >
            Назад
          </UiButton>
          <UiButton
            variant="ghost"
            size="sm"
            :disabled="engine.currentIndex.value >= engine.totalQuestions.value - 1"
            @click="engine.nextQuestion()"
          >
            Вперёд
          </UiButton>
        </div>

        <UiButton
          variant="primary"
          :loading="pageState === 'submitting'"
          @click="handleSubmit"
        >
          Завершить тест ({{ engine.answeredCount.value }}/{{ engine.totalQuestions.value }})
        </UiButton>
      </div>
    </template>

    <!-- ВРЕМЯ ВЫШЛО — OVERLAY -->
    <div v-if="pageState === 'timeup'" class="time-up-overlay">
      <div class="time-up-card">
        <h2 class="time-up-card__title">Время вышло!</h2>
        <p class="time-up-card__text">
          Тест будет завершён автоматически. Неотвеченные вопросы будут засчитаны как неверные.
        </p>
        <UiButton variant="primary" size="lg" @click="handleTimeUpSubmit">
          Отправить результат
        </UiButton>
      </div>
    </div>

    <!-- РЕЗУЛЬТАТ -->
    <div v-else-if="pageState === 'result' && testResult" class="result-screen">
      <div class="result-card">
        <div class="result-card__grade" :class="`result-card__grade--${testResult.grade}`">
          {{ testResult.grade }}
        </div>
        <h2 class="result-card__label">{{ getGradeLabel(testResult.grade) }}</h2>

        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat__value">{{ testResult.percentage }}%</span>
            <span class="result-stat__label">Правильных</span>
          </div>
          <div class="result-stat">
            <span class="result-stat__value">{{ testResult.correctCount }}/{{ testResult.totalQuestions }}</span>
            <span class="result-stat__label">Ответов верно</span>
          </div>
        </div>

        <UiButton variant="primary" @click="goBack">
          Вернуться к тестам
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/styles/roles/student/tests.css"></style>
