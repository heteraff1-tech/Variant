<template>
  <div class="modal" @click.self="$emit('close')">
    <div class="modal-window animate__animated animate__zoomIn">
      <h2 class="heading-h2">Добавить группу</h2>
      <div class="form-content">
        <div class="form-group">
          <label>Название группы</label>
          <input
            type="text"
            v-model="groupTitle"
            placeholder="Например: ИП1-21"
            maxlength="6"
            class="input-field"
          />
        </div>
        <div class="form-group">
          <label>Курс</label>
          <select v-model="selectedCourse" class="select-field">
            <option disabled :value="null">Выберите курс</option>
            <option v-for="c in uniqueCourses" :key="c" :value="c">{{ c }} курс</option>
          </select>
        </div>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
      <div class="actions">
        <button class="cancel-btn" @click="$emit('close')">Отмена</button>
        <button class="save-btn" @click="handleSubmit" :disabled="isLoading">
          {{ isLoading ? 'Создание...' : 'Создать' }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import api from '@/http-common.js';
const props = defineProps({
  adminId: Number,
  courses: Array, // массив курсов из родительского компонента
});
const emit = defineEmits(['close', 'created']);
const groupTitle = ref('');
const selectedCourse = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
// Уникальные курсы из переданного массива, отсортированные
const uniqueCourses = computed(() => {
  if (!props.courses || props.courses.length === 0) {
    return [1, 2, 3, 4]; // fallback если нет данных
  }
  const unique = [...new Set(props.courses.filter(c => c !== null))];
  return unique.sort((a, b) => a - b);
});
async function handleSubmit() {
  errorMessage.value = '';
  if (!groupTitle.value.trim()) {
    errorMessage.value = 'Введите название группы';
    return;
  }
  if (!selectedCourse.value) {
    errorMessage.value = 'Выберите курс';
    return;
  }
  isLoading.value = true;
  try {
    const { data } = await api.post(`/admin/${props.adminId}/groups`, {
      title: groupTitle.value.trim(),
      course: selectedCourse.value,
    });
    emit('created', data.group);
    emit('close');
  } catch (e) {
    errorMessage.value = e.response?.data?.message || 'Ошибка создания группы';
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}
</script>
<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.modal-window {
  --animate-duration: 0.2s;
  width: 400px;
  background: white;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 20px 0;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  font-size: 14px;
  color: #4b5563;
}
.input-field,
.select-field {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.input-field:focus,
.select-field:focus {
  border-color: #007bff;
}
.error-message {
  color: #ef4444;
  font-size: 14px;
  margin: 0;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.save-btn {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.cancel-btn {
  background: #f3f4f6;
  padding: 10px 20px;
  border-radius: 10px;
}
</style>
