<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import UiLoader from '@/shared/ui/UiLoader.vue';

const route = useRoute();
const authStore = useAuthStore();
const studentId = computed(() => route.params.id);

const currentDate = ref(new Date());
const journal = ref([]);
const isLoading = ref(false);

// Выбранная оценка для попапа
const selectedGrade = ref(null);

const currentMonth = computed(() => currentDate.value.getMonth() + 1);
const currentYear = computed(() => currentDate.value.getFullYear());

const monthDisplay = computed(() =>
  currentDate.value.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
);

// Колонки дат (дни текущего месяца)
const SHORT_DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const dateColumns = computed(() => {
  const daysInMonth = new Date(currentYear.value, currentMonth.value, 0).getDate();
  const cols = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, day);
    cols.push({
      day,
      date: date.toISOString().split('T')[0],
      dayName: SHORT_DAYS[date.getDay()],
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }
  return cols;
});

async function loadJournal() {
  isLoading.value = true;
  try {
    const res = await httpClient.get(API_ROUTES.student.journal(studentId.value), {
      params: { month: currentMonth.value, year: currentYear.value },
    });
    journal.value = res.data.data.journal;
  } catch (err) {
    console.error('Ошибка загрузки дневника:', err);
    journal.value = [];
  } finally {
    isLoading.value = false;
  }
}

function prevMonth() {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() - 1);
  currentDate.value = d;
  loadJournal();
}

function nextMonth() {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + 1);
  currentDate.value = d;
  loadJournal();
}

function getGradeData(subject, dateKey) {
  return subject.grades[dateKey] || null;
}

function getDisplayValue(gradeData) {
  if (!gradeData) return '';
  const val = gradeData.grade;
  if (val === -1) return 'Н';
  if (val === -2) return 'Б';
  if (val === -3) return 'У';
  return val;
}

function isCritical(gradeData) {
  if (!gradeData) return false;
  return gradeData.grade === -1 || gradeData.grade === 2;
}

function isTestGrade(gradeData) {
  return gradeData && !!gradeData.testId;
}

function getGradeClass(gradeData) {
  if (!gradeData) return '';
  const g = gradeData.grade;
  if (g >= 4) return 'grade--good';
  if (g === 3) return 'grade--ok';
  if (g <= 2 && g > 0) return 'grade--bad';
  if (g < 0) return 'grade--special';
  return '';
}

function getBadgeClass(grade) {
  if (grade >= 4) return 'badge--good';
  if (grade === 3) return 'badge--ok';
  if (grade <= 2 && grade > 0) return 'badge--bad';
  return '';
}

function getPercentage(grade) {
  if (grade === 5) return '90–100%';
  if (grade === 4) return '75–89%';
  if (grade === 3) return '50–74%';
  if (grade === 2) return '0–49%';
  return '—';
}

function openGradePopup(gradeData, dateKey) {
  if (!gradeData || !gradeData.testId) return;
  selectedGrade.value = { ...gradeData, dateKey };
}

function closePopup() {
  selectedGrade.value = null;
}

function formatDate(dateKey) {
  if (!dateKey) return '—';
  const d = new Date(dateKey);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

onMounted(() => {
  loadJournal();
});
</script>

<template>
  <div class="journal-page">
    <!-- Заголовок -->
    <div class="journal-page__header">
      <h1 class="heading-h2">Дневник</h1>
      <span class="body-b3" style="color: var(--foreground-muted)">
        Оценки по предметам
      </span>
    </div>

    <!-- Навигация по месяцам -->
    <div class="journal-nav">
      <button class="journal-nav__btn" @click="prevMonth">&#8249;</button>
      <span class="journal-nav__month body-b1">{{ monthDisplay }}</span>
      <button class="journal-nav__btn" @click="nextMonth">&#8250;</button>
    </div>

    <!-- Лоадер -->
    <UiLoader v-if="isLoading" />

    <!-- Пустое состояние — только если вообще нет предметов (студент не в группе) -->
    <div v-else-if="!isLoading && journal.length === 0" class="journal-empty">
      <div class="journal-empty__icon">📋</div>
      <h3 class="heading-h3">Нет данных</h3>
      <p class="body-b3" style="color: var(--foreground-muted)">
        Вы ещё не добавлены ни в одну группу или предметы не назначены
      </p>
    </div>

    <!-- Таблица дневника -->
    <div v-else class="journal-wrapper">
      <div class="table-scroll">
        <table class="journal-table">
          <thead>
            <tr>
              <th class="col-subject sticky-col">Предмет</th>
              <th
                v-for="col in dateColumns"
                :key="col.date"
                class="col-date"
                :class="{ 'col-date--weekend': col.isWeekend }"
              >
                <div class="date-header">
                  <span class="day-num">{{ col.day }}</span>
                  <span class="day-name">{{ col.dayName }}</span>
                </div>
              </th>
              <th class="col-avg">Ср. балл</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subject in journal" :key="subject.subjectId" class="journal-row">
              <td class="col-subject sticky-col">
                <span class="subject-name body-b3">{{ subject.subjectTitle }}</span>
              </td>
              <td
                v-for="col in dateColumns"
                :key="col.date"
                class="cell-td"
                :class="{ 'cell-td--weekend': col.isWeekend }"
              >
                <div
                  v-if="getGradeData(subject, col.date)"
                  class="grade-cell"
                  :class="[
                    getGradeClass(getGradeData(subject, col.date)),
                    { 'grade-cell--test': isTestGrade(getGradeData(subject, col.date)),
                      'grade-cell--critical': isCritical(getGradeData(subject, col.date)) }
                  ]"
                  @click="openGradePopup(getGradeData(subject, col.date), col.date)"
                >
                  {{ getDisplayValue(getGradeData(subject, col.date)) }}
                </div>
                <div v-else class="grade-cell grade-cell--empty"></div>
              </td>
              <td class="col-avg">
                <span
                  v-if="subject.average != null"
                  class="avg-value"
                  :class="{
                    'avg-value--good': subject.average >= 4,
                    'avg-value--bad': subject.average > 0 && subject.average < 3
                  }"
                >
                  {{ subject.average }}
                </span>
                <span v-else class="avg-value avg-value--none">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Попап с информацией о тесте -->
    <Teleport to="body">
      <div
        v-if="selectedGrade"
        class="popup-overlay"
        @click.self="closePopup"
      >
        <div class="test-popup">
          <!-- Шапка попапа -->
          <div class="test-popup__header">
            <h4 class="test-popup__title heading-h4">{{ selectedGrade.testTitle || 'Тест' }}</h4>
            <button class="test-popup__close" @click="closePopup">&times;</button>
          </div>

          <!-- Тело попапа -->
          <div class="test-popup__body">
            <!-- Оценка -->
            <div class="popup-row">
              <span class="popup-row__label body-b3">Оценка</span>
              <span
                class="grade-badge"
                :class="getBadgeClass(selectedGrade.grade)"
              >
                {{ selectedGrade.grade }}
              </span>
            </div>

            <!-- Процент -->
            <div class="popup-row">
              <span class="popup-row__label body-b3">Результат</span>
              <span class="popup-row__value body-b3">{{ getPercentage(selectedGrade.grade) }}</span>
            </div>

            <!-- Дата -->
            <div class="popup-row">
              <span class="popup-row__label body-b3">Дата сдачи</span>
              <span class="popup-row__value body-b3">{{ formatDate(selectedGrade.dateKey) }}</span>
            </div>

            <!-- Количество вопросов -->
            <div v-if="selectedGrade.totalQuestions" class="popup-row">
              <span class="popup-row__label body-b3">Вопросов в тесте</span>
              <span class="popup-row__value body-b3">{{ selectedGrade.totalQuestions }}</span>
            </div>
          </div>

          <!-- Кнопка закрытия -->
          <div class="test-popup__footer">
            <button class="btn-close-popup body-b3" @click="closePopup">Закрыть</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style src="@/assets/styles/roles/student/journal.css"></style>
