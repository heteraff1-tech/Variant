<template>
  <div class="groups-page">
    <!-- Шапка -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Группы и студенты</h1>
        <p class="page-subtitle">Управление составом групп</p>
      </div>

      <div class="page-header__actions">
        <!-- Фильтр по группе -->
        <UiSelect
          v-model="groupFilter"
          :options="groupOptions"
          placeholder="Все группы"
          class="filter-select"
        />

        <UiButton v-if="groupFilter" variant="ghost" size="sm" @click="resetFilters">
          Сбросить
        </UiButton>

        <!-- Кнопка добавить группу -->
        <UiButton @click="showAddGroupModal = true">
          + Добавить группу
        </UiButton>
      </div>
    </div>

    <!-- Основной контент: список групп + панель управления -->
    <div class="groups-layout">
      <!-- Список групп -->
      <div class="groups-content">
        <!-- Загрузка -->
        <div v-if="isLoading" class="state-block">
          <UiLoader text="Загружаем группы..." />
        </div>

        <!-- Ошибка -->
        <div v-else-if="isError" class="state-block">
          <p class="state-text">Не удалось загрузить данные</p>
          <UiButton variant="ghost" @click="refetch">Попробовать снова</UiButton>
        </div>

        <!-- Пусто -->
        <div v-else-if="filteredCourses.length === 0" class="state-block">
          <p class="state-text">Группы не найдены</p>
        </div>

        <!-- По курсам -->
        <div v-else>
          <div
            v-for="courseData in filteredCourses"
            :key="courseData.course"
            class="course-section"
          >
            <h2 class="course-title">
              {{
                courseData.course === 0 || courseData.course === null
                  ? 'Без курса'
                  : `${courseData.course} курс`
              }}
            </h2>

            <div class="groups-grid">
              <GroupCard
                v-for="group in courseData.groups"
                :key="group.id"
                :group="group"
                :all-groups="allGroups"
                :editing-student="editingStudent"
                @delete="confirmDeleteGroup"
                @toggle-edit="toggleStudentEdit"
                @move-student="handleMoveStudent"
                @remove-student="handleRemoveStudent"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Боковая панель управления -->
      <div class="management-col">
        <ManagementPanel
          v-model:active-tab="activeTab"
          :all-groups="allGroups"
          :empty-groups="emptyGroups"
          :clear-rows="clearRows"
          :migrate-rows="migrateRows"
          :is-clear-pending="isClearPending"
          :is-migrate-pending="isMigratePending"
          @add-clear-row="addClearRow"
          @remove-clear-row="removeClearRow"
          @reset-clear="resetClearRows"
          @execute-clear="handleExecuteClear"
          @add-migrate-row="addMigrateRow"
          @remove-migrate-row="removeMigrateRow"
          @reset-migrate="resetMigrateRows"
          @execute-migrate="handleExecuteMigrate"
        />
      </div>
    </div>

    <!-- Модалка создания группы -->
    <AddGroupModal
      :is-open="showAddGroupModal"
      :courses="allCourses"
      @close="showAddGroupModal = false"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { UiButton, UiSelect, UiLoader } from '@/shared/ui';
import GroupCard from '@/features/groups/ui/GroupCard.vue';
import ManagementPanel from '@/features/groups/ui/ManagementPanel.vue';
import AddGroupModal from '@/features/groups/ui/AddGroupModal.vue';
import { useAdminGroups } from '@/features/groups/model/useAdminGroups';

const {
  filteredCourses,
  allGroups,
  emptyGroups,
  groupOptions,
  isLoading,
  isError,
  refetch,
  groupFilter,
  resetFilters,
  editingStudent,
  toggleStudentEdit,
  handleMoveStudent,
  handleRemoveStudent,
  showAddGroupModal,
  confirmDeleteGroup,
  activeTab,
  clearRows,
  migrateRows,
  addClearRow,
  removeClearRow,
  resetClearRows,
  handleExecuteClear,
  isClearPending,
  addMigrateRow,
  removeMigrateRow,
  resetMigrateRows,
  handleExecuteMigrate,
  isMigratePending,
  courses,
} = useAdminGroups();

// Уникальные курсы для AddGroupModal
const allCourses = computed(() => {
  const set = new Set();
  courses.value.forEach((c) => {
    if (c.course !== 0 && c.course !== null) set.add(c.course);
  });
  return Array.from(set).sort((a, b) => a - b);
});
</script>

<style scoped>
.groups-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select {
  width: 200px;
}

/* ===== LAYOUT: контент + панель управления ===== */
.groups-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: flex-start;
}

@media (max-width: 1100px) {
  .groups-layout {
    grid-template-columns: 1fr;
  }
  .management-col {
    order: -1;
  }
}

/* ===== КУРС ===== */
.course-section {
  margin-bottom: 32px;
}

.course-title {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f3f4f6;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* ===== СОСТОЯНИЯ ===== */
.state-block {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #9ca3af;
}

.state-text {
  font-size: 16px;
}
</style>
