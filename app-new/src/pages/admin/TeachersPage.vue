<template>
  <div class="teachers-page">
    <!-- Шапка -->
    <div class="page-header">
      <div class="page-header__content">
        <h1 class="page-title">Преподаватели</h1>
        <p class="page-subtitle">Управление нагрузкой и группами</p>
      </div>

      <div class="page-header__actions">
        <!-- Поиск по ФИО -->
        <UiInput
          v-model="searchQuery"
          placeholder="Поиск по ФИО..."
          class="search-input"
        />

        <!-- Фильтр по предмету -->
        <UiSelect
          v-model="subjectFilter"
          :options="subjectOptions"
          placeholder="Предмет"
          class="filter-select"
        />

        <!-- Фильтр по группе -->
        <UiSelect
          v-model="groupFilter"
          :options="groupOptions"
          placeholder="Группа"
          class="filter-select"
        />

        <!-- Сброс фильтров -->
        <UiButton
          v-if="hasActiveFilters"
          variant="ghost"
          size="sm"
          @click="resetFilters"
        >
          Сбросить
        </UiButton>
      </div>
    </div>

    <!-- Кнопки управления -->
    <div class="actions-bar">
      <UiButton @click="openSubjectsModal">Предметы</UiButton>
    </div>

    <!-- Загрузка -->
    <div v-if="isLoading" class="state-block">
      <UiLoader size="lg" text="Загружаем список преподавателей..." />
    </div>

    <!-- Ошибка -->
    <div v-else-if="isError" class="state-block">
      <p class="state-text">Не удалось загрузить данные</p>
      <UiButton variant="ghost" @click="refetch">Попробовать снова</UiButton>
    </div>

    <!-- Пусто -->
    <div v-else-if="teachers.length === 0" class="state-block">
      <p class="state-text">Преподаватели не найдены</p>
    </div>

    <!-- Список карточек -->
    <div v-else class="teachers-grid">
      <TeacherCard
        v-for="teacher in teachers"
        :key="teacher.id"
        :teacher="teacher"
        @edit="openEdit"
      />
    </div>

    <!-- Модалка редактирования преподавателя -->
    <EditTeacherModal
      :is-open="isModalOpen"
      :teacher-info="teacherInfo"
      :form-subjects="formSubjects"
      :all-subjects="allSubjects"
      :all-groups="allGroups"
      :is-loading-form="isLoadingForm"
      :is-saving="isSaving"
      @close="close"
      @add-subject="addSubject"
      @remove-subject="removeSubject"
      @save="saveTeacher()"
    />

    <!-- Модалка предметов -->
    <SubjectsModal
      :is-open="isSubjectsModalOpen"
      @close="closeSubjectsModal"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { UiInput, UiButton, UiLoader, UiSelect } from '@/shared/ui';
import TeacherCard from '@/features/teachers/ui/TeachersCard.vue';
import EditTeacherModal from '@/features/teachers/ui/EditTeacherModal.vue';
import SubjectsModal from '@/features/teachers/ui/SubjectsModal.vue';

import { useTeachersList } from '@/features/teachers/model/useTeachersLists';
import { useTeacherForm } from '@/features/teachers/model/useTeacherForm';
import { useAdminSubjects } from '@/features/teachers/model/useAdminSubjects';

// Список + фильтры
const {
  teachers,
  rawTeachers,
  isLoading,
  isError,
  refetch,
  searchQuery,
  subjectFilter,
  groupFilter,
  resetFilters,
} = useTeachersList();

// Форма редактирования
const {
  isModalOpen,
  openEdit,
  close,
  teacherInfo,
  formSubjects,
  allSubjects,
  allGroups,
  isLoadingForm,
  isSaving,
  addSubject,
  removeSubject,
  saveTeacher,
} = useTeacherForm();
// Предметы организации
const {
  isSubjectsModalOpen,
  openSubjectsModal,
  closeSubjectsModal,
} = useAdminSubjects();

// Опции фильтров строим из СЫРОГО (нефильтрованного) списка
const subjectOptions = computed(() => {
  if (!rawTeachers.value) return [];
  const set = new Set();
  rawTeachers.value.forEach(t => t.subjects?.forEach(s => set.add(s.title)));
  return [...set].map(title => ({ label: title, value: title }));
});

const groupOptions = computed(() => {
  if (!rawTeachers.value) return [];
  const set = new Set();
  rawTeachers.value.forEach(t =>
    t.subjects?.forEach(s => s.groups?.forEach(g => set.add(g)))
  );
  return [...set].map(g => ({ label: g, value: g }));
});

const hasActiveFilters = computed(
  () => !!searchQuery.value || !!subjectFilter.value || !!groupFilter.value
);
</script>


<style scoped>
.teachers-page {
  padding: var(--padding-xl, 32px);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: var(--heading-size_h1, 28px);
  font-weight: 700;
  color: var(--foreground-default, #111827);
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

.page-subtitle {
  color: var(--foreground-muted, #6b7280);
  font-size: 14px;
  margin: 4px 0 0;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 240px;
}

.filter-select {
  width: 180px;
}

.actions-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.state-block {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--foreground-muted, #6b7280);
}

.state-text {
  font-size: 16px;
  color: #9ca3af;
}
</style>
