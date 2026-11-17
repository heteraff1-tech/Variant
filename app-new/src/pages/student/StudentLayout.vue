<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import api from '@/shared/api/httpClient';

const authStore = useAuthStore();
const route = useRoute();
const userId = computed(() => route.params.id);

// Модалка
const showModal = ref(false);
const groupCode = ref('');
const loading = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

function openModal() {
  showModal.value = true;
  groupCode.value = '';
  successMsg.value = '';
  errorMsg.value = '';
}

function closeModal() {
  showModal.value = false;
}

async function joinGroup() {
  if (!groupCode.value.trim()) {
    errorMsg.value = 'Введите код группы';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    const res = await api.post(`/student/${userId.value}/join-group`, {
      groupCode: groupCode.value.trim(),
    });
    successMsg.value = res.data.message || 'Вы вступили в группу!';
    groupCode.value = '';
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Ошибка при вступлении в группу';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div id="student-layout">
    <nav>
      <div class="info">
        <h5 class="heading-h4">{{ authStore.user?.login || 'Студент' }}</h5>
        <span class="description-d1">Студент</span>
      </div>
      <div class="menu">
        <router-link class="item" :to="`/student/${userId}/tests`">
          <span class="body-b2">Мои тесты</span>
        </router-link>
        <router-link class="item" :to="`/student/${userId}/journal`">
          <span class="body-b2">Дневник</span>
        </router-link>
        <button class="join-group-btn" @click="openModal">
          Войти в группу
        </button>
      </div>
      <div class="logout-section">
        <button class="logout-btn" @click="authStore.logout()">
          Выйти
        </button>
      </div>
    </nav>
    <div class="student-content">
      <router-view />
    </div>

    <!-- Модалка вступления в группу -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <h4 class="modal-title">Войти в группу</h4>
        <p class="modal-desc">Введите код группы, который выдал вам преподаватель или администратор.</p>

        <input
          v-model="groupCode"
          class="modal-input"
          type="text"
          placeholder="Код группы"
          @keyup.enter="joinGroup"
          :disabled="loading"
        />

        <p v-if="errorMsg" class="modal-error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="modal-success">{{ successMsg }}</p>

        <div class="modal-actions">
          <button class="modal-btn-cancel" @click="closeModal" :disabled="loading">Отмена</button>
          <button class="modal-btn-join" @click="joinGroup" :disabled="loading">
            {{ loading ? 'Вступление...' : 'Войти' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/styles/roles/student/index.css"></style>
