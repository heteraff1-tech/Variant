<template>
  <div class="contant-app">
    <nav>
      <a href="">Преподаватели</a>
      <a href="" class="active">группы и студенты</a>
    </nav>
    <section class="content">
      <!-- Хедер с фильтрами и кнопкой добавления -->
      <header>
        <div class="filters">
          <div class="content-filters">
            <UiButton
              color="neutral"
              variant="secondary"
              size="l"
              @click="resetFilters"
              id="filter_button"
            >
              Сбросить фильтры
            </UiButton>
            <div class="select select--default">
              <select class="select__control" v-model="groupFilter">
                <option value="">Найти по группам</option>
                <option v-for="g in allGroups" :key="g.id" :value="g.id">
                  {{ g.title }}
                </option>
              </select>
              <span class="select__icon">▾</span>
            </div>
            <div class="select select--default">
              <select class="select__control" v-model="subjectFilter">
                <option value="">Найти по предмету</option>
                <option v-for="s in allSubjects" :key="s.id" :value="s.id">
                  {{ s.title }}
                </option>
              </select>
              <span class="select__icon">▾</span>
            </div>
          </div>
        </div>
        <UiButton @click="showAddGroupModal = true" id="btn"> Добавить группу </UiButton>
      </header>
      <!-- Основной список групп -->
      <div class="group-result">
        <div v-if="loading" class="loading">Загрузка...</div>
        <div v-else-if="filteredCourses.length === 0" class="empty-state">
          <p>Группы не найдены</p>
        </div>
        <div v-else v-for="courseData in filteredCourses" :key="courseData.course" class="course">
          <h2 class="heading-h2">
            {{ courseData.course === 0 ? 'Без курса' : `Курс ${courseData.course}` }}
          </h2>
          <div class="groups">
            <div v-for="group in courseData.groups" :key="group.id" class="group">
              <!-- Хедер группы -->
              <div class="healding-setting">
                <div class="group-texting">
                  <h3 class="heading-h3">{{ group.title }}</h3>
                  <span class="copy-cod body-b2">
                    Код группы: <a href="#" class="body-b2">{{ group.code }}</a>
                  </span>
                </div>
                <div class="icons">
                  <img src="@/assets/svg/delete.svg" alt="" @click="deleteGroup(group.id)" />
                </div>
              </div>
              <!-- Список студентов -->
              <div class="list">
                <div v-if="group.students.length === 0" class="empty-group">Нет студентов</div>
                <div v-for="student in group.students" :key="student.id" class="student">
                  <div class="student-contant">
                    <span class="body-b2">{{ student.fio }}</span>
                    <div class="icons">
                      <img
                        src="@/assets/svg/setting.svg"
                        alt="Редактировать"
                        @click="toggleStudentEdit(group.id, student.id)"
                        style="cursor: pointer"
                      />
                    </div>
                  </div>
                  <!-- Раскрывающаяся панель редактирования -->
                  <div
                    v-if="
                      editingStudent?.groupId === group.id &&
                      editingStudent?.studentId === student.id
                    "
                    class="student-setting"
                  >
                    <select v-model="editingStudent.newGroupId" class="select-field">
                      <option :value="null">Переместить в группу...</option>
                      <option
                        v-for="g in allGroups.filter(gr => gr.id !== group.id)"
                        :key="g.id"
                        :value="g.id"
                      >
                        {{ g.title }}
                      </option>
                    </select>
                    <UiButton
                      size="s"
                      variant="secondary"
                      @click="removeStudent(group.id, student.id)"
                    >
                      Убрать из группы
                    </UiButton>
                    <UiButton size="s" @click="moveStudentToGroup(student.id)">
                      Переместить
                    </UiButton>
                    <UiButton size="s" variant="secondary" @click="editingStudent = null">
                      Закрыть
                    </UiButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Панель управления миграцией -->
    <div class="management">
      <div class="tabs">
        <div class="tab" :class="{ active: activeTab === 'clear' }" @click="activeTab = 'clear'">
          Очистка группы
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'migrate' }"
          @click="activeTab = 'migrate'"
        >
          Перенос студентов
        </div>
      </div>
      <!-- TAB 1: Очистка группы -->
      <div v-if="activeTab === 'clear'" class="management-content">
        <h4 class="heading-h4">Очистка группы</h4>
        <div class="content-groups">
          <div v-for="(item, index) in clearRows" :key="index" class="list-group">
            <select v-model="item.groupId" class="selected">
              <option :value="null">Выберите группу</option>
              <option v-for="g in allGroups" :key="g.id" :value="g.id">
                {{ g.title }}
              </option>
            </select>
            <img
              src="@/assets/svg/delete.svg"
              alt=""
              @click="removeClearRow(index)"
              style="cursor: pointer"
            />
          </div>
          <span @click="addClearRow" style="cursor: pointer">+ Добавить группу</span>
          <div class="buttons-group">
            <UiButton size="m" variant="secondary" @click="resetClearRows"> Отменить </UiButton>
            <UiButton size="m" @click="executeClear">Сохранить</UiButton>
          </div>
        </div>
      </div>
      <!-- TAB 2: Перенос студентов -->
      <div v-if="activeTab === 'migrate'" class="management-content">
        <h4 class="heading-h4">Перенос студентов</h4>
        <div class="content-groups">
          <div v-for="(item, index) in migrateRows" :key="index" class="migration-row">
            <div class="migration-selects">
              <select v-model="item.fromGroupId" class="selected">
                <option :value="null">Откуда</option>
                <option v-for="g in allGroups" :key="g.id" :value="g.id">
                  {{ g.title }}
                </option>
              </select>
              <span class="arrow">→</span>
              <select v-model="item.toGroupId" class="selected">
                <option :value="null">Куда (только пустые)</option>
                <option v-for="g in emptyGroups" :key="g.id" :value="g.id">
                  {{ g.title }}
                </option>
              </select>
            </div>
            <img
              src="@/assets/svg/delete.svg"
              alt=""
              @click="removeMigrateRow(index)"
              style="cursor: pointer"
            />
          </div>
          <span @click="addMigrateRow" style="cursor: pointer">+ Добавить миграцию</span>
          <div class="buttons-group">
            <UiButton size="m" variant="secondary" @click="resetMigrateRows"> Отменить </UiButton>
            <UiButton size="m" @click="executeMigrate">Выполнить</UiButton>
          </div>
        </div>
      </div>
    </div>
    <!-- Модалка добавления группы -->
    <AddGroupModal
      v-if="showAddGroupModal"
      :adminId="adminId"
      :courses="allCourses"
      @close="showAddGroupModal = false"
      @created="onGroupCreated"
    />
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/http-common.js';
import UiButton from '@/components/ui/button.vue';
import AddGroupModal from './AddGroupModal.vue';
const route = useRoute();
const adminId = route.params.id;
// Основные данные
const courses = ref([]);
const allGroups = ref([]);
const allSubjects = ref([]);
const loading = ref(false);
const editingStudent = ref(null);

// Фильтры
const groupFilter = ref('');
const subjectFilter = ref('');
// Панель управления
const activeTab = ref('clear');
const clearRows = ref([{ groupId: null }]);
const migrateRows = ref([{ fromGroupId: null, toGroupId: null }]);
// Модалка
const showAddGroupModal = ref(false);
// Загрузка данных
onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  await loadGroups();
});
async function loadGroups() {
  loading.value = true;
  try {
    const { data } = await api.get(`/admin/${adminId}/groups`);
    courses.value = data.courses;
    allGroups.value = data.allGroups;
    allSubjects.value = data.allSubjects;
  } catch (e) {
    console.error('Ошибка загрузки групп:', e);
    alert('Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
}
// Все уникальные курсы для передачи в модалку
const allCourses = computed(() => {
  const coursesSet = new Set();
  courses.value.forEach(c => {
    if (c.course !== 0 && c.course !== null) {
      coursesSet.add(c.course);
    }
  });
  return Array.from(coursesSet).sort((a, b) => a - b);
});
// Пустые группы для миграции
const emptyGroups = computed(() => {
  const allGroupsFlat = courses.value.flatMap(c => c.groups);
  return allGroupsFlat
    .filter(g => g.students.length === 0)
    .map(g => ({ id: g.id, title: g.title }));
});
// Фильтрация групп
const filteredCourses = computed(() => {
  let result = courses.value;
  // Фильтр по группе
  if (groupFilter.value) {
    result = result
      .map(courseData => ({
        ...courseData,
        groups: courseData.groups.filter(g => g.id === groupFilter.value),
      }))
      .filter(c => c.groups.length > 0);
  }
  // TODO: Фильтр по предмету требует данных о связях групп с предметами
  // Пока оставляем заглушку
  if (subjectFilter.value) {
    // Здесь нужна логика фильтрации по предмету
    // Требует доп. данных от бэкенда
  }
  return result;
});
function resetFilters() {
  groupFilter.value = '';
  subjectFilter.value = '';
}
// Удаление группы
async function deleteGroup(groupId) {
  if (!confirm('Вы уверены, что хотите удалить группу? Все студенты будут отвязаны.')) {
    return;
  }
  try {
    await api.delete(`/admin/${adminId}/groups/${groupId}`);
    await loadGroups();
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления группы');
  }
}
// Создание группы
function onGroupCreated() {
  showAddGroupModal.value = false;
  loadGroups();
}
// Очистка групп
function addClearRow() {
  if (clearRows.value.length >= 20) {
    alert('Максимум 20 групп за раз');
    return;
  }
  clearRows.value.push({ groupId: null });
}
function removeClearRow(index) {
  clearRows.value.splice(index, 1);
  if (clearRows.value.length === 0) {
    clearRows.value = [{ groupId: null }];
  }
}
function resetClearRows() {
  clearRows.value = [{ groupId: null }];
}
async function executeClear() {
  const groupIds = clearRows.value.map(r => r.groupId).filter(id => id !== null);
  if (groupIds.length === 0) {
    alert('Выберите хотя бы одну группу');
    return;
  }
  if (!confirm(`Очистить ${groupIds.length} группу(ы)?`)) {
    return;
  }
  try {
    const { data } = await api.post(`/admin/${adminId}/groups/clear`, {
      groupIds,
    });
    alert(`Очищено студентов: ${data.cleared}`);
    resetClearRows();
    await loadGroups();
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка очистки групп');
  }
}
// Миграция студентов
function addMigrateRow() {
  if (migrateRows.value.length >= 10) {
    alert('Максимум 10 миграций за раз');
    return;
  }
  migrateRows.value.push({ fromGroupId: null, toGroupId: null });
}
function removeMigrateRow(index) {
  migrateRows.value.splice(index, 1);
  if (migrateRows.value.length === 0) {
    migrateRows.value = [{ fromGroupId: null, toGroupId: null }];
  }
}
function resetMigrateRows() {
  migrateRows.value = [{ fromGroupId: null, toGroupId: null }];
}
async function executeMigrate() {
  const migrations = migrateRows.value
    .filter(r => r.fromGroupId && r.toGroupId)
    .map(r => ({ fromGroupId: r.fromGroupId, toGroupId: r.toGroupId }));
  if (migrations.length === 0) {
    alert('Укажите группы для миграции');
    return;
  }
  if (!confirm(`Выполнить ${migrations.length} миграцию(й)?`)) {
    return;
  }
  try {
    const { data } = await api.post(`/admin/${adminId}/groups/migrate`, {
      migrations,
    });
    alert(
      `Миграция завершена!\n${data.results.map(r => `${r.from} → ${r.to}: ${r.migrated} студентов`).join('\n')}`
    );
    resetMigrateRows();
    await loadGroups();
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка миграции');
  }
}
function toggleStudentEdit(groupId, studentId) {
  if (editingStudent.value?.groupId === groupId && editingStudent.value?.studentId === studentId) {
    editingStudent.value = null;
  } else {
    editingStudent.value = {
      groupId,
      studentId,
      newGroupId: null,
    };
  }
}
async function moveStudentToGroup(studentId) {
  if (!editingStudent.value?.newGroupId) {
    alert('Выберите группу для перемещения');
    return;
  }
  try {
    await api.put(`/admin/${adminId}/students/${studentId}/move`, {
      toGroupId: editingStudent.value.newGroupId,
    });
    editingStudent.value = null;
    await loadGroups();
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка перемещения студента');
  }
}
async function removeStudent(groupId, studentId) {
  if (!confirm('Убрать студента из группы?')) {
    return;
  }
  try {
    await api.delete(`/admin/${adminId}/groups/${groupId}/students/${studentId}`);
    editingStudent.value = null;
    await loadGroups();
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка удаления студента');
  }
}
</script>
<style scoped src="@/assets/styles/roles/admin/students_groups.css">

</style>
