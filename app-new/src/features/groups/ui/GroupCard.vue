<template>
  <!-- Карточка одной группы со списком студентов -->
  <div class="group-card">
    <!-- Шапка группы -->
    <div class="group-card__header">
      <div class="group-card__title-block">
        <h3 class="group-card__title">{{ group.title }}</h3>
        <span class="group-card__code">
          Код: <strong>{{ group.code }}</strong>
        </span>
      </div>
      <button
        class="group-card__delete-btn"
        @click="$emit('delete', group.id)"
        title="Удалить группу"
      >
        Удалить
      </button>
    </div>

    <!-- Список студентов -->
    <div class="group-card__students">
      <div
        v-if="group.students.length === 0"
        class="group-card__empty"
      >
        Нет студентов
      </div>

      <div
        v-for="student in group.students"
        :key="student.id"
        class="student-item"
      >
        <!-- Строка студента -->
        <div
          class="student-item__row"
          @click="$emit('toggle-edit', group.id, student.id)"
        >
          <span class="student-item__fio">{{ student.fio }}</span>
        </div>

        <!-- Всплывающая панель редактирования студента -->
        <Teleport to="body">
          <Transition name="popup">
            <template
              v-if="
                editingStudent?.groupId === group.id &&
                editingStudent?.studentId === student.id
              "
            >
              <!-- Прозрачный оверлей для закрытия по клику вне -->
              <div
                class="edit-overlay"
                @click="$emit('toggle-edit', group.id, student.id)"
              />
            </template>
          </Transition>
        </Teleport>

        <!-- Попап позиционируется относительно student-item -->
        <Transition name="popup">
          <div
            v-if="
              editingStudent?.groupId === group.id &&
              editingStudent?.studentId === student.id
            "
            class="student-edit-panel"
            @click.stop
          >
            <select
              v-model="editingStudent.newGroupId"
              class="group-select"
            >
              <option :value="null">Переместить в группу</option>
              <option
                v-for="g in allGroups.filter((gr) => gr.id !== group.id)"
                :key="g.id"
                :value="g.id"
              >
                {{ g.title }}
              </option>
            </select>

          
            <div class="student-edit-panel__actions">
                            <UiButton
                size="sm"
                @click="$emit('move-student', student.id)"
              >
                Переместить
              </UiButton>
              <UiButton
                size="sm"
                variant="ghost"
                @click="$emit('remove-student', group.id, student.id)"
              >
                Убрать из группы
              </UiButton>

            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Счётчик студентов -->
    <div class="group-card__footer">
      <span class="group-card__count">
        {{ group.students.length }} студентов
      </span>
    </div>
  </div>
</template>

<script setup>
import { UiButton } from '@/shared/ui';

defineProps({
  group: { type: Object, required: true },
  allGroups: { type: Array, default: () => [] },
  editingStudent: { type: Object, default: null },
});

defineEmits(['delete', 'toggle-edit', 'move-student', 'remove-student']);
</script>

<style scoped>
.group-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s;
}

.group-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.group-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.group-card__title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.group-card__code {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 3px;
  display: block;
}

.group-card__delete-btn {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  color: #9ca3af;
}

.group-card__delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.group-card__students {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-card__empty {
  font-size: 13px;
  color: #d1d5db;
  text-align: center;
  padding: 12px;
}

.student-item {
  border-radius: 8px;
  /* Нужен для позиционирования попапа */
  position: relative;
}

.student-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s;
  cursor: pointer;
}

.student-item__row:hover {
  background: #f0f4ff;
}

.student-item__fio {
  font-size: 14px;
  color: #374151;
}

/* Прозрачный оверлей на весь экран для закрытия попапа */
.edit-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
}

/* Всплывающая панель редактирования */
.student-edit-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  width: 300px;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.group-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  outline: none;
  cursor: pointer;
}

.group-select:focus {
  border-color: #667eea;
}

.student-edit-panel__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.group-card__footer {
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}

.group-card__count {
  font-size: 12px;
  color: #9ca3af;
}

/* Анимация попапа */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
