<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import InitTeacherModal from '@/features/teachers/ui/InitTeacherModal.vue';

const authStore = useAuthStore();
const route = useRoute();
const userId = computed(() => route.params.id);
const isInitOpen = ref(false);

// Проверяем, заполнил ли учитель информацию о себе
async function loadTeacherState() {
  try {
    const response = await httpClient.get(API_ROUTES.teacher.state);
    const stateData = response.data.data;

    if (!stateData.isInitialized) {
      isInitOpen.value = true;
    }
  } catch (err) {
    console.error('Ошибка загрузки состояния преподавателя', err);
  }
}

function onTeacherInitialized() {
  isInitOpen.value = false;
}

onMounted(async () => {
  await loadTeacherState();
});
</script>

<template>
  <div id="teacher-layout">
    <nav>
      <div class="info">
        <h5 class="heading-h4">{{ authStore.user?.login || 'Преподаватель' }}</h5>
        <span class="description-d1">Преподаватель</span>
      </div>
      <div class="menu">
        <router-link class="item" :to="`/teacher/${userId}`" exact>
          <span class="body-b2">Главная страница</span>
        </router-link>
        <router-link class="item" :to="`/teacher/${userId}/journal`">
          <span class="body-b2">Журнал</span>
        </router-link>
        <router-link class="item" :to="`/teacher/${userId}/create-test`">
          <span class="body-b2">Конструктор теста</span>
        </router-link>
      </div>
    </nav>
    <router-view />

    <!-- Модальное окно инициализации (показывается один раз) -->
    <InitTeacherModal v-if="isInitOpen" @saved="onTeacherInitialized" />
  </div>
</template>

<style scoped src="@/assets/styles/roles/teacher/index.css"></style>