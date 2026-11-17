<template>
  <!-- Модалка редактирования преподавателя -->
  <UiModal
    :model-value="isOpen"
    title="Редактирование преподавателя"
    size="lg"
    @update:model-value="$emit('close')"
  >
    <!-- Загрузка -->
    <div v-if="isLoadingForm" class="edit-loading">
      <UiLoader text="Загружаем данные..." />
    </div>

    <template v-else>
      <!-- Имя преподавателя -->
      <div v-if="teacherInfo" class="teacher-name-block">

        <div>
          <h3 class="teacher-fullname">
            {{ teacherInfo.last_name }} {{ teacherInfo.name }} {{ teacherInfo.patronymic }}
          </h3>
          <p class="teacher-role-label">Преподаватель</p>
        </div>
      </div>

      <!-- Список назначений: предмет + группы -->
      <div class="subjects-section">
        <h4 class="section-title">Предметы и группы</h4>

        <TransitionGroup name="cards" tag="div" class="subjects-list">
          <div
            v-for="(subj, index) in formSubjects"
            :key="index"
            class="subject-card"
          >
            <!-- Выбор предмета -->
            <div class="subject-card__header">
              <select v-model="subj.subject_id" class="subject-select">
                <option value="" disabled>Выберите предмет</option>
                <option
                  v-for="s in allSubjects"
                  :key="s.id"
                  :value="s.id"
                >
                  {{ s.title }}
                </option>
              </select>
<button class="delete-btn" @click="$emit('remove-subject', index)">
  Удалить
</button>
            </div>

            <!-- Чекбоксы групп -->
            <div class="groups-grid">
              <label
                v-for="g in allGroups"
                :key="g.id"
                class="checkbox-row"
              >
                <input
                  type="checkbox"
                  :value="g.id"
                  v-model="subj.group_ids"
                />
                <span>{{ g.title }}</span>
              </label>
            </div>
          </div>
        </TransitionGroup>

        <!-- Кнопка добавить предмет -->
      <button class="add-subject-btn" @click="$emit('add-subject')">
        + Добавить предмет
      </button>
      </div>
    </template>

    <!-- Футер модалки -->
    <template #footer>
      <UiButton variant="ghost" @click="$emit('close')">Отмена</UiButton>
      <UiButton :disabled="isSaving || isLoadingForm" @click="$emit('save')">
        {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup>
import { UiModal, UiButton, UiLoader } from '@/shared/ui';
const props = defineProps({
  isOpen: { type: Boolean, required: true },
  teacherInfo: { type: Object, default: null },
  formSubjects: { type: Array, default: () => [] },
  allSubjects: { type: Array, default: () => [] },
  allGroups: { type: Array, default: () => [] },
  isLoadingForm: { type: Boolean, default: false },
  isSaving: { type: Boolean, default: false },
});
defineEmits(['close', 'add-subject', 'remove-subject', 'save']);
</script>

<style scoped>
.edit-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.teacher-name-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
}

.teacher-avatar {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  flex-shrink: 0;
}

.teacher-fullname {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.teacher-role-label {
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 14px;
}

.subjects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

/* Анимация добавления/удаления карточки */
.cards-enter-active,
.cards-leave-active {
  transition: all 0.15s ease;
}
.cards-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.cards-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
.cards-leave-active {
  position: absolute;
  width: 100%;
}
.cards-move {
  transition: transform 0.2s ease;
}

.subject-card {
  border: 1px solid #e5e7eb;
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
}

.subject-card__header {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.subject-select {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  color: #374151;
  outline: none;
  background: white;
}

.subject-select:focus {
  border-color: #667eea;
}

.delete-btn {
  padding: 6px 14px;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}

.delete-btn:hover {
  background: #fecaca;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.checkbox-row input[type='checkbox'] {
  accent-color: #667eea;
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.add-subject-btn {
  width: 100%;
  margin-top: 10px;
  padding: 11px;
  background: #f9fafb;
  border: 1.5px dashed #d1d5db;
  border-radius: 10px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.add-subject-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}
</style>
