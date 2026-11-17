<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStudentTests } from '@/features/tests';
import { UiModal, UiButton, UiLoader } from '@/shared/ui';

const route = useRoute();
const router = useRouter();
const studentId = computed(() => route.params.id);

const { tests, loading, loadTests } = useStudentTests();

// Предпросмотр
const previewOpen = ref(false);
const previewTest = ref(null);

function openPreview(test) {
  previewTest.value = test;
  previewOpen.value = true;
}

function closePreview() {
  previewOpen.value = false;
  previewTest.value = null;
}

function startTest() {
  if (previewTest.value && !previewTest.value.completed) {
    router.push(`/student/${studentId.value}/tests/${previewTest.value.id}`);
  }
}

function formatTime(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  }
  return `${minutes} мин`;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function getCoverUrl(img) {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_BASE}${img}`;
}

onMounted(() => {
  loadTests(studentId.value);
});
</script>

<template>
  <div class="tests-page">
    <!-- Заголовок -->
    <div class="tests-page__header">
      <h1 class="heading-h2">Мои тесты</h1>
      <span class="body-b3" style="color: var(--foreground-muted)">
        {{ tests.length }} {{ tests.length === 1 ? 'тест' : 'тестов' }} доступно
      </span>
    </div>

    <!-- Загрузка -->
    <UiLoader v-if="loading" text="Загрузка тестов..." />

    <!-- Пустое состояние -->
    <div v-else-if="tests.length === 0" class="tests-empty">
      <div class="tests-empty__icon">📋</div>
      <p class="tests-empty__text">Нет назначенных тестов</p>
    </div>

    <!-- Сетка карточек -->
    <div v-else class="tests-grid">
      <div
        v-for="test in tests"
        :key="test.id"
        class="test-card"
        :class="{ 'test-card--completed': test.completed }"
        @click="openPreview(test)"
      >
        <img
          v-if="test.img"
          :src="getCoverUrl(test.img)"
          :alt="test.title"
          class="test-card__cover"
        />
        <div v-else class="test-card__cover" style="display: flex; align-items: center; justify-content: center; font-size: 48px;">
          📝
        </div>

        <div class="test-card__body">
          <span class="test-card__subject">{{ test.subject }}</span>
          <h3 class="test-card__title">{{ test.title }}</h3>
          <p v-if="test.description" class="test-card__desc">{{ test.description }}</p>
        </div>

        <div class="test-card__footer">
          <div class="test-card__meta">
            <span class="test-card__meta-item">❓ {{ test.questionCount }} вопр.</span>
            <span class="test-card__meta-item">⏱ {{ formatTime(test.time) }}</span>
          </div>
          <span
            class="test-card__badge"
            :class="test.completed ? 'test-card__badge--completed' : 'test-card__badge--pending'"
          >
            {{ test.completed ? `Оценка: ${test.grade}` : 'Не пройден' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Модальное окно предпросмотра -->
    <UiModal v-model="previewOpen" :title="previewTest?.title || ''" size="md" @close="closePreview">
      <template v-if="previewTest">
        <img
          v-if="previewTest.img"
          :src="getCoverUrl(previewTest.img)"
          :alt="previewTest.title"
          class="preview-cover"
        />

        <div class="preview-info">
          <div class="preview-info__row">
            <span class="preview-info__label">Предмет</span>
            <span class="preview-info__value">{{ previewTest.subject }}</span>
          </div>
          <div class="preview-info__row">
            <span class="preview-info__label">Преподаватель</span>
            <span class="preview-info__value">{{ previewTest.teacher }}</span>
          </div>
          <div class="preview-info__row">
            <span class="preview-info__label">Количество вопросов</span>
            <span class="preview-info__value">{{ previewTest.questionCount }}</span>
          </div>
          <div class="preview-info__row">
            <span class="preview-info__label">Время на выполнение</span>
            <span class="preview-info__value">{{ formatTime(previewTest.time) }}</span>
          </div>
        </div>

        <p v-if="previewTest.description" class="preview-desc">
          {{ previewTest.description }}
        </p>
      </template>

      <template #footer>
        <UiButton variant="ghost" @click="closePreview">Закрыть</UiButton>
        <UiButton
          v-if="previewTest && !previewTest.completed"
          variant="primary"
          @click="startTest"
        >
          Начать тест
        </UiButton>
        <UiButton v-else variant="secondary" disabled>
          Тест пройден
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style src="@/assets/styles/roles/student/tests.css"></style>
