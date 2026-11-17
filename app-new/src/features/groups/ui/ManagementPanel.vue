<template>
  <!-- Боковая панель управления: очистка и миграция групп -->
  <div class="management-panel">
    <div class="mp__tabs">
      <button
        class="mp__tab"
        :class="{ 'mp__tab--active': activeTab === 'clear' }"
        @click="$emit('update:activeTab', 'clear')"
      >
        Очистка группы
      </button>
      <button
        class="mp__tab"
        :class="{ 'mp__tab--active': activeTab === 'migrate' }"
        @click="$emit('update:activeTab', 'migrate')"
      >
        Перенос студентов
      </button>
    </div>

    <!-- TAB 1: Очистка группы -->
    <div v-if="activeTab === 'clear'" class="mp__content">
      <p class="mp__description">
        Убрать всех студентов из выбранных групп
      </p>

      <div class="mp__rows">
        <div
          v-for="(item, index) in clearRows"
          :key="index"
          class="mp__row"
        >
          <select v-model="item.groupId" class="mp__select">
            <option :value="null">Выберите группу</option>
            <option
              v-for="g in allGroups"
              :key="g.id"
              :value="g.id"
            >
              {{ g.title }}
            </option>
          </select>
          <button class="mp__remove-btn" @click="$emit('remove-clear-row', index)">
            ✕
          </button>
        </div>
      </div>

      <button class="mp__add-link" @click="$emit('add-clear-row')">
        + Добавить группу
      </button>

      <div class="mp__actions">
        <UiButton variant="ghost" size="sm" @click="$emit('reset-clear')">
          Сбросить
        </UiButton>
        <UiButton size="sm" :disabled="isClearPending" @click="$emit('execute-clear')">
          {{ isClearPending ? 'Очистка...' : 'Выполнить очистку' }}
        </UiButton>
      </div>
    </div>

    <!-- TAB 2: Перенос студентов -->
    <div v-if="activeTab === 'migrate'" class="mp__content">
      <p class="mp__description">
        Перенести всех студентов из одной группы в другую (пустую)
      </p>

      <div class="mp__rows">
        <div
          v-for="(item, index) in migrateRows"
          :key="index"
          class="mp__migrate-row"
        >
          <select v-model="item.fromGroupId" class="mp__select">
            <option :value="null">Откуда</option>
            <option
              v-for="g in allGroups"
              :key="g.id"
              :value="g.id"
            >
              {{ g.title }}
            </option>
          </select>

          <span class="mp__arrow">→</span>

          <select v-model="item.toGroupId" class="mp__select">
            <option :value="null">Куда (только пустые)</option>
            <option
              v-for="g in emptyGroups"
              :key="g.id"
              :value="g.id"
            >
              {{ g.title }}
            </option>
          </select>

          <button class="mp__remove-btn" @click="$emit('remove-migrate-row', index)">
            ✕
          </button>
        </div>
      </div>

      <button class="mp__add-link" @click="$emit('add-migrate-row')">
        + Добавить миграцию
      </button>

      <div class="mp__actions">
        <UiButton variant="ghost" size="sm" @click="$emit('reset-migrate')">
          Сбросить
        </UiButton>
        <UiButton size="sm" :disabled="isMigratePending" @click="$emit('execute-migrate')">
          {{ isMigratePending ? 'Перенос...' : 'Выполнить перенос' }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UiButton } from '@/shared/ui';

defineProps({
  activeTab: { type: String, default: 'clear' },
  allGroups: { type: Array, default: () => [] },
  emptyGroups: { type: Array, default: () => [] },
  clearRows: { type: Array, default: () => [] },
  migrateRows: { type: Array, default: () => [] },
  isClearPending: { type: Boolean, default: false },
  isMigratePending: { type: Boolean, default: false },
});

defineEmits([
  'update:activeTab',
  'add-clear-row',
  'remove-clear-row',
  'reset-clear',
  'execute-clear',
  'add-migrate-row',
  'remove-migrate-row',
  'reset-migrate',
  'execute-migrate',
]);
</script>

<style scoped>
.management-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}

.mp__tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.mp__tab {
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.mp__tab:hover {
  background: #f9fafb;
  color: #374151;
}

.mp__tab--active {
  color: #667eea;
  background: #f5f3ff;
  border-bottom: 2px solid #667eea;
}

.mp__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mp__description {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

.mp__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mp__row,
.mp__migrate-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mp__select {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  outline: none;
  color: #374151;
}

.mp__select:focus {
  border-color: #667eea;
}

.mp__arrow {
  font-size: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.mp__remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #d1d5db;
  font-size: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.mp__remove-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.mp__add-link {
  background: none;
  border: none;
  color: #667eea;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  padding: 0;
  transition: color 0.15s;
}

.mp__add-link:hover {
  color: #4f46e5;
}

.mp__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
}
</style>
