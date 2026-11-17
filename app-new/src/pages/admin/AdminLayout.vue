<template>
  <!-- Лейаут администратора: навигация + вложенные страницы -->
  <div class="admin-layout">
    <!-- Боковая навигация -->
    <aside class="admin-sidebar">
      <div class="admin-sidebar__logo">
        <span class="admin-sidebar__logo-text">Админ</span>
      </div>

      <nav class="admin-nav">
        <RouterLink
          :to="`/admin/${adminId}/teachers`"
          class="admin-nav__link"
          active-class="admin-nav__link--active"
        >
          <span>Преподаватели</span>
        </RouterLink>

        <RouterLink
          :to="`/admin/${adminId}/groups`"
          class="admin-nav__link"
          active-class="admin-nav__link--active"
        >
          <span>Группы и студенты</span>
        </RouterLink>
      </nav>

      <!-- Карточка кода организации -->
      <div class="org-code-card" v-if="organization">
        <p class="org-code-card__label">Код организации</p>
        <p class="org-code-card__name">{{ organization.name }}</p>
        <div class="org-code-card__row">
          <span class="org-code-card__code">{{ organization.code }}</span>
          <button
            class="org-code-card__copy"
            @click="copyCode"
            :title="copied ? 'Скопировано!' : 'Скопировать'"
          >
            <span v-if="copied">✓</span>
            <span v-else>⧉</span>
          </button>
        </div>
        <p class="org-code-card__hint">
          Поделитесь этим кодом с преподавателями и студентами для регистрации
        </p>
      </div>
      <div class="org-code-card org-code-card--loading" v-else-if="orgLoading">
        <p class="org-code-card__label">Загрузка...</p>
      </div>
    </aside>

    <!-- Основное содержимое -->
    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';

const route = useRoute();
const authStore = useAuthStore();

const adminId = computed(() => route.params.id);

const organization = ref(null);
const orgLoading = ref(false);
const copied = ref(false);

onMounted(async () => {
  if (!adminId.value) return;
  orgLoading.value = true;
  try {
    const res = await httpClient.get(API_ROUTES.admin.organization(adminId.value));
    organization.value = res.data.data.organization;
  } catch (e) {
    console.error('Ошибка загрузки организации', e);
  } finally {
    orgLoading.value = false;
  }
});

async function copyCode() {
  if (!organization.value?.code) return;
  try {
    await navigator.clipboard.writeText(organization.value.code);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // fallback
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

/* ===== SIDEBAR ===== */
.admin-sidebar {
  width: 240px;
  min-height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
}

.admin-sidebar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 24px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 20px;
}

.admin-sidebar__logo-text {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: #111827;
}

/* ===== НАВИГАЦИЯ ===== */
.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.admin-nav__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.15s;
}

.admin-nav__link:hover {
  background: #f9fafb;
  color: #374151;
}

.admin-nav__link--active {
  background: #eff6ff;
  color: #2563eb;
}

/* ===== ОРГ КОД КАРТОЧКА ===== */
.org-code-card {
  margin-top: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  padding: 16px;
  color: white;
}

.org-code-card--loading {
  background: #f3f4f6;
  color: #9ca3af;
}

.org-code-card__label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
  margin: 0 0 4px;
}

.org-code-card__name {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 10px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-code-card__row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
}

.org-code-card__code {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.12em;
  font-family: 'Montserrat', monospace;
  flex: 1;
}

.org-code-card__copy {
  background: rgba(255,255,255,0.25);
  border: none;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}

.org-code-card__copy:hover {
  background: rgba(255,255,255,0.4);
}

.org-code-card__hint {
  font-size: 10px;
  opacity: 0.75;
  margin: 0;
  line-height: 1.4;
}

/* ===== MAIN CONTENT ===== */
.admin-main {
  flex: 1;
  overflow-x: hidden;
}
</style>
