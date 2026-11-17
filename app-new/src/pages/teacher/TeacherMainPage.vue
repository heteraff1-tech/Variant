<script setup>
import { ref, onMounted, computed } from 'vue';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';

const loading = ref(true);
const error = ref(null);
const dashboard = ref(null);
const activeTestsExpanded = ref(false);

async function loadDashboard() {
  try {
    loading.value = true;
    const response = await httpClient.get(API_ROUTES.teacher.dashboard);
    dashboard.value = response.data.data;
  } catch (err) {
    console.error('Ошибка загрузки дашборда', err);
    error.value = 'Не удалось загрузить данные';
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

onMounted(loadDashboard);
</script>

<template>
  <div class="dashboard-position">
    <div v-if="loading" class="dashboard-loading">
      <div class="loading-spinner"></div>
      <span class="body-b3">Загрузка...</span>
    </div>

    <div v-else-if="error" class="dashboard-error">
      <span class="body-b3">{{ error }}</span>
    </div>

    <div v-else-if="dashboard" class="dashboard-grid">

      <!-- Виджет: Организация -->
      <div class="widget widget--org">
        <div class="widget__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M9 8h1"/>
            <path d="M9 12h1"/>
            <path d="M9 16h1"/>
            <path d="M14 8h1"/>
            <path d="M14 12h1"/>
            <path d="M14 16h1"/>
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
          </svg>
          <span class="widget__label heading-h5">Организации</span>
        </div>
        <div class="widget__body">
          <div v-if="dashboard.organizations && dashboard.organizations.length > 0" class="org-list">
            <div
              v-for="org in dashboard.organizations"
              :key="org.id"
              class="org-chip"
            >
              <span class="body-b3">{{ org.name }}</span>
            </div>
          </div>
          <span v-else class="body-b3 muted">Не указаны</span>
        </div>
      </div>

      <!-- Виджет: Групп -->
      <div class="widget widget--stat">
        <div class="widget__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span class="widget__label heading-h5">Группы</span>
        </div>
        <div class="widget__body">
          <span class="stat-number heading-h2">{{ dashboard.groupsCount }}</span>
          <span class="body-b3 muted">Обучаются у вас</span>
        </div>
      </div>

      <!-- Виджет: Средняя оценка -->
      <div class="widget widget--stat">
        <div class="widget__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span class="widget__label heading-h5">Средняя оценка</span>
        </div>
        <div class="widget__body">
          <span class="stat-number heading-h2">
            {{ dashboard.averageGrade !== null ? dashboard.averageGrade : '—' }}
          </span>
          <span class="body-b3 muted">По всем предметам</span>
        </div>
      </div>

      <!-- Виджет: Активные тесты -->
      <div class="widget widget--active-tests">
        <div class="widget__header">
          <div class="widget__header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="widget__label heading-h5">Тестов сейчас</span>
          </div>
          <div class="widget__header-right">
            <span class="active-badge heading-h5">{{ dashboard.activeTestsCount }}</span>
            <button
              v-if="dashboard.activeTestsCount > 0"
              class="expand-btn"
              :class="{ 'expand-btn--open': activeTestsExpanded }"
              @click="activeTestsExpanded = !activeTestsExpanded"
              :title="activeTestsExpanded ? 'Свернуть' : 'Развернуть'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="activeTestsExpanded && dashboard.activeTests.length > 0" class="active-tests-list">
          <div
            v-for="test in dashboard.activeTests"
            :key="test.id"
            class="active-test-item"
          >
            <div class="active-test-item__dot"></div>
            <div class="active-test-item__info">
              <span class="body-b3 active-test-item__title">{{ test.title }}</span>
              <span class="description-d1 muted">до {{ formatDate(test.end_date) }}</span>
            </div>
          </div>
        </div>

        <div v-if="dashboard.activeTestsCount === 0" class="widget__body">
          <span class="body-b3 muted">Нет активных тестов</span>
        </div>
      </div>

      <!-- Виджет: Последние тесты -->
      <div class="widget widget--tests">
        <div class="widget__header widget__header--between">
          <div class="widget__header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span class="widget__label heading-h5">Созданные тесты</span>
          </div>
          <router-link class="link-a description-d1" to="./create-test">Создать тест</router-link>
        </div>

        <div class="widget__body widget__body--grow">
          <div v-if="dashboard.latestTests && dashboard.latestTests.length > 0" class="tests-table-wrap">
            <table class="tests-table">
              <thead>
                <tr>
                  <th class="heading-h5 tcell">Название</th>
                  <th class="heading-h5 tcell">Начало</th>
                  <th class="heading-h5 tcell">Конец</th>
                  <th class="heading-h5 tcell">Время</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="test in dashboard.latestTests" :key="test.id" class="trow">
                  <td class="body-b3 tcell">{{ test.title }}</td>
                  <td class="body-b3 tcell">{{ formatDate(test.beginning_date) }}</td>
                  <td class="body-b3 tcell">{{ formatDate(test.end_date) }}</td>
                  <td class="body-b3 tcell">{{ formatTime(test.time) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="body-b3 muted">Тесты ещё не созданы</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped src="@/assets/styles/roles/teacher/main.css"></style>