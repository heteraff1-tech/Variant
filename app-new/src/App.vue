<template>
  <div class="app-container">
    <!-- Глобальный лоадер (если сессия восстанавливается) -->
    <UiLoader v-if="isInitializing" fullscreen text="Запуск системы..." />
    
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { UiLoader } from '@/shared/ui';

const authStore = useAuthStore();
const isInitializing = ref(true);

onMounted(async () => {
  // Инициализируем сессию (через sessionStorage токен)
  await authStore.init();
  isInitializing.value = false;
});
</script>

<style>
.app-container {
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: var(--background-page-filled);
}
</style>
