<template>
  <!-- Модалка создания новой группы -->
  <UiModal
    :model-value="isOpen"
    title="Добавить группу"
    size="sm"
    @update:model-value="$emit('close')"
  >
    <div class="form">
      <div class="form-group">
        <label class="form-label">Название группы</label>
        <UiInput
          v-model="groupTitle"
          placeholder="Например: ИП1-21"
          maxlength="10"
          :class="{ 'input--error': !!errorMessage }"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Курс</label>
        <select v-model="selectedCourse" class="course-select">
          <option :value="null" disabled>Выберите курс</option>
          <option
            v-for="c in uniqueCourses"
            :key="c"
            :value="c"
          >
            {{ c }} курс
          </option>
        </select>
      </div>

      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="$emit('close')">Отмена</UiButton>
      <UiButton :disabled="isLoading" @click="handleSubmit">
        {{ isLoading ? 'Создание...' : 'Создать' }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useToast } from 'vue-toastification';
import { UiModal, UiButton, UiInput } from '@/shared/ui';
import httpClient from '@/shared/api/httpClient';
import { API_ROUTES } from '@/shared/api/apiRoutes';
import { useAuthStore } from '@/stores/authStore';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  courses: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'created']);

const authStore = useAuthStore();
const queryClient = useQueryClient();
const toast = useToast();

const groupTitle = ref('');
const selectedCourse = ref(null);
const errorMessage = ref('');

// Уникальные курсы из переданного массива, если нет — фоллбек
const uniqueCourses = computed(() => {
  if (!props.courses || props.courses.length === 0) return [1, 2, 3, 4];
  return [...new Set(props.courses)].sort((a, b) => a - b);
});

const { mutate: createGroup, isPending: isLoading } = useMutation({
  mutationFn: async () => {
    const { data } = await httpClient.post(
      API_ROUTES.admin.groupCreate(authStore.user?.id),
      { title: groupTitle.value.trim(), course: selectedCourse.value }
    );
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({
      queryKey: ['admin', authStore.user?.id, 'groups'],
    });
    toast.success('Группа создана');
    emit('created', data.group);
    emit('close');
    // Сброс
    groupTitle.value = '';
    selectedCourse.value = null;
    errorMessage.value = '';
  },
  onError: (e) => {
    errorMessage.value = e.response?.data?.message ?? 'Ошибка создания группы';
  },
});

function handleSubmit() {
  errorMessage.value = '';
  if (!groupTitle.value.trim()) {
    errorMessage.value = 'Введите название группы';
    return;
  }
  if (!selectedCourse.value) {
    errorMessage.value = 'Выберите курс';
    return;
  }
  createGroup();
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}

.course-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
  color: #374151;
  transition: border-color 0.15s;
}

.course-select:focus {
  border-color: #667eea;
}

.form-error {
  color: #ef4444;
  font-size: 13px;
  margin: 0;
}
</style>
