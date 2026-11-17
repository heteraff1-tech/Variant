<template>
  <!-- Модалка управления предметами организации -->
  <UiModal
    :model-value="isOpen"
    title="Предметы организации"
    size="sm"
    @update:model-value="$emit('close')"
  >
    <div v-if="isLoadingSubjects" class="loading">
      <UiLoader text="Загружаем предметы..." />
    </div>

    <template v-else>
      <!-- Список предметов -->
      <TransitionGroup name="list" tag="div" class="subjects-list">
        <div
          v-for="(subject, index) in localSubjects"
          :key="subject.id ?? `new-${index}`"
          class="subject-row"
        >
          <UiInput
            v-model="subject.title"
            placeholder="Название предмета"
            class="subject-input"
          />
          <button class="remove-btn" @click="removeSubject(index)" title="Удалить">
            ✕
          </button>
        </div>
      </TransitionGroup>

      <button class="add-link" @click="addSubject">
        + Добавить предмет
      </button>
    </template>

    <!-- Футер -->
    <template #footer>
      <UiButton variant="ghost" @click="$emit('close')">Отмена</UiButton>
      <UiButton :disabled="isSavingSubjects" @click="saveSubjects()">
        {{ isSavingSubjects ? 'Сохранение...' : 'Сохранить' }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup>
import { UiModal, UiButton, UiInput, UiLoader } from '@/shared/ui';
import { useAdminSubjects } from '../model/useAdminSubjects';

defineProps({
  isOpen: { type: Boolean, required: true },
});

defineEmits(['close']);

const {
  localSubjects,
  isLoadingSubjects,
  isSavingSubjects,
  addSubject,
  removeSubject,
  saveSubjects,
} = useAdminSubjects();
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  padding: 30px;
}

.subjects-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  position: relative;
}

/* Анимации списка */
.list-enter-active,
.list-leave-active {
  transition: all 0.12s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.list-move {
  transition: transform 0.2s ease;
}

.subject-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-input {
  flex: 1;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #d1d5db;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.remove-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.add-link {
  display: inline-block;
  padding: 0;
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 4px;
  transition: color 0.15s;
}

.add-link:hover {
  color: #4f46e5;
}
</style>
