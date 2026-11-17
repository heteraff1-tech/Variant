<template>
  <div class="modal" @click.self="$emit('close')">
    
    <div class="modal-window animate__animated animate__zoomIn">
      <h2 class="heading-h2">Редактирование преподавателя</h2>

      <div class="teacher-info">
        <p class="teacher-name">
          {{ teacherData.last_name }} {{ teacherData.name }}
          {{ teacherData.patronymic }}
        </p>
      </div>

      <h3 class="heading-h3">Предметы и группы</h3>

      <TransitionGroup name="cards" tag="div" class="subjects-list">
        <div v-for="(subj, index) in subjects" :key="subj.id || index" class="subject-card">
          <div class="subject-header">
            <select v-model="subj.subject_id" class="subject-select">
              <option disabled value="">Выберите предмет</option>
              <option v-for="s in allSubjects" :key="s.id" :value="s.id">
                {{ s.title }}
              </option>
            </select>

            <button class="delete-btn" @click="removeSubject(index)">
              Удалить
            </button>
          </div>

          <div class="groups-block">
            <label v-for="g in allGroups" :key="g.id" class="checkbox-row">
              <input type="checkbox" :value="g.id" v-model="subj.group_ids" />
              <span>{{ g.title }}</span>
            </label>
          </div>
        </div>
      </TransitionGroup>

      <button class="add-subject-btn" @click="addSubject">
        + Добавить предмет
      </button>

      <div class="actions">
        <button class="cancel-btn" @click="$emit('close')">Отмена</button>
        <button class="save-btn" @click="save">Сохранить</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import api from "@/http-common.js";

const props = defineProps({
  teacher: Object,
  adminId: Number,
});

const emit = defineEmits(["close", "saved"]);

const teacherData = ref({});
const subjects = ref([]);

const allSubjects = ref([]);
const allGroups = ref([]);

// ======================
// Загружаем данные
// ======================
onMounted(async () => {
  const { data } = await api.get(
    `/admin/${props.adminId}/teacher/${props.teacher.id}/edit`
  );

  teacherData.value = data.teacher;

  // Загружаем предметы преподавателя
  subjects.value = data.subjects.map((s) => ({
    subject_id: s.id,
    group_ids: s.groups.map((g) => g.id),
  }));

  // Предметы и группы организации
  allSubjects.value = data.allSubjects;
  allGroups.value = data.allGroups;
});

// ======================
// Удалить предмет
// ======================
function removeSubject(index) {
  subjects.value.splice(index, 1);
}

// ======================
// Добавить предмет
// ======================
function addSubject() {
  subjects.value.push({
    subject_id: "",
    group_ids: [],
  });
}

// ======================
// Сохранить изменения
// ======================
async function save() {
  try {
    await api.put(`/admin/${props.adminId}/teacher/${props.teacher.id}`, {
      subjects: subjects.value,
    });

    alert("Данные преподавателя успешно обновлены.");

    emit("saved");
    emit("close");
  } catch (e) {
    alert("Ошибка при сохранении данных.");
    console.error(e);
  }

  emit("saved");
}
</script>

<style scoped>
/* 1. Анимация модалки и фона */
.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  transition: opacity 0.2s ease; /* Плавный фон */
}

.modal-window {
  --animate-duration: 0.2s; /* Скорость Animate.css */
  width: 520px;
  max-height: 80vh;
  overflow-y: auto;
  background: white;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 2. Анимация карточек (100мс) */
.subjects-list {
  display: flex;
  flex-direction: column;
}

.cards-enter-active,
.cards-leave-active {
  transition: all 0.1s ease; /* Ваша скорость 100мс */
}

.cards-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.cards-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Плавное перемещение карточек при добавлении новых */
.cards-move {
  transition: transform 0.2s ease;
}

/* 3. Стили элементов */
.teacher-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1f2937;
}

.subject-card {
  border: 1px solid #e5e7eb;
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.subject-select {
  flex: 1;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.groups-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.add-subject-btn {
  width: 100%;
  margin-top: 10px;
  background: #f3f4f6;
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed #d1d5db;
  color: #4b5563;
  transition: background 0.2s;
}

.add-subject-btn:hover {
  background: #e5e7eb;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.save-btn {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
}

.cancel-btn {
  background: #f3f4f6;
  padding: 10px 20px;
  border-radius: 10px;
}

.delete-btn {
  background: #fee2e2;
  padding: 6px 12px;
  color: #ef4444;
  border-radius: 8px;
  font-size: 13px;
}

/* 4. Логика закрытия (Transition) */
.v-leave-active {
  transition: opacity 0.2s ease;
}
.v-leave-active .modal-window {
  animation: zoomOut 0.2s forwards;
}
.v-leave-to {
  opacity: 0;
}
/* Когда карточка начинает исчезать */
.cards-leave-active {
  transition: all 0.2s ease;
  /* ВАЖНО: фиксируем элемент в пространстве на время анимации, 
     чтобы он не схлопывался мгновенно */
  position: absolute; 
  width: calc(100% - 56px); /* 56px — это сумма ваших padding (28+28) */
}

/* Класс для плавного перемещения оставшихся элементов */
.cards-move {
  transition: transform 0.2s ease;
}

/* Контейнер списка должен иметь position: relative для корректной работы absolute выше */
.subjects-list {
  display: flex;
  flex-direction: column;
  position: relative; 
}
</style>